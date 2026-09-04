import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

/**
 * Default location for additive PO decision storage.
 * Separate from immutable run snapshots as per RESULT_CONTRACT.md.
 */
export const DEFAULT_DECISIONS_FILE = 'docs/evidence/po-decisions.json';

/**
 * Load PO decisions dictionary keyed by job url.
 * @param {string} filepath 
 * @returns {Record<string, { poDecision: 'APPLY' | 'DO_NOT_APPLY', poReason: string | null, updatedAt: string }>}
 */
export function loadDecisions(filepath = DEFAULT_DECISIONS_FILE) {
  const absPath = resolve(filepath);
  if (!existsSync(absPath)) {
    return {};
  }
  try {
    const raw = readFileSync(absPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[decisions] Could not parse decisions file at ${filepath}: ${err.message}`);
    return {};
  }
}

/**
 * Save or update a PO decision for a given vacancy URL.
 * @param {string} url - Direct vacancy URL
 * @param {'APPLY' | 'DO_NOT_APPLY' | null} decision - Decision type
 * @param {string | null} reason - Optional short rationale
 * @param {string} filepath - Storage JSON path
 * @returns {Record<string, any>} Updated decisions dictionary
 */
export function saveDecision(url, decision, reason = null, filepath = DEFAULT_DECISIONS_FILE) {
  if (!url) {
    throw new Error('URL is required to index a PO decision');
  }
  const decisions = loadDecisions(filepath);
  
  if (decision === null) {
    delete decisions[url];
  } else {
    decisions[url] = {
      poDecision: decision,
      poReason: reason ? String(reason).trim() : null,
      updatedAt: new Date().toISOString()
    };
  }

  const absPath = resolve(filepath);
  writeFileSync(absPath, JSON.stringify(decisions, null, 2), 'utf-8');
  return decisions;
}

/**
 * Merge saved PO decisions into run result items without mutating the original run snapshot.
 * @param {object} runData - Parsed run JSON matching RESULT_CONTRACT.md
 * @param {Record<string, any>} decisionsDict - Decisions dictionary
 * @returns {object} Deep clone of runData with poDecision & poReason fields merged
 */
export function mergeDecisions(runData, decisionsDict = {}) {
  const cloned = JSON.parse(JSON.stringify(runData));

  if (Array.isArray(cloned.results)) {
    for (const row of cloned.results) {
      if (row.url && decisionsDict[row.url]) {
        row.poDecision = decisionsDict[row.url].poDecision;
        row.poReason = decisionsDict[row.url].poReason;
        row.poDecisionUpdatedAt = decisionsDict[row.url].updatedAt;
      }
    }
  }

  if (Array.isArray(cloned.excluded)) {
    for (const row of cloned.excluded) {
      if (row.url && decisionsDict[row.url]) {
        row.poDecision = decisionsDict[row.url].poDecision;
        row.poReason = decisionsDict[row.url].poReason;
        row.poDecisionUpdatedAt = decisionsDict[row.url].updatedAt;
      }
    }
  }

  return cloned;
}
