# Release Notes — v4.8.31

This page summarizes the v4.8.31 changes documented by the supplied release archive and the repository README.

## Interface and visualizers

- Added **Filled area** and **Radial** spectrum visualizer styles.
- Added support for 25 GTA VI color palettes and matching visualization colors.
- Improved the visualizer and spectrogram theme integration.
- Widened the extension popup to 460 px.
- Added and refined Quick Settings, collapsible settings categories, and interface visibility preferences.

## Audio and state reliability

- Volume and EQ changes require an explicit successful response from the offscreen audio processor.
- Visualizer settings and enable/disable commands require confirmation during active capture.
- The popup avoids showing visualizer activation optimistically when the audio pipeline has not confirmed it.
- Automatic genre status writes are serialized so an older track update cannot overwrite a newer track's status; failed writes can be retried.
- High-gain warning calculations include the active genre profile's volume trim.
- The Night Mode programme compressor remains connected when the separate final Peak Limiter / Safety Ceiling stage is bypassed.

## Recommended balanced settings

The one-click recommended configuration uses:

- Master volume: 100%, unmuted.
- Bass Boost: +4 dB; Voice Boost: +2 dB; both enabled in AUTO mode.
- Peak Limiter and clipping warning enabled.
- Night Mode disabled.
- Automatic Genre Detection enabled.
- Power Saving enabled in Balanced mode.
- Bars visualizer, 48 bands, and 4-second spectrogram history.
- YouTube and Spotify profiles disabled without deleting their saved values.

The selected language, theme, and GTA VI palette are preserved.

## Validation

The supplied v4.8.31 package passed **134 automated smoke checks** using `node tests/smoke.js`. This does not replace real playback and capture testing in Microsoft Edge.
