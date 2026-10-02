const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/bj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CV_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1120, height: 1400 } });
    for (const slug of ['Belinszki_Janos_CV_Nova_IT_igazgato_v21', 'Belinszki_Janos_CV_MAK_Osztalyvezeto_413_2026_v21']) {
      await page.goto(pathToFileURL(path.join(root, 'applications/2026-10-01', slug + '.html')).href);
      await page.emulateMedia({ media: 'print' });
      await page.pdf({ path: path.join(root, 'output/pdf', slug + '.pdf'), printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
      const layout = await page.locator('.sheet').evaluateAll(sheets => sheets.map((s, i) => {
        const content = s.querySelector('.content');
        const last = content.lastElementChild.getBoundingClientRect();
        return { page: i + 1, contentBottom: Math.round(last.bottom), footerTop: Math.round(s.querySelector('.footer').getBoundingClientRect().top), height: s.clientHeight, fullHeight: s.scrollHeight };
      }));
      console.log(JSON.stringify({ slug, layout }));
      if (layout.some(x => x.fullHeight > x.height + 1 || x.contentBottom > x.footerTop - 5)) throw new Error('CV text exceeds the available page area');
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
