import { describe, expect, it } from 'vitest';
import { buildJobInsights } from './aggregations';
import type { CandidateProfile, PersistedJob } from '@/types/domain';

const profile: CandidateProfile = {
  id: 'p1',
  name: 'Maria',
  desiredRoles: ['Engineer'],
  acceptedSeniorities: ['senior'],
  requiredSkills: ['React'],
  preferredSkills: ['TypeScript'],
  excludedSkills: [],
  acceptedWorkModels: ['remote'],
  locations: ['Brazil'],
};
const job = (id: string, firstSeenAt = '2026-08-01T00:00:00Z'): PersistedJob => ({
  id,
  provider: 'greenhouse',
  targetCompanyId: id === 'a' ? 'c1' : 'c2',
  externalId: id,
  title: id === 'a' ? 'Senior React Engineer' : 'Product Engineer',
  location: 'São Paulo',
  descriptionText: 'Remote TypeScript role',
  originalUrl: 'https://example.test',
  sourceUpdatedAt: null,
  language: null,
  departments: [],
  offices: [],
  firstSeenAt,
  lastSeenAt: firstSeenAt,
  createdAt: firstSeenAt,
  updatedAt: firstSeenAt,
});
const input = (overrides: Partial<Parameters<typeof buildJobInsights>[0]> = {}) => ({
  profile,
  period: 'all' as const,
  jobs: [job('a'), job('b')],
  companies: new Map([
    ['c1', 'Acme'],
    ['c2', 'Beta'],
  ]),
  statuses: [
    { profileId: 'p1', jobId: 'a', status: 'saved' as const },
    { profileId: 'other', jobId: 'a', status: 'ignored' as const },
  ],
  now: new Date('2026-08-06T00:00:00Z'),
  ...overrides,
});
describe('job insights aggregations', () => {
  it('isolates decisions by profile and treats absence as new', () => {
    const result = buildJobInsights(input());
    expect(result.statuses).toMatchObject({ saved: 1, ignored: 0, new: 1 });
    expect(result.saveRate).toBe(1);
  });
  it('filters from the inclusive period boundary and handles empty samples', () => {
    expect(
      buildJobInsights(input({ period: '7d', jobs: [job('a', '2026-07-30T00:00:00Z')] }))
        .sampleSize,
    ).toBe(1);
    expect(buildJobInsights(input({ jobs: [] })).sampleSize).toBe(0);
  });
  it('normalizes accents, ranks deterministic ties, and never divides by zero', () => {
    const result = buildJobInsights(input({ statuses: [] }));
    expect(result.locations[0]).toEqual({ label: 'São Paulo', count: 2 });
    expect(result.companies.map((item) => item.label)).toEqual(['Acme', 'Beta']);
    expect(result.applicationRate).toBe(0);
    expect(result.profileTerms.found.map((item) => item.label)).toContain('React');
  });
});
