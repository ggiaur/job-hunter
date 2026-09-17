# Job Hunter repair session — 2026-09-17 (evening)

Direct Claude work under Product Owner authority. Codex and Gemini remained
stopped throughout.

Trigger: the PO reported that "a lot of searches went wrong, e.g. the higher
education requirement was confused with advanced English, and several others".
That report was correct, and chasing it surfaced four further defects plus one
incident caused by this session.

## What the goal actually is

Restated, because the earlier framing was wrong: the goal is **that the PO ends up
in a better job.** `SPRINT_1.md` §6's "at least one PO-apply-worthy result" is the
acceptance *test*, not the goal. Everything else — score, HTML, evidence chain — is
instrumental. On the real measure (an application sent) the project stands at zero.

## Defects found and fixed

All five were measured against the committed `docs/evidence/real-job-hunter-current-run.json`
(the real 2026-09-17T08:14Z acquisition, 682 advert pages, 31 scored rows), never
against fixtures.

### 1. Degree requirement read as an advanced-English requirement — the PO's report

`ADVANCED_ENGLISH_REGEX`'s proximity window was `[^.\n;]`, which does not stop at a
comma. Hungarian requirement bullets are comma-separated lists, so

    "Felsőfokú végzettség, angol nyelvtudás"

put `felsőfokú` (modifying *végzettség*) 14 characters from `angol` and the advert
was **hard-excluded** as requiring advanced English. Generic adjectives leaked the
same way (`"Kiváló kommunikációs készség, angol nyelvtudás"`). Correctness was
accidental rather than semantic: the same phrasing with one extra word
(`"felsőfokú informatikai végzettség, angol"`) passed only because it exceeded the
25-character window.

Fix: the language test splits a clause into comma items and requires the level word
and `angol` to share one item, with a carve-in that merges a dangling bare level
phrase back (`"angol nyelvtudás, tárgyalóképes szinten"` still excludes).

Recall is the priority here: a hard exclusion deletes the advert from the report, so
a false positive is **invisible** to the PO, whereas a false negative only shows one
advert he dismisses at a glance.

Tests: `lib/english-level-conflation.test.mjs`, written before the fix, confirmed
failing on the first case.

**Honest impact measurement — no adverts were recovered.** Of the 184 English
exclusions in the snapshot, 43 could be re-fetched and all 43 remain correctly
excluded. Spot check confirms the detector rather than the bug: MOL Group E&P IT
Operations Manager is among them, which the PO himself rejected for exactly this
reason on 2026-09-04. The other 141 are unverified (103 profession.hu HTTP 503, 35
LinkedIn HTTP 429, 3 expired). So the bug was real and is fixed, but its measured
cost on this run is not yet demonstrated.

### 2. Duplicate vacancies presented as separate candidates

`lib/vacancy-dedup.mjs` replaces an exact `title|company` key that still left two
duplicate pairs among 15 candidates:

* `"MVM"` vs `"MVM Ügyfélkapcsolati Kft."` — same job, both 92%;
* `"IT Manager"` vs `"IT Manager (4174)"` — agency code in the title, both 72%.

The report *disclosed* this instead of fixing it.

Matching requires normalised titles to be equal and employer token lists to be
prefixes of one another, because merging is the destructive direction. Distinct
roles at one employer always survive (Indotek junior-IT vs PMO; 2Connect wired vs
mobile team lead are pinned as negative cases). On an equal-score tie the primary
job portal beats a LinkedIn mirror — the employer's own advert has the full
requirement text and a direct application route.

### 3. No seniority scoring at all

`grep -rn junior apps/job-hunter-mvp/lib` returned nothing outside comments.
`"Indotek Group — Projektmenedzser (junior IT)"` therefore scored **81**, level with
a genuine csoportvezető role, for a candidate with 20+ years who heads a 6-person IT
department.

`profile/persona.md` lists "Junior / entry-level" among the zero-point exclusions but
adds *"KIVÉVE ha a pozíció maga vezetői/menedzseri jellegű … NE zárd ki
automatikusan"*. A **-25 penalty** is the only reading that honours both halves. Read
from the **title only**: `"junior kollégák mentorálása"` in a description is a duty of
a senior role, and a regression test pins that. `assistant` is deliberately not a
marker — persona.md names "assistant IT team lead" as acceptable.

Re-scoring all 31 rows moved exactly one and left the other 30 byte-identical:
`81 -> 56`.

### 4. Recorded PO rejections not recognised across name variants

Six DO_NOT_APPLY decisions are recorded; only one was matched, because
`findPriorFeedback()` demanded exact equality of both employer and title. The WAY
Group / CAIP advert the PO rejected for distance came back as a 78% candidate.

**Correction to the initial diagnosis:** enforcement was never broken — the report
already filters `DO_NOT_APPLY` out of the candidate list. Only recognition was.

Employer now uses the dedup token-prefix rule; title requires containment plus a
≥60% token-length ratio, which is the guard that stops a different role at the same
employer from inheriting a rejection. Recognised decisions on real data: **1 → 2**
(both that are actually present in this run).

### 5. Quota was being spent by ordinary code changes

`job-hunter-live.yml` ran a full ~17-query live pipeline on every push to `main` and
on pull requests touching `apps/job-hunter-mvp/**` — the last 15 commits contain 8
bot result-refresh commits. The key is a **250/month free allowance shared with
IT-Lens**.

Per PO decision (2026-09-17): **two live runs per week**, `cron: '30 5 * * 1,4'` plus
`workflow_dispatch`, no push trigger. New `job-hunter-tests.yml` keeps push/PR gated
by the deterministic suite with no API key. Verified: the first push after the change
triggered only the 12-second test workflow.

## Incident caused by this session

A command intended only to check that `run.mjs` still parses used
`import('./run.mjs')`, which executed `main()` and spent **~17 SerpApi searches**
before it could be killed, producing no output at all.

Two guards now make that class of mistake impossible:

* `run.mjs` calls `main()` only when it is the process entry point. Verified: the
  import resolves in 23ms and the account balance was unchanged at 26.
* `scripts/check-search-quota.mjs` runs as a live pre-flight and refuses to start
  when headroom is short, or when the balance cannot be read. A partial run is the
  worst outcome available: it spends the remainder **and** returns an incomplete set
  in which unsearched role families read as "no such jobs exist".

## Quota state (measured via serpapi.com/account)

    plan            Free, 250/month
    used            224
    remaining       26

One live run (~17) is possible before the monthly reset. The two-per-week schedule
can therefore only begin in October; the Monday 2026-09-21 cron firing will consume
most of what is left.

## Result delivered

`CURRENT_RESULTS.md` and `docs/evidence/current-cv-results.html` were regenerated by
`scripts/rescore-snapshot.mjs` from the stored 08:14Z acquisition — zero search
quota, zero fetches, and explicitly labelled in the header as a re-score rather than
a new search, keeping the original acquisition timestamp.

    candidates 15 -> 11
      -2  duplicate pairs collapsed
      -1  junior-labelled role dropped below threshold
      -1  previously rejected advert removed

Top of the corrected list: MVM 92%, BECK AND PARTNERS 89%, 2Connect 81%,
SWISS MEDICAL 79%, MVM Senior IT PM 78%, Pillér Nonprofit 77%.

Full suite: **133 pass / 0 fail / 1 skip** (was 108 before this session).

## Blocked, not done

**profession.hu answers HTTP 503 to every non-browser client** — `robots.txt`
included, `Server` header masked, 16KB interstitial body — from this host *and* from
GitHub-hosted runners. It worked at 08:14Z the same morning, so this began during the
day. 103 of the 184 English exclusions are profession.hu adverts, and it is the main
Hungarian portal, so no fresh acquisition was started: it would have spent the last
~17 searches on a list missing most of the market. A watcher polls every 10 minutes
and dispatches one live run if it recovers.

## Open for the Product Owner

1. **Sprint 1 acceptance.** `Pillér Nonprofit Kft — Projektmenedzser` (77%) is already
   recorded in `learned_preferences.md` as "kifejezetten jó minta". If that advert is
   still live, one APPLY decision closes DoD §6.7. Nobody has checked whether it is
   still open.
2. **Which constraint to relax.** Four of the six recorded rejections are language.
   The intersection of (IT leadership) x (no mandatory strong English) x (reachable
   from Fehérvárcsurgó) x (700k+ gross) is close to empty, and the one advert the PO
   liked was in the public/non-profit segment. Targeting that segment directly
   (kozigallas.gov.hu and similar, likely free of SerpApi entirely) is both simpler
   and higher-yield than filtering the whole market and rejecting 90% on English.
   Whether English, salary, role type or commute gives way is a PO decision.
3. **SerpApi plan.** At 250/month shared with IT-Lens, two runs per week does not fit
   from October either (≈148/month for Job Hunter alone leaves ~100 for IT-Lens).

## Commits

    10fb718  English conflation fix + landed the uncommitted CV-aware pipeline
    77811b5  semantic dedup + import guard + quota pre-flight
    4342152  seniority scoring
    5b81354  prior-feedback matching + rescore script + report honesty
