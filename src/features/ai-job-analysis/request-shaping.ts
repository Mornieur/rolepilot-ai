import type { CandidateProfile, PersistedJob } from '@/types/domain';
import type { DeterministicJobEvaluation } from '@/features/job-evaluation/types';

const MAX_DESCRIPTION = 6000;
const MAX_TERMS = 12;
const MAX_TERM = 100;
const clean = (value: string, maximum = MAX_TERM) =>
  value.replace(/\s+/g, ' ').trim().slice(0, maximum);
const list = (values: string[]) =>
  [
    ...new Set(
      values
        .map((value) => clean(value))
        .filter(Boolean)
        .map((item) => item.toLowerCase()),
    ),
  ].slice(0, MAX_TERMS);
export function shapeAiJobRequest(
  profile: CandidateProfile,
  job: PersistedJob,
  evaluation: DeterministicJobEvaluation,
) {
  return {
    candidate: {
      desiredRoles: list(profile.desiredRoles),
      acceptedSeniorities: profile.acceptedSeniorities,
      requiredSkills: list(profile.requiredSkills),
      preferredSkills: list(profile.preferredSkills),
      excludedSkills: list(profile.excludedSkills),
      acceptedWorkModels: profile.acceptedWorkModels,
      locations: list(profile.locations),
    },
    job: {
      title: clean(job.title),
      location: job.location ? clean(job.location) : null,
      description: clean(job.descriptionText ?? '', MAX_DESCRIPTION),
      departments: list(job.departments),
      offices: list(job.offices),
      language: job.language ? clean(job.language) : null,
    },
    deterministicAssessment: {
      score: evaluation.score,
      eligible: true as const,
      matchedRequiredKeywords: list(evaluation.matchedRequiredKeywords),
      matchedPreferredKeywords: list(evaluation.matchedPreferredKeywords),
      reasons: evaluation.reasons
        .map((reason) => ({ outcome: reason.outcome, message: clean(reason.message) }))
        .slice(0, 8),
    },
    metadata: {
      descriptionCharactersIncluded: clean(job.descriptionText ?? '', MAX_DESCRIPTION).length,
      candidateTermsIncluded: Object.values(profile).filter(Array.isArray).flat().length,
    },
  };
}
