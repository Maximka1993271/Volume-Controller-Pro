/*
 * EN: Manifest V3 service worker. It serializes capture start/stop, validates popup commands,
 *     mediates between the popup and offscreen audio graph, and persists status messages.
 * RU: Фоновый сервис MV3. Он сериализует запуск/остановку захвата, проверяет команды popup,
 *     связывает интерфейс с offscreen-аудиографом и сохраняет статусы.
 * UK: Фоновий сервіс MV3. Він серіалізує запуск/зупинку захоплення, перевіряє команди popup,
 *     з'єднує інтерфейс з offscreen-аудіографом і зберігає статуси.
 */
importScripts('shared/validation.js');
try {
  importScripts('shared/genres.js');
} catch (error) {
  // Genre automation is optional: a missing/broken catalogue must not disable capture or volume controls.
  console.error('Automatic genre catalogue failed to load; genre status will be ignored:', error);
}
const backgroundGenreApi = typeof VCPGenres !== 'undefined' && VCPGenres && typeof VCPGenres === 'object'
  ? VCPGenres : null;
function isBackgroundGenreApiConsistent(api) {
  if (!api || !Array.isArray(api.catalog) || !Array.isArray(api.allowedGenreIds) ||
      !Array.isArray(api.allowedStates)) return false;
  const allowedFamilies = new Set([
    'hiphop', 'bassHeavy', 'pop', 'rock', 'electronic', 'atmosphere',
    'jazz', 'vocal', 'acoustic', 'classical', 'world', 'neutral'
  ]);
  const catalog = api.catalog;
  const allowedIds = api.allowedGenreIds;
  if (catalog.length !== allowedIds.length) return false;
  if (!catalog.every((item) => item && typeof item.id === 'string' && item.id.length > 0 &&
      typeof item.label === 'string' && allowedFamilies.has(item.family) &&
      Array.isArray(item.aliases) && item.aliases.every((alias) => typeof alias === 'string'))) return false;
  const catalogIdSet = new Set(catalog.map((item) => item.id));
  const allowedIdSet = new Set(allowedIds);
  if (catalogIdSet.size !== catalog.length || allowedIdSet.size !== allowedIds.length) return false;
  if (!Array.from(catalogIdSet).every((id) => allowedIdSet.has(id))) return false;
  const requiredStates = ['disabled', 'waiting-capture', 'detected', 'detecting'];
  return requiredStates.every((state) => api.allowedStates.includes(state)) &&
    new Set(api.allowedStates).size === api.allowedStates.length &&
    api.allowedStates.every((state) => typeof state === 'string');
}
const backgroundGenreApiIsConsistent = isBackgroundGenreApiConsistent(backgroundGenreApi);
if (!backgroundGenreApiIsConsistent) {
  console.error('Automatic genre catalogue is unavailable or inconsistent; capture and volume controls remain available.');
}
const allowedGenreIdSet = new Set(backgroundGenreApiIsConsistent ? backgroundGenreApi.allowedGenreIds : []);
const allowedGenreStateSet = new Set(backgroundGenreApiIsConsistent
  ? backgroundGenreApi.allowedStates
  : ['disabled', 'waiting-capture', 'detected', 'detecting']);

let currentCapturedTabId = null;
let offscreenSetupPromise = null;
/** @type {Promise<void>} */
let captureQueue = Promise.resolve();
let lastVolumeIndicatorWarningAt = 0;
let lastPersistedAutoGenreStatusSignature = '';
let autoGenreStatusPersistenceQueue = Promise.resolve();

// EN: Serialize all capture lifecycle transitions, including browser events, to prevent stale STOP/START races.
// RU: Сериализуем все переходы захвата, включая события браузера, чтобы старый STOP не прервал новый START.
// UK: Серіалізуємо всі переходи захоплення, включно з подіями браузера, щоб старий STOP не перервав новий START.
// All capture lifecycle transitions, including browser-generated tab events,
// must share one queue. Otherwise a delayed STOP from an old stream can stop a
// newer stream that has already started.
// EN: Serializes capture lifecycle tasks so delayed events cannot race newer starts.
// RU: Сериализует операции захвата, чтобы запоздавшие события не мешали новому запуску.
// UK: Серіалізує операції захоплення, щоб запізнілі події не заважали новому запуску.
/**
 * @template T
 * @param {() => Promise<T> | T} task
 * @returns {Promise<T>}
 */
function enqueueCaptureTask(task) {
  const resultPromise = captureQueue.then(task);
  captureQueue = resultPromise.then(() => undefined, () => undefined);
  return resultPromise;
}

// EN: Removes the optional page badge and safely handles tabs that no longer exist.
// RU: Удаляет необязательный индикатор на странице и учитывает закрытые или изменившиеся вкладки.
// UK: Видаляє необов’язковий індикатор на сторінці та враховує закриті або змінені вкладки.
async function hidePageIndicator(tabId) {
  if (!Number.isInteger(tabId)) return;
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'HIDE_INDICATOR' });
  } catch (_) {
    // The tab may have navigated, closed, or never received the optional script.
  }
}

// Persist the safe default for first installs and older profiles without this preference.
// Do not overwrite an explicit user choice when the extension is updated.
chrome.runtime.onStartup.addListener(() => {
  lastPersistedAutoGenreStatusSignature = '';
  chrome.storage.local.remove('autoGenreStatus').catch((error) => {
    console.debug('Could not clear stale automatic genre status on startup:', errorMessage(error));
  });
});

chrome.runtime.onInstalled.addListener(() => {
  // EN/RU/UK: Remove the obsolete preference from older builds; it no longer controls any UI.
  chrome.storage.local.remove('showCaptureTabCircle').catch(() => {});
  chrome.storage.local.get(['nightModeEnabled', 'rgbGlow', 'autoGenreEnabled'])
    .then((data) => {
      const defaults = {};
      if (typeof data.nightModeEnabled !== 'boolean') defaults.nightModeEnabled = false;
      // Default the new options to ON without overriding an explicit saved user choice.
      if (typeof data.rgbGlow !== 'boolean') defaults.rgbGlow = true;
      if (typeof data.autoGenreEnabled !== 'boolean') defaults.autoGenreEnabled = true;
      return Object.keys(defaults).length ? chrome.storage.local.set(defaults) : undefined;
    })
    .catch((error) => {
      console.warn('Could not initialize default preferences:', errorMessage(error));
    });
});

// One-time migration to the balanced "golden mean" EQ profile.
// Preserve non-default user choices; only replace missing or previous factory values.
// EN: Migrates older factory EQ defaults once without replacing deliberate user settings.
// RU: Однократно обновляет старые заводские значения эквалайзера, не перезаписывая пользовательские настройки.
// UK: Одноразово оновлює старі типові значення еквалайзера, не перезаписуючи налаштування користувача.
async function ensureBalancedSettingsProfile() {
  try {
    const data = await chrome.storage.local.get([
      'balancedSettingsProfileVersion',
      'bassBoostEnabled', 'bassBoostDb',
      'voiceBoostEnabled', 'voiceBoostDb'
    ]);
    if (data.balancedSettingsProfileVersion === 1) return;

    const usesPreviousFactoryProfile =
      (data.bassBoostEnabled === undefined || data.bassBoostEnabled === true) &&
      (data.voiceBoostEnabled === undefined || data.voiceBoostEnabled === true) &&
      (data.bassBoostDb === undefined || Number(data.bassBoostDb) === 6) &&
      (data.voiceBoostDb === undefined || Number(data.voiceBoostDb) === 3);

    const update = { balancedSettingsProfileVersion: 1 };
    if (usesPreviousFactoryProfile) {
      update.bassBoostDb = 4;
      update.voiceBoostDb = 2;
    }
    await chrome.storage.local.set(update);
  } catch (error) {
    // Settings remain usable with runtime fallbacks if storage is unavailable.
    console.warn('Could not migrate balanced EQ defaults:', errorMessage(error));
  }
}

// EN: Creates or reuses the offscreen document that owns the Web Audio graph.
// RU: Создаёт или повторно использует offscreen-документ, в котором работает Web Audio-граф.
// UK: Створює або повторно використовує offscreen-документ, у якому працює Web Audio-граф.
async function setupOffscreenDocument() {
  if (offscreenSetupPromise) return offscreenSetupPromise;

  offscreenSetupPromise = (async () => {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL('offscreen.html')]
    });

    if (existingContexts.length > 0) return;

    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Capture tab audio for volume control'
    });
  })();

  try {
    await offscreenSetupPromise;
  } finally {
    // Keep the promise only while creation is in flight. The offscreen document can
    // be closed independently of the service worker, so every later start must check
    // getContexts() again instead of trusting an already-fulfilled promise forever.
    offscreenSetupPromise = null;
  }
}

// EN: Routes a validated extension command to the offscreen audio document.
// RU: Передаёт проверенную команду из расширения в offscreen-аудиодокумент.
// UK: Передає перевірену команду з розширення до offscreen-аудіодокумента.
function sendToOffscreen(message) {
  return chrome.runtime.sendMessage({
    ...message,
    target: 'offscreen'
  });
}

// EN: Serializes automatic-genre status writes and retries after failed persistence.
// RU: Сериализует сохранение статуса автожанра и позволяет повторить запись после ошибки.
// UK: Серіалізує збереження статусу автожанру та дозволяє повторити запис після помилки.
function enqueueAutoGenreStatusPersistence(storageArea, statusSnapshot, persistenceSignature) {
  const snapshot = { ...statusSnapshot };
  autoGenreStatusPersistenceQueue = autoGenreStatusPersistenceQueue
    .catch(() => undefined)
    // Invoke storage.set inside the chain so both synchronous throws and rejected promises are handled.
    .then(() => storageArea.set({ autoGenreStatus: snapshot }))
    .catch((error) => {
      if (lastPersistedAutoGenreStatusSignature === persistenceSignature) {
        lastPersistedAutoGenreStatusSignature = '';
      }
      console.warn('Could not persist automatic genre status:', errorMessage(error));
    });
  return autoGenreStatusPersistenceQueue;
}

// MV3 service workers can be suspended and restarted while the offscreen
// document keeps processing the captured stream. Reconstruct this volatile
// state from the offscreen document instead of unnecessarily stopping audio.
// EN: Recovers the active capture tab ID after a Manifest V3 service-worker restart.
// RU: Восстанавливает ID вкладки захвата после перезапуска service worker Manifest V3.
// UK: Відновлює ID вкладки захоплення після перезапуску service worker Manifest V3.
async function reconcileCapturedTabState() {
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL('offscreen.html')]
    });
    if (!contexts.length) {
      currentCapturedTabId = null;
      return null;
    }

    const state = await sendToOffscreen({ type: 'GET_CAPTURE_STATUS' });
    currentCapturedTabId = state && state.success === true && state.active === true && Number.isInteger(state.tabId)
      ? state.tabId
      : null;
    return currentCapturedTabId;
  } catch (error) {
    // A missing/inaccessible offscreen document means there is no safely
    // confirmed active capture; later startup will create/reconcile it again.
    currentCapturedTabId = null;
    return null;
  }
}

// EN: Resolve the effective global or site-specific settings, then apply them to the active audio graph.
// RU: Выбирает общие или сайт-специфичные параметры и передаёт их активному аудиографу.
// UK: Обирає загальні або специфічні для сайту параметри й передає їх активному аудіографу.
async function applySavedAudioSettingsToOffscreen(tabId = currentCapturedTabId, modeOverrides = {}) {
  const data = await chrome.storage.local.get([
    'volume', 'muted', 'bassBoostEnabled', 'bassBoostDb', 'voiceBoostEnabled', 'voiceBoostDb',
    'peakLimiterEnabled', 'nightModeEnabled', 'youtubeAudioProfile', 'spotifyAudioProfile',
    'autoGenreBassManualOverride', 'autoGenreVoiceManualOverride'
  ]);
  const volume = data.volume !== undefined ? Number(data.volume) : 1;
  let effective = {
    volume: Number.isFinite(volume) ? Math.min(6, Math.max(0, volume)) : 1,
    bassBoostEnabled: data.bassBoostEnabled === undefined ? true : data.bassBoostEnabled === true,
    bassBoostDb: Number.isFinite(Number(data.bassBoostDb)) ? Math.min(12, Math.max(0, Number(data.bassBoostDb))) : 4,
    voiceBoostEnabled: data.voiceBoostEnabled === undefined ? true : data.voiceBoostEnabled === true,
    voiceBoostDb: Number.isFinite(Number(data.voiceBoostDb)) ? Math.min(8, Math.max(0, Number(data.voiceBoostDb))) : 2,
    peakLimiterEnabled: data.peakLimiterEnabled !== false,
    nightModeEnabled: data.nightModeEnabled === true
  };

  // Site profiles are optional and never trigger capture themselves. They only override
  // the general audio settings after the user explicitly started capture on that site.
  const capturedTab = Number.isInteger(tabId) ? await chrome.tabs.get(tabId).catch(() => null) : null;
  if (Number.isInteger(tabId) && !capturedTab) {
    console.debug('Site profile not applied: captured tab no longer exists', { tabId });
  }
  let profile = null;
  if (capturedTab && typeof capturedTab.url === 'string') {
    let host = '';
    try { host = new URL(capturedTab.url).hostname.toLowerCase(); } catch (_) {}
    if ((host === 'youtube.com' || host.endsWith('.youtube.com')) && data.youtubeAudioProfile && data.youtubeAudioProfile.enabled === true) {
      profile = data.youtubeAudioProfile;
    } else if (host === 'open.spotify.com' && data.spotifyAudioProfile && data.spotifyAudioProfile.enabled === true) {
      profile = data.spotifyAudioProfile;
    }
  }
  if (profile) {
    const profileVolume = Number(profile.volume);
    const profileBassDb = Number(profile.bassBoostDb);
    const profileVoiceDb = Number(profile.voiceBoostDb);
    if (Number.isFinite(profileVolume) && profileVolume >= 0 && profileVolume <= 6) effective.volume = profileVolume;
    if (typeof profile.bassBoostEnabled === 'boolean') effective.bassBoostEnabled = profile.bassBoostEnabled;
    if (Number.isFinite(profileBassDb) && profileBassDb >= 0 && profileBassDb <= 12) effective.bassBoostDb = profileBassDb;
    if (typeof profile.voiceBoostEnabled === 'boolean') effective.voiceBoostEnabled = profile.voiceBoostEnabled;
    if (Number.isFinite(profileVoiceDb) && profileVoiceDb >= 0 && profileVoiceDb <= 8) effective.voiceBoostDb = profileVoiceDb;
    if (typeof profile.peakLimiterEnabled === 'boolean') effective.peakLimiterEnabled = profile.peakLimiterEnabled;
    if (typeof profile.nightModeEnabled === 'boolean') effective.nightModeEnabled = profile.nightModeEnabled;
  }

  const result = await sendToOffscreen({
    type: 'UPDATE_VOLUME',
    ...effective,
    bassBoostDb: Math.round(effective.bassBoostDb),
    voiceBoostDb: Math.round(effective.voiceBoostDb),
    muted: data.muted === true,
    bassManualOverride: typeof modeOverrides.bassManualOverride === 'boolean'
      ? modeOverrides.bassManualOverride : data.autoGenreBassManualOverride === true,
    voiceManualOverride: typeof modeOverrides.voiceManualOverride === 'boolean'
      ? modeOverrides.voiceManualOverride : data.autoGenreVoiceManualOverride === true
  });
  if (!result || result.success !== true) {
    const reason = result && result.error ? result.error : 'No confirmation from audio processor.';
    console.warn('Offscreen audio settings were not applied:', reason);
    throw new Error(reason);
  }
  return true;
}

// EN: Waits for an earlier tab capture to release before another capture starts.
// RU: Ожидает освобождения предыдущего захвата вкладки перед следующим запуском.
// UK: Очікує завершення попереднього захоплення вкладки перед наступним запуском.
async function waitForTabRelease(tabId, maxWaitMs = 2500) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const capturedTabs = await chrome.tabCapture.getCapturedTabs();
    const busy = capturedTabs.some((tab) => {
      const isRelevantTab = tabId === null || tab.tabId === tabId;
      return isRelevantTab && tab.status !== 'stopped' && tab.status !== 'error';
    });

    if (!busy) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return false;
}

// EN: Extracts a stable track or video identity from supported media URLs.
// RU: Извлекает стабильный идентификатор трека или видео из поддерживаемого URL.
// UK: Витягує стабільний ідентифікатор треку або відео з підтримуваного URL.
function getTrackIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (!isSupportedCaptureUrl(url)) return '';
    const hostname = parsed.hostname.toLowerCase();
    if (hostname !== 'open.spotify.com') {
      const videoId = parsed.searchParams.get('v') || (parsed.pathname.match(/^\/(?:shorts|live|embed)\/([^/?#]+)/i) || [])[1];
      return videoId ? `youtube:${videoId.slice(0, 160)}` : '';
    }
    const match = parsed.pathname.match(/\/track\/([A-Za-z0-9]+)/);
    return match ? `spotify:${match[1]}` : '';
  } catch (_) {}
  return '';
}

// EN: Resolve track metadata without allowing a stale DOM snapshot to override the current URL's canonical ID.
// RU: Выбирает метаданные трека так, чтобы устаревший снимок DOM не подменял канонический ID из текущего URL.
// UK: Визначає метадані треку так, щоб застарілий знімок DOM не підміняв канонічний ID з поточного URL.
function resolveCaptureSourceMetadata(tab, pageTrack) {
  const urlTrackId = getTrackIdFromUrl(tab && tab.url);
  const pageTrackId = pageTrack && typeof pageTrack.trackId === 'string' && pageTrack.trackId.length <= 280
    ? pageTrack.trackId : '';
  const pageTrackMatchesUrl = !urlTrackId || !pageTrackId || pageTrackId === urlTrackId;
  const pageTitle = pageTrackMatchesUrl && pageTrack && typeof pageTrack.title === 'string'
    ? pageTrack.title.trim().slice(0, 500) : '';
  const tabTitle = tab && typeof tab.title === 'string' ? tab.title.trim().slice(0, 500) : '';
  return {
    sourceTitle: pageTitle || tabTitle,
    sourceTrackId: urlTrackId || pageTrackId
  };
}

// EN: Restrict capture to known HTTPS player hosts and real media routes; reject lookalike hosts, credentials, and custom ports.
// RU: Разрешаем захват только на известных HTTPS-хостах плееров и реальных маршрутах медиа; отклоняем похожие домены, учётные данные и нестандартные порты.
// UK: Дозволяємо захоплення лише на відомих HTTPS-хостах плеєрів і справжніх медіамаршрутах; відхиляємо схожі домени, облікові дані та нестандартні порти.
function isSupportedCaptureUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || (parsed.port && parsed.port !== '443')) return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'open.spotify.com') return true;

    // Explicit allowlist is safer than accepting every arbitrary *.youtube.com subdomain.
    const allowedYouTubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);
    if (!allowedYouTubeHosts.has(host)) return false;
    const validVideoId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{6,20}$/.test(value);
    if (parsed.pathname === '/watch') return validVideoId(parsed.searchParams.get('v'));
    const routeMatch = parsed.pathname.match(/^\/(shorts|live|embed)\/([^/?#]+)\/?$/i);
    return Boolean(routeMatch && validVideoId(routeMatch[2]));
  } catch {
    return false;
  }
}

// EN: Return the supported media platform only after full capture URL validation.
// RU: Возвращает платформу только после полной проверки URL для захвата.
// UK: Повертає платформу лише після повної перевірки URL для захоплення.
function getSupportedCapturePlatform(url) {
  if (!isSupportedCaptureUrl(url)) return '';
  try {
    return new URL(url).hostname.toLowerCase() === 'open.spotify.com' ? 'spotify' : 'youtube';
  } catch (_) {
    return '';
  }
}

// EN: Checks that a command comes from this extension’s own popup document.
// RU: Проверяет, что команда пришла из собственного popup-документа расширения.
// UK: Перевіряє, що команда надійшла з власного popup-документа розширення.
function isTrustedPopupSender(sender) {
  return Boolean(sender && sender.id === chrome.runtime.id &&
    sender.url === chrome.runtime.getURL('popup.html'));
}

// Shared with offscreen.js through shared/validation.js.
function validAudioSettingsMessage(message) {
  return VCPValidation.isValidAudioSettingsMessage(message, { requireTabId: true });
}

// EN: Applies a validated volume/EQ command to the active offscreen audio graph.
// RU: Применяет проверенную команду громкости и эквалайзера к активному аудиографу.
// UK: Застосовує перевірену команду гучності й еквалайзера до активного аудіографа.
async function handleVolumeUpdate(message) {
  await reconcileCapturedTabState();
  if (!validAudioSettingsMessage(message) || message.tabId !== currentCapturedTabId) {
    return { success: false, error: 'Invalid or inactive tab audio request.' };
  }

  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!activeTab || activeTab.id !== message.tabId || !isSupportedCaptureUrl(activeTab.url)) {
    return { success: false, error: 'Volume changes are limited to the active captured tab.' };
  }

  // The page indicator is optional; failure to message the page must not affect audio.
  chrome.tabs.sendMessage(message.tabId, {
    type: 'SET_VOLUME',
    volume: message.volume,
    muted: message.muted
  }).catch((error) => {
    // The floating indicator is optional; keep audio control working but leave a
    // rate-limited diagnostic when the content script is missing after navigation.
    const now = Date.now();
    if (now - lastVolumeIndicatorWarningAt >= 5000) {
      lastVolumeIndicatorWarningAt = now;
      console.debug('Page volume indicator is unavailable; audio processing remains active:', errorMessage(error));
    }
  });

  const result = await sendToOffscreen({
    type: 'UPDATE_VOLUME',
    volume: message.volume,
    muted: message.muted,
    bassBoostEnabled: message.bassBoostEnabled,
    bassBoostDb: message.bassBoostDb,
    voiceBoostEnabled: message.voiceBoostEnabled,
    voiceBoostDb: message.voiceBoostDb,
    peakLimiterEnabled: message.peakLimiterEnabled,
    nightModeEnabled: message.nightModeEnabled,
    bassManualOverride: message.bassManualOverride === true,
    voiceManualOverride: message.voiceManualOverride === true
  });
  if (!result || result.success !== true) {
    const detail = result && typeof result.error === 'string' ? result.error : 'No acknowledgement from the audio processor.';
    console.warn('Audio processor did not confirm volume/EQ settings:', detail);
    return { success: false, error: detail };
  }
  return { success: true };
}

// EN: Message router: offscreen status is accepted from the offscreen document; user commands only from popup.html.
// RU: Маршрутизатор сообщений: статус аудио принимается от offscreen, пользовательские команды — только от popup.html.
// UK: Маршрутизатор повідомлень: статус аудіо приймається від offscreen, команди користувача — лише від popup.html.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') return;

  // The offscreen document publishes genre-analysis status; persist it here
  // instead of depending on chrome.storage being exposed in the offscreen context.
  // Accept only messages originating from this extension's exact offscreen URL.
  if (message.type === 'AUTO_GENRE_STATUS') {
    const offscreenUrl = chrome.runtime.getURL('offscreen.html');
    const trustedOffscreen = Boolean(sender && sender.id === chrome.runtime.id &&
      (sender.url === offscreenUrl || sender.documentUrl === offscreenUrl));
    if (!trustedOffscreen) return;
    if (message.target !== 'popup') return;

    const validGenre = allowedGenreIdSet.has(message.genre);
    const persistedStatus = {
      enabled: message.enabled === true,
      active: message.active === true,
      genre: validGenre ? message.genre : null,
      confidence: typeof message.confidence === 'number' && Number.isFinite(message.confidence)
        ? Math.max(0, Math.min(1, message.confidence)) : 0,
      source: message.source === 'title' || message.source === 'audio' ? message.source : null,
      trackId: typeof message.trackId === 'string' && message.trackId.length <= 280 ? message.trackId : '',
      trackTitle: typeof message.trackTitle === 'string' && message.trackTitle.length <= 500 ? message.trackTitle : '',
      bassBoostEnabled: validGenre && typeof message.bassBoostEnabled === 'boolean' ? message.bassBoostEnabled : null,
      bassBoostDb: validGenre && Number.isFinite(message.bassBoostDb) ? Math.max(0, Math.min(12, message.bassBoostDb)) : null,
      voiceBoostEnabled: validGenre && typeof message.voiceBoostEnabled === 'boolean' ? message.voiceBoostEnabled : null,
      voiceBoostDb: validGenre && Number.isFinite(message.voiceBoostDb) ? Math.max(0, Math.min(8, message.voiceBoostDb)) : null,
      volumeTrimDb: validGenre && Number.isFinite(message.volumeTrimDb) ? Math.max(-2, Math.min(1, message.volumeTrimDb)) : null,
      bassManualOverride: message.bassManualOverride === true,
      voiceManualOverride: message.voiceManualOverride === true,
      state: allowedGenreStateSet.has(message.state) ? message.state : 'detecting',
      updatedAt: typeof message.updatedAt === 'number' && Number.isFinite(message.updatedAt)
        ? message.updatedAt : Date.now()
    };

    try {
      const storageArea = chrome.storage && chrome.storage.local;
      if (storageArea && typeof storageArea.set === 'function') {
        // Confidence can fluctuate on every analysis pass. Persist only material
        // status changes and confidence changes of at least 0.1 to avoid excess I/O.
        persistedStatus.confidence = Math.round(persistedStatus.confidence * 10) / 10;
        const persistenceSnapshot = { ...persistedStatus };
        delete persistenceSnapshot.updatedAt;
        const persistenceSignature = JSON.stringify(persistenceSnapshot);
        if (persistenceSignature !== lastPersistedAutoGenreStatusSignature) {
          lastPersistedAutoGenreStatusSignature = persistenceSignature;
          // Serialize writes so a slow older track cannot overwrite a newer status.
          enqueueAutoGenreStatusPersistence(storageArea, persistedStatus, persistenceSignature);
        }
      } else {
        console.warn('Storage API unavailable while persisting automatic genre status.');
      }
    } catch (error) {
      console.warn('Could not persist automatic genre status:', errorMessage(error));
    }
    return false;
  }

  // Track metadata comes only from our top-frame content script and only affects
  // the tab that the extension is already capturing. It cannot start/stop capture.
  if (message.type === 'MEDIA_TRACK_CHANGED') {
    const senderUrl = sender && typeof sender.url === 'string' ? sender.url : '';
    const senderPlatform = getSupportedCapturePlatform(senderUrl);
    const validTrackId = typeof message.trackId === 'string' && message.trackId.length > 0 && message.trackId.length <= 280 &&
      (message.trackId.startsWith('youtube:') || message.trackId.startsWith('spotify:'));
    const trustedContentSender = Boolean(sender && sender.id === chrome.runtime.id &&
      Number.isInteger(sender.tab && sender.tab.id) && (sender.frameId === undefined || sender.frameId === 0) &&
      senderPlatform && (message.platform === 'youtube' || message.platform === 'spotify') && message.platform === senderPlatform);
    if (!trustedContentSender || typeof message.title !== 'string' || message.title.length > 500 || !validTrackId ||
        (message.platform === 'youtube' && !message.trackId.startsWith('youtube:')) ||
        (message.platform === 'spotify' && !message.trackId.startsWith('spotify:'))) return false;
    const tabId = sender.tab.id;
    const task = enqueueCaptureTask(async () => {
      await reconcileCapturedTabState();
      if (currentCapturedTabId !== tabId) return;
      const capturedTab = await chrome.tabs.get(tabId).catch(() => null);
      if (!capturedTab || getSupportedCapturePlatform(capturedTab.url) !== message.platform) return;
      // Reject delayed metadata from a previous YouTube video if navigation happened while this message queued.
      const currentUrlTrackId = getTrackIdFromUrl(capturedTab.url);
      if (currentUrlTrackId && currentUrlTrackId !== message.trackId) return;
      await sendToOffscreen({
        type: 'SET_SOURCE_METADATA',
        title: message.title.trim().slice(0, 500),
        trackId: message.trackId.slice(0, 280)
      });
    });
    task.catch((error) => console.warn('Could not sync track metadata:', errorMessage(error)));
    return false;
  }

  // Only the extension popup may issue commands. Webpage content scripts and
  // other extension contexts cannot start/stop capture or change global audio state.
  if (!isTrustedPopupSender(sender)) return;

  if (message.type === 'EQ_MODE_SETTINGS') {
    if (!['bass', 'voice'].includes(message.kind) || typeof message.enabled !== 'boolean') {
      sendResponse({ success: false, error: 'Invalid Bass/Voice AUTO mode setting.' });
      return false;
    }
    const isBass = message.kind === 'bass';
    const key = isBass ? 'autoGenreBassManualOverride' : 'autoGenreVoiceManualOverride';
    const manualOverride = message.enabled !== true;
    const resultPromise = captureQueue.then(async () => {
      let storagePersisted = true;
      try {
        await chrome.storage.local.set({
          [key]: manualOverride,
          genreParameterModeVersion: 1
        });
      } catch (storageError) {
        storagePersisted = false;
        console.warn('Could not persist per-effect AUTO mode; applying the current session value:', errorMessage(storageError));
      }

      await reconcileCapturedTabState();
      const applied = Number.isInteger(currentCapturedTabId);
      if (applied) {
        await applySavedAudioSettingsToOffscreen(currentCapturedTabId, isBass
          ? { bassManualOverride: manualOverride }
          : { voiceManualOverride: manualOverride });
      }
      return { success: true, kind: message.kind, enabled: message.enabled, storagePersisted, applied };
    });
    captureQueue = resultPromise.then(() => undefined, () => undefined);
    resultPromise.then(
      (result) => sendResponse(result),
      (error) => {
        console.warn('Could not apply per-effect AUTO mode:', errorMessage(error));
        sendResponse({ success: false, error: errorMessage(error) });
      }
    );
    return true;
  }

  if (message.type === 'AUTO_GENRE_SETTINGS') {
    if (typeof message.enabled !== 'boolean') {
      sendResponse({ success: false, error: 'Invalid auto genre setting.' });
      return false;
    }
    const resultPromise = captureQueue.then(async () => {
      let storagePersisted = true;
      try {
        await chrome.storage.local.set({ autoGenreEnabled: message.enabled });
      } catch (storageError) {
        storagePersisted = false;
        console.warn('Could not persist automatic genre setting; applying it for the current session:', errorMessage(storageError));
      }
      await reconcileCapturedTabState();
      if (Number.isInteger(currentCapturedTabId)) {
        const capturedTab = await chrome.tabs.get(currentCapturedTabId).catch(() => null);
        const offscreenResult = await sendToOffscreen({
          type: 'AUTO_GENRE_SETTINGS',
          enabled: message.enabled,
          title: capturedTab && typeof capturedTab.title === 'string' ? capturedTab.title.slice(0, 500) : '',
          trackId: capturedTab ? getTrackIdFromUrl(capturedTab.url) : ''
        });
        if (!offscreenResult || offscreenResult.success !== true) {
          const rejectionReason = offscreenResult && offscreenResult.error
            ? offscreenResult.error : 'Offscreen document did not apply automatic genre settings.';
          console.warn('Offscreen rejected automatic genre settings:', rejectionReason);
          throw new Error(rejectionReason);
        }
      }
      return { success: true, enabled: message.enabled, storagePersisted };
    });
    captureQueue = resultPromise.then(() => undefined, () => undefined);
    resultPromise.then(
      (result) => sendResponse(result),
      (error) => sendResponse({ success: false, error: errorMessage(error) })
    );
    return true;
  }

  if (message.type === 'GET_CAPTURE_STATUS') {
    const resultPromise = captureQueue.then(async () => {
      await reconcileCapturedTabState();
      // If this tab changed to a restricted/non-player URL, don't leave a stale
      // stream running. URL may be hidden for an inactive tab without extra host permissions.
      if (Number.isInteger(currentCapturedTabId)) {
        const capturedTab = await chrome.tabs.get(currentCapturedTabId).catch(() => null);
        if (capturedTab && typeof capturedTab.url === 'string' && !isSupportedCaptureUrl(capturedTab.url)) {
          await handleStopCapture();
        }
      }
      return { success: true, active: Number.isInteger(currentCapturedTabId), tabId: currentCapturedTabId };
    });
    captureQueue = resultPromise.then(() => undefined, () => undefined);
    resultPromise.then(
      (result) => sendResponse(result),
      (error) => sendResponse({ success: false, error: errorMessage(error), active: false, tabId: null })
    );
    return true;
  }

  if (message.type === 'STOP_CAPTURE') {
    const resultPromise = captureQueue.then(() => handleStopCapture());
    captureQueue = resultPromise.then(() => undefined, () => undefined);
    resultPromise.then(
      (result) => sendResponse(result),
      (error) => sendResponse({ success: false, error: errorMessage(error) })
    );
    return true;
  }

  if (message.type === 'START_CAPTURE') {
    // Serialize start/stop transitions so fast popup reopenings cannot race.
    const resultPromise = captureQueue.then(() => handleStartCapture(message.tabId));
    captureQueue = resultPromise.then(() => undefined, () => undefined);

    resultPromise.then(
      (result) => sendResponse(result),
      (error) => sendResponse({ success: false, error: errorMessage(error) })
    );
    return true;
  }

  if (message.type === 'SET_VOLUME') {
    // Serialize setting changes against capture transitions to avoid startup races.
    const resultPromise = captureQueue.then(() => handleVolumeUpdate(message));
    captureQueue = resultPromise.then(() => undefined, () => undefined);
    resultPromise.then(
      (result) => sendResponse(result),
      (error) => {
        console.warn('Could not update offscreen volume:', errorMessage(error));
        sendResponse({ success: false, error: 'Audio processor is unavailable.' });
      }
    );
    return true;
  }

  if (message.type === 'VISUALIZER_SETTINGS') {
    const allowedBandCounts = [24, 36, 48, 64, 96];
    const allowedSampleIntervals = [33, 66, 200];
    const sampleIntervalMs = message.sampleIntervalMs === undefined ? 66 : message.sampleIntervalMs;
    if (!allowedBandCounts.includes(message.bandCount) || !allowedSampleIntervals.includes(sampleIntervalMs)) {
      sendResponse({ success: false, error: 'Invalid visualizer settings.' });
      return false;
    }
    const resultPromise = enqueueCaptureTask(async () => {
      await reconcileCapturedTabState();
      if (!Number.isInteger(currentCapturedTabId)) return { success: true, deferred: true };
      const result = await sendToOffscreen({ type: 'VISUALIZER_SETTINGS', bandCount: message.bandCount, sampleIntervalMs });
      if (!result || result.success !== true) {
        throw new Error(result && result.error ? result.error : 'Offscreen did not confirm visualizer settings.');
      }
      return result;
    });
    resultPromise.then(
      (result) => sendResponse(result),
      (error) => sendResponse({ success: false, error: errorMessage(error) })
    );
    return true;
  }

  if (message.type === 'VISUALIZER_CONTROL') {
    if (typeof message.enabled !== 'boolean') {
      sendResponse({ success: false, error: 'Invalid visualizer control.' });
      return false;
    }
    const resultPromise = enqueueCaptureTask(async () => {
      await reconcileCapturedTabState();
      if (message.enabled && !Number.isInteger(currentCapturedTabId)) {
        return { success: false, error: 'No active capture for visualizer.' };
      }
      if (!Number.isInteger(currentCapturedTabId) && !message.enabled) return { success: true, deferred: true };
      const result = await sendToOffscreen({ type: 'VISUALIZER_CONTROL', enabled: message.enabled });
      if (!result || result.success !== true) {
        throw new Error(result && result.error ? result.error : 'Offscreen did not confirm visualizer state.');
      }
      return result;
    });
    resultPromise.then(
      (result) => sendResponse(result),
      (error) => sendResponse({ success: false, error: errorMessage(error) })
    );
    return true;
  }

  if (message.type === 'UPDATE_BADGE') {
    const text = typeof message.text === 'string' ? message.text : '';
    const isValidBadge = text === '' || (/^\d{1,3}$/.test(text) && Number(text) >= 0 && Number(text) <= 600);
    if (!isValidBadge) {
      sendResponse({ success: false, error: 'Invalid badge value.' });
      return false;
    }
    const isBoostBadge = Boolean(text && Number.parseInt(text, 10) > 100);
    const backgroundColor = isBoostBadge ? '#f97316' : '#ffffff';
    const textColor = isBoostBadge ? '#ffffff' : '#000000';
    Promise.all([
      chrome.action.setBadgeText({ text }),
      chrome.action.setBadgeBackgroundColor({ color: backgroundColor }),
      chrome.action.setBadgeTextColor({ color: textColor })
    ]).catch((error) => {
      console.debug('Could not update extension badge:', errorMessage(error));
    });

    sendResponse({ success: true });
    return false;
  }
});

// EN: Stop the current stream, release the offscreen graph and clean up the owning tab's indicator.
// RU: Останавливает текущий поток, освобождает offscreen-аудиограф и очищает индикатор исходной вкладки.
// UK: Зупиняє поточний потік, звільняє offscreen-аудіограф і прибирає індикатор вихідної вкладки.
async function handleStopCapture() {
  // Keep the last known owner before reconciliation: offscreen may already have
  // cleared its tab ID after an ended track, but that page still needs UI/timer cleanup.
  const previouslyKnownTabId = currentCapturedTabId;
  await reconcileCapturedTabState();
  const stoppedTabId = Number.isInteger(currentCapturedTabId) ? currentCapturedTabId : previouslyKnownTabId;
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL('offscreen.html')]
    });
    if (contexts.length > 0) {
      await sendToOffscreen({ type: 'VISUALIZER_CONTROL', enabled: false }).catch((error) => {
        console.debug('Could not disable visualizer before stopping capture:', errorMessage(error));
      });
      const stopResult = await sendToOffscreen({ type: 'STOP_CAPTURE' });
      if (!stopResult || stopResult.success !== true) {
        throw new Error(stopResult && stopResult.error ? stopResult.error : 'Offscreen-документ не подтвердил остановку захвата.');
      }
    }
    currentCapturedTabId = null;
    await hidePageIndicator(stoppedTabId);
    return { success: true, tabId: stoppedTabId, active: false };
  } catch (error) {
    currentCapturedTabId = null;
    await hidePageIndicator(stoppedTabId);
    console.warn('Could not stop tab audio capture:', errorMessage(error));
    return { success: false, tabId: stoppedTabId, active: false, error: errorMessage(error) };
  }
}

// EN: Start only after explicit popup action, active-tab confirmation, URL validation and stream-release checks.
// RU: Запускает захват только после ручной команды, проверки активной вкладки/URL и освобождения старого потока.
// UK: Запускає захоплення лише після ручної команди, перевірки активної вкладки/URL і звільнення старого потоку.
async function handleStartCapture(tabId) {
  if (!Number.isInteger(tabId)) {
    return { success: false, error: 'Не удалось определить активную вкладку.' };
  }

  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!activeTab || activeTab.id !== tabId) {
    return { success: false, error: 'Запуск разрешён только для текущей активной вкладки.' };
  }
  if (!isSupportedCaptureUrl(activeTab.url)) {
    return { success: false, error: 'Захват доступен только на YouTube и Spotify Web Player.' };
  }

  await reconcileCapturedTabState();
  await ensureBalancedSettingsProfile();

  if (currentCapturedTabId === tabId) {
    try {
      // Reapply settings on popup reopen, including defaults migrated in this version.
      await applySavedAudioSettingsToOffscreen(tabId);
      return { success: true, tabId, alreadyCaptured: true };
    } catch (error) {
      return { success: false, error: errorMessage(error) };
    }
  }

  try {
    await setupOffscreenDocument();

    const previousTabId = currentCapturedTabId;

    // Wait for offscreen cleanup to finish before requesting a new single-use stream ID.
    const stopResult = await sendToOffscreen({ type: 'STOP_CAPTURE' });
    if (!stopResult || stopResult.success !== true) {
      throw new Error(stopResult && stopResult.error ? stopResult.error : 'Offscreen-документ не подтвердил остановку предыдущего захвата.');
    }
    currentCapturedTabId = null;
    // A capture handoff must also stop the old tab's metadata polling and remove
    // its floating indicator; otherwise an idle content-script timer can live on.
    if (Number.isInteger(previousTabId) && previousTabId !== tabId) {
      await hidePageIndicator(previousTabId);
    }

    const previousReleased = await waitForTabRelease(previousTabId);
    if (!previousReleased) {
      throw new Error('Браузер не освободил предыдущий аудиопоток. Повторите запуск захвата.');
    }

    if (previousTabId !== tabId) {
      const targetReleased = await waitForTabRelease(tabId);
      if (!targetReleased) {
        throw new Error('Эта вкладка уже захватывается другим процессом. Остановите другой захват и повторите попытку.');
      }
    }

    // Resolve storage and page metadata before creating the single-use stream ID.
    // Chrome expires an unused tabCapture stream ID after a few seconds, so no
    // storage/content-script requests may sit between ID creation and consumption.
    const storedAutoGenre = await chrome.storage.local.get([
      'autoGenreEnabled', 'autoGenreBassManualOverride', 'autoGenreVoiceManualOverride'
    ]);
    const pageTrack = await chrome.tabs.sendMessage(tabId, { type: 'GET_MEDIA_TRACK_METADATA' }).catch(() => null);

    // The tab may have navigated or lost activeTab permission while metadata was read.
    // Revalidate immediately before requesting the one-time stream ID.
    const [captureActiveTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const captureTab = await chrome.tabs.get(tabId).catch(() => null);
    if (!captureActiveTab || captureActiveTab.id !== tabId || !captureTab ||
        !isSupportedCaptureUrl(captureTab.url) ||
        getSupportedCapturePlatform(captureTab.url) !== getSupportedCapturePlatform(captureActiveTab.url)) {
      throw new Error('The active tab changed or is no longer supported before audio capture started.');
    }

    const { sourceTitle, sourceTrackId } = resolveCaptureSourceMetadata(captureTab, pageTrack);

    // Create the ID only after all awaited preparation, then consume it immediately.
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
    const captureResult = await sendToOffscreen({
      type: 'START_CAPTURE',
      streamId,
      tabId,
      sourceTitle,
      sourceTrackId,
      autoGenreEnabled: storedAutoGenre.autoGenreEnabled !== false,
      bassManualOverride: storedAutoGenre.autoGenreBassManualOverride === true,
      voiceManualOverride: storedAutoGenre.autoGenreVoiceManualOverride === true
    });

    if (!captureResult || !captureResult.success) {
      const detail = captureResult && captureResult.error
        ? captureResult.error
        : 'Offscreen-документ не подтвердил запуск захвата.';
      throw new Error(detail);
    }

    currentCapturedTabId = tabId;

    // Apply the latest saved EQ and volume values after starting the stream.
    await applySavedAudioSettingsToOffscreen(tabId);
    const latestTrackMetadata = await chrome.tabs.sendMessage(tabId, { type: 'GET_MEDIA_TRACK_METADATA' }).catch(() => null);
    if (latestTrackMetadata && typeof latestTrackMetadata.title === 'string' &&
        typeof latestTrackMetadata.trackId === 'string' && latestTrackMetadata.trackId.length <= 280) {
      await sendToOffscreen({
        type: 'SET_SOURCE_METADATA',
        title: latestTrackMetadata.title.slice(0, 500),
        trackId: latestTrackMetadata.trackId
      }).catch((error) => {
        console.debug('Could not refresh source metadata after capture startup:', errorMessage(error));
      });
    }

    return { success: true, tabId };
  } catch (error) {
    // Complete cleanup before releasing captureQueue. An un-awaited STOP here
    // could otherwise arrive after the next START and stop that newer stream.
    currentCapturedTabId = null;
    try {
      const cleanupResult = await sendToOffscreen({ type: 'STOP_CAPTURE' });
      if (!cleanupResult || cleanupResult.success !== true) {
        console.warn('Offscreen did not confirm cleanup after failed capture startup:',
          cleanupResult && cleanupResult.error ? cleanupResult.error : 'No STOP_CAPTURE confirmation.');
      }
    } catch (cleanupError) {
      console.warn('Could not clean up failed capture startup:', errorMessage(cleanupError));
    }
    // Capture setup can fail after content.js has started its metadata timer; always clean that up too.
    // Захват может не запуститься после внедрения content.js; в любом случае останавливаем таймер метаданных.
    // Захоплення може не запуститися після впровадження content.js; у будь-якому разі зупиняємо таймер метаданих.
    await hidePageIndicator(tabId);
    const detail = errorMessage(error);
    console.error('Capture failed:', detail, error);
    return { success: false, error: detail };
  }
}

// EN: Returns a useful, safe text representation of an unknown error value.
// RU: Преобразует ошибку в понятное и безопасное текстовое сообщение.
// UK: Перетворює помилку на зрозуміле й безпечне текстове повідомлення.
function errorMessage(error) {
  if (error && typeof error.message === 'string' && error.message.trim()) {
    const name = typeof error.name === 'string' ? error.name : '';
    return name && name !== 'Error' ? `${name}: ${error.message}` : error.message;
  }
  return String(error || 'Неизвестная ошибка');
}

// EN: Browser-event handlers refresh track metadata and stop capture if the captured tab leaves supported sites.
// RU: Обработчики событий браузера обновляют метаданные трека и останавливают захват при уходе со страницы-плеера.
// UK: Обробники подій браузера оновлюють метадані треку й зупиняють захоплення, якщо вкладка залишає сторінку плеєра.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const changedUrl = typeof changeInfo.url === 'string' ? changeInfo.url : null;
  const changedTitle = typeof changeInfo.title === 'string' ? changeInfo.title : null;
  if (changedTitle) {
    const titleTask = enqueueCaptureTask(async () => {
      await reconcileCapturedTabState();
      if (currentCapturedTabId === tabId) {
        const trackId = getTrackIdFromUrl((tab && tab.url) || changedUrl || '');
        await sendToOffscreen({
          type: 'SET_SOURCE_METADATA',
          title: changedTitle.slice(0, 500),
          ...(trackId ? { trackId } : {})
        }).catch((error) => {
          console.debug('Could not update source metadata after tab title change:', errorMessage(error));
        });
      }
    });
    titleTask.catch((error) => console.warn('Auto-genre source title update failed:', errorMessage(error)));
  }

  if (changeInfo.status === 'complete') {
    const reloadTask = enqueueCaptureTask(async () => {
      await reconcileCapturedTabState();
      const urlToCheck = (tab && tab.url) || changedUrl || '';
      if (currentCapturedTabId !== tabId || !isSupportedCaptureUrl(urlToCheck)) return;
      try {
        // EN: Probe the existing content script first. Reinjection is only needed when no listener answers;
        //     content.js is re-entrant as a second line of defence against overlapping lifecycle events.
        // RU: Сначала проверяем уже работающий content script. Повторное внедрение нужно только без ответа слушателя;
        //     сам content.js также безопасен при повторном запуске на случай гонки событий.
        // UK: Спочатку перевіряємо вже активний content script. Повторне впровадження потрібне лише без відповіді слухача;
        //     сам content.js також безпечний для повторного запуску на випадок гонки подій.
        let metadata = null;
        let hasContentScript = false;
        try {
          metadata = await chrome.tabs.sendMessage(tabId, { type: 'GET_MEDIA_TRACK_METADATA' });
          hasContentScript = true;
        } catch (_) {
          hasContentScript = false;
        }
        if (!hasContentScript) {
          await chrome.scripting.insertCSS({ target: { tabId }, files: ['styles.css'] }).catch(() => {});
          await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
          metadata = await chrome.tabs.sendMessage(tabId, { type: 'GET_MEDIA_TRACK_METADATA' }).catch(() => null);
        }
        if (metadata && typeof metadata.title === 'string' && typeof metadata.trackId === 'string') {
          await sendToOffscreen({ type: 'SET_SOURCE_METADATA', title: metadata.title.slice(0, 500), trackId: metadata.trackId.slice(0, 280) });
        }
      } catch (error) {
        console.debug('Track watcher reinjection skipped:', errorMessage(error));
      }
    });
    reloadTask.catch((error) => console.warn('Could not refresh track watcher after navigation:', errorMessage(error)));
  }

  if (!changedUrl) return;
  const resultPromise = enqueueCaptureTask(async () => {
    await reconcileCapturedTabState();
    const urlToCheck = typeof tab.url === 'string' ? tab.url : changedUrl;
    if (currentCapturedTabId === tabId && !isSupportedCaptureUrl(urlToCheck)) {
      await handleStopCapture();
    }
  });
  resultPromise.catch((error) => console.warn('Capture navigation guard failed:', errorMessage(error)));
});

chrome.tabs.onRemoved.addListener((tabId) => {
  // Serialize the event with START/STOP and check ownership only when the task
  // reaches the head of the queue. A closing old tab must not stop a new tab.
  const resultPromise = enqueueCaptureTask(async () => {
    const capturedTabId = await reconcileCapturedTabState();
    if (capturedTabId === tabId) await handleStopCapture();
  });
  resultPromise.catch((error) => console.warn('Capture cleanup after tab close failed:', errorMessage(error)));
});

chrome.tabCapture.onStatusChanged.addListener((info) => {
  if (info.status !== 'stopped' && info.status !== 'error') return;

  const resultPromise = enqueueCaptureTask(async () => {
    // Reconcile from the offscreen document instead of trusting the volatile
    // worker variable or the event's arrival order.
    const capturedTabId = await reconcileCapturedTabState();
    if (capturedTabId !== info.tabId) {
      // Offscreen can observe an ended track and clear its own tab ID before this
      // browser event runs. Clean up only the event's old tab, never the current stream.
      await hidePageIndicator(info.tabId);
      return;
    }

    // A late STOPPED event from a previous stream for this same tab can arrive
    // after a replacement stream has started. Preserve the replacement if Chrome
    // still reports an active capture for the tab.
    let capturedTabs = [];
    try {
      capturedTabs = await chrome.tabCapture.getCapturedTabs();
    } catch (_) {
      // If the API cannot confirm a live replacement, release our own stream.
    }
    const hasLiveCaptureForTab = capturedTabs.some((tab) =>
      tab.tabId === info.tabId && tab.status !== 'stopped' && tab.status !== 'error'
    );
    if (hasLiveCaptureForTab) return;

    await handleStopCapture();
  });
  resultPromise.catch((error) => console.warn('Capture status cleanup failed:', errorMessage(error)));
});
