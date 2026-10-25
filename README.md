# Volume Controller Pro

**Advanced audio control and enhancement for Microsoft Edge.**

Volume Controller Pro is a browser extension designed to give you more control over audio playback, with volume amplification, audio enhancement controls, equalizer profiles, and real-time visualizations.

## Features

- **Volume Amplification** — adjust playback volume beyond the standard 100% level using available volume presets.
- **Bass Boost** — enhance low frequencies with adjustable bass gain.
- **Voice Boost** — adjust voice enhancement settings with automatic and manual modes.
- **Audio Profiles** — configure audio settings for supported media websites, including YouTube and Spotify.
- **Equalizer Presets** — choose from built-in audio profiles.
- **Real-Time Visualizations** — view audio spectrum and spectrogram visualizations with customizable styles and palettes.
- **Customization** — configure appearance, language, visualization settings, and power-saving options.
- **Settings Import and Export** — back up settings and transfer them using configuration files.
- **Multilingual Interface** — English, Russian, and Ukrainian localization.

## Installation

### Install from source

1. Download or clone this repository.
2. If you downloaded a ZIP archive, extract it to a local folder.
3. Open Microsoft Edge and navigate to `edge://extensions/`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the project directory containing `manifest.json`.

Keep the extension folder in place after installation. To install an updated version, open the extensions page and reload the extension after replacing the files.

## Development and Validation

The project includes JavaScript source files, extension assets, localization resources, and documentation.

Before publishing changes, validate:

- JavaScript syntax.
- JSON configuration and localization files.
- HTML element IDs and referenced resources.
- Extension package structure and ZIP integrity.
- Audio capture, playback, and tab-switching behavior in Microsoft Edge.

Static checks do not replace testing the extension in a real browser. Audio capture and playback should be verified manually before publishing a release.

## Documentation

See [`Readme/Readme.md`](Readme/Readme.md) for the detailed audit report, documented fixes, and validation checklist.

## Current Version

**4.7.90**

See the [Releases](../../releases) page for published versions and release notes.

## Contributing

Bug reports and improvement suggestions are welcome. When reporting an issue, include the browser version, steps to reproduce the problem, and any relevant error messages.

## License

No license has been specified yet. Please contact the repository owner before redistributing or reusing this code.
