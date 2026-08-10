import 'server-only';

import { aiJobAnalysisSchema } from '@/features/ai-job-analysis/schema';
import type {
  GeneratedAiJobAnalysis,
  PersistedAiJobAnalysis,
} from '@/features/ai-job-analysis/types';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';
import type { JobAiAnalysisRow } from '@/features/profiles/types/database';

export class JobAiAnalysisDataError extends Error {
  constructor(message = 'Saved AI analyses are unavailable right now. Please try again.') {
    super(message);
  }
}

function mapRow(row: JobAiAnalysisRow): PersistedAiJobAnalysis {
  const analysis = aiJobAnalysisSchema.safeParse(row.result);
  if (
    !analysis.success ||
    row.provider !== 'gemini' ||
    row.recommendation !== analysis.data.recommendation ||
    row.confidence !== analysis.data.confidence
  )
    throw new JobAiAnalysisDataError('A saved AI analysis is invalid.');
  return {
    id: row.id,
    profileId: row.profile_id,
    jobId: row.job_id,
    provider: 'gemini',
    model: row.model,
    schemaVersion: row.schema_version,
    analysis: analysis.data,
    latencyMs: row.latency_ms,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    totalTokens: row.total_tokens,
    inputFingerprint: row.input_fingerprint,
    createdAt: row.created_at,
  };
}

export const toPersistedAiJobAnalysis = mapRow;

export async function persistSuccessfulAiAnalysis(input: GeneratedAiJobAnalysis) {
  const { data, error } = await getSupabaseServerClient()
    .from('job_ai_analyses')
    .insert({
      profile_id: input.profileId,
      job_id: input.jobId,
      provider: input.provider,
      model: input.model,
      schema_version: input.schemaVersion,
      result: input.analysis,
      recommendation: input.analysis.recommendation,
      confidence: input.analysis.confidence,
      latency_ms: input.latencyMs,
      input_tokens: input.inputTokens,
      output_tokens: input.outputTokens,
      total_tokens: input.totalTokens,
      input_fingerprint: input.inputFingerprint,
    })
    .select()
    .single();
  if (error || !data) throw new JobAiAnalysisDataError('AI analysis could not be saved.');
  return mapRow(data);
}

export async function getLatestAiAnalysis(profileId: string, jobId: string) {
  const { data, error } = await getSupabaseServerClient()
    .from('job_ai_analyses')
    .select('*')
    .eq('profile_id', profileId)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new JobAiAnalysisDataError();
  return data ? mapRow(data) : null;
}
