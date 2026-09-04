export function extractJobPostingSchema(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(block[1].trim());
    } catch {
      continue;
    }
    const candidates = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];
    for (const c of candidates) {
      if (!c || typeof c !== 'object') continue;
      const type = c['@type'];
      const isJobPosting = type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'));
      if (isJobPosting) return c;
    }
  }
  return null;
}

function decodeEntitiesSimple(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
}

export function fieldsFromJobPostingSchema(schema) {
  const title = typeof schema.title === 'string' ? decodeEntitiesSimple(schema.title) : null;
  let company = null;
  if (schema.hiringOrganization) {
    company = typeof schema.hiringOrganization === 'string' ? schema.hiringOrganization : schema.hiringOrganization.name || null;
    company = decodeEntitiesSimple(company);
  }
  let location = null;
  if (schema.jobLocation) {
    const loc = Array.isArray(schema.jobLocation) ? schema.jobLocation[0] : schema.jobLocation;
    const addr = loc?.address;
    if (addr) {
      location = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(', ') || null;
    }
  }
  if (!location && schema.jobLocationType === 'TELECOMMUTE') location = 'remote/telecommute';
  const description = typeof schema.description === 'string' ? stripHtml(schema.description) : null;
  const employmentType = schema.employmentType || null;
  const datePosted = schema.datePosted || null;
  const validThrough = schema.validThrough || null;
  return { title, company, location, description, employmentType, datePosted, validThrough };
}

export function stripHtml(html) {
  if (!html) return '';
  // Some sources (e.g. LinkedIn JSON-LD) double-encode markup, so the raw
  // string contains "&lt;p&gt;" rather than real "<p>" tags. Decode entities
  // that represent tags FIRST so the subsequent tag-stripping pass actually
  // matches them, then decode remaining literal entities last.
  let text = html.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
  text = text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
  return text;
}

export function extractTitleTag(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

export function extractMetaSiteName(html) {
  const m = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);
  return m ? m[1].trim() : null;
}

// Hungarian job ads phrase language requirements in either word order
// ("felsőfokú angol" or "Angol felsőfokú nyelvtudás" in a requirements list),
// so a plain substring list would miss the reversed form. Match "angol" and
// the level word within a short window of each other, in either order.
// The window excludes ';' as well as '.'/'\n' — an earlier version only
// stopped at sentence boundaries, so "Elvárt a felsőfokú német; angol
// nyelvtudás előny." wrongly associated "felsőfokú" (which modifies
// "német") with the unrelated "angol" clause across the semicolon
// (found by independent Codex adversarial review, 2026-09-04).
const ADVANCED_ENGLISH_REGEX =
  /angol[^.\n;]{0,25}(felsőfok|tárgyalóképes|tárgyalásképes|anyanyelvi|kiváló|folyékony|magabiztos|üzleti szint|c1|c2)|(felsőfok|tárgyalóképes|tárgyalásképes|anyanyelvi|kiváló|folyékony|magabiztos|üzleti szint|c1|c2)[^.\n;]{0,25}angol|excellent english|fluent english|advanced english|negotiation[- ]level english|native[- ]level english/i;

const BASIC_ENGLISH_REGEX =
  /angol[^.\n;]{0,25}(alapfok|középfok|jó angoltudás|b1|b2)|(alapfok|középfok)[^.\n;]{0,25}angol|basic english|intermediate english/i;

// PO_DECISIONS_2026-09-04.md §3: mandatory advanced English excludes, but
// advanced English merely offered as a preference/advantage must NOT
// exclude. The level-proximity regex above cannot tell "felsőfokú angol
// kötelező" from "felsőfokú angol előnyt jelent" — both mention an
// advanced level near "angol". This override looks for an explicit
// preference/non-mandatory phrase near the same "angol" mention and, if
// found, treats the match as non-exclusionary (found by independent Codex
// adversarial review, 2026-09-04).
const ENGLISH_PREFERENCE_OVERRIDE_REGEX =
  /angol[^.\n;]{0,40}(előnyt jelent|előny|nem elvárás|nem feltétel|nem kötelező|nem szükséges)|(előnyt jelent|előny|nem elvárás|nem feltétel|nem kötelező|nem szükséges)[^.\n;]{0,40}angol/i;

export function checkAdvancedEnglishRequired(text) {
  if (!ADVANCED_ENGLISH_REGEX.test(text)) return false;
  return !ENGLISH_PREFERENCE_OVERRIDE_REGEX.test(text);
}

export function englishRequirementLabel(text) {
  if (checkAdvancedEnglishRequired(text)) return 'advanced/fluent/native (EXCLUDING)';
  if (ADVANCED_ENGLISH_REGEX.test(text)) return 'advanced/fluent/native mentioned as preference/advantage (not disqualifying)';
  if (BASIC_ENGLISH_REGEX.test(text)) return 'basic/intermediate (not disqualifying)';
  return 'not specified in extracted text';
}

export function checkLocation(text) {
  const lower = text.toLowerCase();
  const budapest = lower.includes('budapest') || lower.includes('agglomeráció');
  const remote = lower.includes('home office') || lower.includes('remote') || lower.includes('távmunka') || lower.includes('hibrid');
  return { budapestOrAgglomeration: budapest, remoteOrHybrid: remote };
}

const COMPANY_LABELS = [
  /munkáltató[:\s]+([A-ZÁÉÍÓÖŐÚÜŰ][\wÁÉÍÓÖŐÚÜŰáéíóöőúüű.,& -]{2,60})/i,
  /foglalkoztató[:\s]+([A-ZÁÉÍÓÖŐÚÜŰ][\wÁÉÍÓÖŐÚÜŰáéíóöőúüű.,& -]{2,60})/i,
  /cég neve[:\s]+([A-ZÁÉÍÓÖŐÚÜŰ][\wÁÉÍÓÖŐÚÜŰáéíóöőúüű.,& -]{2,60})/i,
];

export function extractCompanyName(text, siteName) {
  for (const re of COMPANY_LABELS) {
    const m = text.match(re);
    if (m) return m[1].trim();
  }
  return siteName || null;
}

const MANAGEMENT_SCOPE_MARKERS = [
  'csapat irányítása',
  'csapatot vezet',
  'csapatvezetés',
  'beosztottak',
  'csapata',
  'szervezeti egység vezetése',
  'osztály vezetése',
  'költségvetési felelősség',
  'emberek irányítása',
  'teljesítményértékelés',
  'people management',
  'direct reports',
  'line management',
  'team management',
  'budget responsibility',
  'managing a team',
];

export function hasManagementScope(text) {
  const lower = text.toLowerCase();
  return MANAGEMENT_SCOPE_MARKERS.some((m) => lower.includes(m));
}

const SENIOR_IC_TITLE_MARKERS = /senior fejlesztő|senior developer|technical lead|tech lead|senior mérnök|senior engineer/i;
const PM_TITLE_MARKERS = /project manager|projektmenedzser|projektvezető/i;

export function isLikelySeniorICWithoutManagement(title, text) {
  return SENIOR_IC_TITLE_MARKERS.test(title || '') && !hasManagementScope(text) && !hasProjectLeadershipScope(text);
}

export function isPMWithoutManagementScope(title, text) {
  return PM_TITLE_MARKERS.test(title || '') && !hasManagementScope(text) && !hasProjectLeadershipScope(text);
}

// "Pillér-like" positive pattern (profile/learned_preferences.md): real
// cross-functional project/program leadership does not require formal
// people-management to be a strong fit — planning, stakeholder coordination,
// resource/deadline/risk ownership and decision-support are the real signal.
const PROJECT_LEADERSHIP_MARKERS = [
  'stakeholder',
  'projektterv',
  'erőforrás',
  'határidő',
  'kockázatkezelés',
  'kockázatok azonosítása',
  'státuszriport',
  'döntés-előkészítés',
  'döntéselőkészítés',
  'projektek teljes körű',
  'projekt-keretek',
  'projekt életciklus',
  'cross-functional',
  'többszereplős koordináció',
  'szervezeti szereplők összehangolása',
];

// Require at least two distinct markers, not one: a single incidental word
// (e.g. a coordinator role mentioning "stakeholder" once, or a PM role
// mentioning "projektterv" once with no other evidence) is not enough to
// prove genuine direction of people/suppliers/delivery/development —
// exactly the false positive an independent Codex adversarial review found
// on 2026-09-04 (routine PM administration text like "Stakeholder
// meetingek adminisztrációja." was wrongly credited as real leadership).
export function hasProjectLeadershipScope(text) {
  const lower = text.toLowerCase();
  const matched = PROJECT_LEADERSHIP_MARKERS.filter((m) => lower.includes(m));
  return matched.length >= 2;
}

const INSTITUTIONAL_CONTEXT_MARKERS = [
  'önkormányzat',
  'közintézmény',
  'nonprofit',
  'közszolgáltat',
  'egészségügy',
  'kórház',
  'bank',
  'biztosító',
  'közigazgatás',
  'állami',
  'egyetem',
  'university',
  'közműszolgáltat',
  'energetik',
];

export function hasInstitutionalContext(text) {
  const lower = text.toLowerCase();
  return INSTITUTIONAL_CONTEXT_MARKERS.some((m) => lower.includes(m));
}

const POSITION_MATCH_TERMS = [
  'it vezet',
  'informatikai vezet',
  'it manager',
  'it igazgat',
  'informatikai igazgat',
  'infrastruktúra vezet',
  'infrastructure manager',
  'infrastructure lead',
  'digitalizációs vezet',
  'digitalizációs igazgat',
  'digitalizációs menedzser',
  'digital transformation manager',
  'digital transformation lead',
  'digital transformation director',
  'cio',
  'ai lead',
  'head of ai',
  'ai product manager',
  'it projektmenedzser',
  'informatikai projektvezető',
  'informatikai projektmenedzser',
  'digitalizációs projektmenedzser',
  'digitalizációs projektvezető',
  'it szolgáltatásmenedzser',
  'informatikai szolgáltatásmenedzser',
  'it program',
  'platform lead',
  'cloud operations manager',
  'it biztonsági osztályvezető',
  'security manager',
];

// Bare/generic project-leadership titles (no IT qualifier in the title itself)
// are only accepted if the description text confirms an actual IT/digital
// domain — otherwise a query for "IT projektmenedzser" can surface a
// same-titled but unrelated role (e.g. a translation-services PMO).
const GENERIC_PROJECT_TITLE_TERMS = ['projektmenedzser', 'projektvezető', 'programvezető', 'program manager', 'szolgáltatásmenedzser', 'service manager', 'pmo', 'osztályvezető', 'csoportvezető', 'engineering manager', 'operations manager'];
const IT_DOMAIN_CONTEXT_TERMS = [
  'informatik',
  ' it ',
  'it-',
  'digitalizáci',
  'szoftverfejleszt',
  'it infrastruktúra',
  'it-infrastruktúra',
  'cloud',
  'adatbázis-kezel',
  'kiberbiztonsá',
  'cybersecurity',
  'software engineer',
  'machine learning',
  'data science',
  'devops',
  'backend',
  'frontend',
  'engineering team',
  'tech stack',
  'saas',
  ' ai ',
  'artificial intelligence',
];

export function isGenericProjectTitle(title) {
  if (!title) return false;
  const lower = title.toLowerCase();
  return GENERIC_PROJECT_TITLE_TERMS.some((t) => lower.includes(t));
}

export function hasITDomainContext(text) {
  if (!text) return false;
  const lower = ` ${text.toLowerCase()} `;
  return IT_DOMAIN_CONTEXT_TERMS.some((t) => lower.includes(t));
}

const NEGATIVE_DOMAIN_TERMS = [
  'toborz',
  'recruiter',
  'brand manager',
  'marketing',
  'vevőszolgálat',
  'ügyfélszolgálat',
  'sales manager',
  'hr manager',
  'hr business partner',
  'értékesítési',
];

export function matchesTargetPosition(title) {
  if (!title) return false;
  const lower = title.toLowerCase();
  if (NEGATIVE_DOMAIN_TERMS.some((t) => lower.includes(t))) return false;
  return POSITION_MATCH_TERMS.some((t) => lower.includes(t));
}

export function extractDutiesExcerpt(text) {
  const markers = ['Feladatok', 'Feladatai', 'Amit kínálunk', 'Munkakör', 'Responsibilities'];
  for (const marker of markers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      return text.slice(idx, idx + 400).replace(/\s+/g, ' ').trim();
    }
  }
  return null;
}
