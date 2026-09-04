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

// --- Adversarial cases from the independent Codex acceptance review
// (docs/product/SPRINT1_ACCEPTANCE_REVIEW_CODEX.md, 2026-09-04) ---

test('Codex #1: a "manager"-titled role with zero corroborating scope evidence does not score visible', () => {
  const r = computeRelevanceAssessment({
    title: 'IT szolgáltatásmenedzser',
    descriptionText: 'Önálló hibajegykezelés és felhasználói támogatás. Székesfehérvár.',
    locationText: 'Székesfehérvár',
    datePosted: new Date().toISOString(),
    positionRelevant: true,
    isGenericTitle: false,
  });
  assert.equal(r.hardExcluded, false);
  assert.ok(r.score < RELEVANCE_VISIBLE_THRESHOLD, `expected <60 (no-scope-evidence penalty), got ${r.score}`);
});

test('Codex #1: broader IC title terms (szoftvermérnök, IT support, service desk) are hard excluded', () => {
  assert.equal(isHardExcludedICRole('Szoftvermérnök', 'Önállóan fejleszt és üzemeltet.'), true);
  assert.equal(isHardExcludedICRole('IT Support', 'Felhasználók támogatása.'), true);
  assert.equal(isHardExcludedICRole('Service Desk Analyst', 'Incidenseket kezel.'), true);
  assert.equal(isHardExcludedICRole('IT ügyféltámogató', 'Hibajegyek kezelése.'), true);
});

test('Codex #1: broader one-person-IT phrasing is caught', () => {
  assert.equal(isOnePersonITRole('A vállalat egyetlen informatikusaként teljes körű IT-támogatást nyújt.'), true);
  assert.equal(isOnePersonITRole('Az IT-infrastruktúra kizárólagos felelőse lesz.'), true);
  assert.equal(isOnePersonITRole('Egy főből álló IT-csapatunkhoz keresünk kollégát.'), true);
});

test('Codex #2: a single incidental leadership word does not grant project-leadership credit', () => {
  const r = computeRelevanceAssessment({
    title: 'Senior Developer',
    descriptionText: 'Stakeholder igényeket egyeztet a fejlesztéshez.',
    locationText: 'Budapest',
    datePosted: null,
    positionRelevant: false, // "Senior Developer" title alone does not match target position terms
    isGenericTitle: false,
  });
  // hard-excluded via isHardExcludedICRole (developer title, single incidental
  // "stakeholder" word is not enough project-leadership evidence)
  assert.equal(r.hardExcluded, true);
});

test('Codex #2: routine PM administration text (single marker) still gets the no-scope-evidence penalty', () => {
  for (const desc of [
    'Projektterv dokumentációjának karbantartása.',
    'Erőforrásigények rögzítése.',
    'Határidők nyomon követése.',
    'Kockázatkezelési folyamat támogatása.',
  ]) {
    const r = computeRelevanceAssessment({
      title: 'Projektmenedzser',
      descriptionText: desc,
      locationText: 'Budapest',
      datePosted: null,
      positionRelevant: true,
      isGenericTitle: true,
    });
    assert.equal(r.hardExcluded, false);
    assert.ok(r.score < RELEVANCE_VISIBLE_THRESHOLD, `expected <60 for weak evidence "${desc}", got ${r.score}`);
  }
});

test('Codex #3: advanced English offered as a preference/advantage does not exclude', () => {
  for (const desc of [
    'Felsőfokú angol nyelvtudás előnyt jelent.',
    'Angol nyelvtudás: felsőfok előny.',
    'Tárgyalóképes angol előnyt jelent.',
    'Elvárt a felsőfokú német; angol nyelvtudás előny.',
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

test('Codex #3: genuinely mandatory advanced English (fluent/confident business level) excludes', () => {
  for (const desc of [
    'Az angol nyelv magabiztos, üzleti használata elengedhetetlen.',
    'Folyékony angol kommunikáció szükséges.',
  ]) {
    const r = computeRelevanceAssessment({
      title: 'IT vezető',
      descriptionText: desc,
      locationText: 'Budapest',
      datePosted: null,
      positionRelevant: true,
      isGenericTitle: false,
    });
    assert.equal(r.hardExcluded, true, `should exclude for: ${desc}`);
  }
});

test('Codex #4: cafeteria/travel/project-budget HUF amounts are not misread as salary', () => {
  for (const desc of [
    'Éves cafeteria keret: 500 000 Ft.',
    'Utazási támogatás maximum 650 000 Ft/év.',
    'A projekt költségvetése 600 000 Ft.',
  ]) {
    const r = scoreSalary(desc);
    assert.equal(r.amount, null, `should not attribute a salary from: ${desc}`);
    assert.equal(r.points, 0);
  }
});

test('Codex #4: "Bruttó 650.000,- Ft" formatting is correctly read as a real salary', () => {
  const r = scoreSalary('Bruttó 650.000,- Ft/hó.');
  assert.equal(r.amount, 650000);
  assert.equal(r.points, -10);
});

test('Codex #5: a short ring-city substring inside an unrelated word does not score a location bonus', () => {
  const r = scoreLocation('London', 'Learn more about our company.');
  assert.equal(r.points, 0, 'the English word "more" must not match the "Mor" ring-city term');
});

test('Codex #5: "tatai ügyfél" (a client from Tata, in a Budapest role) does not override the real workplace', () => {
  const r = scoreLocation('Budapest', 'Rendszeres egyeztetés egy tatai ügyféllel.');
  assert.equal(r.points, 6, 'should score as Budapest, not the Tata ring bonus, from an incidental client mention');
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
