# Getting Started

## Requirements

- Microsoft Edge or a compatible Chromium browser.
- A supported media page. The project specifically tests YouTube video routes and the Spotify Web Player.
- Permission to use the extension on the selected tab.

The extension uses Manifest V3 and declares a minimum Chrome version of 116 in its manifest. Browser vendors may impose additional restrictions on protected pages.

## Download and install in Microsoft Edge

1. Open the [v4.8.31 release](https://github.com/Maximka1993271/Volume-Controller-Pro/releases/tag/v4.8.31).
2. Download `Volume.Controller.Pro.v4.8.31.zip`.
3. Extract the ZIP. Open the extracted **Volume Controller Pro** folder and locate `manifest.json`.
4. In Edge, open `edge://extensions/`.
5. Turn on **Developer mode**.
6. Select **Load unpacked**.
7. Choose the extracted **Volume Controller Pro** folder that contains `manifest.json`.

For another compatible Chromium browser, open its extensions page (for example, `chrome://extensions/`) and follow the equivalent steps.

Do not select a parent folder that does not contain `manifest.json`.

## Start using it

1. Open a YouTube video or the Spotify Web Player.
2. Open the Volume Controller Pro extension popup.
3. Check the capture-status card. It reports whether the current tab can be captured.
4. Start capture from the extension's capture control. Capture is user-initiated; automatic genre audio analysis waits for an active capture.
5. Adjust master volume, Bass Boost, Voice Boost, and visualizer settings.

The extension does not promise capture on every website or every browser-internal page. If the current tab is not eligible, use one of the supported media pages.

## Update the extension

1. Download and extract the new release ZIP.
2. Keep the new folder in a stable location.
3. Open `edge://extensions/`.
4. Use **Reload** on the extension after replacing the unpacked files, or remove the old unpacked installation and load the new folder.

Keep your `.cfg` settings backup before major changes. See [Settings and Backups](Settings-and-Backups).
