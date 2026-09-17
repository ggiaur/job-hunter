import { normalizeCompanyTokens, normalizeTitle } from './vacancy-dedup.mjs';

// Evidence overlap is deliberately bounded: it is not an inferred skill level
// or a probability of being hired. Missing evidence is never a hard exclusion.
const SPECIALIST_TERMS = ['SAP', 'Kubernetes', 'OpenShift', 'WebLogic', 'AWS', 'ITIL', 'PMP', 'PRINCE2', 'Databricks', 'machine learning', 'data science', 'data engineering'];

function findTerm(text, term) {
  const lower = text.toLowerCase();
  const needle = term.toLowerCase();
  let index = lower.indexOf(needle);
  while (index >= 0) {
    const before = lower[index - 1] || '';
    const after = lower[index + needle.length] || '';
    if (!/[\p{L}\p{N}]/u.test(before) && (needle.length > 3 || !/[\p{L}\p{N}]/u.test(after))) return index;
    index = lower.indexOf(needle, index + 1);
  }
  return -1;
}

export function compareCandidate(candidate, descriptionText = '') {
  if (!candidate) return null;
  const matches = [];
  for (const fact of candidate.facts) {
    const term = fact.terms.find(term => findTerm(descriptionText, term) >= 0);
    if (!term) continue;
    const index = findTerm(descriptionText, term);
    matches.push({
      factId: fact.id,
      label: fact.label,
      cvEvidence: fact.evidence,
      jobEvidence: descriptionText.slice(Math.max(0, index - 70), index + term.length + 100).trim(),
    });
  }
  const unverifiedSkills = SPECIALIST_TERMS.filter(term =>
    findTerm(descriptionText, term) >= 0 && !candidate.facts.some(fact => fact.terms.some(t => t.toLowerCase() === term.toLowerCase()))
  );
  const additionalMatches = matches.filter(m => !['people-leadership', 'project-leadership'].includes(m.factId));
  return {
    version: candidate.version,
    sourceFile: candidate.sourceFile,
    sourceSha256: candidate.sourceSha256,
    matches,
    unverifiedSkills,
    overlapPoints: Math.min(10, additionalMatches.length * 2),
    education: candidate.education,
    english: candidate.english,
  };
}

// A previously reviewed employer/title is shown with the PO's original reason. It
// must not invent blanket exclusions for other employers or other roles.
//
// Exact string equality was too strict to be useful: of the six real
// DO_NOT_APPLY decisions in profile/learned_preferences.md, only ONE was
// recognised in the 2026-09-17 run, because portals spell the same job
// differently.
//
//   recorded : "WAY Group / CAIP Hungary — IT Manager, Nyíregyháza"
//   advert   : company "WAY Group", title "IT Manager (m/f/d) | CAIP Hungary, …"
//
// so an advert the PO had explicitly rejected came back as a 78% candidate.
//
// Employer: the same token-prefix rule as vacancy dedup, which is what
// parent/subsidiary and short/long names look like once legal forms are dropped.
// Title: the shorter token list must be fully contained in the longer AND be at
// least MIN_TITLE_TOKEN_RATIO of its length. The ratio is the guard that keeps a
// DIFFERENT role at the same employer from inheriting a rejection -- e.g.
// "IT Manager" (2 tokens) against the recorded "IT Development and Operations
// Manager" (4 significant tokens) is 0.5 and correctly does not match. Inheriting
// there would silently delete a real opportunity, which is worse than showing a
// repeat the PO dismisses at a glance.
const MIN_TITLE_TOKEN_RATIO = 0.6;

function titleTokens(value) {
  return normalizeTitle(value).split(' ').filter(Boolean);
}

function titlesReferToSameRole(a, b) {
  const tokensA = titleTokens(a);
  const tokensB = titleTokens(b);
  if (!tokensA.length || !tokensB.length) return false;
  const [shorter, longer] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  if (shorter.length / longer.length < MIN_TITLE_TOKEN_RATIO) return false;
  const longerSet = new Set(longer);
  return shorter.every((token) => longerSet.has(token));
}

function employersMatch(a, b) {
  const tokensA = normalizeCompanyTokens(a);
  const tokensB = normalizeCompanyTokens(b);
  if (!tokensA.length || !tokensB.length) return false;
  const [shorter, longer] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  return shorter.every((token, i) => token === longer[i]);
}

export function findPriorFeedback(learnedText, company, title) {
  if (!company || !title) return [];
  const matches = [];
  for (const line of (learnedText || '').split('\n')) {
    const match = line.match(/^- \*\*(.+?)\s+—\s+(.+?):\*\*\s*(DO_NOT_APPLY|APPLY)\.?\s*(.*)$/);
    if (!match) continue;
    const [, recordedCompany, recordedTitle, decision, reason] = match;
    if (!employersMatch(recordedCompany, company)) continue;
    if (!titlesReferToSameRole(recordedTitle, title)) continue;
    matches.push({
      decision,
      reason: reason.trim(),
      matchedRecord: `${recordedCompany} — ${recordedTitle}`,
      source: 'profile/learned_preferences.md',
    });
  }
  return matches;
}
