# Volume Controller Pro 4.8.31

Professional audio control and enhancement for Microsoft Edge and compatible Chromium browsers.

## What's new in v4.8.31

### Visualizers and color themes

- **Two new spectrum styles:** Filled area and Radial, alongside Bars, Line, Wave, Mirror, and Dots.
- **25 GTA VI color palettes** plus the classic palette. The selected GTA palette is used across popup accents, volume milestone colors, the spectrum visualizer, and the spectrogram.
- The four-column palette gallery has accessible click-to-expand behavior and remembers its expanded/collapsed state.
- The popup width is now **460 px**, while its height remains limited for a compact extension window.

### Settings and interface

- Settings are grouped into accessible collapsible categories.
- Quick Settings has its own expand/collapse control, starts collapsed, and saves its state separately from panel visibility.
- The Done button closes the popup without changing audio settings.
- Bass Boost and Voice Boost have independent AUTO/MANUAL preferences and independent visibility controls for their effective-value readouts. Hiding a readout does not change the mode or turn the effect off.
- Added preferences for hiding inactive effect cards and the popup scrollbar.
- The Voice Boost power switch is available in Audio settings.

### Audio protection and processing

- Volume and EQ changes require an explicit successful acknowledgement from the offscreen audio processor. Missing acknowledgements are treated as failures.
- Visualizer settings and enable/disable commands require confirmation while capture is active. The popup does not show an unconfirmed activation as active; settings saved while capture is inactive can be applied at the next capture start.
- High-gain warnings include the active automatic genre profile's volume trim, matching the offscreen engine's effective-gain calculation.
- Added an optional limiter-off warning. Clipping monitoring and the Peak Limiter remain separate controls.
- The Night Mode programme compressor remains connected when the separate final Peak Limiter / Safety Ceiling stage is bypassed.

### Automatic genre detection and capture reliability

- Automatic genre status writes are serialized so a delayed write for an earlier track cannot overwrite the status of a newer track. Failed writes can be retried.
- Capture startup validates current tab and metadata before requesting the single-use tab-capture stream ID.
- Spotify track identity prefers stable now-playing URL/URI data over localized title/artist fallback.

## Recommended balanced settings

The one-click recommended configuration applies:

- Master volume: 100%, unmuted.
- Bass Boost: +4 dB; Voice Boost: +2 dB; both enabled in AUTO mode.
- Peak Limiter and clipping warning enabled; Night Mode disabled.
- Automatic Genre Detection enabled.
- Power Saving enabled in Balanced mode.
- Spectrum visualizer: Bars, 48 bands.
- Spectrogram history: 4 seconds.
- Quick Settings visible and collapsed.
- YouTube and Spotify profiles disabled without deleting their saved values.

The selected language, theme, and GTA VI palette are preserved. These values are a moderate starting point, not a universal acoustic calibration.

## Settings backup compatibility

The v4.8.31 settings backup schema is **28**. Supported older backup schemas are migrated during import. A backup created by a newer extension version may not be accepted by an older version.

Review a `.cfg` backup before sharing it because it can contain user preferences and saved service-profile values.

## Download and install

**Microsoft Edge / Chromium:** [Download Volume.Controller.Pro.v4.8.31.zip](https://github.com/Maximka1993271/Volume-Controller-Pro/releases/download/v4.8.31/Volume.Controller.Pro.v4.8.31.zip)

The [SHA-256 checksum file](https://github.com/Maximka1993271/Volume-Controller-Pro/releases/download/v4.8.31/Volume.Controller.Pro.v4.8.31.zip.sha256) is available alongside the release asset.

1. Extract the ZIP.
2. Open `edge://extensions/` in Microsoft Edge (or `chrome://extensions/` in a compatible Chromium browser).
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the extracted `Volume Controller Pro` folder containing `manifest.json`.

## Validation

The supplied v4.8.31 package passed **134 automated smoke checks** using `node tests/smoke.js`. The archive integrity check also passed and the manifest version is 4.8.31.

Automated checks do not replace manual playback and capture testing in Microsoft Edge. Real audio playback, tab capture, device-specific sound quality, and YouTube/Spotify behavior should still be tested in the target browser.

## Documentation

- [Project Wiki and user guide](https://github.com/Maximka1993271/Volume-Controller-Pro/tree/main/wiki)
- [Main README](https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/README.md)
- [Changelog](https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/CHANGELOG.md)
- [Technical audit and historical notes](Readme.md)

---

Made with ❤️ by [Maxim Melnikov](https://github.com/Maximka1993271).
