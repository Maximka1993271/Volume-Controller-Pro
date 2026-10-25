<h1 align="center">Volume Controller Pro</h1>

<p align="center">
  <a href="https://github.com/Maximka1993271/Volume-Controller-Pro/releases">
    <img src="https://img.shields.io/badge/version-4.7.90-blue.svg?style=for-the-badge&logo=github" alt="Version"/>
  </a>
  <a href="https://www.microsoft.com/edge">
    <img src="https://img.shields.io/badge/Edge-Chromium-0078D7.svg?style=for-the-badge&logo=microsoft-edge" alt="Edge"/>
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge" alt="License"/>
  </a>
  <a href="https://github.com/Maximka1993271/Volume-Controller-Pro">
    <img src="https://img.shields.io/badge/Open%20Source-✅-brightgreen.svg?style=for-the-badge" alt="Open Source"/>
  </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API">
    <img src="https://img.shields.io/badge/Web%20Audio%20API-Supported-orange.svg?style=for-the-badge&logo=web-audio" alt="Web Audio API"/>
  </a>
  <a href="https://github.com/Maximka1993271/Volume-Controller-Pro">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge&logo=github" alt="PRs Welcome"/>
  </a>
</p>

<p align="center">
  <img src="https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/screenshots/voice-boost-ui.jpg?raw=true" alt="Volume Controller Pro interface preview" width="600"/>
</p>

<p align="center">
  <b>🎛️ Professional Audio Control for Microsoft Edge / Chromium</b><br/>
  Real-time volume amplification, EQ, and audio enhancement for YouTube and Spotify.<br/>
  <b>🔓 Free • Open Source • Privacy First</b>
</p>

---

## ⚠️ Official Source Warning

> **🚨 IMPORTANT: This is the ONLY official distribution channel for Volume Controller Pro.**
>
> This extension is **only published on GitHub** under this repository:
> **[https://github.com/Maximka1993271/Volume-Controller-Pro](https://github.com/Maximka1993271/Volume-Controller-Pro)**
>
> **I DO NOT upload this extension to:**
> - ❌ Chrome Web Store
> - ❌ Microsoft Edge Add-ons Store
> - ❌ Any other websites or file hosting services
>
> **If you find this extension anywhere else, it is NOT the original version and may contain malware, spyware, or modified code.**
>
> **Always download from the official GitHub repository only!**

---

## ⭐ Project Highlights

- ✅ **Free & Open Source** — MIT License
- ✅ **Microsoft Edge & Chromium Browsers**
- ✅ **Volume Control** — Boost up to 600% with quick presets
- ✅ **Bass Boost** — Adjustable low-frequency enhancement (±12 dB)
- ✅ **Voice Boost** — Speech clarity with AUTO/MANUAL modes
- ✅ **Audio Profiles** — Per-site settings for YouTube and Spotify
- ✅ **Audio Visualizers** — 5 spectrum styles + Spectrogram
- ✅ **Settings Backup** — Export/Import via `.cfg` files
- ✅ **Dark / Light / System Themes**
- ✅ **No Ads • No Tracking • No Telemetry**
- ✅ **100% Local Audio Processing**
- ✅ **Night Mode** — Softens dynamics for quiet listening
- ✅ **Power Save Mode** — Reduces CPU load from visualizations
- ✅ **Clipping Detection** — Warns when audio peaks
- ✅ **3 Languages** — English, Русский, Українська
- ✅ **Memory Management & Leak Prevention**

---

## 🐛 Latest Fixes (v4.7.90)

- **Voice Boost UI Restored:** Reverted to the original AUTO/MANUAL pill button next to the value. The numeric value itself is clean (e.g., `0 dB`).
- **Track-Aware Auto-Tuning:** Genre analysis now resets when the track changes, ensuring the previous song's profile doesn't carry over.
- **Capture Race Condition Fixed:** Tab close and stream-end events are now serialized through the main capture queue, preventing new streams from being stopped by stale events.
- **Audio Context Lifecycle:** Properly closes the `AudioContext` after capture stops to free up resources. The next session awaits the close promise before creating a new context.
- **Balance & Optimization:** Default audio profile tuned to the "golden mean" (+4 dB Bass, +2 dB Voice) for a pleasant, non-fatiguing sound.

---

## 🔒 Privacy

All audio processing is performed locally using the Web Audio API.
No advertisements, tracking, telemetry, analytics, or user data collection.
**Your privacy is 100% protected.**

---

## ✨ Features in Detail

| Feature | Description |
|---------|-------------|
| 🔊 **Volume 0–600%** | Boost audio beyond the standard 100% with quick presets. |
| 🎚️ **Bass Boost** | Low-shelf filter at 105Hz, adjustable from 0 to +12 dB. |
| 🎤 **Voice Boost** | Two-band EQ (1.25kHz & 2.8kHz) for speech clarity. |
| 📊 **Visualizers** | Spectrum (Bars, Line, Wave, Mirror, Dots) and Spectrogram. |
| 🎨 **Themes** | Light, Dark, and System (auto-syncs with OS). |
| 💾 **Backup** | Export/Import all settings as a `.cfg` file. |
| 🌙 **Night Mode** | Dynamic compression for late-night listening. |
| ⚡ **Power Save** | Reduces visualization framerate to save CPU. |
| 🎯 **Clipping Detection** | Visual warning when audio peaks are detected. |
| 🌐 **3 Languages** | Русский, Українська, English. |

---

## 📸 Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/screenshots/voice-boost-ui.jpg?raw=true" alt="Voice Boost & Bass Boost" width="400"/>
        <br/>
        <b>🎛️ Voice Boost & Bass Boost</b>
      </td>
      <td align="center">
        <img src="https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/screenshots/volume-controller-ui.png?raw=true" alt="Volume Controller" width="400"/>
        <br/>
        <b>🔊 Volume Controller</b>
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/screenshots/full-equalizer.png?raw=true" alt="Full Equalizer" width="400"/>
        <br/>
        <b>🎛️ Full Equalizer</b>
      </td>
      <td align="center">
        <img src="https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/screenshots/on-player.png?raw=true" alt="On Player" width="400"/>
        <br/>
        <b>🎵 On Player</b>
      </td>
    </tr>
  </table>
</div>

---

## 📥 Download & Installation

### ⚠️ Repository Status

The current `main` branch contains the project README, screenshots, and audit documentation. **The full extension source tree has not yet been synchronized into this repository**, so this repository alone cannot currently be loaded as an unpacked extension.

When the source package is available, follow the instructions below.

### 🔧 Installation (Microsoft Edge / Chromium)

1. Download and extract the source package.
2. Open `edge://extensions/` (or `chrome://extensions/`).
3. Enable **"Developer mode"**.
4. Select **"Load unpacked"**.
5. Choose the extracted directory containing `manifest.json`.

---

## 📁 Repository Structure

```text
Volume-Controller-Pro/
├── 📁 Readme/                # Audit reports and detailed changelogs
├── 📁 screenshots/           # Interface screenshots
├── README.md                 # This file
└── (Source code will be added here)

🛠️ Technologies
Technology	Description
Manifest V3	Chrome/Edge extension standard
Web Audio API	Low-level audio processing
Chrome Extensions API	Browser integration
JavaScript (ES Modules)	Modular architecture
CSS3	Modern, responsive UI
📝 License
No LICENSE file has been added yet. Until a license is chosen, this repository does not grant explicit permission to reuse or redistribute the code.

👤 Author
Maxim Melnikov

GitHub

<p align="center"> <b>Made with ❤️</b><br/> <b>Maxim Melnikov</b> — <a href="https://github.com/Maximka1993271">@Maximka1993271</a> </p><p align="center"> <sub>Volume Controller Pro v4.7.90 — 25 October 2026</sub><br/> <sub>🔓 Open Source — fully open source code</sub> </p> ```
