// JH-SUP-0026 section 3: persist candidate-level stage evidence so a future
// miss like Pillér's is explainable directly from a run's own persisted
// data, without reconstructing history from guesses (the exact limitation
// that made three independent Pillér analyses have to reproduce the funnel
// live instead of just reading it back). Compact JSON, no raw HTML.

/**
 * One row per URL touched at any stage. Built incrementally as run.mjs
 * processes stages A (SerpApi/direct-Profession discovery) through scoring.
 */
export function createStageEvidenceRow(url) {
  return {
    url,
    discoveredVia: null, // 'serpapi' | 'profession-direct' | 'listing-traversal'
    query: null,
    serpRank: null,
    fromListing: null,
    fetch: null, // { attempted, ok, status, error }
    sourceType: null, // 'JOB_AD_CONFIRMED' | 'LISTING' | 'UNKNOWN'
    jobPostingVerified: false,
    titleDomainGate: null, // 'passed' | 'failed' | 'n/a'
    hardExclusionReason: null,
    score: null,
    visible: null,
    dedupParentUrl: null,
    outcome: null, // 'visible' | 'excluded' | 'unreachable' | 'deduped'
  };
}

/**
 * Build a per-listing-page coverage summary row per JH-SUP-0026 section 7
 * item 3's required report format: real detail links present/observed vs
 * queued vs fetched vs confirmed vs excluded/scored, plus any explicitly
 * missed links.
 */
export function buildListingCoverageRow(listingUrl, linkExtractionResult, { fetchedCount = 0, confirmedCount = 0 } = {}) {
  return {
    listingUrl,
    totalDetailLinksFound: linkExtractionResult.totalDetailLinksFound,
    filteredNonJobCount: linkExtractionResult.filteredNonJobCount,
    filteredReasons: linkExtractionResult.filteredReasons,
    queuedCount: linkExtractionResult.queuedCount,
    truncatedCount: linkExtractionResult.truncatedCount,
    fetchedCount,
    confirmedCount,
    missedDueToTruncation: linkExtractionResult.truncatedCount > 0
      ? `${linkExtractionResult.truncatedCount} real detail links beyond the per-page cap were not queued`
      : null,
  };
}

/**
 * Summarize a set of stage-evidence rows into funnel counts, for a quick
 * top-level sanity check without re-deriving from the full array each time.
 */
export function summarizeFunnel(rows) {
  const summary = { total: rows.length, byOutcome: {}, byDiscoveredVia: {} };
  for (const row of rows) {
    if (row.outcome) summary.byOutcome[row.outcome] = (summary.byOutcome[row.outcome] || 0) + 1;
    if (row.discoveredVia) summary.byDiscoveredVia[row.discoveredVia] = (summary.byDiscoveredVia[row.discoveredVia] || 0) + 1;
  }
  return summary;
}
