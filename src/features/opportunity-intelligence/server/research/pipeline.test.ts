import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const dependencies = vi.hoisted(() => ({
  profile: vi.fn(),
  job: vi.fn(),
  cache: vi.fn(),
  persist: vi.fn(),
  company: vi.fn(),
  evaluate: vi.fn(),
  generateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: dependencies.generateContent };
  },
}));
vi.mock('@/features/profiles/server/candidate-profiles', () => ({
  getCandidateProfileById: dependencies.profile,
}));
vi.mock('@/features/jobs/server/persisted-jobs', () => ({ getPersistedJobById: dependencies.job }));
vi.mock('@/features/companies/server/target-companies', () => ({
  getTargetCompanyById: dependencies.company,
}));
vi.mock('@/features/job-evaluation/evaluate', () => ({ evaluateJob: dependencies.evaluate }));
vi.mock('@/features/opportunity-intelligence/server/dossiers', () => ({
  OpportunityResearchDataError: class OpportunityResearchDataError extends Error {
    constructor(
      public operation: 'cache_read' | 'dossier_persistence' | 'source_persistence' = 'cache_read',
    ) {
      super();
    }
  },
  getLatestResearchDossier: dependencies.cache,
  persistCompletedDossier: dependencies.persist,
}));

import { OpportunityResearchError, researchOpportunity } from './pipeline';

const profile = {
  id: 'p',
  desiredRoles: [],
  acceptedSeniorities: [],
  requiredSkills: [],
  preferredSkills: [],
  acceptedWorkModels: [],
  locations: [],
};
const job = {
  id: 'j',
  targetCompanyId: 'c',
  title: 'Role',
  location: null,
  descriptionText: 'text',
  sourceUpdatedAt: null,
  isActive: true,
};
const evaluation = {
  score: 80,
  eligible: true,
  reasons: [],
  matchedRequiredKeywords: [],
  matchedPreferredKeywords: [],
  seniorityMatch: true,
  workModelMatch: true,
};
const source = {
  title: 'Source',
  url: 'https://example.test/a',
  domain: 'example.test',
  snippet: 'Evidence '.repeat(40),
  score: 1,
  publishedAt: null,
};
const valid = {
  opportunitySummary: 'Summary',
  company: {
    overview: 'Overview',
    categories: [],
    businessModel: 'Model',
    stage: 'Stage',
    publicPrivateStatus: 'Private',
    size: 'Size',
    markets: [],
    engineeringContext: 'Context',
  },
  companyMoment: { knownFacts: [], recentDevelopments: [], inferences: [], unknowns: [] },
  compensation: {
    observations: [],
    estimatedRange: null,
    currencyUnit: null,
    components: [],
    confidence: 'low',
    conflicts: [],
    unknowns: [],
  },
  hiringProcess: {
    officialKnownStages: [],
    anecdotalReportedStages: [],
    likelyExpectations: [],
    confidence: 'low',
  },
  preparation: {
    mustReview: [],
    shouldReview: [],
    optional: [],
    behavioral: [],
    companyKnowledge: [],
  },
  candidateFit: { alreadyStrong: [], refresh: [], realGaps: [], unknowns: [] },
  careerImpact: Object.fromEntries(
    [
      'technicalGrowth',
      'leadershipExposure',
      'aiExposure',
      'productExposure',
      'internationalExposure',
      'compensationUpside',
      'roleScopeRisk',
    ].map((key) => [key, { level: 'unknown', explanation: 'Unknown' }]),
  ),
  applicationPositioning: { emphasize: [], storiesToPrepare: [], evidenceToQuantify: [] },
  questionsToInvestigate: [],
  citations: [],
  researchTimestamp: '2026-08-12T12:00:00.000Z',
};

describe('opportunity research observability boundary', () => {
  const originalEnv = process.env;
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      TAVILY_API_KEY: 'tavily-test-secret',
      GEMINI_API_KEY: 'gemini-test-secret',
    };
    vi.clearAllMocks();
    dependencies.profile.mockResolvedValue(profile);
    dependencies.job.mockResolvedValue(job);
    dependencies.cache.mockResolvedValue(null);
    dependencies.company.mockResolvedValue({ name: 'Acme' });
    dependencies.evaluate.mockReturnValue(evaluation);
    dependencies.generateContent.mockResolvedValue({ text: JSON.stringify(valid) });
    dependencies.persist.mockResolvedValue({ id: 'dossier' });
  });

  it('classifies missing Tavily configuration without exposing the credential', async () => {
    delete process.env.TAVILY_API_KEY;
    await expect(
      researchOpportunity('p', 'j', { search: vi.fn(), extract: vi.fn() }, 'exec-config'),
    ).rejects.toMatchObject({ classification: 'tavily_configuration' });
    const logs = [...info.mock.calls, ...error.mock.calls].flat().join(' ');
    expect(logs).toContain('"execution":"exec-config"');
    expect(logs).toContain('"classification":"tavily_configuration"');
    expect(logs).not.toContain('tavily-test-secret');
    expect(logs).not.toContain('gemini-test-secret');
  });

  it('distinguishes Tavily failures from Gemini failures', async () => {
    await expect(
      researchOpportunity(
        'p',
        'j',
        { search: vi.fn().mockRejectedValue(new Error('network')), extract: vi.fn() },
        'exec-tavily',
      ),
    ).rejects.toMatchObject({ classification: 'tavily_network' });
    dependencies.generateContent.mockRejectedValueOnce(new Error('network'));
    await expect(
      researchOpportunity(
        'p',
        'j',
        { search: vi.fn().mockResolvedValue([source]), extract: vi.fn().mockResolvedValue([]) },
        'exec-gemini',
      ),
    ).rejects.toMatchObject({ classification: 'gemini_network' });
    const logs = error.mock.calls.flat().join(' ');
    expect(logs).toContain('tavily_network');
  });

  it('classifies source persistence and preserves a safe error boundary', async () => {
    const DataError = (await import('@/features/opportunity-intelligence/server/dossiers'))
      .OpportunityResearchDataError;
    dependencies.persist.mockRejectedValue(new DataError('source_persistence'));
    await expect(
      researchOpportunity(
        'p',
        'j',
        { search: vi.fn().mockResolvedValue([source]), extract: vi.fn().mockResolvedValue([]) },
        'exec-persist',
      ),
    ).rejects.toEqual(expect.any(OpportunityResearchError));
    await expect(
      researchOpportunity(
        'p',
        'j',
        { search: vi.fn().mockResolvedValue([source]), extract: vi.fn().mockResolvedValue([]) },
        'exec-persist-2',
      ),
    ).rejects.toMatchObject({ classification: 'source_persistence' });
    expect(error.mock.calls.flat().join(' ')).toContain('source_persistence');
  });

  it('logs only safe Zod metadata for dossier validation failures', async () => {
    dependencies.generateContent.mockResolvedValue({
      text: JSON.stringify({
        ...valid,
        compensation: { ...valid.compensation, confidence: 'média' },
      }),
    });
    await expect(
      researchOpportunity(
        'p',
        'j',
        { search: vi.fn().mockResolvedValue([source]), extract: vi.fn().mockResolvedValue([]) },
        'exec-dossier-validation',
      ),
    ).rejects.toMatchObject({ classification: 'dossier_validation' });
    const logs = error.mock.calls.flat().join(' ');
    expect(logs).toContain('"path":"compensation.confidence"');
    expect(logs).toContain('"code":"invalid_value"');
    expect(logs).not.toContain('média');
    expect(logs).not.toContain('tavily-test-secret');
    expect(logs).not.toContain('gemini-test-secret');
  });
});
