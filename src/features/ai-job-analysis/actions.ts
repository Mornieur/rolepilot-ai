'use server';
import { z } from 'zod';
import { generateEligibleJobAnalysis } from '@/features/ai-job-analysis/analyze-job';
import { AiJobAnalysisError } from '@/features/ai-job-analysis/errors';
import type { AiAnalysisActionState } from '@/features/ai-job-analysis/action-state';
import {
  JobAiAnalysisDataError,
  persistSuccessfulAiAnalysis,
} from '@/features/ai-job-analysis/server/job-ai-analyses';
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
    const generated = await generateEligibleJobAnalysis(parsed.data.profileId, parsed.data.jobId);
    return { status: 'success', analysis: await persistSuccessfulAiAnalysis(generated) };
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof AiJobAnalysisError || error instanceof JobAiAnalysisDataError
          ? error.message
          : 'AI analysis could not be completed.',
    };
  }
}
