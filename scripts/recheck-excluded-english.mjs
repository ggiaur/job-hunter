#!/usr/bin/env node
// Re-evaluate the adverts a previous live run HARD-EXCLUDED for "mandatory
// advanced English", using the current (fixed) detector.
//
// Why this exists: a hard exclusion removes the advert from the report
// entirely, so a false positive is invisible to the Product Owner -- he cannot
// review what he was never shown. The comma-boundary bug in the
// advanced-English detector (see lib/english-level-conflation.test.mjs) means
// past runs excluded adverts whose text only stated a *degree* requirement next
// to an unqualified "angol" mention.
//
// Cost: ZERO search-API quota. It re-fetches only URLs a previous run already
// discovered and paid for, straight from the committed run snapshot.
//
// Usage:
//   node scripts/recheck-excluded-english.mjs [snapshot.json] [--limit N]
//
// Output: docs/evidence/english-recheck-<ISO>.json  (+ a summary on stdout)

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractJobPostingSchema } from '../apps/job-hunter-mvp/lib/extract.mjs';
import { loadProfile } from '../apps/job-hunter-mvp/lib/profile.mjs';
import { reviewJobPosting } from '../apps/job-hunter-mvp/lib/vacancy-review.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SNAPSHOT = path.join(ROOT, 'docs/evidence/real-job-hunter-current-run.json');
const PROFILE_DIR = path.join(ROOT, 'profile');
const CONCURRENCY = 5;
const TIMEOUT_MS = 12000;

function parseArgs(argv) {
  const positional = [];
  let limit = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--limit') {
      limit = Number(argv[i + 1]);
      i += 1; // consume the value so it is not mistaken for the snapshot path
    } else if (arg.startsWith('--limit=')) {
      limit = Number(arg.slice('--limit='.length));
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }
  return { snapshot: positional[0] || DEFAULT_SNAPSHOT, limit: Number.isFinite(limit) ? limit : null };
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
        'Accept-Language': 'hu-HU,hu;q=0.9,en;q=0.8',
      },
    });
    const html = await res.text();
    return { ok: res.ok, status: res.status, html };
  } catch (err) {
    return { ok: false, status: null, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const out = new Array(items.length);
  let index = 0;
  let done = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      out[i] = await fn(items[i]);
      done += 1;
      if (done % 20 === 0 || done === items.length) {
        process.stdout.write(`  ${done}/${items.length} újraellenőrizve\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function main() {
  const { snapshot, limit } = parseArgs(process.argv.slice(2));
  const run = JSON.parse(await readFile(snapshot, 'utf8'));
  const profile = await loadProfile(PROFILE_DIR);

  const englishExcluded = (run.excluded || []).filter((e) =>
    /angol/i.test(e.exclusionReason || '')
  );
  const targets = limit ? englishExcluded.slice(0, limit) : englishExcluded;

  console.log('=== Angol-kizárás újraellenőrzés (nulla SerpApi-kvóta) ===');
  console.log(`Forrás snapshot : ${path.relative(ROOT, snapshot)}`);
  console.log(`Futás ideje     : ${run.generatedAt}`);
  console.log(`Angol miatt kizárt hirdetés a snapshotban: ${englishExcluded.length}`);
  console.log(`Most újraellenőrizve: ${targets.length}\n`);

  const results = await mapWithConcurrency(targets, CONCURRENCY, async (entry) => {
    const fetched = await fetchHtml(entry.url);
    if (!fetched.ok || !fetched.html) {
      return { url: entry.url, title: entry.title, company: entry.company, outcome: 'UNREACHABLE', detail: fetched.error || `HTTP ${fetched.status}` };
    }
    const schema = extractJobPostingSchema(fetched.html);
    if (!schema) {
      // No JobPosting schema any more: most often the advert has expired and
      // the URL now redirects to a listing page. Report it, never guess.
      return { url: entry.url, title: entry.title, company: entry.company, outcome: 'NO_LONGER_A_JOB_AD', detail: 'JobPosting schema not present' };
    }
    let review;
    try {
      review = reviewJobPosting(schema, { url: entry.url, profile, matchedQuery: entry.matchedQuery || null });
    } catch (err) {
      return { url: entry.url, title: entry.title, company: entry.company, outcome: 'REVIEW_ERROR', detail: err.message };
    }
    const { assessment, record } = review;
    if (assessment.hardExcluded) {
      return {
        url: entry.url,
        title: record.title,
        company: record.company,
        outcome: /angol/i.test(assessment.exclusionReason) ? 'STILL_EXCLUDED_ENGLISH' : 'EXCLUDED_OTHER_REASON',
        detail: assessment.exclusionReason,
      };
    }
    return {
      url: entry.url,
      title: record.title,
      company: record.company,
      outcome: 'RECOVERED',
      relevancePercent: record.relevancePercent,
      visible: record.visible,
      locationText: record.locationText,
      workArrangement: record.workArrangement,
      englishRequirement: record.englishRequirement,
      datePosted: record.datePosted,
      validThrough: record.validThrough,
      salary: record.salary,
      fitReasons: record.fitReasons,
      mismatchReasons: record.mismatchReasons,
      priorPoDecision: record.poDecision,
      priorPoReason: record.poReason,
    };
  });

  const byOutcome = {};
  for (const r of results) byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + 1;

  const recovered = results
    .filter((r) => r.outcome === 'RECOVERED')
    .sort((a, b) => (b.relevancePercent || 0) - (a.relevancePercent || 0));

  console.log('\n=== EREDMÉNY ===');
  for (const [k, v] of Object.entries(byOutcome).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(4)}  ${k}`);
  }

  const visibleRecovered = recovered.filter((r) => r.visible);
  console.log(`\nVisszanyert hirdetés: ${recovered.length}`);
  console.log(`Ebből 60% felett (PO-nak megjelenítendő): ${visibleRecovered.length}\n`);

  for (const r of visibleRecovered) {
    console.log(`${String(r.relevancePercent).padStart(3)}%  ${r.company} — ${r.title}`);
    console.log(`      ${r.locationText || 'helyszín ismeretlen'} | angol: ${r.englishRequirement} | feladva: ${r.datePosted || '?'}`);
    if (r.priorPoDecision) console.log(`      KORÁBBI PO-DÖNTÉS: ${r.priorPoDecision} — ${r.priorPoReason}`);
    console.log(`      ${r.url}`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(ROOT, 'docs/evidence', `english-recheck-${stamp}.json`);
  await writeFile(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceSnapshot: path.relative(ROOT, snapshot),
        sourceRunGeneratedAt: run.generatedAt,
        detectorFix: 'comma-boundary in advanced-English proximity window (lib/english-level-conflation.test.mjs)',
        searchApiQueriesUsed: 0,
        englishExcludedInSnapshot: englishExcluded.length,
        rechecked: targets.length,
        outcomeCounts: byOutcome,
        recoveredCount: recovered.length,
        recoveredVisibleCount: visibleRecovered.length,
        results,
      },
      null,
      2
    ),
    'utf8'
  );
  console.log(`\nBizonyíték: ${path.relative(ROOT, outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
