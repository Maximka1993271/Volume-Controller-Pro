'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
test('v4.8.31 production smoke suite passes', () => {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'smoke.js')], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 16 * 1024 * 1024
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, [result.stdout, result.stderr].filter(Boolean).join('\n'));
  assert.match(result.stdout || '', /134 smoke checks passed/);
});
