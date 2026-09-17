import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { currentResultsMarkdown, publishCurrentReports } from './current-report.mjs';

const run = {
  generatedAt: '2026-09-16T21:00:00Z', candidateSourceSha256: 'test-source-hash', candidateProfileVersion: 'test',
  searchCredentialAvailable: false, confirmedJobAdPages: 2,
  results: [
    { title: 'IT vezető', company: 'Example', url: 'https://example.org/job', visible: true, relevancePercent: 80,
      candidateReview: { matches: [{ label: 'Csapatvezetés' }] }, mismatchReasons: ['Angol ellenőrizendő.'] },
    { title: 'Rejected job', company: 'Rejected', url: 'https://example.org/rejected', visible: true, relevancePercent: 99, poDecision: 'DO_NOT_APPLY' },
  ],
  excluded: [], unreachable: [], canaries: [{ id: 'canary', status: 'NOT_ACQUIRED' }],
};

test('current Markdown keeps risks and prior rejections distinct from candidate counts', () => {
  const markdown = currentResultsMarkdown(run, { snapshotRelative: 'snapshot.json', htmlRelative: 'current.html' });
  assert.match(markdown, /jelöltek:\*\* 1/);
  assert.ok(!markdown.includes('Rejected job'));
  assert.match(markdown, /Angol ellenőrizendő/);
  assert.match(markdown, /kulcs hiányában kihagyva; csökkent lefedettség/);
  assert.ok(markdown.includes('NOT\\_ACQUIRED'));
  assert.match(markdown, /test-source-hash/);
});

test('local and cron publishing use an immutable run plus repo-root decisions regardless of current directory', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'jh-current-report-'));
  try {
    const dir = path.join(root, 'docs/evidence/job-hunter-runs');
    await mkdir(dir, { recursive: true });
    const snapshotPath = path.join(dir, 'snapshot.json');
    const source = JSON.stringify(run);
    await writeFile(snapshotPath, source);
    await writeFile(path.join(root, 'docs/evidence/po-decisions.json'), JSON.stringify({
      'https://example.org/job': { poDecision: 'DO_NOT_APPLY', poReason: 'Friss döntés' },
    }));
    const { htmlPath, markdownPath } = await publishCurrentReports(root, snapshotPath);
    assert.equal(await readFile(snapshotPath, 'utf8'), source);
    const markdown = await readFile(markdownPath, 'utf8');
    const html = await readFile(htmlPath, 'utf8');
    assert.match(markdown, /jelöltek:\*\* 0/);
    assert.match(html, /job-hunter-runs\/snapshot.json/);
    assert.match(html, /data-po-decision="DO_NOT_APPLY"\s+style="display:none;"/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('unsafe vacancy link schemes and markup are not published as executable links', () => {
  const unsafe = structuredClone(run);
  unsafe.results[0].title = '<script>alert(1)</script>';
  unsafe.results[0].url = 'javascript:alert(1)';
  const markdown = currentResultsMarkdown(unsafe, { snapshotRelative: 'snapshot.json', htmlRelative: 'current.html' });
  assert.ok(!markdown.includes('javascript:'));
  assert.ok(!markdown.includes('<script>'));
});

test('GitHub Markdown points to uploaded evidence, not uncommitted repository files', () => {
  const markdown = currentResultsMarkdown({ ...run, githubRunUrl: 'https://github.com/example/jobs/actions/runs/123' }, { snapshotRelative: 'uncommitted.json', htmlRelative: 'uncommitted.html' });
  assert.match(markdown, /https:\/\/github.com\/example\/jobs\/actions\/runs\/123/);
  assert.match(markdown, /job-hunter-live-evidence/);
  assert.ok(!markdown.includes('uncommitted'));
});
