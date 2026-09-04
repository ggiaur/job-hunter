// JH-SUP-0026 section 1.4: acquisition queries were 11 hardcoded strings all
// ending in "Budapest", never revisited when PO_DECISIONS_2026-09-04.md's
// Fehérvárcsurgó-accessible-region location rules were implemented in
// SUP-0024. This module regenerates queries from those canonical rules
// instead. Not the cause of the Pillér miss itself (a Budapest vacancy),
// but a real, separate coverage gap JH-SUP-0025's reconciliation identified.
//
// Strategy: compact role-family x location, not a full cross product.
// - Every role family keeps its original Budapest-suffixed query (unchanged
//   behavior, no regression).
// - The TOP_REGIONAL_ROLE_COUNT highest-priority role families additionally
//   get ONE combined query naming every required primary-ring city, so
//   Google/SerpApi can match an ad mentioning any one of them without a
//   per-city query multiplying the total count.
// - Exactly one national hybrid/remote-lane query covers otherwise-distant
//   Hungarian locations per PO_DECISIONS section 5.

export const ROLE_FAMILIES = [
  { q: 'IT vezető', priorityWeight: 60 },
  { q: 'informatikai vezető', priorityWeight: 60 },
  { q: 'IT osztályvezető', priorityWeight: 50 },
  { q: 'infrastruktúra vezető', priorityWeight: 50 },
  { q: 'IT projektmenedzser', priorityWeight: 40 },
  { q: 'informatikai projektvezető', priorityWeight: 45 },
  { q: 'digitalizációs projektmenedzser', priorityWeight: 45 },
  { q: 'digitalizációs vezető', priorityWeight: 30 },
  { q: 'IT szolgáltatásmenedzser', priorityWeight: 35 },
  { q: 'közintézményi digitalizációs projektmenedzser', priorityWeight: 40 },
  { q: 'AI transzformációs vezető', priorityWeight: 20 },
];

// PO_DECISIONS_2026-09-04.md section 5: primary accessibility ring from
// Fehérvárcsurgó. Named individually here (not just used as a scoring ring)
// so each required city genuinely appears in at least one real query
// string, per JH-SUP-0026 section 1.4's explicit coverage requirement.
export const PRIMARY_REGION_CITIES = ['Székesfehérvár', 'Mór', 'Várpalota', 'Győr', 'Tata', 'Tatabánya', 'Veszprém', 'Dunaújváros'];

export const TOP_REGIONAL_ROLE_COUNT = 4;

export function buildAcquisitionQueries({ roleFamilies = ROLE_FAMILIES, regionCities = PRIMARY_REGION_CITIES, topRegionalRoleCount = TOP_REGIONAL_ROLE_COUNT } = {}) {
  const queries = [];

  for (const role of roleFamilies) {
    queries.push({ q: `${role.q} állás Budapest`, priorityWeight: role.priorityWeight, locationLane: 'budapest' });
  }

  const topRoles = [...roleFamilies].sort((a, b) => b.priorityWeight - a.priorityWeight).slice(0, topRegionalRoleCount);
  const regionTerm = regionCities.join(' ');
  for (const role of topRoles) {
    queries.push({ q: `${role.q} állás ${regionTerm}`, priorityWeight: role.priorityWeight, locationLane: 'regional-ring' });
  }

  queries.push({
    q: 'IT vezető informatikai vezető projektmenedzser állás távmunka hibrid',
    priorityWeight: 40,
    locationLane: 'remote-hybrid',
  });

  return queries;
}

export function queryCoversAllRequiredRegionalCities(queries, regionCities = PRIMARY_REGION_CITIES) {
  const combinedText = queries.map((q) => q.q).join(' | ');
  return regionCities.every((city) => combinedText.includes(city));
}
