import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { loadSearchCredential } from './credentials.mjs';

test('runtime environment is preferred; absent key permits independent acquisition; fake fallback is not a key', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'jh-key-test-'));
  const secretPath = path.join(root, 'key.env');
  try {
    assert.equal(await loadSearchCredential({ env: { SERPAPI_API_KEY: 'test-only' }, secretPath }), 'test-only');
    assert.equal(await loadSearchCredential({ env: {}, secretPath }), null);
    await writeFile(secretPath, 'SERPAPI_API_KEY=GITHUB_DIRECT_PROFESSION_FALLBACK\n');
    assert.equal(await loadSearchCredential({ env: {}, secretPath }), null);
    await writeFile(secretPath, 'SERPAPI_API_KEY=local-test-only\n');
    assert.equal(await loadSearchCredential({ env: {}, secretPath }), 'local-test-only');
    assert.equal(await loadSearchCredential({ env: { SERPAPI_API_KEY: 'env-test-only' }, secretPath }), 'env-test-only');
  } finally { await rm(root, { recursive: true, force: true }); }
});
