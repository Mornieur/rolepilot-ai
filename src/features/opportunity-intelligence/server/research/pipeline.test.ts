import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const d = vi.hoisted(() => ({
  profile: vi.fn(),
  job: vi.fn(),
  cache: vi.fn(),
  persist: vi.fn(),
  company: vi.fn(),
  evaluate: vi.fn(),
  generate: vi.fn(),
}));
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: d.generate };
  },
}));
vi.mock('@/features/profiles/server/candidate-profiles', () => ({
  getCandidateProfileById: d.profile,
}));
vi.mock('@/features/jobs/server/persisted-jobs', () => ({ getPersistedJobById: d.job }));
vi.mock('@/features/companies/server/target-companies', () => ({
  getTargetCompanyById: d.company,
}));
vi.mock('@/features/job-evaluation/evaluate', () => ({ evaluateJob: d.evaluate }));
vi.mock('@/features/opportunity-intelligence/server/dossiers', () => ({
  getLatestResearchDossier: d.cache,
  persistCompletedDossier: d.persist,
  OpportunityResearchDataError: class extends Error {},
}));
import { researchOpportunity } from './pipeline';

const source = {
  title: 'Source',
  url: 'https://example.test/a',
  domain: 'example.test',
  snippet: 'Evidence '.repeat(40),
  score: 1,
  publishedAt: null,
};
const companyIntelligence = {
  opportunitySummary: 'Summary.',
  company: { findings: [], unknowns: [] },
  companyMoment: { facts: [], inferences: [], unknowns: [] },
  compensation: {
    findings: [],
    estimatedRange: null,
    currencyUnit: null,
    components: [],
    confidence: 'low',
    unknowns: [],
  },
  hiringProcess: { official: [], anecdotal: [], likely: [], confidence: 'low' },
  citations: [],
};
const candidateIntelligence = {
  preparation: { technical: [], behavioral: [], company: [] },
  candidateFit: { strengths: [], refresh: [], gaps: [], unknowns: [] },
  careerImpact: [],
  applicationPositioning: { emphasize: [], stories: [], evidence: [] },
  questionsToInvestigate: [],
  citations: [],
};
describe('opportunity research Gemini boundary', () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TAVILY_API_KEY = 'test';
    process.env.GEMINI_API_KEY = 'test';
    d.profile.mockResolvedValue({
      desiredRoles: [],
      acceptedSeniorities: [],
      requiredSkills: [],
      preferredSkills: [],
      acceptedWorkModels: [],
      locations: [],
    });
    d.job.mockResolvedValue({
      targetCompanyId: 'c',
      title: 'Role',
      location: null,
      descriptionText: 'text',
      sourceUpdatedAt: null,
      isActive: true,
    });
    d.cache.mockResolvedValue(null);
    d.company.mockResolvedValue({ name: 'Acme' });
    d.evaluate.mockReturnValue({
      score: 80,
      eligible: true,
      reasons: [],
      matchedRequiredKeywords: [],
      matchedPreferredKeywords: [],
      seniorityMatch: true,
      workModelMatch: true,
    });
    d.generate
      .mockResolvedValueOnce({ text: JSON.stringify(companyIntelligence) })
      .mockResolvedValueOnce({ text: JSON.stringify(candidateIntelligence) });
    d.persist.mockResolvedValue({ id: 'dossier' });
  });
  it('logs provider DTO/schema metadata without schema or credentials', async () => {
    await researchOpportunity(
      'p',
      'j',
      { search: vi.fn().mockResolvedValue([source]), extract: vi.fn().mockResolvedValue([]) },
      'execution',
    );
    const logged = info.mock.calls.flat().join(' ');
    expect(logged).toContain('provider_schema_version');
    expect(logged).toContain('schema_bytes');
    expect(logged).toContain('gemini_company');
    expect(logged).toContain('gemini_candidate');
    expect(d.generate).toHaveBeenCalledTimes(2);
  });

  it('does not call candidate or persist when company synthesis fails', async () => {
    d.generate.mockReset();
    d.generate.mockRejectedValue({ status: 400, message: '{}' });
    await expect(
      researchOpportunity(
        'p',
        'j',
        { search: vi.fn().mockResolvedValue([source]), extract: vi.fn().mockResolvedValue([]) },
        'execution',
      ),
    ).rejects.toMatchObject({ classification: 'gemini_http' });
    expect(d.generate).toHaveBeenCalledTimes(1);
    expect(d.persist).not.toHaveBeenCalled();
  });

  it('does not persist partial company output when candidate synthesis fails', async () => {
    d.generate.mockReset();
    d.generate
      .mockResolvedValueOnce({ text: JSON.stringify(companyIntelligence) })
      .mockRejectedValue({ status: 400, message: '{}' });
    await expect(
      researchOpportunity(
        'p',
        'j',
        { search: vi.fn().mockResolvedValue([source]), extract: vi.fn().mockResolvedValue([]) },
        'execution',
      ),
    ).rejects.toMatchObject({ classification: 'gemini_http' });
    expect(d.persist).not.toHaveBeenCalled();
  });

  it('retries one transient 503 once but never retries HTTP 400', async () => {
    d.generate.mockReset();
    d.generate
      .mockRejectedValueOnce({ status: 503, message: '{}' })
      .mockResolvedValueOnce({ text: JSON.stringify(companyIntelligence) })
      .mockResolvedValueOnce({ text: JSON.stringify(candidateIntelligence) });
    await researchOpportunity(
      'p',
      'j',
      { search: vi.fn().mockResolvedValue([source]), extract: vi.fn().mockResolvedValue([]) },
      'execution',
    );
    expect(d.generate).toHaveBeenCalledTimes(3);
  });
});
