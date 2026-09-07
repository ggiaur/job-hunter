# JH-SUP-0028 — Live inventory recovery: 6 visible is not enough yet

**Priority:** P0  
**Mode:** execute immediately; implementation + live verification  
**Product Owner outcome:** show 7–15 genuinely relevant, currently live vacancies when current inventory supports it; do not weaken fit rules to inflate count.

## Current proven state (fresh rerun, 2026-09-08 local / 2026-09-07T23:12:59Z evidence)

The GitHub-hosted live recovery run completed the full pipeline and failed only the product acceptance gate:

- deterministic tests: 77 pass, 1 skip, 0 fail;
- GitHub Actions has **no `SERPAPI_API_KEY` secret**, therefore every SerpApi query returned HTTP 401 and the run used direct Profession.hu acquisition only;
- direct Profession acquisition discovered **119 real detail URLs**;
- **119/119** were confirmed `schema.org/JobPosting` pages; 0 unreachable in this rerun;
- result set: 11 scored records, **6 visible >=60**, 5 scored below threshold, 103 hard-excluded;
- all three known-positive canaries reached scoring and are visible:
  - Pillér Nonprofit Kft. Projektmenedzser — 85;
  - EN-CO Software Senior IT projektmenedzser — 93;
  - Swiss Medical Services Projektmenedzser IT — 81;
- product acceptance failed solely because visible count was 6 rather than the requested 7–15.

This is no longer a launcher mystery or Pillér regression. The current blocker is **insufficient live acquisition breadth / usable inventory under the GitHub-hosted Profession-only path**.

## Required work now

### 1. Do not game the target

Do **not** lower the 60 relevance threshold, remove English/location/domain safeguards, or promote clearly weak roles merely to turn 6 into 7.

First inspect the 5 below-threshold records and the highest-scoring hard-excluded records. For each, prove whether it is a truthful rejection/low score or a scoring false negative. Persist the analysis.

### 2. Restore multi-source acquisition

The system is supposed to be multi-source. GitHub-hosted recovery currently has no SerpApi credential and therefore runs Profession-only.

Use the safest already-authorized path available:

- first preference: recover/execute the on-prem Job Hunter path where the approved SerpApi credential already exists outside git at the established secret location;
- if the local orchestrator/launcher is still unavailable, fix that runtime/launcher failure as part of this directive and record the exact cause;
- do **not** copy or expose the SerpApi key into git, logs, PR text, or evidence;
- do not silently create or move secrets into GitHub Actions. If GitHub Actions needs a new secret, record that as an explicit external authorization/configuration blocker rather than weakening the run.

In parallel, add at least one legitimate additional credential-free acquisition source if it can be implemented and verified quickly (direct employer career pages / another Hungarian job portal / aggregator with stable public vacancy-detail pages). Preserve source provenance and deduplicate before scoring.

### 3. Re-run live acceptance

Run a fresh E2E after the acquisition/scoring work.

PASS criteria:

- 7–15 current, concrete, reachable, profile-relevant jobs if the live inventory genuinely supports that many;
- if exhaustive multi-source acquisition still produces fewer than 7, do not fabricate a PASS: show the actual count plus auditable evidence that remaining candidates were truthfully excluded or below threshold;
- Pillér, EN-CO, Swiss canaries must all be acquired and evaluated while still live;
- each visible vacancy must have title, company, direct URL, language evidence, location/work arrangement, score, fit reasons, mismatch reasons, and freshness/reachability status;
- no stale/generic listing page may count as a vacancy.

### 4. Independent quality review

- **Codex:** adversarially inspect the 5 below-threshold and top excluded records for false-negative scoring; challenge English, location, management-scope and title/domain gates.
- **Gemini:** independently review live recall breadth and whether the final 7–15 shortlist is genuinely apply-worthy rather than threshold gaming.
- Material findings must be fixed and regression-tested before PASS.

### 5. CI / PR closeout

PR #5 correctly makes live acceptance fail closed. Keep that principle. Merge/apply the acceptance gate only after the live path can satisfy the business requirement or after the evidence proves fewer than 7 genuinely exist and the Product Owner explicitly accepts that lower inventory.

## Required evidence

Persist fresh evidence under `docs/evidence/job-hunter-runs/` and update the current-run evidence. Add a concise human-readable report containing:

- source-by-source acquisition counts;
- exact 7–15 visible jobs (or truthful lower count with proof);
- analysis of the 5 previously below-threshold records;
- top excluded records and reasons;
- canary results;
- exact remaining blocker, if any.

## Finish condition

Update supervisor ACK to `JH-SUP-0028` with one of:

- `JOB_HUNTER_LIVE_INVENTORY_PASS` — requirements satisfied; or
- `JOB_HUNTER_LIVE_INVENTORY_BLOCKED` — one precise external blocker plus evidence.

Do not stop at a status note, design document, or another passive wait. Implement, run, review, and preserve the live result.