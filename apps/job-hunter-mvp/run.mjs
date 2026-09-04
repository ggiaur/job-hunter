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
  checkAdvancedEnglishRequired,
  englishRequirementLabel,
  checkLocation,
  hasManagementScope,
  hasProjectLeadershipScope,
  hasInstitutionalContext,
  isLikelySeniorICWithoutManagement,
  isPMWithoutManagementScope,
  matchesTargetPosition,
  isGenericProjectTitle,
  hasITDomainContext,
} from './lib/extract.mjs';
import { extractJobLikeLinks, countJobLikeLinks } from './lib/links.mjs';

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

  // Extraction (from structured schema.org data) + hard exclusion + scoring
  const accepted = [];
  const rejected = [];

  for (const ad of confirmedJobAds) {
    const fields = fieldsFromJobPostingSchema(ad.schema);
    const title = fields.title || extractTitleTag(ad.html) || ad.serpTitle || 'unknown (nem sikerült kinyerni)';
    const company = fields.company || 'unknown (nem sikerült kinyerni)';
    const descriptionText = fields.description || stripHtml(ad.html);
    const englishAdvanced = checkAdvancedEnglishRequired(descriptionText);
    const englishLabel = englishRequirementLabel(descriptionText);
    const loc = checkLocation(descriptionText + ' ' + (fields.location || ''));
    const companyExcluded = isExcludedCompany(company, profile.excludedCompanies);
    const positionRelevant =
      matchesTargetPosition(title) || (isGenericProjectTitle(title) && hasITDomainContext(descriptionText));

    const record = {
      title,
      company,
      url: ad.url,
      source: new URL(ad.url).hostname,
      matchedQuery: ad.query,
      locationText: fields.location || (loc.budapestOrAgglomeration ? 'Budapest/agglomeráció' : loc.remoteOrHybrid ? 'remote/hibrid' : 'unknown (nem sikerült kinyerni)'),
      remoteOrHybrid: loc.remoteOrHybrid,
      englishRequirement: englishLabel,
      keyDuties: fields.description ? fields.description.slice(0, 500) : 'unknown (nem sikerült kinyerni)',
      employmentType: fields.employmentType || 'unknown',
      datePosted: fields.datePosted || 'unknown',
      validThrough: fields.validThrough || 'unknown',
    };

    if (!positionRelevant) {
      rejected.push({ ...record, reason: 'Nem releváns pozíció — a cím nem tartalmaz IT-vezetői/menedzseri kulcsszót, vagy nem-IT terület (pl. toborzás, marketing, ügyfélszolgálat)' });
      continue;
    }
    if (companyExcluded) {
      rejected.push({ ...record, reason: `Kizárt cég: ${company}` });
      continue;
    }
    if (englishAdvanced) {
      rejected.push({ ...record, reason: 'Kizárva: felsőfokú/tárgyalásképes/anyanyelvi szintű angol nyelvtudás kötelező' });
      continue;
    }

    let score = ad.priorityWeight;
    if (loc.budapestOrAgglomeration) score += 10;
    if (loc.remoteOrHybrid) score += 5;
    const hasMgmtScope = hasManagementScope(descriptionText);
    if (hasMgmtScope) score += 15;
    if (isLikelySeniorICWithoutManagement(title, descriptionText)) {
      score -= 30;
      record.scoringNote = 'Senior IC/technical lead cím valós vezetői (people-management) felelősség jele nélkül — vezetői találatként visszasorolva a tanult preferencia szerint.';
    }
    if (isPMWithoutManagementScope(title, descriptionText)) {
      score -= 15;
      record.scoringNote = (record.scoringNote ? record.scoringNote + ' ' : '') + 'Projektmenedzseri cím vezetői vagy projekt-vezetői felelősség jele nélkül — vezetői találatok mögé sorolva.';
    }
    const hasProjectLeadership = hasProjectLeadershipScope(descriptionText);
    if (hasProjectLeadership) {
      score += 20;
      record.scoringNote = (record.scoringNote ? record.scoringNote + ' ' : '') + 'Pillér-szerű pozitív minta: valódi projekt-/programvezetői felelősség (tervezés, erőforrás/határidő/kockázat, stakeholder-koordináció, döntés-előkészítés) — a tanult pozitív preferencia szerint előresorolva.';
    }
    if (hasInstitutionalContext(descriptionText)) {
      score += 10;
      record.scoringNote = (record.scoringNote ? record.scoringNote + ' ' : '') + 'Intézményi/közszolgáltatói/nagyvállalati környezet — pozitív preferencia szerint bónusz.';
    }

    accepted.push({ ...record, score });
  }

  // Semantic dedup: the same job can be discovered twice under different
  // tracking query-strings (e.g. profession.hu's ?keyword=... varies per
  // search that found it). Keep the highest-scored copy per title+company.
  const seenTitleCompany = new Map();
  for (const rec of accepted) {
    const key = `${rec.title.toLowerCase()}|${rec.company.toLowerCase()}`;
    const existing = seenTitleCompany.get(key);
    if (!existing || rec.score > existing.score) seenTitleCompany.set(key, rec);
  }
  const dedupedAccepted = [...seenTitleCompany.values()];
  dedupedAccepted.sort((a, b) => b.score - a.score);
  accepted.length = 0;
  accepted.push(...dedupedAccepted);

  const output = {
    generatedAt: new Date().toISOString(),
    queries: QUERIES.map((q) => q.q),
    totalSerpResults: allSerpResults.length,
    uniqueCandidateUrls: stageACandidates.size,
    confirmedJobAdPages: confirmedJobAds.length,
    unreachableCount: unreachable.length,
    accepted,
    rejected,
    unreachable,
  };

  const outPath = path.join(REPO_ROOT, 'docs', 'evidence', 'real-job-hunter-current-run.json');
  await writeFile(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\nWrote ${outPath}`);
  console.log(`Accepted: ${accepted.length}, Rejected: ${rejected.length}, Unreachable: ${unreachable.length}`);
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
