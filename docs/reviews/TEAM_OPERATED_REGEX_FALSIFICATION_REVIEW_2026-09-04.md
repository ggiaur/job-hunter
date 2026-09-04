# Independent falsification review: `TEAM_OPERATED_REGEX`

Date: 2026-09-04  
Reviewer: Codex (independent code-and-test review)  
Scope: `f4e6341` and its immediate predecessor for `lib/extract.mjs` and
`lib/scoring.mjs`, plus the three new `Supervisor #1` / `Supervisor #1 guard`
/ `Supervisor #2` tests in `apps/job-hunter-mvp/lib/scoring.test.mjs`.

## Verdict

The WHC false negative is fixed, and the location-points invariant holds for
valid string inputs. However, `TEAM_OPERATED_REGEX` introduces a material
management-scope false positive. It does not establish that the operating noun
has the team as its grammatical object, and its four-token window crosses
sentence punctuation. This can turn a routine individual-contributor ad into
one with asserted people-management evidence.

## Finding 1 — confirmed false-positive collision (material)

Current expression:

```js
/csapat\S*(?:\s+\S+){0,4}?\s+(irányítása|vezetése|működtetése|menedzselése|felügyelete)/i
```

The following ordinary IC duty text returns `true` from
`hasManagementScope()`:

> Csapatban dolgozunk. A platform működtetése a feladatod.

Meaning: “We work in a team. Operating the platform is your duty.” It says
that the candidate belongs to a team and operates a platform; it does not say
that the candidate manages a team or people. The expression consumes
`csapatban`, then the four intervening tokens `dolgozunk.`, `A`, `platform`,
and finally matches `működtetése`. In particular, `\S+` permits the full-stop,
so a sentence boundary is not a boundary for this matcher.

Another plausible routine support/operations example is:

> Fejlesztőként csapatban dolgozol. Az ügyfél rendszereinek felügyelete a feladatod.

Here `felügyelete` describes supervision of customer systems, not leadership
of the team. The same proximity condition is satisfied.

This is more than an explanatory-label issue. The false match has both of
these effects in `scoring.mjs`:

- `isHardExcludedICRole()` no longer hard-excludes a title such as `Senior
  Fejlesztő`, because it treats `hasManagementScope()` as corroboration.
- A matched leadership/manager title no longer receives the general
  zero-scope penalty and instead receives the +15 management bonus. With
  `IT szolgáltatásmenedzser`, the first example above, Budapest, and the
  normal targeted-title input, `computeRelevanceAssessment()` produced score
  **76** and `visible: true`, while claiming concrete people-management
  responsibility.

Thus this reopens the prior bare-title/zero-evidence safeguard through a
false positive rather than through a new control-flow branch.

Suggested regression cases for a subsequent fix (not implemented in this
review): assert that both examples return no management scope and that the
IC hard exclusion / manager no-scope penalty remain in force. A safe matcher
needs a grammatical link from the team phrase to the operating noun and must
not cross clause or sentence punctuation; merely requiring the two words in a
short token window is insufficient.

## Finding 2 — imperative/infinitive check

The expression does **not** match bare imperatives or infinitives. The
following were exercised directly and returned `false`:

```text
Csapatot vezess és működtess!
A csapat irányítani fogja a munkát.
```

After its required whitespace, the regex starts the alternative at the first
character of a token, so it requires one of the listed noun/possessive forms
(`irányítása`, `vezetése`, `működtetése`, `menedzselése`, `felügyelete`), not
`vezess`, `működtess`, or `irányítani`.

It intentionally also accepts legitimate case-suffixed continuations such as
`működtetésének`, because the listed form is a prefix. That is not an
imperative/infinitive bypass. The actual grammatical weakness is different:
the regex verifies the morphology of the operating noun but never verifies
that it refers back to `csapat`.

## Finding 3 — `scoreLocation()` points

For valid string-or-empty `locationText` values, the new branch is placed
after all previous positive-score branches and returns the same `0` as the old
fallback. Therefore it cannot change points for any previously-tested normal
case; it only replaces the note for a populated, unrecognised location.

Direct checks in the current tree returned:

| Input | Points |
| --- | ---: |
| empty location / no location text | 0 |
| `Nyíregyháza, HU` | 0 |
| `Budapest` | 6 |
| `Pécs` | 4 |
| `Pécs` with `hibrid` | 10 |

One narrow API-contract caveat: a truthy non-string `locationText` now throws
at `locationText.trim()` whereas the old fallback returned zero. The current
call sites and tests use strings/null, so this does not contradict the stated
invariant for job-ad data, but it means “message-only” is not literally true
for malformed inputs.

## Test evidence and repository limitation

`node --test apps/job-hunter-mvp/lib/scoring.test.mjs` passed in the current
checkout. The new three supervisor tests cover the real positive, the
`fejlesztés` collision guard, and the unrecognised-city note. They do not
cover the distinct operating/monitoring collisions above or their bypass of
the no-scope safeguards.

I attempted the requested `git pull --ff-only` before review. It could not
fetch because this sandbox mounts `.git` read-only:

```text
error: cannot open '.git/FETCH_HEAD': Read-only file system
```

The same restriction prevents staging, committing, or pushing this artifact.
