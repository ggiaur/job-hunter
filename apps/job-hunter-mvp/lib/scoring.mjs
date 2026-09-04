// Sprint 1 relevance scoring — implements the exact rules approved in
// docs/product/PO_DECISIONS_2026-09-04.md. Every accepted vacancy gets an
// explainable 0-100 score built from itemized factors (both positive and
// negative), never an unexplained opinion. Hard exclusions are reported
// separately from scoring, per PO_DECISIONS section 2/3.

import {
  checkAdvancedEnglishRequired,
  englishRequirementLabel,
  hasManagementScope,
  hasProjectLeadershipScope,
  hasInstitutionalContext,
  isLikelySeniorICWithoutManagement,
  isPMWithoutManagementScope,
  hasITDomainContext,
} from './extract.mjs';

// "Developer/helpdesk" are named explicitly as hard exclusions in
// PO_DECISIONS section 2. A bare IC title (no leadership qualifier, no
// management/project-leadership scope in the description) is excluded;
// a title like "Fejlesztési csapat vezetője" (dev team lead) is not a bare
// IC title and is judged on scope like any other leadership role.
// Plain substring match, not \b-anchored regex: JS's default \w is ASCII-only,
// so a trailing \b after an accented Hungarian word ending (e.g. "fejlesztő")
// silently fails to match — confirmed via this file's own test suite.
// Expanded per independent Codex adversarial review (2026-09-04), which
// found "szoftvermérnök", "it support", "service desk", and Hungarian
// customer-support synonyms slipped past the original narrow list.
const IC_ONLY_TITLE_TERMS = ['fejlesztő', 'developer', 'programozó', 'programmer', 'szoftvermérnök', 'software engineer', 'helpdesk', 'help desk', 'service desk', 'support specialist', 'it support', 'ügyfélszolgálati munkatárs', 'ügyfélszolgálati informatikus', 'ügyféltámogató'];

const ONE_PERSON_IT_MARKERS = [
  'egyszemélyes it',
  'egyszemélyes informatik',
  'egy fős it csapat',
  'egy főből álló it',
  'egyetlen informatikusaként',
  'egyedül felel az it',
  'önállóan felel az összes it',
  'kizárólagos felelőse lesz',
  'one-person it',
  'sole it',
  'you will be the only it',
];

export function isOnePersonITRole(descriptionText) {
  const lower = (descriptionText || '').toLowerCase();
  return ONE_PERSON_IT_MARKERS.some((m) => lower.includes(m));
}

export function isHardExcludedICRole(title, descriptionText) {
  if (!title) return false;
  const lower = title.toLowerCase();
  if (!IC_ONLY_TITLE_TERMS.some((t) => lower.includes(t))) return false;
  return !hasManagementScope(descriptionText) && !hasProjectLeadershipScope(descriptionText);
}

// Fehérvárcsurgó accessibility ring, per PO_DECISIONS section 5. Not a
// rigid list — the governing principle is practical accessibility — but a
// concrete ring is needed for a deterministic, explainable score.
const PRIMARY_RING = ['székesfehérvár', 'szekesfehervar', 'mór', 'mor', 'várpalota', 'varpalota', 'győr', 'gyor', 'tata', 'tatabánya', 'tatabanya', 'veszprém', 'veszprem', 'dunaújváros', 'dunaujvaros'];
const SECONDARY_CITIES = ['pécs', 'pecs', 'szeged', 'szombathely', 'sopron'];
const REMOTE_HYBRID_MARKERS = /home\s?office|remote|távmunka|hibrid|hybrid/i;
const BUDAPEST_MARKERS = /budapest|agglomeráció/i;

// Manual word-boundary check: JS's native \b is ASCII-only \w, so it cannot
// be trusted around accented Hungarian letters (see the checkAdvancedEnglishRequired
// fix history in extract.mjs). Short ring-city forms like "mor" or "tata"
// need this — plain .includes() matched "mor" inside the English word
// "more" and would match "tata" inside unrelated longer words, found by
// independent Codex adversarial review (2026-09-04).
const HU_WORD_CHAR = /[a-z0-9áéíóöőúüű]/i;
function includesWholeWord(haystack, needle) {
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    const before = idx === 0 ? '' : haystack[idx - 1];
    const after = idx + needle.length >= haystack.length ? '' : haystack[idx + needle.length];
    if (!HU_WORD_CHAR.test(before) && !HU_WORD_CHAR.test(after)) return true;
    idx += needle.length;
  }
  return false;
}

export function scoreLocation(locationText, descriptionText) {
  const lower = `${locationText || ''} ${descriptionText || ''}`.toLowerCase();
  const remoteOrHybrid = REMOTE_HYBRID_MARKERS.test(lower);
  if (PRIMARY_RING.some((c) => includesWholeWord(lower, c))) {
    return { points: 15, note: 'Fehérvárcsurgóról jól elérhető helyszín (elsődleges gyűrű: Székesfehérvár/Mór/Várpalota/Győr/Tata/Tatabánya/Veszprém/Dunaújváros).' };
  }
  if (remoteOrHybrid) {
    return { points: 10, note: 'Táv-/hibrid munkavégzés — a helyszín önmagában nem akadály.' };
  }
  if (BUDAPEST_MARKERS.test(lower)) {
    return { points: 6, note: 'Budapest/agglomeráció — ingázással elérhető, de nem az elsődleges gyűrű.' };
  }
  if (SECONDARY_CITIES.some((c) => includesWholeWord(lower, c))) {
    return { points: 4, note: 'Távolabbi magyar város — csak ritka/hibrid jelenlét mellett reális, ezért csak kis pontszám, nem kizárás.' };
  }
  // Distinguish "locationText really is empty/missing" from "locationText is
  // present but names a city outside the recognized rings" -- the previous
  // single fallback message claimed the location "cannot be identified from
  // the text" even when locationText was populated (e.g. "Nyíregyháza, HU"),
  // which is factually wrong and misleading in the explanation shown to the
  // PO. Found by the Hourly Repository Supervisor, 2026-09-04, on a real WAY
  // Group/CAIP Hungary record. Scoring stays neutral either way (0 points,
  // never a hard exclusion) per PO_DECISIONS §5 -- only the explanation text
  // changes.
  if (locationText && locationText.trim()) {
    return {
      points: 0,
      note: `Helyszín azonosítva (${locationText.trim()}), de nem esik az elsődleges/másodlagos gyűrűbe vagy Budapestre, és táv-/hibrid munkavégzésre sincs jelzés — nem kizáró ok, csak nulla pontszámú semleges jelzés.`,
    };
  }
  return { points: 0, note: 'Helyszín nem azonosítható a szövegből — nem kizáró ok (nincs vak helyszín-tiltás), csak nulla pontszámú semleges jelzés.' };
}

// Deliberately conservative HUF gross-salary reader. An earlier version
// matched ANY number immediately followed by "Ft"/"HUF"/"forint" — an
// independent Codex adversarial review (2026-09-04) showed this fabricates
// a salary reading from cafeteria budgets, travel allowances, and project
// budgets that happen to be phrased in HUF. Now requires an explicit
// salary-context word (fizetés/bér/kereset/jövedelem/bruttó/nettó) within a
// short window of the number, and allows a little punctuation/whitespace
// between the number and the currency marker (e.g. "650.000,- Ft").
const SALARY_CONTEXT_WORDS = '(?:fizetés|bér|kereset|jövedelem|bruttó|nettó)';
// The bridge between the context word and the number excludes digits, not
// just '.'/'\n'/';': a plain [^.\n;] bridge is greedy and happily eats into
// the number itself (e.g. "Bruttó fizetés: 550000 Ft" backtracked to
// capturing only the trailing "00" instead of "550000"), found while
// verifying the fix for the salary-misattribution bug Codex reported.
const SALARY_REGEX = new RegExp(
  `${SALARY_CONTEXT_WORDS}[^.\\n;\\d]{0,20}(\\d[\\d\\s.]{2,})[\\s,.\\-]{0,4}(?:ft|huf|forint)\\b` +
  `|(\\d[\\d\\s.]{2,})[\\s,.\\-]{0,4}(?:ft|huf|forint)\\b[^.\\n;\\d]{0,20}${SALARY_CONTEXT_WORDS}`,
  'i',
);

export function scoreSalary(descriptionText) {
  const m = (descriptionText || '').match(SALARY_REGEX);
  if (!m) return { points: 0, note: 'Fizetés nincs megadva a hirdetésben — semleges, nem büntetjük.', amount: null };
  const amount = parseInt((m[1] || m[2]).replace(/[\s.]/g, ''), 10);
  if (!Number.isFinite(amount) || amount < 200000 || amount > 3000000) {
    return { points: 0, note: 'A szövegben talált szám nem értelmezhető megbízhatóan havi bruttó fizetésként — semleges, nem találgatunk.', amount: null };
  }
  if (amount < 700000) {
    return { points: -10, note: `Megadott bruttó fizetés (~${amount.toLocaleString('hu-HU')} Ft) 700.000 Ft alatt — kis/mérsékelt levonás, nem kizárás.`, amount };
  }
  return { points: 0, note: `Megadott fizetés (~${amount.toLocaleString('hu-HU')} Ft) elfogadható tartományban.`, amount };
}

export function scoreFreshness(datePostedIso) {
  if (!datePostedIso) return { points: 0, note: 'Közzététel dátuma ismeretlen — semleges.' };
  const posted = new Date(datePostedIso);
  if (Number.isNaN(posted.getTime())) return { points: 0, note: 'Közzététel dátuma nem értelmezhető — semleges.' };
  const ageDays = (Date.now() - posted.getTime()) / 86400000;
  if (ageDays < 0) return { points: 0, note: 'Közzététel dátuma a jövőben van — semleges.' };
  if (ageDays <= 14) return { points: 8, note: `Friss hirdetés (${Math.round(ageDays)} napja) — pozitív frissesség-bónusz.` };
  if (ageDays <= 30) return { points: 4, note: `Viszonylag friss hirdetés (${Math.round(ageDays)} napja).` };
  return { points: 0, note: 'Régebbi, de továbbra is aktív hirdetés — a kor önmagában nem kizáró ok, csak nincs frissesség-bónusz.' };
}

const BASE_SCORE = 35;
const VISIBLE_THRESHOLD = 60;

/**
 * Compute the full Sprint-1 relevance assessment for one confirmed job ad.
 * Returns either a hard-exclusion record or a 0-100 explainable score with
 * itemized positive/negative factors, per PO_DECISIONS_2026-09-04.md.
 */
export function computeRelevanceAssessment({ title, descriptionText, locationText, datePosted, positionRelevant, isGenericTitle }) {
  const englishAdvanced = checkAdvancedEnglishRequired(descriptionText);
  if (englishAdvanced) {
    return {
      hardExcluded: true,
      exclusionReason: `Kizárva: kötelező felsőfokú/tárgyalásképes/anyanyelvi angol nyelvtudás (${englishRequirementLabel(descriptionText)}).`,
    };
  }
  if (isHardExcludedICRole(title, descriptionText)) {
    return {
      hardExcluded: true,
      exclusionReason: 'Kizárva: fejlesztői/helpdesk jellegű egyéni közreműködői szerep, vezetői vagy projektvezetői felelősség jele nélkül a szövegben.',
    };
  }
  if (isOnePersonITRole(descriptionText)) {
    return {
      hardExcluded: true,
      exclusionReason: 'Kizárva: egyszemélyes IT-szerep, ahol a jelentkező egyedül vinné az összes informatikai munkát.',
    };
  }
  if (!positionRelevant) {
    return {
      hardExcluded: true,
      exclusionReason: 'Kizárva: a cím nem tartalmaz IT-vezetői/menedzseri/projektvezetői kulcsszót, vagy nem IT terület.',
    };
  }

  const fitReasons = [];
  const mismatchReasons = [];
  let score = BASE_SCORE;

  if (!isGenericTitle) {
    score += 20;
    fitReasons.push('A cím közvetlenül egyezik egy célzott IT-vezetői/projektvezetői pozícióval.');
  } else {
    score += 12;
    fitReasons.push('Általános vezetői/projektvezetői cím, IT-doménkontextussal megerősítve.');
  }

  const hasMgmtScope = hasManagementScope(descriptionText);
  if (hasMgmtScope) {
    score += 15;
    fitReasons.push('A szöveg konkrét vezetői (people-management) felelősséget említ.');
  }
  const hasProjectLeadership = hasProjectLeadershipScope(descriptionText);
  if (hasProjectLeadership) {
    score += 15;
    fitReasons.push('Valódi projekt-/programvezetői felelősség (tervezés, erőforrás/határidő/kockázat, stakeholder-koordináció) — közvetlen beosztottak nélkül is elfogadott a PO döntés szerint.');
  }

  if (!hasMgmtScope && !hasProjectLeadership) {
    mismatchReasons.push('A szövegből nem derül ki konkrét vezetői vagy projektvezetői felelősség — csak a cím alapján releváns.');
    if (isLikelySeniorICWithoutManagement(title, descriptionText)) {
      score -= 25;
      mismatchReasons.push('Senior szakértői/technical lead cím, vezetői felelősség jele nélkül.');
    } else if (isPMWithoutManagementScope(title, descriptionText)) {
      score -= 15;
      mismatchReasons.push('Projektmenedzseri cím, de a szöveg nem támasztja alá a valódi vezetői/projektvezetői felelősséget.');
    } else {
      // General case: any other matched title (including "manager"/"menedzser"
      // labeled roles such as "IT szolgáltatásmenedzser") with literally zero
      // corroborating scope evidence. An earlier version only penalized the
      // two narrow title patterns above and left every other matched title
      // unpenalized, so a bare "IT szolgáltatásmenedzser" with no leadership
      // evidence at all scored 78/visible — found by independent Codex
      // adversarial review (2026-09-04); a title label alone is not proof of
      // real leadership per PO_DECISIONS §2's "pure individual-contributor
      // roles... hard exclusion" intent, which this generalizes to.
      score -= 30;
      mismatchReasons.push('A cím vezetői/menedzseri jellegű, de a leírásban semmilyen konkrét vezetői vagy projektvezetői felelősség nem azonosítható — erősen visszasorolva.');
    }
  }

  if (hasInstitutionalContext(descriptionText)) {
    score += 5;
    fitReasons.push('Intézményi/közszolgáltatói/nagyvállalati környezet — pozitív preferencia szerinti bónusz.');
  }

  const location = scoreLocation(locationText, descriptionText);
  score += location.points;
  (location.points > 0 ? fitReasons : mismatchReasons).push(location.note);

  const salary = scoreSalary(descriptionText);
  score += salary.points;
  if (salary.points !== 0) mismatchReasons.push(salary.note);

  const freshness = scoreFreshness(datePosted);
  score += freshness.points;
  if (freshness.points > 0) fitReasons.push(freshness.note);

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    hardExcluded: false,
    score,
    visible: score >= VISIBLE_THRESHOLD,
    fitReasons,
    mismatchReasons,
    englishRequirement: englishRequirementLabel(descriptionText),
    salaryAmount: salary.amount,
  };
}

export const RELEVANCE_VISIBLE_THRESHOLD = VISIBLE_THRESHOLD;
