'use server';
import { z } from 'zod';
import { analyzeEligibleJob } from '@/features/ai-job-analysis/analyze-job';
import { AiJobAnalysisError } from '@/features/ai-job-analysis/errors';
import type { AiJobAnalysis } from '@/features/ai-job-analysis/types';
export type AiAnalysisActionState =
  | { status: 'idle' }
  | { status: 'success'; analysis: AiJobAnalysis }
  | { status: 'error'; message: string };
export const initialAiAnalysisActionState: AiAnalysisActionState = { status: 'idle' };
const ids = z.object({ profileId: z.string().uuid(), jobId: z.string().uuid() });
export async function analyzeJobAction(
  _: AiAnalysisActionState,
  formData: FormData,
): Promise<AiAnalysisActionState> {
  const parsed = ids.safeParse({
    profileId: formData.get('profileId'),
    jobId: formData.get('jobId'),
  });
  if (!parsed.success)
    return { status: 'error', message: 'The profile or job could not be identified.' };
  try {
    return {
      status: 'success',
      analysis: await analyzeEligibleJob(parsed.data.profileId, parsed.data.jobId),
    };
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof AiJobAnalysisError ? error.message : 'AI analysis could not be completed.',
    };
  }
}
