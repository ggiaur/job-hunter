import { chromium } from 'playwright';
import os from 'node:os';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

const query = (process.env.GATE0_QUERY || 'IT vezető').trim();
const terms = query.split(/\s+/).filter(Boolean);
if (terms.length !== 2) {
  console.error(`GATE0_FAIL: query must contain exactly two whitespace-separated terms; got ${terms.length}: ${query}`);
  process.exit(64);
}

const evidenceDir = process.env.GATE0_EVIDENCE_DIR || '/evidence';
await mkdir(evidenceDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const base = `gate0-${stamp}`;
const jsonPath = path.join(evidenceDir, `${base}.json`);
const screenshotPath = path.join(evidenceDir, `${base}.png`);
const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=hu&gl=hu`;

const challengeMarkers = [
  'unusual traffic',
  'recaptcha',
  'captcha',
  'verify you are human',
  'szokatlan forgalm',
  'nem vagyok robot',
  "i'm not a robot",
];

function containsChallenge(text) {
  const lower = (text || '').toLowerCase();
  return challengeMarkers.some((marker) => lower.includes(marker));
}

async function acceptConsentIfPresent(page) {
  const labels = ['Elfogadom mind', 'Összes elfogadása', 'Accept all', 'I agree', 'Elfogadom'];
  for (const label of labels) {
    const button = page.getByRole('button', { name: label, exact: false }).first();
    try {
      if (await button.isVisible({ timeout: 750 })) {
        await Promise.all([
          page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {}),
          button.click({ timeout: 3000 }),
        ]);
        return true;
      }
    } catch {
      // Consent UI is absent or changed; continue without retrying the query.
    }
  }
  return false;
}

function normalizeGoogleHref(rawHref) {
  try {
    const url = new URL(rawHref);
    if (url.hostname.endsWith('google.com') && url.pathname === '/url') {
      const redirected = url.searchParams.get('q') || url.searchParams.get('url');
      return redirected || null;
    }
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch {
    return null;
  }
  return null;
}

let browser;
let context;
let page;
let exitCode = 1;
const evidence = {
  gate: 'SPRINT1_EXACT_FINAL_ENVIRONMENT_GATE0',
  query,
  startedAt: new Date().toISOString(),
  host: os.hostname(),
  finalEnvironmentClaim: 'on-prem Docker worker',
  googleUrl,
  browser: null,
  consentHandled: false,
  challenge: false,
  organicResults: [],
  status: 'FAIL',
  reason: null,
};

try {
  browser = await chromium.launch({ headless: false });
  evidence.browser = browser.version();

  context = await browser.newContext({
    locale: 'hu-HU',
    timezoneId: 'Europe/Budapest',
    viewport: { width: 1365, height: 900 },
  });
  page = await context.newPage();

  // Exactly one Google search navigation. No fallback query, retry, proxy, stealth or CAPTCHA bypass.
  await page.goto(googleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  evidence.consentHandled = await acceptConsentIfPresent(page);

  const bodyText = await page.textContent('body').catch(() => '');
  evidence.challenge = containsChallenge(bodyText);

  if (evidence.challenge) {
    evidence.reason = 'GOOGLE_CHALLENGE';
    exitCode = 2;
  } else {
    const rawResults = await page.evaluate(() => {
      const root = document.querySelector('#search') || document.body;
      const anchors = Array.from(root.querySelectorAll('a'));
      const out = [];
      for (const anchor of anchors) {
        const h3 = anchor.querySelector('h3');
        if (!h3) continue;
        const title = (h3.textContent || '').trim();
        if (!title || !anchor.href) continue;
        out.push({ title, href: anchor.href });
        if (out.length >= 10) break;
      }
      return out;
    });

    const seen = new Set();
    for (const item of rawResults) {
      const url = normalizeGoogleHref(item.href);
      if (!url) continue;
      try {
        const parsed = new URL(url);
        if (parsed.hostname.endsWith('google.com')) continue;
      } catch {
        continue;
      }
      if (seen.has(url)) continue;
      seen.add(url);
      evidence.organicResults.push({
        rank: evidence.organicResults.length + 1,
        title: item.title,
        url,
      });
    }

    if (evidence.organicResults.length > 0) {
      evidence.status = 'PASS';
      evidence.reason = 'LIVE_GOOGLE_SERP_WITH_ORGANIC_RESULTS';
      exitCode = 0;
    } else {
      evidence.reason = 'NO_ORGANIC_RESULTS_EXTRACTED';
      exitCode = 3;
    }
  }

  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
} catch (error) {
  evidence.reason = `RUNTIME_ERROR: ${error?.message || String(error)}`;
  exitCode = 1;
} finally {
  evidence.finishedAt = new Date().toISOString();
  evidence.screenshot = screenshotPath;
  await writeFile(jsonPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  await context?.close().catch(() => {});
  await browser?.close().catch(() => {});
}

console.log(JSON.stringify(evidence, null, 2));
console.log(`GATE0_EVIDENCE_JSON=${jsonPath}`);
console.log(`GATE0_EVIDENCE_SCREENSHOT=${screenshotPath}`);
process.exit(exitCode);
