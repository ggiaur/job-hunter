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
const SECRET_PATH = '/home/dockeruser/.job-hunter-secrets/serpapi.env';

function parseArgs(argv) {
  let need = DEFAULT_NEED;
  let json = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--need') {
      need = Number(argv[i + 1]);
      i += 1;
    } else if (argv[i].startsWith('--need=')) {
      need = Number(argv[i].slice('--need='.length));
    } else if (argv[i] === '--json') {
      json = true;
    }
  }
  return { need: Number.isFinite(need) && need > 0 ? need : DEFAULT_NEED, json };
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
  const { need, json } = parseArgs(process.argv.slice(2));
  const key = await resolveKey();

  if (!key) {
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
