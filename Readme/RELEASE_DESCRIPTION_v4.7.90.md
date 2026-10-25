# Volume Controller Pro 4.7.90

Audio control and enhancement for Microsoft Edge and compatible Chromium browsers.

## What's new in v4.7.90

- **Voice Boost UI:** restored the AUTO/MANUAL toggle beside the value. The numeric value is displayed cleanly, for example `0 dB`.
- **Track-aware auto-tuning:** genre analysis resets when the track changes to avoid carrying the previous track's profile over to the next one.
- **Capture stability:** serialized tab-close and stream-end handling to reduce race conditions that could affect a newly started capture.
- **AudioContext lifecycle:** closes the audio context when capture stops and waits for closure before creating a new context for the next session.
- **Audio defaults:** tuned the default profile to +4 dB Bass and +2 dB Voice as a moderate starting point.
- **Messaging and cleanup:** improved runtime-message validation, removed an unnecessary silent connection in the analysis graph, and removed the obsolete `youtube-cinema.css` file.
- **Accessibility and localization:** improved labels and translations across English, Russian, and Ukrainian.

## Download

**Microsoft Edge / Chromium:** [Download Volume.Controller.Pro.v4.7.90.zip](https://github.com/Maximka1993271/Volume-Controller-Pro/releases/download/v4.7.90/Volume.Controller.Pro.v4.7.90.zip)

The attached release asset is named `Volume.Controller.Pro.v4.7.90.zip`. Extract the archive, open `edge://extensions/` in Edge, enable **Developer mode**, and choose **Load unpacked**. Select the extracted folder that contains `manifest.json`.

## Validation

Static checks were reported for JavaScript syntax, JSON files, HTML IDs, CSS, localization-key consistency, and ZIP integrity.

**Manual test report (2026-10-25):** the maintainer reports successful use in Microsoft Edge on YouTube, including capture start/stop/restart, tab switching and closing, Bass Boost, Voice Boost, visualizers, and settings import/export. This is a maintainer-reported runtime check; CI provides static validation and does not itself reproduce audio playback.

## Source and archive note

The downloadable asset for this release is exactly `Volume.Controller.Pro.v4.7.90.zip` (606,220 bytes). The historical Git tag `v4.7.90` predates the unpacked source tree now present on `main`; its tag tree contains `Volume_Controller_Pro_GitHub_Ready.zip`. The existing tag is preserved to avoid silently rewriting release history. Future tags will be created from the reviewed source tree.

## Documentation

- [Detailed audit report](https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/Readme/Readme.md)
- [Privacy notes](https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/PRIVACY.md)
- [Security policy](https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/SECURITY.md)
- [Release process](https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/RELEASE_PROCESS.md)

---

Made with ❤️ by [Maxim Melnikov](https://github.com/Maximka1993271).
