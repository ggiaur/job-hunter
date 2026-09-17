import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { renderHtmlReport } from './render.mjs';
import { loadDecisions, mergeDecisions } from './decisions.mjs';

const plain = value => String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/[\\`*_{}\[\]<>]/g, '\\$&');
const link = value => {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href.replace(/[()]/g, c => c === '(' ? '%28' : '%29') : null;
  } catch { return null; }
};

export function currentResultsMarkdown(run, { snapshotRelative, htmlRelative, decisionsDict = {} }) {
  const merged = mergeDecisions(run, decisionsDict);
  const rows = merged.results || [];
  const threshold = merged.visibleThreshold ?? 60;
  const candidates = rows.filter(r => (r.visible || r.relevancePercent >= threshold) && r.poDecision !== 'DO_NOT_APPLY');
  const previousRejections = rows.filter(r => r.poDecision === 'DO_NOT_APPLY');
  const githubRunUrl = link(run.githubRunUrl);
  const reportLinks = githubRunUrl
    ? `[A futás és a letölthető HTML/JSON bizonyítékcsomag](${githubRunUrl}) — az Artifacts résznél: job-hunter-live-evidence.`
    : `[Böngészhető eredmények és CV-bizonyítékok](${htmlRelative}) · [E futás változatlan forrása](${snapshotRelative})`;
  const lines = [
    '# Job Hunter – aktuális, CV-alapú keresés', '',
    `**Frissítve (UTC):** ${plain(run.generatedAt)}`,
    `**Ellenőrzött hirdetésoldalak:** ${run.confirmedJobAdPages ?? rows.length + (run.excluded || []).length}`,
    `**Pontozott bejegyzések:** ${rows.length}; **ellenőrizendő jelöltek:** ${candidates.length}; **korábbi elutasítások:** ${previousRejections.length}.`,
    '', reportLinks, '',
    // The old sentence ended with "Munkáltatói névváltozatok miatt duplikáció
    // maradhat." -- it disclosed a defect instead of fixing it, and it is now
    // false: lib/vacancy-dedup.mjs collapses employer-name and title-code
    // variants. A caveat that no longer holds teaches the reader to skip the
    // caveats that still do.
    'A jelöltek nem automatikusan jóváhagyott jelentkezések. A pontszám szabályalapú támpont, nem az alkalmasság vagy a felvétel valószínűsége.', '',
    // A re-scored snapshot must never read as a fresh search. "Frissítve" above
    // is the ACQUISITION time in both cases, so without this line a re-score is
    // indistinguishable from a live run.
    ...(run.rescoredAt
      ? [`⚠ Ez a lista **újrapontozás, nem új keresés**: a fenti időpontban beszerzett hirdetések értékelése futott le újra (${plain(run.rescoredAt)}) javított pontozási szabályokkal. Új hirdetés nem került be, keresési kvóta nem fogyott.`, '']
      : []),
    `Önéletrajzi profil: ${plain(run.candidateProfileVersion || 'nincs rögzítve')}. Forrás SHA-256: ${plain(run.candidateSourceSha256 || 'nincs rögzítve')}.`,
    'A diploma nem automatikus kizáró ok. A CV és a tanúsítványok szöveges bizonyítékai a részletes riportban láthatók; az ismeretlen készség nem bizonyított hiány.', '',
    '## Ellenőrizendő lehetőségek', '',
  ];
  if (!candidates.length) lines.push('E futásban nincs küszöb feletti, korábban el nem utasított jelölt. Ez nem bizonyítja, hogy nincs megfelelő állás a piacon.', '');
  for (const row of candidates) {
    const url = link(row.url);
    lines.push(`### ${plain(row.company)} — ${plain(row.title)} (${row.relevancePercent} pont)`, '');
    if (url) lines.push(`[Hirdetés](${url})`, '');
    lines.push(`- Helyszín a forrásban: ${plain(row.locationText || 'nincs megadva')}; munkarend-jelzés: ${plain(row.workArrangement || 'nincs igazolt hibrid/távmunka')}. A részletes bejárási feltételek külön ellenőrizendők.`);
    lines.push(`- Angol: ${plain(row.englishRequirement || 'nincs megállapítva')}.`);
    const matches = row.candidateReview?.matches || [];
    if (matches.length) lines.push(`- CV-kapcsolódás: ${matches.map(m => plain(m.label)).join('; ')}.`);
    for (const risk of row.mismatchReasons || []) lines.push(`- Ellenőrizendő: ${plain(risk)}`);
    if (row.educationNote) lines.push(`- Végzettség: ${plain(row.educationNote)}`);
    lines.push('');
  }
  lines.push('## Keresési lefedettség és működés', '');
  const searchLog = run.searchAcquisitionLog || [];
  lines.push(`- SerpApi: ${run.searchCredentialAvailable === false ? 'kulcs hiányában kihagyva; csökkent lefedettség' : `${searchLog.filter(r => r.ok).length} sikeres, ${searchLog.filter(r => !r.ok).length} hibás lekérdezés`}.`);
  lines.push(`- Nem elérhető oldalak: ${(run.unreachable || []).length}.`);
  for (const c of run.canaries || []) lines.push(`- Lefedettségi kontroll: ${plain(c.label || c.id)} — ${plain(c.status)}.`);
  lines.push('', 'A forrás → hirdetésellenőrzés → CV-összevetés → pontozás → HTML/Markdown frissítés ugyanannak a futásnak a része. Nem küld automatikus jelentkezést vagy e-mailt.');
  return lines.join('\n') + '\n';
}

export async function publishCurrentReports(repoRoot, snapshotPath) {
  const run = JSON.parse(await readFile(snapshotPath, 'utf8'));
  const decisionsDict = loadDecisions(path.join(repoRoot, 'docs/evidence/po-decisions.json'));
  const htmlPath = path.join(repoRoot, 'docs/evidence/current-cv-results.html');
  const markdownPath = path.join(repoRoot, 'CURRENT_RESULTS.md');
  const html = renderHtmlReport(run, { decisionsDict, sourceFilePath: path.relative(path.dirname(htmlPath), snapshotPath) });
  const markdown = currentResultsMarkdown(run, { decisionsDict, snapshotRelative: path.relative(repoRoot, snapshotPath), htmlRelative: path.relative(repoRoot, htmlPath) });
  await mkdir(path.dirname(htmlPath), { recursive: true });
  for (const [target, contents] of [[htmlPath, html], [markdownPath, markdown]]) {
    const temporary = `${target}.${process.pid}.tmp`;
    await writeFile(temporary, contents, 'utf8');
    await rename(temporary, target);
  }
  return { htmlPath, markdownPath };
}
