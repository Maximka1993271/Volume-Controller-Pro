# Changelog

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

Static checks were reported and a repeatable GitHub Actions validation workflow is now included. Manual end-to-end verification of audio capture and playback in Microsoft Edge remains necessary.
