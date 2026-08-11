import { describe, expect, it, vi } from 'vitest';

const requireCurrentUser = vi.hoisted(() => vi.fn());
const requireAdmin = vi.hoisted(() => vi.fn());

vi.mock('@/features/auth/server/auth', () => ({ requireCurrentUser, requireAdmin }));
vi.mock('@/features/companies/server/target-companies', () => ({
  getTargetCompanyById: vi.fn(),
  TargetCompanyDataError: class TargetCompanyDataError extends Error {},
}));
vi.mock('@/features/job-sources/greenhouse/client', () => ({ fetchGreenhouseJobs: vi.fn() }));
vi.mock('@/features/job-sources/greenhouse/errors', () => ({
  GreenhouseError: class GreenhouseError extends Error {},
}));
vi.mock('@/features/jobs/server/persisted-jobs', () => ({
  PersistedJobDataError: class PersistedJobDataError extends Error {},
}));
vi.mock('@/features/job-collection/server/run-collection', () => ({ runCollection: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { previewGreenhouseJobsAction, saveGreenhouseJobsAction } from './actions';

describe('Greenhouse manual actions access protection', () => {
  it.each([
    ['preview', previewGreenhouseJobsAction],
    ['save', saveGreenhouseJobsAction],
  ])('does not allow a non-admin to invoke the %s action', async (_, action) => {
    requireCurrentUser.mockResolvedValueOnce({ role: 'user' });
    requireAdmin.mockImplementationOnce(() => {
      throw new Error('admin access denied');
    });

    await expect(action({ status: 'idle' }, new FormData())).rejects.toThrow('admin access denied');
  });
});
