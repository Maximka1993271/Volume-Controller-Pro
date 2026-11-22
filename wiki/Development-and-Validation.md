# Development and Validation

## Source layout

The extension source is maintained at the repository root:

- `manifest.json` — Manifest V3 metadata and permissions.
- `background.js` — service worker and capture lifecycle coordination.
- `content.js` — page integration and media track context.
- `offscreen.html` / `offscreen.js` — offscreen audio processing and analysis.
- `popup.html`, `popup.css`, `popup.js` — user interface.
- `shared/genres.js` — shared genre catalogue data.
- `shared/validation.js` — shared audio-message validation.
- `_locales/` and `lang/` — browser messages and interface translations.
- `tests/smoke.js` — production-source smoke checks.

## Run checks locally

Use a current Node.js installation.

Check JavaScript syntax:

```bash
node --check background.js
node --check content.js
node --check offscreen.js
node --check popup.js
```

Run the production smoke suite:

```bash
node tests/smoke.js
```

The v4.8.31 package reports 134 smoke checks. The repository's GitHub Actions workflow also validates the manifest, locales, HTML resources, popup element references, and selected static safety invariants.

## Manual browser validation

Static tests do not replace runtime testing. The release process calls for installation in Microsoft Edge and manual checks of:

- Audio capture start, stop, and restart.
- Switching and closing captured tabs.
- YouTube and Spotify track changes.
- Master volume and Bass/Voice Boost.
- Peak Limiter and Night Mode.
- Visualizers and spectrogram.
- Settings export and import.

Do not describe a manual test as passed unless it was actually performed.

## Contributing

Read [CONTRIBUTING.md](https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/CONTRIBUTING.md) before opening a pull request. For releases, follow [RELEASE_PROCESS.md](https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/RELEASE_PROCESS.md).
