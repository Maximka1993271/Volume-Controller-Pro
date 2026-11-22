#!/usr/bin/env node
'use strict';

// Run from the unpacked extension root: node tests/smoke.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
// Queue checks so async tests are awaited before they are counted or reported.
let checkQueue = Promise.resolve();
function check(name, fn) {
  checkQueue = checkQueue.then(async () => {
    await fn();
    passed += 1;
    process.stdout.write(`✓ ${name}\n`);
  });
  return checkQueue;
}
function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}
function loadClassicScript(relativePath, globalName) {
  const source = read(relativePath);
  assert.doesNotMatch(source, /^\s*export\s/m, `${relativePath} must not use ESM exports`);
  const context = vm.createContext({ console });
  new vm.Script(source, { filename: relativePath }).runInContext(context);
  assert.ok(context[globalName], `${relativePath} must expose global ${globalName}`);
  return context[globalName];
}

const genres = loadClassicScript('shared/genres.js', 'VCPGenres');
const validation = loadClassicScript('shared/validation.js', 'VCPValidation');
const manifest = JSON.parse(read('manifest.json'));

check('manifest and popup version are aligned', () => {
  assert.equal(manifest.version, '4.8.31');
  assert.match(read('popup.html'), /<span id="extensionVersion">4\.8\.31<\/span>/);
});


check('popup is widened to 460px while preserving the 600px height limit', () => {
  const css = read('popup.css');
  assert.equal((css.match(/width: 460px;/g) || []).length, 2, 'both popup body width declarations use 460px');
  assert.match(css, /max-height: 600px/);
  assert.doesNotMatch(css, /width: 400px;/);
});

check('manifest name, description and action title use automatic Edge localization', () => {
  assert.equal(manifest.name, '__MSG_extName__');
  assert.equal(manifest.description, '__MSG_extDescription__');
  assert.equal(manifest.action.default_title, '__MSG_actionTitle__');
  assert.equal(manifest.default_locale, 'en');
});

check('Russian, English and Ukrainian manifest metadata are complete', () => {
  const expected = {
    en: ['Volume Controller Pro', 'Volume up to 600%, Bass/Voice Boost, frequency visualizer, spectrogram, and Spotify Web Player support.', 'Volume Controller Pro'],
    ru: ['Регулятор громкости Pro', 'Громкость до 600%, Bass/Voice Boost, визуализатор частот, спектрограмма и поддержка Spotify Web Player.', 'Регулятор громкости Pro'],
    uk: ['Регулятор гучності Pro', 'Гучність до 600%, Bass/Voice Boost, візуалізатор частот, спектрограма та підтримка Spotify Web Player.', 'Регулятор гучності Pro']
  };
  for (const [locale, values] of Object.entries(expected)) {
    const data = JSON.parse(read(`_locales/${locale}/messages.json`));
    assert.equal(data.extName.message, values[0]);
    assert.equal(data.extDescription.message, values[1]);
    assert.equal(data.actionTitle.message, values[2]);
  }
});


check('all 25 GTA VI palette aliases exist in runtime translations for RU/EN/UK', () => {
  const keys = [
    'themeViceCityPinkAmethyst','themeLeonidaCoastalHaze','themeHavanaVintage',
    'themeViceCitySunsetBloom','themeLeonidaCrimsonSunset','themeOceanDriveSeaGlass',
    'themeLeonidaGoldenHour','themeViceCityDesertAmber','themeViceCityNightPromenade',
    'themeGtaPromoPalette','themeGtaNeonTriTone','themeGtaSunsetSpectrum',
    'themeGtaVioletBloom','themeGtaPastelCoast','themeGtaWarmPastels',
    'themeGtaAnalogViolet','themeGtaNightContrast','themeGtaPastelSunset',
    'themeGtaNeonCoast','themeGtaOceanAnalog','themeGtaSkyAndNeon',
    'themeGtaPinkVioletUmber','themeGtaSandAndSea','themeGtaDeepOcean','themeGtaAmberEarth'
  ];
  assert.equal(keys.length, 25);
  for (const locale of ['en','ru','uk']) {
    const dictionary = JSON.parse(read(`lang/${locale}.json`));
    for (const key of keys) assert.ok(typeof dictionary[key] === 'string' && dictionary[key].trim(), `${locale}/${key}`);
  }
});

check('all 25 GTA VI palette keys exist in browser messages catalogs', () => {
  const keys = Object.keys(JSON.parse(read('_locales/en/messages.json'))).filter((key) => key.startsWith('theme'));
  assert.equal(keys.length, 25);
  for (const locale of ['en','ru','uk','en_US','en_GB','ru_RU','uk_UA']) {
    const dictionary = JSON.parse(read(`_locales/${locale}/messages.json`));
    for (const key of keys) assert.ok(typeof dictionary[key]?.message === 'string' && dictionary[key].message.trim(), `${locale}/${key}`);
  }
});

check('palette gallery uses descriptive theme translation keys for all 25 IDs', () => {
  const popup = read('popup.js');
  const keys = [
    'themeViceCityPinkAmethyst','themeLeonidaCoastalHaze','themeHavanaVintage',
    'themeViceCitySunsetBloom','themeLeonidaCrimsonSunset','themeOceanDriveSeaGlass',
    'themeLeonidaGoldenHour','themeViceCityDesertAmber','themeViceCityNightPromenade',
    'themeGtaPromoPalette','themeGtaNeonTriTone','themeGtaSunsetSpectrum',
    'themeGtaVioletBloom','themeGtaPastelCoast','themeGtaWarmPastels',
    'themeGtaAnalogViolet','themeGtaNightContrast','themeGtaPastelSunset',
    'themeGtaNeonCoast','themeGtaOceanAnalog','themeGtaSkyAndNeon',
    'themeGtaPinkVioletUmber','themeGtaSandAndSea','themeGtaDeepOcean','themeGtaAmberEarth'
  ];
  assert.match(popup, /GTA6_PALETTE_TRANSLATION_KEYS/);
  for (const key of keys) assert.ok(popup.includes(`'${key}'`), `popup map missing ${key}`);
  assert.match(popup, /const translatedName = t\(translationKey\)/);
});

check('regional Edge locales have explicit metadata catalogs', () => {
  for (const [regional, parent] of [['en_US','en'], ['en_GB','en'], ['ru_RU','ru'], ['uk_UA','uk']]) {
    const regionalData = JSON.parse(read(`_locales/${regional}/messages.json`));
    const parentData = JSON.parse(read(`_locales/${parent}/messages.json`));
    for (const key of ['extName', 'extDescription', 'actionTitle']) {
      assert.equal(regionalData[key].message, parentData[key].message, `${regional}.${key} must match ${parent}`);
    }
  }
});

check('25 GTA VI palettes are present with valid HEX gradient stops and preserve all supplied colors', () => {
  const popup = read('popup.js');
  const start = popup.indexOf('const GTA6_COLOR_PALETTES = Object.freeze({');
  const endMarker = "const GTA6_PALETTE_IDS = Object.freeze(['classic', ...Object.keys(GTA6_COLOR_PALETTES)]);";
  const end = popup.indexOf(endMarker, start) + endMarker.length;
  assert.ok(start >= 0 && end > start);
  const context = vm.createContext({ Object });
  new vm.Script(popup.slice(start, end), { filename: 'popup.js#GTA6_COLOR_PALETTES' }).runInContext(context);
  const palettes = vm.runInContext('GTA6_COLOR_PALETTES', context);
  const ids = Object.keys(palettes);
  assert.equal(ids.length, 25);
  for (let index = 1; index <= 25; index += 1) {
    const id = `gta-${String(index).padStart(2, '0')}`;
    assert.ok(Object.hasOwn(palettes, id), `missing ${id}`);
    assert.ok(palettes[id].length >= 5 && palettes[id].length <= 8);
    assert.ok(palettes[id].every((hex) => /^#[0-9a-f]{6}$/i.test(hex)));
    assert.ok(Object.isFrozen(palettes[id]));
  }
  const supplied = {
    'gta-01': ['#EB9998', '#5D549C', '#6F70A2', '#7E3A63', '#A373D3'],
    'gta-02': ['#7AB3C9', '#7679B5', '#C1E1CD', '#9993C3', '#2B3F5A'],
    'gta-03': ['#382E23', '#6F5E48', '#EDECEC', '#DCCA9C', '#684549'],
    'gta-04': ['#EA92A4', '#210B0E', '#FAB67C', '#D395C5', '#712C3E'],
    'gta-05': ['#230A09', '#C8441F', '#E4C9D0', '#EAC396', '#4D150B'],
    'gta-06': ['#DFE8F1', '#95A6C9', '#E2DCD2', '#4C9682', '#404541'],
    'gta-07': ['#BBA87A', '#6E421A', '#D59E46', '#C78A3D', '#845120'],
    'gta-08': ['#4B3733', '#B6A9AA', '#B17B57', '#E8A759', '#7C3E1A'],
    'gta-09': ['#231144', '#461C4C', '#1B1C2E', '#5865F2', '#F4A97E'],
    'gta-10': ['#261868', '#4B165C', '#432026', '#6486D8', '#D466A6', '#F8AE70'],
    'gta-11': ['#3d6ff6', '#7277fc', '#aa63da', '#d73394', '#f70026', '#fd2100'],
    'gta-12': ['#ff9347', '#ff726a', '#f143a2', '#c739c3', '#6c43c2', '#335dce'],
    'gta-13': ['#2c0090', '#4d0baa', '#7927ec', '#aa46ff', '#d55df0', '#f677b0', '#ff8f92', '#fda6b5'],
    'gta-14': ['#74adc8', '#b7b6dc', '#f8c2c8', '#f3ecdc', '#9fd3c8', '#5fb3b0'],
    'gta-15': ['#864777', '#d4879a', '#fea76e', '#a99ae2', '#8f6ccc'],
    'gta-16': ['#4b3c79', '#62599b', '#8f76c1', '#c28aca', '#f79ac9'],
    'gta-17': ['#f15596', '#bc344e', '#1c0a12', '#2a2058', '#646ee4'],
    'gta-18': ['#bf8ebd', '#de93b6', '#f69f9f', '#ffbfa0', '#e85351'],
    'gta-19': ['#e42499', '#ff726b', '#ffbe92', '#7e36bc', '#00133a'],
    'gta-20': ['#2f7fd0', '#7cc0ec', '#d6eff4', '#5fd8cc', '#10a7a0'],
    'gta-21': ['#b5d1f9', '#f8c0fe', '#feaaff', '#f78efd', '#a872fc', '#5253ff', '#2437ff'],
    'gta-22': ['#e6a192', '#dc8bcc', '#cd75f4', '#b563fc', '#9b51ea', '#8643bb', '#6f3b75', '#5f382a'],
    'gta-23': ['#ecdcb4', '#94d6bd', '#6abcc9', '#4f86b8', '#2f6a8f'],
    'gta-24': ['#dff2fb', '#46b9d3', '#018aa5', '#00527d', '#1e3a63'],
    'gta-25': ['#ffcb60', '#f2a048', '#db7128', '#9a4119', '#5a240d']
  };
  for (const [id, colors] of Object.entries(supplied)) assert.deepEqual([...palettes[id]], colors, `${id} must preserve supplied HEX order`);
  assert.deepEqual(Object.keys(palettes), Object.keys(supplied));
});

check('popup exposes a compact accessible four-column gallery for classic and all 25 localized GTA VI palettes', () => {
  const html = read('popup.html');
  const popup = read('popup.js');
  const css = read('popup.css');
  assert.match(html, /id="gtaPaletteGallery" class="gta-palette-gallery" role="radiogroup"/);
  assert.doesNotMatch(html, /<select id="gtaPaletteSelect"/);
  assert.match(html, /id="gtaPalettePreview"/);
  assert.match(popup, /function renderGtaPaletteGallery\(/);
  assert.match(popup, /GTA6_PALETTE_IDS\.forEach\(\(paletteId\) =>/);
  assert.match(popup, /button\.setAttribute\('role', 'radio'\)/);
  assert.match(popup, /gtaPaletteGallery\.addEventListener\('click'/);
  assert.match(popup, /gtaPaletteGallery\.addEventListener\('keydown'/);
  assert.match(popup, /ArrowRight.*ArrowDown.*ArrowLeft.*ArrowUp.*Home.*End/s);
  assert.match(popup, /document\.body\.dataset\.accentPalette = selected/);
  assert.match(css, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /max-height:\s*236px/);
  assert.match(css, /overflow-y:\s*auto/);
  for (const locale of ['ru', 'en', 'uk']) {
    const messages = JSON.parse(read(`lang/${locale}.json`));
    for (let index = 1; index <= 25; index += 1) {
      const key = `gtaPalette${String(index).padStart(2, '0')}`;
      assert.ok(typeof messages[key] === 'string' && messages[key].trim(), `${locale} missing ${key}`);
    }
    assert.ok(messages.gtaPaletteChoose && messages.gtaPaletteClassicShort, `${locale} gallery accessibility labels missing`);
  }
});

check('palette gallery renders exactly 26 accessible swatches with real gradients and one selected item', () => {
  const popup = read('popup.js');
  const colorsStart = popup.indexOf('const GTA6_COLOR_PALETTES = Object.freeze({');
  const colorsEndMarker = "const GTA6_PALETTE_IDS = Object.freeze(['classic', ...Object.keys(GTA6_COLOR_PALETTES)]);";
  const colorsEnd = popup.indexOf(colorsEndMarker, colorsStart) + colorsEndMarker.length;
  const mapStart = popup.indexOf('const GTA6_PALETTE_TRANSLATION_KEYS = Object.freeze({', colorsEnd);
  const functionsStart = popup.indexOf('function getGtaPaletteName(', mapStart);
  const functionsEnd = popup.indexOf('function applyGtaPalette(', functionsStart);
  assert.ok(colorsStart >= 0 && colorsEnd > colorsStart && mapStart > colorsEnd && functionsStart > mapStart && functionsEnd > functionsStart);

  class FakeClassList {
    toggle() {}
  }
  class FakeElement {
    constructor(tagName) {
      this.tagName = tagName;
      this.dataset = {};
      this.attributes = {};
      this.children = [];
      this.style = {};
      this.classList = new FakeClassList();
      this.textContent = '';
      this.tabIndex = 0;
    }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items.flatMap((item) => item.tagName === '#fragment' ? item.children : [item]); }
    querySelectorAll(selector) {
      assert.equal(selector, '[data-gta-palette]');
      return this.children.filter((child) => child.dataset && child.dataset.gtaPalette);
    }
  }
  const gallery = new FakeElement('div');
  const themeKeys = [
    'themeViceCityPinkAmethyst','themeLeonidaCoastalHaze','themeHavanaVintage',
    'themeViceCitySunsetBloom','themeLeonidaCrimsonSunset','themeOceanDriveSeaGlass',
    'themeLeonidaGoldenHour','themeViceCityDesertAmber','themeViceCityNightPromenade',
    'themeGtaPromoPalette','themeGtaNeonTriTone','themeGtaSunsetSpectrum',
    'themeGtaVioletBloom','themeGtaPastelCoast','themeGtaWarmPastels',
    'themeGtaAnalogViolet','themeGtaNightContrast','themeGtaPastelSunset',
    'themeGtaNeonCoast','themeGtaOceanAnalog','themeGtaSkyAndNeon',
    'themeGtaPinkVioletUmber','themeGtaSandAndSea','themeGtaDeepOcean','themeGtaAmberEarth'
  ];
  const labels = Object.fromEntries(themeKeys.map((key, index) => [key, `Localized ${index + 1}`]));
  const context = vm.createContext({
    Object,
    String,
    Math,
    gtaPalette: 'gta-12',
    gtaPaletteGallery: gallery,
    DEFAULT_UI_GRADIENT: ['#4bd9ed', '#7d91ff', '#b88aff'],
    t: (key) => ({ gtaPaletteClassic: 'Classic', gtaPaletteChoose: 'Select palette', ...labels })[key] || key,
    document: {
      createDocumentFragment: () => new FakeElement('#fragment'),
      createElement: (tagName) => new FakeElement(tagName)
    }
  });
  new vm.Script(popup.slice(colorsStart, colorsEnd) + '\n' + popup.slice(mapStart, functionsEnd), { filename: 'popup.js#palette-gallery-render' }).runInContext(context);
  context.renderGtaPaletteGallery();
  const cards = gallery.querySelectorAll('[data-gta-palette]');
  assert.equal(cards.length, 26);
  assert.equal(cards[0].dataset.gtaPalette, 'classic');
  assert.equal(cards[25].dataset.gtaPalette, 'gta-25');
  assert.equal(cards.filter((card) => card.attributes['aria-checked'] === 'true').length, 1);
  const selected = cards.find((card) => card.dataset.gtaPalette === 'gta-12');
  assert.equal(selected.attributes['aria-checked'], 'true');
  assert.equal(selected.tabIndex, 0);
  assert.match(selected.children[0].style.background, /#ff9347.*#ff726a.*#f143a2/);
  assert.equal(selected.attributes['aria-label'], 'Localized 12. Select palette');
  assert.equal(gallery.attributes['aria-label'], 'gtaPaletteLabel');
});

check('palette IDs keep the 10 current palettes and restore all 15 original gradients', () => {
  const popup = read('popup.js');
  assert.match(popup, /function migrateLegacyGtaPaletteId\(paletteId\)/);
  assert.match(popup, /oldNumber >= 16 && oldNumber <= 25/);
  assert.match(popup, /oldNumber - 15/);
  assert.match(popup, /oldNumber >= 1 && oldNumber <= 15\) return `gta-\$\{String\(oldNumber \+ 10\)/);
  assert.match(popup, /function normalizeStoredGtaPaletteId\(paletteId, paletteVersion\)/);
  assert.match(popup, /gtaPaletteVersion: GTA6_PALETTE_VERSION/);
  assert.match(popup, /'gta-11': Object\.freeze/);
  assert.match(popup, /'gta-25': Object\.freeze/);
});

check('legacy palette migration restores original gradients and retains the ten user palettes', () => {
  const popup = read('popup.js');
  const start = popup.indexOf('const GTA6_PALETTE_VERSION = 2;');
  const end = popup.indexOf('// EN: Storage queue', start);
  assert.ok(start >= 0 && end > start);
  const context = vm.createContext({ Object });
  new vm.Script(popup.slice(start, end), { filename: 'popup.js#palette-migration' }).runInContext(context);
  assert.equal(context.migrateLegacyGtaPaletteId('gta-16'), 'gta-01');
  assert.equal(context.migrateLegacyGtaPaletteId('gta-25'), 'gta-10');
  assert.equal(context.migrateLegacyGtaPaletteId('gta-01'), 'gta-11');
  assert.equal(context.migrateLegacyGtaPaletteId('gta-15'), 'gta-25');
  assert.equal(context.migrateLegacyGtaPaletteId('classic'), 'classic');
  assert.equal(context.migrateLegacyGtaPaletteId('gta-26'), null);
  assert.equal(context.normalizeStoredGtaPaletteId('gta-18', undefined), 'gta-03');
  assert.equal(context.normalizeStoredGtaPaletteId('gta-03', 2), 'gta-03');
  assert.equal(context.normalizeStoredGtaPaletteId('gta-14', 2), 'gta-14');
  assert.equal(context.normalizeStoredGtaPaletteId('gta-25', 2), 'gta-25');
});

check('palette and backup schema 22 are persisted and legacy backups remain compatible', () => {
  const popup = read('popup.js');
  assert.match(popup, /const SETTINGS_CONFIG_SCHEMA_VERSION = 28;/);
  assert.match(popup, /writeLocalSettings\(\{ gtaPalette, gtaPaletteVersion: GTA6_PALETTE_VERSION \}\)/);
  assert.match(popup, /'language', 'themeMode', 'gtaPalette', 'gtaPaletteVersion', 'rgbGlow'/);
  assert.match(popup, /gtaPalette = normalizeStoredGtaPaletteId\(savedPreferences\.gtaPalette, savedPreferences\.gtaPaletteVersion\)/);
  assert.match(popup, /const importedGtaPalette = config\.schemaVersion >= 21 \? importedGtaPaletteRaw : migrateLegacyGtaPaletteId\(importedGtaPaletteRaw\)/);
  assert.match(popup, /config\.schemaVersion >= 19 && !hasOwnSettingsKeys\(value, gtaPaletteKeys\)/);
  assert.match(popup, /gtaPalette: imported\.gtaPalette/);
  assert.match(popup, /gtaPaletteVersion: GTA6_PALETTE_VERSION/);
});

check('GTA VI palettes recolor popup accents and SVG icon strokes without changing audio settings', () => {
  const css = read('popup.css');
  const popup = read('popup.js');
  assert.match(css, /body\[data-accent-palette\^="gta-"\] \.volume-value:not\(\.boosted\)/);
  assert.match(css, /body\[data-accent-palette\^="gta-"\] \.toggle input:checked \+ \.toggle-slider/);
  assert.match(css, /body\[data-accent-palette\^="gta-"\] \.logo > \.brand-mark/);
  assert.match(popup, /function setGtaPalette\(nextPalette\)/);
  assert.match(popup, /await writeLocalSettings\(\{ gtaPalette, gtaPaletteVersion: GTA6_PALETTE_VERSION \}\)/);
  assert.doesNotMatch(popup, /chrome\.runtime\.sendMessage\(\{ type: 'SET_VOLUME'.*gtaPalette/s);
});

check('shared genres API exposes the required arrays', () => {
  assert.ok(Array.isArray(genres.catalog));
  assert.ok(Array.isArray(genres.allowedGenreIds));
  assert.ok(Array.isArray(genres.allowedStates));
  assert.ok(Array.isArray(genres.ambiguousAliases));
  assert.equal(genres.catalog.length, 81);
});

check('shared genre label keys are derived from the catalogue', () => {
  assert.ok(genres.labelKeys && typeof genres.labelKeys === 'object');
  const expected = Object.fromEntries(genres.catalog.map((item) => [item.id, item.label]));
  assert.deepEqual({ ...genres.labelKeys }, expected);
  assert.equal(Object.keys(genres.labelKeys).length, genres.catalog.length);
  assert.ok(Object.isFrozen(genres.labelKeys));
});

check('genre IDs are unique and match catalogue independent of order', () => {
  const catalogIds = genres.catalog.map((item) => item.id);
  const allowedIds = [...genres.allowedGenreIds];
  assert.equal(new Set(catalogIds).size, catalogIds.length);
  assert.equal(new Set(allowedIds).size, allowedIds.length);
  assert.deepEqual([...catalogIds].sort(), [...allowedIds].sort());
});

check('every genre has valid fields, family, and aliases', () => {
  const families = new Set([
    'hiphop', 'bassHeavy', 'pop', 'rock', 'electronic', 'atmosphere',
    'jazz', 'vocal', 'acoustic', 'classical', 'world', 'neutral'
  ]);
  for (const item of genres.catalog) {
    assert.equal(typeof item.id, 'string');
    assert.ok(item.id.length > 0);
    assert.equal(typeof item.label, 'string');
    assert.ok(item.label.length > 0);
    assert.ok(families.has(item.family), `invalid family for ${item.id}: ${item.family}`);
    assert.ok(Array.isArray(item.aliases));
    assert.ok(item.aliases.every((alias) => typeof alias === 'string'));
  }
});

check('shared genre API and nested catalogue values are frozen', () => {
  assert.ok(Object.isFrozen(genres));
  assert.ok(Object.isFrozen(genres.catalog));
  assert.ok(Object.isFrozen(genres.allowedGenreIds));
  assert.ok(Object.isFrozen(genres.allowedStates));
  assert.ok(Object.isFrozen(genres.ambiguousAliases));
  assert.ok(genres.catalog.every((item) => Object.isFrozen(item) && Object.isFrozen(item.aliases)));
});

check('genre states and ambiguous aliases are valid and unique', () => {
  assert.deepEqual([...genres.allowedStates].sort(),
    ['disabled', 'waiting-capture', 'detected', 'detecting'].sort());
  assert.ok(genres.ambiguousAliases.length > 0);
  assert.equal(new Set(genres.ambiguousAliases).size, genres.ambiguousAliases.length);
  assert.ok(genres.ambiguousAliases.every((alias) => typeof alias === 'string' && alias.length > 0));
});

const validSettings = {
  volume: 1,
  muted: false,
  bassBoostEnabled: true,
  bassBoostDb: 4,
  voiceBoostEnabled: true,
  voiceBoostDb: 2,
  peakLimiterEnabled: true,
  nightModeEnabled: false
};
check('validation accepts settings with required tabId', () => {
  assert.equal(validation.isValidAudioSettingsMessage({ ...validSettings, tabId: 12 }, { requireTabId: true }), true);
  assert.equal(validation.isValidAudioSettingsMessage(validSettings, { requireTabId: true }), false);
  assert.equal(validation.isValidAudioSettingsMessage({ ...validSettings, tabId: '12' }, { requireTabId: true }), false);
});

check('validation does not require tabId when false or omitted', () => {
  assert.equal(validation.isValidAudioSettingsMessage(validSettings, { requireTabId: false }), true);
  assert.equal(validation.isValidAudioSettingsMessage(validSettings), true);
  assert.equal(validation.isValidAudioSettingsMessage({ ...validSettings, tabId: 'optional' }, { requireTabId: false }), true);
});

check('background catalogue validator accepts reordered IDs and rejects invalid catalogues', () => {
  const source = read('background.js');
  const start = source.indexOf('function isBackgroundGenreApiConsistent(api) {');
  const end = source.indexOf('\n}', start) + 2;
  assert.ok(start >= 0 && end > start);
  const context = vm.createContext({ Set, Array });
  new vm.Script(source.slice(start, end), { filename: 'background.js#isBackgroundGenreApiConsistent' }).runInContext(context);
  const api = {
    catalog: [
      { id: 'genreA', label: 'a', family: 'hiphop', aliases: ['rap'] },
      { id: 'genreB', label: 'b', family: 'neutral', aliases: [] }
    ],
    allowedGenreIds: ['genreB', 'genreA'],
    allowedStates: ['disabled', 'waiting-capture', 'detected', 'detecting']
  };
  assert.equal(vm.runInContext('isBackgroundGenreApiConsistent(api)', Object.assign(context, { api })), true);
  const duplicate = { ...api, allowedGenreIds: ['genreA', 'genreA'] };
  context.api = duplicate;
  assert.equal(vm.runInContext('isBackgroundGenreApiConsistent(api)', context), false);
  const badFamily = { ...api, catalog: [{ ...api.catalog[0], family: 'hip-hop' }, api.catalog[1]] };
  context.api = badFamily;
  assert.equal(vm.runInContext('isBackgroundGenreApiConsistent(api)', context), false);
  const missingState = { ...api, allowedStates: ['disabled'] };
  context.api = missingState;
  assert.equal(vm.runInContext('isBackgroundGenreApiConsistent(api)', context), false);
});

check('background genre ID Set reads from the validated API and has no undefined identifier', () => {
  const source = read('background.js');
  assert.match(source, /const allowedGenreIdSet = new Set\(backgroundGenreApiIsConsistent \? backgroundGenreApi\.allowedGenreIds : \[\]\);/);
  assert.doesNotMatch(source, /\bbackgroundGenreIds\b/);
  const context = vm.createContext({
    backgroundGenreApiIsConsistent: true,
    backgroundGenreApi: genres,
    Set
  });
  new vm.Script(
    'const allowedGenreIdSet = new Set(backgroundGenreApiIsConsistent ? backgroundGenreApi.allowedGenreIds : []);'
  ).runInContext(context);
  assert.equal(vm.runInContext('allowedGenreIdSet.size', context), 81);
  const fallback = vm.createContext({ backgroundGenreApiIsConsistent: false, backgroundGenreApi: null, Set });
  new vm.Script(
    'const allowedGenreIdSet = new Set(backgroundGenreApiIsConsistent ? backgroundGenreApi.allowedGenreIds : []);'
  ).runInContext(fallback);
  assert.equal(vm.runInContext('allowedGenreIdSet.size', fallback), 0);
});

check('genre absence has audio-safe fail-safe paths', () => {
  const background = read('background.js');
  const offscreen = read('offscreen.js');
  assert.match(background, /try\s*\{\s*importScripts\('shared\/genres\.js'\);\s*\}\s*catch/);
  assert.match(offscreen, /const AUTO_GENRE_CATALOG = offscreenGenreApi \? offscreenGenreApi\.catalog : \[\];/);
  assert.match(offscreen, /if \(!AUTO_GENRE_MATCHERS\.length\) return null;/);
  assert.match(offscreen, /function getSelectedAutoGenreProfile\(\)[\s\S]*?hasOwnProperty\.call\(AUTO_GENRE_PROFILES, currentAutoGenre\)/);
});

check('empty genre matcher list returns null without classification work', () => {
  const offscreen = read('offscreen.js');
  const start = offscreen.indexOf('function classifyGenreFromTitle(title) {');
  const end = offscreen.indexOf('\n}', start) + 2;
  assert.ok(start >= 0 && end > start);
  const context = vm.createContext({ AUTO_GENRE_MATCHERS: [] });
  new vm.Script(offscreen.slice(start, end), { filename: 'offscreen.js#classifyGenreFromTitle' }).runInContext(context);
  assert.equal(vm.runInContext("classifyGenreFromTitle('ambient music')", context), null);
});

check('null or unknown genre returns no selected EQ profile', () => {
  const offscreen = read('offscreen.js');
  const start = offscreen.indexOf('function getSelectedAutoGenreProfile() {');
  const end = offscreen.indexOf('\n}', start) + 2;
  assert.ok(start >= 0 && end > start);
  const context = vm.createContext({
    currentAutoGenre: null,
    currentAutoGenreProfile: null,
    AUTO_GENRE_PROFILES: {}
  });
  new vm.Script(offscreen.slice(start, end), { filename: 'offscreen.js#getSelectedAutoGenreProfile' }).runInContext(context);
  assert.equal(vm.runInContext('getSelectedAutoGenreProfile()', context), null);
  context.currentAutoGenre = 'unknownGenre';
  assert.equal(vm.runInContext('getSelectedAutoGenreProfile()', context), null);
  context.AUTO_GENRE_PROFILES.knownGenre = { bassBoostDb: 3 };
  context.currentAutoGenre = 'knownGenre';
  assert.deepEqual({ ...vm.runInContext('getSelectedAutoGenreProfile()', context) }, { bassBoostDb: 3 });
});

check('offscreen publishes a null genre safely when catalogue is empty', () => {
  const offscreen = read('offscreen.js');
  const start = offscreen.indexOf('function publishAutoGenreStatus(force = false) {');
  const end = offscreen.indexOf('\n}', start) + 2;
  assert.ok(start >= 0 && end > start);
  const sent = [];
  const context = vm.createContext({
    currentStream: {}, analyserNode: {}, currentAutoGenre: null,
    currentAutoGenreConfidence: 0.95, currentAutoGenreSource: 'audio',
    currentSourceTrackId: 'test-track', currentSourceTitle: 'Test track',
    autoGenreEnabled: true, autoGenreBassManualOverride: false, autoGenreVoiceManualOverride: false,
    AUTO_GENRE_PROFILES: {}, lastAutoGenreStatusSignature: '',
    getSelectedAutoGenreProfile: () => null,
    chrome: { runtime: { sendMessage: (message) => { sent.push(message); return Promise.resolve(); } } }
  });
  new vm.Script(offscreen.slice(start, end), { filename: 'offscreen.js#publishAutoGenreStatus' }).runInContext(context);
  vm.runInContext('publishAutoGenreStatus(true)', context);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].genre, null);
  assert.equal(sent[0].source, null);
  assert.equal(sent[0].confidence, 0);
  assert.equal(sent[0].bassBoostDb, null);
  assert.equal(sent[0].volumeTrimDb, null);
});

check('null genre status is safe in offscreen and popup', () => {
  const offscreen = read('offscreen.js');
  const popup = read('popup.js');
  assert.match(offscreen, /const genreAvailable = typeof currentAutoGenre === 'string'[\s\S]*?genre: genreAvailable \? currentAutoGenre : null/);
  assert.match(popup, /typeof autoGenreStatus\.genre !== 'string'/);
  assert.match(popup, /typeof message\.genre === 'string'/);
});

check('popup loads shared genre labels before popup.js', () => {
  const html = read('popup.html');
  const sharedGenresIndex = html.indexOf('<script src="shared/genres.js"></script>');
  const popupIndex = html.indexOf('<script src="popup.js"></script>');
  assert.ok(sharedGenresIndex >= 0 && popupIndex > sharedGenresIndex);
});

check('popup uses shared label keys with a safe fallback and no duplicate map', () => {
  const popup = read('popup.js');
  assert.match(popup, /const AUTO_GENRE_LABELS = typeof VCPGenres !== 'undefined' && VCPGenres && VCPGenres\.labelKeys/);
  assert.match(popup, /: Object\.freeze\(Object\.create\(null\)\);/);
  assert.doesNotMatch(popup, /const AUTO_GENRE_LABELS = \{/);
});

check('popup warns when a setting is applied but not persisted', () => {
  const popup = read('popup.js');
  assert.match(popup, /result\.storagePersisted === false/);
  assert.match(popup, /autoGenreAppliedNotSaved/);
});

check('offscreen HTML loads shared scripts before offscreen.js', () => {
  const html = read('offscreen.html');
  const validationIndex = html.indexOf('shared/validation.js');
  const genresIndex = html.indexOf('shared/genres.js');
  const offscreenIndex = html.indexOf('offscreen.js');
  assert.ok(validationIndex >= 0 && genresIndex > validationIndex && offscreenIndex > genresIndex);
});

check('all JavaScript files parse with Node syntax rules', () => {
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && entry.name.endsWith('.js')) {
        const relative = path.relative(ROOT, fullPath);
        new vm.Script(fs.readFileSync(fullPath, 'utf8'), { filename: relative });
      }
    }
  }
  walk(ROOT);
});

check('all JSON files parse', () => {
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && entry.name.endsWith('.json')) JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    }
  }
  walk(ROOT);
});



check('all 25 palettes are localized in Russian, English, and Ukrainian with no removed brand wording', () => {
  for (const lang of ['ru', 'en', 'uk']) {
    const dictionary = JSON.parse(read(`lang/${lang}.json`));
    for (let index = 1; index <= 25; index += 1) {
      const key = `gtaPalette${String(index).padStart(2, '0')}`;
      assert.equal(typeof dictionary[key], 'string', `${lang}.${key} is required`);
      assert.ok(dictionary[key].length > 0, `${lang}.${key} must not be empty`);
    }
  }
  const allFiles = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile()) allFiles.push(fs.readFileSync(fullPath, 'utf8'));
    }
  }
  walk(ROOT);
  assert.doesNotMatch(allFiles.join('\n'), new RegExp(['dis', 'cord'].join(''), 'i'));
});

check('backup schema 22 retains v19/v20 palette migration compatibility', () => {
  const popup = read('popup.js');
  assert.match(popup, /const SETTINGS_CONFIG_SCHEMA_VERSION = 28;/);
  assert.match(popup, /Schema v20 \(4\.8\.1\)[\s\S]*schema v21 \(4\.8\.2\)/);
  assert.match(popup, /config\.schemaVersion >= 21 \? importedGtaPaletteRaw : migrateLegacyGtaPaletteId/);
  assert.match(popup, /oldNumber >= 16 && oldNumber <= 25/);
});


check('volume slider marks and quick presets expose all five themed thresholds', () => {
  const html = read('popup.html');
  const thresholds = ['200', '300', '400', '500', '600'];
  for (const value of thresholds) {
    assert.match(html, new RegExp(`<span data-volume-threshold="${value}">${value}<\\/span>`));
    assert.match(html, new RegExp(`class="preset-btn" data-value="${value}" data-volume-threshold="${value}"`));
  }
});

check('palette sampling maps all palette stops to five volume colours', () => {
  const popup = read('popup.js');
  const start = popup.indexOf('function interpolateHexColor(');
  const end = popup.indexOf('function applyGtaVolumeNumberColor(', start);
  assert.ok(start >= 0 && end > start);
  const context = vm.createContext({ DEFAULT_UI_GRADIENT: ['#000000', '#808080', '#FFFFFF'] });
  new vm.Script(popup.slice(start, end), { filename: 'popup.js#volume-palette-helpers' }).runInContext(context);
  const result = [...context.getGtaVolumeThresholdColors(['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF'])];
  assert.deepEqual(result, ['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF']);
  const sixStopResult = [...context.getGtaVolumeThresholdColors(['#000000', '#202020', '#404040', '#606060', '#808080', '#A0A0A0'])];
  assert.deepEqual(sixStopResult, ['#000000', '#282828', '#505050', '#787878', '#A0A0A0']);
});

check('all 25 GTA VI palettes generate five valid volume milestone colours', () => {
  const popup = read('popup.js');
  const paletteStart = popup.indexOf('const GTA6_COLOR_PALETTES = Object.freeze({');
  const paletteEndMarker = "const GTA6_PALETTE_IDS = Object.freeze(['classic', ...Object.keys(GTA6_COLOR_PALETTES)]);";
  const paletteEnd = popup.indexOf(paletteEndMarker, paletteStart) + paletteEndMarker.length;
  const helperStart = popup.indexOf('function interpolateHexColor(');
  const helperEnd = popup.indexOf('function applyGtaVolumeNumberColor(', helperStart);
  const context = vm.createContext({ Object, DEFAULT_UI_GRADIENT: ['#000000', '#808080', '#FFFFFF'] });
  new vm.Script(popup.slice(paletteStart, paletteEnd), { filename: 'popup.js#all-GTA-palettes' }).runInContext(context);
  new vm.Script(popup.slice(helperStart, helperEnd), { filename: 'popup.js#all-palette-volume-colours' }).runInContext(context);
  const palettes = vm.runInContext('GTA6_COLOR_PALETTES', context);
  assert.equal(Object.keys(palettes).length, 25);
  for (const [id, colors] of Object.entries(palettes)) {
    const milestones = [...context.getGtaVolumeThresholdColors([...colors])];
    assert.equal(milestones.length, 5, `${id} must provide five milestone colours`);
    assert.ok(milestones.every((hex) => /^#[0-9A-F]{6}$/.test(hex)), `${id} has invalid sampled colours`);
  }
});

check('current volume number follows the 200/300/400/500/600 palette bands', () => {
  const popup = read('popup.js');
  const start = popup.indexOf('function interpolateHexColor(');
  const end = popup.indexOf('function applyGtaVolumeNumberColor(', start);
  const context = vm.createContext({ DEFAULT_UI_GRADIENT: ['#000000', '#808080', '#FFFFFF'] });
  new vm.Script(popup.slice(start, end), { filename: 'popup.js#volume-current-colour' }).runInContext(context);
  const palette = ['#111111', '#222222', '#333333', '#444444', '#555555'];
  assert.equal(context.getGtaCurrentVolumeColor(100, palette), null);
  assert.equal(context.getGtaCurrentVolumeColor(199, palette), '#111111');
  assert.equal(context.getGtaCurrentVolumeColor(200, palette), '#111111');
  assert.equal(context.getGtaCurrentVolumeColor(299, palette), '#111111');
  assert.equal(context.getGtaCurrentVolumeColor(300, palette), '#222222');
  assert.equal(context.getGtaCurrentVolumeColor(400, palette), '#333333');
  assert.equal(context.getGtaCurrentVolumeColor(500, palette), '#444444');
  assert.equal(context.getGtaCurrentVolumeColor(600, palette), '#555555');
  assert.equal(context.getGtaCurrentVolumeColor(999, palette), '#555555');
});

check('volume thresholds and boosted current number are styled with the active GTA palette', () => {
  const css = read('popup.css');
  const popup = read('popup.js');
  assert.match(css, /\.slider-marks \[data-volume-threshold\]/);
  assert.match(css, /\.preset-btn\[data-volume-threshold\]/);
  assert.match(css, /\.volume-value\.boosted/);
  assert.match(css, /--vcp-volume-threshold-color/);
  assert.match(css, /--vcp-current-volume-color/);
  assert.match(popup, /applyGtaVolumeThresholdColors\(colors\)/);
  assert.match(popup, /applyGtaVolumeNumberColor\(percent, GTA6_COLOR_PALETTES\[gtaPalette\]\)/);
  assert.match(popup, /element\.style\.setProperty\('--vcp-volume-threshold-color', color\)/);
});


check('filled-area and radial visualizer styles are selectable and localized', () => {
  const html = read('popup.html');
  const popup = read('popup.js');
  assert.match(popup, /const VISUALIZER_STYLES = \['bars', 'line', 'wave', 'mirror', 'dots', 'area', 'radial'\]/);
  assert.match(html, /value="area" data-i18n="visualizerStyleArea"/);
  assert.match(html, /value="radial" data-i18n="visualizerStyleRadial"/);
  assert.match(popup, /visualizerStyle === 'radial'/);
  assert.match(popup, /visualizerStyle === 'area'/);
  for (const language of ['ru', 'en', 'uk']) {
    const dictionary = JSON.parse(read(`lang/${language}.json`));
    assert.ok(dictionary.visualizerStyleArea);
    assert.ok(dictionary.visualizerStyleRadial);
  }
});

check('both frequency visualizer and spectrogram expose the GTA VI theme mode', () => {
  const html = read('popup.html');
  const popup = read('popup.js');
  assert.equal((html.match(/value="gta" data-i18n="paletteGtaTheme"/g) || []).length, 2);
  assert.match(popup, /const SPECTROGRAM_PALETTES = \['gta', 'neon', 'ocean', 'fire', 'mono'\]/);
  assert.match(popup, /function getSelectedGtaVisualizerColors\(\)/);
  assert.match(popup, /function getSpectrogramPalette\(\)/);
});

check('visualizer and spectrogram read RGB stops from the currently selected GTA palette', () => {
  const popup = read('popup.js');
  const start = popup.indexOf('function getSelectedGtaVisualizerColors()');
  const end = popup.indexOf('// EN: Creates a canvas gradient', start);
  assert.ok(start >= 0 && end > start);
  const paletteStart = popup.indexOf('const GTA6_COLOR_PALETTES = Object.freeze({');
  const paletteEndMarker = "const GTA6_PALETTE_IDS = Object.freeze(['classic', ...Object.keys(GTA6_COLOR_PALETTES)]);";
  const paletteEnd = popup.indexOf(paletteEndMarker, paletteStart) + paletteEndMarker.length;
  const context = vm.createContext({ Object, DEFAULT_UI_GRADIENT: ['#4bd9ed', '#7d91ff', '#b88aff'], gtaPalette: 'gta-02' });
  new vm.Script(popup.slice(paletteStart, paletteEnd), { filename: 'popup.js#GTA6 palettes' }).runInContext(context);
  new vm.Script(popup.slice(start, end), { filename: 'popup.js#visualizer theme palette' }).runInContext(context);
  const colors = [...context.getSelectedGtaVisualizerColors()].map((color) => [...color]);
  assert.deepEqual(colors, [[122, 179, 201], [118, 121, 181], [193, 225, 205], [153, 147, 195], [43, 63, 90]]);
});

check('visualizer and spectrogram palette getters switch between GTA VI and legacy color modes', () => {
  const popup = read('popup.js');
  const paletteStart = popup.indexOf('const GTA6_COLOR_PALETTES = Object.freeze({');
  const paletteEndMarker = "const GTA6_PALETTE_IDS = Object.freeze(['classic', ...Object.keys(GTA6_COLOR_PALETTES)]);";
  const paletteEnd = popup.indexOf(paletteEndMarker, paletteStart) + paletteEndMarker.length;
  const mapStart = popup.indexOf('const SPECTROGRAM_PALETTE_MAP = {');
  const mapEnd = popup.indexOf('let spectrogramColorLut', mapStart);
  const helperStart = popup.indexOf('function rgbString(');
  const helperEnd = popup.indexOf('// EN: Creates a canvas gradient', helperStart);
  assert.ok(paletteStart >= 0 && paletteEnd > paletteStart && mapStart >= 0 && mapEnd > mapStart && helperStart >= 0 && helperEnd > helperStart);
  const context = vm.createContext({ Object, DEFAULT_UI_GRADIENT: ['#4bd9ed', '#7d91ff', '#b88aff'], gtaPalette: 'gta-20', visualizerPaletteMode: 'gta', spectrogramPaletteMode: 'gta' });
  new vm.Script(popup.slice(paletteStart, paletteEnd)).runInContext(context);
  new vm.Script(popup.slice(mapStart, mapEnd)).runInContext(context);
  new vm.Script(popup.slice(helperStart, helperEnd)).runInContext(context);
  assert.deepEqual([...context.getVisualizerPalette()].map((color) => [...color]), [[47, 127, 208], [124, 192, 236], [214, 239, 244], [95, 216, 204], [16, 167, 160]]);
  assert.deepEqual([...context.getSpectrogramPalette()[0]], [7, 11, 27]);
  assert.deepEqual([...context.getSpectrogramPalette().at(-1)], [16, 167, 160]);
  context.visualizerPaletteMode = 'fire';
  context.spectrogramPaletteMode = 'ocean';
  assert.deepEqual([...context.getVisualizerPalette()[0]], [8, 5, 16]);
  assert.deepEqual([...context.getSpectrogramPalette()[0]], [4, 10, 27]);
});

check('spectrogram uses the active GTA palette with a dark zero-energy floor', () => {
  const popup = read('popup.js');
  assert.match(popup, /if \(spectrogramPaletteMode === 'gta'\) \{\s*\/\/ Keep a dark zero-energy floor, then blend through the exact active GTA VI palette\.\s*return \[\[7, 11, 27\], \.\.\.getSelectedGtaVisualizerColors\(\)\];/);
  assert.match(popup, /const palette = getSpectrogramPalette\(\);/);
  assert.match(popup, /const background = getSpectrogramPalette\(\)\[0\];/);
});

check('spectrogram current-time marker and frequency glow use the selected GTA theme colors', () => {
  const popup = read('popup.js');
  assert.match(popup, /const activeColors = getSpectrogramPalette\(\);/);
  assert.match(popup, /context\.shadowColor = rgbString\(middleColor, 0\.9\)/);
  assert.match(popup, /const glowColor = rgbString\(getVisualizerPalette\(\)\[/);
});

check('changing the main GTA palette redraws both visualizations without a redundant theme badge', () => {
  const popup = read('popup.js');
  assert.match(popup, /function updateGtaVisualizerPalette\(\)/);
  assert.doesNotMatch(popup, /updateSpectrogramPaletteBadge|spectrogramPaletteBadge/);
  assert.doesNotMatch(read('popup.html'), /spectrogram-badge|spectrogramPaletteBadge/);
  assert.match(popup, /if \(spectrogramPaletteMode === 'gta'\) \{\s*rebuildSpectrogramColorLut\(\);\s*renderSpectrogram\(\);/);
  assert.match(popup, /if \(visualizerPaletteMode === 'gta' && showFrequencyVisualizer\) \{\s*drawSpectrum\(0, true\);/);
  assert.match(popup, /if \(typeof updateGtaVisualizerPalette === 'function'\) updateGtaVisualizerPalette\(\)/);
});

check('GTA VI visualizer panels, canvas stages and status indicators are themed by palette CSS variables', () => {
  const css = read('popup.css');
  const popup = read('popup.js');
  assert.match(popup, /--vcp-visualizer-start/);
  assert.match(popup, /--vcp-visualizer-mid/);
  assert.match(popup, /--vcp-visualizer-end/);
  assert.match(css, /body\[data-accent-palette\^="gta-"\] \.visualizer-panel/);
  assert.match(css, /body\[data-accent-palette\^="gta-"\] \.spectrogram-panel/);
  assert.doesNotMatch(css, /spectrogram-badge/);
  assert.match(css, /body\[data-theme="light"\]\[data-accent-palette\^="gta-"\]/);
});

check('old default neon visualizer palettes migrate once to the active GTA theme, while custom palettes remain selected', () => {
  const popup = read('popup.js');
  assert.match(popup, /const VISUALIZER_GTA_THEME_VERSION = 1;/);
  assert.match(popup, /const needsVisualizerGtaThemeMigration = savedPreferences\.visualizerGtaThemeVersion !== VISUALIZER_GTA_THEME_VERSION;/);
  assert.match(popup, /needsVisualizerGtaThemeMigration && storedVisualizerPalette === 'neon' \? 'gta' : storedVisualizerPalette/);
  assert.match(popup, /needsVisualizerGtaThemeMigration && storedSpectrogramPalette === 'neon' \? 'gta' : storedSpectrogramPalette/);
  assert.match(popup, /visualizerGtaThemeVersion: VISUALIZER_GTA_THEME_VERSION/);
});

check('GTA VI visualizer theme labels are localized in all supported languages', () => {
  const expected = { ru: 'Тема GTA VI', en: 'GTA VI theme', uk: 'Тема GTA VI' };
  for (const [lang, label] of Object.entries(expected)) {
    const dictionary = JSON.parse(read(`lang/${lang}.json`));
    assert.equal(dictionary.paletteGtaTheme, label);
  }
});

check('spectrogram header shows only its title and duration subtitle, not the selected theme name', () => {
  const html = read('popup.html');
  assert.match(html, /class="spectrogram-title" data-i18n="spectrogramTitle"/);
  assert.match(html, /class="spectrogram-subtitle" data-i18n="spectrogramSubtitle"/);
  assert.doesNotMatch(html, /spectrogramPaletteBadge|spectrogram-badge/);
  assert.doesNotMatch(read('popup.js'), /updateSpectrogramPaletteBadge|spectrogramPaletteBadge/);
  assert.doesNotMatch(read('popup.css'), /spectrogram-badge/);
});



check('manifest icon paths resolve to GTA VI-styled icon assets', () => {
  for (const [size, relative] of Object.entries(manifest.action.default_icon)) {
    assert.equal(relative, `icons/icon${size}.png`);
    assert.ok(fs.existsSync(path.join(ROOT, relative)), `${relative} must exist`);
  }
  for (const [size, relative] of Object.entries(manifest.icons)) {
    assert.ok(fs.existsSync(path.join(ROOT, relative)), `${relative} must exist`);
  }
  assert.ok(fs.existsSync(path.join(ROOT, 'icons/favicon.ico')));
  assert.ok(fs.existsSync(path.join(ROOT, 'icons/favicon.png')));
});

check('all PNG app icon assets have the expected square dimensions', () => {
  const expected = { 'icon16.png': 16, 'icon48.png': 48, 'icon128.png': 128, 'favicon.png': 512 };
  for (const [name, size] of Object.entries(expected)) {
    const buffer = fs.readFileSync(path.join(ROOT, 'icons', name));
    assert.equal(buffer.toString('hex', 0, 8), '89504e470d0a1a0a', `${name} PNG signature`);
    assert.equal(buffer.readUInt32BE(16), size, `${name} width`);
    assert.equal(buffer.readUInt32BE(20), size, `${name} height`);
  }
});

check('popup header uses the new VI-inspired brand icon instead of the old speaker SVG', () => {
  const html = read('popup.html');
  assert.match(html, /<img class="brand-mark" src="icons\/favicon\.png"/);
  assert.doesNotMatch(html, /<div class="logo">\s*<svg viewBox="0 0 24 24" width="24" height="24"/);
});

check('inline UI icons use the specified VI gradient and outline colors', () => {
  const html = read('popup.html');
  const css = read('popup.css');
  for (const color of ['#1c6be0', '#8851cc', '#ef4ba7', '#e48448', '#fdb927', '#ee339c', '#821378']) {
    assert.ok(html.toLowerCase().includes(color), `missing icon gradient color ${color}`);
  }
  assert.match(css, /svg \[stroke="currentColor"\]\s*\{\s*stroke:\s*url\(#vcpGtaIconGradient\)/);
  assert.match(css, /svg \[fill="currentColor"\]\s*\{\s*fill:\s*url\(#vcpGtaIconGradient\)/);
  assert.match(css, /body\[data-accent-palette\^="gta-"\] \.brand-mark/);
});


check('settings categories start collapsed and use accessible accordion semantics', () => {
  const html = read('popup.html');
  const categories = ['appearance', 'audio', 'services', 'home', 'visualizers', 'performance', 'protection', 'profiles'];
  assert.match(html, /class="settings-category-menu"[^>]*aria-label=/);
  assert.doesNotMatch(html, /class="settings-category-menu"[^>]*role="tablist"/);
  for (const category of categories) {
    const tabMatch = html.match(new RegExp(`<button[^>]*data-settings-category="${category}"[^>]*>`));
    assert.ok(tabMatch, `missing category button ${category}`);
    assert.match(tabMatch[0], /aria-expanded="false"/);
    assert.match(tabMatch[0], /aria-controls=/);
    assert.doesNotMatch(tabMatch[0], /role="tab"|aria-selected=/);
    const panelMatch = html.match(new RegExp(`<section[^>]*data-settings-category-panel="${category}"[^>]*>`));
    assert.ok(panelMatch, `missing category panel ${category}`);
    assert.match(panelMatch[0], /role="region"/);
    assert.match(panelMatch[0], /aria-labelledby=/);
    assert.match(panelMatch[0], /hidden/);
  }
  assert.match(html, /data-i18n="settingsCategoryAppearance"/);
});

check('existing settings controls remain present exactly once after category grouping', () => {
  const html = read('popup.html');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'HTML IDs must remain unique');
  const requiredIds = [
    'languageSelect', 'themeSelect', 'gtaPaletteGallery', 'gtaPalettePreview', 'rgbGlowToggle',
    'settingsBassBoostToggle', 'settingsVoiceBoostToggle', 'settingsBassModeStatusToggle', 'settingsVoiceModeStatusToggle', 'autoGenreEnabledToggle',
    'youtubeProfileEnabledToggle', 'spotifyProfileEnabledToggle', 'showAllMessagesToggle',
    'showFrequencyVisualizerToggle', 'showSpectrogramToggle', 'energySavingToggle',
    'peakLimiterToggle', 'nightModeToggle', 'exportSettingsBtn', 'importSettingsBtn', 'factoryResetBtn'
  ];
  for (const id of requiredIds) assert.equal(ids.filter((value) => value === id).length, 1, `${id} must exist once`);
  assert.match(html, /id="settingsCategoryAppearance"[^>]*aria-labelledby="settingsTabAppearance"/);
});

check('settings accordion opens on first click, closes on second click, and switches only on click', () => {
  const js = read('popup.js');
  assert.match(js, /let expandedSettingsCategory = null/);
  assert.match(js, /function setSettingsCategory\(category\)/);
  assert.doesNotMatch(js, /addEventListener\(['"](?:pointerenter|mouseenter|focus)['"]/);
  assert.match(js, /tab\.addEventListener\('click', \(\) => setSettingsCategory\(tab\.dataset\.settingsCategory\)\)/);
  assert.match(js, /ArrowRight.*ArrowDown.*ArrowLeft.*ArrowUp.*Home.*End/);
  assert.match(js, /settingsCategoryTabs\[nextIndex\]\.focus\(\)/);
  assert.doesNotMatch(js, /setSettingsCategory\(settingsCategoryTabs\[nextIndex\]\.dataset/);
  assert.match(js, /tab\.setAttribute\('aria-expanded', String\(isExpanded\)\)/);
  assert.match(js, /panel\.hidden = !isExpanded/);
  assert.doesNotMatch(js, /setSettingsCategory\('appearance'\)/);

  const start = js.indexOf('let expandedSettingsCategory = null;');
  const end = js.indexOf('// EN: Persists a theme choice', start);
  assert.ok(start >= 0 && end > start, 'accordion behavior block must be extractable');
  const makeTab = (category) => ({
    dataset: { settingsCategory: category }, classList: { toggle() {} }, attributes: {}, listeners: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, handler) { this.listeners[name] = handler; },
    focus() { this.focused = true; }
  });
  const makePanel = (category) => ({
    dataset: { settingsCategoryPanel: category }, classList: { toggle() {} }, hidden: true
  });
  const tabs = ['appearance', 'audio', 'services'].map(makeTab);
  const panels = ['appearance', 'audio', 'services'].map(makePanel);
  const context = vm.createContext({
    settingsCategoryTabs: tabs, settingsCategoryPanels: panels, settingsPanel: { dataset: {} }
  });
  new vm.Script(js.slice(start, end)).runInContext(context);

  for (const tab of tabs) assert.equal(typeof tab.listeners.click, 'function');
  tabs[1].listeners.click();
  assert.equal(tabs[1].attributes['aria-expanded'], 'true', 'first click opens audio');
  assert.equal(panels[1].hidden, false);
  assert.equal(panels[0].hidden, true);
  assert.equal(context.settingsPanel.dataset.activeCategory, 'audio');

  tabs[1].listeners.click();
  assert.equal(tabs[1].attributes['aria-expanded'], 'false', 'second click closes same category');
  assert.ok(panels.every((panel) => panel.hidden), 'all panels should be hidden after second click');
  assert.equal(context.settingsPanel.dataset.activeCategory, '');

  tabs[0].listeners.click();
  tabs[2].listeners.click();
  assert.equal(tabs[0].attributes['aria-expanded'], 'false');
  assert.equal(tabs[2].attributes['aria-expanded'], 'true');
  assert.equal(panels[2].hidden, false, 'clicking another category opens only that category');
  assert.equal(panels[0].hidden, true);

  tabs[2].listeners.keydown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(tabs[0].focused, true, 'arrow key moves focus to the next category');
  assert.equal(tabs[2].attributes['aria-expanded'], 'true', 'arrow key does not switch expanded category');
  assert.equal(panels[2].hidden, false);
});

check('main popup content follows the requested top-to-bottom four-stage order', () => {
  const html = read('popup.html');
  const mainStart = html.indexOf('<main id="mainContent"');
  const mainEnd = html.indexOf('</main>', mainStart);
  assert.ok(mainStart >= 0 && mainEnd > mainStart, 'main content landmark must wrap the page');
  const main = html.slice(mainStart, mainEnd);
  const orderedMarkers = [
    'id="captureStatusIndicator"',
    'id="autoGenreStatusCard"',
    'id="quickSettingsPanel"',
    'class="main-volume-section"',
    'id="volumeValue"',
    'id="volumeSlider"',
    'data-value="600"',
    'id="audioProtectionIndicator"',
    'class="visualizer-panel"',
    'class="spectrogram-panel"',
    'class="bass-panel"',
    'class="voice-panel"',
    'id="status"',
    'id="doneButton"',
    'class="footer"'
  ];
  let previous = -1;
  for (const marker of orderedMarkers) {
    const index = main.indexOf(marker);
    assert.ok(index > previous, `main layout order is incorrect at ${marker}`);
    previous = index;
  }
  assert.match(html, /id="settingsPanel"[^>]*hidden/);
  assert.ok(html.indexOf('id="settingsPanel"') < html.indexOf('<main id="mainContent"'), 'settings panel must sit below the header, before main content');
});

check('Done is a localized bottom button that closes the popup without changing audio state', () => {
  const html = read('popup.html');
  const js = read('popup.js');
  assert.match(html, /<button id="doneButton" class="done-button" type="button"[^>]*data-i18n="doneButton"/);
  assert.match(js, /const doneButton = document\.getElementById\('doneButton'\)/);
  assert.match(js, /doneButton\?\.addEventListener\('click', \(\) => window\.close\(\)\)/);
  for (const [lang, label] of Object.entries({ ru: 'Готово', en: 'Done', uk: 'Готово' })) {
    const dictionary = JSON.parse(read(`lang/${lang}.json`));
    assert.equal(dictionary.doneButton, label);
    assert.ok(dictionary.doneButtonTitle);
  }
  assert.match(html, /id="status"[^>]*hidden/);
  assert.match(js, /statusMessageElement\.hidden = !statusMessageElement\.textContent/);
  assert.match(js, /statusMessageElement\.hidden = true;\s*statusTimer = null;/);
});




check('Bass Boost and Voice Boost always show the selected mode and effective dB value', () => {
  const popup = read('popup.js');
  const start = popup.indexOf('function formatBoostValueText(');
  const end = popup.indexOf('\n}\n', start) + 2;
  assert.ok(start >= 0 && end > start, 'shared dB formatter must exist');
  const context = vm.createContext({ t: (key) => ({ bassAutoBadge: 'Auto', manualOverrideBadge: 'Ручной' }[key] || key) });
  new vm.Script(popup.slice(start, end), { filename: 'popup.js#formatBoostValueText' }).runInContext(context);
  assert.equal(context.formatBoostValueText(true, { db: 0 }, 2, false), 'Auto · 0 dB');
  assert.equal(context.formatBoostValueText(true, { db: 3 }, 2, false), 'Auto · +3 dB');
  assert.equal(context.formatBoostValueText(true, null, 2, false), 'Auto · 0 dB');
  assert.equal(context.formatBoostValueText(false, { db: 0 }, 2, false), 'Auto · 0 dB');
  assert.equal(context.formatBoostValueText(true, null, 2, true), 'Ручной · +2 dB');
  assert.equal(context.formatBoostValueText(false, null, 2, true), 'Ручной · 0 dB');
  assert.match(popup, /bassBoostValue\.textContent = formatBoostValueText\(displayedBassEnabled, autoProfile, bassBoostDb, manualOverride\)/);
  assert.match(popup, /voiceBoostValue\.textContent = formatBoostValueText\(displayedVoiceEnabled, autoProfile, voiceBoostDb, manualOverride\)/);
});


check('Voice Boost mode-value label visibility follows its independent settings preference', () => {
  const popup = read('popup.js');
  const start = popup.indexOf('function updateVoiceUI()');
  const end = popup.indexOf('\n}\n', start) + 2;
  assert.ok(start >= 0 && end > start);
  const source = popup.slice(start, end);
  assert.match(source, /const manualOverride = autoGenreVoiceManualOverride/);
  assert.match(source, /voiceBoostValue\.textContent = formatBoostValueText\(displayedVoiceEnabled, autoProfile, voiceBoostDb, manualOverride\)/);
  assert.match(source, /voiceBoostValue\.hidden = !showVoiceBoostModeStatus/);
  assert.match(source, /voiceBoostAutoBadge\.hidden = !canSwitchGenreMode/);
});

check('Voice Boost power toggle is available in Audio settings and persists to audio settings', () => {
  const html = read('popup.html');
  const popup = read('popup.js');
  const settingsStart = html.indexOf('id="settingsCategoryAudio"');
  const settingsEnd = html.indexOf('</section></section>', settingsStart);
  const audioSettings = html.slice(settingsStart, settingsEnd);
  assert.ok(settingsStart >= 0 && settingsEnd > settingsStart);
  assert.match(audioSettings, /id="settingsVoiceBoostToggle"/);
  assert.match(audioSettings, /data-i18n="voiceEffectEnabledLabel"/);
  assert.match(audioSettings, /data-i18n="voiceEffectEnabledDescription"/);
  assert.match(popup, /settingsVoiceBoostToggle\.addEventListener\('change',\s*\(event\)\s*=>\s*\{\s*setVoiceBoostEnabledFromControl\(event\.target\.checked\)/);
  assert.match(popup, /function setVoiceBoostEnabledFromControl\(enabled\)[\s\S]*?voiceBoostEnabled = enabled === true;[\s\S]*?sendVolume\(Number\.parseInt\(slider\.value, 10\)\)/);
  assert.match(popup, /voiceBoostEnabled,\s*voiceBoostDb/);
  assert.match(popup, /settingsVoiceBoostToggle\.checked = displayedVoiceEnabled/);
});

check('Voice Boost AUTO value updates for a zero-dB automatic genre profile', () => {
  const popup = read('popup.js');
  const voiceStart = popup.indexOf('function updateVoiceUI()');
  const voiceEnd = popup.indexOf('\n}\n', voiceStart) + 2;
  assert.ok(voiceStart >= 0 && voiceEnd > voiceStart);
  const voiceFunction = popup.slice(voiceStart, voiceEnd);
  assert.match(voiceFunction, /const autoProfile = getAppliedAutoVoiceProfile\(\)/);
  assert.match(voiceFunction, /formatBoostValueText\(displayedVoiceEnabled, autoProfile, voiceBoostDb, manualOverride\)/);
  assert.match(voiceFunction, /settingsVoiceBoostToggle\.checked = displayedVoiceEnabled/);
  assert.match(voiceFunction, /voiceBoostSlider\.disabled = !audioControlsReady \|\| !displayedVoiceEnabled/);
});


check('settings include independent visibility controls for Bass Boost and Voice Boost mode labels', () => {
  const html = read('popup.html');
  const js = read('popup.js');
  const audioStart = html.indexOf('id="settingsCategoryAudio"');
  const audioEnd = html.indexOf('</section></section>', audioStart);
  const audio = html.slice(audioStart, audioEnd);
  assert.ok(audioStart >= 0 && audioEnd > audioStart);
  for (const [id, labelKey, descriptionKey] of [
    ['settingsBassModeStatusToggle', 'bassAutoModeSettingLabel', 'bassAutoModeSettingDescription'],
    ['settingsVoiceModeStatusToggle', 'voiceAutoModeSettingLabel', 'voiceAutoModeSettingDescription']
  ]) {
    assert.match(audio, new RegExp(`id="${id}"`));
    assert.match(audio, new RegExp(`data-i18n="${labelKey}"`));
    assert.match(audio, new RegExp(`data-i18n="${descriptionKey}"`));
  }
  assert.match(js, /const settingsBassModeStatusToggle = document\.getElementById\('settingsBassModeStatusToggle'\)/);
  assert.match(js, /const settingsVoiceModeStatusToggle = document\.getElementById\('settingsVoiceModeStatusToggle'\)/);
  assert.match(js, /settingsBassModeStatusToggle\.addEventListener\('change',\s*\(event\)\s*=>\s*\{\s*void setBoostModeStatusVisibility\('bass', event\.target\.checked\)/);
  assert.match(js, /settingsVoiceModeStatusToggle\.addEventListener\('change',\s*\(event\)\s*=>\s*\{\s*void setBoostModeStatusVisibility\('voice', event\.target\.checked\)/);
});

check('settings switches hide only the per-card AUTO/MANUAL dB readouts without changing audio modes', () => {
  const js = read('popup.js');
  assert.match(js, /async function setBoostModeStatusVisibility\(kind, enabled\)[\s\S]*?writeLocalSettings\(\{ \[key\]: next \}\)/);
  assert.match(js, /settingsBassModeStatusToggle\.checked = showBassBoostModeStatus/);
  assert.match(js, /settingsVoiceModeStatusToggle\.checked = showVoiceBoostModeStatus/);
  assert.match(js, /bassBoostValue\.hidden = !showBassBoostModeStatus/);
  assert.match(js, /voiceBoostValue\.hidden = !showVoiceBoostModeStatus/);
  assert.match(js, /setBoostModeStatusVisibility\('bass', event\.target\.checked\)/);
  assert.match(js, /setBoostModeStatusVisibility\('voice', event\.target\.checked\)/);
  const bassHandler = js.slice(js.indexOf("settingsBassModeStatusToggle.addEventListener('change'"), js.indexOf("settingsBassModeStatusToggle.addEventListener('change'") + 220);
  const voiceHandler = js.slice(js.indexOf("settingsVoiceModeStatusToggle.addEventListener('change'"), js.indexOf("settingsVoiceModeStatusToggle.addEventListener('change'") + 220);
  assert.doesNotMatch(bassHandler, /setGenreParameterAutoMode|setGenreParameterOverride|EQ_MODE_SETTINGS/);
  assert.doesNotMatch(voiceHandler, /setGenreParameterAutoMode|setGenreParameterOverride|EQ_MODE_SETTINGS/);
});

check('turning global genre detection off/on does not force Bass/Voice AUTO back on', () => {
  const popup = read('popup.js');
  const popupStart = popup.indexOf('async function setAutoGenreEnabled(enabled)');
  const popupEnd = popup.indexOf('\n}\n', popupStart) + 3;
  assert.ok(popupStart >= 0 && popupEnd > popupStart);
  const popupFunction = popup.slice(popupStart, popupEnd);
  assert.doesNotMatch(popupFunction, /autoGenreBassManualOverride\s*=\s*false|autoGenreVoiceManualOverride\s*=\s*false/);
  assert.match(popupFunction, /autoGenreBassManualOverride,\s*autoGenreVoiceManualOverride/);

  const offscreen = read('offscreen.js');
  const offscreenStart = offscreen.indexOf('function setAutoGenreEnabled(enabled)');
  const offscreenEnd = offscreen.indexOf('\n}\n', offscreenStart) + 3;
  assert.ok(offscreenStart >= 0 && offscreenEnd > offscreenStart);
  const offscreenFunction = offscreen.slice(offscreenStart, offscreenEnd);
  assert.doesNotMatch(offscreenFunction, /autoGenreBassManualOverride\s*=\s*false|autoGenreVoiceManualOverride\s*=\s*false/);
});

check('AUTO/MANUAL status visibility controls are localized in Russian, English, and Ukrainian', () => {
  for (const lang of ['ru', 'en', 'uk']) {
    const dictionary = JSON.parse(read(`lang/${lang}.json`));
    for (const key of ['bassAutoModeSettingLabel', 'bassAutoModeSettingDescription', 'voiceAutoModeSettingLabel', 'voiceAutoModeSettingDescription']) {
      assert.ok(typeof dictionary[key] === 'string' && dictionary[key].length > 8, `${lang}.${key} missing`);
    }
  }
});

check('Audio settings contain exactly two independent mode-label visibility switches and no obsolete label toggle', () => {
  const html = read('popup.html');
  const js = read('popup.js');
  const audioStart = html.indexOf('id=\"settingsCategoryAudio\"');
  const audioEnd = html.indexOf('</section></section>', audioStart);
  const audio = html.slice(audioStart, audioEnd);
  assert.ok(audioStart >= 0 && audioEnd > audioStart);
  assert.equal((audio.match(/id=\"settingsBassModeStatusToggle\"/g) || []).length, 1);
  assert.equal((audio.match(/id=\"settingsVoiceModeStatusToggle\"/g) || []).length, 1);
  assert.doesNotMatch(audio, /showBoostModeValueLabelsToggle|showBoostModeValueLabelsLabel/);
  assert.match(audio, /Показывать строку режима Bass Boost/);
  assert.match(audio, /Показывать строку режима Voice Boost/);
  assert.doesNotMatch(js, /showBoostModeValueLabelsToggle|setBoostModeValueLabelsVisible/);
  assert.match(audio, /data-i18n=\"bassAutoModeSettingLabel\"/);
  assert.match(audio, /data-i18n=\"voiceAutoModeSettingLabel\"/);
  assert.match(js, /settingsBassModeStatusToggle\.addEventListener\('change'/);
  assert.match(js, /settingsVoiceModeStatusToggle\.addEventListener\('change'/);
});

check('Bass and Voice mode-value readouts can be hidden independently while legacy setting remains compatible', () => {
  const js = read('popup.js');
  assert.match(js, /function updateBoostModeValueLabelsUI\(\)[\s\S]*?bassBoostValue\.hidden = !showBassBoostModeStatus;[\s\S]*?voiceBoostValue\.hidden = !showVoiceBoostModeStatus/);
  assert.match(js, /bassBoostValue\.hidden = !showBassBoostModeStatus/);
  assert.match(js, /voiceBoostValue\.hidden = !showVoiceBoostModeStatus/);
  assert.match(js, /showBoostModeValueLabels = true;/);
  assert.match(js, /savedPreferences\.showBoostModeValueLabels !== true\) newDefaultPreferences\.showBoostModeValueLabels = true/);
});

check('legacy label visibility field remains backup-compatible but imports as always visible', () => {
  const js = read('popup.js');
  assert.match(js, /const SETTINGS_CONFIG_SCHEMA_VERSION = 28/);
  assert.match(js, /const importedShowBoostModeValueLabels = true/);
  assert.match(js, /showBoostModeValueLabels,\s*(?:showScrollbar,\s*)?(?:gtaPaletteGalleryExpanded,\s*)?(?:quickSettingsExpanded,\s*)?showBassBoostModeStatus,\s*showVoiceBoostModeStatus,\s*nightModeEnabled/);
  assert.match(js, /showBoostModeValueLabels: imported\.showBoostModeValueLabels/);
  assert.match(js, /showBassBoostModeStatus: imported\.showBassBoostModeStatus/);
  assert.match(js, /showVoiceBoostModeStatus: imported\.showVoiceBoostModeStatus/);
  assert.match(js, /showBoostModeValueLabels = imported\.showBoostModeValueLabels/);
  assert.match(js, /config\.schemaVersion >= 23 && !hasOwnSettingsKeys\(value, boostModeStatusVisibilityKeys\)/);
});

check('Bass and Voice AUTO/MANUAL labels and setting names are localized in Russian, English, and Ukrainian', () => {
  const popup = read('popup.js');
  assert.equal((popup.match(/textContent = manualOverride \? t\('manualOverrideBadge'\) : t\('bassAutoBadge'\)/g) || []).length, 2, 'both mode buttons use localized labels');
  const expected = {
    ru: { bassAutoBadge: 'Авто', manualOverrideBadge: 'Ручной', autoZeroDbLabel: 'Авто · 0 dB', bassAutoModeSettingLabel: 'Показывать строку режима Bass Boost', voiceAutoModeSettingLabel: 'Показывать строку режима Voice Boost' },
    en: { bassAutoBadge: 'Auto', manualOverrideBadge: 'Manual', autoZeroDbLabel: 'Auto · 0 dB', bassAutoModeSettingLabel: 'Show Bass Boost mode label', voiceAutoModeSettingLabel: 'Show Voice Boost mode label' },
    uk: { bassAutoBadge: 'Авто', manualOverrideBadge: 'Ручний', autoZeroDbLabel: 'Авто · 0 dB', bassAutoModeSettingLabel: 'Показувати рядок режиму Bass Boost', voiceAutoModeSettingLabel: 'Показувати рядок режиму Voice Boost' }
  };
  const start = popup.indexOf('function formatBoostValueText(');
  const end = popup.indexOf('\n}\n', start) + 2;
  const formatterSource = popup.slice(start, end);
  for (const [lang, values] of Object.entries(expected)) {
    const dict = JSON.parse(read(`lang/${lang}.json`));
    for (const [key, value] of Object.entries(values)) assert.equal(dict[key], value, `${lang}.${key}`);
    assert.ok(dict.manualOverrideTitle, `${lang}.manualOverrideTitle`);
    assert.ok(dict.manualModeSwitchTitle, `${lang}.manualModeSwitchTitle`);
    assert.equal(dict.showBoostModeValueLabelsLabel, undefined, `${lang}: obsolete label preference must be removed`);
    const context = vm.createContext({ t: (key) => dict[key] || key });
    new vm.Script(formatterSource).runInContext(context);
    assert.equal(context.formatBoostValueText(true, null, 2, false), `${dict.bassAutoBadge} · 0 dB`, `${lang} AUTO text`);
    assert.equal(context.formatBoostValueText(true, null, 2, true), `${dict.manualOverrideBadge} · +2 dB`, `${lang} MANUAL text`);
  }
});

check('popup is slightly wider and top action buttons are shifted slightly right', () => {
  const css = read('popup.css');
  assert.equal((css.match(/width: 460px;/g) || []).length, 2, 'both body width declarations use 460px');
  assert.doesNotMatch(css, /width: 360px;/);
  assert.match(css, /\.header-actions \{ gap: 5px; transform: translateX\(4px\); \}/);
});

check('per-effect AUTO mode uses a dedicated serialized background command and applies to offscreen', () => {
  const background = read('background.js');
  const popup = read('popup.js');
  assert.match(popup, /type: 'EQ_MODE_SETTINGS',[\s\S]*?kind,[\s\S]*?enabled: !next/);
  assert.match(background, /message\.type === 'EQ_MODE_SETTINGS'/);
  assert.match(background, /captureQueue\.then\(async \(\) => \{/);
  assert.match(background, /\[key\]: manualOverride/);
  assert.match(background, /applySavedAudioSettingsToOffscreen\(currentCapturedTabId, isBass/);
  assert.match(background, /bassManualOverride: manualOverride/);
  assert.match(background, /voiceManualOverride: manualOverride/);
  assert.match(background, /storagePersisted, applied/);
});

check('disabling AUTO maps to manual override true; enabling maps to false for each effect', () => {
  const source = read('popup.js');
  const start = source.indexOf('async function setGenreParameterAutoMode(kind, enabled)');
  const end = source.indexOf('\n}\n', start) + 3;
  assert.ok(start >= 0 && end > start);
  const fn = source.slice(start, end);
  assert.match(fn, /return applyGenreParameterMode\(kind, !enabled\)/);
  const context = vm.createContext({ applyGenreParameterMode: (kind, manual) => JSON.stringify({ kind, manual }) });
  new vm.Script(fn).runInContext(context);
  assert.equal(context.applyGenreParameterMode('bass', !false), JSON.stringify({ kind: 'bass', manual: true }));
  assert.equal(context.applyGenreParameterMode('voice', !false), JSON.stringify({ kind: 'voice', manual: true }));
  assert.equal(context.applyGenreParameterMode('bass', !true), JSON.stringify({ kind: 'bass', manual: false }));
  assert.equal(context.applyGenreParameterMode('voice', !true), JSON.stringify({ kind: 'voice', manual: false }));
});

check('global genre detection toggles preserve per-effect manual override preferences in popup and offscreen', () => {
  const popup = read('popup.js');
  const start = popup.indexOf('async function setAutoGenreEnabled(enabled)');
  const end = popup.indexOf('\n}\n', start) + 3;
  const popupFn = popup.slice(start, end);
  assert.doesNotMatch(popupFn, /autoGenreBassManualOverride\s*=\s*false|autoGenreVoiceManualOverride\s*=\s*false/);
  assert.match(popupFn, /autoGenreBassManualOverride,\s*autoGenreVoiceManualOverride/);

  const offscreen = read('offscreen.js');
  const offStart = offscreen.indexOf('function setAutoGenreEnabled(enabled)');
  const offEnd = offscreen.indexOf('\n}\n', offStart) + 3;
  const offFn = offscreen.slice(offStart, offEnd);
  assert.doesNotMatch(offFn, /autoGenreBassManualOverride\s*=\s*false|autoGenreVoiceManualOverride\s*=\s*false/);
});

check('offscreen applies saved manual dB when an individual AUTO mode is disabled', () => {
  const source = read('offscreen.js');
  const start = source.indexOf('function applyAudioSettings()');
  const end = source.indexOf('\n}\n', start) + 3;
  assert.ok(start >= 0 && end > start, 'applyAudioSettings must exist');
  const applySource = source.slice(start, end);
  function resolveAppliedDb(bassManual, voiceManual) {
    const values = {};
    const audioContext = { currentTime: 1 };
    const setTarget = (key) => ({ setTargetAtTime: (value) => { values[key] = value; } });
    const context = vm.createContext({
      audioContext,
      autoGenreEnabled: true,
      getSelectedAutoGenreProfile: () => ({ bassBoostDb: 7, voiceBoostDb: 5, volumeTrimDb: 0 }),
      autoGenreBassManualOverride: bassManual,
      autoGenreVoiceManualOverride: voiceManual,
      bassBoostEnabled: true,
      bassBoostDb: 4,
      voiceBoostEnabled: true,
      voiceBoostDb: 2,
      currentMuted: false,
      currentVolume: 1,
      nightModeEnabled: false,
      compressor: null,
      nightMakeupGain: null,
      eqHeadroomGain: null,
      gainNode: null,
      bassBoostFilter: { gain: setTarget('bass') },
      voiceBodyFilter: { gain: setTarget('voiceBody') },
      voicePresenceFilter: { gain: setTarget('voice') }
    });
    new vm.Script(applySource).runInContext(context);
    context.applyAudioSettings();
    return values;
  }
  const bothManual = resolveAppliedDb(true, true);
  assert.equal(bothManual.bass, 4);
  assert.equal(bothManual.voice, 2);
  const bassManualVoiceAuto = resolveAppliedDb(true, false);
  assert.equal(bassManualVoiceAuto.bass, 4);
  assert.equal(bassManualVoiceAuto.voice, 5);
  const bassAutoVoiceManual = resolveAppliedDb(false, true);
  assert.equal(bassAutoVoiceManual.bass, 7);
  assert.equal(bassAutoVoiceManual.voice, 2);
  const bothAuto = resolveAppliedDb(false, false);
  assert.equal(bothAuto.bass, 7);
  assert.equal(bothAuto.voice, 5);
});

check('new EQ mode status messages exist in all three locales', () => {
  for (const lang of ['ru', 'en', 'uk']) {
    const dict = JSON.parse(read(`lang/${lang}.json`));
    assert.ok(dict.audioSettingsApplied);
    assert.ok(dict.eqModeAppliedNotSaved);
  }
});


check('per-card status visibility preferences are stored independently and default to visible', () => {
  const js = read('popup.js');
  assert.match(js, /let showBassBoostModeStatus = true/);
  assert.match(js, /let showVoiceBoostModeStatus = true/);
  assert.match(js, /savedPreferences\.showBassBoostModeStatus !== false/);
  assert.match(js, /savedPreferences\.showVoiceBoostModeStatus !== false/);
  assert.match(js, /newDefaultPreferences\.showBassBoostModeStatus = true/);
  assert.match(js, /newDefaultPreferences\.showVoiceBoostModeStatus = true/);
  assert.match(js, /showBassBoostModeStatus,\s*showVoiceBoostModeStatus/);
});

check('backup schema v23 exports, validates, and imports both card visibility preferences', () => {
  const js = read('popup.js');
  assert.match(js, /const SETTINGS_CONFIG_SCHEMA_VERSION = 28/);
  assert.match(js, /const boostModeStatusVisibilityKeys = \['showBassBoostModeStatus', 'showVoiceBoostModeStatus'\]/);
  assert.match(js, /config\.schemaVersion >= 23 && !hasOwnSettingsKeys\(value, boostModeStatusVisibilityKeys\)/);
  assert.match(js, /typeof importedShowBassBoostModeStatus === 'boolean'/);
  assert.match(js, /typeof importedShowVoiceBoostModeStatus === 'boolean'/);
  assert.match(js, /showBassBoostModeStatus: importedShowBassBoostModeStatus/);
  assert.match(js, /showVoiceBoostModeStatus: importedShowVoiceBoostModeStatus/);
  assert.match(js, /showBassBoostModeStatus: imported\.showBassBoostModeStatus/);
  assert.match(js, /showVoiceBoostModeStatus: imported\.showVoiceBoostModeStatus/);
});

check('Bass and Voice mode-label settings accurately describe visibility in all three languages', () => {
  const expected = {
    ru: ['Показывать строку режима Bass Boost', 'Показывать строку режима Voice Boost'],
    en: ['Show Bass Boost mode label', 'Show Voice Boost mode label'],
    uk: ['Показувати рядок режиму Bass Boost', 'Показувати рядок режиму Voice Boost']
  };
  for (const [lang, labels] of Object.entries(expected)) {
    const dictionary = JSON.parse(read(`lang/${lang}.json`));
    assert.equal(dictionary.bassAutoModeSettingLabel, labels[0]);
    assert.equal(dictionary.voiceAutoModeSettingLabel, labels[1]);
    assert.match(dictionary.bassAutoModeSettingDescription, /does not change|Не меняет|Не змінює/i);
    assert.match(dictionary.voiceAutoModeSettingDescription, /does not change|Не меняет|Не змінює/i);
  }
});

check('hiding a status readout leaves the card and AUTO/MANUAL mode controls intact', () => {
  const html = read('popup.html');
  const js = read('popup.js');
  assert.match(html, /id="bassBoostValue"/);
  assert.match(html, /id="voiceBoostValue"/);
  assert.match(html, /id="bassBoostAutoBadge"/);
  assert.match(html, /id="voiceBoostAutoBadge"/);
  assert.match(js, /bassBoostValue\.hidden = !showBassBoostModeStatus/);
  assert.match(js, /voiceBoostValue\.hidden = !showVoiceBoostModeStatus/);
  assert.match(js, /bassBoostAutoBadge\.hidden = !canSwitchGenreMode/);
  assert.match(js, /voiceBoostAutoBadge\.hidden = !canSwitchGenreMode/);
});


check('status visibility helper hides only the requested dB readout and keeps the card mode button intact', async () => {
  const js = read('popup.js');
  const start = js.indexOf('function updateBoostModeValueLabelsUI()');
  const end = js.indexOf('\n}\n', start) + 2;
  const source = js.slice(start, end);
  assert.ok(start >= 0 && end > start);
  const controls = {
    bassValue: { hidden: false }, voiceValue: { hidden: false },
    bassSetting: { checked: true, disabled: false, setAttribute() {} },
    voiceSetting: { checked: true, disabled: false, setAttribute() {} }
  };
  const context = vm.createContext({
    showBoostModeValueLabels: true, showBassBoostModeStatus: false, showVoiceBoostModeStatus: true,
    settingsPreferencesReady: true,
    bassBoostValue: controls.bassValue, voiceBoostValue: controls.voiceValue,
    settingsBassModeStatusToggle: controls.bassSetting, settingsVoiceModeStatusToggle: controls.voiceSetting,
    t: (key) => key
  });
  new vm.Script(source).runInContext(context);
  context.updateBoostModeValueLabelsUI();
  assert.equal(controls.bassValue.hidden, true, 'Bass status string hidden');
  assert.equal(controls.voiceValue.hidden, false, 'Voice status string remains visible');
  assert.equal(controls.bassSetting.checked, false, 'Bass visibility checkbox mirrors preference');
  assert.equal(controls.voiceSetting.checked, true, 'Voice visibility checkbox mirrors preference');
  // Mode-switch buttons are not touched by the visibility helper, so AUTO/MANUAL functionality remains available.
});

check('visibility setting handler does not change manual overrides or send EQ mode commands', () => {
  const js = read('popup.js');
  const bassStart = js.indexOf("settingsBassModeStatusToggle.addEventListener('change'");
  const voiceStart = js.indexOf("settingsVoiceModeStatusToggle.addEventListener('change'");
  assert.ok(bassStart >= 0 && voiceStart >= 0);
  const bassHandler = js.slice(bassStart, bassStart + 220);
  const voiceHandler = js.slice(voiceStart, voiceStart + 220);
  for (const handler of [bassHandler, voiceHandler]) {
    assert.match(handler, /setBoostModeStatusVisibility/);
    assert.doesNotMatch(handler, /setGenreParameterAutoMode|setGenreParameterOverride|EQ_MODE_SETTINGS/);
  }
});


check('status visibility setter persists visibility only and rolls back cleanly on storage failure', async () => {
  const js = read('popup.js');
  const start = js.indexOf('async function setBoostModeStatusVisibility(kind, enabled)');
  const end = js.indexOf('\n}\n', start) + 2;
  assert.ok(start >= 0 && end > start, 'visibility setter must exist');
  const fn = js.slice(start, end);
  let persisted = null;
  let failWrite = false;
  const context = vm.createContext({
    showBassBoostModeStatus: true,
    showVoiceBoostModeStatus: true,
    settingsPreferencesReady: true,
    settingsBassModeStatusToggle: { checked: true, disabled: false, setAttribute() {} },
    settingsVoiceModeStatusToggle: { checked: true, disabled: false, setAttribute() {} },
    bassBoostValue: { hidden: false },
    voiceBoostValue: { hidden: false },
    // These are the audio-processing modes: setter must not mutate them.
    autoGenreBassManualOverride: false,
    autoGenreVoiceManualOverride: true,
    updateBoostModeValueLabelsUI() {},
    writeLocalSettings: async (value) => { if (failWrite) throw new Error('storage failure'); persisted = value; },
    showStatus: () => {},
    t: (key) => key
  });
  // Include the helper needed by the setter's immediate UI update.
  const uiStart = js.indexOf('function updateBoostModeValueLabelsUI()');
  const uiEnd = js.indexOf('\n}\n', uiStart) + 2;
  new vm.Script(js.slice(uiStart, uiEnd) + '\n' + fn).runInContext(context);
  context.updateBoostModeValueLabelsUI = vm.runInContext('updateBoostModeValueLabelsUI', context);
  assert.equal(await context.setBoostModeStatusVisibility('bass', false), true);
  assert.deepEqual(JSON.parse(JSON.stringify(persisted)), { showBassBoostModeStatus: false });
  assert.equal(context.showBassBoostModeStatus, false);
  assert.equal(context.autoGenreBassManualOverride, false, 'Bass AUTO/MANUAL processing mode unchanged');
  assert.equal(context.autoGenreVoiceManualOverride, true, 'Voice AUTO/MANUAL processing mode unchanged');
  failWrite = true;
  assert.equal(await context.setBoostModeStatusVisibility('voice', false), false);
  assert.equal(context.showVoiceBoostModeStatus, true, 'Voice visibility rolls back after storage error');
});


check('failed global genre toggle restores saved AUTO/MANUAL modes and resynchronizes background', async () => {
  const js = read('popup.js');
  const start = js.indexOf('async function setAutoGenreEnabled(enabled)');
  const end = js.indexOf('\n}\n\n// EN: Validates a status update', start) + 2;
  assert.ok(start >= 0 && end > start, 'setAutoGenreEnabled must exist');
  const fn = js.slice(start, end);
  const writes = [];
  const messages = [];
  let sendVolumeCalls = 0;
  let messageIndex = 0;
  const context = vm.createContext({
    autoGenreEnabled: false,
    autoGenreBassManualOverride: true,
    autoGenreVoiceManualOverride: false,
    autoGenreStatus: { bassManualOverride: true, voiceManualOverride: false },
    GENRE_PARAMETER_MODE_VERSION: 1,
    slider: { value: '125' },
    writeLocalSettings: async (value) => { writes.push({ ...value }); },
    chrome: { runtime: { sendMessage: async (message) => {
      messages.push({ ...message });
      if (messageIndex++ === 0) throw new Error('simulated background response loss');
      return { success: true };
    } } },
    sendVolume: async () => { sendVolumeCalls += 1; return true; },
    updateBassUI() {}, updateVoiceUI() {}, updateAutoGenreStatusUI() {},
    showStatus() {},
    t: (key) => key,
    console: { warn() {} }
  });
  new vm.Script(fn).runInContext(context);
  await context.setAutoGenreEnabled(true);
  assert.equal(context.autoGenreEnabled, false, 'global auto genre flag must roll back');
  assert.equal(context.autoGenreBassManualOverride, true, 'Bass manual override must be restored');
  assert.equal(context.autoGenreVoiceManualOverride, false, 'Voice manual override must be restored');
  assert.equal(messages.length, 2, 'background must receive the original operation and rollback');
  assert.equal(messages[1].type, 'AUTO_GENRE_SETTINGS');
  assert.equal(messages[1].enabled, false, 'background must be restored to the previous global state');
  assert.equal(sendVolumeCalls, 1, 'previous audio settings must be reapplied');
  assert.equal(writes.at(-1).autoGenreEnabled, false);
});

check('start capture prepares storage and page metadata before requesting a single-use stream ID', () => {
  const js = read('background.js');
  const start = js.indexOf('async function handleStartCapture(tabId)');
  const end = js.indexOf('\n}\n', start) + 2;
  assert.ok(start >= 0 && end > start, 'handleStartCapture must exist');
  const fn = js.slice(start, end);
  const storageIndex = fn.indexOf("const storedAutoGenre = await chrome.storage.local.get([");
  const metadataIndex = fn.indexOf("const pageTrack = await chrome.tabs.sendMessage(tabId, { type: 'GET_MEDIA_TRACK_METADATA' })");
  const activeTabIndex = fn.indexOf('const [captureActiveTab] = await chrome.tabs.query', metadataIndex);
  const tabRecheckIndex = fn.indexOf('const captureTab = await chrome.tabs.get(tabId)', activeTabIndex);
  const streamIdIndex = fn.indexOf('const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId })');
  const consumerIndex = fn.indexOf('const captureResult = await sendToOffscreen({', streamIdIndex);
  for (const index of [storageIndex, metadataIndex, activeTabIndex, tabRecheckIndex, streamIdIndex, consumerIndex]) {
    assert.ok(index >= 0, 'all stream setup stages must exist');
  }
  assert.ok(storageIndex < metadataIndex && metadataIndex < activeTabIndex && activeTabIndex < tabRecheckIndex &&
    tabRecheckIndex < streamIdIndex && streamIdIndex < consumerIndex,
  'stream ID must be obtained only after storage/metadata and fresh tab validation');
  const afterStreamId = fn.slice(streamIdIndex, consumerIndex);
  assert.doesNotMatch(afterStreamId.replace(/const streamId = await chrome\.tabCapture\.getMediaStreamId\([^;]+;?/, ''), /\bawait\b/,
    'no other awaited operation may delay consuming the single-use stream ID');
  assert.match(fn, /getSupportedCapturePlatform\(captureTab\.url\) !== getSupportedCapturePlatform\(captureActiveTab\.url\)/,
    'fresh tab and active tab must still point to the same supported platform');
});


check('capture metadata prefers canonical URL IDs and discards stale mismatched DOM titles', () => {
  const js = read('background.js');
  const start = js.indexOf('function resolveCaptureSourceMetadata(tab, pageTrack)');
  const end = js.indexOf('\n}\n', start) + 2;
  assert.ok(start >= 0 && end > start);
  const context = vm.createContext({
    getTrackIdFromUrl: (url) => url.includes('v=') ? `youtube:${new URL(url).searchParams.get('v')}` : ''
  });
  new vm.Script(js.slice(start, end)).runInContext(context);
  const stale = context.resolveCaptureSourceMetadata(
    { url: 'https://www.youtube.com/watch?v=NEW12345678', title: 'YouTube' },
    { trackId: 'youtube:OLD12345678', title: 'Previous song' }
  );
  assert.equal(stale.sourceTrackId, 'youtube:NEW12345678');
  assert.equal(stale.sourceTitle, 'YouTube', 'stale title must not be paired with the new canonical track ID');
  const fresh = context.resolveCaptureSourceMetadata(
    { url: 'https://open.spotify.com/album/albumid', title: 'Spotify' },
    { trackId: 'spotify:CURRENT123', title: 'Current song' }
  );
  assert.equal(fresh.sourceTrackId, 'spotify:CURRENT123', 'DOM ID is used when URL has no track ID');
  assert.equal(fresh.sourceTitle, 'Current song');
});



check('Spotify current-track identity prefers stable now-playing href and URI over localized title/artist fallback', () => {
  const js = read('content.js');
  const start = js.indexOf('function getSpotifyTrackIdFromDom()');
  const end = js.indexOf('\n  }\n', start) + 4;
  assert.ok(start >= 0 && end > start, 'Spotify stable ID helper must exist');
  const source = js.slice(start, end);
  const createContext = (link, uriNode) => vm.createContext({
    document: { querySelector: (selector) => selector.includes('href*="/track/"') ? link : uriNode }
  });
  const linkContext = createContext({ href: 'https://open.spotify.com/track/AbCd1234' }, null);
  new vm.Script(source).runInContext(linkContext);
  assert.equal(linkContext.getSpotifyTrackIdFromDom(), 'AbCd1234');
  const uriContext = createContext(null, { getAttribute: (name) => name === 'data-uri' ? 'spotify:track:Uri9876' : null });
  new vm.Script(source).runInContext(uriContext);
  assert.equal(uriContext.getSpotifyTrackIdFromDom(), 'Uri9876');
  const missingContext = createContext(null, null);
  new vm.Script(source).runInContext(missingContext);
  assert.equal(missingContext.getSpotifyTrackIdFromDom(), '');
  assert.match(source, /nowplaying-track-link/);
  assert.match(js, /const id = getSpotifyTrackIdFromDom\(\) \|\| \(pageMatch && pageMatch\[1\]\) \|\| ''/);
});

check('capture-tab change error is localized in Russian, English, and Ukrainian', () => {
  const js = read('popup.js');
  assert.match(js, /'The active tab changed or is no longer supported before audio capture started\.': 'captureTabChanged'/);
  const expected = {
    en: 'The active tab changed before audio capture started. Return to a supported YouTube or Spotify tab and try again.',
    ru: 'Активная вкладка изменилась до начала захвата. Вернитесь на поддерживаемую вкладку YouTube или Spotify и повторите попытку.',
    uk: 'Активна вкладка змінилася до початку захоплення. Поверніться на підтримувану вкладку YouTube або Spotify та повторіть спробу.'
  };
  for (const [lang, message] of Object.entries(expected)) {
    assert.equal(JSON.parse(read(`lang/${lang}.json`)).captureTabChanged, message);
  }
});

check('smoke runner awaits asynchronous checks before printing the final passed count', () => {
  const test = read('tests/smoke.js');
  assert.match(test, /let checkQueue = Promise\.resolve\(\)/);
  assert.match(test, /await fn\(\)/);
  assert.match(test, /checkQueue\.then\(\(\) => \{/);
  assert.match(test, /\.catch\(\(error\) => \{/);
});

check('limiter-off notice stays quiet unless opted in or a real gain/clipping risk exists', () => {
  const popup = read('popup.js');
  const match = popup.match(/function shouldHideProtectionIndicator\([\s\S]*?\n}\n/);
  assert.ok(match, 'shouldHideProtectionIndicator must exist');
  const context = vm.createContext({});
  new vm.Script(match[0]).runInContext(context);
  const decide = context.shouldHideProtectionIndicator;
  assert.equal(decide({ showAll: true, showWarnings: true, limiterEnabled: false, showLimiterOff: false, highGain: false, clipping: false }), true);
  assert.equal(decide({ showAll: true, showWarnings: true, limiterEnabled: false, showLimiterOff: true, highGain: false, clipping: false }), false);
  assert.equal(decide({ showAll: true, showWarnings: true, limiterEnabled: false, showLimiterOff: false, highGain: true, clipping: false }), false);
  assert.equal(decide({ showAll: true, showWarnings: true, limiterEnabled: false, showLimiterOff: false, highGain: false, clipping: true }), false);
  assert.equal(decide({ showAll: false, showWarnings: true, limiterEnabled: false, showLimiterOff: true, highGain: true, clipping: true }), true);
});

check('high-gain warning thresholds distinguish ordinary 200% plus Bass +6 dB from genuinely elevated gain', () => {
  const popup = read('popup.js');
  const match = popup.match(/function hasExcessiveGainRisk\(\)\s*\{[\s\S]*?\n}\n/);
  assert.ok(match, 'hasExcessiveGainRisk must exist');
  const context = vm.createContext({
    slider: { value: '200' }, isMuted: false,
    bassBoostEnabled: true, bassBoostDb: 6,
    voiceBoostEnabled: true, voiceBoostDb: 2,
    autoGenreEnabled: false, autoGenreStatus: null,
    getAppliedAutoBassProfile: () => null,
    getAppliedAutoVoiceProfile: () => null
  });
  new vm.Script(match[0]).runInContext(context);
  const risk = context.hasExcessiveGainRisk;
  assert.equal(risk(), false, '200% with Bass +6 dB does not show a high-gain alert by itself');
  context.slider.value = '300';
  context.bassBoostDb = 3;
  assert.equal(risk(), true, '300% with Bass +3 dB crosses the configured risk threshold');
  context.slider.value = '400';
  context.bassBoostEnabled = false;
  context.voiceBoostDb = 5;
  assert.equal(risk(), true, '400% with Voice +5 dB crosses the configured risk threshold');
  context.slider.value = '500';
  context.voiceBoostDb = 0;
  assert.equal(risk(), true, '500% is treated as high gain even without EQ boost');
  context.slider.value = '499';
  context.voiceBoostEnabled = false;
  assert.equal(risk(), false, '499% without active EQ boost stays below the 500% ceiling threshold');
  context.isMuted = true;
  assert.equal(risk(), false, 'muted output cannot produce an audible high-gain warning');
});

check('hide inactive effect cards respects the user preference and individual power switches', () => {
  const popup = read('popup.js');
  const match = popup.match(/function isAudioEffectPanelVisible\([\s\S]*?\n}\n/);
  assert.ok(match, 'isAudioEffectPanelVisible must exist');
  const context = vm.createContext({});
  new vm.Script(match[0]).runInContext(context);
  const visible = context.isAudioEffectPanelVisible;
  assert.equal(visible(true, true, true), true);
  assert.equal(visible(true, false, true), false);
  assert.equal(visible(true, false, false), true);
  assert.equal(visible(false, true, false), false);
  assert.match(popup, /hideInactiveEffectsToggle\.addEventListener\('change'/);
  assert.match(popup, /hideInactiveEffects: imported\.hideInactiveEffects/);
});

check('limiter-off and hide-inactive preferences are included in backup schema v25', () => {
  const popup = read('popup.js');
  assert.match(popup, /const SETTINGS_CONFIG_SCHEMA_VERSION = 28;/);
  assert.match(popup, /const v25DisplayPreferenceKeys = \['hideInactiveEffects', 'showLimiterOffWarning'\]/);
  assert.match(popup, /showLimiterOffWarning: imported\.showLimiterOffWarning/);
  assert.match(popup, /hideInactiveEffects: imported\.hideInactiveEffects/);
  assert.match(popup, /showLimiterOffWarning,\s*showAllMessages/);
});

check('global genre detection preserves independent Bass and Voice manual overrides', async () => {
  const popup = read('popup.js');
  const start = popup.indexOf('async function setAutoGenreEnabled(enabled) {');
  const end = popup.indexOf('\n}\n\n// EN: Validates a status update', start);
  assert.ok(start >= 0 && end > start, 'setAutoGenreEnabled function must be found');
  const source = popup.slice(start, end + 2);
  const context = vm.createContext({
    autoGenreEnabled: true,
    autoGenreBassManualOverride: true,
    autoGenreVoiceManualOverride: false,
    autoGenreStatus: { enabled: true },
    GENRE_PARAMETER_MODE_VERSION: 1,
    slider: { value: '200' },
    updateBassUI() {}, updateVoiceUI() {}, updateAutoGenreStatusUI() {},
    writeLocalSettings: async () => {}, sendVolume: async () => true,
    showStatus() {}, t: (key) => key,
    chrome: { runtime: { sendMessage: async () => ({ success: true }) } },
    console
  });
  new vm.Script(source).runInContext(context);
  await vm.runInContext('setAutoGenreEnabled(false)', context);
  assert.equal(context.autoGenreEnabled, false);
  assert.equal(context.autoGenreBassManualOverride, true);
  assert.equal(context.autoGenreVoiceManualOverride, false);
  await vm.runInContext('setAutoGenreEnabled(true)', context);
  assert.equal(context.autoGenreEnabled, true);
  assert.equal(context.autoGenreBassManualOverride, true);
  assert.equal(context.autoGenreVoiceManualOverride, false);
});

check('capture stream ID is requested only after storage, metadata, and fresh active-tab validation', () => {
  const background = read('background.js');
  const start = background.indexOf('async function handleStartCapture(tabId) {');
  const end = background.indexOf('\n}\n', start);
  assert.ok(start >= 0 && end > start, 'handleStartCapture must exist');
  const body = background.slice(start, end);
  const storage = body.indexOf('chrome.storage.local.get');
  const metadata = body.indexOf('GET_MEDIA_TRACK_METADATA');
  const revalidate = body.indexOf('const [captureActiveTab]');
  const streamId = body.indexOf('chrome.tabCapture.getMediaStreamId');
  const consume = body.indexOf("type: 'START_CAPTURE'");
  assert.ok(storage >= 0 && metadata > storage && revalidate > metadata && streamId > revalidate && consume > streamId);
  assert.match(body.slice(revalidate, streamId), /isSupportedCaptureUrl\(captureTab\.url\)/);
});

check('night-mode programme compressor remains in the audio path when peak limiter is disabled', () => {
  const offscreen = read('offscreen.js');
  const graph = offscreen.indexOf('eqHeadroomGain.connect(compressor)');
  const compToGain = offscreen.indexOf('compressor.connect(gainNode)', graph);
  const gainToNight = offscreen.indexOf('gainNode.connect(nightMakeupGain)', compToGain);
  const nightToAnalyser = offscreen.indexOf('nightMakeupGain.connect(analyserNode)', gainToNight);
  const limiterRoute = offscreen.indexOf('function applyLimiterRouting()');
  assert.ok(graph >= 0 && compToGain > graph && gainToNight > compToGain && nightToAnalyser > gainToNight && limiterRoute > nightToAnalyser);
  const routing = offscreen.slice(limiterRoute, offscreen.indexOf('\n}', limiterRoute) + 2);
  assert.match(routing, /if \(!peakLimiterEnabled\)\s*\{\s*analyserNode\.connect\(audioContext\.destination\)/);
  assert.match(offscreen, /The programme compressor stays connected in every mode/);
  assert.match(offscreen, /compressor's dynamics; disabling the separate peak limiter below does not bypass it/);
});

check('protection preferences are disabled until settings have loaded and are bound to handlers', () => {
  const popup = read('popup.js');
  const readyStart = popup.indexOf('function setSettingsPreferencesReady(ready) {');
  const readyEnd = popup.indexOf('\n}', readyStart);
  const readyBody = popup.slice(readyStart, readyEnd);
  assert.match(readyBody, /hideInactiveEffectsToggle/);
  assert.match(readyBody, /showLimiterOffWarningToggle/);
  assert.match(popup, /showLimiterOffWarningToggle\.addEventListener\('change'/);
  assert.match(popup, /hideInactiveEffectsToggle\.addEventListener\('change'/);
});

check('volume display has compact sizing overrides for short popup viewports', () => {
  const css = read('popup.css');
  assert.match(css, /4\.8\.19: compact volume display/);
  assert.match(css, /\.volume-display\s*\{\s*margin-bottom:\s*16px;/);
  assert.match(css, /\.volume-main-row\s*\{\s*min-height:\s*52px;/);
  assert.match(css, /\.volume-value\s*\{\s*font-size:\s*50px;/);
  assert.match(css, /\.volume-label\s*\{\s*margin-top:\s*5px;/);
});

check('all JavaScript source files parse cleanly with Node', () => {
  const files = ['background.js', 'content.js', 'offscreen.js', 'popup.js',
    'shared/genres.js', 'shared/validation.js', 'tests/smoke.js'];
  for (const file of files) {
    const source = read(file);
    new vm.Script(source, { filename: file });
  }
});



check('GTA VI palette gallery is controlled by an accessible click-only disclosure heading', () => {
  const html = read('popup.html');
  const popup = read('popup.js');
  const css = read('popup.css');
  assert.match(html, /<button type="button" id="gtaPaletteToggle" class="gta-palette-heading" aria-expanded="true" aria-controls="gtaPaletteContent"/);
  assert.match(html, /<div id="gtaPaletteContent" class="gta-palette-content">[\s\S]*?id="gtaPaletteGallery"[\s\S]*?id="gtaPalettePreview"/);
  assert.match(popup, /gtaPaletteToggle\.addEventListener\('click'/);
  assert.match(popup, /gtaPaletteContent\.hidden = !expanded/);
  assert.match(popup, /gtaPaletteToggle\.setAttribute\('aria-expanded', String\(expanded\)\)/);
  assert.doesNotMatch(popup, /gtaPaletteToggle\.addEventListener\(['"](?:pointerenter|mouseenter|mouseover)['"]/);
  assert.match(css, /\.gta-palette-content\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  assert.match(css, /\.gta-palette-heading\[aria-expanded="true"\] \.gta-palette-chevron/);
});

check('GTA VI palette gallery disclosure preference loads, persists, and rolls back on storage failure', async () => {
  const popup = read('popup.js');
  assert.match(popup, /let gtaPaletteGalleryExpanded = true/);
  assert.match(popup, /'gtaPaletteGalleryExpanded'/);
  assert.match(popup, /gtaPaletteGalleryExpanded = typeof savedPreferences\.gtaPaletteGalleryExpanded === 'boolean' \? savedPreferences\.gtaPaletteGalleryExpanded : true/);
  assert.match(popup, /await writeLocalSettings\(\{ gtaPaletteGalleryExpanded: next \}\)/);

  const start = popup.indexOf('function updateGtaPaletteGalleryDisclosure() {');
  const nextFunction = popup.indexOf('\nfunction applyGtaPalette(', start);
  assert.ok(start >= 0 && nextFunction > start, 'disclosure functions must be present');
  const source = popup.slice(start, nextFunction);
  const saved = [];
  const status = [];
  const context = vm.createContext({
    gtaPaletteGalleryExpanded: true,
    gtaPaletteToggle: { attributes: {}, classList: { toggle(name, value) { this[name] = value; } }, setAttribute(name, value) { this.attributes[name] = value; } },
    gtaPaletteContent: { hidden: false },
    writeLocalSettings: async (value) => { saved.push(value); },
    showStatus: (message, isError) => status.push({ message, isError }),
    settingsSaveError: 'save-error',
    t: (key) => key
  });
  new vm.Script(source).runInContext(context);
  await vm.runInContext('setGtaPaletteGalleryExpanded(false)', context);
  assert.equal(context.gtaPaletteGalleryExpanded, false);
  assert.equal(context.gtaPaletteContent.hidden, true);
  assert.equal(context.gtaPaletteToggle.attributes['aria-expanded'], 'false');
  assert.equal(saved[0].gtaPaletteGalleryExpanded, false);

  context.writeLocalSettings = async () => { throw new Error('storage unavailable'); };
  await vm.runInContext('setGtaPaletteGalleryExpanded(true)', context);
  assert.equal(context.gtaPaletteGalleryExpanded, false, 'storage failure must restore previous collapsed state');
  assert.equal(context.gtaPaletteContent.hidden, true);
  assert.equal(context.gtaPaletteToggle.attributes['aria-expanded'], 'false');
  assert.equal(status.at(-1).isError, true);
});

check('GTA VI palette gallery expansion is included in reset and backup schema v27 with backward compatibility', () => {
  const popup = read('popup.js');
  assert.match(popup, /const SETTINGS_CONFIG_SCHEMA_VERSION = 28/);
  assert.match(popup, /gtaPaletteGalleryExpanded: true/);
  assert.match(popup, /const v27AppearanceKeys = \['gtaPaletteGalleryExpanded'\]/);
  assert.match(popup, /config\.schemaVersion >= 27 && !hasOwnSettingsKeys\(value, v27AppearanceKeys\)/);
  assert.match(popup, /const importedGtaPaletteGalleryExpanded = config\.schemaVersion >= 27 \? value\.gtaPaletteGalleryExpanded : true/);
  assert.match(popup, /gtaPaletteGalleryExpanded: importedGtaPaletteGalleryExpanded/);
  assert.match(popup, /gtaPaletteGalleryExpanded: imported\.gtaPaletteGalleryExpanded/);
  assert.match(popup, /gtaPaletteGalleryExpanded = imported\.gtaPaletteGalleryExpanded/);
});

check('scrollbar setting is available in the Appearance category and defaults to visible', () => {
  const html = read('popup.html');
  const appearanceStart = html.indexOf('id="settingsCategoryAppearance"');
  const audioStart = html.indexOf('id="settingsCategoryAudio"');
  const appearanceMarkup = html.slice(appearanceStart, audioStart);
  assert.match(appearanceMarkup, /id="showScrollbarToggle"[^>]*checked/);
  assert.match(appearanceMarkup, /data-i18n="showScrollbarLabel"/);
  assert.match(html, /id="showScrollbarToggle"/);
});

check('scrollbar preference is loaded, updated, applied and stored without disabling scroll input', () => {
  const popup = read('popup.js');
  assert.match(popup, /const showScrollbarToggle = document\.getElementById\('showScrollbarToggle'\)/);
  assert.match(popup, /let showScrollbar = true/);
  assert.match(popup, /'rgbGlow', 'showScrollbar', 'gtaPaletteGalleryExpanded', 'quickSettingsExpanded', 'activeAudioPreset'/);
  assert.match(popup, /showScrollbar = typeof savedPreferences\.showScrollbar === 'boolean' \? savedPreferences\.showScrollbar : true/);
  assert.match(popup, /document\.body\.dataset\.showScrollbar = showScrollbar \? 'true' : 'false'/);
  assert.match(popup, /await writeLocalSettings\(\{ showScrollbar \}\)/);
  assert.match(popup, /showScrollbarToggle\.addEventListener\('change'/);
  assert.match(popup, /showScrollbarToggle, settingsBassModeStatusToggle/);
});

check('scrollbar preference remains included in factory reset and backup schema v27', () => {
  const popup = read('popup.js');
  assert.match(popup, /const SETTINGS_CONFIG_SCHEMA_VERSION = 28/);
  assert.match(popup, /showScrollbar: true/);
  assert.match(popup, /const v26AppearanceKeys = \['showScrollbar'\]/);
  assert.match(popup, /config\.schemaVersion >= 26 && !hasOwnSettingsKeys\(value, v26AppearanceKeys\)/);
  assert.match(popup, /const importedShowScrollbar = config\.schemaVersion >= 26 \? value\.showScrollbar : true/);
  assert.match(popup, /showScrollbar: importedShowScrollbar/);
  assert.match(popup, /showScrollbar: imported\.showScrollbar/);
});

check('visible scrollbars use the selected GTA palette gradient for popup and palette gallery', () => {
  const css = read('popup.css');
  assert.match(css, /body::-webkit-scrollbar-thumb\s*\{[\s\S]*?var\(--vcp-gta-gradient/);
  assert.match(css, /\.gta-palette-gallery::-webkit-scrollbar-thumb\s*\{[\s\S]*?var\(--vcp-gta-gradient/);
  assert.match(css, /scrollbar-color:\s*var\(--vcp-gta-bright/);
  assert.match(css, /body\[data-show-scrollbar="false"\]::-webkit-scrollbar/);
  assert.match(css, /body\[data-show-scrollbar="false"\] \.gta-palette-gallery::-webkit-scrollbar/);
  assert.match(css, /body\s*\{[\s\S]*?overflow-y:\s*auto/);
  assert.match(css, /\.gta-palette-gallery\s*\{[\s\S]*?overflow-y:\s*auto/);
});

check('scrollbar controls and status messages are localized in RU/EN/UK runtime dictionaries', () => {
  for (const locale of ['ru','en','uk']) {
    const dictionary = JSON.parse(read(`lang/${locale}.json`));
    for (const key of ['showScrollbarLabel','showScrollbarDescription','scrollbarShownStatus','scrollbarHiddenStatus']) {
      assert.equal(typeof dictionary[key], 'string', `${locale}/${key}`);
      assert.ok(dictionary[key].trim(), `${locale}/${key} empty`);
    }
  }
});

check('scrollbar labels are present in every browser locale catalogue', () => {
  for (const locale of ['ru','en','uk','en_US','en_GB','ru_RU','uk_UA']) {
    const dictionary = JSON.parse(read(`_locales/${locale}/messages.json`));
    for (const key of ['showScrollbarLabel','showScrollbarDescription','scrollbarShownStatus','scrollbarHiddenStatus']) {
      assert.ok(typeof dictionary[key]?.message === 'string' && dictionary[key].message.trim(), `${locale}/${key}`);
    }
  }
});



check('scrollbar visibility setter updates only scrollbar UI, persists state, and rolls back on storage failure', async () => {
  const popup = read('popup.js');
  const start = popup.indexOf('function updateScrollbarVisibilityUI() {');
  const endMarker = '\n}\n';
  const setterStart = popup.indexOf('async function setShowScrollbar(enabled) {', start);
  const setterEnd = popup.indexOf(endMarker, setterStart);
  assert.ok(start >= 0 && setterStart > start && setterEnd > setterStart);
  const source = popup.slice(start, setterEnd + endMarker.length);
  const saved = [];
  const messages = [];
  const context = vm.createContext({
    showScrollbar: true,
    settingsPreferencesReady: true,
    showScrollbarToggle: { checked: false, disabled: false, label: '', setAttribute(name, value) { this[name] = value; } },
    document: { body: { dataset: {} } },
    writeLocalSettings: async (value) => { saved.push(value); },
    showStatus: (message, isError) => messages.push({ message, isError: Boolean(isError) }),
    settingsSaveError: 'save-error',
    t: (key) => key,
    console
  });
  new vm.Script(source).runInContext(context);
  await vm.runInContext('setShowScrollbar(false)', context);
  assert.equal(context.document.body.dataset.showScrollbar, 'false');
  assert.equal(context.showScrollbarToggle.checked, false);
  assert.equal(context.showScrollbar, false);
  assert.equal(saved[0].showScrollbar, false);
  context.writeLocalSettings = async () => { throw new Error('storage unavailable'); };
  await vm.runInContext('setShowScrollbar(true)', context);
  assert.equal(context.showScrollbar, false, 'failed save must restore previous setting');
  assert.equal(context.showScrollbarToggle.checked, false);
  assert.equal(context.document.body.dataset.showScrollbar, 'false');
  assert.equal(messages.at(-1).isError, true);
});


check('quick settings has a dedicated accessible collapse button and starts collapsed', () => {
  const html = read('popup.html');
  assert.match(html, /id="quickSettingsExpandToggle"[^>]*aria-expanded="false"[^>]*aria-controls="quickSettingsGrid"/);
  assert.match(html, /id="quickSettingsGrid" class="quick-settings-grid" hidden/);
  assert.match(html, /data-i18n-aria-label="quickSettingsExpandLabel"/);
  assert.match(html, /data-i18n-title="quickSettingsExpandLabel"/);
  assert.match(html, /id="quickSettingsPanel"/);
});

check('quick settings expand/collapse labels are localized in RU/EN/UK', () => {
  const expected = {
    ru: ['Развернуть быстрые настройки', 'Свернуть быстрые настройки'],
    en: ['Expand quick settings', 'Collapse quick settings'],
    uk: ['Розгорнути швидкі налаштування', 'Згорнути швидкі налаштування']
  };
  for (const [locale, labels] of Object.entries(expected)) {
    const dictionary = JSON.parse(read(`lang/${locale}.json`));
    assert.equal(dictionary.quickSettingsExpandLabel, labels[0]);
    assert.equal(dictionary.quickSettingsCollapseLabel, labels[1]);
  }
});

check('quick settings accordion updates visibility and ARIA state, persists choice, and rolls back on storage failure', async () => {
  const popup = read('popup.js');
  const start = popup.indexOf('function updateQuickSettingsExpandedUI() {');
  const end = popup.indexOf('// EN: Persists the visibility preference for the quick-settings group.', start);
  assert.ok(start >= 0 && end > start, 'quick settings disclosure functions must exist');
  const source = popup.slice(start, end);
  const stored = [];
  const status = [];
  const toggle = {
    attributes: {}, classes: new Set(),
    setAttribute(name, value) { this.attributes[name] = value; },
    classList: { toggle(name, enabled) { if (enabled) toggle.classes.add(name); else toggle.classes.delete(name); } }
  };
  const grid = { hidden: true };
  const context = vm.createContext({
    quickSettingsExpanded: false,
    quickSettingsGrid: grid,
    quickSettingsExpandToggle: toggle,
    writeLocalSettings: async (value) => stored.push(value),
    showStatus: (message, isError) => status.push({ message, isError: Boolean(isError) }),
    settingsSaveError: 'settingsSaveError',
    t: (key) => key,
    console
  });
  new vm.Script(source).runInContext(context);

  await vm.runInContext('setQuickSettingsExpanded(true)', context);
  assert.equal(context.quickSettingsExpanded, true);
  assert.equal(grid.hidden, false);
  assert.equal(toggle.attributes['aria-expanded'], 'true');
  assert.equal(toggle.attributes['aria-label'], 'quickSettingsCollapseLabel');
  assert.equal(toggle.attributes.title, 'quickSettingsCollapseLabel');
  assert.equal(toggle.classes.has('is-expanded'), true);
  assert.equal(stored[0].quickSettingsExpanded, true);

  await vm.runInContext('setQuickSettingsExpanded(false)', context);
  assert.equal(context.quickSettingsExpanded, false);
  assert.equal(grid.hidden, true);
  assert.equal(toggle.attributes['aria-expanded'], 'false');
  assert.equal(toggle.attributes['aria-label'], 'quickSettingsExpandLabel');
  assert.equal(stored[1].quickSettingsExpanded, false);

  context.writeLocalSettings = async () => { throw new Error('storage unavailable'); };
  await vm.runInContext('setQuickSettingsExpanded(true)', context);
  assert.equal(context.quickSettingsExpanded, false, 'failed save must restore previous collapsed state');
  assert.equal(grid.hidden, true);
  assert.equal(toggle.attributes['aria-expanded'], 'false');
  assert.equal(status.at(-1).isError, true);
});

check('quick settings collapsed preference defaults to false, loads from storage and is independent of panel visibility', () => {
  const popup = read('popup.js');
  assert.match(popup, /let quickSettingsExpanded = false/);
  assert.match(popup, /quickSettingsExpanded = savedPreferences\.quickSettingsExpanded === true/);
  assert.match(popup, /quickSettingsExpanded: false/);
  assert.match(popup, /quickSettingsExpanded: next/);
  assert.match(popup, /if \(quickSettingsPanel\) quickSettingsPanel\.hidden = !showQuickSettings;\s*updateQuickSettingsExpandedUI\(\);/);
  assert.match(popup, /quickSettingsExpandToggle\.addEventListener\('click', \(\) => \{ void setQuickSettingsExpanded\(!quickSettingsExpanded\); \}\)/);
  assert.match(popup, /showQuickSettings = savedPreferences\.showQuickSettings !== false/);
});

check('quick settings expanded state is included in backup schema v28 and older backups import collapsed', () => {
  const popup = read('popup.js');
  assert.match(popup, /const SETTINGS_CONFIG_SCHEMA_VERSION = 28/);
  assert.match(popup, /const v28QuickSettingsKeys = \['quickSettingsExpanded'\]/);
  assert.match(popup, /config\.schemaVersion >= 28 && !hasOwnSettingsKeys\(value, v28QuickSettingsKeys\)/);
  assert.match(popup, /const importedQuickSettingsExpanded = config\.schemaVersion >= 28 \? value\.quickSettingsExpanded : false/);
  assert.match(popup, /typeof importedQuickSettingsExpanded === 'boolean'/);
  assert.match(popup, /quickSettingsExpanded: importedQuickSettingsExpanded/);
  assert.match(popup, /quickSettingsExpanded,\s*showBassBoostModeStatus/);
  assert.match(popup, /quickSettingsExpanded: imported\.quickSettingsExpanded/);
  assert.match(popup, /quickSettingsExpanded = imported\.quickSettingsExpanded/);
  assert.match(popup, /'gtaPaletteGalleryExpanded', 'quickSettingsExpanded', 'activeAudioPreset'/);
  assert.match(popup, /typeof savedPreferences\.quickSettingsExpanded !== 'boolean'\) newDefaultPreferences\.quickSettingsExpanded = false/);
});

check('quick settings accordion is styled for themes and hidden state does not remove scroll container', () => {
  const css = read('popup.css');
  assert.match(css, /\.quick-settings-grid\[hidden\]\s*\{\s*display:\s*none !important/);
  assert.match(css, /\.quick-settings-disclosure:focus-visible/);
  assert.match(css, /\.quick-settings-disclosure\.is-expanded \.quick-settings-chevron/);
  assert.match(css, /var\(--vcp-gta-bright/);
});



check('footer author and live manifest version follow the selected GTA VI palette', () => {
  const html = read('popup.html');
  const css = read('popup.css');
  const js = read('popup.js');
  assert.match(html, /class="footer-author"[\s\S]*class="author-name">Maxim Melnikov/);
  assert.match(html, /class="footer-version"[\s\S]*id="extensionVersion">4\.8\.31/);
  assert.match(js, /extensionVersion\.textContent\s*=\s*chrome\.runtime\.getManifest\(\)\.version/);
  assert.match(css, /body\[data-accent-palette\^="gta-"\] \.footer\s*\{[^}]*border-top-color:\s*var\(--vcp-gta-border\)/);
  assert.match(css, /body\[data-accent-palette\^="gta-"\] \.footer-author,[\s\S]*?\.author-name,[\s\S]*?#extensionVersion\s*\{[^}]*color:\s*var\(--vcp-gta-accent\)/);
  assert.match(css, /body\[data-theme="light"\]\[data-accent-palette\^="gta-"\][\s\S]*?#extensionVersion\s*\{[^}]*color:\s*var\(--vcp-gta-deep\)/);
});

check('popup small and medium text is slightly larger while main volume numerals keep their size', () => {
  const css = read('popup.css');
  assert.match(css, /\.footer\s*\{[^}]*font-size:\s*11px/);
  assert.match(css, /\.settings-label\s*\{[^}]*font-size:\s*11px/);
  assert.match(css, /\.settings-help\s*\{[^}]*font-size:\s*9\.5px/);
  assert.match(css, /\.volume-value\s*\{\s*font-size:\s*50px;/);
  assert.match(css, /\.volume-value span\s*\{\s*font-size:\s*25px;/);
});

check('recommended balanced settings preserve user language, theme and GTA palette while configuring safe audio defaults', () => {
  const popup = read('popup.js');
  const start = popup.indexOf('function buildRecommendedSettings(');
  const end = popup.indexOf('// EN: Applies the recommended profile atomically', start);
  assert.ok(start >= 0 && end > start, 'recommended settings builder must exist');
  const context = vm.createContext({
    GTA6_PALETTE_IDS: ['classic', 'gta-01', 'gta-21'],
    GTA6_PALETTE_VERSION: 3,
    VISUALIZER_GTA_THEME_VERSION: 2,
    GENRE_PARAMETER_MODE_VERSION: 1,
    normalizeServiceAudioProfile(raw) {
      const base = { enabled: false, volume: 1, bassBoostEnabled: true, bassBoostDb: 4, voiceBoostEnabled: true, voiceBoostDb: 2, peakLimiterEnabled: true, nightModeEnabled: false, activeAudioPreset: 'default' };
      return raw && typeof raw === 'object' ? { ...base, ...raw } : base;
    }
  });
  new vm.Script(popup.slice(start, end), { filename: 'popup.js#recommended-settings' }).runInContext(context);
  const settings = context.buildRecommendedSettings({
    language: 'uk', themeMode: 'light', gtaPalette: 'gta-21',
    youtubeAudioProfile: { enabled: true, volume: 2.5, bassBoostDb: 8 },
    spotifyAudioProfile: { enabled: true, volume: 1.5, voiceBoostDb: 4 }
  });
  assert.equal(settings.language, 'uk');
  assert.equal(settings.themeMode, 'light');
  assert.equal(settings.gtaPalette, 'gta-21');
  const classicSettings = context.buildRecommendedSettings({ language: 'en', themeMode: 'dark', gtaPalette: 'classic' });
  assert.equal(classicSettings.gtaPalette, 'classic', 'an explicitly selected classic palette must also be preserved');
  assert.equal(settings.volume, 1);
  assert.equal(settings.muted, false);
  assert.equal(settings.peakLimiterEnabled, true);
  assert.equal(settings.showClippingWarning, true);
  assert.equal(settings.showLimiterOffWarning, false);
  assert.equal(settings.bassBoostDb, 4);
  assert.equal(settings.voiceBoostDb, 2);
  assert.equal(settings.autoGenreEnabled, true);
  assert.equal(settings.autoGenreBassManualOverride, false);
  assert.equal(settings.autoGenreVoiceManualOverride, false);
  assert.equal(settings.nightModeEnabled, false);
  assert.equal(settings.energySavingEnabled, true);
  assert.equal(settings.energySavingMode, 'balanced');
  assert.equal(settings.visualizerBands, 48);
  assert.equal(settings.spectrogramDuration, 4);
  assert.equal(settings.quickSettingsExpanded, false);
  assert.equal(settings.gtaPaletteGalleryExpanded, false);
  assert.equal(settings.youtubeAudioProfile.enabled, false);
  assert.equal(settings.youtubeAudioProfile.volume, 2.5, 'site-specific saved values must be preserved');
  assert.equal(settings.spotifyAudioProfile.enabled, false);
  assert.equal(settings.spotifyAudioProfile.voiceBoostDb, 4, 'site-specific saved values must be preserved');
});

check('recommended-settings action is present, confirmed, localized and applies saved/live state', () => {
  const html = read('popup.html');
  const popup = read('popup.js');
  assert.match(html, /id="applyRecommendedSettingsBtn"/);
  assert.match(html, /data-i18n="recommendedSettingsButton"/);
  assert.match(popup, /applyRecommendedSettingsBtn\?\.addEventListener\('click'/);
  assert.match(popup, /window\.confirm\(t\('recommendedSettingsConfirm'\)\)/);
  assert.match(popup, /await writeLocalSettings\(recommended\)/);
  assert.match(popup, /type: 'AUTO_GENRE_SETTINGS', enabled: true/);
  assert.match(popup, /autoGenreStatus = \{ \.\.\.autoGenreStatus, enabled: true, bassManualOverride: false, voiceManualOverride: false \}/);
  assert.match(popup, /if \(currentTabHasCapture\(\)\) liveAudioApplied = await sendVolume\(100\)/);
  for (const locale of ['ru', 'en', 'uk']) {
    const messages = JSON.parse(read(`lang/${locale}.json`));
    for (const key of ['recommendedSettingsTitle','recommendedSettingsDescription','recommendedSettingsButton','recommendedSettingsConfirm','recommendedSettingsApplied','recommendedSettingsSavedPendingCapture','recommendedSettingsSavedPendingAudio','recommendedSettingsFailed','recommendedSettingsPreserveNote']) {
      assert.ok(typeof messages[key] === 'string' && messages[key].trim(), `${locale} missing ${key}`);
    }
  }
});

check('background volume updates require explicit offscreen success acknowledgement', () => {
  const background = read('background.js');
  const match = background.match(/async function handleVolumeUpdate\(message\)\s*\{[\s\S]*?\n\}\n/);
  assert.ok(match, 'handleVolumeUpdate must exist');
  assert.match(match[0], /if \(!result \|\| result\.success !== true\)/);
  assert.doesNotMatch(match[0], /if \(result && result\.success === false\)/);
});

check('volume update returns failure when the offscreen processor sends no acknowledgement', async () => {
  const background = read('background.js');
  const match = background.match(/async function handleVolumeUpdate\(message\)\s*\{[\s\S]*?\n\}\n/);
  assert.ok(match, 'handleVolumeUpdate must exist');
  const context = vm.createContext({
    currentCapturedTabId: 42,
    reconcileCapturedTabState: async () => undefined,
    validAudioSettingsMessage: () => true,
    isSupportedCaptureUrl: () => true,
    chrome: { tabs: {
      query: async () => [{ id: 42, url: 'https://www.youtube.com/watch?v=abc123xyz99' }],
      sendMessage: async () => ({ success: true })
    } },
    sendToOffscreen: async () => undefined,
    Date, console
  });
  new vm.Script(match[0]).runInContext(context);
  const message = { tabId: 42, volume: 2, muted: false };
  const missingAck = await context.handleVolumeUpdate(message);
  assert.equal(missingAck.success, false);
  context.sendToOffscreen = async () => ({ success: true });
  const acknowledged = await context.handleVolumeUpdate(message);
  assert.equal(acknowledged.success, true);
});

check('visualizer settings and control reject missing offscreen acknowledgements when capture is active', () => {
  const background = read('background.js');
  const settings = background.match(/if \(message\.type === 'VISUALIZER_SETTINGS'\)\s*\{[\s\S]*?\n  \}\n\n  if \(message\.type === 'VISUALIZER_CONTROL'/);
  const control = background.match(/if \(message\.type === 'VISUALIZER_CONTROL'\)\s*\{[\s\S]*?\n  \}\n\n  if \(message\.type === 'UPDATE_BADGE'/);
  assert.ok(settings && control, 'both visualizer handlers must exist');
  assert.match(settings[0], /if \(!result \|\| result\.success !== true\)/);
  assert.match(settings[0], /deferred: true/);
  assert.match(control[0], /if \(!result \|\| result\.success !== true\)/);
  assert.match(control[0], /deferred: true/);
});

check('popup treats visualizer options as saved only after explicit success acknowledgement', () => {
  const popup = read('popup.js');
  const match = popup.match(/async function persistVisualizerOptionsToBackground\(\)\s*\{[\s\S]*?\n\}\n/);
  assert.ok(match, 'persistVisualizerOptionsToBackground must exist');
  assert.match(match[0], /Boolean\(result && result\.success === true\)/);
  assert.doesNotMatch(match[0], /!result \|\| result\.success !== false/);
});

check('startup and recommended visualizer UI requires success acknowledgement before rendering', () => {
  const popup = read('popup.js');
  assert.match(popup, /if \(!visualizerResult \|\| visualizerResult\.success !== true\) \{[\s\S]{0,240}stopSpectrumRendering\(\)/);
  assert.match(popup, /if \(visualizerResult && visualizerResult\.success === true\) \{/);
});

check('automatic genre status persistence is serialized and retries failed signatures', async () => {
  const background = read('background.js');
  assert.match(background, /let autoGenreStatusPersistenceQueue = Promise\.resolve\(\)/);
  assert.match(background, /enqueueAutoGenreStatusPersistence\(storageArea, persistedStatus, persistenceSignature\)/);
  const helper = background.match(/function enqueueAutoGenreStatusPersistence\(storageArea, statusSnapshot, persistenceSignature\)\s*\{[\s\S]*?\n\}\n/);
  assert.ok(helper, 'serial persistence helper must exist');
  const warnings = [];
  const context = vm.createContext({
    autoGenreStatusPersistenceQueue: Promise.resolve(),
    lastPersistedAutoGenreStatusSignature: 'sig-1',
    console: { warn: (...args) => warnings.push(args) },
    errorMessage: (error) => String(error && error.message || error)
  });
  new vm.Script(helper[0]).runInContext(context);
  const pending = [];
  const writes = [];
  const storageArea = { set: (payload) => {
    writes.push(payload.autoGenreStatus.id);
    return new Promise((resolve, reject) => pending.push({ resolve, reject }));
  } };
  context.enqueueAutoGenreStatusPersistence(storageArea, { id: 'old' }, 'sig-1');
  context.lastPersistedAutoGenreStatusSignature = 'sig-2';
  const secondWrite = context.enqueueAutoGenreStatusPersistence(storageArea, { id: 'new' }, 'sig-2');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(writes, ['old'], 'the later status must wait for the earlier storage write');
  pending[0].reject(new Error('temporary storage failure'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(writes, ['old', 'new'], 'the newest status must run after the older write settles');
  pending[1].resolve();
  await secondWrite;
  assert.equal(context.lastPersistedAutoGenreStatusSignature, 'sig-2', 'failure of an old write must not clear the new signature');
  context.lastPersistedAutoGenreStatusSignature = 'sig-3';
  const failingStorage = { set: () => { throw new Error('synchronous storage failure'); } };
  await context.enqueueAutoGenreStatusPersistence(failingStorage, { id: 'retry-me' }, 'sig-3');
  assert.equal(context.lastPersistedAutoGenreStatusSignature, '', 'failed current signature must be cleared for retry');
  assert.ok(warnings.length >= 2, 'storage failures should be diagnosed');
});

check('factory reset and backup import stop visualizer rendering when offscreen does not acknowledge control', () => {
  const popup = read('popup.js');
  assert.match(popup, /Factory reset completed, but offscreen did not confirm visualizer settings/);
  assert.match(popup, /Backup import completed, but offscreen did not confirm visualizer settings/);
  assert.ok((popup.match(/visualizerResult\.success !== true/g) || []).length >= 3);
});

check('popup high-gain warning includes the active genre volume trim like the offscreen engine', () => {
  const popup = read('popup.js');
  const offscreen = read('offscreen.js');
  const match = popup.match(/function hasExcessiveGainRisk\(\)\s*\{[\s\S]*?\n\}\n/);
  const engineMatch = offscreen.match(/function isExcessiveGainRisk\(\)\s*\{[\s\S]*?\n\}\n/);
  assert.ok(match && engineMatch, 'both gain risk functions must exist');
  assert.match(match[0], /Number\.isFinite\(status\.volumeTrimDb\)/);
  assert.match(match[0], /Math\.pow\(10, effectiveVolumeTrimDb \/ 20\)/);
  assert.match(match[0], /effectiveVolume >= 3 && effectiveBassEnabled && effectiveBassDb >= 3/);
  assert.match(match[0], /effectiveVolume >= 4 && effectiveVoiceEnabled && effectiveVoiceDb >= 5/);
  assert.match(engineMatch[0], /Math\.pow\(10, effectiveVolumeTrimDb \/ 20\)/);
});

check('popup and offscreen classify identical high-gain cases when genre trim is active', () => {
  const popup = read('popup.js');
  const offscreen = read('offscreen.js');
  const popupMatch = popup.match(/function hasExcessiveGainRisk\(\)\s*\{[\s\S]*?\n\}\n/);
  const engineMatch = offscreen.match(/function isExcessiveGainRisk\(\)\s*\{[\s\S]*?\n\}\n/);
  const popupContext = vm.createContext({
    slider: { value: '290' }, isMuted: false,
    bassBoostEnabled: true, bassBoostDb: 3,
    voiceBoostEnabled: false, voiceBoostDb: 0,
    autoGenreEnabled: true,
    autoGenreStatus: { enabled: true, active: true, genre: 'phonk', volumeTrimDb: 1 },
    getAppliedAutoBassProfile: () => null,
    getAppliedAutoVoiceProfile: () => null
  });
  new vm.Script(popupMatch[0]).runInContext(popupContext);
  const popupRisk = popupContext.hasExcessiveGainRisk();
  const engineContext = vm.createContext({
    currentMuted: false, currentVolume: 2.9, autoGenreEnabled: true,
    bassBoostEnabled: true, bassBoostDb: 3,
    voiceBoostEnabled: false, voiceBoostDb: 0,
    autoGenreBassManualOverride: true, autoGenreVoiceManualOverride: true,
    getSelectedAutoGenreProfile: () => ({ bassBoostEnabled: true, bassBoostDb: 3, voiceBoostEnabled: false, voiceBoostDb: 0, volumeTrimDb: 1 })
  });
  new vm.Script(engineMatch[0]).runInContext(engineContext);
  assert.equal(popupRisk, true);
  assert.equal(engineContext.isExcessiveGainRisk(), popupRisk);
  popupContext.slider.value = '250';
  engineContext.currentVolume = 2.5;
  assert.equal(popupContext.hasExcessiveGainRisk(), false);
  assert.equal(engineContext.isExcessiveGainRisk(), false);
});

check('programme compressor remains connected for Night Mode independently from the optional final peak limiter', () => {
  const offscreen = read('offscreen.js');
  const routing = offscreen.match(/function applyLimiterRouting\(\)\s*\{[\s\S]*?\n\}\n/);
  assert.ok(routing, 'applyLimiterRouting must exist');
  assert.match(offscreen, /eqHeadroomGain\.connect\(compressor\);\s*compressor\.connect\(gainNode\)/);
  assert.match(offscreen, /nightMakeupGain\.gain\.setTargetAtTime\(nightModeEnabled \? 1\.188502 : 1/);
  assert.match(routing[0], /if \(!peakLimiterEnabled\)\s*\{\s*analyserNode\.connect\(audioContext\.destination\)/);
  assert.match(offscreen, /The programme compressor stays connected in every mode/);
});

check('EN/RU/UK dictionaries and browser locale catalogs have matching keys and placeholders', () => {
  const runtime = Object.fromEntries(['en','ru','uk'].map(locale => [locale, JSON.parse(read(`lang/${locale}.json`))]));
  const baseKeys = Object.keys(runtime.en).sort();
  const placeholders = value => [...String(value).matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}|\{\s*([A-Za-z0-9_]+)\s*\}/g)].map(m => m[1] || m[2]).sort();
  for (const locale of ['ru','uk']) {
    assert.deepEqual(Object.keys(runtime[locale]).sort(), baseKeys, `${locale} keys must match EN`);
    for (const key of baseKeys) {
      assert.ok(typeof runtime[locale][key] === 'string' && runtime[locale][key].trim(), `${locale}/${key} must be non-empty`);
      assert.deepEqual(placeholders(runtime[locale][key]), placeholders(runtime.en[key]), `${locale}/${key} placeholders must match EN`);
    }
  }
  const locales = ['en','en_GB','en_US','ru','ru_RU','uk','uk_UA'];
  const browser = Object.fromEntries(locales.map(locale => [locale, JSON.parse(read(`_locales/${locale}/messages.json`))]));
  const browserKeys = Object.keys(browser.en).sort();
  for (const locale of locales.slice(1)) assert.deepEqual(Object.keys(browser[locale]).sort(), browserKeys, `${locale} browser keys must match EN`);
  for (const [regional,parent] of [['en_GB','en'],['en_US','en'],['ru_RU','ru'],['uk_UA','uk']]) {
    for (const key of browserKeys) assert.equal(browser[regional][key].message, browser[parent][key].message, `${regional}/${key} must match ${parent}`);
  }
});

check('popup translation attributes and Russian fallback text match the runtime dictionary', () => {
  const html = read('popup.html');
  const ru = JSON.parse(read('lang/ru.json'));
  const attrs = [...html.matchAll(/\bdata-i18n(?:-[\w-]+)?\s*=\s*["']([^"']+)["']/g)];
  for (const match of attrs) assert.ok(typeof ru[match[1]] === 'string' && ru[match[1]].trim(), `missing RU key: ${match[1]}`);
  const nodes = [...html.matchAll(/<([a-z][\w-]*)\b([^>]*\bdata-i18n="([^"]+)"[^>]*)>([^<]*)(?=<)/gi)];
  for (const match of nodes) {
    const key = match[3], text = match[4].trim();
    if (!text) continue;
    // Decode HTML text exactly once; chained replacements can double-decode nested entities.
    const decoded = text.replace(/&(amp|lt|gt);/g, entity => {
      switch (entity) {
        case '&amp;': return '&';
        case '&lt;': return '<';
        case '&gt;': return '>';
        default: return entity;
      }
    });
    assert.notEqual(text.includes('&amp;lt;'), false, 'entity decoder must not recursively parse replacement output');
    assert.equal(decoded, ru[key], `fallback text differs from RU dictionary: ${key}`);
  }
});

check('non-English static accessibility attributes have localization bindings', () => {
  const html = read('popup.html');
  const attrs = [...html.matchAll(/\b(title|aria-label|placeholder|alt)\s*=\s*(["'])(.*?)\2/g)];
  for (const match of attrs) {
    const attribute = match[1], value = match[3];
    if (!/[А-Яа-яЁёІіЇїЄє]/.test(value)) continue;
    const start = html.lastIndexOf('<', match.index);
    const end = html.indexOf('>', match.index);
    const tag = html.slice(start, end + 1);
    assert.ok(tag.includes(`data-i18n-${attribute}=`), `missing data-i18n-${attribute}: ${tag.slice(0,160)}`);
  }
});

checkQueue.then(() => {
  process.stdout.write(`\n${passed} smoke checks passed.\n`);
}).catch((error) => {
  console.error('Smoke test failed:', error);
  process.exitCode = 1;
});
