import { describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({ jobs: vi.fn(), companies: vi.fn(), statuses: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/features/jobs/server/persisted-jobs', () => ({ listPersistedJobs: dependencies.jobs }));
vi.mock('@/features/companies/server/target-companies', () => ({
  listTargetCompanies: dependencies.companies,
}));
vi.mock('@/features/job-actions/server/job-statuses', () => ({
  listStatusesForJobs: dependencies.statuses,
}));
import { MatchingDiagnosticsDataError, loadMatchingDiagnostics } from './load-matching-diagnostics';

const profile = {
  id: 'p1',
  name: 'Maria',
  desiredRoles: [],
  acceptedSeniorities: [],
  requiredSkills: [],
  preferredSkills: [],
  excludedSkills: [],
  acceptedWorkModels: [],
  locations: [],
};
describe('loadMatchingDiagnostics', () => {
  it('uses one batched jobs read, one companies read, and one decisions read with no write dependency', async () => {
    dependencies.jobs.mockResolvedValue([]);
    dependencies.companies.mockResolvedValue([]);
    dependencies.statuses.mockResolvedValue({});
    const diagnostics = await loadMatchingDiagnostics(profile);
    expect(diagnostics.queryCount).toBe(3);
    expect(dependencies.jobs).toHaveBeenCalledTimes(1);
    expect(dependencies.companies).toHaveBeenCalledTimes(1);
    expect(dependencies.statuses).toHaveBeenCalledTimes(1);
    expect(dependencies.statuses).toHaveBeenCalledWith('p1', []);
  });
  it('returns a controlled error when a repository fails', async () => {
    dependencies.jobs.mockRejectedValue(new Error('provider details must not escape'));
    dependencies.companies.mockResolvedValue([]);
    await expect(loadMatchingDiagnostics(profile)).rejects.toBeInstanceOf(
      MatchingDiagnosticsDataError,
    );
  });
});
