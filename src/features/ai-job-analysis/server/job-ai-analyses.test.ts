import { describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/features/profiles/server/supabase', () => ({ getSupabaseServerClient: () => client }));

import {
  JobAiAnalysisDataError,
  persistSuccessfulAiAnalysis,
  toPersistedAiJobAnalysis,
} from './job-ai-analyses';

const analysis = {
  recommendation: 'apply' as const,
  confidence: 'high' as const,
  summary: 'Good fit',
  strengths: [],
  gaps: [],
  risks: [],
  interviewFocus: [],
  deterministicAssessment: { score: 80, eligible: true as const },
};
const row = {
  id: 'analysis',
  profile_id: 'profile',
  job_id: 'job',
  provider: 'gemini',
  model: 'gemini-test',
  schema_version: '1',
  result: analysis,
  recommendation: 'apply',
  confidence: 'high',
  latency_ms: null,
  input_tokens: null,
  output_tokens: null,
  total_tokens: null,
  input_fingerprint: 'fingerprint',
  created_at: '2026-08-09T00:00:00Z',
};
const generated = () => {
  const persisted = toPersistedAiJobAnalysis(row);
  return {
    profileId: persisted.profileId,
    jobId: persisted.jobId,
    provider: persisted.provider,
    model: persisted.model,
    schemaVersion: persisted.schemaVersion,
    analysis: persisted.analysis,
    latencyMs: persisted.latencyMs,
    inputTokens: persisted.inputTokens,
    outputTokens: persisted.outputTokens,
    totalTokens: persisted.totalTokens,
    inputFingerprint: persisted.inputFingerprint,
  };
};

describe('job AI analysis persistence', () => {
  it('maps validated rows and nullable execution metadata', () => {
    expect(toPersistedAiJobAnalysis(row)).toMatchObject({
      provider: 'gemini',
      model: 'gemini-test',
      schemaVersion: '1',
      analysis,
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
    });
  });
  it('rejects malformed stored JSON instead of exposing it', () => {
    expect(() => toPersistedAiJobAnalysis({ ...row, result: {} })).toThrow(JobAiAnalysisDataError);
  });
  it('persists only the validated result and maps Supabase failures safely', async () => {
    const insert = vi
      .fn()
      .mockReturnValue({ select: () => ({ single: async () => ({ data: row, error: null }) }) });
    client.from.mockReturnValue({ insert });
    await expect(persistSuccessfulAiAnalysis(generated())).resolves.toMatchObject({
      id: 'analysis',
    });
    expect(insert).toHaveBeenCalledOnce();
    client.from.mockReturnValue({
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: {} }) }) }),
    });
    await expect(persistSuccessfulAiAnalysis(generated())).rejects.toThrow('could not be saved');
  });
});
