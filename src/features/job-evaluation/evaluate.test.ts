import { describe, expect, it } from 'vitest';
import { evaluateJob, normalizeText, sortEvaluations } from './evaluate';
import type { CandidateProfile, PersistedJob } from '@/types/domain';

const profile: CandidateProfile = {
  id: 'profile-1',
  name: 'Frontend profile',
  desiredRoles: ['Frontend Engineer'],
  acceptedSeniorities: ['senior'],
  requiredSkills: ['React', 'TypeScript'],
  preferredSkills: ['GraphQL', 'C#'],
  excludedSkills: ['Java'],
  acceptedWorkModels: ['remote'],
  locations: ['Sao Paulo'],
};

function job(overrides: Partial<PersistedJob> = {}): PersistedJob {
  return {
    id: 'job-1',
    provider: 'greenhouse',
    targetCompanyId: 'company-1',
    externalId: 'external-1',
    title: 'Senior Frontend Engineer',
    location: 'Sao Paulo, Brazil',
    descriptionText: 'Remote role using React, TypeScript, GraphQL, and C#.',
    originalUrl: 'https://example.test/jobs/1',
    sourceUpdatedAt: null,
    language: 'en',
    departments: ['Engineering'],
    offices: [],
    firstSeenAt: '2026-07-01T00:00:00.000Z',
    lastSeenAt: '2026-07-02T00:00:00.000Z',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('deterministic job evaluator', () => {
  it('normalizes accents and punctuation while preserving useful keyword characters', () => {
    expect(normalizeText('São-Paulo: C# / C++')).toBe('sao paulo c# c++');
  });

  it('accepts a job when all configured mandatory rules pass and provides a bounded score', () => {
    const result = evaluateJob(profile, job());
    expect(result.eligible).toBe(true);
    expect(result.status).toBe('eligible');
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.matchedRequiredKeywords).toEqual(['react', 'typescript']);
    expect(result.titleMatch.matched).toBe(true);
  });

  it('keeps partial required-skill coverage discoverable with an explicit warning', () => {
    const result = evaluateJob(profile, job({ descriptionText: 'Remote role using React only.' }));
    expect(result.eligible).toBe(true);
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ code: 'required-partial', outcome: 'neutral' }),
    );
  });

  it('rejects an excluded exact keyword without treating JavaScript as Java', () => {
    expect(
      evaluateJob(
        profile,
        job({ descriptionText: 'Remote role using React, TypeScript, and JavaScript.' }),
      ).eligible,
    ).toBe(true);
    const result = evaluateJob(
      profile,
      job({ descriptionText: 'Remote role using React, TypeScript, and Java.' }),
    );
    expect(result.eligible).toBe(false);
    expect(result.excludedKeywordMatches).toEqual(['java']);
  });

  it('rejects a title outside the desired role phrases', () => {
    const result = evaluateJob(profile, job({ title: 'Senior Product Designer' }));
    expect(result.eligible).toBe(false);
    expect(result.titleMatch.matched).toBe(false);
  });

  it('uses title-only seniority detection, including Portuguese terms, and treats unknown as neutral', () => {
    expect(
      evaluateJob(
        { ...profile, acceptedSeniorities: ['mid'] },
        job({ title: 'Desenvolvedor Pleno Frontend Engineer' }),
      ).eligible,
    ).toBe(true);
    const unknown = evaluateJob(
      profile,
      job({
        title: 'Frontend Engineer',
        descriptionText: 'Senior candidates welcome. Remote role using React and TypeScript.',
      }),
    );
    expect(unknown.seniorityMatch.matched).toBeNull();
    expect(unknown.eligible).toBe(true);
  });

  it('keeps international remote discoverable while rejecting explicit incompatible work models', () => {
    expect(
      evaluateJob(
        profile,
        job({ location: 'New York', descriptionText: 'Remote role using React and TypeScript.' }),
      ).eligible,
    ).toBe(true);
    expect(
      evaluateJob(
        profile,
        job({
          location: 'Sao Paulo',
          descriptionText: 'Onsite position using React and TypeScript.',
        }),
      ).eligible,
    ).toBe(false);
    const neutral = evaluateJob(
      profile,
      job({ location: null, descriptionText: 'React and TypeScript are used.' }),
    );
    expect(neutral.locationMatch.matched).toBeNull();
    expect(neutral.workModelMatch.matched).toBeNull();
  });

  it('does not mistake a remote-team reference for an explicit work model', () => {
    const result = evaluateJob(
      profile,
      job({ descriptionText: 'Work with remote teams using React and TypeScript.' }),
    );
    expect(result.workModelMatch.matched).toBeNull();
    expect(result.eligible).toBe(true);
  });

  it('distinguishes warnings from hard work-model rejections', () => {
    const seniorityMismatch = evaluateJob({ ...profile, acceptedSeniorities: ['mid'] }, job());
    expect(seniorityMismatch.eligible).toBe(true);
    expect(seniorityMismatch.reasons).toContainEqual(
      expect.objectContaining({ code: 'seniority', outcome: 'neutral' }),
    );

    const locationMismatch = evaluateJob({ ...profile, locations: ['Rio de Janeiro'] }, job());
    expect(locationMismatch.eligible).toBe(true);
    expect(locationMismatch.reasons).toContainEqual(
      expect.objectContaining({ code: 'location', outcome: 'neutral' }),
    );

    const incompatibleWorkModel = evaluateJob(
      profile,
      job({ descriptionText: 'Onsite position using React and TypeScript.' }),
    );
    expect(incompatibleWorkModel.eligible).toBe(false);
    expect(incompatibleWorkModel.reasons).toContainEqual({
      code: 'work-model',
      outcome: 'fail',
      message: 'Modelo de trabalho incompatível com o perfil.',
    });

    const unknownWorkModel = evaluateJob(
      profile,
      job({ location: null, descriptionText: 'React and TypeScript are used.' }),
    );
    expect(unknownWorkModel.reasons).toContainEqual(
      expect.objectContaining({ code: 'work-model', outcome: 'neutral' }),
    );

    expect(evaluateJob(profile, job()).reasons).toContainEqual(
      expect.objectContaining({ code: 'work-model', outcome: 'pass' }),
    );
  });

  it('sorts eligible results, then score, freshness, title, and id deterministically', () => {
    const eligible = evaluateJob(profile, job());
    const rejected = evaluateJob(profile, job({ id: 'rejected', descriptionText: 'React only.' }));
    const sameScoreOlder = {
      ...eligible,
      job: { ...eligible.job, id: 'older', lastSeenAt: '2026-07-01T00:00:00.000Z' },
    };
    const ordered = sortEvaluations([rejected, sameScoreOlder, eligible]);
    expect(ordered.map((result) => result.job.id)).toEqual(['job-1', 'older', 'rejected']);
  });
});
