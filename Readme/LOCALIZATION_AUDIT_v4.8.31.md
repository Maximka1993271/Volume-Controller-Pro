# Localization audit — v4.8.31

**Scope:** EN / RU / UK runtime dictionaries, Chromium manifest messages, popup translation bindings, settings labels, accessibility attributes, and interpolation placeholders.

## Results

- Runtime dictionaries contain **479 keys each**; EN, RU, and UK key sets match.
- No empty translations or missing runtime keys were found.
- All interpolation placeholders match across EN / RU / UK.
- Seven Chromium message catalogs (`en`, `en_GB`, `en_US`, `ru`, `ru_RU`, `uk`, `uk_UA`) contain **32 keys each** and have matching key sets.
- Regional browser catalogs match their base language catalogs.

## Changes in this audit

- Updated **41 stale Russian fallback text nodes** in `popup.html` to match the current RU dictionary. This avoids showing outdated copy before the runtime translation pass.
- Added i18n bindings to the initial mute button title/accessible name, GTA VI palette preview accessible name, and Bass/Voice AUTO/MANUAL mode button accessible names.
- Corrected the Ukrainian power-saving description to refer to spectrum rendering (`промальовування спектра`) rather than audio playback.
- Added smoke checks for runtime/browser locale key parity, placeholders, popup i18n keys, fallback text, and localized static accessibility attributes.
- Added the smoke suite to the extension validation workflow.

## Areas covered

Settings categories; Appearance; Audio Effects; YouTube and Spotify service profiles; Main Screen; Visualizers and Spectrogram; Performance and Power Saving; Audio Protection; Presets and Backups; GTA VI palettes; Quick Settings; Bass Boost and Voice Boost AUTO/MANUAL labels; capture, genre, volume and protection statuses.

Brand and established audio terms such as YouTube, Spotify, Bass Boost, Voice Boost, AUTO, MANUAL, RGB, dB, GTA VI and LIVE are intentionally retained where appropriate.

## Validation

Run from the unpacked extension root:

```bash
node tests/smoke.js
node --check popup.js
node --check background.js
node --check content.js
node --check offscreen.js
```

The smoke checks validate static consistency and bindings. A final visual/runtime check in Edge should still switch EN / RU / UK and inspect settings, quick controls, palette names, visualizer controls, and screen-reader announcements.
