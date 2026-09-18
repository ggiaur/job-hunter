#!/usr/bin/env node
// Pre-flight: refuse to start a live run that cannot finish within the
// remaining SerpApi allowance.
//
// Why: the key is a 250/month FREE allowance SHARED with the IT-Lens project.
// On 2026-09-17, 224 of 250 were already spent and a run that starts with too
// little headroom does the worst possible thing -- it burns what is left and
// still produces a partial, misleading result set (some role families searched,
// others silently missing, which reads as "no such jobs exist").
//
// Exit codes: 0 = enough headroom (or no key configured, which the pipeline
// already handles by falling back to public acquisition); 1 = refuse.
//
// Usage: node scripts/check-search-quota.mjs [--need N] [--json]

import { readFile } from 'node:fs/promises';

const DEFAULT_NEED = 17; // one full live run's query budget
// Overridable so the refusal path can actually be exercised on a machine that
// does have the local secret file -- otherwise the guard is untestable here and
// would only ever be proven in CI, after it mattered.
const SECRET_PATH =
  process.env.JOB_HUNTER_SERPAPI_SECRET_PATH || '/home/dockeruser/.job-hunter-secrets/serpapi.env';

function parseArgs(argv) {
  let need = DEFAULT_NEED;
  let json = false;
  let requireKey = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--need') {
      need = Number(argv[i + 1]);
      i += 1;
    } else if (argv[i].startsWith('--need=')) {
      need = Number(argv[i].slice('--need='.length));
    } else if (argv[i] === '--json') {
      json = true;
    } else if (argv[i] === '--require-key') {
      requireKey = true;
    }
  }
  return { need: Number.isFinite(need) && need > 0 ? need : DEFAULT_NEED, json, requireKey };
}

async function resolveKey() {
  if (process.env.SERPAPI_API_KEY && process.env.SERPAPI_API_KEY.trim()
      && process.env.SERPAPI_API_KEY.trim() !== 'GITHUB_DIRECT_PROFESSION_FALLBACK') {
    return process.env.SERPAPI_API_KEY.trim();
  }
  try {
    const contents = await readFile(SECRET_PATH, 'utf8');
    return contents.match(/^SERPAPI_API_KEY=(\S+)\s*$/m)?.[1] ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const { need, json, requireKey } = parseArgs(process.argv.slice(2));
  const key = await resolveKey();

  if (!key) {
    if (requireKey) {
      // Measured failure this prevents (run 35289908379, 2026-09-18):
      // the GitHub repository secret SERPAPI_API_KEY is empty, so every CI live
      // run silently degraded to direct-Profession-only acquisition -- 137 advert
      // pages instead of 682, 4 visible candidates instead of 16 -- and then
      // failed the acceptance gate for "only 4 visible results", blaming the
      // market instead of the missing secret. Worse, the degraded run published
      // itself over a better-covered list, deleting 7 real opportunities from
      // CURRENT_RESULTS.md. Every live run since 2026-09-08 failed this way.
      console.error(
        'REFUSING to start a live run: no SerpApi key is configured.\n' +
        'Without it the pipeline silently drops to direct-Profession-only\n' +
        'acquisition (~137 advert pages instead of ~682) and publishes that\n' +
        'narrower list as if it were the full picture.\n' +
        'Fix: set the SERPAPI_API_KEY repository secret\n' +
        '(Settings -> Secrets and variables -> Actions), or run with\n' +
        '--need 0 deliberately if a reduced-coverage run is genuinely wanted.'
      );
      process.exit(1);
    }
    console.log('No SerpApi key configured — nothing to check; the pipeline falls back to public acquisition.');
    return;
  }

  const res = await fetch(`https://serpapi.com/account?api_key=${encodeURIComponent(key)}`);
  if (!res.ok) {
    // Never assume headroom we could not verify.
    console.error(`REFUSING: could not read the SerpApi account (HTTP ${res.status}). Quota is unverified.`);
    process.exit(1);
  }
  const account = await res.json();
  const left = Number(account.total_searches_left ?? account.plan_searches_left ?? NaN);
  const used = account.this_month_usage;
  const limit = account.searches_per_month;

  if (json) {
    console.log(JSON.stringify({ left, used, limit, need, sufficient: left >= need }, null, 2));
  } else {
    console.log(`SerpApi: ${used}/${limit} used this month, ${left} left. This run needs ~${need}.`);
  }

  if (!Number.isFinite(left)) {
    console.error('REFUSING: the account response did not contain a remaining-searches figure.');
    process.exit(1);
  }
  if (left < need) {
    console.error(
      `REFUSING to start a live run: ${left} searches left but ~${need} needed.\n` +
      'A partial run would spend the remainder AND return an incomplete result set, ' +
      'where missing role families look like "no such jobs exist".\n' +
      'Wait for the monthly reset, raise the plan, or lower the query budget deliberately.'
    );
    process.exit(1);
  }
  console.log('Quota headroom OK.');
}

main().catch((err) => {
  console.error('REFUSING:', err.message);
  process.exit(1);
});
