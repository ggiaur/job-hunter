import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderHtmlReport, buildReportFile } from './render.mjs';
import { loadDecisions, saveDecision, mergeDecisions } from './decisions.mjs';

const mockRunData = {
  generatedAt: "2026-09-04T11:29:18.410Z",
  queries: ["IT vezető állás Budapest"],
  totalSerpResults: 10,
  confirmedJobAdPages: 5,
  resultContractVersion: 1,
  visibleThreshold: 60,
  results: [
    {
      title: "E&P IT Operations Manager",
      company: "MOL Group",
      url: "https://hu.linkedin.com/jobs/view/12345",
      source: "hu.linkedin.com",
      matchedQuery: "IT vezető állás Budapest",
      locationText: "Budapest, HU",
      workArrangement: "remote/hibrid",
      employmentType: "FULL_TIME",
      datePosted: "2026-08-19T13:57:11.000Z",
      validThrough: "2026-09-18T13:57:11.000Z",
      poDecision: null,
      poReason: null,
      salary: "Bruttó 1.200.000 Ft/hó",
      relevancePercent: 92,
      visible: true,
      fitReasons: [
        "Általános vezetői cím, IT-doménkontextussal megerősítve.",
        "Konkrét people-management felelősség (10-15 fő)."
      ],
      mismatchReasons: [
        "Budapest nem az elsődleges gyűrű."
      ],
      englishRequirement: "tárgyalási szint (elfogadott)",
      keyDuties: "The E&P IT Operations Manager leads and governs IT operations."
    },
    {
      title: "IT Manager",
      company: "WAY Group",
      url: "https://hu.linkedin.com/jobs/view/67890",
      source: "hu.linkedin.com",
      matchedQuery: "IT vezető állás Budapest",
      locationText: "Nyíregyháza, HU",
      workArrangement: null,
      employmentType: "FULL_TIME",
      datePosted: "2026-09-02T10:44:05.000Z",
      poDecision: null,
      poReason: null,
      salary: null, // Salary missing/unstated
      relevancePercent: 78,
      visible: true,
      fitReasons: ["Cím megegyezik."],
      mismatchReasons: ["Helyszín nem azonosított."],
      englishRequirement: "not specified",
      keyDuties: "Building local IT organization."
    }
  ],
  excluded: [
    {
      title: "IT Manager (Production)",
      company: "Future Talents",
      url: "https://hu.linkedin.com/jobs/view/99999",
      source: "hu.linkedin.com",
      locationText: "Veszprém, HU",
      exclusionReason: "Kizárva: kötelező felsőfokú angol nyelvtudás."
    }
  ]
};

test('renderHtmlReport renders all required fields for visible >=60% vacancies', () => {
  const html = renderHtmlReport(mockRunData, { sourceFilePath: 'docs/evidence/job-hunter-runs/latest.json' });

  // Title, Company, Direct URL
  assert.ok(html.includes('E&amp;P IT Operations Manager'));
  assert.ok(html.includes('MOL Group'));
  assert.ok(html.includes('https://hu.linkedin.com/jobs/view/12345'));

  // Location, Work Arrangement, Salary
  assert.ok(html.includes('Budapest, HU'));
  assert.ok(html.includes('remote/hibrid'));
  assert.ok(html.includes('Bruttó 1.200.000 Ft/hó'));

  // Relevance percent, Fit reasons, Mismatch reasons
  assert.ok(html.includes('92% RELEVANCS'));
  assert.ok(html.includes('Általános vezetői cím, IT-doménkontextussal megerősítve.'));
  assert.ok(html.includes('Budapest nem az elsődleges gyűrű.'));

  // PO decision controls
  assert.ok(html.includes('APPLY (Jelentkezésre ajánlott)'));
  assert.ok(html.includes('DO NOT APPLY (Elutasítva)'));
  assert.ok(html.includes('Rövid PO indoklás / megjegyzés'));
});

test('renderHtmlReport does NOT fabricate salary when salary is null', () => {
  const html = renderHtmlReport(mockRunData);

  // WAY Group vacancy has salary = null
  // Verify that no salary tag is rendered for WAY Group
  assert.ok(html.includes('WAY Group'));
  const wayGroupIdx = html.indexOf('WAY Group');
  const wayGroupSection = html.slice(wayGroupIdx, wayGroupIdx + 1500);
  assert.equal(wayGroupSection.includes('salary-tag'), false);
});

test('renderHtmlReport preserves auditable link to snapshot source path and timestamp', () => {
  const html = renderHtmlReport(mockRunData, { sourceFilePath: 'docs/evidence/job-hunter-runs/2026-09-04T11-29-18-410Z.json' });

  assert.ok(html.includes('docs/evidence/job-hunter-runs/2026-09-04T11-29-18-410Z.json'));
  assert.ok(html.includes('2026-09-04T11:29:18.410Z'));
});

test('saveDecision and loadDecisions persist additive PO decisions without mutating run snapshot', () => {
  const testDecisionsFile = 'apps/job-hunter-mvp/presentation/test-po-decisions.json';
  const testUrl = 'https://hu.linkedin.com/jobs/view/12345';

  try {
    saveDecision(testUrl, 'APPLY', 'Remek MOL vezetői pozíció', testDecisionsFile);

    const loaded = loadDecisions(testDecisionsFile);
    assert.equal(loaded[testUrl].poDecision, 'APPLY');
    assert.equal(loaded[testUrl].poReason, 'Remek MOL vezetői pozíció');

    const merged = mergeDecisions(mockRunData, loaded);
    assert.equal(merged.results[0].poDecision, 'APPLY');
    assert.equal(merged.results[0].poReason, 'Remek MOL vezetői pozíció');

    // Verify original snapshot is untouched
    assert.equal(mockRunData.results[0].poDecision, null);
  } finally {
    if (existsSync(resolve(testDecisionsFile))) {
      unlinkSync(resolve(testDecisionsFile));
    }
  }
});

test('buildReportFile creates an HTML file on disk', () => {
  const outputHtmlPath = 'apps/job-hunter-mvp/presentation/test-output.html';
  try {
    const res = buildReportFile('docs/evidence/job-hunter-runs/latest.json', outputHtmlPath);
    assert.ok(existsSync(res.resolvedOutput));
    const content = readFileSync(res.resolvedOutput, 'utf-8');
    assert.ok(content.includes('Executive Vacancy Review'));
  } finally {
    if (existsSync(resolve(outputHtmlPath))) {
      unlinkSync(resolve(outputHtmlPath));
    }
  }
});
