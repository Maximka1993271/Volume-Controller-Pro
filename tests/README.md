# Browser integration tests

These tests launch the real extension in Playwright's bundled Chromium using a temporary browser profile. They exercise the Manifest V3 service worker, popup initialization, capture-status messaging, and settings persistence through the real extension storage API.

Requirements: Node.js and npm.

Run locally from the repository root:

\`\`\`sh
npm install --no-save --no-package-lock playwright@1.64.1
npx playwright install --with-deps --no-shell chromium
node --test tests/extension-browser.test.js
\`\`\`

The tests use a temporary profile and do not touch the browser profile used for everyday browsing. They do not stream real YouTube/Spotify audio or replace a manual test of actual capture in Edge.
