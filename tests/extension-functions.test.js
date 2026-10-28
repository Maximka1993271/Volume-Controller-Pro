import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Execute real production function bodies without booting a browser UI.
// Top-level function declarations in the source files end with an unindented brace.
function extractFunction(source, name) {
  const match = new RegExp('^function\\s+' + name + '\\s*\\(', 'm').exec(source);
  assert.ok(match, 'Could not find production function: ' + name);
  const end = source.indexOf('\n}', match.index);
  assert.notEqual(end, -1, 'Could not find end of production function: ' + name);
  return source.slice(match.index, end + 2);
}

function extractDeclaration(source, name) {
  const match = new RegExp('^const\\s+' + name + '\\s*=', 'm').exec(source);
  assert.ok(match, 'Could not find production declaration: ' + name);
  const valueStart = source.indexOf('=', match.index) + 1;
  const firstValue = source.slice(valueStart).trimStart()[0];
  let marker;
  if (firstValue === '{') marker = '\n};';
  else if (firstValue === '[') marker = '\n];';
  if (marker) {
    const end = source.indexOf(marker, valueStart);
    if (end !== -1) return source.slice(match.index, end + marker.length);
  }
  const semicolon = source.indexOf(';', valueStart);
  assert.notEqual(semicolon, -1, 'Could not find end of production declaration: ' + name);
  return source.slice(match.index, semicolon + 1);
}

function loadProductionApi(file, declarationNames, functionNames) {
  const source = readFileSync(resolve(ROOT, file), 'utf8');
  const fragments = [
    ...declarationNames.map((name) => extractDeclaration(source, name)),
    ...functionNames.map((name) => extractFunction(source, name)),
    'globalThis.__testApi = {' + functionNames.map((name) => name + ': ' + name).join(', ') + '};'
  ];
  const context = createContext({ URL });
  runInContext(fragments.join('\n\n'), context, { filename: file });
  return runInContext('globalThis.__testApi', context);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

const background = loadProductionApi('background.js', [], [
  'isSupportedCaptureUrl',
  'getSupportedCapturePlatform',
  'getTrackIdFromUrl',
  'validAudioSettingsMessage'
]);

const popup = loadProductionApi('popup.js', [
  'SETTINGS_CONFIG_FORMAT',
  'SETTINGS_CONFIG_SCHEMA_VERSION',
  'ENERGY_SAVING_MODES',
  'VISUALIZER_BAND_OPTIONS',
  'VISUALIZER_STYLES',
  'SPECTROGRAM_PALETTES',
  'SPECTROGRAM_DURATIONS',
  'AUDIO_PRESETS',
  'LEGACY_AUDIO_PRESETS'
], [
  'isSpotifyWebPlayerUrl',
  'isYouTubeVideoUrl',
  'createDefaultServiceAudioProfile',
  'normalizeServiceAudioProfile',
  'isValidServiceAudioProfile',
  'hasOwnSettingsKeys',
  'validateSettingsConfig'
]);

const offscreen = loadProductionApi('offscreen.js', [
  'AUTO_GENRE_CATALOG',
  'AUTO_GENRE_AMBIGUOUS_WORDS',
  'AUTO_GENRE_CONTEXT_WORDS',
  'AUTO_GENRE_MATCHERS'
], [
  'normalizeGenreText',
  'classifyGenreFromTitle',
  'classifyGenreFromAudio',
  'toLogarithmicBands'
]);

function validAudioMessage(overrides = {}) {
  return {
    tabId: 42,
    volume: 1,
    muted: false,
    bassBoostEnabled: true,
    bassBoostDb: 4,
    voiceBoostEnabled: true,
    voiceBoostDb: 2,
    peakLimiterEnabled: true,
    nightModeEnabled: false,
    ...overrides
  };
}

function validSettingsConfig(overrides = {}) {
  const profile = {
    enabled: true,
    volume: 1,
    bassBoostEnabled: true,
    bassBoostDb: 4,
    voiceBoostEnabled: true,
    voiceBoostDb: 2,
    peakLimiterEnabled: true,
    nightModeEnabled: false,
    activeAudioPreset: 'default'
  };
  const settings = {
    language: 'ru',
    themeMode: 'system',
    rgbGlow: true,
    volume: 1,
    muted: false,
    bassBoostEnabled: true,
    bassBoostDb: 4,
    voiceBoostEnabled: true,
    voiceBoostDb: 2,
    activeAudioPreset: 'default',
    lastBoostValue: 200,
    visualizerStyle: 'bars',
    visualizerSensitivity: 100,
    visualizerBands: 48,
    spectrogramPalette: 'neon',
    spectrogramDuration: 4,
    visualizerAnimationEnabled: true,
    showFrequencyVisualizer: true,
    showSpectrogram: true,
    showBassBoostPanel: true,
    showVoiceBoostPanel: true,
    peakLimiterEnabled: true,
    showClippingWarning: true,
    showCaptureStatusIndicator: true,
    showAllMessages: true,
    showQuickSettings: true,
    autoGenreEnabled: true,
    youtubeAudioProfile: { ...profile },
    spotifyAudioProfile: { ...profile },
    bassBoostMode: 'auto',
    voiceBoostMode: 'auto',
    nightModeEnabled: false,
    energySavingEnabled: false,
    energySavingMode: 'balanced',
    visualizerPalette: 'neon',
    visualizerGlowEnabled: true,
    visualizerPeakHoldEnabled: true,
    spectrogramGridEnabled: true,
    spectrogramSmoothingEnabled: true,
    spectrogramGlowEnabled: true,
    ...overrides
  };
  return {
    format: 'volume-controller-pro-settings',
    schemaVersion: 18,
    settings
  };
}

test('capture URL allowlist accepts supported YouTube player routes and Spotify Web Player', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/shorts/abc123_DEF',
    'https://m.youtube.com/live/abc123',
    'https://music.youtube.com/embed/abc123',
    'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'
  ]) {
    assert.equal(background.isSupportedCaptureUrl(url), true, url);
  }
});

test('capture URL allowlist rejects insecure, deceptive and invalid YouTube URLs', () => {
  for (const url of [
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
    'https://evil-youtube.com/watch?v=dQw4w9WgXcQ',
    'https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com:444/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=abc',
    'https://www.youtube.com/channel/abc123',
    'not a url'
  ]) {
    assert.equal(background.isSupportedCaptureUrl(url), false, url);
  }
});

test('platform and track identity are derived only for supported media URLs', () => {
  assert.equal(background.getSupportedCapturePlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'youtube');
  assert.equal(background.getSupportedCapturePlatform('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'), 'spotify');
  assert.equal(background.getSupportedCapturePlatform('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ'), '');

  assert.equal(background.getTrackIdFromUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'youtube:dQw4w9WgXcQ');
  assert.equal(background.getTrackIdFromUrl('https://youtube.com/shorts/abc123_DEF'), 'youtube:abc123_DEF');
  assert.equal(background.getTrackIdFromUrl('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'), 'spotify:4uLU6hMCjMI75M1A2tKUQC');
  assert.equal(background.getTrackIdFromUrl('https://www.youtube.com/channel/abc123'), '');
});

test('audio command validation accepts valid values at range boundaries', () => {
  assert.equal(background.validAudioSettingsMessage(validAudioMessage({ volume: 0, bassBoostDb: 0, voiceBoostDb: 0 })), true);
  assert.equal(background.validAudioSettingsMessage(validAudioMessage({ volume: 6, bassBoostDb: 12, voiceBoostDb: 8, bassManualOverride: true, voiceManualOverride: false })), true);
});

test('audio command validation rejects incorrect types and out-of-range values', () => {
  for (const message of [
    validAudioMessage({ tabId: 1.5 }),
    validAudioMessage({ volume: -0.1 }),
    validAudioMessage({ volume: 6.01 }),
    validAudioMessage({ volume: '2' }),
    validAudioMessage({ bassBoostDb: 13 }),
    validAudioMessage({ bassBoostDb: 1.5 }),
    validAudioMessage({ voiceBoostDb: -1 }),
    validAudioMessage({ voiceBoostDb: 9 }),
    validAudioMessage({ muted: 0 }),
    validAudioMessage({ bassManualOverride: 'true' })
  ]) {
    assert.equal(background.validAudioSettingsMessage(message), false, JSON.stringify(message));
  }
});

test('popup URL helpers restrict Spotify to HTTPS and YouTube to video routes', () => {
  assert.equal(popup.isSpotifyWebPlayerUrl('https://open.spotify.com/track/abc123'), true);
  assert.equal(popup.isSpotifyWebPlayerUrl('http://open.spotify.com/track/abc123'), false);
  assert.equal(popup.isSpotifyWebPlayerUrl('https://accounts.spotify.com/'), false);
  assert.equal(popup.isYouTubeVideoUrl('https://www.youtube.com/watch?v=abc123'), true);
  assert.equal(popup.isYouTubeVideoUrl('https://youtube.com/shorts/abc123'), true);
  assert.equal(popup.isYouTubeVideoUrl('https://youtube.com/settings'), false);
  assert.equal(popup.isYouTubeVideoUrl('https://youtube.com.evil.example/watch?v=abc123'), false);
});

test('service profile normalization fills missing fields and clamps numeric ranges', () => {
  assert.deepEqual(plain(popup.normalizeServiceAudioProfile(null)), {
    enabled: false,
    volume: 1,
    bassBoostEnabled: true,
    bassBoostDb: 4,
    voiceBoostEnabled: true,
    voiceBoostDb: 2,
    peakLimiterEnabled: true,
    nightModeEnabled: false,
    activeAudioPreset: 'default'
  });

  const normalized = plain(popup.normalizeServiceAudioProfile({
    enabled: true,
    volume: 9,
    bassBoostDb: -3,
    voiceBoostDb: 99,
    activeAudioPreset: 'not-a-preset'
  }));
  assert.equal(normalized.volume, 6);
  assert.equal(normalized.bassBoostDb, 0);
  assert.equal(normalized.voiceBoostDb, 8);
  assert.equal(normalized.enabled, true);
  assert.equal(normalized.activeAudioPreset, 'default');
});

test('service profile validation accepts valid profiles and rejects unsafe values', () => {
  const valid = plain(popup.createDefaultServiceAudioProfile(true));
  assert.equal(popup.isValidServiceAudioProfile(valid), true);
  assert.equal(popup.isValidServiceAudioProfile({ ...valid, volume: 6 }), true);
  assert.equal(popup.isValidServiceAudioProfile({ ...valid, volume: 6.01 }), false);
  assert.equal(popup.isValidServiceAudioProfile({ ...valid, bassBoostDb: 12 }), true);
  assert.equal(popup.isValidServiceAudioProfile({ ...valid, bassBoostDb: 12.5 }), false);
  assert.equal(popup.isValidServiceAudioProfile({ ...valid, activeAudioPreset: 'unexpected' }), false);
  assert.equal(popup.isValidServiceAudioProfile([]), false);
});

test('settings backup validation accepts a current valid configuration and normalizes values', () => {
  const config = validSettingsConfig({ volume: 1.236 });
  const normalized = plain(popup.validateSettingsConfig(config));
  assert.equal(normalized.volume, 1.24);
  assert.equal(normalized.language, 'ru');
  assert.equal(normalized.youtubeAudioProfile.volume, 1);
  assert.equal(normalized.spotifyAudioProfile.activeAudioPreset, 'default');
  assert.equal(normalized.activeAudioPreset, 'default');
});

test('settings backup validation rejects malformed and future-schema files with stable error codes', () => {
  assert.throws(() => popup.validateSettingsConfig(null), (error) => error.code === 'invalid');
  assert.throws(() => popup.validateSettingsConfig({ format: 'wrong', schemaVersion: 18, settings: {} }), (error) => error.code === 'invalid');
  assert.throws(
    () => popup.validateSettingsConfig({ ...validSettingsConfig(), schemaVersion: 19 }),
    (error) => error.code === 'newerSchema' && error.supportedSchemaVersion === 18
  );
});

test('settings backup validation rejects out-of-range audio values, incomplete fields and bad profiles', () => {
  const overVolume = validSettingsConfig({ volume: 6.1 });
  assert.throws(() => popup.validateSettingsConfig(overVolume), (error) => error.code === 'invalid');

  const missingVisualizerField = validSettingsConfig();
  delete missingVisualizerField.settings.visualizerBands;
  assert.throws(() => popup.validateSettingsConfig(missingVisualizerField), (error) => error.code === 'invalid');

  const badProfile = validSettingsConfig();
  badProfile.settings.youtubeAudioProfile.volume = 7;
  assert.throws(() => popup.validateSettingsConfig(badProfile), (error) => error.code === 'invalid');

  const invalidMode = validSettingsConfig({ energySavingMode: 'unrecognized' });
  assert.throws(() => popup.validateSettingsConfig(invalidMode), (error) => error.code === 'invalid');
});

test('genre text normalization ignores case, punctuation and diacritics', () => {
  assert.equal(offscreen.normalizeGenreText('  DRÍFT---PHONK!! '), 'drift phonk');
  assert.equal(offscreen.normalizeGenreText(null), '');
});

test('title genre classifier detects specific named genres and respects word boundaries', () => {
  const phonk = plain(offscreen.classifyGenreFromTitle('DRIFT--PHONK / LIVE MIX'));
  assert.equal(phonk.genre, 'phonk');
  assert.equal(phonk.source, 'title');
  assert.ok(phonk.confidence > 0 && phonk.confidence <= 0.97);

  assert.equal(offscreen.classifyGenreFromTitle('Therapist talks about a paperback'), null);
  assert.equal(offscreen.classifyGenreFromTitle('Unrelated content without a music style'), null);
});

test('title genre classifier avoids a guess for equally matched mixed genres', () => {
  assert.equal(offscreen.classifyGenreFromTitle('Jazz and Rock'), null);
});

test('audio genre classifier waits for enough non-silent samples', () => {
  assert.equal(offscreen.classifyGenreFromAudio([]), null);
  assert.equal(offscreen.classifyGenreFromAudio(Array.from({ length: 5 }, () => ({
    total: 30, bassShare: 0.42, midShare: 0.3, highShare: 0.22, bass: 12
  }))), null);
  assert.equal(offscreen.classifyGenreFromAudio(Array.from({ length: 6 }, () => ({
    total: 0, bassShare: 0, midShare: 0, highShare: 0, bass: 0
  }))), null);
});

test('audio genre classifier identifies bass-heavy and neutral fallback profiles', () => {
  const bassHeavySamples = [8, 20, 8, 20, 8, 20].map((bass) => ({
    total: 30, bassShare: 0.42, midShare: 0.30, highShare: 0.22, bass
  }));
  const bassHeavy = plain(offscreen.classifyGenreFromAudio(bassHeavySamples));
  assert.equal(bassHeavy.genre, 'audioBassHeavy');
  assert.equal(bassHeavy.source, 'audio');
  assert.ok(bassHeavy.confidence >= 0.60 && bassHeavy.confidence <= 0.76);

  const neutralSamples = Array.from({ length: 6 }, () => ({
    total: 20, bassShare: 0.30, midShare: 0.30, highShare: 0.30, bass: 10
  }));
  assert.equal(offscreen.classifyGenreFromAudio(neutralSamples).genre, 'audioOther');
});

test('spectrum conversion returns the requested number of bounded finite bands', () => {
  const zeroSpectrum = new Uint8Array(1024);
  const bands = offscreen.toLogarithmicBands(zeroSpectrum, 48000, 48);
  assert.equal(bands.length, 48);
  assert.ok(bands.every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
  assert.ok(bands.every((value) => value === 0));

  const uniformSpectrum = new Uint8Array(1024).fill(128);
  const uniformBands = offscreen.toLogarithmicBands(uniformSpectrum, 48000, 24);
  assert.equal(uniformBands.length, 24);
  assert.ok(uniformBands.every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
  assert.ok(uniformBands.every((value) => value > 0.45 && value < 0.60));
});
