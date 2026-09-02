import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchesChallenge, cheapScore, relevanceReason } from './extract.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = path.join(__dirname, '../../../.runtime/google-browser-app-profile');

const MAX_ORGANIC_PER_QUERY = 10;
const MAX_DESTINATIONS_PER_QUERY = 5;

let contextPromise = null;

async function getContext() {
  if (!contextPromise) {
    contextPromise = chromium.launchPersistentContext(PROFILE_DIR, {
      headless: true,
      locale: 'hu-HU',
    });
  }
  return contextPromise;
}

export async function isBrowserReady() {
  try {
    const ctx = await getContext();
    return ctx.pages().length >= 0; // context exists and is usable
  } catch {
    return false;
  }
}

async function acceptConsentIfPresent(page) {
  const candidates = ['Elfogadom mind', 'Összes elfogadása', 'I agree', 'Accept all', 'Elfogadom'];
  for (const name of candidates) {
    const btn = page.getByRole('button', { name, exact: false }).first();
    try {
      if (await btn.isVisible({ timeout: 1500 })) {
        await btn.click({ timeout: 3000 });
        return true;
      }
    } catch { /* not present */ }
  }
  return false;
}

async function extractOrganicResults(page) {
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
      } catch { /* not JSON-LD */ }
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

export async function performSearch(query) {
  const context = await getContext();
  const page = await context.newPage();
  const record = {
    query,
    method: 'direct_url',
    googleUrl: null,
    challenge: false,
    consentHandled: false,
    organicResults: [],
    destinationsOpened: [],
    firecrawlCalls: 0,
    searchApiCalls: 0,
  };
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=hu&gl=hu`;
    record.googleUrl = url;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    record.consentHandled = await acceptConsentIfPresent(page);
    if (record.consentHandled) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    }

    const bodyText = await page.textContent('body').catch(() => '');
    if (matchesChallenge(bodyText)) {
      record.challenge = true;
      return record;
    }

    record.organicResults = await extractOrganicResults(page);

    if (record.organicResults.length === 0) {
      record.method = 'ui_fallback_attempted';
      await page.goto('https://www.google.com/?hl=hu&gl=hu', { waitUntil: 'domcontentloaded', timeout: 20000 });
      await acceptConsentIfPresent(page);
      const box = page.getByRole('combobox').first();
      await box.fill(query, { timeout: 5000 });
      await box.press('Enter');
      await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
      const bodyText2 = await page.textContent('body').catch(() => '');
      if (matchesChallenge(bodyText2)) {
        record.challenge = true;
        return record;
      }
      record.organicResults = await extractOrganicResults(page);
      record.method = record.organicResults.length > 0 ? 'ui_fallback' : 'ui_fallback_also_empty';
    }

    const scored = record.organicResults
      .map((r) => ({ ...r, score: cheapScore(r.title, r.snippet) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score);

    let opened = 0;
    for (const candidate of scored) {
      if (opened >= MAX_DESTINATIONS_PER_QUERY) break;
      const destPage = await context.newPage();
      const dest = { url: candidate.url, title: candidate.title, rank: candidate.rank };
      try {
        await destPage.goto(candidate.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        const verification = await verifyJobPosting(destPage);
        Object.assign(dest, verification);
        if (verification.verified) {
          const rel = relevanceReason(candidate.title, candidate.snippet);
          dest.relevant = rel.relevant;
          dest.relevanceReason = rel.reason;
        }
      } catch (e) {
        dest.verified = false;
        dest.reason = `open failed: ${e.message}`;
      }
      await destPage.close();
      record.destinationsOpened.push(dest);
      opened += 1;
    }
  } finally {
    await page.close();
  }
  return record;
}
