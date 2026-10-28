# Volume Controller Pro 4.7.91

Audio enhancement for Microsoft Edge and compatible Chromium browsers.

## What's new in v4.7.91

- **Automatic genre detection:** expanded English spelling variants and Russian/Ukrainian aliases across the existing genre catalog.
- **Safer genre aliases:** removed the ambiguous short forms `anime op`, `r b`, and `d and b`; retained `anime opening`, `r and b` / `rnb` / `r&b`, and `dnb` / `drum n bass` / `drum and bass`.
- **Ampersand-aware matching:** aliases such as `r&b` and `rock & roll` now require the literal `&` in the title, so `R&B Hits` still matches while `R B Session` does not. Non-ampersand aliases such as `rock and roll` remain supported.
- **Matching efficiency:** literal ampersand pairs are precomputed once per title and reused for every alias.
- **Fewer false positives:** common single words such as `house`, `rock`, and `pop` are treated cautiously in ordinary track titles, while specific genre phrases retain priority.
- **Safer audio-only classification:** silent or near-noise-floor input is not classified, and the atmospheric profile uses a confidence floor consistent with the classifier's application threshold.
- **Status updates:** confidence and Bass/Voice toggle states are included in status-change detection.
- **Full genre reference:** the package includes `AUTO_GENRE_CATALOG.md`, documenting all 81 records, aliases, 12 EQ profile families, and audio-only heuristics.

## Download and install

Download `Volume.Controller.Pro.v4.7.91.zip` from this release, extract it, open `edge://extensions/` in Microsoft Edge (or `chrome://extensions/` in Chromium), enable **Developer mode**, and select **Load unpacked**. Choose the extracted `Volume Controller Pro` directory containing `manifest.json`.

The accompanying `Volume.Controller.Pro.v4.7.91.zip.sha256` file contains the SHA-256 checksum for verifying the ZIP.

## Validation

The repository's GitHub Actions workflow checks JavaScript syntax, automated functional tests, manifest/locales/HTML resource integrity, and static safety invariants. CodeQL security analysis is also run on pull requests.

Automated static checks do not replace manual listening tests across different websites, browsers, and audio devices.
