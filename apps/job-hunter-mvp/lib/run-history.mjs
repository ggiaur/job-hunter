import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

function safeTimestamp(iso) {
  return iso.replace(/[:.]/g, '-');
}

async function atomicJsonWrite(targetPath, value) {
  const tmpPath = `${targetPath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(value, null, 2), 'utf8');
  await rename(tmpPath, targetPath);
}

/**
 * Persist an exact live-run result set so it remains retrievable after later runs.
 *
 * Writes:
 *   docs/evidence/job-hunter-runs/<timestamp>.json  immutable run snapshot
 *   docs/evidence/job-hunter-runs/latest.json       convenience pointer/copy
 *
 * The caller remains responsible for deciding what counts as accepted/rejected;
 * this helper never mutates or re-scores the result payload.
 */
export async function persistRunHistory(repoRoot, output) {
  if (!repoRoot) throw new Error('repoRoot is required');
  if (!output || typeof output !== 'object') throw new Error('output object is required');

  const generatedAt = output.generatedAt || new Date().toISOString();
  const snapshot = { ...output, generatedAt };
  const runDir = path.join(repoRoot, 'docs', 'evidence', 'job-hunter-runs');
  await mkdir(runDir, { recursive: true });

  const snapshotPath = path.join(runDir, `${safeTimestamp(generatedAt)}.json`);
  const latestPath = path.join(runDir, 'latest.json');

  await atomicJsonWrite(snapshotPath, snapshot);
  await atomicJsonWrite(latestPath, snapshot);

  return { snapshotPath, latestPath };
}
