# Changelog

## [4.8.30] — 2026-11-22

- Require explicit positive acknowledgements from the offscreen processor for volume/EQ and active visualizer operations; failed or missing responses are no longer treated as successful.
- Prevent optimistic visualizer rendering after failed activation during capture start, recommended-settings application, factory reset or backup import.
- Serialize automatic-genre status persistence, prevent stale writes from replacing newer track status, and retry after failed storage writes.
- Include the active genre profile's volume trim in popup gain-risk calculations so popup warnings match the offscreen audio engine.
- Document and regression-test the Night Mode programme compressor path independently from the optional final Peak Limiter/Safety Ceiling.
- Consolidate release documentation and update the supported source package to Manifest V3 version 4.8.30.
- Automated validation: 133 smoke checks passed; JavaScript syntax, JSON, HTML resources, CSS and extracted ZIP integrity verified.

## [4.8.0–4.8.29] — Feature and UX development

- Added GTA VI visual identity, 25 palettes and themed application icons, volume milestones, visualizers, spectrogram and scrollbar.
- Rebuilt popup layout, settings accordion, collapsible Quick Settings and palette gallery; improved text sizing, width and footer theme integration.
- Added multilingual metadata and theme labels for English, Russian and Ukrainian.
- Improved Bass/Voice AUTO/manual controls, per-card status visibility, recommended settings, backups and legacy-setting migrations.
- Expanded genre catalogue and shared validation; hardened capture lifecycle, AudioContext cleanup, Spotify track identity and MV3 recovery.
- Added repeatable smoke/regression tests and corrected multiple edge cases in offscreen acknowledgement and settings persistence.

## [4.7.93–4.7.99] — Capture lifecycle and shared modules

- Fixed AudioContext cleanup races and made STOP_CAPTURE wait for completed cleanup.
- Added shared validation and genre catalogues, fail-safe initialization, null safety and regression coverage.
- Fixed a background ReferenceError involving the allowed genre ID set.

## [4.7.92] — 2026-10-30

- Recovered visualizer settings and controls after Manifest V3 service-worker restarts.
- Cleared stale automatic genre status at browser startup and when no capture is active.
- Reduced false genre matches caused by ambiguous English, Russian and Ukrainian words in track titles.
- Aligned popup/background URL validation for YouTube and Spotify Web Player.
- Restricted legacy indicator cleanup to supported media hosts.
- Rounded restored Bass/Voice dB values and improved offscreen error reporting.
- Hardened badge handling and popup accessibility.

## [4.7.91] — 2026-10-28

- Expanded multilingual genre aliases and improved ambiguous-word handling.
- Added low-signal gating for audio-only genre classification.
- Improved offscreen document recovery and reduced-motion behavior.
