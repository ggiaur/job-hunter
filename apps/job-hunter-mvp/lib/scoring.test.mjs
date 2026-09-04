// Tests derived directly from the acceptance criteria in SPRINT_1.md
// (Definition of Done) and docs/product/PO_DECISIONS_2026-09-04.md
// sections 2-7 — not from whatever scoring.mjs happens to compute.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRelevanceAssessment,
  isHardExcludedICRole,
  isOnePersonITRole,
  scoreLocation,
  scoreSalary,
  scoreFreshness,
  RELEVANCE_VISIBLE_THRESHOLD,
} from './scoring.mjs';

test('strong leadership match with local location and freshness scores >=60 and is visible', () => {
  const r = computeRelevanceAssessment({
    title: 'IT vezető',
    descriptionText: 'Csapatvezetés, csapatot vezet, beosztottak irányítása. Székesfehérváron dolgozunk. Home office is lehetséges.',
    locationText: 'Székesfehérvár',
    datePosted: new Date().toISOString(),
    positionRelevant: true,
    isGenericTitle: false,
  });
  assert.equal(r.hardExcluded, false);
  assert.ok(r.score >= RELEVANCE_VISIBLE_THRESHOLD, `expected >=60, got ${r.score}`);
  assert.equal(r.visible, true);
  assert.ok(r.fitReasons.length > 0);
});

test('PO_DECISIONS §2: developer title with no leadership scope is hard excluded', () => {
  assert.equal(isHardExcludedICRole('Senior Fejlesztő', 'Csapatban dolgozunk, agilis fejlesztés.'), true);
  const r = computeRelevanceAssessment({
    title: 'Senior Fejlesztő',
    descriptionText: 'Csapatban dolgozunk, agilis fejlesztés, kódolás.',
    locationText: 'Budapest',
    datePosted: null,
    positionRelevant: false,
    isGenericTitle: false,
  });
  assert.equal(r.hardExcluded, true);
});

test('PO_DECISIONS §2: helpdesk title is hard excluded', () => {
  assert.equal(isHardExcludedICRole('Helpdesk munkatárs', 'Ügyfelek hibáinak kezelése.'), true);
});

test('PO_DECISIONS §2: developer TITLE with real management scope in text is NOT IC-excluded', () => {
  // e.g. "Fejlesztési csapat vezetője" type role where description proves real leadership
  assert.equal(
    isHardExcludedICRole('Backend Developer csapat vezetője', 'Csapatot vezet, beosztottak teljesítményértékelése.'),
    false,
  );
});

test('PO_DECISIONS §2: one-person IT role is hard excluded regardless of title', () => {
  assert.equal(isOnePersonITRole('Ön lesz az egyszemélyes IT csapat, egyedül felel az összes IT feladatért.'), true);
  const r = computeRelevanceAssessment({
    title: 'IT vezető',
    descriptionText: 'Ön lesz az egyszemélyes IT csapat, egyedül felel az összes IT feladatért.',
    locationText: 'Győr',
    datePosted: null,
    positionRelevant: true,
    isGenericTitle: false,
  });
  assert.equal(r.hardExcluded, true);
});

test('PO_DECISIONS §2: project leadership without direct reports is NOT penalized as unqualified', () => {
  const r = computeRelevanceAssessment({
    title: 'Projektvezető',
    descriptionText: 'Projektterv készítése, erőforrás- és határidő-tervezés, kockázatkezelés, stakeholder koordináció, döntés-előkészítés.',
    locationText: 'Budapest',
    datePosted: null,
    positionRelevant: true,
    isGenericTitle: true,
  });
  assert.equal(r.hardExcluded, false);
  assert.ok(r.fitReasons.some((f) => /projekt-\/programvezetői/.test(f)));
  assert.ok(!r.mismatchReasons.some((m) => /Projektmenedzseri cím, de/.test(m)));
});

test('PO_DECISIONS §3: mandatory advanced English hard-excludes', () => {
  const r = computeRelevanceAssessment({
    title: 'IT vezető',
    descriptionText: 'Elvárás: felsőfokú angol nyelvtudás.',
    locationText: 'Budapest',
    datePosted: null,
    positionRelevant: true,
    isGenericTitle: false,
  });
  assert.equal(r.hardExcluded, true);
  assert.match(r.exclusionReason, /angol/i);
});

test('PO_DECISIONS §3: intermediate/basic/no English requirement does NOT exclude', () => {
  for (const desc of [
    'Középfokú angol nyelvtudás előny.',
    'Angol nyelvtudás nem elvárás.',
    'Csapatvezetés, beosztottak irányítása.',
  ]) {
    const r = computeRelevanceAssessment({
      title: 'IT vezető',
      descriptionText: desc,
      locationText: 'Budapest',
      datePosted: null,
      positionRelevant: true,
      isGenericTitle: false,
    });
    assert.equal(r.hardExcluded, false, `should not exclude for: ${desc}`);
  }
});

test('PO_DECISIONS §4: missing salary is neutral, not penalized', () => {
  const r = scoreSalary('Csapatvezetés és projektfelelősség.');
  assert.equal(r.points, 0);
  assert.equal(r.amount, null);
});

test('PO_DECISIONS §4: confirmed salary below 700k HUF gross is a small penalty, not exclusion', () => {
  const r = scoreSalary('Bruttó fizetés: 550000 Ft.');
  assert.equal(r.points, -10);
  assert.equal(r.amount, 550000);
});

test('PO_DECISIONS §4: salary at or above 700k is neutral (no bonus, no penalty)', () => {
  const r = scoreSalary('Bruttó fizetés: 900000 Ft.');
  assert.equal(r.points, 0);
  assert.equal(r.amount, 900000);
});

test('PO_DECISIONS §5: location is not a blanket hard exclusion — unknown location scores neutral, never excludes', () => {
  const r = computeRelevanceAssessment({
    title: 'IT vezető',
    descriptionText: 'Csapatvezetés, beosztottak irányítása.',
    locationText: null,
    datePosted: null,
    positionRelevant: true,
    isGenericTitle: false,
  });
  assert.equal(r.hardExcluded, false);
  const loc = scoreLocation(null, 'Csapatvezetés, beosztottak irányítása.');
  assert.equal(loc.points, 0);
});

test('PO_DECISIONS §5: Fehérvárcsurgó primary-ring city scores higher than plain Budapest', () => {
  const primary = scoreLocation('Székesfehérvár', '');
  const budapest = scoreLocation('Budapest', '');
  assert.ok(primary.points > budapest.points);
});

test('PO_DECISIONS §5: distant city with hybrid/remote mention scores positively, not excluded', () => {
  const r = scoreLocation('Pécs', 'Hibrid munkavégzés, ritka személyes jelenlét.');
  assert.ok(r.points > 0);
});

test('PO_DECISIONS §6: newer advert gets freshness bonus; older active advert is not excluded by age', () => {
  const fresh = scoreFreshness(new Date().toISOString());
  const old = scoreFreshness(new Date(Date.now() - 200 * 86400000).toISOString());
  assert.ok(fresh.points > old.points);
  assert.equal(old.points, 0);
  const r = computeRelevanceAssessment({
    title: 'IT vezető',
    descriptionText: 'Csapatvezetés, beosztottak irányítása.',
    locationText: 'Budapest',
    datePosted: new Date(Date.now() - 200 * 86400000).toISOString(),
    positionRelevant: true,
    isGenericTitle: false,
  });
  assert.equal(r.hardExcluded, false);
});

test('score is always clamped to [0, 100]', () => {
  const r = computeRelevanceAssessment({
    title: 'IT vezető',
    descriptionText: 'Csapatvezetés, beosztottak irányítása, teljesítményértékelés, projektterv, stakeholder, döntés-előkészítés. Székesfehérvár, home office. Bruttó fizetés: 2000000 Ft.',
    locationText: 'Székesfehérvár',
    datePosted: new Date().toISOString(),
    positionRelevant: true,
    isGenericTitle: false,
  });
  assert.ok(r.score <= 100 && r.score >= 0);
});

test('every non-excluded assessment carries both fit and mismatch context when applicable (explainability requirement)', () => {
  const r = computeRelevanceAssessment({
    title: 'Projektmenedzser',
    descriptionText: 'Projektek koordinálása.',
    locationText: 'Budapest',
    datePosted: null,
    positionRelevant: true,
    isGenericTitle: true,
  });
  assert.equal(r.hardExcluded, false);
  assert.ok(Array.isArray(r.fitReasons));
  assert.ok(Array.isArray(r.mismatchReasons));
});
