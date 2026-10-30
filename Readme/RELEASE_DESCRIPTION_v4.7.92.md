# Volume Controller Pro 4.7.92

Audio enhancement for Microsoft Edge and compatible Chromium browsers.

## What's new in v4.7.92

- **Visualizer recovery:** visualizer settings and enable/disable requests reconcile the active capture from the offscreen document after a Manifest V3 service-worker restart.
- **Stale genre status cleanup:** old automatic genre cards are cleared at browser startup and when the popup confirms that no capture is active anywhere.
- **Fewer false genre matches:** ambiguous English and Russian/Ukrainian words such as punk, trap, drill, grime, emo, рок, рэп and трэп no longer trigger genre detection inside ordinary track titles without music context.
- **Consistent URL validation:** popup and background use matching YouTube/Spotify restrictions, including exact hosts, valid video routes and IDs, HTTPS, standard ports, and rejection of embedded credentials.
- **Safer page cleanup:** legacy capture-circle cleanup runs only on supported YouTube and Spotify pages, not arbitrary active tabs.
- **Reliable EQ restoration:** saved Bass/Voice dB values are rounded to integer values before being sent to offscreen; rejected audio updates are logged.
- **Badge error handling:** rejected browser badge API promises are handled without affecting the popup.
- **Accessibility:** the popup status message is announced politely by assistive technology.
- **Popup markup fixes:** corrected favicon dimensions, explicit button types, and fallback version label.
- **Code cleanup:** removed an unused helper and simplified a constant compressor parameter.
- **Backup compatibility:** settings backup schema remains v18; no localization keys or permissions were added.

## Download and install

Download `Volume.Controller.Pro.v4.7.92.zip` from this release, extract it, open `edge://extensions/` in Microsoft Edge (or `chrome://extensions/` in Chromium), enable **Developer mode**, and select **Load unpacked**. Choose the extracted extension directory containing `manifest.json`.

## Validation

Automated checks cover JavaScript syntax, functional regression tests, manifest/locales/HTML resources and static safety invariants. They do not replace manual audio tests in Microsoft Edge with YouTube, Spotify, tab navigation, browser restarts and settings import/export.
