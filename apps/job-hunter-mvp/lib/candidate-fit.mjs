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

// An exact previously reviewed employer/title is shown with the PO's original
// reason. It does not invent new blanket exclusions for other employers/roles.
export function findPriorFeedback(learnedText, company, title) {
  const normalize = value => (value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const normalizedTitle = normalize(title);
  const normalizedCompany = normalize(company);
  const matches = [];
  for (const line of (learnedText || '').split('\n')) {
    const match = line.match(/^- \*\*(.+?)\s+—\s+(.+?):\*\*\s*(DO_NOT_APPLY|APPLY)\.\s*(.+)$/);
    if (!match) continue;
    if (normalize(match[1]) !== normalizedCompany || normalize(match[2]) !== normalizedTitle) continue;
    matches.push({ decision: match[3], reason: match[4], source: 'profile/learned_preferences.md' });
  }
  return matches;
}
