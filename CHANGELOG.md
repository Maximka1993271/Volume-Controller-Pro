# Changelog

## [Unreleased]

## [4.8.31] — 2026-11-22

### Interface, themes, and visualizers

- Added the **Filled area** and **Radial** spectrum visualizer styles, with English, Russian, and Ukrainian labels.
- Added **25 GTA VI color palettes** plus the classic palette. The active GTA palette updates popup accents, volume milestone colors, the frequency visualizer, and the spectrogram.
- Added a four-column, accessible palette gallery with a saved expand/collapse preference.
- Added GTA VI theme support to both the spectrum visualizer and spectrogram.
- Widened the popup to **460 px** while retaining its height limit.
- Grouped settings into accessible collapsible categories and added a bottom **Done** button.
- Added a dedicated Quick Settings expand/collapse control. Quick Settings starts collapsed, and its expanded state is saved independently of panel visibility.
- Added a saved scrollbar visibility preference.

### Audio controls and protection

- Added independent Bass Boost and Voice Boost AUTO/MANUAL preferences. Toggling global genre detection no longer forces either effect back to AUTO.
- Added independent visibility preferences for the Bass and Voice AUTO/MANUAL dB readouts; hiding a readout does not change the mode or processing.
- Added the Voice Boost power toggle to Audio settings.
- Added **Hide inactive effects** and an optional limiter-off warning.
- Updated high-gain warning calculations to include the active genre profile's volume trim, matching the offscreen engine.
- Kept the Night Mode programme compressor connected when the separate final Peak Limiter / Safety Ceiling stage is bypassed.

### Reliability and backup compatibility

- Volume and EQ updates now require an explicit successful acknowledgement from the offscreen audio processor; missing acknowledgements are treated as failures.
- Visualizer settings and enable/disable commands require confirmation during active capture. The popup no longer displays an unconfirmed visualizer state as active; deferred settings are applied at the next capture start.
- Serialized automatic genre status writes so a delayed update for an earlier track cannot overwrite a newer track's status; failed writes can be retried.
- Improved capture startup validation and metadata ordering before requesting the single-use tab-capture stream ID; improved stable Spotify track identity selection.
- Added the Quick Settings expanded/collapsed preference to settings backup **schema version 28**, retaining compatibility migrations for supported older backups.

### Recommended configuration and validation

- Updated the recommended balanced configuration: 100% volume, Bass +4 dB, Voice +2 dB, Peak Limiter and clipping warning enabled, Night Mode disabled, Automatic Genre Detection enabled, Balanced Power Saving, Bars at 48 bands, and 4-second spectrogram history. Saved YouTube and Spotify profiles are disabled without deleting their values; language, theme, and GTA palette are preserved.
- The supplied v4.8.31 package passes **134 automated smoke checks** with `node tests/smoke.js`. Automated checks do not replace manual playback and capture testing in Microsoft Edge.
- Synchronized the repository's source tree and documentation with the published v4.8.31 archive.

## [4.7.92] — 2026-10-30

- Recover visualizer settings and control requests from the offscreen capture state after a service-worker restart, using the serialized capture queue.
- Clear stale automatic genre status at browser startup and when the popup confirms that no capture is active.
- Prevent false genre matches from ambiguous English and Russian/Ukrainian single words in ordinary track titles; normalize Cyrillic aliases consistently.
- Align popup YouTube/Spotify URL checks with the background allowlist, including host, route, video ID, HTTPS, port, and credential validation.
- Limit obsolete page-indicator cleanup to supported YouTube and Spotify hosts.
- Round restored Bass/Voice dB settings to integer values and log rejected offscreen updates.
- Handle rejected badge API promises; improve status announcements and popup markup semantics.
- Remove unused popup state helper and simplify a constant compressor knee value.
- Bump extension version to 4.7.92. Backup schema remains v18; no localization keys added.

## [4.7.91] — 2026-10-28

- Expanded automatic genre aliases with additional English variants and Russian/Ukrainian names for existing genre/subgenre IDs.
- Added safeguards against false positives from ambiguous single words in ordinary titles and preserved preference for specific subgenres.
- Added a low-signal gate so silence or near-noise-floor input does not trigger genre changes.
- Raised the atmospheric audio heuristic to the classifier's minimum confidence threshold.
- Included confidence and Bass/Voice enable states in the status signature so meaningful UI changes are not suppressed.
- Added the full [AUTO_GENRE_CATALOG.md](AUTO_GENRE_CATALOG.md) reference.
- Synced the complete alias table from the v4.7.91 archive into `offscreen.js` and the documentation.
- Recreate the offscreen document when the browser closes it independently; verify this lifecycle with a regression test.
- Respect reduced-motion preferences in the page volume indicator.

User-facing highlights for published releases. Older implementation and audit history is preserved in [Readme/Readme.md](Readme/Readme.md).

## [4.7.90] — 2026-10-25

- Restored the Voice Boost AUTO/MANUAL toggle beside the numeric value.
- Reset track-aware genre analysis when the active track changes.
- Serialized tab-close and stream-end capture handling to reduce lifecycle race conditions.
- Improved AudioContext shutdown and restart handling.
- Set balanced starting defaults to +4 dB Bass and +2 dB Voice.
- Tightened extension message validation and removed an unnecessary connection in the analysis graph.
- Improved accessibility labels and EN/RU/UK localization.
- Removed obsolete `youtube-cinema.css`.

### Validation status

Static checks are now run by a repeatable GitHub Actions workflow. On 2026-10-25, the maintainer reported successful manual use in Microsoft Edge on YouTube, including capture lifecycle, tab changes/closing, Bass Boost, Voice Boost, visualizers, and settings import/export. This runtime report is separate from the automated static checks.
