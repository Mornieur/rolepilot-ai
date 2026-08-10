import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getAiAnalysisInputFingerprint } from './fingerprint';

const profile = {
  id: 'profile',
  name: 'Maria',
  desiredRoles: ['  Frontend   Engineer '],
  acceptedSeniorities: ['senior' as const],
  requiredSkills: ['React'],
  preferredSkills: [],
  excludedSkills: [],
  acceptedWorkModels: ['remote' as const],
  locations: ['Brazil'],
};
const job = {
  id: 'job',
  provider: 'greenhouse' as const,
  targetCompanyId: 'company',
  externalId: 'external',
  title: 'Frontend Engineer',
  location: 'Remote',
  descriptionText: 'React and TypeScript role',
  originalUrl: 'https://example.test',
  sourceUpdatedAt: null,
  language: null,
  departments: [],
  offices: [],
  firstSeenAt: '2026-08-01T00:00:00Z',
  lastSeenAt: '2026-08-01T00:00:00Z',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};
const evaluation = {
  profileId: profile.id,
  job,
  eligible: true,
  status: 'eligible' as const,
  evaluatedAt: '2026-08-01T00:00:00Z',
  score: 80,
  reasons: [],
  matchedKeywords: [],
  matchedRequiredKeywords: [],
  matchedPreferredKeywords: [],
  excludedKeywordMatches: [],
  titleMatch: { matched: true, matchedTerms: [] },
  seniorityMatch: { matched: null, detectedSeniorities: [] },
  locationMatch: { matched: null, matchedTerms: [] },
  workModelMatch: { matched: null, detectedModels: [] },
};

describe('AI analysis input fingerprint', () => {
  it('is deterministic after bounded request shaping', () => {
    expect(getAiAnalysisInputFingerprint(profile, job, evaluation)).toBe(
      getAiAnalysisInputFingerprint(profile, job, evaluation),
    );
  });
  it('uses normalized whitespace and changes for relevant profile or job context', () => {
    expect(
      getAiAnalysisInputFingerprint(
        { ...profile, desiredRoles: ['Frontend Engineer'] },
        job,
        evaluation,
      ),
    ).toBe(getAiAnalysisInputFingerprint(profile, job, evaluation));
    expect(
      getAiAnalysisInputFingerprint(
        profile,
        { ...job, descriptionText: 'Different requirement' },
        evaluation,
      ),
    ).not.toBe(getAiAnalysisInputFingerprint(profile, job, evaluation));
    expect(
      getAiAnalysisInputFingerprint({ ...profile, requiredSkills: ['Python'] }, job, evaluation),
    ).not.toBe(getAiAnalysisInputFingerprint(profile, job, evaluation));
  });
});
