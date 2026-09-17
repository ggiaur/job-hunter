import { fieldsFromJobPostingSchema, matchesTargetPosition, isGenericProjectTitle, hasITDomainContext } from './extract.mjs';
import { computeRelevanceAssessment } from './scoring.mjs';
import { detectWorkArrangement } from './work-arrangement.mjs';
import { findPriorFeedback } from './candidate-fit.mjs';

export function reviewJobPosting(schema, { url, profile, matchedQuery = null }) {
  if (!profile?.candidate?.sourceSha256) throw new Error('Önéletrajzi forrás nélkül nem készülhet személyes állásértékelés.');
  const fields = fieldsFromJobPostingSchema(schema);
  const title = fields.title || 'Ismeretlen pozíció';
  const company = fields.company || 'Ismeretlen munkáltató';
  const descriptionText = [fields.description, fields.requirements].filter(Boolean).join('\n');
  const positionRelevant = matchesTargetPosition(title) || (isGenericProjectTitle(title) && hasITDomainContext(descriptionText));
  const priorFeedback = findPriorFeedback(profile.learnedText, company, title);
  const priorDecision = priorFeedback.at(-1);
  const base = {
    title, company, url, source: new URL(url).hostname, matchedQuery,
    locationText: fields.location,
    workArrangement: detectWorkArrangement(fields.location, descriptionText),
    employmentType: fields.employmentType || 'unknown',
    datePosted: fields.datePosted, validThrough: fields.validThrough || 'unknown',
    poDecision: priorDecision?.decision || null, poReason: priorDecision?.reason || null,
    candidateProfileVersion: profile.candidate.version,
    candidateSourceSha256: profile.candidate.sourceSha256,
    priorFeedback,
  };
  const excludedCompany = profile.excludedCompanies.some(excluded => company.toLowerCase().includes(excluded.toLowerCase()));
  const assessment = excludedCompany
    ? { hardExcluded: true, exclusionReason: `Kizárt cég (profil beállítás): ${company}` }
    : computeRelevanceAssessment({ title, descriptionText, locationText: fields.location, datePosted: fields.datePosted,
      validThrough: fields.validThrough, positionRelevant,
      isGenericTitle: isGenericProjectTitle(title) && !matchesTargetPosition(title), candidateProfile: profile.candidate });
  if (assessment.hardExcluded) return { assessment, positionRelevant, record: { ...base, exclusionReason: assessment.exclusionReason } };
  return { assessment, positionRelevant, record: {
    ...base, salary: assessment.salaryAmount ? `~${assessment.salaryAmount.toLocaleString('hu-HU')} Ft (bruttó, hirdetésből)` : null,
    relevancePercent: assessment.score, visible: assessment.visible,
    fitReasons: assessment.fitReasons, mismatchReasons: assessment.mismatchReasons,
    englishRequirement: assessment.englishRequirement, educationNote: assessment.educationNote,
    candidateReview: assessment.candidateReview,
    descriptionText, keyDuties: fields.description?.slice(0, 500) || 'Ismeretlen feladatok',
  } };
}
