# Contributing

Thanks for helping improve Volume Controller Pro.

## Before opening a pull request

- Explain the user-visible problem and expected behavior.
- Keep changes focused and avoid unrelated formatting or generated artifacts.
- Preserve compatibility with existing `.cfg` backups. If the settings schema changes, document migration behavior and test old backup files.
- Keep English, Russian and Ukrainian translations in sync.
- Do not add remote telemetry, analytics or network endpoints without documenting the privacy impact.
- Update README, changelog, release notes or screenshots when user-facing behavior changes.
- Never commit API keys, tokens, personal browsing data, exported settings, or private logs.

## Validation

The **Validate extension** GitHub Actions workflow runs on pushes and pull requests. It checks JavaScript syntax, the manifest, required assets, locale JSON, translation-key parity, HTML IDs and local resource references.

Also test the extension in Microsoft Edge with relevant scenarios. Static checks cannot fully verify audio capture/playback. At minimum, test start/stop/restart capture, tab switching and closing, YouTube/Spotify track changes, Bass Boost, Voice Boost, limiter, visualizers and settings import/export when affected.

## Release changes

See [RELEASE_PROCESS.md](RELEASE_PROCESS.md). Tag releases from the reviewed commit that contains the complete source tree, and build the downloadable archive from that same commit.
