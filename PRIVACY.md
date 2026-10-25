# Privacy Notes

Last reviewed: 2026-10-25. This document describes a static review of the repository's `main` source tree; verify the release archive independently.

## Audio processing

Volume Controller Pro captures audio from a tab when the user starts the feature and processes it with browser Web Audio APIs. Audio processing is designed to run locally in the browser.

The reviewed JavaScript files contain no remote analytics endpoint or telemetry service, and no call that sends captured audio to a developer-controlled server. The translation loader uses `fetch()` with `chrome.runtime.getURL()` to load a packaged local file.

## Local data

The extension uses `chrome.storage.local` for settings and state, including volume/EQ preferences, visualization options, site profiles and automatic genre status. Track-aware status can include a title, platform-specific track identifier, detected genre, confidence/state values and update time.

Settings backups (`.cfg`) are created or imported at the user's request. Review a backup before sharing it; it may contain personal preferences and site-specific settings.

## Permissions

- `activeTab`: access to a user-selected tab for an explicit action.
- `scripting`: inject extension scripts/styles or run cleanup/inspection functions in supported tabs.
- `storage`: save settings and local extension state.
- `tabCapture`: capture audio from the selected tab after capture is started.
- `offscreen`: run audio processing in an offscreen extension document.

The manifest does not declare broad `host_permissions` or `externally_connectable`. Browser pages that prohibit script injection may not be controllable.

## Limits

This is a source-based static review, not independent network monitoring of every runtime path or of a binary release. Review this document again whenever permissions, networking or storage behavior changes. Real-world testing in Microsoft Edge is needed to validate capture and lifecycle behavior.
