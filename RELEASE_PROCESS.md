# Release Process

## Source of truth

The unpacked extension source belongs in the repository root with `manifest.json` at the root. Source files, README, release notes and archive version must describe the same release.

## Checklist

1. Update `manifest.json` and the user-facing changelog.
2. Update version-specific release notes and limitations. Never claim a manual test passed unless it was performed.
3. Run the **Validate extension** workflow and review its result.
4. Install the candidate in Microsoft Edge. Test audio start/stop/restart, switching and closing captured tabs, YouTube/Spotify track changes, volume/EQ, limiter, visualizers and settings backup import/export.
5. Build the ZIP from the reviewed source commit. It should contain one clearly named project folder with `manifest.json` inside.
6. Compute SHA-256 from the exact ZIP to be uploaded. Use the exact asset name and checksum in README and release notes.
7. Create the version tag from the reviewed source commit, then publish the matching ZIP as that tag's release asset.
8. Verify tag, release body, asset name, checksum and source version on GitHub after publishing.

## Existing v4.7.90 history

The `v4.7.90` tag was created before the unpacked source tree was synchronized into `main`. Its Git tree contains `Volume_Controller_Pro_GitHub_Ready.zip`, while current `main` contains unpacked source files. The published release asset is named `Volume.Controller.Pro.v4.7.90.zip`.

To preserve the historical record, do not force-move the existing tag. From the next release onward, create the tag only after the full source tree and release artifact have been verified together.
