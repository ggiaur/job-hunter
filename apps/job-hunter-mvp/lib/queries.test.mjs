// Tests derived from JH-SUP-0026 section 1.4 and section 6's required
// regression: "location query generator contains canonical regional
// coverage and a hybrid/remote lane".
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAcquisitionQueries, queryCoversAllRequiredRegionalCities, PRIMARY_REGION_CITIES, ROLE_FAMILIES } from './queries.mjs';

test('every canonical primary-ring city from PO_DECISIONS_2026-09-04.md appears in at least one real query string', () => {
  const queries = buildAcquisitionQueries();
  assert.equal(queryCoversAllRequiredRegionalCities(queries), true);
  for (const city of PRIMARY_REGION_CITIES) {
    assert.ok(queries.some((q) => q.q.includes(city)), `expected some query to mention ${city}`);
  }
});

test('exactly one national hybrid/remote lane query exists', () => {
  const queries = buildAcquisitionQueries();
  const remoteQueries = queries.filter((q) => q.locationLane === 'remote-hybrid');
  assert.equal(remoteQueries.length, 1);
  assert.match(remoteQueries[0].q, /távmunka|hibrid/i);
});

test('every original role family still has its unchanged Budapest query (no regression)', () => {
  const queries = buildAcquisitionQueries();
  for (const role of ROLE_FAMILIES) {
    assert.ok(queries.some((q) => q.q === `${role.q} állás Budapest`), `expected unchanged Budapest query for ${role.q}`);
  }
});

test('regional-ring queries are bounded to the top N role families, not a full cross product', () => {
  const queries = buildAcquisitionQueries({ topRegionalRoleCount: 4 });
  const regionalQueries = queries.filter((q) => q.locationLane === 'regional-ring');
  assert.equal(regionalQueries.length, 4);
});

test('total query count stays bounded (no combinatorial explosion) for the default configuration', () => {
  const queries = buildAcquisitionQueries();
  // 12 role families (Budapest, incl. bare "projektmenedzser" added after the
  // live Pillér canary showed "IT projektmenedzser" alone can miss it on a
  // given SerpApi ranking) + 4 regional-ring (top roles) + 1 remote lane = 17.
  assert.equal(queries.length, 17);
});

test('custom smaller role/city sets still produce full regional coverage', () => {
  const queries = buildAcquisitionQueries({
    roleFamilies: [{ q: 'teszt szerep', priorityWeight: 10 }],
    regionCities: ['Tesztváros'],
    topRegionalRoleCount: 1,
  });
  assert.equal(queryCoversAllRequiredRegionalCities(queries, ['Tesztváros']), true);
});
