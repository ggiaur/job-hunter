// Re-fetch already discovered candidates against the current CV, without
// purchasing a new search. The report explicitly records its limited scope.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadProfile } from './lib/profile.mjs';
import { extractJobPostingSchema } from './lib/extract.mjs';
import { reviewJobPosting } from './lib/vacancy-review.mjs';
import { buildReportFile } from './presentation/render.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) throw new Error('Usage: node review.mjs INPUT_RUN.json OUTPUT_REVIEW.json [EXTRA_URL ...]');
if (!output.endsWith('.json') || path.resolve(input) === path.resolve(output)) throw new Error('Use a distinct .json output file; preserve the source run.');
const profile = await loadProfile(path.join(root, 'profile'));
const previous = JSON.parse(await readFile(path.resolve(input), 'utf8'));
const urls = [...new Set([...(previous.results || []).map(r => r.url), ...process.argv.slice(4)])];
const results = [], excluded = [], unreachable = [];
let cursor = 0;
await Promise.all(Array.from({ length: 2 }, async () => {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    try {
      const address = new URL(url);
      if (!['https:', 'http:'].includes(address.protocol)) throw new Error('Unsupported URL protocol');
      const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'hu-HU,hu;q=0.9,en;q=0.8' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const schema = extractJobPostingSchema(await response.text());
      if (!schema) throw new Error('No JobPosting schema');
      const { record, assessment } = reviewJobPosting(schema, { url, profile, matchedQuery: 'previously-discovered-candidate-reverification' });
      (assessment.hardExcluded ? excluded : results).push({ ...record, verifiedAt: new Date().toISOString() });
      console.log(`${assessment.hardExcluded ? 'EXCLUDED' : record.relevancePercent + '%'}: ${record.company} — ${record.title}`);
    } catch (err) {
      unreachable.push({ url, reason: err.message });
      console.log(`UNVERIFIED: ${url} (${err.message})`);
    }
  }
}));
const unique = new Map();
for (const row of results.sort((a, b) => b.relevancePercent - a.relevancePercent)) {
  const key = `${row.company.toLowerCase()}|${row.title.toLowerCase()}`;
  if (!unique.has(key)) unique.set(key, row);
}
const report = {
  generatedAt: new Date().toISOString(), runMode: 'previous-candidates-live-cv-review',
  coverageNote: 'Korábban megtalált jelöltek élő újraellenőrzése az aktuális önéletrajzzal; nem teljes új álláspiaci keresés.',
  sourceRun: path.relative(root, path.resolve(input)), candidateProfileVersion: profile.candidate.version,
  candidateSourceSha256: profile.candidate.sourceSha256, checkedUrlCount: urls.length,
  visibleThreshold: 60, results: [...unique.values()], excluded, unreachable,
};
report.visibleCount = report.results.filter(r => r.visible).length;
report.reviewCandidateCount = report.results.filter(r => r.visible && r.poDecision !== 'DO_NOT_APPLY').length;
await writeFile(path.resolve(output), JSON.stringify(report, null, 2) + '\n');
const htmlPath = path.resolve(output).replace(/\.json$/, '.html');
buildReportFile(output, htmlPath);
console.log(JSON.stringify({ visible: report.visibleCount, excluded: excluded.length, unreachable: unreachable.length, report: output, htmlPath }));
