import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXTENSION_URL_PREFIX = 'chrome-extension://';

let context;
let extensionId;
let userDataDir;

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
      settingsButton && settingsButton.getAttribute('aria-expanded') === 'false';
  }, null, { timeout: 20000 });

  return page;
}

before(async () => {
  userDataDir = await mkdtemp(join(tmpdir(), 'volume-controller-pro-e2e-'));
  context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: 'chromium',
    args: [
      '--disable-extensions-except=' + ROOT,
      '--load-extension=' + ROOT
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
  if (userDataDir) await rm(userDataDir, { recursive: true, force: true });
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
    await bassToggle.uncheck();
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
