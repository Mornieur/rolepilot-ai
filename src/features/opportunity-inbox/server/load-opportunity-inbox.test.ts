import { beforeEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  jobs: vi.fn(),
  companies: vi.fn(),
  statuses: vi.fn(),
  gemini: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/features/jobs/server/persisted-jobs', () => ({ listPersistedJobs: dependencies.jobs }));
vi.mock('@/features/companies/server/target-companies', () => ({
  listTargetCompanies: dependencies.companies,
}));
vi.mock('@/features/job-actions/server/job-statuses', () => ({
  listStatusesForJobs: dependencies.statuses,
}));
vi.mock('@google/genai', () => ({ GoogleGenAI: dependencies.gemini }));
import { loadOpportunityInbox } from './load-opportunity-inbox';

const profile = {
  id: 'profile',
  name: 'Maria',
  desiredRoles: [],
  acceptedSeniorities: [],
  requiredSkills: [],
  preferredSkills: [],
  excludedSkills: [],
  acceptedWorkModels: [],
  locations: [],
};
describe('loadOpportunityInbox', () => {
  beforeEach(() => {
    dependencies.jobs.mockReset().mockResolvedValue([]);
    dependencies.companies.mockReset().mockResolvedValue([]);
    dependencies.statuses.mockReset().mockResolvedValue({});
    dependencies.gemini.mockReset();
  });
  it('uses batched reads only and never invokes Gemini or writes data', async () => {
    await loadOpportunityInbox(profile);
    expect(dependencies.jobs).toHaveBeenCalledTimes(1);
    expect(dependencies.companies).toHaveBeenCalledTimes(1);
    expect(dependencies.statuses).toHaveBeenCalledWith('profile', []);
    expect(dependencies.gemini).not.toHaveBeenCalled();
  });
});
