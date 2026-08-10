'use server';
import { z } from 'zod';
import { generateEligibleJobAnalysis } from '@/features/ai-job-analysis/analyze-job';
import { AiJobAnalysisError } from '@/features/ai-job-analysis/errors';
import type { AiAnalysisActionState } from '@/features/ai-job-analysis/action-state';
import {
  JobAiAnalysisDataError,
  persistSuccessfulAiAnalysis,
} from '@/features/ai-job-analysis/server/job-ai-analyses';
import { AuthorizationError, requireCurrentUser } from '@/features/auth/server/auth';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';
const ids = z.object({ profileId: z.string().uuid(), jobId: z.string().uuid() });
export async function analyzeJobAction(
  _: AiAnalysisActionState,
  formData: FormData,
): Promise<AiAnalysisActionState> {
  const user = await requireCurrentUser();
  const parsed = ids.safeParse({
    profileId: formData.get('profileId'),
    jobId: formData.get('jobId'),
  });
  if (!parsed.success)
    return { status: 'error', message: 'Não foi possível identificar o perfil ou a vaga.' };
  try {
    const ownership = await getSupabaseServerClient()
      .from('candidate_profiles')
      .select('user_id')
      .eq('id', parsed.data.profileId)
      .maybeSingle();
    if (!ownership.data || (user.role !== 'admin' && ownership.data.user_id !== user.id))
      throw new AuthorizationError();
    const generated = await generateEligibleJobAnalysis(parsed.data.profileId, parsed.data.jobId);
    return { status: 'success', analysis: await persistSuccessfulAiAnalysis(generated) };
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof AiJobAnalysisError || error instanceof JobAiAnalysisDataError
          ? error.message
          : 'Não foi possível concluir a análise de IA.',
    };
  }
}
