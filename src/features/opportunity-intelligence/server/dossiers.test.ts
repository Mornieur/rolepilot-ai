import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/features/profiles/server/supabase', () => ({ getSupabaseServerClient: () => client }));

import {
  getLatestResearchDossier,
  OpportunityResearchDataError,
  persistCompletedDossier,
} from './dossiers';
import type { OpportunityDossier } from '@/features/opportunity-intelligence/types';

const source = {
  id: '11111111-1111-4111-8111-111111111111',
  tier: 1 as const,
  sourceKind: 'official',
  title: 'Official source',
  organization: null,
  domain: 'example.test',
  url: 'https://example.test/source',
  publishedAt: null,
  evidenceScopes: [],
  normalizedExcerpt: 'Evidence',
  evidenceClassification: 'known' as const,
};

const result: OpportunityDossier = {
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
    confidence: 'low' as const,
    conflicts: [],
    unknowns: [],
  },
  hiringProcess: {
    officialKnownStages: [],
    anecdotalReportedStages: [],
    likelyExpectations: [],
    confidence: 'low' as const,
  },
  preparation: {
    mustReview: [],
    shouldReview: [],
    optional: [],
    behavioral: [],
    companyKnowledge: [],
  },
  candidateFit: { alreadyStrong: [], refresh: [], realGaps: [], unknowns: [] },
  careerImpact: {
    technicalGrowth: { level: 'unknown', explanation: 'Unknown' },
    leadershipExposure: { level: 'unknown', explanation: 'Unknown' },
    aiExposure: { level: 'unknown', explanation: 'Unknown' },
    productExposure: { level: 'unknown', explanation: 'Unknown' },
    internationalExposure: { level: 'unknown', explanation: 'Unknown' },
    compensationUpside: { level: 'unknown', explanation: 'Unknown' },
    roleScopeRisk: { level: 'unknown', explanation: 'Unknown' },
  },
  applicationPositioning: { emphasize: [], storiesToPrepare: [], evidenceToQuantify: [] },
  questionsToInvestigate: [],
  citations: [],
  researchTimestamp: '2026-08-18T00:00:00.000Z',
};

const row = {
  id: '22222222-2222-4222-8222-222222222222',
  profile_id: 'profile',
  job_id: 'job',
  schema_version: '2',
  status: 'completed' as const,
  research_fingerprint: 'fingerprint',
  structured_result: result,
  research_provider: 'tavily' as const,
  synthesis_provider: 'gemini' as const,
  synthesis_model: 'gemini-test',
  researched_at: '2026-08-18T00:00:00.000Z',
  expires_at: '2026-09-01T00:00:00.000Z',
  error_classification: null,
  created_at: '2026-08-18T00:00:00.000Z',
  updated_at: '2026-08-18T00:00:00.000Z',
};

describe('opportunity dossier persistence and cache safety', () => {
  beforeEach(() => vi.clearAllMocks());

  it('persists the dossier and all sources through one atomic RPC with the actual model', async () => {
    client.rpc.mockResolvedValue({ data: row, error: null });
    await expect(
      persistCompletedDossier({
        profileId: 'profile',
        jobId: 'job',
        schemaVersion: '2',
        researchFingerprint: 'fingerprint',
        structuredResult: result,
        researchedAt: row.researched_at,
        expiresAt: row.expires_at,
        errorClassification: null,
        synthesisModel: 'gemini-test',
        sources: [source],
      }),
    ).resolves.toMatchObject({ id: row.id, sources: [expect.objectContaining({ id: source.id })] });
    expect(client.rpc).toHaveBeenCalledWith(
      'persist_completed_opportunity_research_dossier',
      expect.objectContaining({
        p_synthesis_model: 'gemini-test',
        p_sources: [expect.objectContaining({ id: source.id })],
      }),
    );
    expect(client.from).not.toHaveBeenCalled();
  });

  it('maps an atomic persistence failure without leaving a client-side completed write path', async () => {
    client.rpc.mockResolvedValue({ data: null, error: { message: 'failed' } });
    await expect(
      persistCompletedDossier({
        profileId: 'profile',
        jobId: 'job',
        schemaVersion: '2',
        researchFingerprint: 'fingerprint',
        structuredResult: result,
        researchedAt: row.researched_at,
        expiresAt: row.expires_at,
        errorClassification: null,
        synthesisModel: 'gemini-test',
        sources: [source],
      }),
    ).rejects.toBeInstanceOf(OpportunityResearchDataError);
    expect(client.from).not.toHaveBeenCalled();
  });

  it('treats a completed dossier without sources as a cache miss', async () => {
    client.from
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({ maybeSingle: async () => ({ data: row, error: null }) }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({ select: () => ({ eq: async () => ({ data: [], error: null }) }) });
    await expect(getLatestResearchDossier('profile', 'job')).resolves.toBeNull();
  });
});
