import { beforeEach, describe, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => ({
  jobs: vi.fn(),
  profiles: vi.fn(),
  statuses: vi.fn(),
  evaluate: vi.fn(),
  upsert: vi.fn(),
  from: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/features/jobs/server/persisted-jobs', () => ({ listPersistedJobsByIds: deps.jobs }));
vi.mock('@/features/profiles/server/candidate-profiles', () => ({
  listCandidateProfiles: deps.profiles,
}));
vi.mock('@/features/job-actions/server/job-statuses', () => ({
  listStatusesForJobs: deps.statuses,
}));
vi.mock('@/features/job-evaluation/evaluate', () => ({ evaluateJob: deps.evaluate }));
vi.mock('@/features/profiles/server/supabase', () => ({
  getSupabaseServerClient: () => ({ from: deps.from }),
}));

import {
  claimJobNotificationEventDelivery,
  createNewEligibleJobNotificationEvents,
} from './job-notification-events';
import { priorityForDeterministicScore } from '@/features/job-notifications/types';

const job = { id: 'job-1', isActive: true, title: 'Frontend Engineer' };
const eligible = { eligible: true, score: 80 };
describe('createNewEligibleJobNotificationEvents', () => {
  beforeEach(() => {
    deps.jobs.mockReset().mockResolvedValue([job]);
    deps.profiles.mockReset().mockResolvedValue([{ id: 'profile-a' }]);
    deps.statuses.mockReset().mockResolvedValue({});
    deps.evaluate.mockReset().mockReturnValue(eligible);
    deps.upsert.mockReset().mockResolvedValue({ error: null });
    deps.from.mockReset().mockReturnValue({ upsert: deps.upsert });
  });
  it('creates one pending event for a newly created eligible job', async () => {
    await expect(createNewEligibleJobNotificationEvents(['job-1'])).resolves.toMatchObject({
      pending: 1,
    });
    expect(deps.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_id: 'profile-a',
        job_id: 'job-1',
        status: 'pending',
        priority: 'excellent',
      }),
      expect.objectContaining({
        onConflict: 'profile_id,job_id,event_type',
        ignoreDuplicates: true,
      }),
    );
  });
  it('does not create events for deterministically rejected jobs', async () => {
    deps.evaluate.mockReturnValue({ eligible: false, score: 20 });
    await expect(createNewEligibleJobNotificationEvents(['job-1'])).resolves.toMatchObject({
      eligible: 0,
    });
    expect(deps.upsert).not.toHaveBeenCalled();
  });
  it('uses one profile-scoped event per eligible profile and database conflict deduplication', async () => {
    deps.profiles.mockResolvedValue([{ id: 'profile-a' }, { id: 'profile-b' }]);
    await createNewEligibleJobNotificationEvents(['job-1', 'job-1']);
    expect(deps.jobs).toHaveBeenCalledWith(['job-1']);
    expect(deps.upsert).toHaveBeenCalledTimes(2);
    expect(deps.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ profile_id: 'profile-b' }),
      expect.anything(),
    );
  });
  it.each(['ignored', 'rejected', 'saved', 'applied'])(
    'records an already decided %s job as skipped',
    async (status) => {
      deps.statuses.mockResolvedValue({ 'job-1': status });
      await expect(createNewEligibleJobNotificationEvents(['job-1'])).resolves.toMatchObject({
        skipped: 1,
        pending: 0,
      });
      expect(deps.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'skipped' }),
        expect.anything(),
      );
    },
  );
  it('classifies priority solely from deterministic score', () => {
    expect(priorityForDeterministicScore(80)).toBe('excellent');
    expect(priorityForDeterministicScore(70)).toBe('good');
    expect(priorityForDeterministicScore(69)).toBe('review');
  });
  it('claims a pending event atomically before provider delivery', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'event-1',
        profile_id: 'profile-a',
        job_id: 'job-1',
        event_type: 'new_eligible_job',
        status: 'pending',
        priority: 'excellent',
        deterministic_score: 80,
        channel: 'telegram',
        attempt_count: 1,
        last_attempt_at: '2026-08-11T00:00:00.000Z',
        delivered_at: null,
        error_classification: null,
        created_at: '2026-08-10T00:00:00.000Z',
      },
      error: null,
    });
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.select = vi.fn().mockReturnValue({ maybeSingle });
    chain.is = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    const update = vi.fn().mockReturnValue(chain);
    deps.from.mockReturnValue({ update });
    await expect(
      claimJobNotificationEventDelivery({ id: 'event-1', attemptCount: 0, lastAttemptAt: null }),
    ).resolves.toMatchObject({ attemptCount: 1, channel: 'telegram' });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ attempt_count: 1 }));
    expect(chain.is).toHaveBeenCalledWith('last_attempt_at', null);
  });
});
