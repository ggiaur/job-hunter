import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { persistRunHistory } from './run-history.mjs';

test('persistRunHistory writes immutable snapshot and latest copy without changing payload', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'job-hunter-history-'));
  const output = {
    generatedAt: '2026-09-04T11:15:30.123Z',
    accepted: [{ title: 'IT csoportvezető', score: 82 }],
    rejected: [{ title: 'Helpdesk munkatárs', reason: 'excluded' }],
  };

  const { snapshotPath, latestPath } = await persistRunHistory(repoRoot, output);

  assert.equal(
    path.basename(snapshotPath),
    '2026-09-04T11-15-30-123Z.json',
  );

  const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
  const latest = JSON.parse(await readFile(latestPath, 'utf8'));

  assert.deepEqual(snapshot, output);
  assert.deepEqual(latest, output);
});
