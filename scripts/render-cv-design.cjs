const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/bj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const preview = path.join(root, '.runtime', 'cv-preview');
fs.mkdirSync(preview, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CV_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1120, height: 1500 }, deviceScaleFactor: 1 });
  if (process.argv.includes('--original')) {
    await page.goto(pathToFileURL(path.join(root, 'profile/sources/originals/CV_Belinszki_Janos_OBH_v18.html')).href);
    await page.screenshot({ path: path.join(preview, 'original-v18.png'), fullPage: true });
  } else {
    for (const slug of ['Belinszki_Janos_CV_Nova_IT_igazgato_v20', 'Belinszki_Janos_CV_MAK_Osztalyvezeto_413_2026_v20']) {
      await page.goto(pathToFileURL(path.join(root, 'applications/2026-10-01', slug + '.html')).href);
      await page.emulateMedia({ media: 'print' });
      await page.pdf({ path: path.join(root, 'output/pdf', slug + '.pdf'), printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
      const issues = await page.locator('.sheet').evaluateAll(sheets => sheets.map((s, i) => ({ page: i + 1, height: s.clientHeight, contentHeight: s.scrollHeight })));
      console.log(JSON.stringify({ slug, issues }));
      if (issues.some(x => x.contentHeight > x.height + 1)) throw new Error('CV content exceeds page height');
    }
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
