# Sprint 1 acceptance review — CODEX

**Review ID:** JOB-HUNTER-SPRINT1-ACCEPTANCE-001-CODEX  
**Review mode:** independent bounded acceptance/falsification review  
**Reviewed local revision:** `953bf5b` (`Sprint 1: document acquisition-path reconciliation decision (keep SerpApi, defer Python adapter integration)`)  
**Date:** 2026-09-04  
**Environment limitation:** DEGRADED. Network and git writes were not available, so no pull, live search, or fabricated live run was attempted. This review is limited to the committed files present locally.

## Verdict

**NOT ACCEPTED as a complete implementation of the approved rules.** The scoring tests and run-history test pass, but independent adversarial cases falsify hard-exclusion, English mandatory/preferred distinction, project-leadership evidence, salary attribution, and location attribution rules. Persistence is implemented and wired, with a timestamp-collision caveat.

## Acceptance matrix

| PO-approved rule / Sprint gate | Result | Exact implementation evidence | Independent adversarial result |
| --- | --- | --- | --- |
| Developer, helpdesk, one-person IT, and pure non-lead IC work are hard exclusions | **FAIL** | `SPRINT_1.md:20-23`; `docs/product/PO_DECISIONS_2026-09-04.md:24-29`. `isHardExcludedICRole` only checks the eight title substrings at `apps/job-hunter-mvp/lib/scoring.mjs:26,44-49`; the one-person detector only checks eight description substrings at `:28-42`. | Multiple ordinary excluded titles/phrases do not match (details below). A pure non-lead `IT szolgáltatásmenedzser` can score 78/visible because lack of scope is only a mismatch, not a hard exclusion (`scoring.mjs:164-175`). |
| Genuine project leadership qualifies without direct reports | **PARTIAL / FAIL** | PO rule: `PO_DECISIONS_2026-09-04.md:21-22`. A project-scope match earns 15 points at `scoring.mjs:159-163`, and prevents the PM penalty through `extract.mjs:155-157`. | The detector is an any-one-substring test (`extract.mjs:163-184`), so routine PM administration such as `Stakeholder meetingek adminisztrációja.` is treated as genuine leadership and avoids the penalty. The approved rule requires genuine direction of work/people/suppliers/delivery/development, not a single incidental word. |
| PM title with no real scope is penalized | **PARTIAL / FAIL** | The intended penalty is `scoring.mjs:172-175`; it depends entirely on `isPMWithoutManagementScope` at `extract.mjs:155-157`. | `Projektterv dokumentációjának karbantartása.`, `Erőforrásigények rögzítése.`, `Határidők nyomon követése.`, and `Kockázatkezelési folyamat támogatása.` each make `hasProjectLeadershipScope` true, therefore suppressing the penalty, despite supplying no direction/ownership evidence. |
| Mandatory advanced English is hard-excluded; advanced English merely preferred/incidental is allowed | **FAIL** | PO rule: `SPRINT_1.md:23` and `PO_DECISIONS_2026-09-04.md:36-44`. `checkAdvancedEnglishRequired` is only `ADVANCED_ENGLISH_REGEX.test(text)` (`extract.mjs:87-95`); it contains no mandatory/requirement signal and no preferred/negation handling. The same regex labels the result at `:97-101`. | `Felsőfokú angol nyelvtudás előnyt jelent.`, `Angol nyelvtudás: felsőfok előny.`, `Tárgyalóképes angol előnyt jelent.`, and `Elvárt a felsőfokú német; angol nyelvtudás előny.` all return `true` and are hard-excluded by `scoring.mjs:115-121`, contrary to the PO decision. Conversely, mandatory Hungarian forms `Az angol nyelv magabiztos, üzleti használata elengedhetetlen.` and `Folyékony angol kommunikáció szükséges.` return `false` / `not specified`; Hungarian `folyékony` and this mandatory phrasing are absent from the regex. |
| Missing salary is neutral; confirmed gross below HUF 700k has only a small/moderate penalty; no fabricated salary | **PARTIAL / FAIL** | Neutral missing salary and `-10` below threshold are implemented at `scoring.mjs:83-94`; the score remains bounded/non-excluded (`:194-204`). The parser, however, accepts the first plausible number before `Ft/HUF/forint` without salary or gross/monthly context (`:77-88`). | `Éves cafeteria keret: 500 000 Ft.`, `Utazási támogatás maximum 650 000 Ft/év.`, and `A projekt költségvetése 600 000 Ft.` each produce a fabricated salary amount and `-10` penalty. Confirmed common salary forms `Fizetés: 650 ezer Ft.` and `Bruttó 650.000,- Ft/hó.` produce `amount: null` and no penalty. Thus the implementation is neutral when unmatched, but does not reliably identify *confirmed salary* and can falsely represent unrelated money as the advert's salary. |
| Location has no blanket hard exclusion; Fehérvárcsurgó ring used sensibly | **PARTIAL / FAIL** | No location branch hard-excludes: `scoreLocation` only returns 0–15 points at `scoring.mjs:59-75`, while hard exclusions occur earlier at `:115-140`. The specified primary cities are represented at `:54`; Budapest, distant cities, and remote/hybrid are separately handled at `:55-74`. | Matching is unbounded substring search over **both** location and the full description (`:60-63`). `scoreLocation('London', 'Learn more about our company.')` returns the 15-point Mór-ring bonus because `more` contains `mor`. A Budapest role mentioning a `tatai ügyfél`, or a Budapest workplace with a Mór client, also receives 15 rather than Budapest's 6. This is a nonsensical accessibility bonus and lets incidental text override the actual job location. |
| Newer ads receive advantage; old active ads are not excluded by age | **PASS** | `SPRINT_1.md:26`; `PO_DECISIONS_2026-09-04.md:68-70`. `scoreFreshness` gives +8 through 14 days, +4 through 30 days, and 0 otherwise; it never excludes (`scoring.mjs:96-105`). | A 200-day-old date returns 0, not an exclusion; a future or invalid date is also neutral. |
| Every accepted assessment is 0–100; 60+ is visible | **PASS** | The score is rounded and clamped at `scoring.mjs:194`; visibility is `score >= 60` at `:199`, with the exported threshold at `:207`. `run.mjs:280,289-291` records the same threshold and visible count. | The maximum-factor test remains bounded by the explicit clamp. The lower-bound adversarial PM assessment returned 32, also within range. |
| Duplicate handling uses title+company key | **PASS, with data-quality limitation** | Results are deduplicated after scoring by exactly lowercased `title|company` at `apps/job-hunter-mvp/run.mjs:266-278`, retaining the higher score and sorting descending. | This meets the requested title+company-key behavior. It does not trim whitespace, normalize accents/punctuation, or deduplicate exclusions, so semantically identical variants can remain, while genuinely separate openings at the same company with the same title collapse. Those are limitations of the chosen key rather than a departure from the requested key. |
| Every live run persists the exact result set for later PO review | **PASS, with collision caveat** | `run.mjs:282-295` builds the complete output (results, excluded, unreachable and audit metadata); it writes the current-run JSON at `:297-298` then awaits `persistRunHistory` at `:299`. `persistRunHistory` creates `docs/evidence/job-hunter-runs` (`lib/run-history.mjs:24-34`) and writes the same snapshot to timestamped JSON and `latest.json` using write-to-`.tmp` then rename (`:8-12,36-39`). The helper's independent file-write test passes at `lib/run-history.test.mjs:8-27`. | The payload is preserved rather than re-scored (`run-history.mjs:28-29`). However, the snapshot filename is only a sanitized `generatedAt` timestamp (`:4-6,33`): two runs with the same supplied millisecond timestamp target the same file, and use the same `.tmp` filename. In that collision case the allegedly immutable prior snapshot can be overwritten or concurrent writes can interfere. Normal sequential runs are durably persisted; the universal “every” claim is not collision-proof. |

## Detailed falsifications

### 1. Hard exclusions are materially incomplete

`isHardExcludedICRole` cannot recognize common excluded roles outside its short title list. Direct calls returned `false` for all of the following title/description pairs:

| Candidate designed to be excluded | Result | Why it slips |
| --- | --- | --- |
| `Szoftvermérnök` / `Önállóan fejleszt és üzemeltet.` | not IC-excluded | `szoftvermérnök` is absent from `IC_ONLY_TITLE_TERMS` (`scoring.mjs:26`). |
| `IT Support` / `Felhasználók támogatása.` | not IC-excluded | Only English `support specialist` is listed, not `IT Support`. |
| `Service Desk Analyst` / `Incidenseket kezel.` | not IC-excluded | No `service desk` marker. |
| `IT ügyféltámogató` / `Hibajegyek kezelése.` | not IC-excluded | No Hungarian customer-support synonym marker. |
| `Senior Developer` / `Stakeholder igényeket egyeztet a fejlesztéshez.` | not IC-excluded | The incidental `stakeholder` word is interpreted as project leadership by `extract.mjs:163-184`; no actual leadership is required. |
| `Backend Developer` / `Projektterv szerint fejleszt.` | not IC-excluded | The incidental `projektterv` word has the same effect. |
| `A vállalat egyetlen informatikusaként teljes körű IT-támogatást nyújt.` | not one-person-IT-excluded | This ordinary Hungarian sole-IT phrasing is absent from `ONE_PERSON_IT_MARKERS` (`scoring.mjs:28-37`). |
| `Az IT-infrastruktúra kizárólagos felelőse lesz.` | not one-person-IT-excluded | No marker covers exclusive IT responsibility. |
| `Egy főből álló IT-csapatunkhoz keresünk kollégát.` | not one-person-IT-excluded | Only the exact `egy fős it csapat` wording is recognized. |

Additionally, the scoring flow cannot enforce the PO's pure-IC hard exclusion generally. It hard-excludes only the narrow title detector before accepting any `positionRelevant` role (`scoring.mjs:123-140`). For this fully supplied assessment:

```text
title: IT szolgáltatásmenedzser
description: Önálló hibajegykezelés és felhasználói támogatás. Székesfehérvár.
location: Székesfehérvár
datePosted: now
positionRelevant: true
isGenericTitle: false
```

the implementation returns `hardExcluded: false`, `score: 78`, `visible: true`, although it records that no leadership evidence exists. `IT szolgáltatásmenedzser` is explicitly accepted as a target-title substring (`extract.mjs:227-234`), and missing scope only adds prose at `scoring.mjs:164-165`. An analogous pure helpdesk `IT Service Manager` assessment also returns 78/visible because it avoids the narrow helpdesk-title list.

### 2. Project leadership test accepts evidence of support, not leadership

The approved distinction is substantive: direct reports are unnecessary when the role genuinely directs work, people, suppliers, delivery, or development (`PO_DECISIONS_2026-09-04.md:21-22`). The implementation treats any one of 16 broad terms as enough (`extract.mjs:163-184`). Therefore a coordinator/admin can gain +15 (`scoring.mjs:159-163`) and evade a PM no-scope penalty (`scoring.mjs:172-175`) merely by mentioning a project artifact or a stakeholder. The code correctly supports the positive canonical scenario from the implementation test, but it does not distinguish it from the falsifying cases above.

### 3. English parser cannot make the required mandatory/preferred distinction

The English exclusion is invoked before all other assessments (`scoring.mjs:115-122`), so each false positive removes a vacancy completely. Regex proximity (`extract.mjs:87-88`) solves a few word-order variants but does not inspect context such as `előny`, `előnyt jelent`, `nem elvárás`, or `kötelező/elvárt/szükséges`. It also conflates a nearby advanced descriptor for another language: `Elvárt a felsőfokú német; angol nyelvtudás előny.` falls inside the allowed 25-character window and is excluded.

### 4. Salary parser misattributes any HUF amount as monthly gross pay

The comment promises a monthly-gross reader (`scoring.mjs:77-80`), but `SALARY_REGEX` only requires a number plus currency (`:81`). There is no salary label, gross marker, monthly cadence, or exclusion of benefit/budget contexts. The output formatter will then present the amount as `bruttó, hirdetésből` in `run.mjs:254-263`, which is specifically misleading for the cafeteria, travel allowance, and project-budget falsifications.

### 5. Location must prioritize the actual workplace, not arbitrary ad text

The ring list itself covers every named first-round city, including optional Dunaújváros (`PO_DECISIONS_2026-09-04.md:54-62`; `scoring.mjs:54`). No hard location exclusion exists, which is correct. The defect is source attribution and token boundaries: `scoreLocation` merges two semantically different fields and calls `.includes` for short unaccented alternatives such as `mor` (`scoring.mjs:54,60-63`). This allows arbitrary prose to set the commute score.

## Verification performed

- Read the canonical Sprint source and PO decisions: `SPRINT_1.md:1-123`; `docs/product/PO_DECISIONS_2026-09-04.md:1-123`.
- Inspected the requested scoring, extraction, run wiring, run-history implementation, and both test files.
- Ran offline unit tests only: `node --test apps/job-hunter-mvp/lib/scoring.test.mjs` and `node --test apps/job-hunter-mvp/lib/run-history.test.mjs`; both passed (one test file each, zero failures).
- Ran only local, deterministic function probes for the adversarial cases recorded above. No network request, live pipeline run, git pull, or product-code change was made.

## Required disposition

The hard-exclusion and language failures directly conflict with Sprint Definition of Done item 5 (`SPRINT_1.md:90-93`) and PO sections 2–4. Remedy and retest these before treating this rule implementation as accepted. This review intentionally does not prescribe or implement fixes.
