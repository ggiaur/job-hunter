// Leadership-first policy approved on 2026-09-30. Eligibility and professional
// fit are independent: a hard blocker never becomes a visible recommendation.

import {
  checkHigherEducationRequired,
  hasManagementScope,
} from './extract.mjs';
import { compareCandidate } from './candidate-fit.mjs';
import { detectWorkArrangement } from './work-arrangement.mjs';
import { assessEnglishGate } from './extract.mjs';
import { assessLeadership, MATCHING_POLICY } from './leadership-fit.mjs';

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

// Entry-level markers, matched against the TITLE ONLY.
//
// "Junior kollégák mentorálása" in a description is a duty of a SENIOR role, so
// reading these from the body text would invert the meaning and penalise exactly
// the leadership adverts the PO wants. "assistant"/"asszisztens" is deliberately
// absent: profile/persona.md names "assistant IT team lead" as acceptable.
const ENTRY_LEVEL_TITLE_REGEX =
  /(^|[^a-záéíóöőúüű])(junior|jr\.?|gyakornok|pályakezdő|palyakezdo|trainee|entry[\s-]?level|kezdő)([^a-záéíóöőúüű]|$)/i;

export function detectEntryLevelTitle(title) {
  return ENTRY_LEVEL_TITLE_REGEX.test(String(title || ''));
}

export function isHardExcludedICRole(title, descriptionText) {
  if (!title) return false;
  const lower = title.toLowerCase();
  if (!IC_ONLY_TITLE_TERMS.some((t) => lower.includes(t))) return false;
  return !hasManagementScope(descriptionText);
}

// Fehérvárcsurgó accessibility ring, per PO_DECISIONS section 5. Not a
// rigid list — the governing principle is practical accessibility — but a
// concrete ring is needed for a deterministic, explainable score.
const PRIMARY_RING = ['székesfehérvár', 'szekesfehervar', 'mór', 'mor', 'várpalota', 'varpalota', 'győr', 'gyor', 'tata', 'tatabánya', 'tatabanya', 'veszprém', 'veszprem', 'dunaújváros', 'dunaujvaros'];
const SECONDARY_CITIES = ['pécs', 'pecs', 'szeged', 'szombathely', 'sopron'];
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
  const remoteOrHybrid = detectWorkArrangement(locationText, descriptionText) === 'remote/hibrid';
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

const VISIBLE_THRESHOLD = MATCHING_POLICY.scoring.strong_threshold;

// Fit survives a hard rejection for audit, but eligibility always controls visibility.
export function computeRelevanceAssessment({ title = '', descriptionText = '', locationText, datePosted, validThrough, positionRelevant, candidateProfile }) {
  const scope = assessLeadership(title, descriptionText, candidateProfile);
  const english_gate = assessEnglishGate(descriptionText);
  const candidateReview = compareCandidate(candidateProfile, descriptionText);
  const location = scoreLocation(locationText, descriptionText);
  const salary = scoreSalary(descriptionText);
  const freshness = scoreFreshness(datePosted);
  const fitReasons = Object.values(scope.signals).filter(s => s.points).map(s => `${s.label}: +${s.points} (${s.evidence[0]})`);
  const mismatchReasons = [];
  if (candidateReview) {
    for (const match of candidateReview.matches) fitReasons.push(`Önéletrajzi kapcsolódás – ${match.label}: ${match.cvEvidence}`);
    for (const skill of candidateReview.unverifiedSkills) mismatchReasons.push(`${skill}: az önéletrajzi forrás nem igazolja; tisztázandó, nem bizonyított hiány.`);
  }
  const educationNote = checkHigherEducationRequired(descriptionText)
    ? candidateProfile?.education?.hasDegree
      ? `Önéletrajzi végzettség: ${candidateProfile.education.qualification} (${candidateProfile.education.institution}, ${candidateProfile.education.years}). A hirdetés pontos szakirányi/fokozati feltétele külön ellenőrizendő.`
      : 'A hirdetés felsőfokú végzettséget említ; a jelentkező végzettsége nincs ellenőrizve. Nem automatikus kizárás.'
    : null;
  let score = MATCHING_POLICY.scoring.base + Object.values(scope.signals).reduce((sum, s) => sum + s.points, 0)
    + (candidateReview?.overlapPoints || 0) + location.points + salary.points + freshness.points;
  fitReasons.push(location.note);
  if (freshness.points) fitReasons.push(freshness.note);
  if (salary.points) mismatchReasons.push(salary.note);
  if (!scope.primary) {
    const cap = scope.projectRole ? MATCHING_POLICY.project_manager_logic.otherwise.score_cap : MATCHING_POLICY.scoring.no_leadership_cap;
    score = Math.min(score, cap);
    mismatchReasons.push(scope.projectRole
      ? 'Másodlagos projekt-/programvezetői szerep: saját csapat, döntési jogkör és széles IT-felelősség együtt nem igazolt.'
      : 'A leírás nem igazol saját csapat vagy szervezeti egység vezetését.');
  }
  if (detectEntryLevelTitle(title) || /(^|\W)medior(\W|$)/i.test(title)) {
    score = Math.min(score - 25, MATCHING_POLICY.scoring.entry_level_cap);
    mismatchReasons.push('Junior/medior vagy belépő szintű pozíció: nem illeszkedik a senior vezetői tapasztalathoz.');
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const fitClass = scope.primary && score >= VISIBLE_THRESHOLD ? 'STRONG_MATCH' : scope.projectRole && score >= 30 ? 'SECONDARY' : 'WEAK_MATCH';
  const hardReasons = [];
  const expiresAt = Date.parse(validThrough);
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) hardReasons.push(`A hirdetés érvényessége lejárt (${validThrough}).`);
  if (english_gate.status === 'REJECT') hardReasons.push(`Kizárva: ${english_gate.reason} Bizonyíték: ${english_gate.evidence.join('; ')}`);
  if (isHardExcludedICRole(title, descriptionText)) hardReasons.push('Kizárva: fejlesztői/helpdesk egyéni közreműködői szerep igazolt csapatvezetés nélkül.');
  if (isOnePersonITRole(descriptionText)) hardReasons.push('Kizárva: egyszemélyes IT-szerep.');
  // A title miss can be rescued by concrete IT leadership duties.
  if (!positionRelevant && !(scope.primary && scope.domainRelevant)) hardReasons.push('Kizárva: nem igazolt IT-vezetői vagy másodlagos IT-program/projekt terület.');
  const hardExcluded = hardReasons.length > 0;
  const eligibility = hardExcluded ? 'REJECT' : english_gate.status === 'REVIEW' ? 'REVIEW' : 'PASS';
  if (english_gate.status === 'REVIEW') mismatchReasons.push(english_gate.reason);
  const matchClass = hardExcluded ? 'REJECT' : fitClass;
  const final_explanation = `Szakmai illeszkedés: ${fitClass}, ${score}/100 pont. ${hardExcluded ? hardReasons.join(' ') : eligibility === 'REVIEW' ? english_gate.reason : scope.primary ? 'A hirdetés tényleges IT-vezetői felelősséget igazol.' : mismatchReasons[0]}`;
  return {
    hardExcluded, exclusionReason: hardReasons.join(' ') || null,
    hard_rejection_reason: hardReasons.join(' ') || null,
    eligibility, fitClass, matchClass, score, fitScore: score,
    visible: eligibility === 'PASS' && fitClass === 'STRONG_MATCH',
    policyVersion: MATCHING_POLICY.version,
    fitReasons, mismatchReasons, englishRequirement: english_gate.reason,
    english_gate, educationNote, candidateReview, salaryAmount: salary.amount,
    leadership_fit: scope.leadership_fit, people_management_fit: scope.people_management_fit,
    technical_fit: scope.technical_fit, development_fit: scope.development_fit,
    strategic_fit: scope.strategic_fit, location_fit: location,
    signalBreakdown: scope.signals, final_explanation,
  };
}

export const RELEVANCE_VISIBLE_THRESHOLD = VISIBLE_THRESHOLD;
