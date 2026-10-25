import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXTENSION_URL_PREFIX = 'chrome-extension://';

let context;
let extensionId;
let userDataDir;
let tempRootDir;
let extensionDir;

function findExtensionWorker() {
  return context.serviceWorkers().find((worker) =>
    worker.url().startsWith(EXTENSION_URL_PREFIX + extensionId + '/')
  );
}

async function getExtensionWorker() {
  const existing = findExtensionWorker();
  if (existing) return existing;
  return context.waitForEvent('serviceworker', { timeout: 20000 });
}

async function clearExtensionStorage() {
  const worker = await getExtensionWorker();
  await worker.evaluate(async () => {
    await chrome.storage.local.clear();
  });
}

async function openPopupPage(resetStorage = false) {
  if (resetStorage) await clearExtensionStorage();

  const page = await context.newPage();
  await page.goto(EXTENSION_URL_PREFIX + extensionId + '/popup.html');

  // Wait until the popup finishes loading persisted settings and determines
  // that the current extension page is not a capturable media tab.
  await page.waitForFunction(() => {
    const slider = document.querySelector('#volumeSlider');
    const settingsButton = document.querySelector('#settingsBtn');
    return slider && slider.disabled === true &&
      settingsButton && settingsButton.getAttribute('aria-expanded') === 'false' &&
      document.querySelector('#settingsBassBoostToggle')?.disabled === false;
  }, null, { timeout: 20000 });

  return page;
}

before(async () => {
  tempRootDir = await mkdtemp(join(tmpdir(), 'volume-controller-pro-e2e-'));
  userDataDir = join(tempRootDir, 'profile');
  extensionDir = join(tempRootDir, 'extension');
  await mkdir(userDataDir, { recursive: true });

  // Load a temporary copy of the production extension with only the test host
  // permission needed to inspect the synthetic YouTube test tab. The shipped
  // manifest is never modified and the added permission is not released.
  const excludedDirectories = new Set(['.git', 'node_modules', '.github', 'tests']);
  await cp(ROOT, extensionDir, {
    recursive: true,
    filter: (source) => {
      const pathFromRoot = relative(ROOT, source);
      return !pathFromRoot || !pathFromRoot.split(sep).some((part) => excludedDirectories.has(part));
    }
  });
  const manifestPath = join(extensionDir, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.host_permissions = [...new Set([
    ...(Array.isArray(manifest.host_permissions) ? manifest.host_permissions : []),
    'https://www.youtube.com/*'
  ])];
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chromium',
    args: [
      '--disable-extensions-except=' + extensionDir,
      '--load-extension=' + extensionDir,
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  let worker = context.serviceWorkers().find((item) =>
    item.url().startsWith(EXTENSION_URL_PREFIX)
  );
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 20000 });

  const workerUrl = new URL(worker.url());
  extensionId = workerUrl.hostname;
  assert.ok(extensionId, 'Chromium should register the extension service worker');
});

after(async () => {
  if (context) await context.close();
  if (tempRootDir) await rm(tempRootDir, { recursive: true, force: true });
});

test('Manifest V3 service worker starts and exposes the packaged version', async () => {
  const worker = await getExtensionWorker();
  const manifest = await worker.evaluate(() => chrome.runtime.getManifest());

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, '4.7.90');
  assert.equal(manifest.background.service_worker, 'background.js');
});

test('opening the popup does not start audio capture and gates audio controls', async () => {
  const page = await openPopupPage(true);
  try {
    assert.equal(await page.title(), 'Volume Controller Pro');
    assert.equal((await page.locator('#extensionVersion').textContent()).trim(), '4.7.90');
    assert.equal(await page.locator('#settingsBtn').isVisible(), true);
    assert.equal(await page.locator('#volumeSlider').isDisabled(), true);
    assert.equal(await page.locator('#muteButton').isDisabled(), true);

    const captureStatus = await page.evaluate(async () =>
      chrome.runtime.sendMessage({ type: 'GET_CAPTURE_STATUS' })
    );
    assert.equal(captureStatus.success, true);
    assert.equal(captureStatus.active, false);
  } finally {
    await page.close();
  }
});

test('settings interactions persist across popup reopen', async () => {
  const page = await openPopupPage(true);
  try {
    await page.locator('#settingsBtn').click();
    assert.equal(await page.locator('#settingsPanel').isVisible(), true);
    assert.equal(await page.locator('#settingsBtn').getAttribute('aria-expanded'), 'true');

    await page.locator('#themeSelect').selectOption('dark');
    await page.waitForFunction(async () =>
      (await chrome.storage.local.get('themeMode')).themeMode === 'dark'
    );

    const bassToggle = page.locator('#settingsBassBoostToggle');
    assert.equal(await bassToggle.isEnabled(), true);
    assert.equal(await bassToggle.isChecked(), true);
    await bassToggle.locator('xpath=..').click();
    await page.waitForFunction(async () =>
      (await chrome.storage.local.get('bassBoostEnabled')).bassBoostEnabled === false
    );

    await page.locator('#languageSelect').selectOption('en');
    await page.waitForFunction(async () =>
      (await chrome.storage.local.get('language')).language === 'en'
    );

    await page.locator('#settingsCloseBtn').click();
    assert.equal(await page.locator('#settingsPanel').isVisible(), false);
  } finally {
    await page.close();
  }

  const reopenedPage = await openPopupPage();
  try {
    await reopenedPage.locator('#settingsBtn').click();
    assert.equal(await reopenedPage.locator('#themeSelect').inputValue(), 'dark');
    assert.equal(await reopenedPage.locator('#languageSelect').inputValue(), 'en');
    assert.equal(await reopenedPage.locator('#settingsBassBoostToggle').isChecked(), false);
  } finally {
    await reopenedPage.close();
  }
});


test('tab audio capture starts, receives a synthetic tone, and stops cleanly', async () => {
  const playerUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  await context.route(playerUrl, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Volume Controller Pro audio test tone</title></head>
<body>
  <button id="start-tone" type="button">Start audio test tone</button>
  <script>
    document.querySelector('#start-tone').addEventListener('click', async () => {
      const audio = new AudioContext();
      await audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      gain.gain.value = 0.2;
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      window.__vcpTestAudioContext = audio;
      window.__vcpTestOscillator = oscillator;
      window.__vcpTestToneStarted = true;
      document.body.dataset.audio = 'playing';
    });
  </script>
</body>
</html>`
    });
  });

  // Open the extension page before the player tab. The real toolbar popup is
  // browser chrome and isn't exposed through Playwright's context.pages().
  const popup = await openPopupPage();
  const player = await context.newPage();
  let captureStarted = false;

  try {
    await player.goto(playerUrl, { waitUntil: 'domcontentloaded' });
    assert.match(await player.title(), /audio test tone/i);
    await player.locator('#start-tone').click();
    await player.waitForFunction(() => window.__vcpTestToneStarted === true);

    const worker = await getExtensionWorker();
    const activeTabBeforePopup = await worker.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      return tab ? { id: tab.id, url: tab.url } : null;
    });
    assert.ok(activeTabBeforePopup, 'test player tab should be active');
    assert.equal(activeTabBeforePopup.url, playerUrl);

    // Reload the extension page while the YouTube tab is active so popup.js
    // resolves that tab as its target. Reloading a background tab must not
    // switch the active media tab.
    await popup.reload();
    await popup.waitForFunction(() => {
      const enableButton = document.querySelector('#enableExtensionBtn');
      return enableButton && !enableButton.disabled;
    }, null, { timeout: 20000 });

    const activeTabBeforeStart = await worker.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      return tab ? { id: tab.id, url: tab.url } : null;
    });
    assert.equal(activeTabBeforeStart?.id, activeTabBeforePopup.id,
      'the player tab should remain active while the extension page is inspected');

    // Dispatch in-page clicks so Playwright doesn't focus the extension tab and
    // accidentally change the active tab the service worker is required to capture.
    await popup.locator('#enableExtensionBtn').click();
    await popup.waitForFunction(() =>
      document.querySelector('#disableExtensionBtn')?.getAttribute('aria-pressed') === 'true'
    , null, { timeout: 20000 });

    captureStarted = true;
    const runningStatus = await worker.evaluate(async () =>
      chrome.runtime.sendMessage({ type: 'GET_CAPTURE_STATUS' })
    );
    assert.equal(runningStatus.success, true);
    assert.equal(runningStatus.active, true);
    assert.equal(runningStatus.tabId, activeTabBeforePopup.id);

    // The test page emits a continuous 440 Hz sine wave. The offscreen analyzer
    // must observe non-zero spectrum bands instead of merely reporting a live track.
    await popup.waitForFunction(() => spectrumState.hasSignal === true, null, { timeout: 15000 });
    const spectrum = await popup.evaluate(() => ({
      active: spectrumState.captureActive,
      hasSignal: spectrumState.hasSignal,
      maxBand: Math.max(0, ...spectrumState.target)
    }));
    assert.equal(spectrum.active, true);
    assert.equal(spectrum.hasSignal, true);
    assert.ok(spectrum.maxBand > 0.045, 'captured tone should produce a measurable spectrum');

    await popup.locator('#disableExtensionBtn').click();
    await popup.waitForFunction(() =>
      document.querySelector('#disableExtensionBtn')?.getAttribute('aria-pressed') === 'false'
    , null, { timeout: 20000 });
    const stoppedStatus = await worker.evaluate(async () =>
      chrome.runtime.sendMessage({ type: 'GET_CAPTURE_STATUS' })
    );
    assert.equal(stoppedStatus.success, true);
    assert.equal(stoppedStatus.active, false);
    captureStarted = false;
  } finally {
    if (captureStarted) {
      const worker = await getExtensionWorker().catch(() => null);
      if (worker) await worker.evaluate(async () =>
        chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' }).catch(() => null)
      ).catch(() => null);
    }
    if (popup && !popup.isClosed()) await popup.close().catch(() => {});
    await player.evaluate(() => {
      try { window.__vcpTestOscillator?.stop(); } catch {}
      try { window.__vcpTestAudioContext?.close(); } catch {}
    }).catch(() => {});
    await player.close().catch(() => {});
    await context.unroute(playerUrl);
  }
});
