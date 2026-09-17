// Semantic duplicate detection for vacancies.
//
// The previous dedup key in run.mjs was an exact `title|company` string match,
// which left real duplicates in the 2026-09-17 report (2 pairs out of 15
// candidates) because one job is posted under employer-name variants and with
// agency reference codes in the title. See vacancy-dedup.test.mjs for the exact
// real-world pairs this handles and, just as importantly, for the genuinely
// distinct same-employer roles it must NOT collapse.
//
// Design bias: merging is the destructive direction (a collapsed row is a lost
// opportunity the PO never sees), so the match requires the NORMALISED TITLES
// TO BE EQUAL. Employer names are allowed to differ only by being a prefix of
// one another, which is what parent/subsidiary and short/long agency names look
// like. Two different roles at the same employer therefore always survive.

// Legal forms and country/group markers carry no identity: "HumanField Kft" and
// "HumanField Vezető- és Specialistakiválasztó Kft." are the same agency.
const COMPANY_NOISE_TOKENS = new Set([
  'kft', 'zrt', 'nyrt', 'bt', 'kkt', 'kht', 'nonprofit', 'kozhasznu',
  'ltd', 'limited', 'inc', 'llc', 'gmbh', 'ag', 'sa', 'se', 'bv', 'nv', 'oy', 'ab',
  'group', 'holding', 'hungary', 'magyarorszag', 'hu',
  'es', 'and', 'the',
]);

function foldAccents(value) {
  // Employer names appear with and without accents across portals.
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function normalizeCompanyTokens(company) {
  if (!company) return [];
  return foldAccents(String(company).toLowerCase())
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((token) => !COMPANY_NOISE_TOKENS.has(token));
}

// Parentheticals that are pure reference codes ("(4174)") or gender markers
// ("(m/f/d)") are not part of the role. Anything with real words -- "(PMO)",
// "(junior IT)" -- is kept, because those distinguish separate openings.
const CODE_OR_GENDER_PARENTHETICAL = /\((?:\s*\d+\s*|\s*[mwfdxhn](?:\s*[/|-]\s*[mwfdxhn])+\s*)\)/g;

export function normalizeTitle(title) {
  if (!title) return '';
  let value = String(title);
  // Some portals append the employer and location to the title after a pipe.
  value = value.split('|')[0];
  value = value.replace(CODE_OR_GENDER_PARENTHETICAL, ' ');
  return foldAccents(value.toLowerCase())
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isPrefixOf(shorter, longer) {
  if (shorter.length === 0 || shorter.length > longer.length) return false;
  return shorter.every((token, i) => token === longer[i]);
}

export function isSameVacancy(a, b) {
  const titleA = normalizeTitle(a?.title);
  const titleB = normalizeTitle(b?.title);
  // An empty title carries no identity -- never merge on it.
  if (!titleA || !titleB || titleA !== titleB) return false;

  const companyA = normalizeCompanyTokens(a?.company);
  const companyB = normalizeCompanyTokens(b?.company);
  if (companyA.length === 0 || companyB.length === 0) return false;

  return (
    isPrefixOf(companyA, companyB) || isPrefixOf(companyB, companyA)
  );
}

// When two copies of one job score the same, which URL the PO is given matters:
// a primary Hungarian job portal carries the employer's own advert and a direct
// application route, while a LinkedIn mirror often lacks the full requirement
// text and can expire independently. Lower rank wins.
const SOURCE_RANK = [
  [/(^|\.)profession\.hu$/i, 0],
  [/(^|\.)cvonline\.hu$/i, 1],
  [/(^|\.)kozigallas\.gov\.hu$/i, 1],
  [/(^|\.)jobline\.hu$/i, 2],
  [/(^|\.)linkedin\.com$/i, 5],
];

function sourceRank(url) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return 9;
  }
  for (const [pattern, rank] of SOURCE_RANK) {
    if (pattern.test(host)) return rank;
  }
  return 3; // unknown host: ahead of a social mirror, behind the known portals
}

/**
 * Collapse duplicate vacancies, keeping the highest-scored copy.
 *
 * Returns { kept, duplicates }. Each kept record gains `alsoPostedAt`, the URLs
 * of the collapsed copies, so the PO can still reach the other posting -- a
 * silently dropped URL would hide that the advert exists on a second portal.
 * Each duplicate carries `duplicateOfUrl` for the run evidence.
 *
 * Ties on score are broken by lowest URL so the same input set always yields
 * the same survivor regardless of discovery order.
 */
export function dedupeVacancies(records) {
  const groups = [];
  for (const record of records || []) {
    const group = groups.find((candidate) => isSameVacancy(candidate[0], record));
    if (group) group.push(record);
    else groups.push([record]);
  }

  const kept = [];
  const duplicates = [];
  for (const group of groups) {
    const ranked = [...group].sort((x, y) => {
      const byScore = (y.relevancePercent ?? -1) - (x.relevancePercent ?? -1);
      if (byScore !== 0) return byScore;
      const bySource = sourceRank(x.url) - sourceRank(y.url);
      if (bySource !== 0) return bySource;
      return String(x.url || '').localeCompare(String(y.url || ''));
    });
    const [survivor, ...dropped] = ranked;
    kept.push(
      dropped.length
        ? { ...survivor, alsoPostedAt: dropped.map((r) => r.url).filter(Boolean) }
        : survivor
    );
    for (const record of dropped) {
      duplicates.push({ ...record, duplicateOfUrl: survivor.url });
    }
  }
  return { kept, duplicates };
}
