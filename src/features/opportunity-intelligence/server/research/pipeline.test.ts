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
import { opportunityResearchFingerprint, researchOpportunity } from './pipeline';
import { opportunityResearchContractVersions } from './contract';

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
    expect(d.generate.mock.calls[0]?.[0].config.systemInstruction).toContain('pt-BR');
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

  it('does not replace a prior dossier when a refresh fails before atomic persistence', async () => {
    const previous = {
      id: 'previous-dossier',
      status: 'completed',
      structuredResult: {},
      researchFingerprint: 'expired-fingerprint',
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
      sources: [{}],
    };
    d.cache.mockResolvedValue(previous);
    d.generate.mockReset();
    d.generate
      .mockResolvedValueOnce({ text: JSON.stringify(companyIntelligence) })
      .mockRejectedValue({ status: 400, message: '{}' });

    await expect(
      researchOpportunity(
        'p',
        'j',
        { search: vi.fn().mockResolvedValue([source]), extract: vi.fn().mockResolvedValue([]) },
        'refresh-failure',
      ),
    ).rejects.toMatchObject({ classification: 'gemini_http' });

    expect(d.persist).not.toHaveBeenCalled();
    expect(previous.id).toBe('previous-dossier');
  });

  it('returns a refreshed dossier only after atomic persistence succeeds', async () => {
    const persisted = { id: 'new-dossier', status: 'completed' };
    d.persist.mockResolvedValue(persisted);

    await expect(
      researchOpportunity(
        'p',
        'j',
        { search: vi.fn().mockResolvedValue([source]), extract: vi.fn().mockResolvedValue([]) },
        'refresh-success',
      ),
    ).resolves.toBe(persisted);
    expect(d.persist).toHaveBeenCalledTimes(1);
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

  it('returns a fresh dossier from cache without Tavily or either Gemini subcall', async () => {
    let cached: {
      status: 'completed';
      researchFingerprint: string;
      expiresAt: string;
      sources: unknown[];
    } | null = null;
    d.persist.mockImplementation(async ({ researchFingerprint }) => {
      cached = {
        status: 'completed',
        researchFingerprint,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        sources: [{}],
      };
      return cached;
    });
    const provider = {
      search: vi.fn().mockResolvedValue([source]),
      extract: vi.fn().mockResolvedValue([]),
    };
    await researchOpportunity('p', 'j', provider, 'first');
    d.cache.mockResolvedValue(cached);
    d.generate.mockClear();
    provider.search.mockClear();
    provider.extract.mockClear();

    await researchOpportunity('p', 'j', provider, 'reload');

    expect(provider.search).not.toHaveBeenCalled();
    expect(provider.extract).not.toHaveBeenCalled();
    expect(d.generate).not.toHaveBeenCalled();
  });

  it('rejects an incomplete cached dossier and performs fresh provider work', async () => {
    d.cache.mockResolvedValue({
      status: 'completed',
      structuredResult: {},
      researchFingerprint: opportunityResearchFingerprint(
        await d.profile(),
        await d.job(),
        'gemini-2.5-flash-lite',
      ),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      sources: [],
    });
    const provider = {
      search: vi.fn().mockResolvedValue([source]),
      extract: vi.fn().mockResolvedValue([]),
    };

    await researchOpportunity('p', 'j', provider, 'incomplete-cache');

    expect(provider.search).toHaveBeenCalled();
    expect(d.generate).toHaveBeenCalledTimes(2);
  });

  it('treats an old incompatible fingerprint as a normal cache miss', async () => {
    d.cache.mockResolvedValue({
      status: 'completed',
      structuredResult: {},
      researchFingerprint: 'old-contract-fingerprint',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      sources: [{}],
    });
    const provider = {
      search: vi.fn().mockResolvedValue([source]),
      extract: vi.fn().mockResolvedValue([]),
    };

    await expect(researchOpportunity('p', 'j', provider, 'old-cache')).resolves.toBeDefined();
    expect(provider.search).toHaveBeenCalled();
    expect(d.generate).toHaveBeenCalledTimes(2);
  });

  it('persists the one resolved Gemini model used by both syntheses', async () => {
    process.env.GEMINI_MODEL = 'gemini-research-model';
    await researchOpportunity(
      'p',
      'j',
      { search: vi.fn().mockResolvedValue([source]), extract: vi.fn().mockResolvedValue([]) },
      'model-persistence',
    );
    expect(d.generate.mock.calls.map(([request]) => request.model)).toEqual([
      'gemini-research-model',
      'gemini-research-model',
    ]);
    expect(d.persist).toHaveBeenCalledWith(
      expect.objectContaining({ synthesisModel: 'gemini-research-model' }),
    );
    delete process.env.GEMINI_MODEL;
  });

  it('changes cache fingerprints for every versioned semantic contract component', async () => {
    const profile = await d.profile();
    const job = await d.job();
    const contract = opportunityResearchContractVersions('gemini-model-a');
    const base = opportunityResearchFingerprint(profile, job, 'gemini-model-a', contract);
    for (const changed of [
      { ...contract, contract: '2' },
      { ...contract, prompt: '2' },
      { ...contract, output: '2' },
      { ...contract, companyDto: '2' },
      { ...contract, candidateDto: '2' },
      { ...contract, dossierSchema: '3' },
      { ...contract, retrieval: '3' },
      { ...contract, matchingContext: '2' },
      { ...contract, synthesisModel: 'gemini-model-b' },
    ]) {
      expect(
        opportunityResearchFingerprint(profile, job, changed.synthesisModel, changed),
      ).not.toBe(base);
    }
  });
});
