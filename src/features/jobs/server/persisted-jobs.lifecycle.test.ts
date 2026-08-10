import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PersistedJob } from '@/types/domain';

type Update = { id: string; values: Record<string, unknown> };

const database = vi.hoisted(() => ({
  jobs: [] as PersistedJob[],
  updates: [] as Update[],
  inserts: 0,
}));

vi.mock('server-only', () => ({}));
vi.mock('@/features/profiles/server/supabase', () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      select: () => ({
        eq: () =>
          Promise.resolve({
            data: database.jobs.map((job) => ({
              id: job.id,
              provider: job.provider,
              target_company_id: job.targetCompanyId,
              external_id: job.externalId,
              title: job.title,
              location: job.location,
              description_text: job.descriptionText,
              original_url: job.originalUrl,
              source_updated_at: job.sourceUpdatedAt,
              language: job.language,
              departments: job.departments,
              offices: job.offices,
              first_seen_at: job.firstSeenAt,
              last_seen_at: job.lastSeenAt,
              created_at: job.createdAt,
              updated_at: job.updatedAt,
              is_active: job.isActive,
              missing_successful_runs: job.missingSuccessfulRuns,
              closed_at: job.closedAt,
            })),
            error: null,
          }),
      }),
      update: (values: Record<string, unknown>) => ({
        eq: (_column: string, id: string) => {
          database.updates.push({ id, values });
          return {
            select: () => ({
              single: async () => ({ data: { id }, error: null }),
            }),
          };
        },
      }),
      insert: () => {
        database.inserts += 1;
        return {
          select: () => ({
            single: async () => ({ data: { id: 'new-job' }, error: null }),
          }),
        };
      },
    }),
  }),
}));

import { persistCollectedJobs } from './persisted-jobs';

const existingJob = (missingSuccessfulRuns = 0, isActive = true): PersistedJob => ({
  id: 'job-1',
  provider: 'greenhouse',
  targetCompanyId: 'company-1',
  externalId: 'external-1',
  title: 'Role',
  location: null,
  descriptionText: null,
  originalUrl: 'https://example.com/job',
  sourceUpdatedAt: null,
  language: null,
  departments: [],
  offices: [],
  firstSeenAt: '2026-08-01T00:00:00.000Z',
  lastSeenAt: '2026-08-02T00:00:00.000Z',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
  isActive,
  missingSuccessfulRuns,
  closedAt: isActive ? null : '2026-08-03T00:00:00.000Z',
});

const preview = {
  externalId: 'external-1',
  provider: 'greenhouse' as const,
  companyId: 'company-1',
  companyName: 'Company',
  title: 'Role',
  location: null,
  descriptionText: null,
  originalUrl: 'https://example.com/job',
  sourceUpdatedAt: null,
  language: null,
  departments: [],
  offices: [],
};

describe('persistCollectedJobs lifecycle persistence', () => {
  beforeEach(() => {
    database.jobs = [];
    database.updates = [];
    database.inserts = 0;
  });

  it('keeps a seen active job active and resets its absence state', async () => {
    database.jobs = [existingJob(2)];

    const result = await persistCollectedJobs(
      'company-1',
      [preview],
      0,
      '2026-08-10T00:00:00.000Z',
    );

    expect(result).toMatchObject({ created: 0, unchanged: 1 });
    expect(database.inserts).toBe(0);
    expect(database.updates).toHaveLength(1);
    expect(database.updates[0]).toMatchObject({
      id: 'job-1',
      values: { is_active: true, missing_successful_runs: 0, closed_at: null },
    });
    expect(database.updates[0].values).toMatchObject({
      last_seen_at: expect.not.stringMatching(/^2026-08-02/),
    });
    expect(database.updates[0].values).not.toHaveProperty('first_seen_at');
  });

  it.each([
    [0, 1, true],
    [1, 2, true],
    [2, 3, false],
  ])(
    'records successful absence %i as count %i and active=%s',
    async (previousCount, expectedCount, isActive) => {
      database.jobs = [existingJob(previousCount)];

      await persistCollectedJobs('company-1', [], 0, '2026-08-10T00:00:00.000Z');

      expect(database.updates).toHaveLength(1);
      expect(database.updates[0]).toMatchObject({
        id: 'job-1',
        values: {
          missing_successful_runs: expectedCount,
          is_active: isActive,
        },
      });
      expect(database.updates[0].values.closed_at).toEqual(
        expectedCount === 3 ? expect.any(String) : null,
      );
    },
  );

  it('reactivates a closed job with the same source identity without inserting a duplicate', async () => {
    database.jobs = [existingJob(3, false)];

    const result = await persistCollectedJobs(
      'company-1',
      [preview],
      0,
      '2026-08-10T00:00:00.000Z',
    );

    expect(result).toMatchObject({ created: 0, unchanged: 1 });
    expect(database.inserts).toBe(0);
    expect(database.updates[0]).toMatchObject({
      id: 'job-1',
      values: { is_active: true, missing_successful_runs: 0, closed_at: null },
    });
    expect(database.updates[0].values).not.toHaveProperty('first_seen_at');
    expect(database.updates[0].values.last_seen_at).not.toBe('2026-08-02T00:00:00.000Z');
  });

  it('keeps a repeated unchanged collection idempotent and restores the active lifecycle state', async () => {
    database.jobs = [existingJob(0)];

    const result = await persistCollectedJobs(
      'company-1',
      [preview, preview],
      0,
      '2026-08-10T00:00:00.000Z',
    );

    expect(result).toMatchObject({ created: 0, unchanged: 1, skipped: 1 });
    expect(database.inserts).toBe(0);
    expect(database.updates).toHaveLength(1);
    expect(database.updates[0].values).toMatchObject({
      is_active: true,
      missing_successful_runs: 0,
      closed_at: null,
    });
  });
});
