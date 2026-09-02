// JH-SUP-0007 bounded PoC. Not production code. No Firecrawl/search-API calls.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = path.join(__dirname, '../../.runtime/google-browser-profile');
mkdirSync(PROFILE_DIR, { recursive: true });

const QUERIES = [
  'IT vezető Budapest állás',
  'IT manager Budapest állás',
  'IT projektmenedzser Budapest hibrid állás',
];

const MAX_ORGANIC_PER_QUERY = 10;
const MAX_DESTINATIONS_PER_QUERY = 5;
const MAX_DESTINATIONS_TOTAL = 15;

const POSITIVE_TERMS = ['it vezető', 'informatikai vezető', 'it manager', 'it osztályvezető',
  'infrastruktúra vezető', 'it operations manager', 'team lead', 'it projektmenedzser',
  'it project manager', 'cio', 'digitalizációs vezető', 'ai lead', 'head of ai', 'ai transformation'];
const NEGATIVE_TERMS = ['helpdesk', '1st line', 'first line', 'software developer', 'fejlesztő',
  'takarító', 'pultos', 'sofőr', 'eladó'];

const CHALLENGE_MARKERS = ['unusual traffic', 'recaptcha', 'captcha', 'verify you are human',
  'szokatlan forgalom', 'nem vagyok robot', "i'm not a robot"];

function log(...args) { console.error(new Date().toISOString(), ...args); }

function cheapScore(title, snippet) {
  const text = `${title} ${snippet}`.toLowerCase();
  if (NEGATIVE_TERMS.some((t) => text.includes(t))) return -1;
  const hit = POSITIVE_TERMS.find((t) => text.includes(t));
  return hit ? 1 : 0;
}

async function detectChallenge(page) {
  const text = (await page.textContent('body').catch(() => '') || '').toLowerCase();
  const title = (await page.title().catch(() => '')).toLowerCase();
  return CHALLENGE_MARKERS.some((m) => text.includes(m) || title.includes(m));
}

async function acceptConsentIfPresent(page) {
  const candidates = ['Elfogadom mind', 'Összes elfogadása', 'I agree', 'Accept all', 'Elfogadom'];
  for (const name of candidates) {
    const btn = page.getByRole('button', { name, exact: false }).first();
    try {
      if (await btn.isVisible({ timeout: 1500 })) {
        await btn.click({ timeout: 3000 });
        log('consent accepted via button:', name);
        return true;
      }
    } catch { /* not present, try next */ }
  }
  return false;
}

async function extractOrganicResults(page) {
  // Primary: role-based. Google wraps each organic result's title in an h3 inside
  // an outbound <a>. Scope to #search to exclude top/side ad blocks and nav chrome.
  const results = await page.evaluate((maxN) => {
    const container = document.querySelector('#search') || document.body;
    const anchors = Array.from(container.querySelectorAll('a'));
    const seen = new Set();
    const out = [];
    for (const a of anchors) {
      const h3 = a.querySelector('h3');
      if (!h3) continue;
      const href = a.href;
      if (!href || href.startsWith('https://www.google.com') || href.startsWith('https://support.google.com')) continue;
      if (seen.has(href)) continue;
      seen.add(href);
      const title = h3.textContent.trim();
      if (!title) continue;
      // Nearest visible snippet: look for a sibling/ancestor block with a longer text node.
      let snippet = '';
      const block = a.closest('div');
      if (block) {
        const spans = Array.from(block.parentElement?.querySelectorAll('div, span') || []);
        const cand = spans.find((el) => el.textContent && el.textContent.length > 40 && !el.querySelector('h3'));
        if (cand) snippet = cand.textContent.trim().slice(0, 300);
      }
      out.push({ title, href, snippet });
      if (out.length >= maxN) break;
    }
    return out;
  }, MAX_ORGANIC_PER_QUERY);
  return results.map((r, i) => ({
    rank: i + 1,
    title: r.title,
    url: r.href,
    snippet: r.snippet,
    domain: (() => { try { return new URL(r.href).hostname; } catch { return ''; } })(),
    extraction_method: 'role/structural: a>h3 within #search',
  }));
}

async function verifyJobPosting(page) {
  const jsonLd = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const graph = item['@graph'] || [item];
          for (const g of graph) {
            if (g && (g['@type'] === 'JobPosting' || (Array.isArray(g['@type']) && g['@type'].includes('JobPosting')))) {
              return {
                title: g.title || null,
                company: g.hiringOrganization?.name || null,
                location: g.jobLocation?.address?.addressLocality || g.jobLocation?.address?.addressRegion || null,
              };
            }
          }
        }
      } catch { /* not parseable JSON-LD, skip */ }
    }
    return null;
  });
  if (jsonLd) return { verified: true, reason: 'JOBPOSTING_SCHEMA', ...jsonLd };

  const visible = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const hasJobWord = /(állás|munkakör|pozíció|job|vacancy|responsibilities|feladatok)/i.test(text);
    const h1 = document.querySelector('h1')?.textContent?.trim() || null;
    return { hasJobWord, h1, textLength: text.length };
  });
  if (visible.hasJobWord && visible.h1 && visible.textLength > 400) {
    return { verified: true, reason: 'VISIBLE_JOB_DETAIL', title: visible.h1, company: null, location: null };
  }
  return { verified: false, reason: 'NO_JOB_EVIDENCE' };
}

async function main() {
  const startedAt = new Date().toISOString();
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    channel: undefined, // use Playwright's bundled Chromium (new headless), per spec section 4
    locale: 'hu-HU',
  });
  const page = await context.newPage();

  const report = {
    startedAt,
    node: process.version,
    playwrightPackageVersion: '1.62.1',
    profileDir: PROFILE_DIR,
    launchMode: 'headless (Playwright-managed Chromium, new headless mode)',
    firecrawlCalls: 0,
    searchApiCalls: 0,
    queries: [],
    blocked: null,
  };

  let totalDestinationsOpened = 0;

  for (const query of QUERIES) {
    const queryRecord = {
      query,
      method: 'direct_url',
      googleUrl: null,
      challenge: false,
      consentHandled: false,
      organicResults: [],
      destinationsOpened: [],
    };
    report.queries.push(queryRecord);

    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=hu&gl=hu`;
    queryRecord.googleUrl = url;
    log('navigating to', url);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch (e) {
      queryRecord.error = `navigation failed: ${e.message}`;
      continue;
    }

    queryRecord.consentHandled = await acceptConsentIfPresent(page);
    if (queryRecord.consentHandled) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    }

    if (await detectChallenge(page)) {
      queryRecord.challenge = true;
      report.blocked = { query, reason: 'CHALLENGE_DETECTED' };
      log('CHALLENGE DETECTED for query:', query, '-- stopping run per hard rule');
      break;
    }

    const organic = await extractOrganicResults(page);
    queryRecord.organicResults = organic;
    log(`query "${query}": ${organic.length} organic results extracted`);

    if (organic.length === 0) {
      // Fallback: UI-driven search box, per spec section 5.
      queryRecord.method = 'ui_fallback_attempted';
      try {
        await page.goto('https://www.google.com/?hl=hu&gl=hu', { waitUntil: 'domcontentloaded', timeout: 20000 });
        await acceptConsentIfPresent(page);
        const box = page.getByRole('combobox').first();
        await box.fill(query, { timeout: 5000 });
        await box.press('Enter');
        await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
        if (await detectChallenge(page)) {
          queryRecord.challenge = true;
          report.blocked = { query, reason: 'CHALLENGE_DETECTED_ON_FALLBACK' };
          break;
        }
        const organic2 = await extractOrganicResults(page);
        queryRecord.organicResults = organic2;
        queryRecord.method = organic2.length > 0 ? 'ui_fallback' : 'ui_fallback_also_empty';
        log(`fallback for "${query}": ${organic2.length} organic results`);
      } catch (e) {
        queryRecord.fallbackError = e.message;
      }
    }

    const scored = queryRecord.organicResults
      .map((r) => ({ ...r, score: cheapScore(r.title, r.snippet) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score);

    let openedForQuery = 0;
    for (const candidate of scored) {
      if (openedForQuery >= MAX_DESTINATIONS_PER_QUERY) break;
      if (totalDestinationsOpened >= MAX_DESTINATIONS_TOTAL) break;
      const destPage = await context.newPage();
      const destRecord = { url: candidate.url, title: candidate.title, rank: candidate.rank };
      try {
        await destPage.goto(candidate.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        const verification = await verifyJobPosting(destPage);
        Object.assign(destRecord, verification);
      } catch (e) {
        destRecord.verified = false;
        destRecord.reason = `open failed: ${e.message}`;
      }
      await destPage.close();
      queryRecord.destinationsOpened.push(destRecord);
      openedForQuery += 1;
      totalDestinationsOpened += 1;
    }
  }

  await context.close();
  report.finishedAt = new Date().toISOString();

  const outPath = path.join(__dirname, 'result.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  log('wrote', outPath);
}

main().catch((e) => {
  console.error('PoC run failed:', e);
  process.exit(1);
});
