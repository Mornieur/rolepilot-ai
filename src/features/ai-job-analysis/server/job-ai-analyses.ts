import 'server-only';

import { aiJobAnalysisSchema } from '@/features/ai-job-analysis/schema';
import type {
  GeneratedAiJobAnalysis,
  PersistedAiJobAnalysis,
} from '@/features/ai-job-analysis/types';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';
import type { JobAiAnalysisRow } from '@/features/profiles/types/database';

export class JobAiAnalysisDataError extends Error {
  constructor(message = 'As análises salvas estão indisponíveis agora. Tente novamente.') {
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
    throw new JobAiAnalysisDataError('Uma análise salva é inválida.');
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
  if (error || !data) throw new JobAiAnalysisDataError('Não foi possível salvar a análise de IA.');
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

export async function listLatestAiAnalysesForJobs(profileId: string, jobIds: string[]) {
  if (!jobIds.length) return {} as Record<string, PersistedAiJobAnalysis>;
  const { data, error } = await getSupabaseServerClient()
    .from('job_ai_analyses')
    .select('*')
    .eq('profile_id', profileId)
    .in('job_id', jobIds)
    .order('created_at', { ascending: false });
  if (error) throw new JobAiAnalysisDataError();
  const latest: Record<string, PersistedAiJobAnalysis> = {};
  for (const item of data ?? []) {
    const analysis = mapRow(item);
    if (!latest[analysis.jobId]) latest[analysis.jobId] = analysis;
  }
  return latest;
}
