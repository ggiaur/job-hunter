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

const ADVANCED_ENGLISH_MARKERS = [
  'felsőfokú angol',
  'felsőfokú angol nyelvtudás',
  'tárgyalásképes angol',
  'tárgyalóképes angol',
  'anyanyelvi szintű angol',
  'anyanyelvi angol',
  'kiváló angol',
  'excellent english',
  'fluent english',
  'advanced english',
  'negotiation-level english',
  'negotiation level english',
  'native-level english',
  'native level english',
  'c1 szintű angol',
  'c1 angol',
];

const BASIC_ENGLISH_MARKERS = [
  'alapfokú angol',
  'középfokú angol',
  'jó angoltudás',
  'basic english',
  'intermediate english',
];

export function checkAdvancedEnglishRequired(text) {
  const lower = text.toLowerCase();
  return ADVANCED_ENGLISH_MARKERS.some((m) => lower.includes(m));
}

export function englishRequirementLabel(text) {
  const lower = text.toLowerCase();
  if (ADVANCED_ENGLISH_MARKERS.some((m) => lower.includes(m))) return 'advanced/fluent/native (EXCLUDING)';
  if (BASIC_ENGLISH_MARKERS.some((m) => lower.includes(m))) return 'basic/intermediate (not disqualifying)';
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
const PM_TITLE_MARKERS = /project manager|projektmenedzser/i;

export function isLikelySeniorICWithoutManagement(title, text) {
  return SENIOR_IC_TITLE_MARKERS.test(title || '') && !hasManagementScope(text);
}

export function isPMWithoutManagementScope(title, text) {
  return PM_TITLE_MARKERS.test(title || '') && !hasManagementScope(text);
}

const POSITION_MATCH_TERMS = [
  'it vezet',
  'informatikai vezet',
  'it manager',
  'it igazgat',
  'informatikai igazgat',
  'osztályvezető',
  'infrastruktúra vezet',
  'infrastructure manager',
  'infrastructure lead',
  'engineering manager',
  'operations manager',
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
  'projektmenedzser',
  'csoportvezető',
  'platform lead',
  'cloud operations manager',
  'it biztonsági osztályvezető',
  'security manager',
];

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
