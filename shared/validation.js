/*
 * Shared validation helpers for the MV3 service worker and offscreen document.
 * Keep security-sensitive audio-setting bounds in one place.
 */
var VCPValidation = (() => {
  function isValidAudioSettingsMessage(message, options = {}) {
    if (!message || typeof message !== 'object' || Array.isArray(message)) return false;
    const requireTabId = options && options.requireTabId === true;
    return (!requireTabId || Number.isInteger(message.tabId)) &&
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

  return Object.freeze({ isValidAudioSettingsMessage });
})();
