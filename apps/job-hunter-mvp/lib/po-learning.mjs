// JH-SUP-0026 section 4: PO-feedback learning must be reason-preserving.
// profile/learned_preferences.md's 2026-09-04 live review already records
// six real APPLY/DO_NOT_APPLY decisions with specific reasons; this module
// gives those reasons a small set of stable, normalized categories so they
// are usable as auditable learning data, not just free text -- while
// explicitly guarding against overgeneralizing one rejection into a
// blanket rule, per the four examples the directive itself names.

export const DECISION_REASON_CATEGORIES = {
  LANGUAGE_MANDATORY_ADVANCED_ENGLISH: 'Mandatory advanced/fluent English or similar formal requirement stated in the ad.',
  LANGUAGE_MULTIPLE_MANDATORY: 'More than one mandatory language requirement combined (e.g. German + English).',
  LANGUAGE_ACTIVE_BUSINESS_ENGLISH_LIKELY: 'No formal CEFR level stated, but the role\'s international/global scope makes significant active business English highly likely -- treated as a real risk factor, not "no language requirement".',
  LOCATION_ONSITE_FULLTIME_NO_HYBRID: 'Distance from Fehérvárcsurgó combined with full-time on-site attendance and no meaningful hybrid/remote option -- NOT a blanket exclusion of the city itself.',
  OPERATIONAL_SAP_MANUFACTURING_FOCUS: 'Role is primarily SAP-centric / shopfloor-operational manufacturing IT, not genuine leadership scope -- NOT a blanket exclusion of any SAP mention.',
  DOMAIN_FOCUS_MISMATCH: 'The role\'s specific functional focus (e.g. documentation/content-platform transformation) did not fit, independent of its leadership structure -- NOT evidence against cross-functional project leadership in general.',
  MANAGEMENT_SCOPE_ABSENT: 'No genuine leadership/coordination scope found in the ad text.',
  OTHER: 'Reason does not map to an existing stable category; kept as free text only.',
};

// Ordered rules: each maps a Hungarian free-text reason fragment (as
// actually written in profile/learned_preferences.md's real 2026-09-04
// entries) to a stable category. Matched by substring, case-insensitive,
// first match wins -- deliberately simple and auditable rather than a
// generic NLP classifier, since the input is the PO's own short reason
// text, not an arbitrary document.
const REASON_RULES = [
  { pattern: /kötelező.*(felsőfok|folyékony|tárgyalóképes|anyanyelvi).*angol|erős.*aktív.*(üzleti )?angol/i, category: 'LANGUAGE_MANDATORY_ADVANCED_ENGLISH' },
  { pattern: /kötelező.*német.*angol|angol.*és.*német|kombinált nyelvi/i, category: 'LANGUAGE_MULTIPLE_MANDATORY' },
  { pattern: /senior stakeholder|globális.*ország.*angol|valószínűleg.*aktív.*üzleti angol/i, category: 'LANGUAGE_ACTIVE_BUSINESS_ENGLISH_LIKELY' },
  { pattern: /távolság.*helyszíni|helyszíni.*teljes munkaidő|nincs.*hibrid.*remote|no.*hybrid.*remote/i, category: 'LOCATION_ONSITE_FULLTIME_NO_HYBRID' },
  { pattern: /sap.*gyártási|sap.*operatív|shopfloor/i, category: 'OPERATIONAL_SAP_MANUFACTURING_FOCUS' },
  { pattern: /dokumentáci.*platform|content.?platform|transzformációs fókusz/i, category: 'DOMAIN_FOCUS_MISMATCH' },
  { pattern: /nincs.*vezetői felelősség|vezetői felelősség jele nélkül|no.*management.*scope|saját csapat hiánya|csapat hiánya/i, category: 'MANAGEMENT_SCOPE_ABSENT' },
];

export function normalizeDecisionReason(freeText) {
  if (!freeText) return 'OTHER';
  for (const rule of REASON_RULES) {
    if (rule.pattern.test(freeText)) return rule.category;
  }
  return 'OTHER';
}

/**
 * Build the full reason-preserving decision record per JH-SUP-0026 section 4.
 * Never collapses a specific rejection into an overgeneralized rule -- the
 * evidenceFragment field keeps the exact ad text/context that justified the
 * decision, so a future run can re-verify it rather than trust a label.
 */
export function buildDecisionRecord({ decision, reason, secondaryReason = null, evidenceFragment = null }) {
  return {
    poDecision: decision,
    poReason: reason ? String(reason).trim() : null,
    decisionReasonPrimary: normalizeDecisionReason(reason),
    decisionReasonSecondary: secondaryReason ? normalizeDecisionReason(secondaryReason) : null,
    evidenceFragment: evidenceFragment || null,
    updatedAt: new Date().toISOString(),
  };
}

// Real records from profile/learned_preferences.md's 2026-09-04 live PO
// review, normalized -- used as regression fixtures so the categorization
// stays correct against the actual PO decisions it was built from, and so
// the anti-overgeneralization guards (CAIP location, Emerson domain focus)
// are exercised by real data, not synthetic examples.
export const KNOWN_2026_09_04_DECISIONS = [
  { company: 'MOL Group', reasonText: 'Elsődleges ok: a hirdetés erős/aktív angolt követel; ez a PO számára kizáró tényező.', expectedCategory: 'LANGUAGE_MANDATORY_ADVANCED_ENGLISH' },
  { company: 'Deloitte', reasonText: 'Elsődleges ok: kötelező német + angol, legalább B2 szinten; a kombinált nyelvi követelmény kizáró.', expectedCategory: 'LANGUAGE_MULTIPLE_MANDATORY' },
  { company: 'WAY Group / CAIP Hungary', reasonText: 'Elsődleges ok: a nagy távolság együtt a helyszíni, teljes munkaidős működéssel és a hibrid/remote lehetőség hiányával.', expectedCategory: 'LOCATION_ONSITE_FULLTIME_NO_HYBRID' },
  { company: 'Siemens Energy', reasonText: 'Elsődleges ok: a szerep túl SAP-/gyártási IT-központú és operatív.', expectedCategory: 'OPERATIONAL_SAP_MANUFACTURING_FOCUS' },
  { company: 'Emerson', reasonText: 'a dokumentációs/content-platform transzformációs fókusz összességében nem volt megfelelő.', expectedCategory: 'DOMAIN_FOCUS_MISMATCH' },
  { company: 'Iron Mountain', reasonText: 'a globális, több országot és senior stakeholder kommunikációt érintő szerep nagy valószínűséggel jelentős aktív üzleti angolt igényel.', expectedCategory: 'LANGUAGE_ACTIVE_BUSINESS_ENGLISH_LIKELY' },
];
