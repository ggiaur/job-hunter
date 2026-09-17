#!/usr/bin/env node
// Re-score an EXISTING run snapshot with the current scoring rules and
// republish CURRENT_RESULTS.md / the HTML report from it.
//
// Cost: ZERO search-API quota and zero page fetches. It reuses the advert text a
// previous live run already acquired and stored.
//
// Why this exists: when a scoring or matching bug is fixed, the corrected view of
// the adverts the PO already paid to acquire should not have to wait for the next
// scheduled live run -- especially with 26 of 250 monthly searches left.
//
// HONESTY CONTRACT: this does NOT pretend to be a fresh search.
//   * `generatedAt` keeps the ORIGINAL acquisition timestamp, so the report never
//     claims the vacancies were checked more recently than they were;
//   * `rescoredAt`, `rescoredFrom` and `rescoreNote` record what was recomputed;
//   * adverts whose stored text is missing cannot be re-scored and are reported,
//     never silently dropped.
//
// Usage: node scripts/rescore-snapshot.mjs [snapshot.json]

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeRelevanceAssessment } from '../apps/job-hunter-mvp/lib/scoring.mjs';
import { isGenericProjectTitle, matchesTargetPosition } from '../apps/job-hunter-mvp/lib/extract.mjs';
import { loadProfile } from '../apps/job-hunter-mvp/lib/profile.mjs';
import { findPriorFeedback } from '../apps/job-hunter-mvp/lib/candidate-fit.mjs';
import { dedupeVacancies } from '../apps/job-hunter-mvp/lib/vacancy-dedup.mjs';
import { publishCurrentReports } from '../apps/job-hunter-mvp/presentation/current-report.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SNAPSHOT = path.join(ROOT, 'docs/evidence/real-job-hunter-current-run.json');

async function main() {
  const snapshotPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SNAPSHOT;
  const run = JSON.parse(await readFile(snapshotPath, 'utf8'));
  const profile = await loadProfile(path.join(ROOT, 'profile'));

  const beforeCandidates = (run.results || []).filter(
    (r) => r.visible && r.poDecision !== 'DO_NOT_APPLY'
  ).length;

  const rescored = [];
  const notRescorable = [];
  const newlyExcluded = [];

  for (const record of run.results || []) {
    if (!record.descriptionText) {
      // Keep the row untouched rather than guessing, and account for it.
      notRescorable.push({ url: record.url, title: record.title, company: record.company });
      rescored.push(record);
      continue;
    }
    const assessment = computeRelevanceAssessment({
      title: record.title,
      descriptionText: record.descriptionText,
      locationText: record.locationText,
      datePosted: record.datePosted,
      // The stored validThrough already gated the original run; re-applying it
      // here would drop adverts purely for having aged, which is a freshness
      // question for a live run, not a scoring correction.
      validThrough: 'unknown',
      positionRelevant: true,
      isGenericTitle: isGenericProjectTitle(record.title) && !matchesTargetPosition(record.title),
      candidateProfile: profile.candidate,
    });

    if (assessment.hardExcluded) {
      newlyExcluded.push({ company: record.company, title: record.title, reason: assessment.exclusionReason });
      continue;
    }

    const priorFeedback = findPriorFeedback(profile.learnedText, record.company, record.title);
    const priorDecision = priorFeedback.at(-1);
    rescored.push({
      ...record,
      relevancePercent: assessment.score,
      visible: assessment.visible,
      fitReasons: assessment.fitReasons,
      mismatchReasons: assessment.mismatchReasons,
      englishRequirement: assessment.englishRequirement,
      educationNote: assessment.educationNote,
      candidateReview: assessment.candidateReview,
      poDecision: priorDecision?.decision ?? null,
      poReason: priorDecision?.reason ?? null,
      priorFeedback,
    });
  }

  const visibleForReview = rescored.filter((r) => r.visible && r.poDecision !== 'DO_NOT_APPLY');
  const { kept, duplicates } = dedupeVacancies(visibleForReview);
  const keptUrls = new Set(kept.map((r) => r.url));
  const alsoPostedByUrl = new Map(kept.filter((r) => r.alsoPostedAt).map((r) => [r.url, r.alsoPostedAt]));

  const finalResults = rescored
    .filter((r) => !duplicates.some((d) => d.url === r.url))
    .map((r) => (alsoPostedByUrl.has(r.url) ? { ...r, alsoPostedAt: alsoPostedByUrl.get(r.url) } : r));

  const output = {
    ...run,
    // Deliberately NOT touched: the vacancies were acquired then, not now.
    generatedAt: run.generatedAt,
    rescoredAt: new Date().toISOString(),
    rescoredFrom: path.relative(ROOT, snapshotPath),
    rescoreNote:
      'Scores, prior-PO-decision matching and duplicate collapsing recomputed from the stored advert text of the run above. No new search or page fetch was performed; the vacancy set and its acquisition time are unchanged.',
    searchApiQueriesUsed: 0,
    results: finalResults,
    visibleCount: kept.length,
    reviewCandidateCount: kept.length,
    rescoreDiagnostics: {
      candidatesBefore: beforeCandidates,
      candidatesAfter: kept.length,
      duplicatesCollapsed: duplicates.map((d) => ({ company: d.company, title: d.title, url: d.url, duplicateOfUrl: d.duplicateOfUrl })),
      newlyExcluded,
      rowsWithoutStoredText: notRescorable,
    },
  };

  const outPath = path.join(ROOT, 'docs/evidence/rescored-current-run.json');
  await writeFile(outPath, JSON.stringify(output, null, 2), 'utf8');
  const { htmlPath, markdownPath } = await publishCurrentReports(ROOT, outPath);

  console.log('=== Snapshot újrapontozás (nulla SerpApi-kvóta, nulla letöltés) ===');
  console.log(`Forrás              : ${path.relative(ROOT, snapshotPath)}`);
  console.log(`Beszerzés ideje     : ${run.generatedAt}  (változatlan)`);
  console.log(`Jelöltek előtte     : ${beforeCandidates}`);
  console.log(`Jelöltek utána      : ${kept.length}`);
  console.log(`Összevont duplikátum: ${duplicates.length}`);
  console.log(`Újonnan kizárt      : ${newlyExcluded.length}`);
  for (const x of newlyExcluded) console.log(`   - ${x.company} — ${x.title}`);
  console.log(`Tárolt szöveg nélkül: ${notRescorable.length}`);
  console.log(`\nÍrva: ${path.relative(ROOT, outPath)}`);
  console.log(`      ${path.relative(ROOT, markdownPath)}`);
  console.log(`      ${path.relative(ROOT, htmlPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
