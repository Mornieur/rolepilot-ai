import { describe, expect, it } from 'vitest';
import { buildInboxOpportunities, priorityForScore, summarizeInbox, whyMatches } from './inbox';
import type { CandidateProfile, PersistedJob } from '@/types/domain';

const profile: CandidateProfile = {
  id: 'profile',
  name: 'Maria',
  desiredRoles: ['Frontend Engineer'],
  acceptedSeniorities: ['senior'],
  requiredSkills: ['React', 'TypeScript'],
  preferredSkills: ['GraphQL'],
  excludedSkills: [],
  acceptedWorkModels: ['remote'],
  locations: ['Remote'],
};
const job = (id: string, title: string, firstSeenAt: string, options: Partial<PersistedJob> = {}) =>
  ({
    id,
    provider: 'greenhouse',
    targetCompanyId: 'company',
    externalId: id,
    title,
    location: 'Remote',
    descriptionText: 'React TypeScript GraphQL remote',
    originalUrl: 'https://jobs.example/' + id,
    sourceUpdatedAt: null,
    language: 'en',
    departments: [],
    offices: [],
    firstSeenAt,
    lastSeenAt: firstSeenAt,
    createdAt: firstSeenAt,
    updatedAt: firstSeenAt,
    isActive: true,
    ...options,
  }) as PersistedJob;

describe('Opportunity Inbox semantics', () => {
  it('includes only active deterministic-eligible jobs and uses the profile decision map', () => {
    const opportunities = buildInboxOpportunities({
      profile,
      jobs: [
        job('eligible', 'Senior Frontend Engineer', '2026-08-11T10:00:00Z'),
        job('inactive', 'Senior Frontend Engineer', '2026-08-11T11:00:00Z', { isActive: false }),
        job('rejected', 'Sales Executive', '2026-08-11T12:00:00Z'),
      ],
      companyNames: new Map([['company', 'Acme']]),
      statuses: { eligible: 'saved' },
      now: new Date('2026-08-11T12:00:00Z'),
    });
    expect(opportunities).toHaveLength(1);
    expect(opportunities[0]).toMatchObject({
      decision: 'saved',
      companyName: 'Acme',
      priority: 'excellent',
      isNew: true,
    });
  });
  it('sorts priority groups, then newest discovery, title, and id deterministically', () => {
    const opportunities = buildInboxOpportunities({
      profile,
      jobs: [
        job('old', 'Senior Frontend Engineer', '2026-08-10T10:00:00Z'),
        job('new', 'Senior Frontend Engineer', '2026-08-11T10:00:00Z'),
      ],
      companyNames: new Map(),
      statuses: {},
      now: new Date('2026-08-11T12:00:00Z'),
    });
    expect(opportunities.map((opportunity) => opportunity.job.id)).toEqual(['new', 'old']);
    expect(priorityForScore(80)).toBe('excellent');
    expect(priorityForScore(70)).toBe('good');
    expect(priorityForScore(69)).toBe('review');
  });
  it('counts recent opportunities in the new summary independently from decision state', () => {
    const opportunities = buildInboxOpportunities({
      profile,
      jobs: [
        job('recent-undecided', 'Senior Frontend Engineer', '2026-08-11T11:00:00Z'),
        job('recent-saved', 'Senior Frontend Engineer', '2026-08-11T10:00:00Z'),
        job('old-undecided', 'Senior Frontend Engineer', '2026-08-10T10:00:00Z'),
      ],
      companyNames: new Map(),
      statuses: { 'recent-saved': 'saved' },
      now: new Date('2026-08-11T12:00:00Z'),
    });
    expect(summarizeInbox(opportunities)).toEqual({
      compatible: 3,
      new: 2,
      saved: 1,
      excellent: 3,
    });
    expect(
      opportunities.find((opportunity) => opportunity.job.id === 'old-undecided'),
    ).toMatchObject({
      decision: 'new',
      isNew: false,
    });
  });
  it('builds explanations strictly from deterministic evidence', () => {
    const opportunities = buildInboxOpportunities({
      profile,
      jobs: [job('one', 'Senior Frontend Engineer', '2026-08-11T11:00:00Z')],
      companyNames: new Map(),
      statuses: {},
      now: new Date('2026-08-11T12:00:00Z'),
    });
    expect(whyMatches(opportunities[0])).toContain('react, typescript');
    expect(whyMatches(opportunities[0])).toContain('senioridade próxima ao perfil');
  });
});
