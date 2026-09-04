import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serpapiSearch } from './lib/serpapi.mjs';
import { loadProfile } from './lib/profile.mjs';
import {
  extractJobPostingSchema,
  fieldsFromJobPostingSchema,
  stripHtml,
  extractTitleTag,
  matchesTargetPosition,
  isGenericProjectTitle,
  hasITDomainContext,
} from './lib/extract.mjs';
import { computeRelevanceAssessment } from './lib/scoring.mjs';
import { extractJobLikeLinks, countJobLikeLinks } from './lib/links.mjs';
import { persistRunHistory } from './lib/run-history.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(REPO_ROOT, 'profile');
const SECRET_ENV_PATH = '/home/dockeruser/.job-hunter-secrets/serpapi.env';

const QUERIES = [
  { q: 'IT vezető állás Budapest', priorityWeight: 60 },
  { q: 'informatikai vezető állás Budapest', priorityWeight: 60 },
  { q: 'IT osztályvezető állás Budapest', priorityWeight: 50 },
  { q: 'infrastruktúra vezető állás Budapest', priorityWeight: 50 },
  { q: 'IT projektmenedzser állás Budapest', priorityWeight: 40 },
  { q: 'informatikai projektvezető állás Budapest', priorityWeight: 45 },
  { q: 'digitalizációs projektmenedzser állás Budapest', priorityWeight: 45 },
  { q: 'digitalizációs vezető állás Budapest', priorityWeight: 30 },
  { q: 'IT szolgáltatásmenedzser állás Budapest', priorityWeight: 35 },
  { q: 'közintézményi digitalizációs projektmenedzser állás Budapest', priorityWeight: 40 },
  { q: 'AI transzformációs vezető állás Budapest', priorityWeight: 20 },
];

async function loadApiKey() {
  const env = await readFile(SECRET_ENV_PATH, 'utf8');
  const m = env.match(/SERPAPI_API_KEY=(\S+)/);
  if (!m) throw new Error('SERPAPI_API_KEY not found in secret env file');
  return m[1];
}

function normalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.hash = '';
    return u.toString();
  } catch {
    return rawUrl;
  }
}

async function fetchWithTimeout(url, ms = 9000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
        'Accept-Language': 'hu-HU,hu;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });
    const html = await res.text();
    return { ok: res.ok, status: res.status, html };
  } catch (err) {
    return { ok: false, status: null, error: err.message };
  } finally {
    clearTimeout(t);
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const cur = idx++;
      results[cur] = await fn(items[cur], cur);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function isExcludedCompany(companyName, excludedList) {
  if (!companyName) return false;
  const lower = companyName.toLowerCase();
  return excludedList.some((ex) => lower.includes(ex.toLowerCase()));
}

async function classify(url, html) {
  const schema = extractJobPostingSchema(html);
  if (schema) return { kind: 'JOB_AD_CONFIRMED', schema };
  const jobLinkCount = countJobLikeLinks(html, url);
  if (jobLinkCount >= 3) return { kind: 'LISTING', jobLinkCount };
  return { kind: 'UNKNOWN' };
}

async function main() {
  const apiKey = await loadApiKey();
  const profile = await loadProfile(PROFILE_DIR);

  console.log('=== Job Hunter MVP — live run ===');
  console.log('Positions (priority order):', profile.positions);
  console.log('Excluded companies:', profile.excludedCompanies);
  console.log('');

  // Stage A: SerpApi search
  const allSerpResults = [];
  for (const { q, priorityWeight } of QUERIES) {
    console.log(`SerpApi search: "${q}"`);
    try {
      const results = await serpapiSearch(apiKey, q);
      for (const r of results) allSerpResults.push({ ...r, priorityWeight });
      console.log(`  -> ${results.length} organic results`);
    } catch (err) {
      console.log(`  -> ERROR: ${err.message}`);
    }
  }

  const stageACandidates = new Map();
  for (const r of allSerpResults) {
    const norm = normalizeUrl(r.link);
    if (!stageACandidates.has(norm)) {
      stageACandidates.set(norm, { url: norm, serpTitle: r.title, snippet: r.snippet, query: r.query, priorityWeight: r.priorityWeight });
    } else {
      const existing = stageACandidates.get(norm);
      if (r.priorityWeight > existing.priorityWeight) existing.priorityWeight = r.priorityWeight;
    }
  }
  console.log(`\nUnique candidate URLs from SERP: ${stageACandidates.size}`);

  const stageAList = [...stageACandidates.values()];
  const stageBResults = await mapWithConcurrency(stageAList, 4, async (cand) => {
    const fetched = await fetchWithTimeout(cand.url);
    return { ...cand, fetched };
  });

  const confirmedJobAds = []; // { ...cand, schema, html }
  const listingPages = [];
  const unreachable = [];

  for (const item of stageBResults) {
    if (!item.fetched.ok || !item.fetched.html) {
      unreachable.push({ url: item.url, reason: item.fetched.error || `HTTP ${item.fetched.status}` });
      continue;
    }
    const cls = await classify(item.url, item.fetched.html);
    if (cls.kind === 'JOB_AD_CONFIRMED') {
      confirmedJobAds.push({ ...item, schema: cls.schema, html: item.fetched.html });
    } else if (cls.kind === 'LISTING') {
      listingPages.push({ ...item, jobLinks: extractJobLikeLinks(item.fetched.html, item.url, 12) });
    } else {
      unreachable.push({ url: item.url, reason: 'no schema.org JobPosting data and too few job-like links to classify as a listing' });
    }
  }

  console.log(`Stage B — confirmed job ads (schema.org JobPosting present): ${confirmedJobAds.length}`);
  console.log(`Stage B — listing pages needing second-level crawl: ${listingPages.length}`);
  console.log(`Stage B — unreachable/unclassifiable: ${unreachable.length}`);

  // Stage C: second-level crawl for listing pages, require JobPosting schema to accept
  const secondLevelCandidates = [];
  for (const lp of listingPages) {
    for (const link of lp.jobLinks) {
      secondLevelCandidates.push({ url: normalizeUrl(link), serpTitle: lp.serpTitle, snippet: lp.snippet, query: lp.query, priorityWeight: lp.priorityWeight, fromListing: lp.url });
    }
  }
  const seenUrls = new Set(confirmedJobAds.map((d) => d.url));
  const uniqueSecondLevel = [];
  for (const c of secondLevelCandidates) {
    if (seenUrls.has(c.url)) continue;
    seenUrls.add(c.url);
    uniqueSecondLevel.push(c);
  }
  console.log(`Second-level candidate links extracted from listing pages: ${uniqueSecondLevel.length}`);

  const secondLevelResults = await mapWithConcurrency(uniqueSecondLevel, 4, async (cand) => {
    const fetched = await fetchWithTimeout(cand.url);
    return { ...cand, fetched };
  });

  let secondLevelConfirmed = 0;
  for (const item of secondLevelResults) {
    if (!item.fetched.ok || !item.fetched.html) {
      unreachable.push({ url: item.url, reason: item.fetched.error || `HTTP ${item.fetched.status}`, fromListing: item.fromListing });
      continue;
    }
    const schema = extractJobPostingSchema(item.fetched.html);
    if (schema) {
      confirmedJobAds.push({ ...item, schema, html: item.fetched.html });
      secondLevelConfirmed++;
    } else {
      unreachable.push({ url: item.url, reason: 'second-level link had no schema.org JobPosting data; excluded to avoid presenting an unverified page as a job ad', fromListing: item.fromListing });
    }
  }
  console.log(`Second-level confirmed job ads: ${secondLevelConfirmed}`);
  console.log(`Total confirmed job-ad pages (schema.org JobPosting verified): ${confirmedJobAds.length}`);

  // Extraction (from structured schema.org data) + PO_DECISIONS_2026-09-04.md
  // hard exclusion + explainable 0-100 relevance scoring (lib/scoring.mjs).
  const results = []; // every scored/excluded candidate, per the result contract
  const excluded = []; // company exclusion is a profile-level hard filter, kept separate

  for (const ad of confirmedJobAds) {
    const fields = fieldsFromJobPostingSchema(ad.schema);
    const title = fields.title || extractTitleTag(ad.html) || ad.serpTitle || 'unknown (nem sikerült kinyerni)';
    const company = fields.company || 'unknown (nem sikerült kinyerni)';
    const descriptionText = fields.description || stripHtml(ad.html);
    const companyExcluded = isExcludedCompany(company, profile.excludedCompanies);

    const base = {
      title,
      company,
      url: ad.url,
      source: new URL(ad.url).hostname,
      matchedQuery: ad.query,
      locationText: fields.location || null,
      workArrangement: /home\s?office|remote|távmunka|hibrid|hybrid/i.test(descriptionText) ? 'remote/hibrid' : null,
      employmentType: fields.employmentType || 'unknown',
      datePosted: fields.datePosted || null,
      validThrough: fields.validThrough || 'unknown',
      poDecision: null, // APPLY | DO_NOT_APPLY, PO-filled after review
      poReason: null,
    };

    if (companyExcluded) {
      excluded.push({ ...base, exclusionReason: `Kizárt cég (profil beállítás): ${company}` });
      continue;
    }

    const positionRelevant =
      matchesTargetPosition(title) || (isGenericProjectTitle(title) && hasITDomainContext(descriptionText));

    const assessment = computeRelevanceAssessment({
      title,
      descriptionText,
      locationText: fields.location,
      datePosted: fields.datePosted,
      positionRelevant,
      isGenericTitle: isGenericProjectTitle(title) && !matchesTargetPosition(title),
    });

    if (assessment.hardExcluded) {
      excluded.push({ ...base, exclusionReason: assessment.exclusionReason });
      continue;
    }

    results.push({
      ...base,
      salary: assessment.salaryAmount ? `~${assessment.salaryAmount.toLocaleString('hu-HU')} Ft (bruttó, hirdetésből)` : null,
      relevancePercent: assessment.score,
      visible: assessment.visible,
      fitReasons: assessment.fitReasons,
      mismatchReasons: assessment.mismatchReasons,
      englishRequirement: assessment.englishRequirement,
      keyDuties: fields.description ? fields.description.slice(0, 500) : 'unknown (nem sikerült kinyerni)',
    });
  }

  // Semantic dedup: the same job can be discovered twice under different
  // tracking query-strings (e.g. profession.hu's ?keyword=... varies per
  // search that found it). Keep the highest-scored copy per title+company.
  const seenTitleCompany = new Map();
  for (const rec of results) {
    const key = `${rec.title.toLowerCase()}|${rec.company.toLowerCase()}`;
    const existing = seenTitleCompany.get(key);
    if (!existing || rec.relevancePercent > existing.relevancePercent) seenTitleCompany.set(key, rec);
  }
  const dedupedResults = [...seenTitleCompany.values()];
  dedupedResults.sort((a, b) => b.relevancePercent - a.relevancePercent);
  results.length = 0;
  results.push(...dedupedResults);

  const visibleResults = results.filter((r) => r.visible);

  const output = {
    generatedAt: new Date().toISOString(),
    queries: QUERIES.map((q) => q.q),
    totalSerpResults: allSerpResults.length,
    uniqueCandidateUrls: stageACandidates.size,
    confirmedJobAdPages: confirmedJobAds.length,
    unreachableCount: unreachable.length,
    resultContractVersion: 1,
    visibleThreshold: 60,
    results,
    visibleCount: visibleResults.length,
    excluded,
    unreachable,
  };

  const outPath = path.join(REPO_ROOT, 'docs', 'evidence', 'real-job-hunter-current-run.json');
  await writeFile(outPath, JSON.stringify(output, null, 2), 'utf8');
  const { snapshotPath } = await persistRunHistory(REPO_ROOT, output);
  console.log(`\nWrote ${outPath}`);
  console.log(`Durable run snapshot: ${snapshotPath}`);
  console.log(`Results: ${results.length} (visible >=60%: ${visibleResults.length}), Excluded: ${excluded.length}, Unreachable: ${unreachable.length}`);
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
