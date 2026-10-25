/*
 * EN: Content script. It renders the optional page volume badge and reads only media title/track identity for synchronization.
 * RU: Контент-скрипт. Он показывает необязательный индикатор громкости и читает только название/ID трека для синхронизации.
 * UK: Контент-скрипт. Він показує необов'язковий індикатор гучності та читає лише назву/ID треку для синхронізації.
 */

(function vcpContentScriptMain() {
  'use strict';

  // EN: Clean up only the obsolete green dot from older builds; this version never renders it.
  // RU: Удаляем только устаревший зелёный кружок прошлых сборок; эта версия его не создаёт.
  // UK: Видаляємо лише застарілий зелений кружок попередніх збірок; ця версія його не створює.
  try { document.getElementById('vc-capture-circle')?.remove(); } catch (_) {}

/*
 * EN: Cache extension identity while the isolated world is alive. After an extension reload,
 *     existing page scripts may outlive the extension context; API access must then fail closed.
 * RU: Сохраняем идентификатор расширения, пока контекст активен. После перезагрузки расширения
 *     скрипт на уже открытой странице может остаться без контекста, поэтому вызовы API нужно безопасно прекращать.
 * UK: Зберігаємо ідентифікатор розширення, поки контекст активний. Після перезавантаження розширення
 *     скрипт на вже відкритій сторінці може залишитися без контексту, тому виклики API потрібно безпечно зупиняти.
 */
let vcpExtensionContextActive = true;
let vcpExtensionId = '';
let vcpBackgroundUrl = '';
const vcpContextCleanupCallbacks = new Set();

try {
  const runtime = globalThis.chrome && globalThis.chrome.runtime;
  vcpExtensionId = runtime && runtime.id ? runtime.id : '';
  vcpBackgroundUrl = runtime && typeof runtime.getURL === 'function' ? runtime.getURL('background.js') : '';
  if (!vcpExtensionId || !vcpBackgroundUrl) vcpExtensionContextActive = false;
} catch (_) {
  vcpExtensionContextActive = false;
}

// EN: Distinguish context invalidation from ordinary messaging errors such as no receiver.
// RU: Отличаем уничтожение контекста от обычных ошибок отправки, например отсутствия получателя.
// UK: Відрізняємо втрату контексту від звичайних помилок надсилання, наприклад відсутності одержувача.
function vcpIsContextInvalidated(error) {
  const text = String((error && error.message) || error || '');
  return /extension context invalidated|context invalidated|extension context.*invalid/i.test(text);
}

// EN: Run local cleanup once the browser invalidates this extension context, and stop future polling.
// RU: Один раз очищаем локальные индикаторы и таймеры, когда браузер уничтожает контекст расширения.
// UK: Один раз очищуємо локальні індикатори й таймери, коли браузер знищує контекст розширення.
function vcpMarkContextInvalidated() {
  if (!vcpExtensionContextActive) return;
  vcpExtensionContextActive = false;
  for (const cleanup of Array.from(vcpContextCleanupCallbacks)) {
    try { cleanup(); } catch (_) {}
  }
  vcpContextCleanupCallbacks.clear();
  try {
    window.volumeControllerInjected = false;
    window.volumeControllerTrackWatcherInjected = false;
  } catch (_) {}
}

// EN: Register cleanup for local DOM/timer resources owned by this script.
// RU: Регистрируем очистку DOM-элементов и таймеров, которыми владеет этот скрипт.
// UK: Реєструємо очищення DOM-елементів і таймерів, якими володіє цей скрипт.
function vcpRegisterContextCleanup(cleanup) {
  if (typeof cleanup !== 'function') return;
  if (!vcpExtensionContextActive) {
    try { cleanup(); } catch (_) {}
    return;
  }
  vcpContextCleanupCallbacks.add(cleanup);
}

// EN: Periodically probe the extension context inside a guarded block so a stale tab can stop its watcher without throwing.
// RU: Периодически проверяем контекст внутри try/catch, чтобы старая вкладка останавливала watcher без исключений.
// UK: Періодично перевіряємо контекст усередині try/catch, щоб стара вкладка зупиняла watcher без винятків.
function vcpCheckExtensionContext() {
  if (!vcpExtensionContextActive) return false;
  try {
    const runtime = globalThis.chrome && globalThis.chrome.runtime;
    if (!runtime || !runtime.id || runtime.id !== vcpExtensionId ||
        typeof runtime.getURL !== 'function' || runtime.getURL('background.js') !== vcpBackgroundUrl) {
      vcpMarkContextInvalidated();
      return false;
    }
    return true;
  } catch (_) {
    // Any runtime access failure in this probe means this injected context is no longer usable.
    vcpMarkContextInvalidated();
    return false;
  }
}

// EN: Send a runtime message only while the extension context is valid; suppress stale-world errors safely.
// RU: Отправляем сообщение только при действующем контексте; ошибки устаревшего контекста обрабатываем безопасно.
// UK: Надсилаємо повідомлення лише за активного контексту; помилки застарілого контексту обробляємо безпечно.
function vcpSafeSendMessage(message, onContextLost) {
  if (!vcpExtensionContextActive) {
    if (typeof onContextLost === 'function') { try { onContextLost(); } catch (_) {} }
    return null;
  }
  try {
    const runtime = globalThis.chrome && globalThis.chrome.runtime;
    if (!runtime || !runtime.id || typeof runtime.sendMessage !== 'function') {
      vcpMarkContextInvalidated();
      if (typeof onContextLost === 'function') { try { onContextLost(); } catch (_) {} }
      return null;
    }
    const pending = runtime.sendMessage(message);
    if (pending && typeof pending.catch === 'function') {
      pending.catch((error) => {
        if (!vcpIsContextInvalidated(error)) return;
        vcpMarkContextInvalidated();
        if (typeof onContextLost === 'function') { try { onContextLost(); } catch (_) {} }
      });
    }
    return pending;
  } catch (error) {
    if (vcpIsContextInvalidated(error) || /context invalidated/i.test(String(error))) {
      vcpMarkContextInvalidated();
      if (typeof onContextLost === 'function') { try { onContextLost(); } catch (_) {} }
    }
    return null;
  }
}

// EN: Compare the sender with cached identity; never call getURL() from a possibly stale listener.
// RU: Сверяем отправителя с кэшированными данными и не вызываем getURL() внутри устаревшего обработчика.
// UK: Зіставляємо відправника з кешованими даними й не викликаємо getURL() у застарілому обробнику.
function vcpIsTrustedBackgroundSender(sender) {
  return vcpExtensionContextActive && Boolean(sender && sender.id === vcpExtensionId && sender.url === vcpBackgroundUrl);
}

// EN: Repeated executeScript() calls reuse the same isolated world. Dispose the previous
//     controller before registering listeners/timers again, and keep the file re-entrant.
// RU: Повторные executeScript() используют тот же изолированный мир. Очищаем предыдущий
//     контроллер перед повторной регистрацией обработчиков и таймеров.
// UK: Повторні executeScript() використовують той самий ізольований світ. Очищуємо попередній
//     контролер перед повторною реєстрацією обробників і таймерів.
try {
  const previousController = window.__vcpContentScriptController;
  if (previousController && typeof previousController.dispose === 'function') {
    try { previousController.dispose(); } catch (_) {}
  }
} catch (_) {}

// A legacy instance (pre-singleton build) may leave these flags and the old badge behind.
// Стара версія без singleton-маркера могла залишити прапорці та індикатор на сторінці.
try {
  window.volumeControllerInjected = false;
  window.volumeControllerTrackWatcherInjected = false;
  document.getElementById('vc-floating-indicator')?.remove();
} catch (_) {}

if (vcpExtensionContextActive) {
  window.__vcpContentScriptController = { dispose: vcpMarkContextInvalidated };
  vcpRegisterContextCleanup(() => {
    try {
      if (window.__vcpContentScriptController &&
          window.__vcpContentScriptController.dispose === vcpMarkContextInvalidated) {
        delete window.__vcpContentScriptController;
      }
    } catch (_) {}
  });
}

// The offscreen document is the single audio-processing path for tab capture.
// This content script only displays the floating volume indicator; it must not
// create another Web Audio gain chain, otherwise the requested gain is applied twice.
if (vcpExtensionContextActive && !window.volumeControllerInjected) {
  window.volumeControllerInjected = true;

  let currentVolume = 1;
  let isMuted = false;
  let currentLanguage = 'ru';
  let showAllMessages = true;
  const indicatorLabels = {
    ru: { volume: 'Текущая громкость', muted: 'Звук отключён' },
    en: { volume: 'Current volume', muted: 'Sound muted' },
    uk: { volume: 'Поточна гучність', muted: 'Звук вимкнено' }
  };

  // EN: Updates the accessible label for the current volume/mute state.
  // RU: Обновляет доступную подпись индикатора для текущего состояния громкости или mute.
  // UK: Оновлює доступний підпис індикатора для поточного стану гучності або mute.
  function updateIndicatorLabel(muted = isMuted) {
    if (!floatingIndicator) return;
    const labels = indicatorLabels[currentLanguage] || indicatorLabels.ru;
    floatingIndicator.setAttribute('aria-label', muted ? labels.muted : labels.volume);
  }
  let floatingIndicator = null;

  vcpRegisterContextCleanup(() => {
    // EN: Guard cleanup operations independently; a stale DOM wrapper must not block timer and node cleanup.
    // RU: Защищаем каждое действие очистки отдельно: устаревшая DOM-ссылка не должна мешать очистке таймера и узла.
    // UK: Захищаємо кожну дію очищення окремо: застаріле DOM-посилання не повинно заважати очищенню таймера й вузла.
    try { if (floatingIndicator) floatingIndicator.remove(); } catch (_) {}
    floatingIndicator = null;
    try { document.getElementById('vc-floating-indicator')?.remove(); } catch (_) {}
  });

  // EN: Creates or reconnects the temporary volume badge inside the current page.
  // RU: Создаёт или повторно подключает временный индикатор громкости на странице.
  // UK: Створює або повторно під’єднує тимчасовий індикатор гучності на сторінці.
  function removeFloatingIndicator() {
    try { if (floatingIndicator) floatingIndicator.remove(); } catch (_) {}
    floatingIndicator = null;
    try { document.getElementById('vc-floating-indicator')?.remove(); } catch (_) {}
  }

  function createFloatingIndicator() {
    const existing = document.getElementById('vc-floating-indicator');
    if (existing) {
      floatingIndicator = existing;
      updateIndicatorLabel();
      return;
    }

    const parent = document.body || document.documentElement;
    if (!parent) return;

    floatingIndicator = document.createElement('div');
    floatingIndicator.id = 'vc-floating-indicator';
    floatingIndicator.setAttribute('aria-live', 'polite');
    floatingIndicator.textContent = '100';
    updateIndicatorLabel();
    parent.appendChild(floatingIndicator);
  }

  // EN: Show a short-lived accessible volume badge; never touches the page's audio stream.
  // RU: Показывает кратковременный доступный индикатор громкости; не меняет аудиопоток страницы.
  // UK: Показує короткочасний доступний індикатор гучності; не змінює аудіопотік сторінки.
  function showIndicator(volume, muted) {
    // EN: Refuse to touch extension-owned DOM if the extension context has gone stale.
    // RU: Не обращаемся к DOM индикатора, если контекст расширения уже устарел.
    // UK: Не звертаємося до DOM індикатора, якщо контекст розширення вже застарів.
    if (!vcpCheckExtensionContext()) return;
    if (!showAllMessages) {
      removeFloatingIndicator();
      return;
    }

    try {
      createFloatingIndicator();
      if (!floatingIndicator || !floatingIndicator.isConnected) return;

      floatingIndicator.textContent = muted ? 'M' : `${Math.round(volume * 100)}`;
      updateIndicatorLabel(muted);
      floatingIndicator.classList.toggle('boosted', volume > 1);

      // EN: Restart a CSS-only fade animation; no delayed JS callback remains alive after an extension reload.
      // RU: Перезапускаем CSS-анимацию затухания без отложенного JS-callback, который мог бы сработать после перезагрузки расширения.
      // UK: Перезапускаємо CSS-анімацію згасання без відкладеного JS-callback, який міг би спрацювати після перезавантаження розширення.
      floatingIndicator.classList.remove('visible');
      void floatingIndicator.offsetWidth;
      floatingIndicator.classList.add('visible');
    } catch (error) {
      if (vcpIsContextInvalidated(error)) {
        vcpMarkContextInvalidated();
        return;
      }
      throw error;
    }
  }

  // EN: Normalizes volume and mute state before updating the visible page badge.
  // RU: Нормализует громкость и состояние mute перед обновлением индикатора страницы.
  // UK: Нормалізує гучність і стан mute перед оновленням індикатора сторінки.
  function updateIndicator(volume, muted) {
    const parsedVolume = Number(volume);
    currentVolume = Number.isFinite(parsedVolume)
      ? Math.min(6, Math.max(0, parsedVolume))
      : 1;
    isMuted = muted === true;
    showIndicator(currentVolume, isMuted);
  }

  try {
    const handleIndicatorRuntimeMessage = (message, sender, sendResponse) => {
      try {
        if (!vcpIsTrustedBackgroundSender(sender)) return false;
        if (!message || typeof message.type !== 'string') return false;

        if (message.type === 'HIDE_INDICATOR') {
          removeFloatingIndicator();
          sendResponse({ success: true });
          return false;
        }

        if (message.type !== 'SET_VOLUME') return false;
        updateIndicator(message.volume, message.muted);
        sendResponse({ success: true });
      } catch (error) {
        if (vcpIsContextInvalidated(error)) vcpMarkContextInvalidated();
      }
      return false;
    };
    chrome.runtime.onMessage.addListener(handleIndicatorRuntimeMessage);
    vcpRegisterContextCleanup(() => {
      try { chrome.runtime.onMessage.removeListener(handleIndicatorRuntimeMessage); } catch (_) {}
    });
  } catch (error) {
    if (vcpIsContextInvalidated(error)) vcpMarkContextInvalidated();
  }

  // Keep the indicator's accessible label in sync with the selected interface language.
  try {
    chrome.storage.local.get(['volume', 'muted', 'language', 'showAllMessages'], (data) => {
      // EN: Storage callbacks can arrive after the extension has been reloaded; do not touch stale APIs or DOM wrappers.
      // RU: Callback хранилища может прийти после перезагрузки расширения; не трогаем устаревшие API или DOM-ссылки.
      // UK: Callback сховища може надійти після перезавантаження розширення; не використовуємо застарілі API або DOM-посилання.
      if (!vcpCheckExtensionContext()) return;
      try {
        currentLanguage = ['ru', 'en', 'uk'].includes(data.language) ? data.language : 'ru';
        showAllMessages = data.showAllMessages !== false;
        const savedVolume = data.volume === undefined ? 1 : Number(data.volume);
        const savedMuted = data.muted === true;
        const safeVolume = Number.isFinite(savedVolume)
          ? Math.min(6, Math.max(0, savedVolume))
          : 1;

        currentVolume = safeVolume;
        isMuted = savedMuted;
        updateIndicatorLabel();
        // The async storage read may finish after a volume message; enforce the saved master preference either way.
        if (!showAllMessages) removeFloatingIndicator();
        else if (currentVolume !== 1 || isMuted) showIndicator(currentVolume, isMuted);
      } catch (error) {
        if (vcpIsContextInvalidated(error)) vcpMarkContextInvalidated();
        else throw error;
      }
    });
  } catch (error) {
    if (vcpIsContextInvalidated(error)) vcpMarkContextInvalidated();
  }

  try {
    const handleStorageChange = (changes, areaName) => {
      if (!vcpCheckExtensionContext() || areaName !== 'local') return;
      try {
        if (changes.showAllMessages) {
          showAllMessages = changes.showAllMessages.newValue !== false;
          if (!showAllMessages) {
            removeFloatingIndicator();
          } else if (currentVolume !== 1 || isMuted) {
            showIndicator(currentVolume, isMuted);
          }
        }
        if (changes.language) {
          const nextLanguage = changes.language.newValue;
          currentLanguage = ['ru', 'en', 'uk'].includes(nextLanguage) ? nextLanguage : 'ru';
          updateIndicatorLabel();
        }
      } catch (error) {
        if (vcpIsContextInvalidated(error)) vcpMarkContextInvalidated();
        else throw error;
      }
    };
    chrome.storage.onChanged?.addListener?.(handleStorageChange);
    vcpRegisterContextCleanup(() => {
      try { chrome.storage.onChanged?.removeListener?.(handleStorageChange); } catch (_) {}
    });
  } catch (error) {
    if (vcpIsContextInvalidated(error)) vcpMarkContextInvalidated();
  }

  // Keep the page idle until the user actually changes volume. The indicator is
  // created on demand by showIndicator(), avoiding a permanent DOM node and observer.
}


// Track-aware metadata watcher. It runs in the extension content-script world and
// reports only the active media title/identity to the service worker. It does not
// read page audio or modify playback.
if (vcpExtensionContextActive && !window.volumeControllerTrackWatcherInjected) {
  window.volumeControllerTrackWatcherInjected = true;
  let trackWatcherTimer = null;
  let navigationDebounceTimer = null;
  let lastTrackSnapshotKey = '';

  // EN: Read current player metadata from supported DOM selectors; return no result until a real title/identity exists.
  // RU: Читает метаданные текущего плеера через поддерживаемые DOM-селекторы; возвращает пустой результат, пока данных нет.
  // UK: Читає метадані поточного плеєра через підтримувані DOM-селектори; повертає порожній результат, доки даних немає.
  function getTrackSnapshot() {
    const hostname = String(location.hostname || '').toLowerCase();
    const href = String(location.href || '');
    let pageUrl;
    try { pageUrl = new URL(href); } catch (_) { return null; }

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      let videoId = pageUrl.searchParams.get('v') || '';
      if (!videoId) {
        const routeMatch = pageUrl.pathname.match(/^\/(?:shorts|live|embed)\/([^/?#]+)/i);
        if (routeMatch) videoId = routeMatch[1];
      }
      if (!videoId) return null;
      const titleNode = document.querySelector('ytd-watch-metadata h1 yt-formatted-string') ||
        document.querySelector('h1.ytd-watch-metadata') ||
        document.querySelector('meta[name="title"]') ||
        document.querySelector('meta[property="og:title"]');
      let title = titleNode ? (titleNode.content || titleNode.innerText || titleNode.textContent || '') : '';
      if (!title || !title.trim()) title = String(document.title || '').replace(/\s*[-|•]\s*YouTube\s*$/i, '');
      title = title.replace(/\s*[-|•]\s*YouTube\s*$/i, '').replace(/\s+/g, ' ').trim().slice(0, 450);
      if (!title) return null;
      return { trackId: `youtube:${videoId.slice(0, 160)}`, title, platform: 'youtube' };
    }

    if (hostname === 'open.spotify.com') {
      const titleSelectors = [
        '[data-testid="context-item-info-title"]',
        '[data-testid="track-info-name"]',
        '[data-testid="nowplaying-track-link"]',
        '#now-playing-bar [data-testid="context-item-link"]'
      ];
      let title = '';
      for (const selector of titleSelectors) {
        const node = document.querySelector(selector);
        const text = node ? String(node.innerText || node.textContent || '').trim() : '';
        if (text && text.toLowerCase() !== 'spotify') { title = text; break; }
      }
      let artist = '';
      for (const selector of [
        '[data-testid="context-item-info-artist"]',
        '[data-testid="context-item-info-artists"]',
        '[data-testid="track-info-artists"]'
      ]) {
        const node = document.querySelector(selector);
        const text = node ? String(node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim() : '';
        if (text) { artist = text.slice(0, 200); break; }
      }
      const trackLink = document.querySelector('#now-playing-bar a[href*="/track/"], [data-testid="now-playing-widget"] a[href*="/track/"], [data-testid="context-item-info-title"] a[href*="/track/"], a[data-testid="context-item-link"][href*="/track/"]');
      const hrefMatch = String((trackLink && trackLink.href) || '').match(/\/track\/([A-Za-z0-9]+)/);
      const pageMatch = pageUrl.pathname.match(/\/track\/([A-Za-z0-9]+)/);
      const id = (hrefMatch && hrefMatch[1]) || (pageMatch && pageMatch[1]) || '';
      if (!title) {
        title = String(document.title || '').replace(/\s*[|•-]\s*Spotify\s*$/i, '').trim();
      }
      title = title.replace(/\s+/g, ' ').trim().slice(0, 400);
      if (!title || title.toLowerCase() === 'spotify') return null;
      const fullTitle = artist && !title.toLowerCase().includes(artist.toLowerCase())
        ? `${title} — ${artist}` : title;
      const identity = id ? `spotify:${id}` : `spotify:${title.toLowerCase()}|${artist.toLowerCase()}`;
      return { trackId: identity.slice(0, 280), title: fullTitle.slice(0, 500), platform: 'spotify' };
    }
    return null;
  }

  // EN: Notify the background only when the active track title/ID changes, avoiding continuous redundant messages.
  // RU: Сообщает фоновому процессу только при смене названия/ID трека, не создавая постоянный поток одинаковых сообщений.
  // UK: Повідомляє фоновий процес лише під час зміни назви/ID треку, не створюючи постійний потік однакових повідомлень.
  function publishTrackSnapshot(force = false) {
    if (!vcpCheckExtensionContext()) {
      stopTrackWatcher();
      return;
    }
    const snapshot = getTrackSnapshot();
    if (!snapshot) return;
    const key = `${snapshot.trackId}\n${snapshot.title}`;
    if (!force && key === lastTrackSnapshotKey) return;
    lastTrackSnapshotKey = key;
    const pending = vcpSafeSendMessage({
      type: 'MEDIA_TRACK_CHANGED',
      trackId: snapshot.trackId,
      title: snapshot.title,
      platform: snapshot.platform
    }, stopTrackWatcher);
    // Non-context errors (for example, a sleeping service worker) are transient and may be ignored.
    if (pending && typeof pending.catch === 'function') {
      pending.catch((error) => {
        if (!vcpIsContextInvalidated(error)) {
          console.debug('Track metadata send failed:', error?.message || error);
        }
      });
    }
  }

  // EN: Starts watching media metadata so the active track title and ID stay current.
  // RU: Запускает отслеживание метаданных медиа, чтобы название и ID трека оставались актуальными.
  // UK: Запускає відстеження метаданих медіа, щоб назва та ID треку залишалися актуальними.
  function startTrackWatcher() {
    if (trackWatcherTimer) return;
    publishTrackSnapshot(true);
    trackWatcherTimer = setInterval(() => publishTrackSnapshot(false), 1200);
  }

  // EN: Stops media metadata polling and releases its timer.
  // RU: Останавливает опрос метаданных медиа и освобождает таймер.
  // UK: Зупиняє опитування метаданих медіа та звільняє таймер.
  function stopTrackWatcher() {
    if (trackWatcherTimer) clearInterval(trackWatcherTimer);
    trackWatcherTimer = null;
  }

  vcpRegisterContextCleanup(stopTrackWatcher);

  try {
    const handleTrackRuntimeMessage = (message, sender, sendResponse) => {
      try {
        if (!vcpIsTrustedBackgroundSender(sender)) return false;
        if (!message || typeof message.type !== 'string') return false;
        if (message.type === 'GET_MEDIA_TRACK_METADATA') {
          sendResponse(getTrackSnapshot() || null);
          return false;
        }
        if (message.type === 'START_TRACK_WATCHER') {
          startTrackWatcher();
          sendResponse({ success: true });
          return false;
        }
        if (message.type === 'STOP_TRACK_WATCHER') {
          stopTrackWatcher();
          sendResponse({ success: true });
          return false;
        }
        if (message.type === 'HIDE_INDICATOR') {
          stopTrackWatcher();
        }
      } catch (error) {
        if (vcpIsContextInvalidated(error)) vcpMarkContextInvalidated();
      }
      return false;
    };
    chrome.runtime.onMessage.addListener(handleTrackRuntimeMessage);
    vcpRegisterContextCleanup(() => {
      try { chrome.runtime.onMessage.removeListener(handleTrackRuntimeMessage); } catch (_) {}
    });
  } catch (error) {
    if (vcpIsContextInvalidated(error)) vcpMarkContextInvalidated();
  }

  const handleYouTubeNavigation = () => {
    if (navigationDebounceTimer) clearTimeout(navigationDebounceTimer);
    navigationDebounceTimer = setTimeout(() => {
      navigationDebounceTimer = null;
      publishTrackSnapshot(true);
    }, 250);
  };
  const handleHistoryNavigation = () => publishTrackSnapshot(true);
  document.addEventListener('yt-navigate-finish', handleYouTubeNavigation, true);
  document.addEventListener('yt-page-data-updated', handleYouTubeNavigation, true);
  window.addEventListener('popstate', handleHistoryNavigation, { passive: true });
  vcpRegisterContextCleanup(() => {
    document.removeEventListener('yt-navigate-finish', handleYouTubeNavigation, true);
    document.removeEventListener('yt-page-data-updated', handleYouTubeNavigation, true);
    window.removeEventListener('popstate', handleHistoryNavigation, { passive: true });
    if (navigationDebounceTimer) clearTimeout(navigationDebounceTimer);
    navigationDebounceTimer = null;
  });
  startTrackWatcher();
}

})(); // vcpContentScriptMain
