// JH-SUP-0026 section 2: known-positive regression canaries. The invariant
// is that a canary is ACQUIRED and EVALUATED through real discovery -- never
// injected/hard-coded into the output. A canary may legitimately end up
// excluded after full scoring; what must never happen again is a canary
// silently vanishing before it ever reaches scoring, the way Pillér did.

export const CANARIES = [
  {
    id: 'piller-nonprofit-projektmenedzser',
    label: 'Pillér Nonprofit Kft. — Projektmenedzser',
    urlFragment: 'projektmenedzser-piller-nonprofit-kft',
  },
  {
    id: 'en-co-software-senior-it-projektmenedzser',
    label: 'EN-CO Software Zrt. — Senior IT projektmenedzser',
    urlFragment: 'senior-it-projektmenedzser-en-co-software',
  },
  {
    id: 'swiss-medical-services-projektmenedzser-it',
    label: 'Swiss Medical Services Kft. — Projektmenedzser IT területen',
    urlFragment: 'projektmenedzser-it-teruleten-swiss-medical-services',
  },
];

/**
 * Check each canary against a completed run's stage-evidence rows (or
 * results/excluded/unreachable arrays -- anything with a `url` field).
 * "Acquired" means the canary's URL appears anywhere in the combined set,
 * i.e. it was at least fetched, regardless of its final outcome.
 */
export function checkCanaries(allTrackedUrls, { results = [], excluded = [] } = {}, canaries = CANARIES) {
  return canaries.map((canary) => {
    const acquired = allTrackedUrls.some((u) => u.includes(canary.urlFragment));
    const resultRow = results.find((r) => r.url.includes(canary.urlFragment));
    const excludedRow = excluded.find((r) => r.url.includes(canary.urlFragment));
    let status;
    if (resultRow) status = resultRow.visible ? 'ACQUIRED_VISIBLE' : 'ACQUIRED_SCORED_BELOW_THRESHOLD';
    else if (excludedRow) status = 'ACQUIRED_EXCLUDED';
    else if (acquired) status = 'ACQUIRED_UNSCORED';
    else status = 'NOT_ACQUIRED';
    return {
      id: canary.id,
      label: canary.label,
      status,
      score: resultRow ? resultRow.relevancePercent : null,
      exclusionReason: excludedRow ? excludedRow.exclusionReason : null,
    };
  });
}

export function allCanariesAcquired(canaryResults) {
  return canaryResults.every((c) => c.status !== 'NOT_ACQUIRED');
}
