import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { loadDecisions, mergeDecisions } from './decisions.mjs';

/**
 * Escapes HTML characters for safe rendering.
 * @param {string|null|undefined} str 
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renders a full, self-contained HTML presentation page from run snapshot data.
 * @param {object} runData - Parsed run JSON matching RESULT_CONTRACT.md
 * @param {object} options - Options (sourceFilePath, decisionsFilePath, title)
 * @returns {string} Rendered HTML string
 */
export function renderHtmlReport(runData, options = {}) {
  const decisionsDict = options.decisionsDict || loadDecisions(options.decisionsFilePath);
  const mergedData = mergeDecisions(runData, decisionsDict);

  const generatedAt = mergedData.generatedAt || new Date().toISOString();
  const sourcePath = options.sourceFilePath || 'docs/evidence/job-hunter-runs/latest.json';
  const visibleThreshold = mergedData.visibleThreshold ?? 60;
  const results = mergedData.results || [];
  const visibleResults = results.filter(r => (r.relevancePercent ?? 0) >= visibleThreshold || r.visible);
  const excluded = mergedData.excluded || [];

  const html = `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title || 'Job Hunter — Executive Vacancy Review')}</title>
  <style>
    :root {
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #475569;
      --border-color: #e2e8f0;
      --primary-color: #2563eb;
      --primary-hover: #1d4ed8;
      --success-bg: #dcfce7;
      --success-text: #166534;
      --success-border: #86efac;
      --warning-bg: #fef9c3;
      --warning-text: #854d0e;
      --danger-bg: #fee2e2;
      --danger-text: #991b1b;
      --danger-border: #fca5a5;
      --badge-bg: #e0f2fe;
      --badge-text: #0369a1;
      --radius: 12px;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-main);
      line-height: 1.5;
      padding: 24px 16px;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
    }

    header {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: var(--shadow);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .audit-link {
      font-size: 0.85rem;
      color: var(--text-muted);
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 6px;
      word-break: break-all;
    }

    .stats-bar {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .stat-pill {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .stat-pill strong {
      color: var(--primary-color);
    }

    .controls {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .tab-btn {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.2s;
    }

    .tab-btn:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    .tab-btn.active {
      background: var(--primary-color);
      color: #ffffff;
      border-color: var(--primary-color);
    }

    .job-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .job-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      position: relative;
      transition: border-color 0.2s;
    }

    .job-card:hover {
      border-color: #cbd5e1;
    }

    .job-card.visible-card {
      border-left: 6px solid var(--primary-color);
    }

    .job-card.high-fit {
      border-left: 6px solid #16a34a;
    }

    .job-card.excluded-card {
      border-left: 6px solid #dc2626;
      opacity: 0.85;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 12px;
    }

    .job-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      text-decoration: none;
    }

    .job-title:hover {
      color: var(--primary-color);
      text-decoration: underline;
    }

    .company-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .score-badge {
      font-size: 1.1rem;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 20px;
      white-space: nowrap;
    }

    .score-high { background: var(--success-bg); color: var(--success-text); border: 1px solid var(--success-border); }
    .score-med  { background: var(--warning-bg); color: var(--warning-text); border: 1px solid #fde047; }
    .score-low  { background: #f1f5f9; color: var(--text-muted); border: 1px solid var(--border-color); }
    .score-excluded { background: var(--danger-bg); color: var(--danger-text); border: 1px solid var(--danger-border); }

    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
    }

    .meta-tag {
      font-size: 0.85rem;
      padding: 4px 10px;
      border-radius: 6px;
      background: #f1f5f9;
      color: var(--text-muted);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .meta-tag.salary-tag {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      font-weight: 600;
    }

    .meta-tag.work-tag {
      background: var(--badge-bg);
      color: var(--badge-text);
    }

    .reasons-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .reasons-block { grid-template-columns: 1fr; }
    }

    .reason-box {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .reason-box.fit {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }

    .reason-box.mismatch {
      background: #fffbeb;
      border: 1px solid #fef3c7;
    }

    .reason-box.exclusion {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .reason-box h4 {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .reason-box.fit h4 { color: #15803d; }
    .reason-box.mismatch h4 { color: #b45309; }
    .reason-box.exclusion h4 { color: #b91c1c; }

    .reason-box ul {
      list-style-type: disc;
      padding-left: 20px;
    }

    .reason-box li {
      margin-bottom: 4px;
    }

    .duties-preview {
      font-size: 0.88rem;
      color: var(--text-muted);
      background: #f8fafc;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      border-left: 3px solid #cbd5e1;
    }

    .po-decision-bar {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: #fafafa;
      padding: 14px;
      border-radius: 8px;
    }

    .decision-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-decision {
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.88rem;
      border: 1px solid var(--border-color);
      background: #ffffff;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-decision.apply:hover, .btn-decision.apply.selected {
      background: #16a34a;
      color: #ffffff;
      border-color: #16a34a;
    }

    .btn-decision.no-apply:hover, .btn-decision.no-apply.selected {
      background: #dc2626;
      color: #ffffff;
      border-color: #dc2626;
    }

    .reason-input {
      flex: 1;
      min-width: 240px;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 0.88rem;
    }

    .btn-save {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-save:hover { background: var(--primary-hover); }

    .no-results {
      text-align: center;
      padding: 48px;
      background: white;
      border-radius: var(--radius);
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-top">
        <div>
          <h1>🎯 Job Hunter — Executive Vacancy Review</h1>
          <div class="audit-link">
            📁 Snapshot Source: <strong>${escapeHtml(sourcePath)}</strong> | 
            🕒 Generated: <strong>${escapeHtml(generatedAt)}</strong> | 
            v${escapeHtml(mergedData.resultContractVersion || 1)}
          </div>
        </div>
        <div>
          <a href="${escapeHtml(sourcePath)}" target="_blank" class="stat-pill" style="text-decoration:none;">📄 Raw JSON Snapshot</a>
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat-pill">Apply Candidates (&ge;${visibleThreshold}%): <strong>${visibleResults.length}</strong></div>
        <div class="stat-pill">Total Scored: <strong>${results.length}</strong></div>
        <div class="stat-pill">Hard-Excluded: <strong>${excluded.length}</strong></div>
        <div class="stat-pill">SERP Coverage: <strong>${mergedData.confirmedJobAdPages || '?'} ad pages</strong></div>
      </div>
    </header>

    <div class="controls">
      <button class="tab-btn active" onclick="filterTab('apply')">🎯 Apply Candidates (&ge;${visibleThreshold}%) (${visibleResults.length})</button>
      <button class="tab-btn" onclick="filterTab('all')">📋 All Scored (${results.length})</button>
      <button class="tab-btn" onclick="filterTab('excluded')">🚫 Hard-Excluded (${excluded.length})</button>
    </div>

    <main id="job-list" class="job-list">
      ${results.length === 0 && excluded.length === 0 ? '<div class="no-results">Nincs megjeleníthető találat a pillanatnyi pillanatképben.</div>' : ''}
      
      <!-- Visible / Scored Results -->
      ${results.map((row, idx) => renderJobCard(row, idx, visibleThreshold, false)).join('\n')}

      <!-- Excluded Results -->
      ${excluded.map((row, idx) => renderJobCard(row, idx + results.length, visibleThreshold, true)).join('\n')}
    </main>
  </div>

  <script>
    const STORAGE_KEY = 'jh_po_decisions';

    function filterTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');

      const cards = document.querySelectorAll('.job-card');
      cards.forEach(card => {
        const isVisible = card.dataset.visible === 'true';
        const isExcluded = card.dataset.excluded === 'true';

        if (tab === 'apply') {
          card.style.display = (isVisible && !isExcluded) ? 'block' : 'none';
        } else if (tab === 'all') {
          card.style.display = (!isExcluded) ? 'block' : 'none';
        } else if (tab === 'excluded') {
          card.style.display = (isExcluded) ? 'block' : 'none';
        }
      });
    }

    function selectDecision(cardId, decision) {
      const card = document.getElementById(cardId);
      const applyBtn = card.querySelector('.btn-decision.apply');
      const noApplyBtn = card.querySelector('.btn-decision.no-apply');

      if (decision === 'APPLY') {
        applyBtn.classList.add('selected');
        noApplyBtn.classList.remove('selected');
        card.dataset.poDecision = 'APPLY';
      } else if (decision === 'DO_NOT_APPLY') {
        noApplyBtn.classList.add('selected');
        applyBtn.classList.remove('selected');
        card.dataset.poDecision = 'DO_NOT_APPLY';
      }
    }

    function saveCardDecision(cardId, url) {
      const card = document.getElementById(cardId);
      const decision = card.dataset.poDecision || null;
      const reasonInput = card.querySelector('.reason-input');
      const reason = reasonInput ? reasonInput.value : '';

      if (!decision) {
        alert('Kérjük válasszon döntést (APPLY vagy DO_NOT_APPLY) a mentés előtt!');
        return;
      }

      // Save to localStorage
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      store[url] = {
        poDecision: decision,
        poReason: reason,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

      // Visual Feedback
      const saveBtn = card.querySelector('.btn-save');
      const origText = saveBtn.innerText;
      saveBtn.innerText = '✓ Mentve!';
      saveBtn.style.background = '#16a34a';
      setTimeout(() => {
        saveBtn.innerText = origText;
        saveBtn.style.background = '';
      }, 2000);
    }

    // Initialize tabs
    document.addEventListener('DOMContentLoaded', () => {
      // Restore local decisions if available
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      document.querySelectorAll('.job-card').forEach(card => {
        const url = card.dataset.url;
        if (url && store[url]) {
          const item = store[url];
          selectDecision(card.id, item.poDecision);
          const reasonInput = card.querySelector('.reason-input');
          if (reasonInput && item.poReason) {
            reasonInput.value = item.poReason;
          }
        }
      });
    });
  </script>
</body>
</html>`;

  return html;
}

/**
 * Helper to render a single job card for HTML report.
 */
function renderJobCard(row, index, visibleThreshold, isExcluded) {
  const cardId = `job-card-${index}`;
  const isVisible = Boolean(row.visible || (row.relevancePercent ?? 0) >= visibleThreshold);
  const score = row.relevancePercent ?? 0;

  let scoreClass = 'score-low';
  if (isExcluded) {
    scoreClass = 'score-excluded';
  } else if (score >= 80) {
    scoreClass = 'score-high';
  } else if (score >= visibleThreshold) {
    scoreClass = 'score-med';
  }

  const cardClass = isExcluded
    ? 'excluded-card'
    : (score >= 80 ? 'high-fit' : (isVisible ? 'visible-card' : ''));

  const initialDecision = row.poDecision || '';
  const applySelected = initialDecision === 'APPLY' ? 'selected' : '';
  const noApplySelected = initialDecision === 'DO_NOT_APPLY' ? 'selected' : '';

  return `
    <article id="${cardId}" 
      class="job-card ${cardClass}" 
      data-visible="${isVisible}" 
      data-excluded="${isExcluded}" 
      data-url="${escapeHtml(row.url)}"
      data-po-decision="${escapeHtml(initialDecision)}"
      style="${(!isExcluded && isVisible) ? 'display:block;' : 'display:none;'}">
      
      <div class="card-header">
        <div>
          <a href="${escapeHtml(row.url)}" target="_blank" rel="noopener" class="job-title">
            ${escapeHtml(row.title || 'Cím nélkül')} 🔗
          </a>
          <div class="company-name">🏢 ${escapeHtml(row.company || 'Ismeretlen cég')}</div>
        </div>
        <div>
          <span class="score-badge ${scoreClass}">
            ${isExcluded ? 'KIZÁRVA' : `${score}% RELEVANCS`}
          </span>
        </div>
      </div>

      <div class="meta-row">
        <span class="meta-tag">📍 ${escapeHtml(row.locationText || 'Helyszín nincs megadva')}</span>
        ${row.workArrangement ? `<span class="meta-tag work-tag">🏠 ${escapeHtml(row.workArrangement)}</span>` : ''}
        ${row.salary ? `<span class="meta-tag salary-tag">💰 ${escapeHtml(row.salary)}</span>` : ''}
        ${row.englishRequirement ? `<span class="meta-tag">🌐 Angol: ${escapeHtml(row.englishRequirement)}</span>` : ''}
        ${row.source ? `<span class="meta-tag">🌐 Forrás: ${escapeHtml(row.source)}</span>` : ''}
        ${row.datePosted ? `<span class="meta-tag">📅 Közzétéve: ${escapeHtml(row.datePosted.slice(0, 10))}</span>` : ''}
      </div>

      ${isExcluded ? `
        <div class="reasons-block">
          <div class="reason-box exclusion" style="grid-column: 1 / -1;">
            <h4>🚫 Kizárási Indok</h4>
            <p>${escapeHtml(row.exclusionReason || 'Kemény kizárási szabály miatt eltávolítva.')}</p>
          </div>
        </div>
      ` : `
        <div class="reasons-block">
          <div class="reason-box fit">
            <h4>✅ Pozitív illeszkedési tényezők (${(row.fitReasons || []).length})</h4>
            <ul>
              ${(row.fitReasons || []).map(r => `<li>${escapeHtml(r)}</li>`).join('')}
              ${(row.fitReasons || []).length === 0 ? '<li>Nem történt külön kiemelés.</li>' : ''}
            </ul>
          </div>
          <div class="reason-box mismatch">
            <h4>⚠️ Kockázatok / Eltérések (${(row.mismatchReasons || []).length})</h4>
            <ul>
              ${(row.mismatchReasons || []).map(r => `<li>${escapeHtml(r)}</li>`).join('')}
              ${(row.mismatchReasons || []).map ? '' : ''}
              ${(row.mismatchReasons || []).length === 0 ? '<li>Nincs azonosított eltérés vagy kockázat.</li>' : ''}
            </ul>
          </div>
        </div>
      `}

      ${row.keyDuties ? `
        <div class="duties-preview">
          <strong>📝 Feladatkör / Részletek:</strong> ${escapeHtml(row.keyDuties.length > 300 ? row.keyDuties.slice(0, 300) + '...' : row.keyDuties)}
        </div>
      ` : ''}

      <div class="po-decision-bar">
        <div class="decision-buttons">
          <button type="button" class="btn-decision apply ${applySelected}" onclick="selectDecision('${cardId}', 'APPLY')">
            👍 APPLY (Jelentkezésre ajánlott)
          </button>
          <button type="button" class="btn-decision no-apply ${noApplySelected}" onclick="selectDecision('${cardId}', 'DO_NOT_APPLY')">
            👎 DO NOT APPLY (Elutasítva)
          </button>
        </div>
        <input type="text" class="reason-input" placeholder="Rövid PO indoklás / megjegyzés (pl. jó fizetés, kicsi csapat...)" value="${escapeHtml(row.poReason || '')}">
        <button type="button" class="btn-save" onclick="saveCardDecision('${cardId}', '${escapeHtml(row.url)}')">💾 Mentés</button>
      </div>
    </article>
  `;
}

/**
 * CLI Entry point: Generates HTML report file from a given input snapshot JSON path.
 */
export function buildReportFile(inputJsonPath, outputHtmlPath) {
  const resolvedInput = resolve(inputJsonPath);
  const resolvedOutput = resolve(outputHtmlPath);

  if (!existsSync(resolvedInput)) {
    throw new Error(`Input run snapshot JSON does not exist at ${resolvedInput}`);
  }

  const rawJson = readFileSync(resolvedInput, 'utf-8');
  const runData = JSON.parse(rawJson);

  const html = renderHtmlReport(runData, {
    sourceFilePath: relative(resolve('docs'), resolvedInput)
  });

  writeFileSync(resolvedOutput, html, 'utf-8');
  return { resolvedInput, resolvedOutput };
}
