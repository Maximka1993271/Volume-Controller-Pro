<h1 align="center">Volume Controller Pro v4.7.91</h1>

<p align="center">
  <a href="https://github.com/Maximka1993271/Volume-Controller-Pro/releases">
    <img src="https://img.shields.io/badge/version-4.7.91-blue.svg?style=for-the-badge&logo=github" alt="Version 4.7.91"/>
  </a>
  <a href="https://www.microsoft.com/edge">
    <img src="https://img.shields.io/badge/Edge-Chromium-0078D7.svg?style=for-the-badge&logo=microsoft-edge" alt="Microsoft Edge"/>
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge" alt="MIT License"/>
  </a>
  <a href="https://github.com/Maximka1993271/Volume-Controller-Pro">
    <img src="https://img.shields.io/badge/Open%20Source-Available-brightgreen.svg?style=for-the-badge&logo=github" alt="Open Source Repository"/>
  </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API">
    <img src="https://img.shields.io/badge/Web%20Audio%20API-Used-orange.svg?style=for-the-badge" alt="Web Audio API"/>
  </a>
  <a href="https://github.com/Maximka1993271/Volume-Controller-Pro/issues">
    <img src="https://img.shields.io/badge/Issues-welcome-brightgreen.svg?style=for-the-badge&logo=github" alt="Issues Welcome"/>
  </a>
</p>

<p align="center">
  <img src="screenshots/voice-boost-manual-mode.jpg" alt="Volume Controller Pro — Voice Boost manual mode" width="600"/>
</p>

<p align="center">
  <strong>🎛️ Professional audio control for Microsoft Edge / Chromium</strong><br/>
  Volume amplification, audio enhancement, and real-time visualizers for browser media.<br/>
  <strong>Free • MIT Licensed • Privacy-focused</strong>
</p>

---

## ⚠️ Official Project and Downloads

This repository is the project's official GitHub home and the only distribution channel currently maintained by the author.

- **Official repository:** [Maximka1993271/Volume-Controller-Pro](https://github.com/Maximka1993271/Volume-Controller-Pro)
- **Releases:** [Download page](https://github.com/Maximka1993271/Volume-Controller-Pro/releases)
- **Latest published release asset (v4.7.90):** [Download `Volume.Controller.Pro.v4.7.90.zip`](https://github.com/Maximka1993271/Volume-Controller-Pro/releases/download/v4.7.90/Volume.Controller.Pro.v4.7.90.zip)
- **Updated source on `main` (v4.7.91):** automatic genre-detection improvements and the full [genre catalog](AUTO_GENRE_CATALOG.md). [Download the current source ZIP](https://github.com/Maximka1993271/Volume-Controller-Pro/archive/refs/heads/main.zip).
- **Release status:** v4.7.91 is a source update, not a published GitHub Release asset. The v4.7.90 download remains the latest published binary until a new release is created.
- **SHA-256 of the published GitHub release asset:** `11dbbe5d751abd6f06105317e2aad803ce2d1f08ec159f62121382153ed1de6f`
- No official Chrome Web Store or Microsoft Edge Add-ons listing is currently announced by the author.
- Be cautious with copies hosted elsewhere; use only files published through the official repository and its Releases page.

> **Repository status:** The complete extension source tree is available in the main branch, with manifest.json at the repository root. You can download the repository as a ZIP or use the Releases page for a versioned package.

---

## ⭐ Project Highlights

- 🔊 **Volume Control** — presets up to 600%.
- 🎚️ **Bass Boost** — adjustable low-frequency enhancement, up to +12 dB.
- 🎤 **Voice Boost** — speech-clarity controls with AUTO and MANUAL modes.
- 🎛️ **Audio Profiles** — per-site settings for supported media sites such as YouTube and Spotify.
- 🎶 **Automatic Genre Detection** — 76 title-based genre/subgenre labels plus five broad audio-only profiles; see [the full catalog and EQ families](AUTO_GENRE_CATALOG.md).
- 📊 **Audio Visualizers** — five spectrum styles plus a spectrogram.
- 💾 **Settings Backup** — import/export settings through .cfg files.
- 🌗 **Themes** — Dark, Light, and System options.
- 🌙 **Night Mode** — audio dynamics control for quieter listening.
- ⚡ **Power Saving** — reduces visualization workload.
- 🎯 **Clipping Detection** — visual warnings when audio peaks are detected.
- 🌐 **Three Languages** — English, Русский, Українська.

## 🐛 Latest Fixes — v4.7.91 source update

- **Genre catalog:** expanded aliases and spelling variants, including additional Russian and Ukrainian names for the existing genre/subgenre IDs.
- **Fewer title false positives:** ambiguous one-word labels such as `house`, `rock`, and `pop` need an exact genre title or nearby music context; specific subgenres retain priority.
- **Safer audio-only fallback:** silence and near-noise-floor samples are not classified; the atmospheric heuristic meets the minimum confidence threshold before application.
- **Status reliability:** confidence and Bass/Voice toggle state are part of the status signature, so meaningful changes can reach the interface.
- **Full reference:** [AUTO_GENRE_CATALOG.md](AUTO_GENRE_CATALOG.md) documents all 81 records, aliases, 12 EQ families, and audio-only rules.

The source branch is updated to v4.7.91. The binary asset listed in Releases remains v4.7.90 until a v4.7.91 release is published. For the earlier release and manual test report (2026-10-25), see [Readme/Readme.md](Readme/Readme.md). The [Validate extension workflow](.github/workflows/validate-extension.yml) runs on pushes and pull requests.

---

## 🔒 Privacy

The project is designed around local audio processing with the Web Audio API. A source-based description of permissions and local storage is available in [PRIVACY.md](PRIVACY.md). The reviewed JavaScript files contain no remote analytics endpoint or telemetry service; see the privacy notes for the limits of this static review.

For vulnerability reporting, see [SECURITY.md](SECURITY.md). Contributors should read [CONTRIBUTING.md](CONTRIBUTING.md), and maintainers should follow [RELEASE_PROCESS.md](RELEASE_PROCESS.md).

---

## ✨ Features in Detail

| Feature | Description |
|---|---|
| 🔊 **Volume 0–600%** | Boost playback beyond the standard 100% using presets. |
| 🎚️ **Bass Boost** | Low-frequency enhancement using a low-shelf filter around 105 Hz, adjustable up to +12 dB. |
| 🎤 **Voice Boost** | Speech clarity enhancement focused around the 1.25 kHz and 2.8 kHz ranges. |
| 📊 **Visualizers** | Spectrum: Bars, Line, Wave, Mirror, and Dots; plus a spectrogram. |
| 🎨 **Themes** | Light, Dark, and System options. |
| 💾 **Settings Backup** | Export/import settings with a .cfg file. |
| 🌙 **Night Mode** | Dynamics control intended for quieter listening. |
| ⚡ **Power Save** | Reduces visualization workload to save CPU. |
| 🎯 **Clipping Detection** | Visual warning when audio peaks are detected. |
| 🌐 **Localization** | Russian, Ukrainian, and English. |

---

## 📸 Screenshots

The screenshots are arranged in a two-column gallery so you can compare the v4.7.90 interface views side by side.

<table>
  <tr>
    <td align="center" width="50%">
      <a href="screenshots/voice-boost-auto-mode.jpg">
        <img src="screenshots/voice-boost-auto-mode.jpg" alt="Voice Boost — Auto Mode" width="100%"/>
      </a>
      <br/><strong>🎛️ Voice Boost — Auto Mode</strong>
    </td>
    <td align="center" width="50%">
      <a href="screenshots/quick-settings-page.jpg">
        <img src="screenshots/quick-settings-page.jpg" alt="Quick Settings" width="100%"/>
      </a>
      <br/><strong>⚡ Quick Settings</strong>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <a href="screenshots/volume-200-clipping-warning.jpg">
        <img src="screenshots/volume-200-clipping-warning.jpg" alt="Volume 200% and clipping warning" width="100%"/>
      </a>
      <br/><strong>🚨 Volume 200% &amp; Clipping Warning</strong>
    </td>
    <td align="center" width="50%">
      <a href="screenshots/visualizer-spectrogram.jpg">
        <img src="screenshots/visualizer-spectrogram.jpg" alt="Visualizer and Spectrogram" width="100%"/>
      </a>
      <br/><strong>📊 Visualizer &amp; Spectrogram</strong>
    </td>
  </tr>
</table>

[Open the screenshots folder](screenshots/) for full-size images.

---

## 📥 Installation

### Current repository contents

The main branch contains the unpacked extension source, including manifest.json, JavaScript, HTML, CSS, localized messages, and icons. You can install from a cloned repository or from the repository ZIP.

### Load unpacked in Microsoft Edge

1. Download and extract the complete source package.
2. Open edge://extensions/ in Microsoft Edge (or chrome://extensions/ in a compatible Chromium browser).
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the extracted project directory containing manifest.json.

Do not select the documentation-only repository directory unless it contains the extension's manifest.json.

---

## 📁 Repository Structure

```text
Volume-Controller-Pro/
├── _locales/
│   ├── en/messages.json
│   ├── ru/messages.json
│   └── uk/messages.json
├── icons/
│   ├── favicon.ico
│   ├── favicon.png
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── lang/
│   ├── en.json
│   ├── ru.json
│   └── uk.json
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
│       ├── sync-release-notes.yml
│       └── validate-extension.yml
├── Readme/
│   ├── Readme.md
│   └── RELEASE_DESCRIPTION_v4.7.90.md
├── screenshots/
├── background.js
├── content.js
├── offscreen.html
├── offscreen.js
├── popup.css
├── popup.html
├── popup.js
├── styles.css
├── manifest.json
├── AUTO_GENRE_CATALOG.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── PRIVACY.md
├── README.md
├── RELEASE_PROCESS.md
└── SECURITY.md
```

### Technologies

| Technology | Purpose |
|---|---|
| Manifest V3 | Browser extension platform |
| Web Audio API | Audio analysis and processing |
| Chrome Extensions API | Browser integration |
| JavaScript | Extension logic |
| HTML & CSS | Popup and settings interface |

---

## 📚 Project documentation

- [Full automatic genre catalog](AUTO_GENRE_CATALOG.md)
- [Changelog](CHANGELOG.md)
- [Privacy notes](PRIVACY.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Release process](RELEASE_PROCESS.md)

## 📄 License

This project is licensed under the **MIT License**. Read the full terms in [LICENSE](LICENSE).

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

---

## 👤 Author

**Maxim Melnikov** — [@Maximka1993271](https://github.com/Maximka1993271)

<p align="center">
  <strong>Made with ❤️ by Maxim Melnikov</strong><br/>
  <sub>Volume Controller Pro v4.7.91</sub>
</p>
