import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = path.join(__dirname, '../../.runtime/google-browser-profile');

const context = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, locale: 'hu-HU' });
const page = await context.newPage();
await page.goto('https://www.google.com/search?q=IT%20vezet%C5%91%20Budapest%20%C3%A1ll%C3%A1s&hl=hu&gl=hu', { waitUntil: 'domcontentloaded', timeout: 20000 });
console.log('TITLE:', await page.title());
const body = await page.textContent('body').catch(() => '');
console.log('BODY LENGTH:', body.length);
console.log('BODY SNIPPET:', body.slice(0, 800));
await page.screenshot({ path: path.join(__dirname, 'debug.png'), fullPage: false }).catch((e) => console.log('screenshot failed', e.message));
await context.close();
