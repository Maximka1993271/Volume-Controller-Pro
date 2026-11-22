# Troubleshooting

## The popup says capture is unavailable

- Check that the active tab is a supported YouTube video page or Spotify Web Player page.
- Try opening a specific video or track rather than a provider's general landing page.
- Browser-internal pages and pages that prohibit script injection may not be controllable.
- Check the capture-status card for the reason shown for the current tab.

The extension requires a user action to start tab capture. Automatic genre audio analysis waits for an active capture session.

## There is no audio after changing a setting

- Confirm that the browser tab is still playing media.
- Check mute and master volume.
- Check whether a YouTube or Spotify service profile is enabled and whether it contains a different volume or EQ value.
- Toggle the relevant effect off and on once, then check whether the popup confirms the update.
- Stop and restart capture if the capture session has become stale.

In v4.8.31, volume and EQ changes require an explicit success acknowledgement from the offscreen audio processor. If it is missing, the popup treats the update as failed instead of assuming it was applied. Check the displayed error/status, retry, or restart capture.

## The visualizer is blank or does not turn on

- Confirm capture is active and playback is running.
- Check that the spectrum visualizer and spectrogram are enabled.
- Try another spectrum style or palette.
- Enable Power Saving if the popup is using too much CPU.
- If capture is active, check whether the popup confirmed the visualizer command. Unconfirmed activation is not displayed as active.

Visualizer settings saved while capture is inactive can apply at the next capture start.

## A high-gain or clipping warning appears

- Lower master volume or Bass Boost.
- Check whether a YouTube/Spotify profile or active genre profile changes effective gain.
- Keep Peak Limiter enabled when appropriate.

The popup includes the active genre profile's volume trim in its high-gain calculation, matching the offscreen engine.

## Automatic genre detection does not show a genre

This can be expected. The classifier can leave ambiguous or low-signal content unclassified. Audio-only analysis needs enough non-silent measurements and repeated candidate matches. It is not a metadata lookup.

See [Automatic Genre Detection](Automatic-Genre-Detection).

## Settings import is rejected

- Confirm that the selected file is a Volume Controller Pro `.cfg` backup.
- Do not edit the structure or numeric fields manually.
- The v4.8.31 backup schema is 28. A backup from a newer schema may not be accepted by an older extension version.
- Keep the original file and try exporting a fresh backup from the current version.

## The extension changed after an update

After replacing unpacked extension files, reload the extension from `edge://extensions/` and refresh the media tab. If you have important custom settings, export a `.cfg` backup before updating.
