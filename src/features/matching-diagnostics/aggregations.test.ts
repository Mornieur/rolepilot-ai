import { describe, expect, it } from 'vitest';
import type { CandidateProfile, PersistedJob } from '@/types/domain';
import { buildMatchingDiagnostics } from './aggregations';

const profile: CandidateProfile = {
  id: 'p1',
  name: 'Maria',
  desiredRoles: ['Frontend Engineer'],
  acceptedSeniorities: ['senior'],
  requiredSkills: ['React', 'TypeScript'],
  preferredSkills: ['Next.js'],
  excludedSkills: ['Java'],
  acceptedWorkModels: ['remote'],
  locations: ['Brazil'],
};
const job = (
  id: string,
  title: string,
  descriptionText: string,
  overrides: Partial<PersistedJob> = {},
): PersistedJob => ({
  id,
  provider: 'greenhouse',
  targetCompanyId: id === 'one' ? 'acme' : 'beta',
  externalId: id,
  title,
  location: 'Brazil remote',
  descriptionText,
  originalUrl: `https://example.test/${id}`,
  sourceUpdatedAt: null,
  language: null,
  departments: [],
  offices: [],
  firstSeenAt: '2026-08-01T00:00:00Z',
  lastSeenAt: '2026-08-02T00:00:00Z',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-02T00:00:00Z',
  ...overrides,
});

describe('matching diagnostics aggregations', () => {
  const result = () =>
    buildMatchingDiagnostics({
      profile,
      jobs: [
        job('one', 'Senior Frontend Engineer', 'React TypeScript Next.js remote'),
        job('two', 'Software Engineer', 'React TypeScript frontend remote'),
        job('three', 'Backend Engineer', 'React remote'),
        job('four', 'Frontend Engineer', 'React TypeScript hybrid', { location: 'Brazil' }),
        job('five', 'Frontend Platform Engineer', 'React TypeScript hybrid', {
          location: 'Brazil',
        }),
        job('six', 'Sales Solution Engineer', 'React TypeScript remote'),
      ],
      companyNames: new Map([
        ['acme', 'Acme'],
        ['beta', 'Beta'],
      ]),
      statuses: { one: 'saved', two: 'ignored', three: 'applied', four: 'rejected' },
    });
  it('summarizes jobs, hard-rejection reasons, warnings, and score buckets without changing matcher output', () => {
    const diagnostics = result();
    expect(diagnostics.jobs).toMatchObject({
      total: 6,
      active: 6,
      inactive: 0,
      eligible: 2,
      rejected: 4,
    });
    expect(
      diagnostics.rejectionReasons.find((item) => item.label === 'Cargo incompatível')?.count,
    ).toBe(2);
    expect(
      diagnostics.rejectionReasons.find((item) => item.label === 'Modelo de trabalho incompatível')
        ?.count,
    ).toBe(2);
    expect(
      diagnostics.warnings.find((item) => item.label === 'Cobertura parcial de skills obrigatórias')
        ?.count,
    ).toBe(1);
    expect(diagnostics.scoreBuckets.reduce((total, item) => total + item.count, 0)).toBe(6);
  });
  it('keeps deterministic ordering bounded and exposes one-hard-rule and suspicious candidates', () => {
    const diagnostics = result();
    expect(diagnostics.topEligible.map((item) => item.job.id)).toEqual(['one', 'two']);
    expect(diagnostics.borderlineRejected).toHaveLength(4);
    expect(
      diagnostics.borderlineRejected
        .filter((item) => item.exactlyOneHardRule)
        .map((item) => item.job.id),
    ).toContain('three');
    expect(diagnostics.falseNegatives.map((item) => item.job.id)).toContain('five');
    expect(diagnostics.falseNegatives.map((item) => item.job.id)).not.toContain('six');
  });
  it('compares profile-isolated explicit decisions and handles an empty dataset', () => {
    const diagnostics = result();
    expect(diagnostics.decisions).toMatchObject({
      saved: 1,
      applied: 1,
      ignored: 1,
      rejected: 1,
      new: 2,
    });
    expect(diagnostics.crossCheck).toMatchObject({
      'eligible-saved': 1,
      'eligible-ignored': 1,
      'rejected-applied': 1,
    });
    const empty = buildMatchingDiagnostics({
      profile,
      jobs: [],
      companyNames: new Map(),
      statuses: {},
    });
    expect(empty.jobs.total).toBe(0);
    expect(empty.eligibleRate).toBe(0);
    expect(empty.topEligible).toEqual([]);
  });
});
