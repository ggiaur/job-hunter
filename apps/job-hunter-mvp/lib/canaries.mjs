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
 * Check each canary against a completed run's full stage-evidence rows
 * (objects with at least `url` and `fetch: {attempted, ok, ...}`) plus the
 * final results/excluded arrays.
 *
 * Status values, from weakest to strongest evidence of real evaluation:
 * - NOT_ACQUIRED: no matching stage-evidence row at all -- never even
 *   discovered as a candidate. This is the original Pillér-miss failure.
 * - FETCH_FAILED: discovered and a fetch was attempted, but it failed
 *   (network error / non-2xx) -- an explicit, evidence-backed source
 *   failure, distinct from never having tried.
 * - ACQUIRED_UNSCORED: fetch succeeded but the candidate never reached the
 *   results/excluded arrays (e.g. no JobPosting schema confirmed).
 * - ACQUIRED_EXCLUDED / ACQUIRED_SCORED_BELOW_THRESHOLD / ACQUIRED_VISIBLE:
 *   genuinely reached scoring -- the real invariant this canary mechanism
 *   exists to prove.
 *
 * An independent Codex adversarial review (2026-09-04) found the prior
 * version treated bare URL presence in a flat list (added at discovery
 * time, before any fetch) as "acquired", conflating "identified as a
 * candidate" with "successfully fetched" -- this version requires the real
 * stage-evidence fetch outcome.
 */
export function checkCanaries(stageEvidenceRows, { results = [], excluded = [] } = {}, canaries = CANARIES) {
  return canaries.map((canary) => {
    const row = stageEvidenceRows.find((r) => r.url.includes(canary.urlFragment));
    const resultRow = results.find((r) => r.url.includes(canary.urlFragment));
    const excludedRow = excluded.find((r) => r.url.includes(canary.urlFragment));
    let status;
    if (resultRow) status = resultRow.visible ? 'ACQUIRED_VISIBLE' : 'ACQUIRED_SCORED_BELOW_THRESHOLD';
    else if (excludedRow) status = 'ACQUIRED_EXCLUDED';
    else if (!row) status = 'NOT_ACQUIRED';
    else if (row.fetch && row.fetch.attempted && !row.fetch.ok) status = 'FETCH_FAILED';
    else status = 'ACQUIRED_UNSCORED';
    return {
      id: canary.id,
      label: canary.label,
      status,
      score: resultRow ? resultRow.relevancePercent : null,
      exclusionReason: excludedRow ? excludedRow.exclusionReason : null,
      fetchError: row && row.fetch ? row.fetch.error : null,
    };
  });
}

/** True only when every canary genuinely reached scoring (visible, below-threshold, or excluded) -- not merely discovered or fetched. */
export function allCanariesReachedScoring(canaryResults) {
  const scored = new Set(['ACQUIRED_VISIBLE', 'ACQUIRED_SCORED_BELOW_THRESHOLD', 'ACQUIRED_EXCLUDED']);
  return canaryResults.every((c) => scored.has(c.status));
}

/** Looser check: every canary was at least discovered and had a fetch attempted (whether or not it succeeded) -- distinguishes "never tried" from "tried and failed" or "reached scoring". */
export function allCanariesAcquired(canaryResults) {
  return canaryResults.every((c) => c.status !== 'NOT_ACQUIRED');
}
