import { beforeEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  profile: vi.fn(),
  jobs: vi.fn(),
  companies: vi.fn(),
  from: vi.fn(),
  gemini: vi.fn(),
  evaluate: vi.fn(),
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
vi.mock('@/features/job-evaluation/evaluate', () => ({ evaluateJob: dependencies.evaluate }));

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
    dependencies.evaluate.mockReset();
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
  it('uses only deterministically eligible jobs for the relevant scope', async () => {
    const jobs = [
      {
        id: 'eligible-job',
        targetCompanyId: 'company',
        title: 'Frontend Engineer',
        location: null,
        descriptionText: null,
        departments: [],
        offices: [],
        provider: 'greenhouse',
        firstSeenAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'rejected-job',
        targetCompanyId: 'company',
        title: 'Sales Executive',
        location: null,
        descriptionText: null,
        departments: [],
        offices: [],
        provider: 'greenhouse',
        firstSeenAt: '2026-08-01T00:00:00.000Z',
      },
    ];
    dependencies.jobs.mockResolvedValue(jobs);
    dependencies.evaluate.mockImplementation((_profile: unknown, job: { id: string }) => ({
      eligible: job.id === 'eligible-job',
    }));

    await expect(loadJobInsights(profile.id, 'all', 'all')).resolves.toMatchObject({
      sampleSize: 2,
    });
    await expect(loadJobInsights(profile.id, 'all', 'relevant')).resolves.toMatchObject({
      sampleSize: 1,
    });
    expect(dependencies.evaluate).toHaveBeenCalledTimes(2);
    expect(dependencies.gemini).not.toHaveBeenCalled();
  });
});
