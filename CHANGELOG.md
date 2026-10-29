# Changelog

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
