# Sprint 1 — On-prem Docker Gate 0

This is the smallest possible falsification test for the proposed final Sprint 1 environment.

## Scope

- Run on the actual on-prem Ubuntu server intended to host the final worker.
- Docker only; no Ubuntu desktop environment is required on the host.
- Chromium runs in headed mode under Xvfb inside the container.
- Exactly one two-term Google Search query.
- No retry, fallback query, proxy, stealth, CAPTCHA bypass, Firecrawl, portal/API substitution, scheduler, or Job Hunter workflow.
- PASS requires at least one live organic Google result with title + destination URL.

## Run

From the repository root on the on-prem Ubuntu server:

```bash
cd apps/google-browser-search
mkdir -p evidence

docker build \
  -f Dockerfile.gate0 \
  -t job-hunter-sprint1-gate0 .

docker run --rm --init --ipc=host \
  -e GATE0_QUERY='IT vezető' \
  -v "$PWD/evidence:/evidence" \
  job-hunter-sprint1-gate0
```

## Evidence

The container writes two files into `apps/google-browser-search/evidence/`:

- `gate0-<timestamp>.json`
- `gate0-<timestamp>.png`

The JSON contains the host name, Chromium version, query, challenge status, PASS/FAIL reason, and extracted organic title + URL pairs.

## Exit codes

- `0` — PASS: live Google SERP with one or more organic title + URL pairs.
- `1` — runtime/container/browser failure.
- `2` — Google challenge / CAPTCHA / unusual-traffic blocker.
- `3` — Google page loaded but no organic results were extracted.
- `64` — query was not exactly two whitespace-separated terms.

## Acceptance

A PASS from another cloud/VPS environment does not count. The authoritative Gate 0 result is the result produced on the exact on-prem Ubuntu host proposed as the final worker environment.
