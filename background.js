/*
 * EN: Manifest V3 service worker. It serializes capture start/stop, validates popup commands,
 *     mediates between the popup and offscreen audio graph, and persists status messages.
 * RU: Фоновый сервис MV3. Он сериализует запуск/остановку захвата, проверяет команды popup,
 *     связывает интерфейс с offscreen-аудиографом и сохраняет статусы.
 * UK: Фоновий сервіс MV3. Він серіалізує запуск/зупинку захоплення, перевіряє команди popup,
 *     з'єднує інтерфейс з offscreen-аудіографом і зберігає статуси.
 */
let currentCapturedTabId = null;
let offscreenSetupPromise = null;
let captureQueue = Promise.resolve();

// EN: Serialize all capture lifecycle transitions, including browser events, to prevent stale STOP/START races.
// RU: Сериализуем все переходы захвата, включая события браузера, чтобы старый STOP не прервал новый START.
// UK: Серіалізуємо всі переходи захоплення, включно з подіями браузера, щоб старий STOP не перервав новий START.
// All capture lifecycle transitions, including browser-generated tab events,
// must share one queue. Otherwise a delayed STOP from an old stream can stop a
// newer stream that has already started.
// EN: Serializes capture lifecycle tasks so delayed events cannot race newer starts.
// RU: Сериализует операции захвата, чтобы запоздавшие события не мешали новому запуску.
// UK: Серіалізує операції захоплення, щоб запізнілі події не заважали новому запуску.
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
async function applySavedAudioSettingsToOffscreen(tabId = currentCapturedTabId) {
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

  await sendToOffscreen({
    type: 'UPDATE_VOLUME',
    ...effective,
    muted: data.muted === true,
    bassManualOverride: data.autoGenreBassManualOverride === true,
    voiceManualOverride: data.autoGenreVoiceManualOverride === true
  });
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

// EN: Validates bounds and types of audio settings before they reach the audio graph.
// RU: Проверяет типы и допустимые диапазоны аудионастроек перед передачей в аудиограф.
// UK: Перевіряє типи й допустимі діапазони аудіоналаштувань перед передаванням до аудіографа.
function validAudioSettingsMessage(message) {
  return Number.isInteger(message.tabId) &&
    typeof message.volume === 'number' && Number.isFinite(message.volume) && message.volume >= 0 && message.volume <= 6 &&
    typeof message.muted === 'boolean' &&
    typeof message.bassBoostEnabled === 'boolean' &&
    Number.isInteger(message.bassBoostDb) && message.bassBoostDb >= 0 && message.bassBoostDb <= 12 &&
    typeof message.voiceBoostEnabled === 'boolean' &&
    Number.isInteger(message.voiceBoostDb) && message.voiceBoostDb >= 0 && message.voiceBoostDb <= 8 &&
    typeof message.peakLimiterEnabled === 'boolean' &&
    typeof message.nightModeEnabled === 'boolean' &&
    (message.bassManualOverride === undefined || typeof message.bassManualOverride === 'boolean') &&
    (message.voiceManualOverride === undefined || typeof message.voiceManualOverride === 'boolean');
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
  }).catch(() => {});

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
  if (result && result.success === false) {
    return { success: false, error: 'Audio processor rejected the settings.' };
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

    const allowedGenres = ["hiphop", "trap", "drill", "grime", "phonk", "wave", "lofi", "ambient", "newAge", "chillout", "pop", "dancePop", "kpop", "jpop", "indiePop", "hyperpop", "rock", "altRock", "hardRock", "postRock", "metal", "metalcore", "punk", "indie", "grunge", "emo", "shoegaze", "jazz", "blues", "funk", "soul", "rnb", "disco", "country", "folk", "bluegrass", "acoustic", "classical", "orchestral", "soundtrack", "gameMusic", "animeMusic", "opera", "electronic", "house", "deepHouse", "progressiveHouse", "techno", "trance", "dubstep", "drumBass", "jungle", "breakbeat", "electro", "hardstyle", "synthwave", "vaporwave", "tripHop", "garage", "reggae", "dancehall", "ska", "reggaeton", "salsa", "bachata", "cumbia", "afrobeats", "amapiano", "gospel", "latin", "bossaNova", "samba", "tango", "flamenco", "bollywood", "experimental", "audioBassHeavy", "audioElectronic", "audioAtmospheric", "audioVocal", "audioOther"];
    const allowedStates = ['disabled', 'waiting-capture', 'detected', 'detecting'];
    const persistedStatus = {
      enabled: message.enabled === true,
      active: message.active === true,
      genre: allowedGenres.includes(message.genre) ? message.genre : null,
      confidence: typeof message.confidence === 'number' && Number.isFinite(message.confidence)
        ? Math.max(0, Math.min(1, message.confidence)) : 0,
      source: message.source === 'title' || message.source === 'audio' ? message.source : null,
      trackId: typeof message.trackId === 'string' && message.trackId.length <= 280 ? message.trackId : '',
      trackTitle: typeof message.trackTitle === 'string' && message.trackTitle.length <= 500 ? message.trackTitle : '',
      bassBoostEnabled: allowedGenres.includes(message.genre) && typeof message.bassBoostEnabled === 'boolean' ? message.bassBoostEnabled : null,
      bassBoostDb: allowedGenres.includes(message.genre) && Number.isFinite(message.bassBoostDb) ? Math.max(0, Math.min(12, message.bassBoostDb)) : null,
      voiceBoostEnabled: allowedGenres.includes(message.genre) && typeof message.voiceBoostEnabled === 'boolean' ? message.voiceBoostEnabled : null,
      voiceBoostDb: allowedGenres.includes(message.genre) && Number.isFinite(message.voiceBoostDb) ? Math.max(0, Math.min(8, message.voiceBoostDb)) : null,
      volumeTrimDb: allowedGenres.includes(message.genre) && Number.isFinite(message.volumeTrimDb) ? Math.max(-2, Math.min(1, message.volumeTrimDb)) : null,
      bassManualOverride: message.bassManualOverride === true,
      voiceManualOverride: message.voiceManualOverride === true,
      state: allowedStates.includes(message.state) ? message.state : 'detecting',
      updatedAt: typeof message.updatedAt === 'number' && Number.isFinite(message.updatedAt)
        ? message.updatedAt : Date.now()
    };

    try {
      const storageArea = chrome.storage && chrome.storage.local;
      if (storageArea && typeof storageArea.set === 'function') {
        const savePromise = storageArea.set({ autoGenreStatus: persistedStatus });
        if (savePromise && typeof savePromise.catch === 'function') {
          savePromise.catch((error) => console.warn('Could not persist automatic genre status:', errorMessage(error)));
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

  if (message.type === 'AUTO_GENRE_SETTINGS') {
    if (typeof message.enabled !== 'boolean') {
      sendResponse({ success: false, error: 'Invalid auto genre setting.' });
      return false;
    }
    const resultPromise = captureQueue.then(async () => {
      await chrome.storage.local.set({ autoGenreEnabled: message.enabled });
      await reconcileCapturedTabState();
      if (Number.isInteger(currentCapturedTabId)) {
        const capturedTab = await chrome.tabs.get(currentCapturedTabId).catch(() => null);
        await sendToOffscreen({
          type: 'AUTO_GENRE_SETTINGS',
          enabled: message.enabled,
          title: capturedTab && typeof capturedTab.title === 'string' ? capturedTab.title.slice(0, 500) : '',
          trackId: capturedTab ? getTrackIdFromUrl(capturedTab.url) : ''
        });
      }
      return { success: true, enabled: message.enabled };
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
    // Persisted preferences are applied after a capture is established; don't open an offscreen document needlessly.
    if (currentCapturedTabId === null) {
      sendResponse({ success: true, deferred: true });
      return false;
    }
    sendToOffscreen({ type: 'VISUALIZER_SETTINGS', bandCount: message.bandCount, sampleIntervalMs }).then((result) => {
      sendResponse(result || { success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: errorMessage(error) });
    });
    return true;
  }

  if (message.type === 'VISUALIZER_CONTROL') {
    if (typeof message.enabled !== 'boolean' || (message.enabled && currentCapturedTabId === null)) {
      sendResponse({ success: false, error: 'No active capture for visualizer.' });
      return false;
    }
    sendToOffscreen({
      type: 'VISUALIZER_CONTROL',
      enabled: message.enabled
    }).then((result) => {
      sendResponse(result || { success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: errorMessage(error) });
    });
    return true;
  }

  if (message.type === 'UPDATE_BADGE') {
    const text = typeof message.text === 'string' ? message.text : '';
    const isValidBadge = text === '' || (/^\d{1,3}$/.test(text) && Number(text) >= 0 && Number(text) <= 600);
    if (!isValidBadge) {
      sendResponse({ success: false, error: 'Invalid badge value.' });
      return false;
    }
    chrome.action.setBadgeText({ text });

    if (text && Number.parseInt(text, 10) > 100) {
      chrome.action.setBadgeBackgroundColor({ color: '#f97316' });
      chrome.action.setBadgeTextColor({ color: '#ffffff' });
    } else {
      chrome.action.setBadgeBackgroundColor({ color: '#ffffff' });
      chrome.action.setBadgeTextColor({ color: '#000000' });
    }

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
      await sendToOffscreen({ type: 'STOP_CAPTURE' });
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

    // Wait until offscreen has stopped the old stream before asking Chrome for a new ID.
    await sendToOffscreen({ type: 'STOP_CAPTURE' });
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

    // Re-check the destination immediately before requesting a single-use stream ID.
    const [latestActiveTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!latestActiveTab || latestActiveTab.id !== tabId || !isSupportedCaptureUrl(latestActiveTab.url)) {
      throw new Error('Захват доступен только на YouTube и Spotify Web Player.');
    }

    // A stream ID is single-use and short-lived; create it immediately before forwarding it.
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
    const storedAutoGenre = await chrome.storage.local.get([
      'autoGenreEnabled', 'autoGenreBassManualOverride', 'autoGenreVoiceManualOverride'
    ]);
    const pageTrack = await chrome.tabs.sendMessage(tabId, { type: 'GET_MEDIA_TRACK_METADATA' }).catch(() => null);
    const sourceTitle = pageTrack && typeof pageTrack.title === 'string' && pageTrack.title.trim()
      ? pageTrack.title.slice(0, 500)
      : (typeof latestActiveTab.title === 'string' ? latestActiveTab.title.slice(0, 500) : '');
    const sourceTrackId = pageTrack && typeof pageTrack.trackId === 'string' && pageTrack.trackId.length <= 280
      ? pageTrack.trackId
      : getTrackIdFromUrl(latestActiveTab.url);
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
      await sendToOffscreen({ type: 'STOP_CAPTURE' });
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
