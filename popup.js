/*
 * EN: Popup controller. Owns UI state, settings persistence, translations, per-site profiles,
 *     genre-mode selection and visualization rendering. The background worker owns capture lifecycle.
 * RU: Контроллер всплывающего окна. Управляет интерфейсом, сохранением параметров, переводами,
 *     профилями сайтов, режимами жанровой настройки и отрисовкой визуализации. Захватом управляет background.
 * UK: Контролер спливного вікна. Керує інтерфейсом, збереженням параметрів, перекладами,
 *     профілями сайтів, режимами жанрового налаштування та візуалізацією. Захопленням керує background.
 */
const slider = document.getElementById('volumeSlider');
const sliderFill = document.getElementById('sliderFill');
const volumeValue = document.getElementById('volumeValue');
const volumeNumberText = document.createTextNode('100');
const volumePercentSymbol = volumeValue.querySelector('span') || document.createElement('span');
volumePercentSymbol.textContent = '%';
volumeValue.replaceChildren(volumeNumberText, volumePercentSymbol);
const extensionVersion = document.getElementById('extensionVersion');
if (extensionVersion) extensionVersion.textContent = chrome.runtime.getManifest().version;
const muteButton = document.getElementById('muteButton');
const peakLimiterToggle = document.getElementById('peakLimiterToggle');
const quickPeakLimiterToggle = document.getElementById('quickPeakLimiterToggle');
const showClippingWarningToggle = document.getElementById('showClippingWarningToggle');
const showAllMessagesToggle = document.getElementById('showAllMessagesToggle');

// EN: Remove the obsolete page-side green dot left by versions 4.7.83/4.7.84; never create a replacement.
// RU: Удаляем устаревший зелёный кружок, оставшийся от версий 4.7.83/4.7.84; новый кружок не создаём.
// UK: Видаляємо застарілий зелений кружок, що залишився від версій 4.7.83/4.7.84; нового кружка не створюємо.
async function removeObsoleteCaptureCircleFromActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !Number.isInteger(tab.id)) return;
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        document.querySelectorAll('#vc-capture-circle, [id="vc-capture-circle"]').forEach((node) => node.remove());
      }
    });
  } catch (_) {
    // The tab may not be scriptable (for example edge:// pages); nothing needs to be changed there.
  }
}
void removeObsoleteCaptureCircleFromActiveTab();
const showCaptureStatusIndicatorToggle = document.getElementById('showCaptureStatusIndicatorToggle');
const showQuickSettingsToggle = document.getElementById('showQuickSettingsToggle');
const quickSettingsPanel = document.getElementById('quickSettingsPanel');
const autoGenreEnabledToggle = document.getElementById('autoGenreEnabledToggle');
const autoGenreStatusCard = document.getElementById('autoGenreStatusCard');
const autoGenreStatusTitle = document.getElementById('autoGenreStatusTitle');
const autoGenreStatusDescription = document.getElementById('autoGenreStatusDescription');
const autoGenreTrackTitle = document.getElementById('autoGenreTrackTitle');
const autoGenreStatusBadge = document.getElementById('autoGenreStatusBadge');
const autoGenreProfileDetails = document.getElementById('autoGenreProfileDetails');
const nightModeToggle = document.getElementById('nightModeToggle');
const quickNightModeToggle = document.getElementById('quickNightModeToggle');
const quickBassBoostToggle = document.getElementById('quickBassBoostToggle');
const quickVoiceBoostToggle = document.getElementById('quickVoiceBoostToggle');
const quickAutoGenreToggle = document.getElementById('quickAutoGenreToggle');
const quickRgbGlowToggle = document.getElementById('quickRgbGlowToggle');
const quickYoutubeProfileToggle = document.getElementById('quickYoutubeProfileToggle');
const quickSpotifyProfileToggle = document.getElementById('quickSpotifyProfileToggle');
const audioProtectionIndicator = document.getElementById('audioProtectionIndicator');
const audioProtectionTitle = document.getElementById('audioProtectionTitle');
const audioProtectionDescription = document.getElementById('audioProtectionDescription');
const peakLimiterBadge = document.getElementById('peakLimiterBadge');
const bassBoostToggle = document.getElementById('bassBoostToggle');
const settingsBassBoostToggle = document.getElementById('settingsBassBoostToggle');
const showBassBoostPanelToggle = document.getElementById('showBassBoostPanelToggle');
const bassBoostSlider = document.getElementById('bassBoostSlider');
const bassBoostValue = document.getElementById('bassBoostValue');
const bassBoostAutoBadge = document.getElementById('bassBoostAutoBadge');
const voiceBoostToggle = document.getElementById('voiceBoostToggle');
const settingsVoiceBoostToggle = document.getElementById('settingsVoiceBoostToggle');
const showVoiceBoostPanelToggle = document.getElementById('showVoiceBoostPanelToggle');
const voiceBoostSlider = document.getElementById('voiceBoostSlider');
const voiceBoostValue = document.getElementById('voiceBoostValue');
const voiceBoostAutoBadge = document.getElementById('voiceBoostAutoBadge');
const status = document.getElementById('status');
let statusTimer = null;
const captureStatusIndicator = document.getElementById('captureStatusIndicator');
const captureStatusTitle = document.getElementById('captureStatusTitle');
const captureStatusDescription = document.getElementById('captureStatusDescription');
const captureSourceBadge = document.getElementById('captureSourceBadge');
const presetBtns = document.querySelectorAll('.preset-btn');
const languageSelect = document.getElementById('languageSelect');
const settingsBtn = document.getElementById('settingsBtn');
const enableExtensionBtn = document.getElementById('enableExtensionBtn');
const disableExtensionBtn = document.getElementById('disableExtensionBtn');
const settingsPanel = document.getElementById('settingsPanel');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');
const themeSelect = document.getElementById('themeSelect');
const rgbGlowToggle = document.getElementById('rgbGlowToggle');
const visualizerStyleSelect = document.getElementById('visualizerStyleSelect');
const visualizerPaletteSelect = document.getElementById('visualizerPaletteSelect');
const visualizerGlowToggle = document.getElementById('visualizerGlowToggle');
const visualizerPeakHoldToggle = document.getElementById('visualizerPeakHoldToggle');
const spectrogramGridToggle = document.getElementById('spectrogramGridToggle');
const spectrogramSmoothingToggle = document.getElementById('spectrogramSmoothingToggle');
const spectrogramGlowToggle = document.getElementById('spectrogramGlowToggle');
const visualizerSensitivitySlider = document.getElementById('visualizerSensitivitySlider');
const visualizerSensitivityValue = document.getElementById('visualizerSensitivityValue');
const visualizerBandsSelect = document.getElementById('visualizerBandsSelect');
const spectrogramPaletteSelect = document.getElementById('spectrogramPaletteSelect');
const spectrogramDurationSelect = document.getElementById('spectrogramDurationSelect');
const visualizerAnimationToggle = document.getElementById('visualizerAnimationToggle');
const showFrequencyVisualizerToggle = document.getElementById('showFrequencyVisualizerToggle');
const showSpectrogramToggle = document.getElementById('showSpectrogramToggle');
const energySavingToggle = document.getElementById('energySavingToggle');
const energySavingModeSelect = document.getElementById('energySavingModeSelect');
const visualizerPanel = document.querySelector('.visualizer-panel');
const spectrogramPanel = document.querySelector('.spectrogram-panel');
const bassBoostPanel = document.querySelector('.bass-panel');
const voiceBoostPanel = document.querySelector('.voice-panel');
const profilePresetBtns = document.querySelectorAll('.profile-preset');
const factoryResetBtn = document.getElementById('factoryResetBtn');
const exportSettingsBtn = document.getElementById('exportSettingsBtn');
const importSettingsBtn = document.getElementById('importSettingsBtn');
const settingsImportFile = document.getElementById('settingsImportFile');
const SERVICE_PROFILE_CONTROLS = {
  youtube: {
    enabled: document.getElementById('youtubeProfileEnabledToggle'), quickEnabled: document.getElementById('quickYoutubeProfileToggle'),
    volume: document.getElementById('youtubeProfileVolumeSlider'), volumeValue: document.getElementById('youtubeProfileVolumeValue'),
    bassEnabled: document.getElementById('youtubeProfileBassEnabledToggle'),
    bassDb: document.getElementById('youtubeProfileBassDbSlider'), bassDbValue: document.getElementById('youtubeProfileBassDbValue'),
    voiceEnabled: document.getElementById('youtubeProfileVoiceEnabledToggle'),
    voiceDb: document.getElementById('youtubeProfileVoiceDbSlider'), voiceDbValue: document.getElementById('youtubeProfileVoiceDbValue'),
    limiter: document.getElementById('youtubeProfileLimiterToggle'), night: document.getElementById('youtubeProfileNightToggle')
  },
  spotify: {
    enabled: document.getElementById('spotifyProfileEnabledToggle'), quickEnabled: document.getElementById('quickSpotifyProfileToggle'),
    volume: document.getElementById('spotifyProfileVolumeSlider'), volumeValue: document.getElementById('spotifyProfileVolumeValue'),
    bassEnabled: document.getElementById('spotifyProfileBassEnabledToggle'),
    bassDb: document.getElementById('spotifyProfileBassDbSlider'), bassDbValue: document.getElementById('spotifyProfileBassDbValue'),
    voiceEnabled: document.getElementById('spotifyProfileVoiceEnabledToggle'),
    voiceDb: document.getElementById('spotifyProfileVoiceDbSlider'), voiceDbValue: document.getElementById('spotifyProfileVoiceDbValue'),
    limiter: document.getElementById('spotifyProfileLimiterToggle'), night: document.getElementById('spotifyProfileNightToggle')
  }
};
const frequencyCanvas = document.getElementById('frequencyCanvas');
const spectrogramCanvas = document.getElementById('spectrogramCanvas');
const spectrogramEmpty = document.getElementById('spectrogramEmpty');
const visualizerLive = document.getElementById('visualizerLive');
const visualizerLiveText = document.getElementById('visualizerLiveText');
const visualizerEmpty = document.getElementById('visualizerEmpty');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
// Default cadence stays unchanged unless power saving is explicitly enabled.
const ENERGY_SAVING_MODES = ['balanced', 'performance', 'efficiency'];
const SETTINGS_CONFIG_FORMAT = 'volume-controller-pro-settings';
const SETTINGS_CONFIG_SCHEMA_VERSION = 18;
const SETTINGS_CONFIG_MAX_BYTES = 256 * 1024;

// EN: Storage queue, URL guards and translation helpers keep UI state safe and predictable.
// RU: Очередь записи, проверки URL и функции переводов делают состояние интерфейса предсказуемым.
// UK: Черга запису, перевірки URL і функції перекладу роблять стан інтерфейсу передбачуваним.
// leave an older value as the final saved state. A failed write does not poison the queue.
let localSettingsWriteQueue = Promise.resolve();
function writeLocalSettings(values) {
  const operation = localSettingsWriteQueue.then(() => chrome.storage.local.set(values));
  localSettingsWriteQueue = operation.catch(() => {});
  return operation;
}

// EN: Accepts only the secure Spotify Web Player origin.
// RU: Разрешает только защищённый адрес Spotify Web Player.
// UK: Дозволяє лише захищену адресу Spotify Web Player.
function isSpotifyWebPlayerUrl(tabUrl) {
  try {
    const parsed = new URL(tabUrl);
    return parsed.protocol === 'https:' && parsed.hostname === 'open.spotify.com';
  } catch {
    return false;
  }
}

// EN: Checks that a URL is a supported YouTube video page, not a channel/settings page.
// RU: Проверяет, что URL ведёт на поддерживаемое видео YouTube, а не на канал или настройки.
// UK: Перевіряє, що URL веде на підтримуване відео YouTube, а не на канал чи налаштування.
function isYouTubeVideoUrl(tabUrl) {
  try {
    const parsed = new URL(tabUrl);
    const host = parsed.hostname.toLowerCase();
    const isYouTubeHost = host === 'youtube.com' || host.endsWith('.youtube.com');
    const isVideoRoute = parsed.pathname === '/watch' ||
      parsed.pathname.startsWith('/shorts/') ||
      parsed.pathname.startsWith('/live/') ||
      parsed.pathname.startsWith('/embed/');
    return parsed.protocol === 'https:' && isYouTubeHost && isVideoRoute;
  } catch {
    return false;
  }
}

let translations = {};
let fallbackTranslations = {};
const translationCache = new Map();
let language = 'ru';
let themeMode = 'system';
let rgbGlowEnabled = true;
let visualizerStyle = 'bars';
let visualizerPaletteMode = 'neon';
let visualizerGlowEnabled = true;
let visualizerPeakHoldEnabled = true;
let spectrogramGridEnabled = true;
let spectrogramSmoothingEnabled = true;
let spectrogramGlowEnabled = true;
let visualizerSensitivity = 100;
let savedVisualizerSensitivity = 100;
let visualizerBands = 48;
let spectrogramPaletteMode = 'neon';
let spectrogramDuration = 4;
let visualizerAnimationEnabled = true;
let showFrequencyVisualizer = true;
let showSpectrogram = true;
let showBassBoostPanel = true;
let showVoiceBoostPanel = true;
let energySavingEnabled = false;
let energySavingMode = 'balanced';
let settingsPreferencesReady = false;
const VISUALIZER_BAND_OPTIONS = [24, 36, 48, 64, 96];
const VISUALIZER_STYLES = ['bars', 'line', 'wave', 'mirror', 'dots'];
const SPECTROGRAM_PALETTES = ['neon', 'ocean', 'fire', 'mono'];
const SPECTROGRAM_DURATIONS = [2, 4, 6, 8, 12];
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)');

// EN: Returns sampling/rendering limits for the selected energy-saving mode.
// RU: Возвращает параметры частоты опроса и отрисовки для выбранного энергосберегающего режима.
// UK: Повертає параметри частоти опитування й відтворення для вибраного режиму енергозбереження.
function getEnergySavingProfile() {
  if (!energySavingEnabled) {
    return { sampleIntervalMs: 66, frameIntervalMs: reducedMotionQuery.matches ? 66 : 33, canvasDpr: 1.5 };
  }
  if (energySavingMode === 'performance') {
    return { sampleIntervalMs: reducedMotionQuery.matches ? 66 : 33, frameIntervalMs: reducedMotionQuery.matches ? 66 : 16, canvasDpr: 1.5 };
  }
  if (energySavingMode === 'efficiency') {
    return { sampleIntervalMs: 200, frameIntervalMs: 100, canvasDpr: 1 };
  }
  return { sampleIntervalMs: 66, frameIntervalMs: reducedMotionQuery.matches ? 66 : 33, canvasDpr: 1.25 };
}

// EN: Loads a language dictionary and rejects malformed translation data.
// RU: Загружает словарь языка и отклоняет некорректные данные переводов.
// UK: Завантажує словник мови та відхиляє некоректні дані перекладів.
async function readLanguageFile(code) {
  if (!['ru', 'en', 'uk'].includes(code)) throw new Error(`Unsupported language: ${code}`);
  if (!translationCache.has(code)) {
    const response = await fetch(chrome.runtime.getURL(`lang/${code}.json`));
    if (!response.ok) throw new Error(`Could not load lang/${code}.json (${response.status})`);
    const dictionary = await response.json();
    if (!dictionary || typeof dictionary !== 'object' || Array.isArray(dictionary)) {
      throw new Error(`Invalid language file: ${code}`);
    }
    translationCache.set(code, dictionary);
  }
  return translationCache.get(code);
}

// EN: Loads the requested locale with a safe fallback to the default language.
// RU: Загружает выбранный язык с безопасным возвратом к языку по умолчанию.
// UK: Завантажує вибрану мову з безпечним поверненням до мови за замовчуванням.
async function loadTranslations(code) {
  fallbackTranslations = await readLanguageFile('ru');
  translations = code === 'ru' ? fallbackTranslations : await readLanguageFile(code);
}

// EN: Resolves a translation key and safely interpolates its named placeholders.
// RU: Находит перевод по ключу и безопасно подставляет именованные значения.
// UK: Знаходить переклад за ключем і безпечно підставляє іменовані значення.
function t(key, values = {}) {
  let text = translations[key] ?? fallbackTranslations[key] ?? key;
  for (const [name, value] of Object.entries(values)) {
    text = text.replaceAll(`{{${name}}}`, String(value));
  }
  return text;
}

// EN: Maps known technical errors to concise messages in the current language.
// RU: Преобразует известные технические ошибки в краткие сообщения на выбранном языке.
// UK: Перетворює відомі технічні помилки на короткі повідомлення вибраною мовою.
function localizeErrorDetail(detail) {
  const knownErrors = {
    'Не удалось определить активную вкладку.': 'activeTabError',
    'Браузер не освободил предыдущий аудиопоток. Повторите запуск захвата.': 'captureReleaseError',
    'Браузер создал медиапоток без аудиодорожки.': 'captureNoAudioTrack',
    'Эта вкладка уже захватывается другим процессом. Остановите другой захват и повторите попытку.': 'tabBusyError',
    'Offscreen-документ не подтвердил запуск захвата.': 'offscreenStartError',
    'Запуск разрешён только для текущей активной вкладки.': 'activeTabOnlyError',
    'Захват доступен только на YouTube и Spotify Web Player.': 'siteNotSupported'
  };
  const key = knownErrors[String(detail || '').trim()];
  return key ? t(key) : detail;
}

// EN: Shows the currently selected spectrogram color palette in the interface.
// RU: Показывает в интерфейсе выбранную цветовую палитру спектрограммы.
// UK: Показує в інтерфейсі вибрану кольорову палітру спектрограми.
function updateSpectrogramPaletteBadge() {
  const badge = document.getElementById('spectrogramPaletteBadge');
  if (!badge) return;
  const paletteKeyByMode = {
    neon: 'paletteNeon',
    ocean: 'paletteOcean',
    fire: 'paletteFire',
    mono: 'paletteMono'
  };
  const paletteKey = paletteKeyByMode[spectrogramPaletteMode] || 'paletteNeon';
  const paletteName = t(paletteKey);
  badge.textContent = paletteName.toLocaleUpperCase(language);
  badge.setAttribute('aria-label', `${t('spectrogramPaletteLabel')}: ${paletteName}`);
}

// EN: Applies dictionary strings to marked HTML text, titles, and accessibility labels.
// RU: Применяет переводы к помеченному HTML-тексту, подсказкам и доступным подписям.
// UK: Застосовує переклади до позначеного HTML-тексту, підказок і доступних підписів.
function applyTranslations() {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = key === 'spectrogramSubtitle' ? t(key, { seconds: spectrogramDuration }) : t(key);
  });
  updateSpectrogramPaletteBadge();
  document.querySelectorAll('[data-i18n-title]').forEach((element) => {
    element.title = t(element.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  });
  languageSelect.value = language;
  languageSelect.setAttribute('aria-label', t('languageLabel'));
  themeSelect.value = themeMode;
  themeSelect.setAttribute('aria-label', t('settingsTheme'));
  rgbGlowToggle.setAttribute('aria-label', t('rgbGlow'));
  if (visualizerStyleSelect) visualizerStyleSelect.setAttribute('aria-label', t('visualizerStyleLabel'));
  if (visualizerPaletteSelect) visualizerPaletteSelect.setAttribute('aria-label', t('visualizerPaletteLabel'));
  if (visualizerGlowToggle) visualizerGlowToggle.setAttribute('aria-label', t('visualizerGlowLabel'));
  if (visualizerPeakHoldToggle) visualizerPeakHoldToggle.setAttribute('aria-label', t('visualizerPeakHoldLabel'));
  if (spectrogramGridToggle) spectrogramGridToggle.setAttribute('aria-label', t('spectrogramGridLabel'));
  if (spectrogramSmoothingToggle) spectrogramSmoothingToggle.setAttribute('aria-label', t('spectrogramSmoothingLabel'));
  if (spectrogramGlowToggle) spectrogramGlowToggle.setAttribute('aria-label', t('spectrogramGlowLabel'));
  if (visualizerSensitivitySlider) visualizerSensitivitySlider.setAttribute('aria-label', t('visualizerSensitivityLabel'));
  if (visualizerBandsSelect) visualizerBandsSelect.setAttribute('aria-label', t('visualizerBandsLabel'));
  if (spectrogramPaletteSelect) spectrogramPaletteSelect.setAttribute('aria-label', t('spectrogramPaletteLabel'));
  if (spectrogramDurationSelect) spectrogramDurationSelect.setAttribute('aria-label', t('spectrogramDurationLabel'));
  if (visualizerAnimationToggle) visualizerAnimationToggle.setAttribute('aria-label', t('visualizerAnimationLabel'));
  if (showFrequencyVisualizerToggle) showFrequencyVisualizerToggle.setAttribute('aria-label', t('showVisualizerLabel'));
  if (showSpectrogramToggle) showSpectrogramToggle.setAttribute('aria-label', t('showSpectrogramLabel'));
  if (showBassBoostPanelToggle) showBassBoostPanelToggle.setAttribute('aria-label', t('showBassBoostPanelLabel'));
  if (showVoiceBoostPanelToggle) showVoiceBoostPanelToggle.setAttribute('aria-label', t('showVoiceBoostPanelLabel'));
  if (peakLimiterToggle) peakLimiterToggle.setAttribute('aria-label', t('peakLimiterLabel'));
  if (quickPeakLimiterToggle) quickPeakLimiterToggle.setAttribute('aria-label', t('peakLimiterLabel'));
  if (showClippingWarningToggle) showClippingWarningToggle.setAttribute('aria-label', t('showClippingWarningLabel'));
  if (showAllMessagesToggle) showAllMessagesToggle.setAttribute('aria-label', t('showAllMessagesLabel'));
  if (nightModeToggle) nightModeToggle.setAttribute('aria-label', t('nightModeLabel'));
  if (quickNightModeToggle) quickNightModeToggle.setAttribute('aria-label', t('nightModeLabel')); 
  if (energySavingToggle) energySavingToggle.setAttribute('aria-label', t('energySavingToggleLabel'));
  if (energySavingModeSelect) energySavingModeSelect.setAttribute('aria-label', t('energySavingModeLabel'));
  updateEnergySavingUI();
  updateNightModeUI();
  updateVisualizerSettingsUI();
  updateAudioPanelVisibilityUI();
  updateClippingWarningSettingUI();
  updateProtectionUI();
  settingsBtn.setAttribute('aria-label', t('settingsButton'));
  settingsCloseBtn.setAttribute('aria-label', t('settingsClose'));
  updateMuteButton();
  updateCaptureStatusIndicator();
}

// EN: Applies the selected color theme and synchronizes RGB-related controls.
// RU: Применяет выбранную тему и синхронизирует переключатели RGB-подсветки.
// UK: Застосовує вибрану тему та синхронізує перемикачі RGB-підсвічування.
function applyTheme(mode = themeMode) {
  const effectiveTheme = mode === 'system' ? (systemThemeQuery.matches ? 'light' : 'dark') : mode;
  document.body.dataset.theme = effectiveTheme;
  document.body.classList.toggle('rgb-glow', rgbGlowEnabled);
  if (themeSelect) themeSelect.value = mode;
  if (rgbGlowToggle) rgbGlowToggle.checked = rgbGlowEnabled;
  if (quickRgbGlowToggle) quickRgbGlowToggle.checked = rgbGlowEnabled;
}

// EN: Opens or closes the settings panel and updates its accessibility state.
// RU: Открывает или закрывает панель настроек и обновляет её состояние доступности.
// UK: Відкриває або закриває панель налаштувань та оновлює її стан доступності.
function setSettingsPanelOpen(isOpen) {
  settingsPanel.hidden = !isOpen;
  settingsBtn.setAttribute('aria-expanded', String(isOpen));
  settingsBtn.classList.toggle('active', isOpen);
}

// EN: Persists a theme choice and applies it to the popup.
// RU: Сохраняет выбор темы и применяет его к popup.
// UK: Зберігає вибір теми та застосовує її до popup.
async function setTheme(nextTheme) {
  if (!['dark', 'light', 'system'].includes(nextTheme)) {
    themeSelect.value = themeMode;
    return;
  }
  const previousTheme = themeMode;
  themeMode = nextTheme;
  applyTheme(themeMode);
  try {
    await writeLocalSettings({ themeMode });
    showStatus(t('themeSet', { theme: t(`theme${nextTheme.charAt(0).toUpperCase()}${nextTheme.slice(1)}`) }));
  } catch (error) {
    themeMode = previousTheme;
    applyTheme(themeMode);
    showStatus(t('settingsSaveError'), true);
  }
}

// EN: Persists and applies the optional RGB glow effect.
// RU: Сохраняет и применяет необязательный эффект RGB-подсветки.
// UK: Зберігає та застосовує необов’язковий ефект RGB-підсвічування.
async function setRgbGlow(enabled) {
  const previousValue = rgbGlowEnabled;
  rgbGlowEnabled = Boolean(enabled);
  if (quickRgbGlowToggle) quickRgbGlowToggle.checked = rgbGlowEnabled;
  applyTheme(themeMode);
  try {
    await writeLocalSettings({ rgbGlow: rgbGlowEnabled });
    showStatus(t('rgbGlowStatus', { state: t(rgbGlowEnabled ? 'on' : 'off') }));
  } catch (error) {
    rgbGlowEnabled = previousValue;
    applyTheme(themeMode);
    showStatus(t('settingsSaveError'), true);
  }
}

// EN: Saves the selected language and refreshes all localized UI labels.
// RU: Сохраняет выбранный язык и обновляет подписи интерфейса.
// UK: Зберігає вибрану мову й оновлює підписи інтерфейсу.
async function setLanguage(nextLanguage) {
  if (!['ru', 'en', 'uk'].includes(nextLanguage)) {
    languageSelect.value = language;
    return;
  }
  if (language === nextLanguage) return;

  const previousLanguage = language;
  try {
    await loadTranslations(nextLanguage);
  } catch (error) {
    languageSelect.value = previousLanguage;
    showStatus(t('languageLoadError'), true);
    return;
  }

  language = nextLanguage;
  applyTranslations();
  try {
    await writeLocalSettings({ language });
    showStatus(t('languageSet'));
  } catch (error) {
    language = previousLanguage;
    try {
      await loadTranslations(previousLanguage);
      applyTranslations();
    } catch (_) {}
    showStatus(t('languageSaveError'), true);
  }
}

let isMuted = false;
let lastBoostValue = 200;
let currentTabId = null;
let currentTabIsSpotifyWebPlayer = false;
let currentTabIsYouTubeVideo = false;
let currentTabSupportsCapture = false;
let capturedTabId = null;
let extensionCaptureActive = false;
let captureTransitionInProgress = false;
let captureTransitionStatus = null;
let captureIndicatorError = false;
let bassBoostEnabled = true;
let bassBoostDb = 4;
let voiceBoostEnabled = true;
let voiceBoostDb = 2;
let peakLimiterEnabled = true;
let showClippingWarning = true;
let showAllMessages = true;
let showCaptureStatusIndicator = true;
let showQuickSettings = true;
let autoGenreEnabled = true;
let autoGenreBassManualOverride = false; // false means AUTO by default
let autoGenreVoiceManualOverride = false; // false means AUTO by default
const GENRE_PARAMETER_MODE_VERSION = 1;
let autoGenreStatus = { enabled: false, active: false, genre: null, confidence: 0, source: null, trackId: '', trackTitle: '', bassManualOverride: false, voiceManualOverride: false, state: 'disabled' };
let nightModeEnabled = false;
let protectionMonitorActive = false;
let peakClippingDetected = false;
let activeAudioPreset = 'default';
let audioControlsReady = false;
const SERVICE_PROFILE_KEYS = ['youtube', 'spotify'];
// EN: Builds the default independent settings object for one streaming service.
// RU: Создаёт стандартный набор отдельных настроек для одного стримингового сервиса.
// UK: Створює типовий набір окремих налаштувань для одного стримінгового сервісу.
function createDefaultServiceAudioProfile(enabled = false) {
  return { enabled, volume: 1, bassBoostEnabled: true, bassBoostDb: 4, voiceBoostEnabled: true, voiceBoostDb: 2, peakLimiterEnabled: true, nightModeEnabled: false, activeAudioPreset: 'default' };
}
// EN: Clamps and fills missing values in a saved YouTube/Spotify profile.
// RU: Ограничивает диапазоны и заполняет отсутствующие значения профиля YouTube/Spotify.
// UK: Обмежує діапазони й заповнює відсутні значення профілю YouTube/Spotify.
function normalizeServiceAudioProfile(raw) {
  const defaults = createDefaultServiceAudioProfile(false);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
  const volume = Number(raw.volume);
  const bassDb = Number(raw.bassBoostDb);
  const voiceDb = Number(raw.voiceBoostDb);
  return {
    enabled: raw.enabled === true,
    volume: Number.isFinite(volume) ? Math.min(6, Math.max(0, volume)) : defaults.volume,
    bassBoostEnabled: typeof raw.bassBoostEnabled === 'boolean' ? raw.bassBoostEnabled : defaults.bassBoostEnabled,
    bassBoostDb: Number.isFinite(bassDb) ? Math.min(12, Math.max(0, Math.round(bassDb))) : defaults.bassBoostDb,
    voiceBoostEnabled: typeof raw.voiceBoostEnabled === 'boolean' ? raw.voiceBoostEnabled : defaults.voiceBoostEnabled,
    voiceBoostDb: Number.isFinite(voiceDb) ? Math.min(8, Math.max(0, Math.round(voiceDb))) : defaults.voiceBoostDb,
    peakLimiterEnabled: typeof raw.peakLimiterEnabled === 'boolean' ? raw.peakLimiterEnabled : defaults.peakLimiterEnabled,
    nightModeEnabled: typeof raw.nightModeEnabled === 'boolean' ? raw.nightModeEnabled : defaults.nightModeEnabled,
    activeAudioPreset: typeof raw.activeAudioPreset === 'string' && ['default', 'podcasts', 'audiobooks', 'music', 'video', 'series', 'movies', 'games', 'sports', 'broadcasts', 'streams', 'custom'].includes(raw.activeAudioPreset) ? raw.activeAudioPreset : defaults.activeAudioPreset
  };
}
// EN: Checks whether an imported service profile contains valid typed values.
// RU: Проверяет корректность типов и значений импортируемого профиля сервиса.
// UK: Перевіряє коректність типів і значень профілю сервісу під час імпорту.
function isValidServiceAudioProfile(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  return typeof raw.enabled === 'boolean' && typeof raw.volume === 'number' && Number.isFinite(raw.volume) && raw.volume >= 0 && raw.volume <= 6 &&
    typeof raw.bassBoostEnabled === 'boolean' && Number.isInteger(raw.bassBoostDb) && raw.bassBoostDb >= 0 && raw.bassBoostDb <= 12 &&
    typeof raw.voiceBoostEnabled === 'boolean' && Number.isInteger(raw.voiceBoostDb) && raw.voiceBoostDb >= 0 && raw.voiceBoostDb <= 8 &&
    typeof raw.peakLimiterEnabled === 'boolean' && typeof raw.nightModeEnabled === 'boolean' &&
    typeof raw.activeAudioPreset === 'string' && ['default', 'podcasts', 'audiobooks', 'music', 'video', 'series', 'movies', 'games', 'sports', 'broadcasts', 'streams', 'custom'].includes(raw.activeAudioPreset);
}
let serviceAudioProfiles = { youtube: createDefaultServiceAudioProfile(), spotify: createDefaultServiceAudioProfile() };
let serviceAudioProfileConfigured = { youtube: false, spotify: false };
let activePlatformProfileKey = null;
let globalAudioSettings = { volume: 1, muted: false, bassBoostEnabled: true, bassBoostDb: 4, voiceBoostEnabled: true, voiceBoostDb: 2, peakLimiterEnabled: true, nightModeEnabled: false, activeAudioPreset: 'default', lastBoostValue: 200 };

const AUDIO_PRESETS = {
  // Neutral/default UI profile preserves the extension's long-standing factory EQ values.
  default:    { bassBoostEnabled: true, bassBoostDb: 4, voiceBoostEnabled: true,  voiceBoostDb: 2, labelKey: 'presetDefault' },
  // Conservative presets gently shape the source instead of overpowering it.
  podcasts:   { bassBoostEnabled: true, bassBoostDb: 2, voiceBoostEnabled: true,  voiceBoostDb: 3, labelKey: 'presetPodcasts' },
  audiobooks: { bassBoostEnabled: true, bassBoostDb: 1, voiceBoostEnabled: true,  voiceBoostDb: 3, labelKey: 'presetAudiobooks' },
  music:      { bassBoostEnabled: true, bassBoostDb: 4, voiceBoostEnabled: true, voiceBoostDb: 1, labelKey: 'presetMusic' },
  video:      { bassBoostEnabled: true, bassBoostDb: 3, voiceBoostEnabled: true,  voiceBoostDb: 2, labelKey: 'presetVideo' },
  series:     { bassBoostEnabled: true, bassBoostDb: 3, voiceBoostEnabled: true,  voiceBoostDb: 2, labelKey: 'presetSeries' },
  movies:     { bassBoostEnabled: true, bassBoostDb: 4, voiceBoostEnabled: true,  voiceBoostDb: 2, labelKey: 'presetMovies' },
  games:      { bassBoostEnabled: true, bassBoostDb: 2, voiceBoostEnabled: true,  voiceBoostDb: 1, labelKey: 'presetGames' },
  sports:     { bassBoostEnabled: true, bassBoostDb: 3, voiceBoostEnabled: true,  voiceBoostDb: 2, labelKey: 'presetSports' },
  broadcasts: { bassBoostEnabled: true, bassBoostDb: 1, voiceBoostEnabled: true,  voiceBoostDb: 4, labelKey: 'presetBroadcasts' },
  streams:    { bassBoostEnabled: true, bassBoostDb: 2, voiceBoostEnabled: true,  voiceBoostDb: 3, labelKey: 'presetStreams' }
};

// Previous preset values. A one-time migration retunes only exact legacy-preset matches;
// manually customised EQ values are preserved.
const LEGACY_AUDIO_PRESETS = {
  podcasts: { bassBoostEnabled: true, bassBoostDb: 2, voiceBoostEnabled: true, voiceBoostDb: 4 },
  music:    { bassBoostEnabled: true, bassBoostDb: 5, voiceBoostEnabled: false, voiceBoostDb: 0 },
  video:    { bassBoostEnabled: true, bassBoostDb: 4, voiceBoostEnabled: true, voiceBoostDb: 2 },
  movies:   { bassBoostEnabled: true, bassBoostDb: 6, voiceBoostEnabled: true, voiceBoostDb: 3 },
  games:    { bassBoostEnabled: true, bassBoostDb: 3, voiceBoostEnabled: true, voiceBoostDb: 2 },
  streams:  { bassBoostEnabled: true, bassBoostDb: 3, voiceBoostEnabled: true, voiceBoostDb: 4 }
};

// EN: Maps the current supported tab URL to its YouTube or Spotify profile key.
// RU: Определяет ключ профиля YouTube или Spotify для текущей вкладки.
// UK: Визначає ключ профілю YouTube або Spotify для поточної вкладки.
function getSiteProfileKeyForCurrentTab() {
  if (currentTabIsYouTubeVideo) return 'youtube';
  if (currentTabIsSpotifyWebPlayer) return 'spotify';
  return null;
}

// EN: Returns the storage key used for one site-specific audio profile.
// RU: Возвращает ключ хранилища для аудиопрофиля конкретного сайта.
// UK: Повертає ключ сховища для аудіопрофілю конкретного сайту.
function getServiceProfileStorageKey(key) {
  return key === 'youtube' ? 'youtubeAudioProfile' : 'spotifyAudioProfile';
}

// EN: Collects the controls belonging to a service-profile settings section.
// RU: Собирает элементы управления, относящиеся к настройкам профиля сервиса.
// UK: Збирає елементи керування, що належать до налаштувань профілю сервісу.
function getServiceProfileControlsList() {
  return Object.values(SERVICE_PROFILE_CONTROLS).flatMap((controls) => [
    controls.enabled, controls.volume, controls.bassEnabled, controls.bassDb,
    controls.voiceEnabled, controls.voiceDb, controls.limiter, controls.night
  ]).filter(Boolean);
}

// EN: Global/site profile helpers isolate preferences so YouTube and Spotify can keep different values.
// RU: Вспомогательные функции профилей разделяют параметры YouTube, Spotify и общие настройки.
// UK: Допоміжні функції профілів розділяють параметри YouTube, Spotify та загальні налаштування.
function snapshotGlobalAudioSettingsFromCurrentState() {
  globalAudioSettings = {
    volume: Math.min(6, Math.max(0, Number(slider.value) / 100 || 0)),
    muted: isMuted,
    bassBoostEnabled,
    bassBoostDb,
    voiceBoostEnabled,
    voiceBoostDb,
    peakLimiterEnabled,
    nightModeEnabled,
    activeAudioPreset,
    lastBoostValue: Math.min(600, Math.max(100, Number(lastBoostValue) || 200))
  };
}

// EN: Copies a profile into the main controls and refreshes their displayed values.
// RU: Переносит параметры профиля в основные элементы управления и обновляет значения.
// UK: Переносить параметри профілю до основних елементів керування та оновлює значення.
function applyAudioStateToMainControls(audioState) {
  if (!audioState) return;
  const normalized = { ...globalAudioSettings, ...audioState };
  slider.value = String(Math.round(Math.min(6, Math.max(0, Number(normalized.volume) || 0)) * 100));
  if (Object.prototype.hasOwnProperty.call(normalized, 'muted')) isMuted = normalized.muted === true;
  bassBoostEnabled = normalized.bassBoostEnabled === true;
  bassBoostDb = Math.min(12, Math.max(0, Math.round(Number(normalized.bassBoostDb) || 0)));
  voiceBoostEnabled = normalized.voiceBoostEnabled === true;
  voiceBoostDb = Math.min(8, Math.max(0, Math.round(Number(normalized.voiceBoostDb) || 0)));
  peakLimiterEnabled = normalized.peakLimiterEnabled !== false;
  nightModeEnabled = normalized.nightModeEnabled === true;
  activeAudioPreset = normalized.activeAudioPreset || 'custom';
  updateMuteButton();
  updateBassUI();
  updateVoiceUI();
  updateNightModeUI();
  updateProtectionUI();
  updateAudioPresetUI();
  updateUI(Number(slider.value));
}

// EN: Synchronizes service-profile switches, sliders, values, and labels from saved state.
// RU: Синхронизирует переключатели, ползунки и подписи профилей сервисов с сохранёнными данными.
// UK: Синхронізує перемикачі, повзунки й підписи профілів сервісів зі збереженими даними.
function syncServiceProfileUI() {
  for (const key of SERVICE_PROFILE_KEYS) {
    const profile = serviceAudioProfiles[key];
    const controls = SERVICE_PROFILE_CONTROLS[key];
    if (!controls || !profile) continue;
    controls.enabled.checked = profile.enabled;
    if (controls.quickEnabled) {
      controls.quickEnabled.checked = profile.enabled;
      controls.quickEnabled.disabled = !settingsPreferencesReady;
      controls.quickEnabled.setAttribute('aria-label', t(key === 'youtube' ? 'youtubeAudioProfileTitle' : 'spotifyAudioProfileTitle'));
    }
    controls.volume.value = String(Math.round(profile.volume * 100));
    controls.volumeValue.textContent = `${Math.round(profile.volume * 100)}%`;
    controls.bassEnabled.checked = profile.bassBoostEnabled;
    controls.bassDb.value = String(profile.bassBoostDb);
    controls.bassDbValue.textContent = `${profile.bassBoostDb} dB`;
    controls.voiceEnabled.checked = profile.voiceBoostEnabled;
    controls.voiceDb.value = String(profile.voiceBoostDb);
    controls.voiceDbValue.textContent = `${profile.voiceBoostDb} dB`;
    controls.limiter.checked = profile.peakLimiterEnabled;
    controls.night.checked = profile.nightModeEnabled;
    [controls.enabled, controls.volume, controls.bassEnabled, controls.bassDb, controls.voiceEnabled, controls.voiceDb, controls.limiter, controls.night]
      .filter(Boolean).forEach((control) => { control.disabled = !settingsPreferencesReady; });
  }
}

// EN: Initializes a new service profile from current global audio preferences.
// RU: Инициализирует новый профиль сервиса текущими общими аудионастройками.
// UK: Ініціалізує новий профіль сервісу поточними загальними аудіоналаштуваннями.
function seedServiceProfileFromGlobal(key) {
  const base = globalAudioSettings || {};
  serviceAudioProfiles[key] = {
    ...createDefaultServiceAudioProfile(true),
    enabled: true,
    volume: Number.isFinite(base.volume) ? Math.min(6, Math.max(0, base.volume)) : 1,
    bassBoostEnabled: typeof base.bassBoostEnabled === 'boolean' ? base.bassBoostEnabled : true,
    bassBoostDb: Number.isInteger(base.bassBoostDb) ? base.bassBoostDb : 4,
    voiceBoostEnabled: typeof base.voiceBoostEnabled === 'boolean' ? base.voiceBoostEnabled : true,
    voiceBoostDb: Number.isInteger(base.voiceBoostDb) ? base.voiceBoostDb : 2,
    peakLimiterEnabled: typeof base.peakLimiterEnabled === 'boolean' ? base.peakLimiterEnabled : true,
    nightModeEnabled: typeof base.nightModeEnabled === 'boolean' ? base.nightModeEnabled : false,
    activeAudioPreset: typeof base.activeAudioPreset === 'string' ? base.activeAudioPreset : 'default'
  };
  serviceAudioProfileConfigured[key] = true;
}

// EN: Selects the enabled site profile or falls back to global preferences.
// RU: Выбирает включённый профиль сайта либо возвращается к общим настройкам.
// UK: Вибирає ввімкнений профіль сайту або повертається до загальних налаштувань.
function activateServiceProfileForCurrentTab() {
  const tabProfileKey = getSiteProfileKeyForCurrentTab();
  const nextActiveKey = tabProfileKey && serviceAudioProfiles[tabProfileKey]?.enabled ? tabProfileKey : null;
  activePlatformProfileKey = nextActiveKey;
  if (nextActiveKey) {
    applyAudioStateToMainControls(serviceAudioProfiles[nextActiveKey]);
  } else {
    applyAudioStateToMainControls(globalAudioSettings);
  }
  syncServiceProfileUI();
}

// EN: Normalizes a service profile and persists it to local extension storage.
// RU: Нормализует профиль сервиса и сохраняет его в локальном хранилище расширения.
// UK: Нормалізує профіль сервісу та зберігає його в локальному сховищі розширення.
async function persistActiveServiceProfile(key) {
  const profile = normalizeServiceAudioProfile(serviceAudioProfiles[key]);
  serviceAudioProfiles[key] = profile;
  await writeLocalSettings({ [getServiceProfileStorageKey(key)]: profile });
  syncServiceProfileUI();
}

// EN: Applies an edited service profile when its matching site is currently active.
// RU: Применяет изменённый профиль, если сейчас активен соответствующий сайт.
// UK: Застосовує змінений профіль, якщо зараз активний відповідний сайт.
async function applyUpdatedServiceProfile(key) {
  if (getSiteProfileKeyForCurrentTab() !== key) return;
  if (serviceAudioProfiles[key].enabled) {
    activePlatformProfileKey = key;
    applyAudioStateToMainControls(serviceAudioProfiles[key]);
  } else if (activePlatformProfileKey === key) {
    activateServiceProfileForCurrentTab();
  }
  if (currentTabHasCapture()) {
    const applied = await sendVolume(Number(slider.value));
    if (!applied) showStatus(t('serviceProfileSavedPendingAudio'));
  }
}

// EN: Enables/disables one site profile, persists the choice, and rolls back on save failure.
// RU: Включает/выключает профиль сайта, сохраняет выбор и откатывает его при ошибке записи.
// UK: Вмикає/вимикає профіль сайту, зберігає вибір і відкочує його в разі помилки запису.
async function setServiceProfileEnabled(key, enabled) {
  const previousProfile = { ...serviceAudioProfiles[key] };
  const previousConfigured = serviceAudioProfileConfigured[key];
  const wasEnabled = previousProfile.enabled;
  if (enabled && !serviceAudioProfileConfigured[key]) seedServiceProfileFromGlobal(key);
  serviceAudioProfiles[key].enabled = enabled === true;
  try {
    await persistActiveServiceProfile(key);
    if (getSiteProfileKeyForCurrentTab() === key) {
      activateServiceProfileForCurrentTab();
      if (currentTabHasCapture() && wasEnabled !== serviceAudioProfiles[key].enabled) {
        const applied = await sendVolume(Number(slider.value));
        if (!applied) showStatus(t('serviceProfileSavedPendingAudio'));
      }
    }
  } catch (error) {
    // If saving the enable switch fails, restore the entire profile and its setup flag.
    // Если не удалось сохранить переключатель, восстанавливаем весь профиль и флаг его настройки.
    // Якщо не вдалося зберегти перемикач, відновлюємо весь профіль і прапорець його налаштування.
    serviceAudioProfiles[key] = previousProfile;
    serviceAudioProfileConfigured[key] = previousConfigured;
    syncServiceProfileUI();
    if (getSiteProfileKeyForCurrentTab() === key) activateServiceProfileForCurrentTab();
    showStatus(t('settingsSaveError'), true);
  }
}

// EN: Updates one profile field, refreshes its value label, and saves the profile.
// RU: Обновляет одно поле профиля, подпись значения и сохраняет профиль.
// UK: Оновлює одне поле профілю, підпис значення та зберігає профіль.
async function updateServiceProfileField(key, field, target) {
  const controls = SERVICE_PROFILE_CONTROLS[key];
  const previousProfile = { ...serviceAudioProfiles[key] };
  const previousConfigured = serviceAudioProfileConfigured[key];
  if (!serviceAudioProfileConfigured[key]) seedServiceProfileFromGlobal(key);
  const profile = serviceAudioProfiles[key];
  if (field === 'volume') profile.volume = Math.min(6, Math.max(0, Number(target.value) / 100));
  else if (field === 'bassBoostDb') profile.bassBoostDb = Math.min(12, Math.max(0, Number.parseInt(target.value, 10) || 0));
  else if (field === 'voiceBoostDb') profile.voiceBoostDb = Math.min(8, Math.max(0, Number.parseInt(target.value, 10) || 0));
  else if (field in profile && typeof profile[field] === 'boolean') profile[field] = target.checked === true;
  // Keep current profile slider outputs responsive while dragging; save on change.
  // Во время перетаскивания обновляем цифры сразу, а изменения сохраняем по завершении.
  // Під час перетягування одразу оновлюємо значення, а зміни зберігаємо після завершення.
  if (controls.volumeValue) controls.volumeValue.textContent = `${Math.round(profile.volume * 100)}%`;
  if (controls.bassDbValue) controls.bassDbValue.textContent = `${profile.bassBoostDb} dB`;
  if (controls.voiceDbValue) controls.voiceDbValue.textContent = `${profile.voiceBoostDb} dB`;
  try {
    await persistActiveServiceProfile(key);
    await applyUpdatedServiceProfile(key);
  } catch (error) {
    // Revert in-memory edits if persistence fails; never show unsaved values as saved.
    // При ошибке сохранения возвращаем прежние значения, чтобы интерфейс не показывал несохранённые настройки.
    // Якщо збереження не вдалося, повертаємо попередні значення, щоб не показувати незбережені налаштування.
    serviceAudioProfiles[key] = previousProfile;
    serviceAudioProfileConfigured[key] = previousConfigured;
    syncServiceProfileUI();
    showStatus(t('settingsSaveError'), true);
  }
}

// EN: Connects YouTube/Spotify settings controls to their persistence handlers.
// RU: Связывает элементы настроек YouTube/Spotify с обработчиками сохранения.
// UK: Пов’язує елементи налаштувань YouTube/Spotify з обробниками збереження.
function bindServiceProfileControls() {
  for (const key of SERVICE_PROFILE_KEYS) {
    const controls = SERVICE_PROFILE_CONTROLS[key];
    controls.enabled.addEventListener('change', (event) => { void setServiceProfileEnabled(key, event.target.checked); });
    if (controls.quickEnabled) controls.quickEnabled.addEventListener('change', (event) => { void setServiceProfileEnabled(key, event.target.checked); });
    const bindings = [
      [controls.volume, 'volume'], [controls.bassEnabled, 'bassBoostEnabled'], [controls.bassDb, 'bassBoostDb'],
      [controls.voiceEnabled, 'voiceBoostEnabled'], [controls.voiceDb, 'voiceBoostDb'],
      [controls.limiter, 'peakLimiterEnabled'], [controls.night, 'nightModeEnabled']
    ];
    bindings.forEach(([control, field]) => {
      if (!control) return;
      if (control.type === 'range') {
        control.addEventListener('input', () => {
          if (field === 'volume') controls.volumeValue.textContent = `${Number.parseInt(control.value, 10)}%`;
          if (field === 'bassBoostDb') controls.bassDbValue.textContent = `${control.value} dB`;
          if (field === 'voiceBoostDb') controls.voiceDbValue.textContent = `${control.value} dB`;
        });
      }
      control.addEventListener('change', (event) => { void updateServiceProfileField(key, field, event.target); });
    });
  }
}

// Prevent user input from racing initial storage reads or tab-capture startup.
// EN: Enables preference controls only after settings have loaded safely.
// RU: Разрешает изменение настроек только после безопасной загрузки параметров.
// UK: Дозволяє змінювати налаштування лише після безпечного завантаження параметрів.
function setSettingsPreferencesReady(ready) {
  const preferenceControls = [
    languageSelect, themeSelect, rgbGlowToggle,
    visualizerStyleSelect, visualizerPaletteSelect, visualizerGlowToggle, visualizerPeakHoldToggle,
    spectrogramGridToggle, spectrogramSmoothingToggle, spectrogramGlowToggle,
    visualizerSensitivitySlider, visualizerBandsSelect, spectrogramPaletteSelect,
    spectrogramDurationSelect, visualizerAnimationToggle,
    showFrequencyVisualizerToggle, showSpectrogramToggle,
    showBassBoostPanelToggle, showVoiceBoostPanelToggle, showClippingWarningToggle, showAllMessagesToggle, showCaptureStatusIndicatorToggle, showQuickSettingsToggle, autoGenreEnabledToggle,
    quickAutoGenreToggle, quickRgbGlowToggle, quickYoutubeProfileToggle, quickSpotifyProfileToggle, ...getServiceProfileControlsList(),
    energySavingToggle, energySavingModeSelect
  ];
  preferenceControls.forEach((control) => {
    if (control) control.disabled = !ready;
  });
  settingsPreferencesReady = ready;
  // Persistent audio options are configuration controls, not live-only transport controls.
  // Let users choose them before starting capture; the selection is saved for next time.
  updateBassUI();
  updateVoiceUI();
  updateProtectionUI();
  updateNightModeUI();
  updateEnergySavingUI();
  syncServiceProfileUI();
}


// EN: Reflects the saved energy-saving switch and mode in the UI.
// RU: Отображает сохранённый переключатель энергосбережения и выбранный режим.
// UK: Відображає збережений перемикач енергозбереження та вибраний режим.
function updateEnergySavingUI() {
  if (energySavingToggle) {
    energySavingToggle.checked = energySavingEnabled;
    energySavingToggle.disabled = !settingsPreferencesReady;
    energySavingToggle.setAttribute('aria-label', t('energySavingToggleLabel'));
  }
  if (energySavingModeSelect) {
    energySavingModeSelect.value = ENERGY_SAVING_MODES.includes(energySavingMode) ? energySavingMode : 'balanced';
    energySavingModeSelect.disabled = !settingsPreferencesReady || !energySavingEnabled;
    energySavingModeSelect.setAttribute('aria-label', t('energySavingModeLabel'));
  }
}

// EN: Returns the visualization sample interval for the active performance mode.
// RU: Возвращает интервал выборки визуализации для текущего режима производительности.
// UK: Повертає інтервал вибірки візуалізації для поточного режиму продуктивності.
function getEnergySavingSampleIntervalMs() {
  return getEnergySavingProfile().sampleIntervalMs;
}

// EN: Persists energy-saving choices and reconfigures visualization sampling.
// RU: Сохраняет параметры энергосбережения и перенастраивает частоту визуализации.
// UK: Зберігає параметри енергозбереження та переналаштовує частоту візуалізації.
async function setEnergySavingPreferences(enabled, mode) {
  if (typeof enabled !== 'boolean' || !ENERGY_SAVING_MODES.includes(mode)) return;
  const previous = { energySavingEnabled, energySavingMode };
  energySavingEnabled = enabled;
  energySavingMode = mode;
  updateEnergySavingUI();
  spectrogramState.maxRows = Math.max(1, Math.round((spectrogramDuration * 1000) / getEnergySavingProfile().sampleIntervalMs));
  if (spectrogramState.history.length > spectrogramState.maxRows) spectrogramState.history.length = spectrogramState.maxRows;
  resizeSpectrumCanvas();
  resizeSpectrogramCanvas();
  if (showFrequencyVisualizer && !visualizerAnimationEnabled) drawSpectrum(0, true);

  try {
    await writeLocalSettings({ energySavingEnabled, energySavingMode });
    const runtimeApplied = await persistVisualizerOptionsToBackground();
    if (!runtimeApplied && spectrumState.captureActive) throw new Error('Could not apply sampling interval');
    if (shouldRenderFrequencySpectrum() && spectrumState.captureActive) {
      stopSpectrumRendering();
      startSpectrumRendering();
    }
    showStatus(t(energySavingEnabled ? 'energySavingEnabledStatus' : 'energySavingDisabledStatus'));
  } catch (error) {
    energySavingEnabled = previous.energySavingEnabled;
    energySavingMode = previous.energySavingMode;
    await writeLocalSettings(previous).catch(() => {});
    updateEnergySavingUI();
    spectrogramState.maxRows = Math.max(1, Math.round((spectrogramDuration * 1000) / getEnergySavingProfile().sampleIntervalMs));
    if (spectrogramState.history.length > spectrogramState.maxRows) spectrogramState.history.length = spectrogramState.maxRows;
    resizeSpectrumCanvas();
    resizeSpectrogramCanvas();
    await persistVisualizerOptionsToBackground();
    if (shouldRenderFrequencySpectrum() && spectrumState.captureActive) {
      stopSpectrumRendering();
      startSpectrumRendering();
    }
    showStatus(t('energySavingSaveError'), true);
  }
}

// EN: Enables export/import/reset controls after settings initialization.
// RU: Разрешает экспорт, импорт и сброс после инициализации настроек.
// UK: Дозволяє експорт, імпорт і скидання після ініціалізації налаштувань.
function setSettingsBackupReady(ready) {
  [factoryResetBtn, exportSettingsBtn, importSettingsBtn, settingsImportFile].forEach((control) => {
    if (control) control.disabled = !ready;
  });
}

setAudioControlsReady(false);
setSettingsPreferencesReady(false);
setSettingsBackupReady(false);

// EN: Updates the extension toolbar badge with the current volume percentage.
// RU: Обновляет значок расширения на панели браузера текущим процентом громкости.
// UK: Оновлює значок розширення на панелі браузера поточним відсотком гучності.
function updateBadge(value) {
  const text = value === 100 || value === 0 ? '' : `${Math.round(value)}`;
  chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', text }).catch((error) => {
    console.debug('Could not update the extension badge:', error?.message || error);
  });
}

// EN: Refreshes the main volume number, slider fill, presets, badge, and risk indicators.
// RU: Обновляет число громкости, заполнение ползунка, пресеты, значок и индикаторы риска.
// UK: Оновлює число гучності, заповнення повзунка, пресети, значок та індикатори ризику.
function updateUI(value) {
  const percent = Math.round(value);
  // Update a text node instead of parsing dynamic content as HTML.
  volumeNumberText.textContent = String(percent);
  volumeValue.classList.toggle('boosted', percent > 100);
  sliderFill.style.width = `${(percent / 600) * 100}%`;
  updateBadge(percent);
  presetBtns.forEach(btn => {
    btn.classList.toggle('active', Number.parseInt(btn.dataset.value, 10) === percent);
  });
  updateProtectionUI();
}

// EN: Reflects mute state in the button style, accessible label, and protection UI.
// RU: Отображает состояние mute в кнопке, доступной подписи и блоке защиты.
// UK: Відображає стан mute у кнопці, доступному підписі та блоці захисту.
function updateMuteButton() {
  if (!muteButton) return;
  const label = t(isMuted ? 'unmuteAction' : 'muteAction');
  muteButton.classList.toggle('is-muted', isMuted);
  muteButton.setAttribute('aria-pressed', String(isMuted));
  muteButton.setAttribute('aria-label', label);
  muteButton.title = label;
  updateProtectionUI();
}

// EN: Shows/hides the Bass Boost and Voice Boost cards from saved preferences.
// RU: Показывает или скрывает карточки Bass Boost и Voice Boost согласно настройкам.
// UK: Показує або приховує картки Bass Boost і Voice Boost відповідно до налаштувань.
function updateAudioPanelVisibilityUI() {
  if (showBassBoostPanelToggle) {
    showBassBoostPanelToggle.checked = showBassBoostPanel;
    showBassBoostPanelToggle.disabled = !settingsPreferencesReady;
    showBassBoostPanelToggle.setAttribute('aria-label', t('showBassBoostPanelLabel'));
  }
  if (showVoiceBoostPanelToggle) {
    showVoiceBoostPanelToggle.checked = showVoiceBoostPanel;
    showVoiceBoostPanelToggle.disabled = !settingsPreferencesReady;
    showVoiceBoostPanelToggle.setAttribute('aria-label', t('showVoiceBoostPanelLabel'));
  }
  if (bassBoostPanel) bassBoostPanel.hidden = !showBassBoostPanel;
  if (voiceBoostPanel) voiceBoostPanel.hidden = !showVoiceBoostPanel;
}

// EN: Persists a card visibility choice and restores the old value on failure.
// RU: Сохраняет видимость карточки и восстанавливает прежнее значение при ошибке.
// UK: Зберігає видимість картки та відновлює попереднє значення в разі помилки.
async function setAudioPanelVisibility(kind, enabled) {
  const isBass = kind === 'bass';
  const current = isBass ? showBassBoostPanel : showVoiceBoostPanel;
  const next = enabled === true;
  if (current === next) return;
  if (isBass) showBassBoostPanel = next;
  else showVoiceBoostPanel = next;
  updateAudioPanelVisibilityUI();
  try {
    await writeLocalSettings(isBass ? { showBassBoostPanel: next } : { showVoiceBoostPanel: next });
  } catch (error) {
    if (isBass) showBassBoostPanel = current;
    else showVoiceBoostPanel = current;
    updateAudioPanelVisibilityUI();
    showStatus(t('settingsSaveError'), true);
  }
}

// EN: Genre-mode helpers decide which dB value is actually applied and keep the UI synced with the audio graph.
// RU: Функции жанрового режима выбирают реально применяемое значение dB и синхронизируют интерфейс с аудиографом.
// UK: Функції жанрового режиму обирають фактично застосоване значення dB і синхронізують інтерфейс з аудіографом.
function getAvailableAutoGenreProfile(kind) {
  const dbKey = kind === 'bass' ? 'bassBoostDb' : 'voiceBoostDb';
  const enabledKey = kind === 'bass' ? 'bassBoostEnabled' : 'voiceBoostEnabled';
  if (!autoGenreEnabled || autoGenreStatus.enabled !== true || autoGenreStatus.active !== true ||
      !Object.prototype.hasOwnProperty.call(AUTO_GENRE_LABELS, autoGenreStatus.genre) ||
      typeof autoGenreStatus[enabledKey] !== 'boolean' || !Number.isFinite(autoGenreStatus[dbKey])) return null;
  return {
    genre: autoGenreStatus.genre,
    enabled: autoGenreStatus[enabledKey],
    db: Math.max(0, Math.min(kind === 'bass' ? 12 : 8, Math.round(autoGenreStatus[dbKey])))
  };
}

// EN: Returns the effective automatic Bass Boost profile unless manual override is selected.
// RU: Возвращает автоматический профиль Bass Boost, если не выбран ручной режим.
// UK: Повертає автоматичний профіль Bass Boost, якщо не вибрано ручний режим.
function getAppliedAutoBassProfile() {
  if (autoGenreBassManualOverride) return null;
  return getAvailableAutoGenreProfile('bass');
}

// EN: Synchronizes the Bass Boost power switch, dB slider, mode badge, and disabled styling.
// RU: Синхронизирует питание Bass Boost, ползунок dB, режим и серое состояние карточки.
// UK: Синхронізує живлення Bass Boost, повзунок dB, режим і сірий стан картки.
function updateBassUI() {
  const availableProfile = getAvailableAutoGenreProfile('bass');
  const autoProfile = getAppliedAutoBassProfile();
  // The badge displays the current selected mode. The title explains the alternate
  // mode that will be selected when clicked. The preference is independent of track status.
  const manualOverride = autoGenreBassManualOverride;
  // Always show the current mode while genre automation is enabled, even before a track is captured.
  const canSwitchGenreMode = autoGenreEnabled;
  // AUTO / РУЧНОЙ selects the source of the intensity value only. The separate
  // Bass Boost switch owns effect power, so changing mode must never grey the card.
  const displayedBassEnabled = bassBoostEnabled;
  const displayedBassDb = displayedBassEnabled ? (autoProfile ? autoProfile.db : bassBoostDb) : 0;
  const autoProfileLabel = availableProfile ? t(AUTO_GENRE_LABELS[availableProfile.genre]) : '';

  bassBoostValue.textContent = displayedBassEnabled && autoProfile && autoProfile.db === 0
    ? t('autoZeroDbLabel')
    : `${displayedBassDb > 0 ? '+' : ''}${displayedBassDb} dB`;
  if (bassBoostPanel) bassBoostPanel.classList.toggle('is-effect-disabled', !displayedBassEnabled);
  bassBoostToggle.checked = displayedBassEnabled;
  if (quickBassBoostToggle) { quickBassBoostToggle.checked = displayedBassEnabled; quickBassBoostToggle.disabled = !settingsPreferencesReady; quickBassBoostToggle.setAttribute('aria-label', t('serviceProfileBassEnabledLabel')); }
  // The main audio-card toggle is transport-aware; the settings and quick toggles
  // remain usable without an active capture and save their values for the next session.
  bassBoostToggle.disabled = !audioControlsReady;
  if (settingsBassBoostToggle) {
    settingsBassBoostToggle.checked = displayedBassEnabled;
    settingsBassBoostToggle.disabled = !settingsPreferencesReady;
    settingsBassBoostToggle.setAttribute('aria-label', t('bassEffectEnabledLabel'));
  }
  bassBoostSlider.value = String(displayedBassDb);
  // A disabled effect is shown grey and its intensity slider is inactive.
  // Turn the effect back on with the toggle; the saved intensity is preserved.
  bassBoostSlider.disabled = !audioControlsReady || !displayedBassEnabled;
  bassBoostSlider.classList.toggle('is-auto-adjusted', Boolean(autoProfile));
  if (bassBoostAutoBadge) {
    bassBoostAutoBadge.hidden = !canSwitchGenreMode;
    // Show the current mode; the tooltip describes the mode switch action.
    bassBoostAutoBadge.textContent = manualOverride ? t('manualOverrideBadge') : t('bassAutoBadge');
    bassBoostAutoBadge.title = manualOverride
      ? t('manualOverrideTitle')
      : t('manualModeSwitchTitle');
    bassBoostAutoBadge.setAttribute('aria-label', bassBoostAutoBadge.title);
    bassBoostAutoBadge.setAttribute('aria-pressed', String(manualOverride));
  }
  bassBoostSlider.setAttribute('aria-valuetext', autoProfile
    ? t('bassAutoValueTitle', { genre: autoProfileLabel, value: displayedBassDb })
    : `${displayedBassDb} dB`);
  bassBoostSlider.setAttribute('title', autoProfile
    ? t('bassAutoValueTitle', { genre: autoProfileLabel, value: displayedBassDb })
    : t('bassSliderLabel'));
  updateProtectionUI();
}

// EN: Returns the effective automatic Voice Boost profile unless manual override is selected.
// RU: Возвращает автоматический профиль Voice Boost, если не выбран ручной режим.
// UK: Повертає автоматичний профіль Voice Boost, якщо не вибрано ручний режим.
function getAppliedAutoVoiceProfile() {
  if (autoGenreVoiceManualOverride) return null;
  return getAvailableAutoGenreProfile('voice');
}

// EN: Synchronizes the Voice Boost switch, dB slider, mode badge, and disabled styling.
// RU: Синхронизирует питание Voice Boost, ползунок dB, плашку режима и серое состояние карточки.
// UK: Синхронізує живлення Voice Boost, повзунок dB, плашку режиму та сірий стан картки.
function updateVoiceUI() {
  const availableProfile = getAvailableAutoGenreProfile('voice');
  const autoProfile = getAppliedAutoVoiceProfile();
  // Keep the mode switch present while in manual mode, even during transient
  // genre-status updates. The Voice Boost panel visibility is controlled only by
  // the user's dedicated "show panel" preference, never by Auto/Manual mode.
  const manualOverride = autoGenreVoiceManualOverride;
  // Keep the labeled mode button available while genre automation is enabled.
  const canSwitchGenreMode = autoGenreEnabled;
  // AUTO / РУЧНОЙ selects the source of the intensity value only. The separate
  // Voice Boost switch owns effect power, mirroring Bass Boost behavior.
  const displayedVoiceEnabled = voiceBoostEnabled;
  const displayedVoiceDb = displayedVoiceEnabled ? (autoProfile ? autoProfile.db : voiceBoostDb) : 0;
  const autoProfileLabel = availableProfile ? t(AUTO_GENRE_LABELS[availableProfile.genre]) : '';

  // Keep the numeric value separate from the mode badge; never append AUTO to dB.
  voiceBoostValue.textContent = `${displayedVoiceDb > 0 ? '+' : ''}${displayedVoiceDb} dB`;
  if (voiceBoostPanel) voiceBoostPanel.classList.toggle('is-effect-disabled', !displayedVoiceEnabled);
  voiceBoostToggle.checked = displayedVoiceEnabled;
  if (quickVoiceBoostToggle) { quickVoiceBoostToggle.checked = displayedVoiceEnabled; quickVoiceBoostToggle.disabled = !settingsPreferencesReady; quickVoiceBoostToggle.setAttribute('aria-label', t('serviceProfileVoiceEnabledLabel')); }
  voiceBoostToggle.disabled = !audioControlsReady;
  if (settingsVoiceBoostToggle) {
    settingsVoiceBoostToggle.checked = displayedVoiceEnabled;
    settingsVoiceBoostToggle.disabled = !settingsPreferencesReady;
    settingsVoiceBoostToggle.setAttribute('aria-label', t('voiceEffectEnabledLabel'));
  }
  voiceBoostSlider.value = String(displayedVoiceDb);
  // A disabled effect is shown grey and its intensity slider is inactive.
  // Turn the effect back on with the toggle; the saved intensity is preserved.
  voiceBoostSlider.disabled = !audioControlsReady || !displayedVoiceEnabled;
  voiceBoostSlider.classList.toggle('is-auto-adjusted', Boolean(autoProfile));
  if (voiceBoostAutoBadge) {
    voiceBoostAutoBadge.hidden = !canSwitchGenreMode;
    // Match Bass Boost: the button itself displays the active AUTO/MANUAL mode.
    // The adjacent dB value remains numeric only (for example, "0 dB").
    voiceBoostAutoBadge.textContent = manualOverride ? t('manualOverrideBadge') : t('bassAutoBadge');
    voiceBoostAutoBadge.title = manualOverride
      ? t('manualOverrideTitle')
      : t('manualModeSwitchTitle');
    voiceBoostAutoBadge.setAttribute('aria-label', voiceBoostAutoBadge.title);
    voiceBoostAutoBadge.setAttribute('aria-pressed', String(manualOverride));
  }
  voiceBoostSlider.setAttribute('aria-valuetext', autoProfile
    ? t('bassAutoValueTitle', { genre: autoProfileLabel, value: displayedVoiceDb })
    : `${displayedVoiceDb} dB`);
  voiceBoostSlider.setAttribute('title', autoProfile
    ? t('bassAutoValueTitle', { genre: autoProfileLabel, value: displayedVoiceDb })
    : t('voiceSliderLabel'));
  updateProtectionUI();
}

// EN: Stores whether Bass/Voice Boost uses manual values instead of the detected genre.
// RU: Сохраняет выбор ручного значения вместо профиля определённого жанра.
// UK: Зберігає вибір ручного значення замість профілю визначеного жанру.
function setGenreParameterOverride(kind, enabled, refresh = true) {
  const isBass = kind === 'bass';
  const next = enabled === true;
  const previous = isBass ? autoGenreBassManualOverride : autoGenreVoiceManualOverride;
  if (isBass) {
    autoGenreBassManualOverride = next;
    autoGenreStatus = { ...autoGenreStatus, bassManualOverride: next };
  } else {
    autoGenreVoiceManualOverride = next;
    autoGenreStatus = { ...autoGenreStatus, voiceManualOverride: next };
  }
  if (previous !== next) {
    void writeLocalSettings({
      autoGenreBassManualOverride,
      autoGenreVoiceManualOverride,
      genreParameterModeVersion: GENRE_PARAMETER_MODE_VERSION
    }).catch((error) => console.warn('Could not save EQ control mode:', error));
  }
  if (refresh) {
    if (isBass) updateBassUI(); else updateVoiceUI();
  }
}

// EN: Switches one EQ control between AUTO and MANUAL without changing effect power.
// RU: Переключает один регулятор EQ между AUTO и РУЧНОЙ, не меняя питание эффекта.
// UK: Перемикає один регулятор EQ між AUTO та РУЧНИЙ, не змінюючи стан ефекту.
async function toggleGenreParameterMode(kind) {
  const isBass = kind === 'bass';
  const currentManual = isBass ? autoGenreBassManualOverride : autoGenreVoiceManualOverride;

  // AUTO/MANUAL only selects whether the genre profile or the saved manual dB value
  // is used. It never changes the independent power toggle for either effect.
  setGenreParameterOverride(kind, !currentManual, false);
  if (isBass) updateBassUI(); else updateVoiceUI();
  updateProtectionUI();
  await sendVolume(Number.parseInt(slider.value, 10));
}

// EN: Checks the effective current EQ and volume for an excessive-gain warning.
// RU: Проверяет текущие эффективные EQ и громкость на риск чрезмерного усиления.
// UK: Перевіряє поточні ефективні EQ і гучність на ризик надмірного підсилення.
function hasExcessiveGainRisk() {
  const volumePercent = Number.parseInt(slider.value, 10) || 0;
  if (isMuted || volumePercent <= 0) return false;
  const autoBassProfile = getAppliedAutoBassProfile();
  const autoVoiceProfile = getAppliedAutoVoiceProfile();
  // Risk warnings must reflect the user's independent power switches as well as the active genre profile.
  const effectiveBassEnabled = bassBoostEnabled && (!autoBassProfile || autoBassProfile.enabled);
  const effectiveBassDb = autoBassProfile ? autoBassProfile.db : bassBoostDb;
  const effectiveVoiceEnabled = voiceBoostEnabled && (!autoVoiceProfile || autoVoiceProfile.enabled);
  const effectiveVoiceDb = autoVoiceProfile ? autoVoiceProfile.db : voiceBoostDb;
  return volumePercent >= 500 ||
    (volumePercent >= 300 && effectiveBassEnabled && effectiveBassDb >= 3) ||
    (volumePercent >= 400 && effectiveVoiceEnabled && effectiveVoiceDb >= 5);
}

// EN: Protection state combines limiter preference, recent clipping samples and a high-gain warning.
// RU: Состояние защиты объединяет настройку ограничителя, недавние пики и предупреждение о чрезмерном усилении.
// UK: Стан захисту поєднує налаштування обмежувача, недавні піки та попередження про надмірне підсилення.
function updateProtectionUI() {
  if (!audioProtectionIndicator || !audioProtectionTitle || !audioProtectionDescription || !peakLimiterBadge) return;
  const highGain = hasExcessiveGainRisk();
  let state = 'safe';
  let titleKey = 'protectionSafeTitle';
  let descriptionKey = 'protectionSafeDescription';

  if (peakClippingDetected) {
    state = 'clipping';
    titleKey = peakLimiterEnabled ? 'protectionClippingLimitedTitle' : 'protectionClippingUnprotectedTitle';
    descriptionKey = peakLimiterEnabled ? 'protectionClippingLimitedDescription' : 'protectionClippingUnprotectedDescription';
  } else if (highGain) {
    state = 'warning';
    titleKey = 'protectionHighGainTitle';
    descriptionKey = 'protectionHighGainDescription';
  } else if (!peakLimiterEnabled) {
    state = 'limiter-off';
    titleKey = 'protectionLimiterOffTitle';
    descriptionKey = 'protectionLimiterOffDescription';
  } else if (!protectionMonitorActive) {
    state = 'waiting';
    titleKey = 'protectionWaitingTitle';
    descriptionKey = 'protectionWaitingDescription';
  }

  // This preference controls visibility of the entire protection status card, including
  // the “Peak limiter is off” message. Peak detection and audio protection keep running.
  audioProtectionIndicator.hidden = !showAllMessages || !showClippingWarning;
  audioProtectionIndicator.dataset.state = state;
  audioProtectionTitle.textContent = t(titleKey);
  audioProtectionDescription.textContent = t(descriptionKey);
  peakLimiterBadge.textContent = t(peakLimiterEnabled ? 'limiterEnabled' : 'limiterDisabled');
  if (peakLimiterToggle) {
    peakLimiterToggle.checked = peakLimiterEnabled;
    peakLimiterToggle.disabled = !settingsPreferencesReady;
  }
  if (quickPeakLimiterToggle) {
    quickPeakLimiterToggle.checked = peakLimiterEnabled;
    quickPeakLimiterToggle.disabled = !settingsPreferencesReady;
  }
}

// EN: Synchronizes the preference that shows or hides clipping warning messages.
// RU: Синхронизирует настройку отображения предупреждений о пиках.
// UK: Синхронізує налаштування показу попереджень про піки.
function updateClippingWarningSettingUI() {
  if (!showClippingWarningToggle) return;
  showClippingWarningToggle.checked = showClippingWarning;
  showClippingWarningToggle.disabled = !settingsPreferencesReady;
  showClippingWarningToggle.setAttribute('aria-label', t('showClippingWarningLabel'));
}

// EN: Saves clipping-warning visibility and reverts the switch if saving fails.
// RU: Сохраняет видимость предупреждений о пиках и откатывает переключатель при ошибке.
// UK: Зберігає видимість попереджень про піки та відкочує перемикач у разі помилки.
async function setShowClippingWarning(enabled) {
  const previous = showClippingWarning;
  showClippingWarning = enabled === true;
  updateClippingWarningSettingUI();
  updateProtectionUI();
  try {
    await writeLocalSettings({ showClippingWarning });
  } catch (error) {
    showClippingWarning = previous;
    updateClippingWarningSettingUI();
    updateProtectionUI();
    showStatus(t('settingsSaveError'), true);
  }
}

// EN: Synchronizes the preference and visibility of the capture-status card.
// RU: Синхронизирует настройку и видимость карточки состояния захвата.
// UK: Синхронізує налаштування та видимість картки стану захоплення.
function updateCaptureStatusIndicatorVisibilityUI() {
  if (showCaptureStatusIndicatorToggle) {
    showCaptureStatusIndicatorToggle.checked = showCaptureStatusIndicator;
    showCaptureStatusIndicatorToggle.disabled = !settingsPreferencesReady;
    showCaptureStatusIndicatorToggle.setAttribute('aria-label', t('showCaptureStatusIndicatorLabel'));
  }
  if (captureStatusIndicator) captureStatusIndicator.hidden = !showAllMessages || !showCaptureStatusIndicator;
  if (showCaptureStatusIndicator) updateCaptureStatusIndicator();
}

// EN: Persists capture-status visibility and restores the old choice on failure.
// RU: Сохраняет видимость статуса захвата и восстанавливает прежний выбор при ошибке.
// UK: Зберігає видимість стану захоплення та відновлює попередній вибір у разі помилки.
async function setShowCaptureStatusIndicator(enabled) {
  const previous = showCaptureStatusIndicator;
  showCaptureStatusIndicator = enabled === true;
  updateCaptureStatusIndicatorVisibilityUI();
  try {
    await writeLocalSettings({ showCaptureStatusIndicator });
  } catch (error) {
    showCaptureStatusIndicator = previous;
    updateCaptureStatusIndicatorVisibilityUI();
    showStatus(t('settingsSaveError'), true);
  }
}

// EN: Master visibility control for every extension message/card; audio logic remains unchanged.
// RU: Главный переключатель всех сообщений/карточек расширения; логика обработки аудио не меняется.
// UK: Головний перемикач усіх повідомлень/карток розширення; логіка обробки аудіо не змінюється.
function updateAllMessagesVisibilityUI() {
  if (showAllMessagesToggle) {
    showAllMessagesToggle.checked = showAllMessages;
    showAllMessagesToggle.disabled = !settingsPreferencesReady;
    showAllMessagesToggle.setAttribute('aria-label', t('showAllMessagesLabel'));
  }

  // The regular status line is a transient notice surface, not an audio control.
  if (status) {
    status.hidden = !showAllMessages;
    if (!showAllMessages) {
      clearTimeout(statusTimer);
      status.textContent = '';
      status.classList.remove('success', 'error');
    } else if (!status.textContent) {
      status.textContent = t('ready');
    }
  }
  // The LIVE/IDLE label is also a status badge; hiding it does not stop the visualizer.
  if (visualizerLive) {
    visualizerLive.hidden = !showAllMessages;
    visualizerLive.setAttribute('aria-live', showAllMessages ? 'polite' : 'off');
  }

  // Re-render each card using the master flag plus its individual preference.
  updateCaptureStatusIndicatorVisibilityUI();
  updateProtectionUI();
  updateAutoGenreStatusUI();
}

// EN: Saves the master message switch, restoring its previous value if storage fails.
// RU: Сохраняет общий переключатель сообщений и восстанавливает прежнее значение при ошибке записи.
// UK: Зберігає головний перемикач повідомлень і відновлює попереднє значення, якщо запис не вдався.
async function setShowAllMessages(enabled) {
  const previous = showAllMessages;
  showAllMessages = enabled === true;
  updateAllMessagesVisibilityUI();
  try {
    await writeLocalSettings({ showAllMessages });
  } catch (error) {
    showAllMessages = previous;
    updateAllMessagesVisibilityUI();
    showStatus(t('settingsSaveError'), true);
  }
}

// EN: Shows or hides the quick-settings group and updates its settings toggle.
// RU: Показывает или скрывает блок быстрых настроек и обновляет его переключатель.
// UK: Показує або приховує блок швидких налаштувань та оновлює його перемикач.
function updateQuickSettingsVisibilityUI() {
  if (showQuickSettingsToggle) {
    showQuickSettingsToggle.checked = showQuickSettings;
    showQuickSettingsToggle.disabled = !settingsPreferencesReady;
    showQuickSettingsToggle.setAttribute('aria-label', t('showQuickSettingsLabel'));
  }
  if (quickSettingsPanel) quickSettingsPanel.hidden = !showQuickSettings;
}

// EN: Persists the visibility preference for the quick-settings group.
// RU: Сохраняет настройку видимости блока быстрых настроек.
// UK: Зберігає налаштування видимості блоку швидких налаштувань.
async function setShowQuickSettings(enabled) {
  const previous = showQuickSettings;
  showQuickSettings = enabled === true;
  updateQuickSettingsVisibilityUI();
  try {
    await writeLocalSettings({ showQuickSettings });
  } catch (error) {
    showQuickSettings = previous;
    updateQuickSettingsVisibilityUI();
    showStatus(t('settingsSaveError'), true);
  }
}

const AUTO_GENRE_LABELS = {
  hiphop: 'autoGenreHipHop',
  trap: 'autoGenreTrap',
  drill: 'autoGenreDrill',
  grime: 'autoGenreGrime',
  phonk: 'autoGenrePhonk',
  wave: 'autoGenreWave',
  lofi: 'autoGenreLofi',
  ambient: 'autoGenreAmbient',
  newAge: 'autoGenreNewAge',
  chillout: 'autoGenreChillout',
  pop: 'autoGenrePop',
  dancePop: 'autoGenreDancePop',
  kpop: 'autoGenreKpop',
  jpop: 'autoGenreJpop',
  indiePop: 'autoGenreIndiePop',
  hyperpop: 'autoGenreHyperpop',
  rock: 'autoGenreRock',
  altRock: 'autoGenreAltRock',
  hardRock: 'autoGenreHardRock',
  postRock: 'autoGenrePostRock',
  metal: 'autoGenreMetal',
  metalcore: 'autoGenreMetalcore',
  punk: 'autoGenrePunk',
  indie: 'autoGenreIndie',
  grunge: 'autoGenreGrunge',
  emo: 'autoGenreEmo',
  shoegaze: 'autoGenreShoegaze',
  jazz: 'autoGenreJazz',
  blues: 'autoGenreBlues',
  funk: 'autoGenreFunk',
  soul: 'autoGenreSoul',
  rnb: 'autoGenreRnb',
  disco: 'autoGenreDisco',
  country: 'autoGenreCountry',
  folk: 'autoGenreFolk',
  bluegrass: 'autoGenreBluegrass',
  acoustic: 'autoGenreAcoustic',
  classical: 'autoGenreClassical',
  orchestral: 'autoGenreOrchestral',
  soundtrack: 'autoGenreSoundtrack',
  gameMusic: 'autoGenreGameMusic',
  animeMusic: 'autoGenreAnimeMusic',
  opera: 'autoGenreOpera',
  electronic: 'autoGenreElectronic',
  house: 'autoGenreHouse',
  deepHouse: 'autoGenreDeepHouse',
  progressiveHouse: 'autoGenreProgressiveHouse',
  techno: 'autoGenreTechno',
  trance: 'autoGenreTrance',
  dubstep: 'autoGenreDubstep',
  drumBass: 'autoGenreDrumBass',
  jungle: 'autoGenreJungle',
  breakbeat: 'autoGenreBreakbeat',
  electro: 'autoGenreElectro',
  hardstyle: 'autoGenreHardstyle',
  synthwave: 'autoGenreSynthwave',
  vaporwave: 'autoGenreVaporwave',
  tripHop: 'autoGenreTripHop',
  garage: 'autoGenreGarage',
  reggae: 'autoGenreReggae',
  dancehall: 'autoGenreDancehall',
  ska: 'autoGenreSka',
  reggaeton: 'autoGenreReggaeton',
  salsa: 'autoGenreSalsa',
  bachata: 'autoGenreBachata',
  cumbia: 'autoGenreCumbia',
  afrobeats: 'autoGenreAfrobeats',
  amapiano: 'autoGenreAmapiano',
  gospel: 'autoGenreGospel',
  latin: 'autoGenreLatin',
  bossaNova: 'autoGenreBossaNova',
  samba: 'autoGenreSamba',
  tango: 'autoGenreTango',
  flamenco: 'autoGenreFlamenco',
  bollywood: 'autoGenreBollywood',
  experimental: 'autoGenreExperimental',
  audioBassHeavy: 'autoGenreAudioBassHeavy',
  audioElectronic: 'autoGenreAudioElectronic',
  audioAtmospheric: 'autoGenreAudioAtmospheric',
  audioVocal: 'autoGenreAudioVocal',
  audioOther: 'autoGenreAudioOther'
};

// EN: Displays detected track/genre status and syncs quick toggles with stored preferences.
// RU: Показывает состояние трека/жанра и синхронизирует быстрые переключатели с настройками.
// UK: Показує стан треку/жанру та синхронізує швидкі перемикачі з налаштуваннями.
function updateAutoGenreStatusUI() {
  const setTextIfChanged = (element, value) => {
    if (element && element.textContent !== value) element.textContent = value;
  };
  if (autoGenreEnabledToggle) {
    autoGenreEnabledToggle.checked = autoGenreEnabled;
    autoGenreEnabledToggle.disabled = !settingsPreferencesReady;
    autoGenreEnabledToggle.setAttribute('aria-label', t('autoGenreLabel'));
  }
  updateBassUI();
  updateVoiceUI();
  // Keep quick toggles synchronized even if the status card is hidden or removed.
  // Синхронизируем быстрые переключатели, даже если карточка статуса скрыта или отсутствует.
  // Синхронізуємо швидкі перемикачі, навіть якщо картку стану приховано або видалено.
  if (quickAutoGenreToggle) {
    quickAutoGenreToggle.checked = autoGenreEnabled;
    quickAutoGenreToggle.disabled = !settingsPreferencesReady;
    quickAutoGenreToggle.setAttribute('aria-label', t('autoGenreLabel'));
  }
  if (quickRgbGlowToggle) {
    quickRgbGlowToggle.checked = rgbGlowEnabled;
    quickRgbGlowToggle.disabled = !settingsPreferencesReady;
    quickRgbGlowToggle.setAttribute('aria-label', t('rgbGlow'));
  }
  if (!autoGenreStatusCard || !autoGenreStatusTitle || !autoGenreStatusDescription || !autoGenreStatusBadge) return;
  autoGenreStatusCard.hidden = !showAllMessages || !autoGenreEnabled;
  if (!autoGenreEnabled) {
    if (autoGenreProfileDetails) autoGenreProfileDetails.hidden = true;
    if (autoGenreTrackTitle) autoGenreTrackTitle.hidden = true;
    return;
  }
  if (autoGenreTrackTitle) {
    setTextIfChanged(autoGenreTrackTitle, autoGenreStatus.trackTitle ? t('autoGenreCurrentTrack', { track: autoGenreStatus.trackTitle }) : '');
    autoGenreTrackTitle.hidden = !autoGenreStatus.active || !autoGenreStatus.trackTitle;
    autoGenreTrackTitle.title = autoGenreStatus.trackTitle || '';
  }

  const genre = Object.prototype.hasOwnProperty.call(AUTO_GENRE_LABELS, autoGenreStatus.genre)
    ? autoGenreStatus.genre : null;
  if (!autoGenreStatus.active) {
    autoGenreStatusCard.dataset.state = 'waiting';
    setTextIfChanged(autoGenreStatusTitle, t('autoGenreCardTitle'));
    setTextIfChanged(autoGenreStatusDescription, t('autoGenreWaitingCapture'));
    setTextIfChanged(autoGenreStatusBadge, t('autoGenreStatusOn'));
  } else if (genre) {
    autoGenreStatusCard.dataset.state = 'detected';
    // Keep the genre itself as the compact heading (e.g. "Hip-Hop / рэп").
    // The description communicates how it was detected, while the badge stays a short AUTO marker.
    const genreLabel = t(AUTO_GENRE_LABELS[genre]);
    setTextIfChanged(autoGenreStatusTitle, genreLabel);
    autoGenreStatusTitle.title = genreLabel;
    setTextIfChanged(autoGenreStatusDescription, t(autoGenreStatus.source === 'title' ? 'autoGenreDetectedFromTitle' : 'autoGenreDetectedFromAudio'));
    setTextIfChanged(autoGenreStatusBadge, t('autoGenreStatusOn'));
  } else {
    autoGenreStatusCard.dataset.state = 'detecting';
    setTextIfChanged(autoGenreStatusTitle, t('autoGenreCardTitle'));
    setTextIfChanged(autoGenreStatusDescription, t('autoGenreAnalyzing'));
    setTextIfChanged(autoGenreStatusBadge, t('autoGenreStatusScan'));
  }
  const hasAppliedProfile = Boolean(genre && Number.isFinite(autoGenreStatus.bassBoostDb) &&
    Number.isFinite(autoGenreStatus.voiceBoostDb) && Number.isFinite(autoGenreStatus.volumeTrimDb));
  if (autoGenreProfileDetails) {
    autoGenreProfileDetails.hidden = !autoGenreStatus.active || !hasAppliedProfile;
    if (!autoGenreProfileDetails.hidden) {
      const formatDb = (value) => {
        const rounded = Math.round(value * 10) / 10;
        if (Math.abs(rounded) < 0.05) return '0';
        return `${rounded > 0 ? '+' : ''}${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}`;
      };
      const bass = autoGenreStatus.bassBoostEnabled ? autoGenreStatus.bassBoostDb : 0;
      const voice = autoGenreStatus.voiceBoostEnabled ? autoGenreStatus.voiceBoostDb : 0;
      setTextIfChanged(autoGenreProfileDetails, t('autoGenreAppliedProfileDetails', {
        bass: formatDb(bass), voice: formatDb(voice), volume: formatDb(autoGenreStatus.volumeTrimDb)
      }));
    }
  }
  const nextAccessibleLabel = `${autoGenreStatusTitle.textContent}. ${autoGenreStatusDescription.textContent}`;
  if (autoGenreStatusCard.getAttribute('aria-label') !== nextAccessibleLabel) {
    autoGenreStatusCard.setAttribute('aria-label', nextAccessibleLabel);
  }
}

// EN: Persists genre-analysis mode and resets individual EQ overrides to AUTO.
// RU: Сохраняет режим определения жанра и возвращает индивидуальные регуляторы EQ в AUTO.
// UK: Зберігає режим визначення жанру та повертає індивідуальні регулятори EQ в AUTO.
async function setAutoGenreEnabled(enabled) {
  const previous = autoGenreEnabled;
  const previousBassManual = autoGenreBassManualOverride;
  const previousVoiceManual = autoGenreVoiceManualOverride;
  autoGenreEnabled = enabled === true;
  // Turning genre automation off/on returns both EQ parameters to the default AUTO mode.
  autoGenreBassManualOverride = false;
  autoGenreVoiceManualOverride = false;
  autoGenreStatus = { ...autoGenreStatus, bassManualOverride: false, voiceManualOverride: false };
  updateBassUI();
  updateVoiceUI();
  updateAutoGenreStatusUI();
  try {
    await writeLocalSettings({
      autoGenreEnabled,
      autoGenreBassManualOverride: false,
      autoGenreVoiceManualOverride: false,
      genreParameterModeVersion: GENRE_PARAMETER_MODE_VERSION
    });
    const result = await chrome.runtime.sendMessage({ type: 'AUTO_GENRE_SETTINGS', enabled: autoGenreEnabled });
    if (result && result.success === false) throw new Error(result.error || 'Could not apply automatic genre settings');
    await sendVolume(Number.parseInt(slider.value, 10));
    showStatus(t(autoGenreEnabled ? 'autoGenreEnabledStatus' : 'autoGenreDisabledStatus'));
  } catch (error) {
    autoGenreEnabled = previous;
    autoGenreBassManualOverride = previousBassManual;
    autoGenreVoiceManualOverride = previousVoiceManual;
    autoGenreStatus = { ...autoGenreStatus, bassManualOverride: previousBassManual, voiceManualOverride: previousVoiceManual };
    await writeLocalSettings({
      autoGenreEnabled,
      autoGenreBassManualOverride: previousBassManual,
      autoGenreVoiceManualOverride: previousVoiceManual,
      genreParameterModeVersion: GENRE_PARAMETER_MODE_VERSION
    }).catch(() => {});
    updateBassUI();
    updateVoiceUI();
    updateAutoGenreStatusUI();
    showStatus(t('settingsSaveError'), true);
  }
}

// EN: Validates a status update from the audio engine and refreshes the genre card.
// RU: Проверяет статус от аудиодвижка и обновляет карточку жанра.
// UK: Перевіряє статус від аудіорушія та оновлює картку жанру.
function acceptAutoGenreStatus(message) {
  if (!message || typeof message.enabled !== 'boolean' || typeof message.active !== 'boolean') return;
  const genre = Object.prototype.hasOwnProperty.call(AUTO_GENRE_LABELS, message.genre) ? message.genre : null;
  autoGenreStatus = {
    enabled: message.enabled,
    active: message.active,
    genre,
    confidence: Number.isFinite(message.confidence) ? Math.max(0, Math.min(1, message.confidence)) : 0,
    source: message.source === 'title' ? 'title' : (message.source === 'audio' ? 'audio' : null),
    trackId: typeof message.trackId === 'string' ? message.trackId.slice(0, 280) : '',
    trackTitle: typeof message.trackTitle === 'string' ? message.trackTitle.slice(0, 500) : '',
    bassBoostEnabled: typeof message.bassBoostEnabled === 'boolean' ? message.bassBoostEnabled : null,
    bassBoostDb: Number.isFinite(message.bassBoostDb) ? Math.max(0, Math.min(12, message.bassBoostDb)) : null,
    voiceBoostEnabled: typeof message.voiceBoostEnabled === 'boolean' ? message.voiceBoostEnabled : null,
    voiceBoostDb: Number.isFinite(message.voiceBoostDb) ? Math.max(0, Math.min(8, message.voiceBoostDb)) : null,
    volumeTrimDb: Number.isFinite(message.volumeTrimDb) ? Math.max(-2, Math.min(1, message.volumeTrimDb)) : null,
    bassManualOverride: autoGenreBassManualOverride,
    voiceManualOverride: autoGenreVoiceManualOverride,
    state: typeof message.state === 'string' ? message.state : 'detecting'
  };
  // Persisted UI mode preferences are the single source of truth. Offscreen status
  // can refresh genre/profile values but cannot change the selected AUTO/MANUAL mode.
  autoGenreStatus.bassManualOverride = autoGenreBassManualOverride;
  autoGenreStatus.voiceManualOverride = autoGenreVoiceManualOverride;
  updateAutoGenreStatusUI();
}

// EN: Accepts active protection data without letting an idle graph overwrite preferences.
// RU: Принимает актуальные данные защиты, не позволяя простаивающему графу менять настройки.
// UK: Приймає актуальні дані захисту, не дозволяючи неактивному графу змінювати налаштування.
function handleProtectionStatus(message) {
  if (!message || typeof message.active !== 'boolean' || typeof message.peakLimiterEnabled !== 'boolean' ||
      typeof message.clipping !== 'boolean' || typeof message.highGain !== 'boolean') return;
  protectionMonitorActive = message.active;
  peakClippingDetected = message.active && message.clipping;
  // Only a live audio graph is authoritative for the currently applied limiter state.
  // An idle/offscreen status can be stale and must not undo a saved preference.
  if (message.active) peakLimiterEnabled = message.peakLimiterEnabled;
  updateProtectionUI();
}

// EN: Synchronizes the night-mode setting and its quick toggle.
// RU: Синхронизирует настройку ночного режима и быстрый переключатель.
// UK: Синхронізує налаштування нічного режиму та швидкий перемикач.
function updateNightModeUI() {
  if (nightModeToggle) {
    nightModeToggle.checked = nightModeEnabled;
    nightModeToggle.disabled = !settingsPreferencesReady;
    nightModeToggle.setAttribute('aria-label', t('nightModeLabel'));
  }
  if (nightModeToggle) nightModeToggle.disabled = !settingsPreferencesReady;
  if (quickNightModeToggle) {
    quickNightModeToggle.checked = nightModeEnabled;
    quickNightModeToggle.disabled = !settingsPreferencesReady;
    quickNightModeToggle.setAttribute('aria-label', t('nightModeLabel'));
  }
}

// EN: Saves one current audio option to the active site profile or global preferences.
// RU: Сохраняет одну аудионастройку в активный профиль сайта или общие параметры.
// UK: Зберігає одне аудіоналаштування до активного профілю сайту або загальних параметрів.
async function persistCurrentAudioOption(key, value) {
  if (activePlatformProfileKey && serviceAudioProfiles[activePlatformProfileKey]?.enabled) {
    const profile = serviceAudioProfiles[activePlatformProfileKey];
    const previous = profile[key];
    profile[key] = value;
    try {
      await persistActiveServiceProfile(activePlatformProfileKey);
    } catch (error) {
      profile[key] = previous;
      syncServiceProfileUI();
      throw error;
    }
  } else {
    const hadPrevious = Object.prototype.hasOwnProperty.call(globalAudioSettings, key);
    const previous = globalAudioSettings[key];
    globalAudioSettings[key] = value;
    try {
      await writeLocalSettings({ [key]: value });
    } catch (error) {
      if (hadPrevious) globalAudioSettings[key] = previous;
      else delete globalAudioSettings[key];
      throw error;
    }
  }
}

// EN: Saves night mode and updates the active audio graph when one is running.
// RU: Сохраняет ночной режим и обновляет активный аудиограф, если он запущен.
// UK: Зберігає нічний режим та оновлює активний аудіограф, якщо він запущений.
async function setNightModeEnabled(enabled) {
  const previous = nightModeEnabled;
  nightModeEnabled = Boolean(enabled);
  updateNightModeUI();
  try {
    await persistCurrentAudioOption('nightModeEnabled', nightModeEnabled);
    const appliedLive = await sendVolume(Number.parseInt(slider.value, 10));
    if (appliedLive) {
      showStatus(t(nightModeEnabled ? 'nightModeEnabledStatus' : 'nightModeDisabledStatus'));
    } else {
      showStatus(t('nightModeSavedPendingAudio'));
    }
  } catch (error) {
    nightModeEnabled = previous;
    updateNightModeUI();
    showStatus(t('settingsSaveError'), true);
  }
}

// EN: Saves peak-limiter state and updates the active graph or next-capture preference.
// RU: Сохраняет состояние ограничителя и применяет его к текущему или следующему захвату.
// UK: Зберігає стан обмежувача та застосовує його до поточного або наступного захоплення.
async function setPeakLimiterEnabled(enabled) {
  const previous = peakLimiterEnabled;
  peakLimiterEnabled = Boolean(enabled);
  updateProtectionUI();
  try {
    await persistCurrentAudioOption('peakLimiterEnabled', peakLimiterEnabled);
    const appliedLive = await sendVolume(Number.parseInt(slider.value, 10));
    if (appliedLive) {
      if (peakLimiterEnabled || showClippingWarning) {
        showStatus(t(peakLimiterEnabled ? 'peakLimiterEnabledStatus' : 'peakLimiterDisabledStatus'));
      }
    } else {
      showStatus(t('peakLimiterSavedPendingAudio'));
    }
  } catch (error) {
    peakLimiterEnabled = previous;
    updateProtectionUI();
    showStatus(t('settingsSaveError'), true);
  }
}

// EN: Marks the current audio preset and disables preset controls only while preferences load.
// RU: Отмечает выбранный аудиопрофиль и блокирует пресеты только во время загрузки настроек.
// UK: Позначає вибраний аудіопрофіль і блокує пресети лише під час завантаження налаштувань.
function updateAudioPresetUI() {
  profilePresetBtns.forEach((button) => {
    const selected = button.dataset.profile === activeAudioPreset;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
    // Presets are saved preferences, so they remain selectable before capture starts.
    // Профили — это сохраняемые настройки, поэтому их можно выбрать до запуска захвата.
    // Профілі — це збережувані налаштування, тому їх можна вибирати до запуску захоплення.
    button.disabled = !settingsPreferencesReady;
  });
}

// EN: Enables live-stream controls only when capture is active and keeps preferences available.
// RU: Разрешает регуляторы текущего потока только при захвате, сохраняя доступность настроек.
// UK: Дозволяє регулятори поточного потоку лише під час захоплення, зберігаючи доступність налаштувань.
function setAudioControlsReady(ready) {
  audioControlsReady = Boolean(ready);
  // Main-card volume/mute/Bass/Voice controls are gated on a live capture.
  // Settings and quick toggles remain available after storage loads and save preferences for the next capture.
  [slider, muteButton, bassBoostToggle, voiceBoostToggle].forEach((control) => {
    if (control) control.disabled = !audioControlsReady;
  });
  updateBassUI();
  updateVoiceUI();
  updateProtectionUI();
  updateNightModeUI();
  updateAudioPresetUI();
}

// EN: Persists the selected preset and restores its previous state if storage fails.
// RU: Сохраняет выбранный пресет и восстанавливает предыдущее состояние при ошибке записи.
// UK: Зберігає вибраний пресет і відновлює попередній стан у разі помилки запису.
async function saveAudioPresetSelection(presetId) {
  const previousPreset = activeAudioPreset;
  const profileKey = activePlatformProfileKey && serviceAudioProfiles[activePlatformProfileKey]?.enabled
    ? activePlatformProfileKey : null;
  const previousProfile = profileKey ? { ...serviceAudioProfiles[profileKey] } : null;
  const previousGlobalPreset = globalAudioSettings.activeAudioPreset;
  activeAudioPreset = presetId;
  updateAudioPresetUI();
  try {
    if (profileKey) {
      serviceAudioProfiles[profileKey].activeAudioPreset = presetId;
      await persistActiveServiceProfile(profileKey);
    } else {
      globalAudioSettings.activeAudioPreset = presetId;
      await writeLocalSettings({ activeAudioPreset });
    }
  } catch (error) {
    activeAudioPreset = previousPreset;
    if (profileKey && previousProfile) serviceAudioProfiles[profileKey] = previousProfile;
    globalAudioSettings.activeAudioPreset = previousGlobalPreset;
    syncServiceProfileUI();
    updateAudioPresetUI();
    showStatus(t('settingsSaveError'), true);
    console.warn('Could not save audio profile selection:', error);
  }
}

// EN: Applies and saves a named EQ preset to the active site profile or global settings.
// RU: Применяет и сохраняет именованный EQ-пресет в профиль сайта или общие настройки.
// UK: Застосовує та зберігає іменований EQ-пресет у профіль сайту або загальні налаштування.
async function applyAudioPreset(presetId) {
  const preset = AUDIO_PRESETS[presetId];
  if (!preset) return;
  const profileKey = activePlatformProfileKey && serviceAudioProfiles[activePlatformProfileKey]?.enabled
    ? activePlatformProfileKey : null;
  const previous = { bassBoostEnabled, bassBoostDb, voiceBoostEnabled, voiceBoostDb, activeAudioPreset };
  const previousProfile = profileKey ? { ...serviceAudioProfiles[profileKey] } : null;
  const previousGlobal = { ...globalAudioSettings };
  bassBoostEnabled = preset.bassBoostEnabled;
  bassBoostDb = preset.bassBoostDb;
  voiceBoostEnabled = preset.voiceBoostEnabled;
  voiceBoostDb = preset.voiceBoostDb;
  activeAudioPreset = presetId;
  updateBassUI();
  updateVoiceUI();
  updateAudioPresetUI();
  try {
    if (activePlatformProfileKey && serviceAudioProfiles[activePlatformProfileKey]?.enabled) {
      Object.assign(serviceAudioProfiles[activePlatformProfileKey], { activeAudioPreset, bassBoostEnabled, bassBoostDb, voiceBoostEnabled, voiceBoostDb });
      await persistActiveServiceProfile(activePlatformProfileKey);
    } else {
      Object.assign(globalAudioSettings, { activeAudioPreset, bassBoostEnabled, bassBoostDb, voiceBoostEnabled, voiceBoostDb });
      await writeLocalSettings({ activeAudioPreset, bassBoostEnabled, bassBoostDb, voiceBoostEnabled, voiceBoostDb, audioPresetTuningVersion: 3 });
    }
    const hadActiveCapture = currentTabHasCapture();
    const appliedLive = await sendVolume(Number.parseInt(slider.value, 10));
    if (appliedLive) {
      showStatus(t('presetApplied', { profile: t(preset.labelKey) }));
    } else if (!hadActiveCapture || !currentTabHasCapture()) {
      // No stream is a normal saved-for-later state, not an error.
      showStatus(t('presetSavedPendingAudio'));
    }
    // If a live stream was active and sendVolume failed, keep its own error message.
  } catch (error) {
    bassBoostEnabled = previous.bassBoostEnabled;
    bassBoostDb = previous.bassBoostDb;
    voiceBoostEnabled = previous.voiceBoostEnabled;
    voiceBoostDb = previous.voiceBoostDb;
    activeAudioPreset = previous.activeAudioPreset;
    if (profileKey && previousProfile) serviceAudioProfiles[profileKey] = previousProfile;
    globalAudioSettings = previousGlobal;
    syncServiceProfileUI();
    updateBassUI();
    updateVoiceUI();
    updateAudioPresetUI();
    showStatus(t('presetApplyFailed'), true);
  }
}

// EN: Marks the preset as Custom after a manual EQ change.
// RU: Переводит выбранный пресет в состояние Custom после ручного изменения EQ.
// UK: Позначає пресет як Custom після ручної зміни EQ.
async function markAudioPresetCustom() {
  await saveAudioPresetSelection('custom');
}

// EN: Factory reset writes the full defaults first, then updates all UI/runtime state together.
// RU: Сброс сначала сохраняет полный набор значений по умолчанию, затем обновляет интерфейс и runtime-состояние.
// UK: Скидання спочатку зберігає повний набір типових значень, а потім оновлює інтерфейс і runtime-стан.
async function resetFactorySettings() {
  const defaults = {
    language: 'ru', themeMode: 'system', rgbGlow: true,
    volume: 1, muted: false, lastBoostValue: 200,
    bassBoostEnabled: true, bassBoostDb: 4,
    voiceBoostEnabled: true, voiceBoostDb: 2,
    visualizerStyle: 'bars', visualizerPalette: 'neon', visualizerGlowEnabled: true, visualizerPeakHoldEnabled: true,
    spectrogramGridEnabled: true, spectrogramSmoothingEnabled: true, spectrogramGlowEnabled: true,
    visualizerSensitivity: 100, visualizerBands: 48,
    spectrogramPalette: 'neon', spectrogramDuration: 4, visualizerAnimationEnabled: true,
    showFrequencyVisualizer: true, showSpectrogram: true,
    showBassBoostPanel: true, showVoiceBoostPanel: true, showQuickSettings: true,
    peakLimiterEnabled: true, showClippingWarning: true, showAllMessages: true, showCaptureStatusIndicator: true, autoGenreEnabled: true, nightModeEnabled: false,
    energySavingEnabled: false, energySavingMode: 'balanced',
    activeAudioPreset: 'default', balancedSettingsProfileVersion: 1, audioPresetTuningVersion: 3,
    autoGenreBassManualOverride: false, autoGenreVoiceManualOverride: false, genreParameterModeVersion: GENRE_PARAMETER_MODE_VERSION,
    youtubeAudioProfile: createDefaultServiceAudioProfile(false),
    spotifyAudioProfile: createDefaultServiceAudioProfile(false)
  };

  try {
    // Persist defaults before changing in-memory UI state; on storage failure leave the UI intact.
    await writeLocalSettings(defaults);
    serviceAudioProfiles = { youtube: normalizeServiceAudioProfile(defaults.youtubeAudioProfile), spotify: normalizeServiceAudioProfile(defaults.spotifyAudioProfile) };
    serviceAudioProfileConfigured = { youtube: true, spotify: true };
    activePlatformProfileKey = null;
    globalAudioSettings = { volume: defaults.volume, muted: defaults.muted, bassBoostEnabled: defaults.bassBoostEnabled, bassBoostDb: defaults.bassBoostDb, voiceBoostEnabled: defaults.voiceBoostEnabled, voiceBoostDb: defaults.voiceBoostDb, peakLimiterEnabled: defaults.peakLimiterEnabled, nightModeEnabled: defaults.nightModeEnabled, activeAudioPreset: defaults.activeAudioPreset, lastBoostValue: defaults.lastBoostValue };
    syncServiceProfileUI();
    slider.value = '100';
    isMuted = false;
    lastBoostValue = defaults.lastBoostValue;
    bassBoostEnabled = defaults.bassBoostEnabled;
    bassBoostDb = defaults.bassBoostDb;
    voiceBoostEnabled = defaults.voiceBoostEnabled;
    voiceBoostDb = defaults.voiceBoostDb;
    activeAudioPreset = defaults.activeAudioPreset;
    language = defaults.language;
    themeMode = defaults.themeMode;
    rgbGlowEnabled = defaults.rgbGlow;
    visualizerStyle = defaults.visualizerStyle;
    visualizerPaletteMode = defaults.visualizerPalette;
    visualizerGlowEnabled = defaults.visualizerGlowEnabled;
    visualizerPeakHoldEnabled = defaults.visualizerPeakHoldEnabled;
    spectrogramGridEnabled = defaults.spectrogramGridEnabled;
    spectrogramSmoothingEnabled = defaults.spectrogramSmoothingEnabled;
    spectrogramGlowEnabled = defaults.spectrogramGlowEnabled;
    visualizerSensitivity = defaults.visualizerSensitivity;
    visualizerBands = defaults.visualizerBands;
    spectrogramPaletteMode = defaults.spectrogramPalette;
    spectrogramDuration = defaults.spectrogramDuration;
    visualizerAnimationEnabled = defaults.visualizerAnimationEnabled;
    showFrequencyVisualizer = defaults.showFrequencyVisualizer;
    showSpectrogram = defaults.showSpectrogram;
    showBassBoostPanel = defaults.showBassBoostPanel;
    showVoiceBoostPanel = defaults.showVoiceBoostPanel;
    peakLimiterEnabled = defaults.peakLimiterEnabled;
    showClippingWarning = defaults.showClippingWarning;
    showAllMessages = defaults.showAllMessages;
    showCaptureStatusIndicator = defaults.showCaptureStatusIndicator;
    showQuickSettings = defaults.showQuickSettings;
    autoGenreEnabled = defaults.autoGenreEnabled;
    autoGenreBassManualOverride = false;
    autoGenreVoiceManualOverride = false;
    autoGenreStatus = { enabled: true, active: false, genre: null, confidence: 0, source: null, trackId: '', trackTitle: '', bassManualOverride: false, voiceManualOverride: false, state: 'waiting-capture' };
    nightModeEnabled = defaults.nightModeEnabled;
    energySavingEnabled = defaults.energySavingEnabled;
    energySavingMode = defaults.energySavingMode;
    updateEnergySavingUI();
    updateNightModeUI();
    updateClippingWarningSettingUI();
    updateCaptureStatusIndicatorVisibilityUI();
    updateAllMessagesVisibilityUI();
    updateQuickSettingsVisibilityUI();
    updateAutoGenreStatusUI();
    await chrome.runtime.sendMessage({ type: 'AUTO_GENRE_SETTINGS', enabled: autoGenreEnabled }).catch((error) => {
      console.debug('Could not apply automatic genre settings:', error?.message || error);
      return null;
    });
    peakClippingDetected = false;
    updateProtectionUI();
    updateVisualizerSettingsUI({ clearHistory: true, redraw: true });
    updateAudioPanelVisibilityUI();
    syncServiceProfileUI();
    await persistVisualizerOptionsToBackground();
    if (spectrumState.captureActive) {
      await chrome.runtime.sendMessage({ type: 'VISUALIZER_CONTROL', enabled: shouldSampleSpectrum() }).catch((error) => {
        console.debug('Could not apply visualizer sampling setting:', error?.message || error);
        return null;
      });
      if (shouldRenderFrequencySpectrum()) startSpectrumRendering(); else stopSpectrumRendering();
    }

    await loadTranslations(language);
    applyTranslations();
    applyTheme(themeMode);
    updateMuteButton();
    updateBassUI();
    updateVoiceUI();
    updateAudioPresetUI();
    updateUI(100);
    const appliedLive = await sendVolume(100);
    setSettingsPanelOpen(false);
    if (appliedLive) showStatus(t('factoryResetDone'));
    else showStatus(t('factoryResetDonePendingAudio'), true);
  } catch (error) {
    showStatus(t('factoryResetFailed'), true);
  }
}

// EN: Shared own-property check keeps versioned backup validation concise and consistent.
// RU: Общая проверка собственных ключей делает проверку версий резервной копии короче и единообразнее.
// UK: Спільна перевірка власних ключів робить перевірку версій резервної копії коротшою та узгодженою.
function hasOwnSettingsKeys(value, keys) {
  return keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

// EN: Backup validation rejects malformed, oversized, out-of-range or future-schema configuration files.
// RU: Проверка резервной копии отклоняет повреждённые, слишком большие файлы, неверные значения и новые схемы.
// UK: Перевірка резервної копії відхиляє пошкоджені, завеликі файли, неправильні значення та нові схеми.
function validateSettingsConfig(config) {
  const invalid = () => {
    const error = new Error('Invalid settings config');
    error.code = 'invalid';
    return error;
  };
  const unsupportedSchema = (schemaVersion) => {
    const error = new Error('Unsupported settings config schema version');
    error.schemaVersion = schemaVersion;
    error.supportedSchemaVersion = SETTINGS_CONFIG_SCHEMA_VERSION;
    error.code = schemaVersion > SETTINGS_CONFIG_SCHEMA_VERSION ? 'newerSchema' : 'olderSchema';
    return error;
  };

  if (!config || typeof config !== 'object' || Array.isArray(config) ||
      config.format !== SETTINGS_CONFIG_FORMAT || !Number.isInteger(config.schemaVersion) || config.schemaVersion < 1) {
    throw invalid();
  }
  if (config.schemaVersion > SETTINGS_CONFIG_SCHEMA_VERSION) throw unsupportedSchema(config.schemaVersion);
  // New profile IDs are gated by the schema that introduced them, while older presets remain importable.
  if (config.schemaVersion < 1) throw invalid();
  const value = config.settings;
  if (config.schemaVersion < 9 && value && ['audiobooks', 'series'].includes(value.activeAudioPreset)) throw invalid();
  if (config.schemaVersion < 10 && value && ['default', 'sports', 'broadcasts'].includes(value.activeAudioPreset)) throw invalid();
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();

  const requiredKeys = [
    'language', 'themeMode', 'rgbGlow', 'volume', 'muted',
    'bassBoostEnabled', 'bassBoostDb', 'voiceBoostEnabled', 'voiceBoostDb',
    'activeAudioPreset', 'lastBoostValue'
  ];
  const visualizerKeys = ['visualizerStyle', 'visualizerSensitivity', 'visualizerBands', 'spectrogramPalette', 'spectrogramDuration', 'visualizerAnimationEnabled'];
  const visibilityKeys = ['showFrequencyVisualizer', 'showSpectrogram'];
  const audioPanelVisibilityKeys = ['showBassBoostPanel', 'showVoiceBoostPanel'];
  const protectionKeys = ['peakLimiterEnabled'];
  const clippingWarningKeys = ['showClippingWarning'];
  const captureStatusVisibilityKeys = ['showCaptureStatusIndicator'];
  const allMessagesKeys = ['showAllMessages'];
  const quickSettingsVisibilityKeys = ['showQuickSettings'];
  const autoGenreKeys = ['autoGenreEnabled'];
  const serviceProfileKeys = ['youtubeAudioProfile', 'spotifyAudioProfile'];
  const genreParameterModeKeys = ['bassBoostMode', 'voiceBoostMode'];
  const nightModeKeys = ['nightModeEnabled'];
  const energySavingKeys = ['energySavingEnabled', 'energySavingMode'];
  const visualizerEffectsKeys = ['visualizerPalette', 'visualizerGlowEnabled', 'visualizerPeakHoldEnabled', 'spectrogramGridEnabled', 'spectrogramSmoothingEnabled', 'spectrogramGlowEnabled'];
  if (!hasOwnSettingsKeys(value, requiredKeys)) throw invalid();
  if (config.schemaVersion >= 2 && !hasOwnSettingsKeys(value, visualizerKeys)) throw invalid();
  if (config.schemaVersion >= 3 && !hasOwnSettingsKeys(value, visibilityKeys)) throw invalid();
  if (config.schemaVersion >= 4 && !hasOwnSettingsKeys(value, protectionKeys)) throw invalid();
  if (config.schemaVersion >= 5 && !hasOwnSettingsKeys(value, nightModeKeys)) throw invalid();
  if (config.schemaVersion >= 6 && !hasOwnSettingsKeys(value, energySavingKeys)) throw invalid();
  if (config.schemaVersion >= 7 && !hasOwnSettingsKeys(value, audioPanelVisibilityKeys)) throw invalid();
  if (config.schemaVersion >= 8 && !hasOwnSettingsKeys(value, clippingWarningKeys)) throw invalid();
  if (config.schemaVersion >= 11 && !hasOwnSettingsKeys(value, visualizerEffectsKeys)) throw invalid();
  if (config.schemaVersion >= 12 && !hasOwnSettingsKeys(value, captureStatusVisibilityKeys)) throw invalid();
  if (config.schemaVersion >= 13 && !hasOwnSettingsKeys(value, quickSettingsVisibilityKeys)) throw invalid();
  if (config.schemaVersion >= 14 && !hasOwnSettingsKeys(value, autoGenreKeys)) throw invalid();
  if (config.schemaVersion >= 15 && !hasOwnSettingsKeys(value, serviceProfileKeys)) throw invalid();
  if (config.schemaVersion >= 16 && !hasOwnSettingsKeys(value, genreParameterModeKeys)) throw invalid();
  if (config.schemaVersion >= 17 && !hasOwnSettingsKeys(value, allMessagesKeys)) throw invalid();
  // Schema v18 (4.7.85): no new required keys beyond v17. The obsolete showCaptureTabCircle
  // field is intentionally ignored; background.js removes it during extension update cleanup.
  const importedYoutubeProfile = config.schemaVersion >= 15 ? value.youtubeAudioProfile : createDefaultServiceAudioProfile(false);
  const importedSpotifyProfile = config.schemaVersion >= 15 ? value.spotifyAudioProfile : createDefaultServiceAudioProfile(false);
  const vizDefaults = {
    visualizerStyle: 'bars', visualizerPalette: 'neon', visualizerGlowEnabled: true, visualizerPeakHoldEnabled: true,
    spectrogramGridEnabled: true, spectrogramSmoothingEnabled: true, spectrogramGlowEnabled: true,
    visualizerSensitivity: 100, visualizerBands: 48,
    spectrogramPalette: 'neon', spectrogramDuration: 4, visualizerAnimationEnabled: true,
    showFrequencyVisualizer: true, showSpectrogram: true,
    showBassBoostPanel: true, showVoiceBoostPanel: true
  };
  const viz = config.schemaVersion === 1 ? { ...vizDefaults } : { ...vizDefaults, ...value };
  if (config.schemaVersion < 11) {
    Object.assign(viz, {
      visualizerPalette: 'neon', visualizerGlowEnabled: true, visualizerPeakHoldEnabled: true,
      spectrogramGridEnabled: true, spectrogramSmoothingEnabled: true, spectrogramGlowEnabled: true
    });
  }
  const limiterEnabled = config.schemaVersion >= 4 ? value.peakLimiterEnabled : true;
  const importedShowClippingWarning = config.schemaVersion >= 8 ? value.showClippingWarning : true;
  const importedShowCaptureStatusIndicator = config.schemaVersion >= 12 ? value.showCaptureStatusIndicator : true;
  const importedShowAllMessages = config.schemaVersion >= 17 ? value.showAllMessages : true;
  const importedShowQuickSettings = config.schemaVersion >= 13 ? value.showQuickSettings : true;
  const importedAutoGenreEnabled = config.schemaVersion >= 14 ? value.autoGenreEnabled : true;
  const importedBassBoostManualOverride = config.schemaVersion >= 16 ? value.bassBoostMode === 'manual' : false;
  const importedVoiceBoostManualOverride = config.schemaVersion >= 16 ? value.voiceBoostMode === 'manual' : false;
  const importedNightModeEnabled = config.schemaVersion >= 5 ? value.nightModeEnabled : false;
  const importedEnergySavingEnabled = config.schemaVersion >= 6 ? value.energySavingEnabled : false;
  const importedEnergySavingMode = config.schemaVersion >= 6 ? value.energySavingMode : 'balanced';

  // Keep validation in named groups: each mirrors a settings panel/domain while preserving the same schema rules.
  // Блоки ниже соответствуют разделам настроек; условия совместимости старых схем остаются без изменений.
  // Наведені нижче блоки відповідають розділам налаштувань; умови сумісності старих схем не змінюються.
  const validCoreAudioSettings =
    ['ru', 'en', 'uk'].includes(value.language) &&
    ['dark', 'light', 'system'].includes(value.themeMode) &&
    typeof value.rgbGlow === 'boolean' &&
    typeof value.volume === 'number' && Number.isFinite(value.volume) && value.volume >= 0 && value.volume <= 6 &&
    typeof value.muted === 'boolean' &&
    typeof value.bassBoostEnabled === 'boolean' &&
    Number.isInteger(value.bassBoostDb) && value.bassBoostDb >= 0 && value.bassBoostDb <= 12 &&
    typeof value.voiceBoostEnabled === 'boolean' &&
    Number.isInteger(value.voiceBoostDb) && value.voiceBoostDb >= 0 && value.voiceBoostDb <= 8 &&
    ['default', 'podcasts', 'audiobooks', 'music', 'video', 'series', 'movies', 'games', 'sports', 'broadcasts', 'streams', 'custom'].includes(value.activeAudioPreset) &&
    Number.isInteger(value.lastBoostValue) && value.lastBoostValue >= 100 && value.lastBoostValue <= 600;

  const validVisualizerSettings =
    VISUALIZER_STYLES.includes(viz.visualizerStyle) &&
    SPECTROGRAM_PALETTES.includes(viz.visualizerPalette) &&
    typeof viz.visualizerGlowEnabled === 'boolean' &&
    typeof viz.visualizerPeakHoldEnabled === 'boolean' &&
    typeof viz.spectrogramGridEnabled === 'boolean' &&
    typeof viz.spectrogramSmoothingEnabled === 'boolean' &&
    typeof viz.spectrogramGlowEnabled === 'boolean' &&
    Number.isInteger(viz.visualizerSensitivity) && viz.visualizerSensitivity >= 50 && viz.visualizerSensitivity <= 200 && viz.visualizerSensitivity % 25 === 0 &&
    VISUALIZER_BAND_OPTIONS.includes(viz.visualizerBands) &&
    SPECTROGRAM_PALETTES.includes(viz.spectrogramPalette) &&
    SPECTROGRAM_DURATIONS.includes(viz.spectrogramDuration) &&
    typeof viz.visualizerAnimationEnabled === 'boolean' &&
    typeof viz.showFrequencyVisualizer === 'boolean' &&
    typeof viz.showSpectrogram === 'boolean' &&
    typeof viz.showBassBoostPanel === 'boolean' &&
    typeof viz.showVoiceBoostPanel === 'boolean';

  const validProtectionAndDisplaySettings =
    typeof limiterEnabled === 'boolean' &&
    typeof importedShowClippingWarning === 'boolean' &&
    typeof importedShowCaptureStatusIndicator === 'boolean' &&
    typeof importedShowAllMessages === 'boolean' &&
    typeof importedShowQuickSettings === 'boolean' &&
    typeof importedAutoGenreEnabled === 'boolean' &&
    (config.schemaVersion < 16 || (['auto', 'manual'].includes(value.bassBoostMode) && ['auto', 'manual'].includes(value.voiceBoostMode))) &&
    typeof importedNightModeEnabled === 'boolean';

  const validProfilesAndPerformanceSettings =
    isValidServiceAudioProfile(importedYoutubeProfile) &&
    isValidServiceAudioProfile(importedSpotifyProfile) &&
    typeof importedEnergySavingEnabled === 'boolean' &&
    ENERGY_SAVING_MODES.includes(importedEnergySavingMode);

  const valid = validCoreAudioSettings && validVisualizerSettings &&
    validProtectionAndDisplaySettings && validProfilesAndPerformanceSettings;
  if (!valid) throw invalid();

  // Popup sliders use whole-percent steps, so normalize exported/imported volume to that same precision.
  const normalized = {
    language: value.language,
    themeMode: value.themeMode,
    rgbGlow: value.rgbGlow,
    volume: Math.round(value.volume * 100) / 100,
    muted: value.muted,
    bassBoostEnabled: value.bassBoostEnabled,
    bassBoostDb: value.bassBoostDb,
    voiceBoostEnabled: value.voiceBoostEnabled,
    voiceBoostDb: value.voiceBoostDb,
    activeAudioPreset: value.activeAudioPreset,
    lastBoostValue: value.lastBoostValue,
    visualizerStyle: viz.visualizerStyle,
    visualizerPalette: viz.visualizerPalette,
    visualizerGlowEnabled: viz.visualizerGlowEnabled,
    visualizerPeakHoldEnabled: viz.visualizerPeakHoldEnabled,
    spectrogramGridEnabled: viz.spectrogramGridEnabled,
    spectrogramSmoothingEnabled: viz.spectrogramSmoothingEnabled,
    spectrogramGlowEnabled: viz.spectrogramGlowEnabled,
    visualizerSensitivity: viz.visualizerSensitivity,
    visualizerBands: viz.visualizerBands,
    spectrogramPalette: viz.spectrogramPalette,
    spectrogramDuration: viz.spectrogramDuration,
    visualizerAnimationEnabled: viz.visualizerAnimationEnabled,
    showFrequencyVisualizer: viz.showFrequencyVisualizer,
    showSpectrogram: viz.showSpectrogram,
    showBassBoostPanel: viz.showBassBoostPanel,
    showVoiceBoostPanel: viz.showVoiceBoostPanel,
    peakLimiterEnabled: limiterEnabled,
    showClippingWarning: importedShowClippingWarning,
    showAllMessages: importedShowAllMessages,
    showCaptureStatusIndicator: importedShowCaptureStatusIndicator,
    showQuickSettings: importedShowQuickSettings,
    autoGenreEnabled: importedAutoGenreEnabled,
    autoGenreBassManualOverride: importedBassBoostManualOverride,
    autoGenreVoiceManualOverride: importedVoiceBoostManualOverride,
    nightModeEnabled: importedNightModeEnabled,
    energySavingEnabled: importedEnergySavingEnabled,
    energySavingMode: importedEnergySavingMode,
    youtubeAudioProfile: normalizeServiceAudioProfile(importedYoutubeProfile),
    spotifyAudioProfile: normalizeServiceAudioProfile(importedSpotifyProfile)
  };

  // Upgrade old, unmodified named presets to the balanced 4.7.35 tuning on import.
  // Manually modified settings will not match the legacy fingerprint and remain untouched.
  if (config.schemaVersion < 11 && normalized.activeAudioPreset !== 'custom') {
    const legacyPreset = LEGACY_AUDIO_PRESETS[normalized.activeAudioPreset];
    const tunedPreset = AUDIO_PRESETS[normalized.activeAudioPreset];
    const matchesLegacyPreset = legacyPreset && tunedPreset &&
      normalized.bassBoostEnabled === legacyPreset.bassBoostEnabled &&
      normalized.bassBoostDb === legacyPreset.bassBoostDb &&
      normalized.voiceBoostEnabled === legacyPreset.voiceBoostEnabled &&
      normalized.voiceBoostDb === legacyPreset.voiceBoostDb;
    if (matchesLegacyPreset) {
      normalized.bassBoostEnabled = tunedPreset.bassBoostEnabled;
      normalized.bassBoostDb = tunedPreset.bassBoostDb;
      normalized.voiceBoostEnabled = tunedPreset.voiceBoostEnabled;
      normalized.voiceBoostDb = tunedPreset.voiceBoostDb;
    }
  }

  // Never display a named preset as active when its EQ values no longer match it.
  if (normalized.activeAudioPreset !== 'custom') {
    const preset = AUDIO_PRESETS[normalized.activeAudioPreset];
    const matchesPreset = preset &&
      preset.bassBoostEnabled === normalized.bassBoostEnabled &&
      preset.bassBoostDb === normalized.bassBoostDb &&
      preset.voiceBoostEnabled === normalized.voiceBoostEnabled &&
      preset.voiceBoostDb === normalized.voiceBoostDb;
    if (!matchesPreset) normalized.activeAudioPreset = 'custom';
  }
  return normalized;
}

// EN: Export snapshots global defaults and per-site profiles without confusing one for the other.
// RU: Снимок для экспорта сохраняет общие параметры и профили сайтов раздельно.
// UK: Знімок для експорту зберігає загальні параметри та профілі сайтів окремо.
function currentSettingsSnapshot() {
  const volumePercent = Math.min(600, Math.max(0, Number.parseInt(slider.value, 10) || 0));
  return {
    language,
    themeMode,
    rgbGlow: rgbGlowEnabled,
    volume: Number.isFinite(globalAudioSettings.volume) ? globalAudioSettings.volume : volumePercent / 100,
    muted: globalAudioSettings.muted === true,
    bassBoostEnabled: globalAudioSettings.bassBoostEnabled === true,
    bassBoostDb: globalAudioSettings.bassBoostDb,
    voiceBoostEnabled: globalAudioSettings.voiceBoostEnabled === true,
    voiceBoostDb: globalAudioSettings.voiceBoostDb,
    activeAudioPreset: globalAudioSettings.activeAudioPreset || 'default',
    lastBoostValue: Number.isInteger(globalAudioSettings.lastBoostValue) ? globalAudioSettings.lastBoostValue : (volumePercent > 100 ? volumePercent : Math.min(600, Math.max(100, lastBoostValue))),
    youtubeAudioProfile: { ...serviceAudioProfiles.youtube },
    spotifyAudioProfile: { ...serviceAudioProfiles.spotify },
    visualizerStyle,
    visualizerPalette: visualizerPaletteMode,
    visualizerGlowEnabled,
    visualizerPeakHoldEnabled,
    spectrogramGridEnabled,
    spectrogramSmoothingEnabled,
    spectrogramGlowEnabled,
    visualizerSensitivity,
    visualizerBands,
    spectrogramPalette: spectrogramPaletteMode,
    spectrogramDuration,
    visualizerAnimationEnabled,
    showFrequencyVisualizer,
    showSpectrogram,
    showBassBoostPanel,
    showVoiceBoostPanel,
    peakLimiterEnabled,
    showClippingWarning,
    showAllMessages,
    showCaptureStatusIndicator,
    showQuickSettings,
    autoGenreEnabled,
    bassBoostMode: autoGenreBassManualOverride ? 'manual' : 'auto',
    voiceBoostMode: autoGenreVoiceManualOverride ? 'manual' : 'auto',
    nightModeEnabled,
    energySavingEnabled,
    energySavingMode
  };
}

// EN: Exports a validated snapshot of global settings and per-site profiles to a backup file.
// RU: Экспортирует проверенный снимок общих настроек и профилей сайтов в резервный файл.
// UK: Експортує перевірений знімок загальних налаштувань і профілів сайтів у резервний файл.
async function exportSettingsToCfg() {
  let objectUrl = null;
  try {
    const config = {
      format: SETTINGS_CONFIG_FORMAT,
      schemaVersion: SETTINGS_CONFIG_SCHEMA_VERSION,
      extension: 'Volume Controller Pro',
      extensionVersion: chrome.runtime.getManifest().version,
      exportedAt: new Date().toISOString(),
      settings: currentSettingsSnapshot()
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json;charset=utf-8' });
    objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `volume-controller-settings-${new Date().toISOString().slice(0, 10)}.cfg`;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showStatus(t('exportSettingsSuccess'));
  } catch (error) {
    console.error('Settings export failed:', error);
    showStatus(t('exportSettingsFailed'), true);
  } finally {
    if (objectUrl) window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

// EN: Validates a backup before persisting and applying the imported settings.
// RU: Проверяет резервный файл перед сохранением и применением импортированных настроек.
// UK: Перевіряє резервний файл перед збереженням і застосуванням імпортованих налаштувань.
async function importSettingsFromCfg(file) {
  if (!file) return;
  try {
    if (!file.name || !file.name.toLowerCase().endsWith('.cfg') || file.size > SETTINGS_CONFIG_MAX_BYTES) {
      const error = new Error('Invalid settings file type or size');
      error.code = 'invalid';
      throw error;
    }
    if (!window.confirm(t('importSettingsConfirm'))) return;

    const parsed = JSON.parse(await file.text());
    const imported = validateSettingsConfig(parsed);
    // Load required language resources before mutating settings, so a missing language file cannot half-apply an import.
    await readLanguageFile('ru');
    await readLanguageFile(imported.language);

    await writeLocalSettings({
      language: imported.language,
      themeMode: imported.themeMode,
      rgbGlow: imported.rgbGlow,
      volume: imported.volume,
      muted: imported.muted,
      bassBoostEnabled: imported.bassBoostEnabled,
      bassBoostDb: imported.bassBoostDb,
      voiceBoostEnabled: imported.voiceBoostEnabled,
      voiceBoostDb: imported.voiceBoostDb,
      activeAudioPreset: imported.activeAudioPreset,
      audioPresetTuningVersion: 3,
      lastBoostValue: imported.lastBoostValue,
      visualizerStyle: imported.visualizerStyle,
      visualizerPalette: imported.visualizerPalette,
      visualizerGlowEnabled: imported.visualizerGlowEnabled,
      visualizerPeakHoldEnabled: imported.visualizerPeakHoldEnabled,
      spectrogramGridEnabled: imported.spectrogramGridEnabled,
      spectrogramSmoothingEnabled: imported.spectrogramSmoothingEnabled,
      spectrogramGlowEnabled: imported.spectrogramGlowEnabled,
      visualizerSensitivity: imported.visualizerSensitivity,
      visualizerBands: imported.visualizerBands,
      spectrogramPalette: imported.spectrogramPalette,
      spectrogramDuration: imported.spectrogramDuration,
      visualizerAnimationEnabled: imported.visualizerAnimationEnabled,
      showFrequencyVisualizer: imported.showFrequencyVisualizer,
      showSpectrogram: imported.showSpectrogram,
      showBassBoostPanel: imported.showBassBoostPanel,
      showVoiceBoostPanel: imported.showVoiceBoostPanel,
      peakLimiterEnabled: imported.peakLimiterEnabled,
      showClippingWarning: imported.showClippingWarning,
      showAllMessages: imported.showAllMessages,
      showCaptureStatusIndicator: imported.showCaptureStatusIndicator,
      showQuickSettings: imported.showQuickSettings,
      autoGenreEnabled: imported.autoGenreEnabled,
      autoGenreBassManualOverride: imported.autoGenreBassManualOverride,
      autoGenreVoiceManualOverride: imported.autoGenreVoiceManualOverride,
      genreParameterModeVersion: GENRE_PARAMETER_MODE_VERSION,
      nightModeEnabled: imported.nightModeEnabled,
      energySavingEnabled: imported.energySavingEnabled,
      energySavingMode: imported.energySavingMode,
      youtubeAudioProfile: imported.youtubeAudioProfile,
      spotifyAudioProfile: imported.spotifyAudioProfile,
      balancedSettingsProfileVersion: 1
    });

    language = imported.language;
    themeMode = imported.themeMode;
    rgbGlowEnabled = imported.rgbGlow;
    isMuted = imported.muted;
    bassBoostEnabled = imported.bassBoostEnabled;
    bassBoostDb = imported.bassBoostDb;
    voiceBoostEnabled = imported.voiceBoostEnabled;
    voiceBoostDb = imported.voiceBoostDb;
    activeAudioPreset = imported.activeAudioPreset;
    lastBoostValue = imported.volume > 1 ? Math.round(imported.volume * 100) : imported.lastBoostValue;
    visualizerStyle = imported.visualizerStyle;
    visualizerPaletteMode = imported.visualizerPalette;
    visualizerGlowEnabled = imported.visualizerGlowEnabled;
    visualizerPeakHoldEnabled = imported.visualizerPeakHoldEnabled;
    spectrogramGridEnabled = imported.spectrogramGridEnabled;
    spectrogramSmoothingEnabled = imported.spectrogramSmoothingEnabled;
    spectrogramGlowEnabled = imported.spectrogramGlowEnabled;
    visualizerSensitivity = imported.visualizerSensitivity;
    visualizerBands = imported.visualizerBands;
    spectrogramPaletteMode = imported.spectrogramPalette;
    spectrogramDuration = imported.spectrogramDuration;
    visualizerAnimationEnabled = imported.visualizerAnimationEnabled;
    showFrequencyVisualizer = imported.showFrequencyVisualizer;
    showSpectrogram = imported.showSpectrogram;
    showBassBoostPanel = imported.showBassBoostPanel;
    showVoiceBoostPanel = imported.showVoiceBoostPanel;
    peakLimiterEnabled = imported.peakLimiterEnabled;
    showClippingWarning = imported.showClippingWarning;
    showAllMessages = imported.showAllMessages;
    showCaptureStatusIndicator = imported.showCaptureStatusIndicator;
    showQuickSettings = imported.showQuickSettings;
    autoGenreEnabled = imported.autoGenreEnabled;
    autoGenreBassManualOverride = imported.autoGenreBassManualOverride;
    autoGenreVoiceManualOverride = imported.autoGenreVoiceManualOverride;
    autoGenreStatus = { ...autoGenreStatus, bassManualOverride: autoGenreBassManualOverride, voiceManualOverride: autoGenreVoiceManualOverride };
    nightModeEnabled = imported.nightModeEnabled;
    energySavingEnabled = imported.energySavingEnabled;
    energySavingMode = imported.energySavingMode;
    serviceAudioProfiles = { youtube: normalizeServiceAudioProfile(imported.youtubeAudioProfile), spotify: normalizeServiceAudioProfile(imported.spotifyAudioProfile) };
    // Older backup schemas had no site-specific profiles; let first enable seed them from imported global settings.
    // В старых резервных файлах не было отдельных профилей сайтов: при первом включении заполним их импортированными общими настройками.
    // Старі резервні файли не містили окремих профілів сайтів: під час першого ввімкнення заповнимо їх імпортованими загальними налаштуваннями.
    const backupHadServiceProfiles = Number.isInteger(parsed.schemaVersion) && parsed.schemaVersion >= 15;
    serviceAudioProfileConfigured = { youtube: backupHadServiceProfiles, spotify: backupHadServiceProfiles };
    activePlatformProfileKey = null;
    globalAudioSettings = { volume: imported.volume, muted: imported.muted, bassBoostEnabled: imported.bassBoostEnabled, bassBoostDb: imported.bassBoostDb, voiceBoostEnabled: imported.voiceBoostEnabled, voiceBoostDb: imported.voiceBoostDb, peakLimiterEnabled: imported.peakLimiterEnabled, nightModeEnabled: imported.nightModeEnabled, activeAudioPreset: imported.activeAudioPreset, lastBoostValue: imported.lastBoostValue };
    activateServiceProfileForCurrentTab();
    syncServiceProfileUI();
    updateEnergySavingUI();
    updateNightModeUI();
    updateClippingWarningSettingUI();
    updateCaptureStatusIndicatorVisibilityUI();
    updateAllMessagesVisibilityUI();
    updateQuickSettingsVisibilityUI();
    updateAutoGenreStatusUI();
    await chrome.runtime.sendMessage({ type: 'AUTO_GENRE_SETTINGS', enabled: autoGenreEnabled }).catch((error) => {
      console.debug('Could not apply automatic genre settings:', error?.message || error);
      return null;
    });
    updateProtectionUI();
    updateVisualizerSettingsUI({ clearHistory: true, redraw: true });
    updateAudioPanelVisibilityUI();
    await persistVisualizerOptionsToBackground();
    if (spectrumState.captureActive) {
      await chrome.runtime.sendMessage({ type: 'VISUALIZER_CONTROL', enabled: shouldSampleSpectrum() }).catch((error) => {
        console.debug('Could not apply visualizer sampling setting:', error?.message || error);
        return null;
      });
      if (shouldRenderFrequencySpectrum()) startSpectrumRendering(); else stopSpectrumRendering();
    }

    await loadTranslations(language);
    applyTranslations();
    applyTheme(themeMode);
    // Re-apply the active tab's imported per-service profile after localization/UI refresh.
    // Otherwise the global slider value would overwrite the imported service profile on sendVolume().
    activateServiceProfileForCurrentTab();
    updateMuteButton();
    updateBassUI();
    updateVoiceUI();
    updateAudioPresetUI();
    updateUI(Number(slider.value));
    const appliedLive = await sendVolume(Number(slider.value));
    if (appliedLive) showStatus(t('importSettingsSuccess'));
    else showStatus(t('importSettingsSuccessPendingAudio'), true);
  } catch (error) {
    console.error('Settings import failed:', error);
    if (error && (error.code === 'newerSchema' || error.code === 'olderSchema')) {
      const key = error.code === 'newerSchema' ? 'importSettingsNewerSchema' : 'importSettingsOlderSchema';
      showStatus(t(key, {
        fileVersion: error.schemaVersion,
        supportedVersion: error.supportedSchemaVersion
      }), true);
    } else {
      const key = error && (error.code === 'invalid' || error instanceof SyntaxError)
        ? 'importSettingsInvalid'
        : 'importSettingsFailed';
      showStatus(t(key), true);
    }
  } finally {
    if (settingsImportFile) settingsImportFile.value = '';
  }
}

// EN: Central persistence/application point for volume and EQ; when no capture is active, save for next manual start.
// RU: Единая точка сохранения и применения громкости/EQ; без захвата значения сохраняются для следующего ручного запуска.
// UK: Єдина точка збереження й застосування гучності/EQ; без захоплення значення зберігаються для наступного ручного запуску.
async function sendVolume(value) {
  const volumeLevel = Math.min(6, Math.max(0, Number(value) / 100));
  const settings = {
    volume: volumeLevel,
    muted: isMuted,
    bassBoostEnabled,
    bassBoostDb,
    voiceBoostEnabled,
    voiceBoostDb,
    peakLimiterEnabled,
    nightModeEnabled,
    lastBoostValue
  };

  try {
    // Persist edits to the active service profile when one is enabled; otherwise save the global defaults.
    // Mute remains a global preference and is persisted independently.
    if (activePlatformProfileKey && serviceAudioProfiles[activePlatformProfileKey]?.enabled) {
      Object.assign(serviceAudioProfiles[activePlatformProfileKey], {
        volume: settings.volume,
        bassBoostEnabled: settings.bassBoostEnabled,
        bassBoostDb: settings.bassBoostDb,
        voiceBoostEnabled: settings.voiceBoostEnabled,
        voiceBoostDb: settings.voiceBoostDb,
        peakLimiterEnabled: settings.peakLimiterEnabled,
        nightModeEnabled: settings.nightModeEnabled,
        activeAudioPreset
      });
      globalAudioSettings.muted = isMuted;
      await writeLocalSettings({ [getServiceProfileStorageKey(activePlatformProfileKey)]: serviceAudioProfiles[activePlatformProfileKey], muted: isMuted, autoGenreBassManualOverride, autoGenreVoiceManualOverride, genreParameterModeVersion: GENRE_PARAMETER_MODE_VERSION });
    } else {
      globalAudioSettings = { ...globalAudioSettings, ...settings, activeAudioPreset, volume: settings.volume, lastBoostValue: Math.min(600, Math.max(100, Number(lastBoostValue) || 200)) };
      await writeLocalSettings({ ...settings, activeAudioPreset, audioPresetTuningVersion: 3, autoGenreBassManualOverride, autoGenreVoiceManualOverride, genreParameterModeVersion: GENRE_PARAMETER_MODE_VERSION });
    }
    syncServiceProfileUI();

    if (!Number.isInteger(currentTabId) || !currentTabHasCapture()) {
      // The preferences above are already persisted. Lack of capture is not a save error;
      // these values will be sent when the user explicitly starts audio capture.
      showStatus(t('audioSettingsSavedPendingCapture'));
      return false;
    }

    const result = await chrome.runtime.sendMessage({
      type: 'SET_VOLUME',
      tabId: currentTabId,
      ...settings,
      bassManualOverride: autoGenreBassManualOverride,
      voiceManualOverride: autoGenreVoiceManualOverride
    });
    if (!result || result.success !== true) {
      showStatus(t('volumeApplyError'), true);
      return false;
    }
    showStatus(t('volumeStatus', { volume: Math.round(value), bass: bassBoostEnabled ? `+${bassBoostDb} dB` : t('off'), voice: voiceBoostEnabled ? `+${voiceBoostDb} dB` : t('off') }));
    return true;
  } catch (error) {
    const detail = error && error.message ? error.message : String(error);
    showStatus(t('applyError', { detail }), true);
    return false;
  }
}

// EN: Displays a temporary success or persistent error message in the popup.
// RU: Показывает временное сообщение об успехе или сохраняющееся сообщение об ошибке.
// UK: Показує тимчасове повідомлення про успіх або повідомлення про помилку.
function showStatus(text, isError = false) {
  if (!showAllMessages) {
    clearTimeout(statusTimer);
    status.textContent = '';
    status.classList.remove('success', 'error');
    status.hidden = true;
    return;
  }
  status.hidden = false;
  status.textContent = text;
  status.classList.toggle('success', !isError);
  status.classList.toggle('error', isError);
  clearTimeout(statusTimer);

  // Error details remain visible until the next action; success notices auto-clear.
  if (!isError) {
    statusTimer = setTimeout(() => {
      status.textContent = t('ready');
      status.classList.remove('success', 'error');
      statusTimer = null;
    }, 2600);
  }
}

// The offscreen document streams compact logarithmic spectrum bands only while
// the popup is open. This renderer interpolates them locally for a smooth 30 FPS UI.
const spectrumState = {
  target: new Array(48).fill(0),
  current: new Array(48).fill(0),
  peaks: new Array(48).fill(0),
  captureActive: false,
  quietFrames: 0,
  hasSignal: false,
  animationFrame: 0,
  animationTimeout: 0,
  lastFrame: 0,
  lastDrawAt: 0,
  context: null
};

// EN: Resizes reusable FFT/history buffers when the selected band count changes.
// RU: Меняет размер повторно используемых FFT-буферов при изменении количества полос.
// UK: Змінює розмір повторно використовуваних FFT-буферів під час зміни кількості смуг.
function resizeSpectrumBuffers(count) {
  const safeCount = VISUALIZER_BAND_OPTIONS.includes(count) ? count : 48;
  if (spectrumState.target.length === safeCount) return;
  const resize = (values) => Array.from({ length: safeCount }, (_, index) => {
    const mappedIndex = safeCount === 1 ? 0 : Math.round(index * (values.length - 1) / (safeCount - 1));
    return values[mappedIndex] || 0;
  });
  spectrumState.target = resize(spectrumState.target);
  spectrumState.current = resize(spectrumState.current);
  spectrumState.peaks = resize(spectrumState.peaks);
}

// EN: Matches the spectrum canvas resolution to its displayed size and device scale.
// RU: Подгоняет разрешение canvas спектра под размер отображения и масштаб устройства.
// UK: Узгоджує роздільність canvas спектра з розміром відображення та масштабом пристрою.
function resizeSpectrumCanvas() {
  if (!frequencyCanvas) return;
  const rect = frequencyCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, getEnergySavingProfile().canvasDpr);
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);
  if (frequencyCanvas.width !== width || frequencyCanvas.height !== height) {
    frequencyCanvas.width = width;
    frequencyCanvas.height = height;
  }
  spectrumState.context = frequencyCanvas.getContext('2d');
  spectrumState.context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const spectrogramState = {
  history: [],
  context: null,
  maxRows: 64,
  width: 0,
  height: 0,
  imageData: null,
  xSampleMap: null,
  xSampleMapWidth: 0,
  xSampleMapBands: 0
};

// Heat-map palettes are user-selectable; the LUT keeps per-frame rendering cheap.
const SPECTROGRAM_PALETTE_MAP = {
  neon: [[7, 11, 27], [13, 22, 52], [22, 48, 112], [27, 109, 184], [14, 190, 205], [55, 222, 177], [174, 232, 113], [255, 183, 82], [255, 104, 160]],
  ocean: [[4, 10, 27], [7, 35, 76], [0, 80, 130], [0, 137, 171], [25, 195, 199], [111, 236, 226], [225, 252, 255]],
  fire: [[8, 5, 16], [48, 8, 28], [117, 16, 28], [205, 42, 20], [247, 102, 21], [255, 174, 48], [255, 234, 130], [255, 255, 245]],
  mono: [[5, 9, 20], [32, 42, 61], [73, 88, 111], [123, 139, 160], [187, 201, 218], [248, 251, 255]]
};
let spectrogramColorLut = new Uint8Array(256 * 3);

// EN: Builds the lookup table for the selected spectrogram color palette.
// RU: Создаёт таблицу цветов для выбранной палитры спектрограммы.
// UK: Створює таблицю кольорів для вибраної палітри спектрограми.
function rebuildSpectrogramColorLut() {
  const palette = SPECTROGRAM_PALETTE_MAP[spectrogramPaletteMode] || SPECTROGRAM_PALETTE_MAP.neon;
  const lut = new Uint8Array(256 * 3);
  for (let sample = 0; sample < 256; sample += 1) {
    const value = sample / 255;
    const adjusted = Math.max(0, Math.min(1, (Math.pow(value, 0.78) - 0.035) / 0.965));
    const position = adjusted * (palette.length - 1);
    const left = Math.floor(position);
    const right = Math.min(palette.length - 1, left + 1);
    const blend = position - left;
    const a = palette[left];
    const b = palette[right];
    const offset = sample * 3;
    lut[offset] = Math.round(a[0] + (b[0] - a[0]) * blend);
    lut[offset + 1] = Math.round(a[1] + (b[1] - a[1]) * blend);
    lut[offset + 2] = Math.round(a[2] + (b[2] - a[2]) * blend);
  }
  spectrogramColorLut = lut;
}
rebuildSpectrogramColorLut();

// EN: Formats RGB channel values as a CSS color string.
// RU: Форматирует значения каналов RGB в строку CSS-цвета.
// UK: Форматує значення каналів RGB у рядок CSS-кольору.
function rgbString(color, alpha = 1) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

// EN: Returns the color stops for the active visualizer palette.
// RU: Возвращает цветовые точки выбранной палитры визуализатора.
// UK: Повертає кольорові точки вибраної палітри візуалізатора.
function getVisualizerPalette() {
  return SPECTROGRAM_PALETTE_MAP[visualizerPaletteMode] || SPECTROGRAM_PALETTE_MAP.neon;
}

// EN: Creates a canvas gradient from a visualizer palette definition.
// RU: Создаёт градиент canvas по определению палитры визуализатора.
// UK: Створює градієнт canvas за визначенням палітри візуалізатора.
function createPaletteGradient(context, x1, y1, x2, y2, reverse = false, vivid = false) {
  const gradient = context.createLinearGradient(x1, y1, x2, y2);
  const palette = getVisualizerPalette();
  const visiblePalette = vivid ? palette.slice(Math.min(palette.length - 1, Math.floor(palette.length * 0.25))) : palette;
  const colors = reverse ? [...visiblePalette].reverse() : visiblePalette;
  colors.forEach((color, index) => gradient.addColorStop(colors.length > 1 ? index / (colors.length - 1) : 0, rgbString(color)));
  return gradient;
}

// EN: Sizes the spectrogram canvas and rebuilds dependent color/history buffers.
// RU: Изменяет размер canvas спектрограммы и пересоздаёт связанные буферы истории и цветов.
// UK: Змінює розмір canvas спектрограми та перебудовує пов’язані буфери історії й кольорів.
function resizeSpectrogramCanvas() {
  if (!spectrogramCanvas) return;
  const rect = spectrogramCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, getEnergySavingProfile().canvasDpr);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  const resized = spectrogramCanvas.width !== width || spectrogramCanvas.height !== height;
  if (resized) {
    spectrogramCanvas.width = width;
    spectrogramCanvas.height = height;
    spectrogramState.imageData = null;
  }
  spectrogramState.context = spectrogramCanvas.getContext('2d', { alpha: false });
  spectrogramState.width = width;
  spectrogramState.height = height;
  renderSpectrogram();
}

// EN: Draws the stored frequency history using the active palette and grid options.
// RU: Отрисовывает историю частот с выбранной палитрой и параметрами сетки.
// UK: Малює історію частот із вибраною палітрою та параметрами сітки.
function renderSpectrogram() {
  if (!showSpectrogram) return;
  const context = spectrogramState.context;
  const width = spectrogramState.width;
  const height = spectrogramState.height;
  if (!context || !width || !height) return;

  if (!spectrogramState.imageData || spectrogramState.imageData.width !== width || spectrogramState.imageData.height !== height) {
    spectrogramState.imageData = context.createImageData(width, height);
  }
  const frame = spectrogramState.imageData;
  const pixels = frame.data;
  const background = [7, 11, 27];
  const sampleCount = spectrogramState.history.length;
  const bandCount = Math.max(1, visualizerBands);
  const maxAge = Math.max(0, spectrogramState.maxRows - 1);
  // Precompute horizontal interpolation once per canvas/band layout rather than
  // recalculating divisions and floors for every pixel of each frame.
  if (!spectrogramState.xSampleMap || spectrogramState.xSampleMapWidth !== width || spectrogramState.xSampleMapBands !== bandCount) {
    const map = new Array(width);
    for (let x = 0; x < width; x += 1) {
      const position = (x / Math.max(1, width - 1)) * (bandCount - 1);
      const lower = Math.floor(position);
      map[x] = { lower, upper: Math.min(bandCount - 1, lower + 1), mix: position - lower };
    }
    spectrogramState.xSampleMap = map;
    spectrogramState.xSampleMapWidth = width;
    spectrogramState.xSampleMapBands = bandCount;
  }
  const xSampleMap = spectrogramState.xSampleMap;

  for (let y = 0; y < height; y += 1) {
    // Newest frame is at the bottom. Smooth mode blends adjacent frames over time.
    const agePosition = ((height - 1 - y) / Math.max(1, height - 1)) * maxAge;
    const ageLow = Math.floor(agePosition);
    const ageHigh = Math.min(maxAge, ageLow + 1);
    const ageMix = spectrogramSmoothingEnabled ? agePosition - ageLow : 0;
    const lowFrame = ageLow < sampleCount ? spectrogramState.history[ageLow] : null;
    const highFrame = ageHigh < sampleCount ? spectrogramState.history[ageHigh] : null;
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (lowFrame || (spectrogramSmoothingEnabled && highFrame)) {
        const column = xSampleMap[x];
        const lowValue = lowFrame
          ? (lowFrame[column.lower] || 0) * (1 - column.mix) + (lowFrame[column.upper] || 0) * column.mix
          : 0;
        const highValue = highFrame
          ? (highFrame[column.lower] || 0) * (1 - column.mix) + (highFrame[column.upper] || 0) * column.mix
          : 0;
        const rawValue = spectrogramSmoothingEnabled
          ? lowValue * (1 - ageMix) + highValue * ageMix
          : lowValue;
        const value = Math.min(1, Math.max(0, rawValue * visualizerSensitivity / 100));
        const lutOffset = Math.round(value * 255) * 3;
        pixels[offset] = spectrogramColorLut[lutOffset];
        pixels[offset + 1] = spectrogramColorLut[lutOffset + 1];
        pixels[offset + 2] = spectrogramColorLut[lutOffset + 2];
      } else {
        pixels[offset] = background[0];
        pixels[offset + 1] = background[1];
        pixels[offset + 2] = background[2];
      }
      pixels[offset + 3] = 255;
    }
  }
  context.putImageData(frame, 0, 0);

  if (spectrogramGridEnabled) {
    // Guides are deliberately subtle so they never overpower the heatmap.
    context.save();
    context.lineWidth = 1;
    context.strokeStyle = 'rgba(200, 218, 255, 0.13)';
    [0.25, 0.5, 0.75].forEach((position) => {
      const x = Math.round(width * position) + 0.5;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    });
    [0.25, 0.5, 0.75].forEach((position) => {
      const y = Math.round(height * position) + 0.5;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    });
    context.restore();
  }

  // A luminous time marker clarifies which row is the newest audio frame.
  const baseline = Math.max(1, height - 2);
  const baselineGradient = context.createLinearGradient(0, 0, width, 0);
  baselineGradient.addColorStop(0, 'rgba(34, 211, 238, 0.9)');
  baselineGradient.addColorStop(0.52, 'rgba(167, 139, 250, 0.85)');
  baselineGradient.addColorStop(1, 'rgba(244, 114, 182, 0.9)');
  context.save();
  context.strokeStyle = baselineGradient;
  context.globalAlpha = 0.72;
  context.lineWidth = spectrogramGlowEnabled ? 1.5 : 1;
  if (spectrogramGlowEnabled) {
    context.shadowColor = 'rgba(34, 211, 238, 0.9)';
    context.shadowBlur = 7;
  }
  context.beginPath();
  context.moveTo(0, baseline + 0.5);
  context.lineTo(width, baseline + 0.5);
  context.stroke();
  context.restore();
}

// EN: Adds one time slice of frequency data to spectrogram history.
// RU: Добавляет один временной срез частотных данных в историю спектрограммы.
// UK: Додає один часовий зріз частотних даних до історії спектрограми.
function appendSpectrogramFrame(bands) {
  const safeFrame = Array.from({ length: visualizerBands }, (_, index) => {
    const value = Number(bands[index] || 0);
    return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  });
  spectrogramState.history.unshift(safeFrame);
  if (spectrogramState.history.length > spectrogramState.maxRows) {
    spectrogramState.history.length = spectrogramState.maxRows;
  }
  renderSpectrogram();
}

// EN: Clears the spectrogram history and redraws the empty state.
// RU: Очищает историю спектрограммы и перерисовывает пустое состояние.
// UK: Очищає історію спектрограми та перемальовує порожній стан.
function clearSpectrogram() {
  spectrogramState.history = [];
  renderSpectrogram();
}

// EN: Renders the current FFT bins in the selected bar/line visualizer style.
// RU: Отрисовывает текущие FFT-данные в выбранном стиле визуализатора.
// UK: Малює поточні FFT-дані у вибраному стилі візуалізатора.
function drawSpectrum(timestamp = 0, oneShot = false) {
  if ((!visualizerAnimationEnabled && !oneShot) || !showFrequencyVisualizer || !frequencyCanvas || !frequencyCanvas.isConnected) {
    if (!oneShot) spectrumState.animationFrame = 0;
    return;
  }
  if (!oneShot) {
    spectrumState.animationFrame = 0;
    scheduleSpectrumRender(getEnergySavingProfile().frameIntervalMs);
  }
  if (!showFrequencyVisualizer) return;
  if (!oneShot) spectrumState.lastDrawAt = timestamp;
  const context = spectrumState.context;
  if (!context) return;
  const rect = frequencyCanvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  if (width < 1 || height < 1) return;

  const elapsed = oneShot ? 16 : (spectrumState.lastFrame ? Math.min(40, timestamp - spectrumState.lastFrame) : 16);
  if (!oneShot) spectrumState.lastFrame = timestamp;
  context.clearRect(0, 0, width, height);

  // Subtle level grid and low-opacity frequency guides.
  context.lineWidth = 1;
  context.strokeStyle = 'rgba(148, 163, 184, 0.105)';
  for (let line = 1; line <= 3; line += 1) {
    const y = Math.round((height - 8) * line / 4) + 0.5;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.strokeStyle = 'rgba(165, 180, 252, 0.09)';
  [0.25, 0.5, 0.75].forEach((position) => {
    const x = Math.round(width * position) + 0.5;
    context.beginPath();
    context.moveTo(x, 4);
    context.lineTo(x, height - 4);
    context.stroke();
  });

  const count = spectrumState.current.length;
  const sidePadding = 5;
  const usableWidth = Math.max(0, width - sidePadding * 2);
  const gap = visualizerStyle === 'bars' ? Math.min(1.7, usableWidth / Math.max(1, count * 5)) : 0;
  const barWidth = Math.max(1, (usableWidth - gap * (count - 1)) / count);
  const baseY = height - 5;
  const maxHeight = height - 17;
  const motion = Math.min(1, elapsed / 16.67);
  const values = [];

  for (let i = 0; i < count; i += 1) {
    const target = Math.min(1, Math.max(0, (spectrumState.target[i] || 0) * visualizerSensitivity / 100));
    const current = spectrumState.current[i];
    spectrumState.current[i] = visualizerAnimationEnabled && !oneShot
      ? current + (target - current) * (target > current ? 0.36 * motion : 0.12 * motion)
      : target;
    if (spectrumState.current[i] > spectrumState.peaks[i]) {
      spectrumState.peaks[i] = spectrumState.current[i];
    } else {
      spectrumState.peaks[i] = Math.max(spectrumState.current[i], spectrumState.peaks[i] - 0.006 * motion);
    }
    values.push(Math.min(1, Math.pow(Math.max(0, spectrumState.current[i]), 0.78)));
  }

  const makeGradient = (top, bottom) => createPaletteGradient(context, 0, top, 0, bottom, true);
  const lineGradient = createPaletteGradient(context, 0, 0, width, 0, false, true);
  const glowColor = rgbString(getVisualizerPalette()[Math.min(getVisualizerPalette().length - 1, Math.floor(getVisualizerPalette().length * 0.65))], 0.8);

  if (visualizerStyle === 'line' || visualizerStyle === 'wave') {
    context.beginPath();
    const points = values.map((strength, i) => ({
      x: sidePadding + (count <= 1 ? 0 : i * usableWidth / (count - 1)),
      y: baseY - strength * maxHeight
    }));
    if (points.length) {
      context.moveTo(points[0].x, points[0].y);
      if (visualizerStyle === 'wave' && points.length > 2) {
        for (let i = 1; i < points.length; i += 1) {
          const midpointX = (points[i - 1].x + points[i].x) / 2;
          const midpointY = (points[i - 1].y + points[i].y) / 2;
          context.quadraticCurveTo(points[i - 1].x, points[i - 1].y, midpointX, midpointY);
        }
        const last = points[points.length - 1];
        context.lineTo(last.x, last.y);
      } else {
        for (let i = 1; i < points.length; i += 1) context.lineTo(points[i].x, points[i].y);
      }
    }
    context.strokeStyle = lineGradient;
    context.lineWidth = visualizerStyle === 'wave' ? 2.6 : 2;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.shadowColor = glowColor;
    context.shadowBlur = visualizerGlowEnabled ? (visualizerStyle === 'wave' ? 9 : 5) : 0;
    context.stroke();
    context.shadowBlur = 0;
    const lastX = sidePadding + usableWidth;
    context.lineTo(lastX, baseY);
    context.lineTo(sidePadding, baseY);
    context.closePath();
    const fillGradient = context.createLinearGradient(0, 0, 0, baseY);
    const palette = getVisualizerPalette();
    const low = palette[0];
    const high = palette[palette.length - 1];
    fillGradient.addColorStop(0, rgbString(high, 0.24));
    fillGradient.addColorStop(1, rgbString(low, 0.025));
    context.fillStyle = fillGradient;
    context.fill();
    if (visualizerPeakHoldEnabled) {
      context.save();
      context.fillStyle = rgbString(getVisualizerPalette()[getVisualizerPalette().length - 1]);
      context.shadowColor = glowColor;
      context.shadowBlur = visualizerGlowEnabled ? 5 : 0;
      for (let i = 0; i < count; i += 1) {
        const x = sidePadding + (count <= 1 ? 0 : i * usableWidth / (count - 1));
        const peakStrength = Math.min(1, Math.pow(Math.max(0, spectrumState.peaks[i] || 0), 0.78));
        const y = baseY - peakStrength * maxHeight;
        context.beginPath();
        context.arc(x, y, 1.45, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }
  } else {
    const centerY = Math.round(height * 0.5);
    for (let i = 0; i < count; i += 1) {
      const strength = values[i];
      const x = sidePadding + i * (barWidth + gap);
      let y;
      let barHeight;
      if (visualizerStyle === 'mirror') {
        barHeight = Math.max(1.5, strength * (height * 0.43));
        y = centerY - barHeight;
      } else {
        barHeight = Math.max(1.5, strength * maxHeight);
        y = baseY - barHeight;
      }
      context.globalAlpha = 0.92;
      context.shadowColor = glowColor;
      context.shadowBlur = visualizerGlowEnabled ? (visualizerStyle === 'dots' ? 7 : 4) : 0;
      context.fillStyle = visualizerStyle === 'dots'
        ? lineGradient
        : makeGradient(y, visualizerStyle === 'mirror' ? centerY + barHeight : baseY);
      if (visualizerStyle === 'dots') {
        const radius = Math.max(1.15, Math.min(3.8, barWidth * 0.42));
        context.beginPath();
        context.arc(x + barWidth / 2, y, radius, 0, Math.PI * 2);
        context.fill();
        if (visualizerPeakHoldEnabled) {
          const peakStrength = Math.min(1, Math.pow(Math.max(0, spectrumState.peaks[i] || 0), 0.78));
          const peakY = baseY - peakStrength * maxHeight;
          context.globalAlpha = 0.85;
          context.shadowBlur = visualizerGlowEnabled ? 3 : 0;
          context.fillStyle = rgbString(getVisualizerPalette()[getVisualizerPalette().length - 1]);
          context.beginPath();
          context.arc(x + barWidth / 2, peakY, Math.max(1, radius * 0.45), 0, Math.PI * 2);
          context.fill();
          context.globalAlpha = 0.92;
        }
      } else {
        const roundedHeight = Math.min(barHeight, Math.max(2, barWidth));
        if (typeof context.roundRect === 'function') {
          context.beginPath();
          context.roundRect(x, y, barWidth, barHeight, roundedHeight / 2);
          context.fill();
        } else {
          context.fillRect(x, y, barWidth, barHeight);
        }
        if (visualizerStyle === 'mirror') {
          context.fillRect(x, Math.min(height, centerY + 1), barWidth, Math.max(1, Math.min(height - centerY - 1, barHeight)));
        }
      }
      if (visualizerPeakHoldEnabled && visualizerStyle !== 'dots') {
        const peakStrength = Math.min(1, Math.pow(Math.max(0, spectrumState.peaks[i] || 0), 0.78));
        const peakHeight = Math.max(2, peakStrength * (visualizerStyle === 'mirror' ? height * 0.43 : maxHeight));
        context.globalAlpha = 0.85;
        context.shadowBlur = visualizerGlowEnabled ? 4 : 0;
        context.fillStyle = rgbString(getVisualizerPalette()[getVisualizerPalette().length - 1]);
        if (visualizerStyle === 'mirror') {
          context.fillRect(x, Math.max(2, centerY - peakHeight - 1), barWidth, 1.5);
          context.fillRect(x, Math.min(height - 2, centerY + peakHeight), barWidth, 1.5);
        } else {
          context.fillRect(x, Math.max(3, baseY - peakHeight - 2), barWidth, 1.5);
        }
      }
      context.shadowBlur = 0;
    }
  }

  context.globalAlpha = 1;
  context.shadowBlur = 0;
}

// EN: Updates visualizer status text according to capture and sampling availability.
// RU: Обновляет статус визуализатора в зависимости от захвата и доступности выборок.
// UK: Оновлює стан візуалізатора залежно від захоплення та доступності вибірок.
function updateVisualizerLiveStatus() {
  if (!visualizerLive || !visualizerLiveText) return;
  const running = spectrumState.captureActive && visualizerAnimationEnabled;
  visualizerLive.classList.toggle('active', running);
  visualizerLive.classList.toggle('idle', !running);
  visualizerLiveText.textContent = spectrumState.captureActive && !visualizerAnimationEnabled
    ? t('visualizerPaused')
    : (running ? t('visualizerLive') : t('visualizerIdle'));
}

// EN: Visualization messages are normalized before they reach the canvas renderers.
// RU: Сообщения визуализации нормализуются перед передачей в отрисовку canvas.
// UK: Повідомлення візуалізації нормалізуються перед передаванням до відтворення canvas.
function acceptSpectrumMessage(message) {
  const wasCaptureActive = spectrumState.captureActive;
  const previouslyHadSignal = spectrumState.hasSignal;
  spectrumState.captureActive = message.active === true;
  // A frame already in transit may arrive after the user changes band count.
  // Ignore stale frames rather than letting them revert the selected resolution.
  if (spectrumState.captureActive && Array.isArray(message.bins) && message.bins.length > 0 && message.bins.length !== visualizerBands) {
    updateVisualizerLiveStatus();
    if (wasCaptureActive !== spectrumState.captureActive) updateCaptureStatusIndicator();
    return;
  }
  if (Array.isArray(message.bins)) {
    const length = spectrumState.target.length;
    for (let i = 0; i < length; i += 1) {
      const value = Number(message.bins[i] || 0);
      const finiteValue = Number.isFinite(value) ? value : 0;
      spectrumState.target[i] = Math.min(1, Math.max(0, finiteValue));
    }
    if (spectrumState.captureActive && showSpectrogram) appendSpectrogramFrame(spectrumState.target);
    else if (!spectrumState.captureActive) clearSpectrogram();
    const strongest = Math.max(0, ...spectrumState.target);
    if (spectrumState.captureActive && strongest > 0.045) {
      spectrumState.hasSignal = true;
      spectrumState.quietFrames = 0;
    } else {
      spectrumState.quietFrames += 1;
      if (!spectrumState.captureActive || spectrumState.quietFrames > 18) {
        spectrumState.hasSignal = false;
      }
    }
  } else if (!spectrumState.captureActive) {
    spectrumState.target.fill(0);
    spectrumState.hasSignal = false;
    clearSpectrogram();
  }
  spectrogramEmpty.classList.toggle('hidden', spectrumState.hasSignal);
  spectrogramEmpty.textContent = t('spectrogramWaiting');
  visualizerEmpty.classList.toggle('hidden', spectrumState.hasSignal);
  updateVisualizerLiveStatus();
  if (!visualizerAnimationEnabled && showFrequencyVisualizer) drawSpectrum(0, true);
  if (!spectrumState.captureActive) {
    spectrumState.hasSignal = false;
    visualizerEmpty.textContent = t('visualizerWaiting');
    visualizerEmpty.classList.remove('hidden');
  } else {
    visualizerEmpty.textContent = t('visualizerWaiting');
  }
  if (wasCaptureActive !== spectrumState.captureActive || previouslyHadSignal !== spectrumState.hasSignal) {
    updateCaptureStatusIndicator();
  }
}

chrome.runtime.onMessage.addListener((message, sender) => {
  // Spectrum samples are accepted only from this extension's offscreen audio context.
  if (!sender || sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('offscreen.html')) return;
  if (message && message.type === 'SPECTRUM_DATA') acceptSpectrumMessage(message);
  if (message && message.type === 'AUDIO_PROTECTION_STATUS') handleProtectionStatus(message);
  if (message && message.type === 'AUTO_GENRE_STATUS') acceptAutoGenreStatus(message);
});

// EN: Confirms that the current popup tab is the one being captured.
// RU: Проверяет, что именно текущая вкладка захватывает аудио.
// UK: Перевіряє, що саме поточна вкладка захоплює аудіо.
function currentTabHasCapture() {
  return extensionCaptureActive && Number.isInteger(currentTabId) && capturedTabId === currentTabId;
}

// EN: Synchronizes enable/disable buttons with current capture state and page support.
// RU: Синхронизирует кнопки включения/выключения с состоянием захвата и поддержкой страницы.
// UK: Синхронізує кнопки ввімкнення/вимкнення зі станом захоплення та підтримкою сторінки.
function updateCaptureButtons() {
  const activeHere = currentTabHasCapture();
  if (enableExtensionBtn) {
    enableExtensionBtn.disabled = !currentTabSupportsCapture || activeHere || captureTransitionInProgress;
    enableExtensionBtn.classList.toggle('active', activeHere);
    enableExtensionBtn.setAttribute('aria-pressed', String(activeHere));
  }
  if (disableExtensionBtn) {
    disableExtensionBtn.disabled = !extensionCaptureActive || captureTransitionInProgress;
    disableExtensionBtn.classList.toggle('active', extensionCaptureActive && !activeHere);
    disableExtensionBtn.setAttribute('aria-pressed', String(extensionCaptureActive));
  }
  updateCaptureStatusIndicator();
}

// EN: Updates local UI state from the active capture tab ID.
// RU: Обновляет состояние интерфейса по ID вкладки активного захвата.
// UK: Оновлює стан інтерфейсу за ID вкладки активного захоплення.
function applyCaptureState(active, tabId = null) {
  extensionCaptureActive = active === true && Number.isInteger(tabId);
  capturedTabId = extensionCaptureActive ? tabId : null;
  const activeHere = currentTabHasCapture();
  updateCaptureButtons();
  setAudioControlsReady(activeHere);
  if (!activeHere) {
    stopSpectrumRendering();
    acceptSpectrumMessage({ type: 'SPECTRUM_DATA', active: false, bins: [] });
  }
  return activeHere;
}

// EN: Explains why capture is inactive or belongs to another tab.
// RU: Объясняет, почему захват не активен или выполняется в другой вкладке.
// UK: Пояснює, чому захоплення неактивне або виконується в іншій вкладці.
function showInactiveCaptureStatus() {
  if (!currentTabSupportsCapture) {
    showStatus(t('siteNotSupported'));
  } else if (extensionCaptureActive) {
    showStatus(t('captureActiveOtherTab'));
  } else {
    showStatus(t('extensionDisabled'));
  }
}

// EN: Displays current capture, transition, error, and source status in the status card.
// RU: Показывает в карточке статус захвата, перехода, ошибки и источника.
// UK: Показує в картці стан захоплення, переходу, помилки та джерела.
function updateCaptureStatusIndicator() {
  if (!captureStatusIndicator || !captureStatusTitle || !captureStatusDescription || !captureSourceBadge) return;
  captureStatusIndicator.hidden = !showAllMessages || !showCaptureStatusIndicator;
  if (!showAllMessages || !showCaptureStatusIndicator) return;

  const activeHere = currentTabHasCapture();
  let state;
  let titleKey;
  let descriptionKey;

  if (captureIndicatorError) {
    state = 'error';
    titleKey = 'captureStatusErrorTitle';
    descriptionKey = 'captureStatusErrorDescription';
  } else if (captureTransitionInProgress) {
    state = captureTransitionStatus === 'stopping' ? 'stopping' : 'starting';
    titleKey = state === 'stopping' ? 'captureStatusStoppingTitle' : 'captureStatusStartingTitle';
    descriptionKey = state === 'stopping' ? 'captureStatusStoppingDescription' : 'captureStatusStartingDescription';
  } else if (activeHere) {
    if (typeof shouldSampleSpectrum === 'function' && shouldSampleSpectrum()) {
      state = spectrumState.hasSignal ? 'active' : 'waiting';
      titleKey = spectrumState.hasSignal ? 'captureStatusActiveTitle' : 'captureStatusWaitingTitle';
      descriptionKey = spectrumState.hasSignal ? 'captureStatusSignalDescription' : 'captureStatusWaitingDescription';
    } else {
      state = 'active';
      titleKey = 'captureStatusActiveTitle';
      descriptionKey = 'captureStatusActiveDescription';
    }
  } else if (extensionCaptureActive) {
    state = 'other-tab';
    titleKey = 'captureStatusOtherTabTitle';
    descriptionKey = 'captureStatusOtherTabDescription';
  } else if (!currentTabSupportsCapture) {
    state = 'unsupported';
    titleKey = 'captureStatusUnsupportedTitle';
    descriptionKey = 'captureStatusUnsupportedDescription';
  } else {
    state = 'ready';
    titleKey = 'captureStatusReadyTitle';
    descriptionKey = 'captureStatusReadyDescription';
  }

  let sourceKey;
  if (extensionCaptureActive && !activeHere) sourceKey = 'captureStatusSourceOtherTab';
  else if (currentTabIsSpotifyWebPlayer) sourceKey = 'captureStatusSourceSpotify';
  else if (currentTabIsYouTubeVideo) sourceKey = 'captureStatusSourceYoutube';
  else sourceKey = 'captureStatusSourceUnavailable';

  captureStatusIndicator.dataset.state = state;
  captureStatusTitle.textContent = t(titleKey);
  captureStatusDescription.textContent = t(descriptionKey);
  captureSourceBadge.textContent = t(sourceKey);
  captureStatusIndicator.setAttribute('aria-label', `${t(titleKey)}. ${t(descriptionKey)} ${t(sourceKey)}`);
}

// EN: Requests the optional page volume indicator after the capture has been authorized.
// RU: Запрашивает необязательный индикатор громкости на странице после разрешённого запуска захвата.
// UK: Запитує необов’язковий індикатор гучності на сторінці після дозволеного запуску захоплення.
async function injectPageIndicator(tabId) {
  // Inject only after an explicit Enable click, and only on supported media sites.
  const [injectionState] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({ indicator: Boolean(window.volumeControllerInjected), tracker: Boolean(window.volumeControllerTrackWatcherInjected) })
  });
  const state = injectionState && injectionState.result ? injectionState.result : { indicator: false, tracker: false };
  if (!state.indicator) {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ['styles.css'] });
  }
  if (!state.indicator || !state.tracker) {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  } else {
    await chrome.tabs.sendMessage(tabId, { type: 'START_TRACK_WATCHER' }).catch(() => {});
  }
}

// EN: Starts capture only for a supported current tab after an explicit user action.
// RU: Запускает захват только на поддерживаемой вкладке после явного действия пользователя.
// UK: Запускає захоплення лише на підтримуваній вкладці після явної дії користувача.
async function enableCaptureForCurrentTab() {
  if (!currentTabSupportsCapture || !Number.isInteger(currentTabId) || captureTransitionInProgress) {
    if (!currentTabSupportsCapture) showStatus(t('siteNotSupported'), true);
    return;
  }
  if (currentTabHasCapture()) return;

  captureIndicatorError = false;
  captureTransitionStatus = 'starting';
  captureTransitionInProgress = true;
  updateCaptureButtons();
  setAudioControlsReady(false);
  showStatus(t('extensionStarting'));
  try {
    try {
      await injectPageIndicator(currentTabId);
    } catch (injectionError) {
      // The indicator is optional; an injection failure must not prevent audio capture.
      console.debug('Volume indicator unavailable on this tab:', injectionError && injectionError.message ? injectionError.message : injectionError);
    }
    const result = await chrome.runtime.sendMessage({ type: 'START_CAPTURE', tabId: currentTabId });
    if (!result || result.success !== true) {
      captureIndicatorError = true;
      const detail = result && result.error ? localizeErrorDetail(result.error) : t('captureStartError');
      showStatus(detail ? t('captureError', { detail }) : t('captureStartError'), true);
      const latest = await chrome.runtime.sendMessage({ type: 'GET_CAPTURE_STATUS' }).catch(() => null);
      applyCaptureState(Boolean(latest && latest.active), latest && latest.tabId);
      return;
    }

    applyCaptureState(true, currentTabId);
    await persistVisualizerOptionsToBackground();
    const visualizerResult = await chrome.runtime.sendMessage({ type: 'VISUALIZER_CONTROL', enabled: shouldSampleSpectrum() });
    if (visualizerResult && visualizerResult.success === false) {
      acceptSpectrumMessage({ type: 'SPECTRUM_DATA', active: false, bins: [] });
    } else {
      acceptSpectrumMessage({ type: 'SPECTRUM_DATA', active: true, bins: new Array(visualizerBands).fill(0) });
      if (shouldRenderFrequencySpectrum()) startSpectrumRendering();
    }

    if (currentTabIsSpotifyWebPlayer) {
      showStatus(t('spotifyConnected'));
    } else {
      showStatus(t('extensionEnabled'));
    }
  } catch (error) {
    captureIndicatorError = true;
    const detail = error && error.message ? localizeErrorDetail(error.message) : t('captureStartError');
    showStatus(t('captureError', { detail }), true);
    const latest = await chrome.runtime.sendMessage({ type: 'GET_CAPTURE_STATUS' }).catch(() => null);
    applyCaptureState(Boolean(latest && latest.active), latest && latest.tabId);
  } finally {
    captureTransitionInProgress = false;
    captureTransitionStatus = null;
    updateCaptureButtons();
    setAudioControlsReady(currentTabHasCapture());
  }
}

// EN: Stops capture and clears the page indicator, visualization, and active-tab state.
// RU: Останавливает захват и очищает индикатор страницы, визуализацию и состояние вкладки.
// UK: Зупиняє захоплення та очищає індикатор сторінки, візуалізацію й стан вкладки.
async function disableCapture() {
  if (!extensionCaptureActive || captureTransitionInProgress) return;
  captureIndicatorError = false;
  captureTransitionStatus = 'stopping';
  captureTransitionInProgress = true;
  updateCaptureButtons();
  showStatus(t('extensionStopping'));
  stopSpectrumRendering();
  try {
    const result = await chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' });
    if (!result || result.success !== true) {
      captureIndicatorError = true;
      showStatus(t('captureStopError'), true);
      return;
    }
    await chrome.runtime.sendMessage({ type: 'VISUALIZER_CONTROL', enabled: false }).catch((error) => {
      console.debug('Capture stopped, but visualizer shutdown acknowledgement failed:', error?.message || error);
    });
    applyCaptureState(false, null);
    showInactiveCaptureStatus();
  } catch (error) {
    captureIndicatorError = true;
    showStatus(t('captureStopError'), true);
  } finally {
    captureTransitionInProgress = false;
    captureTransitionStatus = null;
    updateCaptureButtons();
    setAudioControlsReady(currentTabHasCapture());
  }
}

window.addEventListener('resize', () => { resizeSpectrumCanvas(); resizeSpectrogramCanvas(); }, { passive: true });
window.addEventListener('pagehide', () => {
  stopSpectrumRendering();
  // Stop offscreen sampling as soon as the browser popup closes.
  chrome.runtime.sendMessage({ type: 'VISUALIZER_CONTROL', enabled: false }).catch(() => {});
});

// EN: Bootstrap: load persisted preferences first, then translations/audio settings, and finally inspect capture state.
// RU: Инициализация: сначала загружаются сохранённые параметры, затем переводы/аудионастройки и только потом состояние захвата.
// UK: Ініціалізація: спочатку завантажуються збережені параметри, потім переклади/аудіоналаштування і лише тоді стан захоплення.
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load persisted UI preferences first, falling back to safe defaults.
    const savedPreferences = await chrome.storage.local.get([
      'language', 'themeMode', 'rgbGlow', 'activeAudioPreset',
      'visualizerStyle', 'visualizerPalette', 'visualizerGlowEnabled', 'visualizerPeakHoldEnabled', 'spectrogramGridEnabled', 'spectrogramSmoothingEnabled', 'spectrogramGlowEnabled',
      'visualizerSensitivity', 'visualizerBands', 'spectrogramPalette', 'spectrogramDuration', 'visualizerAnimationEnabled',
      'showFrequencyVisualizer', 'showSpectrogram', 'showBassBoostPanel', 'showVoiceBoostPanel', 'showClippingWarning', 'showAllMessages', 'showCaptureStatusIndicator', 'showQuickSettings', 'autoGenreEnabled', 'autoGenreStatus', 'autoGenreBassManualOverride', 'autoGenreVoiceManualOverride', 'genreParameterModeVersion', 'energySavingEnabled', 'energySavingMode', 'youtubeAudioProfile', 'spotifyAudioProfile'
    ]);
    language = ['ru', 'en', 'uk'].includes(savedPreferences.language) ? savedPreferences.language : 'ru';
    themeMode = ['dark', 'light', 'system'].includes(savedPreferences.themeMode) ? savedPreferences.themeMode : 'system';
    rgbGlowEnabled = typeof savedPreferences.rgbGlow === 'boolean' ? savedPreferences.rgbGlow : true;
    visualizerStyle = VISUALIZER_STYLES.includes(savedPreferences.visualizerStyle) ? savedPreferences.visualizerStyle : 'bars';
    visualizerPaletteMode = SPECTROGRAM_PALETTES.includes(savedPreferences.visualizerPalette) ? savedPreferences.visualizerPalette : 'neon';
    visualizerGlowEnabled = savedPreferences.visualizerGlowEnabled !== false;
    visualizerPeakHoldEnabled = savedPreferences.visualizerPeakHoldEnabled !== false;
    spectrogramGridEnabled = savedPreferences.spectrogramGridEnabled !== false;
    spectrogramSmoothingEnabled = savedPreferences.spectrogramSmoothingEnabled !== false;
    spectrogramGlowEnabled = savedPreferences.spectrogramGlowEnabled !== false;
    visualizerSensitivity = Number.isInteger(savedPreferences.visualizerSensitivity) && savedPreferences.visualizerSensitivity >= 50 && savedPreferences.visualizerSensitivity <= 200 && savedPreferences.visualizerSensitivity % 25 === 0 ? savedPreferences.visualizerSensitivity : 100;
    savedVisualizerSensitivity = visualizerSensitivity;
    visualizerBands = VISUALIZER_BAND_OPTIONS.includes(savedPreferences.visualizerBands) ? savedPreferences.visualizerBands : 48;
    spectrogramPaletteMode = SPECTROGRAM_PALETTES.includes(savedPreferences.spectrogramPalette) ? savedPreferences.spectrogramPalette : 'neon';
    spectrogramDuration = SPECTROGRAM_DURATIONS.includes(savedPreferences.spectrogramDuration) ? savedPreferences.spectrogramDuration : 4;
    visualizerAnimationEnabled = savedPreferences.visualizerAnimationEnabled !== false;
    showFrequencyVisualizer = savedPreferences.showFrequencyVisualizer !== false;
    showSpectrogram = savedPreferences.showSpectrogram !== false;
    showBassBoostPanel = savedPreferences.showBassBoostPanel !== false;
    showVoiceBoostPanel = savedPreferences.showVoiceBoostPanel !== false;
    showClippingWarning = savedPreferences.showClippingWarning !== false;
    showAllMessages = savedPreferences.showAllMessages !== false;
    showCaptureStatusIndicator = savedPreferences.showCaptureStatusIndicator !== false;
    showQuickSettings = savedPreferences.showQuickSettings !== false;
    autoGenreEnabled = typeof savedPreferences.autoGenreEnabled === 'boolean' ? savedPreferences.autoGenreEnabled : true;
    serviceAudioProfileConfigured = {
      youtube: isValidServiceAudioProfile(savedPreferences.youtubeAudioProfile),
      spotify: isValidServiceAudioProfile(savedPreferences.spotifyAudioProfile)
    };
    serviceAudioProfiles = {
      youtube: normalizeServiceAudioProfile(savedPreferences.youtubeAudioProfile),
      spotify: normalizeServiceAudioProfile(savedPreferences.spotifyAudioProfile)
    };
    // One-time migration: previous builds stored mode bits inside transient genre status,
    // which could be stale after a track change/reopen. Start this version in AUTO, then
    // persist later user-selected modes independently from runtime status messages.
    const needsGenreModeMigration = savedPreferences.genreParameterModeVersion !== GENRE_PARAMETER_MODE_VERSION;
    autoGenreBassManualOverride = needsGenreModeMigration ? false : savedPreferences.autoGenreBassManualOverride === true;
    autoGenreVoiceManualOverride = needsGenreModeMigration ? false : savedPreferences.autoGenreVoiceManualOverride === true;
    if (needsGenreModeMigration) {
      await writeLocalSettings({
        autoGenreBassManualOverride: false,
        autoGenreVoiceManualOverride: false,
        genreParameterModeVersion: GENRE_PARAMETER_MODE_VERSION
      });
    }
    if (savedPreferences.autoGenreStatus && typeof savedPreferences.autoGenreStatus === 'object') {
      autoGenreStatus = {
        ...autoGenreStatus,
        ...savedPreferences.autoGenreStatus,
        bassManualOverride: autoGenreBassManualOverride,
        voiceManualOverride: autoGenreVoiceManualOverride
      };
    } else {
      autoGenreStatus.bassManualOverride = autoGenreBassManualOverride;
      autoGenreStatus.voiceManualOverride = autoGenreVoiceManualOverride;
    }
    energySavingEnabled = savedPreferences.energySavingEnabled === true;
    energySavingMode = ENERGY_SAVING_MODES.includes(savedPreferences.energySavingMode) ? savedPreferences.energySavingMode : 'balanced';
    const newDefaultPreferences = {};
    if (typeof savedPreferences.rgbGlow !== 'boolean') newDefaultPreferences.rgbGlow = true;
    if (typeof savedPreferences.autoGenreEnabled !== 'boolean') newDefaultPreferences.autoGenreEnabled = true;
    if (Object.keys(newDefaultPreferences).length) await writeLocalSettings(newDefaultPreferences);
    syncServiceProfileUI();
    activeAudioPreset = ['default', 'podcasts', 'audiobooks', 'music', 'video', 'series', 'movies', 'games', 'sports', 'broadcasts', 'streams', 'custom'].includes(savedPreferences.activeAudioPreset) ? savedPreferences.activeAudioPreset : 'default';
    await loadTranslations(language);
  } catch (error) {
    language = 'ru';
    themeMode = 'system';
    rgbGlowEnabled = true;
    energySavingEnabled = false;
    energySavingMode = 'balanced';
    autoGenreEnabled = true;
    autoGenreStatus = { enabled: true, active: false, genre: null, confidence: 0, source: null, trackId: '', trackTitle: '', bassManualOverride: false, voiceManualOverride: false, state: 'waiting-capture' };
    try {
      await loadTranslations('ru');
    } catch (fallbackError) {
      console.error('Could not load fallback language file:', fallbackError);
    }
  }

  rebuildSpectrogramColorLut();
  applyTranslations();
  applyTheme(themeMode);
  updateVisualizerSettingsUI({ clearHistory: true, redraw: true });
  updateAudioPanelVisibilityUI();
  updateClippingWarningSettingUI();
  updateAllMessagesVisibilityUI();
  updateProtectionUI();
  setSettingsPreferencesReady(true);
  updateCaptureStatusIndicatorVisibilityUI();
  updateQuickSettingsVisibilityUI();
  updateAutoGenreStatusUI();
  resizeSpectrumBuffers(visualizerBands);
  resizeSpectrumCanvas();
  resizeSpectrogramCanvas();
  updateVisualizerSettingsUI({ clearHistory: false, redraw: true });

  // Load audio settings before the user can manually enable capture; this keeps
  // the first audio frame from receiving stale defaults.
  try {
    const data = await chrome.storage.local.get([
      'volume', 'muted', 'bassBoostEnabled', 'bassBoostDb', 'voiceBoostEnabled', 'voiceBoostDb', 'peakLimiterEnabled', 'nightModeEnabled', 'activeAudioPreset', 'lastBoostValue', 'audioPresetTuningVersion'
    ]);

    // One-time balanced preset migration. Preserve custom EQ and any non-matching values.
    if (data.audioPresetTuningVersion !== 3) {
      const legacy = LEGACY_AUDIO_PRESETS[data.activeAudioPreset];
      const tuned = AUDIO_PRESETS[data.activeAudioPreset];
      const matchesLegacy = Boolean(legacy && tuned &&
        data.bassBoostEnabled === legacy.bassBoostEnabled && Number(data.bassBoostDb) === legacy.bassBoostDb &&
        data.voiceBoostEnabled === legacy.voiceBoostEnabled && Number(data.voiceBoostDb) === legacy.voiceBoostDb);
      const migrationUpdate = { audioPresetTuningVersion: 3 };
      let globalPresetWasMigrated = false;
      if (matchesLegacy) {
        migrationUpdate.bassBoostEnabled = tuned.bassBoostEnabled;
        migrationUpdate.bassBoostDb = tuned.bassBoostDb;
        migrationUpdate.voiceBoostEnabled = tuned.voiceBoostEnabled;
        migrationUpdate.voiceBoostDb = tuned.voiceBoostDb;
        globalPresetWasMigrated = true;
      } else if (data.activeAudioPreset === 'music' && data.voiceBoostEnabled === false && Number(data.voiceBoostDb) === 0) {
        // EN: Previous Music presets deliberately disabled Voice Boost; keep it enabled in the balanced Music preset.
        // RU: Старый пресет «Музыка» отключал Voice Boost; в сбалансированном пресете оставляем лёгкое усиление голоса.
        // UK: Старий пресет «Музика» вимикав Voice Boost; у збалансованому пресеті залишаємо легке підсилення голосу.
        migrationUpdate.voiceBoostEnabled = true;
        migrationUpdate.voiceBoostDb = 1;
        globalPresetWasMigrated = true;
      }
      if (globalPresetWasMigrated) Object.assign(data, migrationUpdate);

      // Site-specific profiles may have their own saved Music preset and need the same one-time migration.
      // EN: Preserve each service's bass and volume, changing only Voice Boost for the old Music preset.
      // RU: Сохраняем бас и громкость каждого сервиса, меняя только Voice Boost у старого пресета «Музыка».
      // UK: Зберігаємо бас і гучність кожного сервісу, змінюючи лише Voice Boost у старому пресеті «Музика».
      for (const serviceKey of SERVICE_PROFILE_KEYS) {
        const serviceProfile = serviceAudioProfiles[serviceKey];
        if (serviceProfile && serviceProfile.activeAudioPreset === 'music' &&
            serviceProfile.voiceBoostEnabled === false && serviceProfile.voiceBoostDb === 0) {
          serviceProfile.voiceBoostEnabled = true;
          serviceProfile.voiceBoostDb = 1;
          migrationUpdate[getServiceProfileStorageKey(serviceKey)] = { ...serviceProfile };
        }
      }
      try {
        await writeLocalSettings(migrationUpdate);
      } catch (migrationError) {
        // Do not block the popup if storage migration fails; existing values remain usable.
        console.warn('Audio preset migration could not be saved:', migrationError);
      }
    }
    const rawVolume = data.volume !== undefined ? Number(data.volume) : 1;
    const savedVolume = Number.isFinite(rawVolume) ? Math.round(Math.min(6, Math.max(0, rawVolume)) * 100) : 100;
    lastBoostValue = Number.isInteger(data.lastBoostValue) && data.lastBoostValue >= 100 && data.lastBoostValue <= 600 ? data.lastBoostValue : 200;
    isMuted = data.muted === true;
    bassBoostEnabled = data.bassBoostEnabled === undefined ? true : data.bassBoostEnabled === true;
    bassBoostDb = data.bassBoostDb !== undefined && Number.isFinite(Number(data.bassBoostDb))
      ? Math.min(12, Math.max(0, Math.round(Number(data.bassBoostDb))))
      : 4;
    voiceBoostEnabled = data.voiceBoostEnabled === undefined ? true : data.voiceBoostEnabled === true;
    voiceBoostDb = data.voiceBoostDb !== undefined && Number.isFinite(Number(data.voiceBoostDb))
      ? Math.min(8, Math.max(0, Math.round(Number(data.voiceBoostDb))))
      : 2;
    peakLimiterEnabled = data.peakLimiterEnabled !== false;
    nightModeEnabled = data.nightModeEnabled === true;
    updateNightModeUI();
    updateProtectionUI();

    slider.value = String(savedVolume);
    updateMuteButton();
    if (savedVolume > 100) lastBoostValue = savedVolume;
    if (['default', 'podcasts', 'audiobooks', 'music', 'video', 'series', 'movies', 'games', 'sports', 'broadcasts', 'streams'].includes(data.activeAudioPreset)) {
      activeAudioPreset = data.activeAudioPreset;
    } else {
      const matchedProfile = Object.entries(AUDIO_PRESETS).find(([, preset]) =>
        preset.bassBoostEnabled === bassBoostEnabled && preset.bassBoostDb === bassBoostDb &&
        preset.voiceBoostEnabled === voiceBoostEnabled && preset.voiceBoostDb === voiceBoostDb
      );
      activeAudioPreset = matchedProfile ? matchedProfile[0] : 'custom';
    }
    updateUI(savedVolume);
    globalAudioSettings = {
      volume: savedVolume / 100, muted: isMuted, bassBoostEnabled, bassBoostDb,
      voiceBoostEnabled, voiceBoostDb, peakLimiterEnabled, nightModeEnabled,
      activeAudioPreset, lastBoostValue
    };
    syncServiceProfileUI();
  } catch (error) {
    showStatus(t('loadError'), true);
  }
  // Import/export/reset must not run against placeholder defaults before storage resolves.
  setSettingsBackupReady(true);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !Number.isInteger(tab.id)) {
      captureIndicatorError = true;
      currentTabId = null;
      currentTabSupportsCapture = false;
      applyCaptureState(false, null);
      showStatus(t('activeTabError'), true);
      return;
    }

    currentTabId = tab.id;
    currentTabIsSpotifyWebPlayer = isSpotifyWebPlayerUrl(tab.url);
    currentTabIsYouTubeVideo = isYouTubeVideoUrl(tab.url);
    currentTabSupportsCapture = currentTabIsSpotifyWebPlayer || currentTabIsYouTubeVideo;
    activateServiceProfileForCurrentTab();

    // Opening the popup only checks status. It must never start tab capture by itself.
    let captureStatus = await chrome.runtime.sendMessage({ type: 'GET_CAPTURE_STATUS' }).catch(() => null);
    if (!captureStatus || captureStatus.success !== true) captureStatus = { active: false, tabId: null };

    // A stream should never survive if its own tab has navigated to a restricted page.
    if (!currentTabSupportsCapture && captureStatus.active === true && captureStatus.tabId === currentTabId) {
      await chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' }).catch(() => null);
      captureStatus = { active: false, tabId: null };
    }

    const activeHere = applyCaptureState(captureStatus.active === true, captureStatus.tabId);
    if (activeHere) {
      await chrome.runtime.sendMessage({ type: 'AUTO_GENRE_SETTINGS', enabled: autoGenreEnabled }).catch((error) => {
      console.debug('Could not apply automatic genre settings:', error?.message || error);
      return null;
    });
      await persistVisualizerOptionsToBackground();
      const visualizerResult = await chrome.runtime.sendMessage({ type: 'VISUALIZER_CONTROL', enabled: shouldSampleSpectrum() }).catch((error) => {
        console.debug('Could not apply visualizer sampling setting:', error?.message || error);
        return null;
      });
      if (visualizerResult && visualizerResult.success !== false) {
        acceptSpectrumMessage({ type: 'SPECTRUM_DATA', active: true, bins: new Array(visualizerBands).fill(0) });
        if (shouldRenderFrequencySpectrum()) startSpectrumRendering();
      } else {
        acceptSpectrumMessage({ type: 'SPECTRUM_DATA', active: false, bins: [] });
      }
      if (currentTabIsSpotifyWebPlayer) showStatus(t('spotifyConnected'));
      else showStatus(t('extensionEnabled'));
    } else {
      showInactiveCaptureStatus();
    }
  } catch (error) {
    currentTabId = null;
    currentTabSupportsCapture = false;
    applyCaptureState(false, null);
    showStatus(t('activeTabError'), true);
  } finally {
    updateCaptureButtons();
    setAudioControlsReady(currentTabHasCapture());
  }
});

slider.addEventListener('input', (event) => {
  const value = Number.parseInt(event.target.value, 10);
  updateUI(value);
  if (value > 100) lastBoostValue = value;
});

slider.addEventListener('change', (event) => {
  sendVolume(Number.parseInt(event.target.value, 10));
});

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const value = Number.parseInt(btn.dataset.value, 10);
    slider.value = String(value);
    if (value > 100) lastBoostValue = value;
    updateUI(value);
    sendVolume(value);
  });
});

muteButton.addEventListener('click', () => {
  isMuted = !isMuted;
  updateMuteButton();
  sendVolume(Number.parseInt(slider.value, 10));
});

// EN: Changes Bass Boost power without changing the AUTO/MANUAL mode.
// RU: Меняет включение Bass Boost, не меняя режим AUTO/РУЧНОЙ.
// UK: Змінює ввімкнення Bass Boost, не змінюючи режим AUTO/РУЧНИЙ.
function setBassBoostEnabledFromControl(enabled) {
  // Power is independent of AUTO/MANUAL; preserve the selected source of EQ values.
  bassBoostEnabled = enabled === true;
  updateBassUI();
  markAudioPresetCustom();
  sendVolume(Number.parseInt(slider.value, 10));
}

bassBoostToggle.addEventListener('change', (event) => {
  setBassBoostEnabledFromControl(event.target.checked);
});
if (settingsBassBoostToggle) {
  settingsBassBoostToggle.addEventListener('change', (event) => {
    setBassBoostEnabledFromControl(event.target.checked);
  });
}

bassBoostSlider.addEventListener('input', (event) => {
  // Moving the intensity slider explicitly switches only this EQ parameter to
  // manual mode. It never toggles the effect's separate power switch.
  if (autoGenreEnabled && autoGenreStatus.active) setGenreParameterOverride('bass', true, false);
  bassBoostDb = Math.min(12, Math.max(0, Number.parseInt(event.target.value, 10) || 0));
  updateBassUI();
});

bassBoostSlider.addEventListener('change', () => {
  markAudioPresetCustom();
  sendVolume(Number.parseInt(slider.value, 10));
});

// EN: Changes Voice Boost power without changing the AUTO/MANUAL mode.
// RU: Меняет включение Voice Boost, не меняя режим AUTO/РУЧНОЙ.
// UK: Змінює ввімкнення Voice Boost, не змінюючи режим AUTO/РУЧНИЙ.
function setVoiceBoostEnabledFromControl(enabled) {
  // Power is independent of AUTO/MANUAL; preserve the selected source of EQ values.
  voiceBoostEnabled = enabled === true;
  updateVoiceUI();
  markAudioPresetCustom();
  sendVolume(Number.parseInt(slider.value, 10));
}

voiceBoostToggle.addEventListener('change', (event) => {
  setVoiceBoostEnabledFromControl(event.target.checked);
});
if (settingsVoiceBoostToggle) {
  settingsVoiceBoostToggle.addEventListener('change', (event) => {
    setVoiceBoostEnabledFromControl(event.target.checked);
  });
}

voiceBoostSlider.addEventListener('input', (event) => {
  // Moving the intensity slider explicitly switches only this EQ parameter to
  // manual mode. It never toggles the effect's separate power switch.
  if (autoGenreEnabled && autoGenreStatus.active) setGenreParameterOverride('voice', true, false);
  voiceBoostDb = Math.min(8, Math.max(0, Number.parseInt(event.target.value, 10) || 0));
  updateVoiceUI();
});

voiceBoostSlider.addEventListener('change', () => {
  markAudioPresetCustom();
  sendVolume(Number.parseInt(slider.value, 10));
});

if (bassBoostAutoBadge) bassBoostAutoBadge.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  void toggleGenreParameterMode('bass');
});
if (voiceBoostAutoBadge) voiceBoostAutoBadge.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  void toggleGenreParameterMode('voice');
});

// EN: Synchronizes visualization controls, active values, and accessibility labels.
// RU: Синхронизирует элементы визуализации, значения и доступные подписи.
// UK: Синхронізує елементи візуалізації, значення та доступні підписи.
function updateVisualizerSettingsUI({ clearHistory = false, redraw = false } = {}) {
  const spectrogramSubtitle = document.querySelector('.spectrogram-subtitle');
  if (spectrogramSubtitle) spectrogramSubtitle.textContent = t('spectrogramSubtitle', { seconds: spectrogramDuration });
  updateSpectrogramPaletteBadge();
  if (visualizerStyleSelect) visualizerStyleSelect.value = visualizerStyle;
  if (visualizerPaletteSelect) visualizerPaletteSelect.value = visualizerPaletteMode;
  if (visualizerGlowToggle) visualizerGlowToggle.checked = visualizerGlowEnabled;
  if (visualizerPeakHoldToggle) visualizerPeakHoldToggle.checked = visualizerPeakHoldEnabled;
  if (spectrogramGridToggle) spectrogramGridToggle.checked = spectrogramGridEnabled;
  if (spectrogramSmoothingToggle) spectrogramSmoothingToggle.checked = spectrogramSmoothingEnabled;
  if (spectrogramGlowToggle) spectrogramGlowToggle.checked = spectrogramGlowEnabled;
  if (visualizerSensitivitySlider) visualizerSensitivitySlider.value = String(visualizerSensitivity);
  if (visualizerSensitivityValue) visualizerSensitivityValue.textContent = t('visualizerSensitivityValue', { value: visualizerSensitivity });
  if (visualizerBandsSelect) visualizerBandsSelect.value = String(visualizerBands);
  if (spectrogramPaletteSelect) spectrogramPaletteSelect.value = spectrogramPaletteMode;
  if (spectrogramDurationSelect) spectrogramDurationSelect.value = String(spectrogramDuration);
  if (visualizerAnimationToggle) visualizerAnimationToggle.checked = visualizerAnimationEnabled;
  if (showFrequencyVisualizerToggle) showFrequencyVisualizerToggle.checked = showFrequencyVisualizer;
  if (showSpectrogramToggle) showSpectrogramToggle.checked = showSpectrogram;
  if (visualizerPanel) visualizerPanel.hidden = !showFrequencyVisualizer;
  if (spectrogramPanel) spectrogramPanel.hidden = !showSpectrogram;
  resizeSpectrumBuffers(visualizerBands);
  // Keep the selected history duration accurate when sampling cadence changes.
  spectrogramState.maxRows = Math.max(1, Math.round((spectrogramDuration * 1000) / getEnergySavingProfile().sampleIntervalMs));
  if (spectrogramState.history.length > spectrogramState.maxRows) {
    spectrogramState.history.length = spectrogramState.maxRows;
  }
  if (clearHistory) spectrogramState.history = [];
  if (redraw) {
    rebuildSpectrogramColorLut();
    renderSpectrogram();
    if (shouldRenderFrequencySpectrum() && spectrumState.captureActive) startSpectrumRendering();
    else {
      stopSpectrumRendering();
      if (showFrequencyVisualizer && !visualizerAnimationEnabled) drawSpectrum(0, true);
    }
    updateVisualizerLiveStatus();
  }
}

// EN: Determines whether spectrum data should be sampled under current user preferences.
// RU: Определяет, нужно ли считывать спектр с учётом текущих настроек.
// UK: Визначає, чи потрібно зчитувати спектр з урахуванням поточних налаштувань.
function shouldSampleSpectrum() {
  return visualizerAnimationEnabled && (showFrequencyVisualizer || showSpectrogram);
}

// EN: Determines whether the frequency canvas should currently be drawn.
// RU: Определяет, нужно ли сейчас отрисовывать частотный canvas.
// UK: Визначає, чи потрібно зараз малювати частотний canvas.
function shouldRenderFrequencySpectrum() {
  return visualizerAnimationEnabled && showFrequencyVisualizer;
}

// EN: Coordinates background sampling and popup rendering after settings change.
// RU: Согласует фоновый сбор данных и отрисовку popup после изменения настроек.
// UK: Узгоджує фоновий збір даних і малювання popup після зміни налаштувань.
async function syncSpectrumSampling() {
  const shouldEnable = shouldSampleSpectrum();
  if (!shouldEnable) stopSpectrumRendering();
  if (spectrumState.captureActive) {
    let result;
    try {
      result = await chrome.runtime.sendMessage({ type: 'VISUALIZER_CONTROL', enabled: shouldEnable });
    } catch (error) {
      console.debug('Could not synchronize spectrum sampling:', error?.message || error);
      return false;
    }
    if (!result || result.success !== true) return false;
  }
  if (shouldRenderFrequencySpectrum() && spectrumState.captureActive) startSpectrumRendering();
  else stopSpectrumRendering();
  updateVisualizerLiveStatus();
  return true;
}

// EN: Schedules one visualizer render while preventing redundant concurrent frames.
// RU: Планирует один кадр визуализатора и предотвращает дублирующиеся кадры.
// UK: Планує один кадр візуалізатора та запобігає дублюванню кадрів.
function scheduleSpectrumRender(delayMs = getEnergySavingProfile().frameIntervalMs) {
  if (spectrumState.animationFrame || spectrumState.animationTimeout || !shouldRenderFrequencySpectrum() || !spectrumState.captureActive) return;
  spectrumState.animationTimeout = window.setTimeout(() => {
    spectrumState.animationTimeout = 0;
    if (!shouldRenderFrequencySpectrum() || !spectrumState.captureActive) return;
    spectrumState.animationFrame = requestAnimationFrame((timestamp) => drawSpectrum(timestamp, false));
  }, Math.max(0, delayMs));
}

// EN: Starts the popup animation loop when rendering is enabled and the popup is visible.
// RU: Запускает цикл анимации popup, когда отрисовка разрешена и окно видно.
// UK: Запускає цикл анімації popup, коли малювання дозволено й вікно видиме.
function startSpectrumRendering() {
  if (!shouldRenderFrequencySpectrum() || spectrumState.animationFrame || spectrumState.animationTimeout || !spectrumState.captureActive) return;
  spectrumState.lastFrame = 0;
  scheduleSpectrumRender(0);
}

// EN: Stops animation callbacks and releases the visualizer render loop.
// RU: Останавливает callbacks анимации и освобождает цикл отрисовки.
// UK: Зупиняє callbacks анімації та звільняє цикл малювання.
function stopSpectrumRendering() {
  if (spectrumState.animationFrame) cancelAnimationFrame(spectrumState.animationFrame);
  if (spectrumState.animationTimeout) window.clearTimeout(spectrumState.animationTimeout);
  spectrumState.animationFrame = 0;
  spectrumState.animationTimeout = 0;
  // Keep the last rendered frame visible; the canvas stays frozen without a render loop.
}

// EN: Sends visualization sample settings to the background/offscreen pipeline.
// RU: Передаёт настройки выборки визуализации в фоновый/offscreen-конвейер.
// UK: Передає налаштування вибірки візуалізації до фонового/offscreen-конвеєра.
async function persistVisualizerOptionsToBackground() {
  try {
    const result = await chrome.runtime.sendMessage({ type: 'VISUALIZER_SETTINGS', bandCount: visualizerBands, sampleIntervalMs: getEnergySavingSampleIntervalMs() });
    return !result || result.success !== false;
  } catch (error) {
    console.debug('Could not persist visualizer options to the background:', error?.message || error);
    return false;
  }
}

// EN: Saves the current visualization and spectrogram settings.
// RU: Сохраняет текущие настройки визуализации и спектрограммы.
// UK: Зберігає поточні налаштування візуалізації та спектрограми.
async function persistVisualizerPreferences() {
  const settings = {
    visualizerStyle,
    visualizerPalette: visualizerPaletteMode,
    visualizerGlowEnabled,
    visualizerPeakHoldEnabled,
    spectrogramGridEnabled,
    spectrogramSmoothingEnabled,
    spectrogramGlowEnabled,
    visualizerSensitivity,
    visualizerBands,
    spectrogramPalette: spectrogramPaletteMode,
    spectrogramDuration,
    visualizerAnimationEnabled,
    showFrequencyVisualizer,
    showSpectrogram,
    energySavingEnabled,
    energySavingMode
  };
  try {
    await writeLocalSettings(settings);
    showStatus(t('visualizerSettingsSaved'));
    return true;
  } catch (error) {
    showStatus(t('visualizerSettingsSaveError'), true);
    return false;
  }
}

// EN: Persists whether visualizer animations should run.
// RU: Сохраняет выбор запуска анимаций визуализатора.
// UK: Зберігає вибір запуску анімацій візуалізатора.
async function setVisualizerAnimation(enabled) {
  const previous = visualizerAnimationEnabled;
  visualizerAnimationEnabled = Boolean(enabled);
  updateVisualizerSettingsUI({ redraw: true });
  const runtimeApplied = await syncSpectrumSampling();
  if (!runtimeApplied) {
    visualizerAnimationEnabled = previous;
    updateVisualizerSettingsUI({ redraw: true });
    await syncSpectrumSampling();
    showStatus(t('visualizerSettingsSaveError'), true);
    return;
  }
  if (!(await persistVisualizerPreferences())) {
    visualizerAnimationEnabled = previous;
    updateVisualizerSettingsUI({ redraw: true });
    await syncSpectrumSampling();
  }
}

// EN: Shows or hides the spectrum/spectrogram sections and saves the choice.
// RU: Показывает или скрывает разделы спектра/спектрограммы и сохраняет выбор.
// UK: Показує або приховує розділи спектра/спектрограми та зберігає вибір.
async function setVisualizationVisibility(kind, enabled) {
  const isFrequency = kind === 'frequency';
  const current = isFrequency ? showFrequencyVisualizer : showSpectrogram;
  const next = Boolean(enabled);
  if (current === next) return;
  if (isFrequency) showFrequencyVisualizer = next;
  else showSpectrogram = next;

  if (kind === 'spectrogram' && next) spectrogramState.history = [];
  updateVisualizerSettingsUI({ redraw: true });
  requestAnimationFrame(() => {
    if (showFrequencyVisualizer) resizeSpectrumCanvas();
    if (showSpectrogram) resizeSpectrogramCanvas();
  });

  const runtimeApplied = await syncSpectrumSampling();
  if (!runtimeApplied) {
    if (isFrequency) showFrequencyVisualizer = current;
    else showSpectrogram = current;
    updateVisualizerSettingsUI({ redraw: true });
    await syncSpectrumSampling();
    showStatus(t('visualizerSettingsSaveError'), true);
    return;
  }
  if (!(await persistVisualizerPreferences())) {
    if (isFrequency) showFrequencyVisualizer = current;
    else showSpectrogram = current;
    updateVisualizerSettingsUI({ redraw: true });
    await syncSpectrumSampling();
    requestAnimationFrame(() => {
      if (showFrequencyVisualizer) resizeSpectrumCanvas();
      if (showSpectrogram) resizeSpectrogramCanvas();
    });
  }
}

// EN: UI event bindings connect controls to their settings handlers; related controls call the same shared function to avoid drift.
// RU: Обработчики связывают элементы интерфейса с настройками; дублирующие переключатели используют общие функции для синхронизации.
// UK: Обробники пов'язують елементи інтерфейсу з налаштуваннями; дубльовані перемикачі використовують спільні функції для синхронізації.
languageSelect.addEventListener('change', (event) => setLanguage(event.target.value));
themeSelect.addEventListener('change', (event) => setTheme(event.target.value));
rgbGlowToggle.addEventListener('change', (event) => setRgbGlow(event.target.checked));
if (quickRgbGlowToggle) quickRgbGlowToggle.addEventListener('change', (event) => { void setRgbGlow(event.target.checked); });
if (quickBassBoostToggle) quickBassBoostToggle.addEventListener('change', (event) => setBassBoostEnabledFromControl(event.target.checked));
if (quickVoiceBoostToggle) quickVoiceBoostToggle.addEventListener('change', (event) => setVoiceBoostEnabledFromControl(event.target.checked));
if (quickAutoGenreToggle) quickAutoGenreToggle.addEventListener('change', (event) => { void setAutoGenreEnabled(event.target.checked); });
bindServiceProfileControls();
peakLimiterToggle.addEventListener('change', (event) => { void setPeakLimiterEnabled(event.target.checked); });
if (quickPeakLimiterToggle) quickPeakLimiterToggle.addEventListener('change', (event) => { void setPeakLimiterEnabled(event.target.checked); });
showClippingWarningToggle.addEventListener('change', (event) => { void setShowClippingWarning(event.target.checked); });
showAllMessagesToggle.addEventListener('change', (event) => { void setShowAllMessages(event.target.checked); });
showCaptureStatusIndicatorToggle.addEventListener('change', (event) => { void setShowCaptureStatusIndicator(event.target.checked); });
showQuickSettingsToggle.addEventListener('change', (event) => { void setShowQuickSettings(event.target.checked); });
autoGenreEnabledToggle.addEventListener('change', (event) => { void setAutoGenreEnabled(event.target.checked); });
nightModeToggle.addEventListener('change', (event) => { void setNightModeEnabled(event.target.checked); });
if (quickNightModeToggle) quickNightModeToggle.addEventListener('change', (event) => { void setNightModeEnabled(event.target.checked); });
visualizerStyleSelect.addEventListener('change', async (event) => {
  const next = event.target.value;
  if (!VISUALIZER_STYLES.includes(next)) return;
  const previous = visualizerStyle;
  visualizerStyle = next;
  updateVisualizerSettingsUI({ redraw: true });
  if (!(await persistVisualizerPreferences())) {
    visualizerStyle = previous;
    updateVisualizerSettingsUI({ redraw: true });
  }
});
visualizerPaletteSelect.addEventListener('change', async (event) => {
  const next = event.target.value;
  if (!SPECTROGRAM_PALETTES.includes(next)) return;
  const previous = visualizerPaletteMode;
  visualizerPaletteMode = next;
  updateVisualizerSettingsUI({ redraw: true });
  if (!(await persistVisualizerPreferences())) {
    visualizerPaletteMode = previous;
    updateVisualizerSettingsUI({ redraw: true });
  }
});
// EN: Persists a single visual effect option and redraws the affected visualization.
// RU: Сохраняет один параметр визуального эффекта и перерисовывает нужную область.
// UK: Зберігає один параметр візуального ефекту та перемальовує відповідну область.
async function setVisualizerEffectToggle(key, nextValue) {
  const options = {
    visualizerGlowEnabled: { get: () => visualizerGlowEnabled, set: (value) => { visualizerGlowEnabled = value; } },
    visualizerPeakHoldEnabled: { get: () => visualizerPeakHoldEnabled, set: (value) => { visualizerPeakHoldEnabled = value; } },
    spectrogramGridEnabled: { get: () => spectrogramGridEnabled, set: (value) => { spectrogramGridEnabled = value; } },
    spectrogramSmoothingEnabled: { get: () => spectrogramSmoothingEnabled, set: (value) => { spectrogramSmoothingEnabled = value; } },
    spectrogramGlowEnabled: { get: () => spectrogramGlowEnabled, set: (value) => { spectrogramGlowEnabled = value; } }
  };
  const option = options[key];
  if (!option) return;
  const previous = option.get();
  option.set(Boolean(nextValue));
  updateVisualizerSettingsUI({ redraw: true });
  if (!(await persistVisualizerPreferences())) {
    option.set(previous);
    updateVisualizerSettingsUI({ redraw: true });
  }
}
visualizerGlowToggle.addEventListener('change', (event) => { void setVisualizerEffectToggle('visualizerGlowEnabled', event.target.checked); });
visualizerPeakHoldToggle.addEventListener('change', (event) => { void setVisualizerEffectToggle('visualizerPeakHoldEnabled', event.target.checked); });
spectrogramGridToggle.addEventListener('change', (event) => { void setVisualizerEffectToggle('spectrogramGridEnabled', event.target.checked); });
spectrogramSmoothingToggle.addEventListener('change', (event) => { void setVisualizerEffectToggle('spectrogramSmoothingEnabled', event.target.checked); });
spectrogramGlowToggle.addEventListener('change', (event) => { void setVisualizerEffectToggle('spectrogramGlowEnabled', event.target.checked); });
visualizerSensitivitySlider.addEventListener('input', (event) => {
  const value = Number.parseInt(event.target.value, 10);
  if (!Number.isInteger(value) || value < 50 || value > 200 || value % 25 !== 0) return;
  visualizerSensitivity = value;
  updateVisualizerSettingsUI({ redraw: true });
});
visualizerSensitivitySlider.addEventListener('change', async () => {
  if (!(await persistVisualizerPreferences())) {
    visualizerSensitivity = savedVisualizerSensitivity;
    updateVisualizerSettingsUI({ redraw: true });
  } else {
    savedVisualizerSensitivity = visualizerSensitivity;
  }
});
visualizerBandsSelect.addEventListener('change', async (event) => {
  const next = Number.parseInt(event.target.value, 10);
  if (!VISUALIZER_BAND_OPTIONS.includes(next)) return;
  const previous = visualizerBands;
  visualizerBands = next;
  resizeSpectrumBuffers(next);
  spectrogramState.history = [];
  updateVisualizerSettingsUI({ clearHistory: true, redraw: true });
  if (!(await persistVisualizerPreferences())) {
    visualizerBands = previous;
    resizeSpectrumBuffers(previous);
    updateVisualizerSettingsUI({ clearHistory: true, redraw: true });
    return;
  }
  const processorUpdated = await persistVisualizerOptionsToBackground();
  if (!processorUpdated && spectrumState.captureActive) {
    visualizerBands = previous;
    resizeSpectrumBuffers(previous);
    updateVisualizerSettingsUI({ clearHistory: true, redraw: true });
    await writeLocalSettings({ visualizerBands: previous }).catch(() => {});
    await persistVisualizerOptionsToBackground();
    showStatus(t('visualizerSettingsSaveError'), true);
  }
});
spectrogramPaletteSelect.addEventListener('change', async (event) => {
  const next = event.target.value;
  if (!SPECTROGRAM_PALETTES.includes(next)) return;
  const previous = spectrogramPaletteMode;
  spectrogramPaletteMode = next;
  updateVisualizerSettingsUI({ redraw: true });
  if (!(await persistVisualizerPreferences())) {
    spectrogramPaletteMode = previous;
    updateVisualizerSettingsUI({ redraw: true });
  }
});
spectrogramDurationSelect.addEventListener('change', async (event) => {
  const next = Number.parseInt(event.target.value, 10);
  if (!SPECTROGRAM_DURATIONS.includes(next)) return;
  const previous = spectrogramDuration;
  spectrogramDuration = next;
  updateVisualizerSettingsUI({ redraw: true });
  if (!(await persistVisualizerPreferences())) {
    spectrogramDuration = previous;
    updateVisualizerSettingsUI({ redraw: true });
  }
});
visualizerAnimationToggle.addEventListener('change', (event) => { void setVisualizerAnimation(event.target.checked); });
showFrequencyVisualizerToggle.addEventListener('change', (event) => { void setVisualizationVisibility('frequency', event.target.checked); });
showSpectrogramToggle.addEventListener('change', (event) => { void setVisualizationVisibility('spectrogram', event.target.checked); });
showBassBoostPanelToggle.addEventListener('change', (event) => { void setAudioPanelVisibility('bass', event.target.checked); });
showVoiceBoostPanelToggle.addEventListener('change', (event) => { void setAudioPanelVisibility('voice', event.target.checked); });
energySavingToggle.addEventListener('change', (event) => { void setEnergySavingPreferences(event.target.checked, energySavingMode); });
energySavingModeSelect.addEventListener('change', (event) => { void setEnergySavingPreferences(energySavingEnabled, event.target.value); });
settingsBtn.addEventListener('click', () => setSettingsPanelOpen(settingsPanel.hidden));
if (enableExtensionBtn) enableExtensionBtn.addEventListener('click', () => { void enableCaptureForCurrentTab(); });
if (disableExtensionBtn) disableExtensionBtn.addEventListener('click', () => { void disableCapture(); });
settingsCloseBtn.addEventListener('click', () => setSettingsPanelOpen(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !settingsPanel.hidden) setSettingsPanelOpen(false);
});
systemThemeQuery.addEventListener?.('change', () => {
  if (themeMode === 'system') applyTheme('system');
});

profilePresetBtns.forEach((button) => {
  button.addEventListener('click', () => applyAudioPreset(button.dataset.profile));
});

factoryResetBtn.addEventListener('click', () => {
  if (window.confirm(t('factoryResetConfirm'))) resetFactorySettings();
});
exportSettingsBtn.addEventListener('click', () => { void exportSettingsToCfg(); });
importSettingsBtn.addEventListener('click', () => settingsImportFile.click());
settingsImportFile.addEventListener('change', (event) => {
  const file = event.target.files && event.target.files[0];
  void importSettingsFromCfg(file);
});
