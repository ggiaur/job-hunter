export const SHORTLIST_MAX = 15;

function normalizeWords(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function employerBrand(company) {
  const first = normalizeWords(company).split(' ').find(Boolean) || '';
  // Cross-source company labels often alternate between the parent brand and
  // a legal subsidiary (MVM/MVMI, MOL Group/MOL IT..., E.ON ...). The exact
  // same title plus this conservative brand token equivalence is enough to
  // identify a syndication duplicate without merging different employers.
  if (first === 'mvmi') return 'mvm';
  return first;
}

function sameEmployerBrand(a, b) {
  const left = employerBrand(a);
  const right = employerBrand(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return Math.min(left.length, right.length) >= 3
    && Math.abs(left.length - right.length) <= 1
    && (left.startsWith(right) || right.startsWith(left));
}

export function dedupeCrossSourceJobs(rows) {
  const selected = [];
  for (const row of [...rows].sort((a, b) => b.relevancePercent - a.relevancePercent)) {
    const duplicate = selected.find((candidate) =>
      normalizeWords(candidate.title) === normalizeWords(row.title)
      && sameEmployerBrand(candidate.company, row.company));

    if (!duplicate) {
      selected.push({ ...row, alternateSources: [] });
      continue;
    }

    duplicate.alternateSources.push({
      source: row.source,
      company: row.company,
      url: row.url,
      relevancePercent: row.relevancePercent,
    });
  }
  return selected;
}

export function applyShortlistLimit(rows, max = SHORTLIST_MAX, requiredUrlFragments = []) {
  const qualifiedIndexes = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.relevancePercent >= 60)
    .map(({ index }) => index);
  const selected = new Set(qualifiedIndexes.slice(0, max));
  const isRequired = (row) => requiredUrlFragments.some((fragment) => row.url?.includes(fragment));

  // Known-positive canaries are not injected and never bypass the score gate;
  // if genuinely acquired and qualified, keep them in the bounded shortlist.
  // Replace the lowest-ranked non-canary slot rather than exceeding the cap.
  for (const index of qualifiedIndexes.filter((i) => isRequired(rows[i]))) {
    if (selected.has(index)) continue;
    const replaceIndex = [...selected].reverse().find((i) => !isRequired(rows[i]));
    if (replaceIndex == null) continue;
    selected.delete(replaceIndex);
    selected.add(index);
  }

  return rows.map((row, index) => ({
    ...row,
    qualified: row.relevancePercent >= 60,
    visible: selected.has(index),
  }));
}
