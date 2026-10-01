import { readFileSync } from 'node:fs';
import { hasManagementScope, hasITDomainContext } from './extract.mjs';

export const MATCHING_POLICY = JSON.parse(readFileSync(new URL('../../../profile/matching-policy.json', import.meta.url), 'utf8'));

// Each signal needs evidence in the duties, not the job title. Keep fragments
// so the explanation can be checked against the advertisement.
const SIGNALS = {
  people_management: ['Igazolt vezetői felelősség: emberek és szervezeti egység', text => hasManagementScope(text)],
  full_it_responsibility: ['Teljes IT-felelősség', /teljes[^.\n;]{0,35}(?:it|informatikai)[^.\n;]{0,70}(?:vezet|irányít|felelő|felel|koordin)|(?:full|overall|entire)[^.\n;]{0,25}it[^.\n;]{0,50}(?:responsib|lead|manag|ownership)/i],
  operations_and_infrastructure: ['Üzemeltetés és infrastruktúra', /üzemeltet|infrastruktúra|infrastructure|it operations|monitoring|monitorozás|rendszerfelügyelet/i],
  it_strategy: ['IT-stratégia és tervezés', /(?:it|informatikai)[ -]?stratég|stratégiai (?:tervez|dönt)|(?:beszerzési|fejlesztési|üzemeltetési) terv|it strateg/i],
  budget_responsibility: ['Költségvetési felelősség', /költségvetés[^.\n;]{0,50}(?:tervez|felelő|felel|kontroll|kezel|követ)|költségtervez|budget[^.\n;]{0,35}(?:responsib|ownership|manag|plan)/i],
  vendor_management: ['Szállítói kapcsolatok irányítása', /(?:beszállító|szállító|szolgáltató)[^.\n;]{0,55}(?:kapcsolat|koordin|kontroll|kezel|irányít)|kapcsolattartás[^.\n;]{0,50}(?:szállító|szolgáltató)|vendor management/i],
  procurement: ['Beszerzési feladatok', /beszerzés|procurement/i],
  cybersecurity_responsibility: ['IT-biztonsági felelősség', /it[ -]?biztonság|kiberbiztonság|cybersecurity|information security/i],
  digitalization: ['Digitalizáció', /digitalizáció|digital transformation|digitális transzformáció/i],
  application_or_system_integration: ['Rendszerintegráció', /rendszerintegráció|rendszerintegrációs|system integration|api[ -]?integr|erp|opencart|adatmigráció/i],
  development_oversight: ['Fejlesztési háttér és felügyelet', /fejlesztő\s*csapat|fejlesztés[^.\n;]{0,40}(?:felügyelet|vezet|irányít|koordin|fókusz)|fejlesztési fókusz|development (?:background|team|oversight)/i],
  ai_and_automation: ['AI és automatizáció', /\bai\b|mesterséges intelligencia|automatiz|automation/i],
  public_sector_or_hungarian_work_environment: ['Közintézményi vagy magyar munkakörnyezet', /közintézmény|közigazgatás|államigazgatás|államkincstár|nonprofit|magyar munkanyelv|hungarian working language/i],
};
const NEGATED = /\b(?:no|without)\s+(?:direct reports|people management|team management)|nincs[^.\n;]{0,20}(?:beosztott|csapat|vezetői)|nem (?:feladat|tartozik|felel)|nem igényel|nem szükséges/i;
const PM_TITLE = /project manager|projektmenedzser|projektvezető|program manager|programvezető|pmo|scrum master|delivery manager|transformation manager/i;

export function assessLeadership(title = '', description = '', candidate = null) {
  const clauses = description.split(/[.\n;]+/).map(s => s.trim()).filter(s => s && !NEGATED.test(s));
  const signals = Object.fromEntries(Object.entries(SIGNALS).map(([key, [label, matcher]]) => {
    const evidence = clauses.filter(s => typeof matcher === 'function' ? matcher(s) : matcher.test(s));
    const candidateSupports = key !== 'people_management' || !candidate || candidate.facts.some(f => f.id === 'people-leadership');
    return [key, { label, evidence, points: evidence.length && candidateSupports ? MATCHING_POLICY.positive_signals[key] : 0 }];
  }));
  const has = key => signals[key].points > 0;
  const decisionEvidence = clauses.filter(s => /döntési (?:jogkör|hatáskör)|döntések(?:ben| meghoz)|döntéshoz|decision authority|decision.making|stratégiai döntés|önálló felelősség/i.test(s));
  const broadIT = has('full_it_responsibility') || (has('operations_and_infrastructure') && (has('development_oversight') || has('cybersecurity_responsibility')));
  const projectRole = PM_TITLE.test(title);
  const primary = has('people_management') && (!projectRole || (decisionEvidence.length > 0 && broadIT));
  const facet = keys => ({ status: keys.some(has) ? 'SUPPORTED' : 'NOT_EVIDENCED', evidence: [...new Set(keys.flatMap(k => signals[k].evidence))] });
  return {
    signals, primary, projectRole, broadIT, decisionEvidence,
    domainRelevant: hasITDomainContext(`${title} ${description}`),
    leadership_fit: { ...facet(['people_management', 'full_it_responsibility']), primary, decisionEvidence, broadIT },
    people_management_fit: facet(['people_management']),
    technical_fit: facet(['operations_and_infrastructure', 'application_or_system_integration', 'cybersecurity_responsibility']),
    development_fit: {
      ...facet(['development_oversight', 'application_or_system_integration']),
      candidateEvidence: (candidate?.facts || []).filter(f => ['php-development', 'development-background', 'erp-integration'].includes(f.id)).map(f => f.evidence),
      note: 'A fejlesztői háttér elvárása önmagában nem kizáró ok; a konkrét technológiai mélység külön ellenőrizendő.',
    },
    strategic_fit: facet(['it_strategy', 'budget_responsibility', 'vendor_management', 'digitalization']),
  };
}
