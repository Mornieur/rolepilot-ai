import { beforeEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  profile: vi.fn(),
  jobs: vi.fn(),
  companies: vi.fn(),
  from: vi.fn(),
  gemini: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/features/profiles/server/candidate-profiles', () => ({
  getCandidateProfileById: dependencies.profile,
}));
vi.mock('@/features/jobs/server/persisted-jobs', () => ({ listPersistedJobs: dependencies.jobs }));
vi.mock('@/features/companies/server/target-companies', () => ({
  listTargetCompanies: dependencies.companies,
}));
vi.mock('@/features/profiles/server/supabase', () => ({
  getSupabaseServerClient: () => ({ from: dependencies.from }),
}));
vi.mock('@google/genai', () => ({ GoogleGenAI: dependencies.gemini }));

import { JobInsightsDataError, loadJobInsights } from './load-job-insights';

const profile = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Maria',
  desiredRoles: [],
  acceptedSeniorities: ['senior'],
  requiredSkills: [],
  preferredSkills: [],
  excludedSkills: [],
  acceptedWorkModels: ['remote'],
  locations: ['Brazil'],
};

describe('loadJobInsights', () => {
  beforeEach(() => {
    dependencies.profile.mockReset().mockResolvedValue(profile);
    dependencies.jobs.mockReset().mockResolvedValue([]);
    dependencies.companies.mockReset().mockResolvedValue([]);
    dependencies.from
      .mockReset()
      .mockReturnValue({ select: () => ({ eq: async () => ({ data: [], error: null }) }) });
  });
  it('loads persisted sources with one selected-profile status query and no writes or external providers', async () => {
    const result = await loadJobInsights(profile.id, '30d');
    expect(result?.profile.id).toBe(profile.id);
    expect(dependencies.from).toHaveBeenCalledWith('job_user_statuses');
    expect(dependencies.from.mock.results[0].value).not.toHaveProperty('insert');
    expect(dependencies.from.mock.results[0].value).not.toHaveProperty('update');
    expect(dependencies.gemini).not.toHaveBeenCalled();
  });
  it('returns null for a nonexistent profile without opening Supabase', async () => {
    dependencies.profile.mockResolvedValue(null);
    await expect(loadJobInsights(profile.id, 'all')).resolves.toBeNull();
    expect(dependencies.from).not.toHaveBeenCalled();
  });
  it('returns a controlled error when the data boundary fails', async () => {
    dependencies.jobs.mockRejectedValue(new Error('connection failed'));
    await expect(loadJobInsights(profile.id, '7d')).rejects.toBeInstanceOf(JobInsightsDataError);
  });
});
