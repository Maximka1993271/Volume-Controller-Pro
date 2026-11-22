# Privacy and Permissions

## Local audio processing

The project is designed to process captured tab audio locally in the browser using Web Audio APIs and an offscreen extension document.

The repository's privacy review reports no remote analytics endpoint or telemetry service in the reviewed JavaScript files, and no call that sends captured audio to a developer-controlled server. This is a source-based static review, not independent network monitoring of every runtime path or binary release.

## Local storage

The extension uses `chrome.storage.local` for settings and local extension state. This can include:

- Volume and EQ preferences.
- Visualization and appearance settings.
- Saved YouTube and Spotify service profiles.
- Automatic genre state, including track title, platform-specific track identifier, detected genre, confidence/state, and update time.

Settings backups are generated or imported at the user's request. Review a `.cfg` file before sharing it because it can contain personal preferences and site-specific settings.

## Manifest permissions

The v4.8.31 manifest declares:

| Permission | Purpose documented by the project |
|---|---|
| `activeTab` | Access a user-selected tab for an explicit action |
| `scripting` | Inject extension scripts/styles or run supported tab cleanup/inspection functions |
| `storage` | Save settings and local extension state |
| `tabCapture` | Capture audio from the selected tab after capture is started |
| `offscreen` | Run audio processing in an offscreen extension document |

The manifest does not declare broad `host_permissions` or `externally_connectable`.

## Practical privacy advice

- Do not share settings backups without reviewing them.
- Remove personal information and session data from logs and screenshots before reporting an issue.
- Use the official [security policy](https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/SECURITY.md) for vulnerability reports.
- Review the source and permissions again whenever the extension is updated.

See the full [repository privacy notes](https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/PRIVACY.md).
