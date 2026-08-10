import type { PersistedAiJobAnalysis } from '@/features/ai-job-analysis/types';

export type AiAnalysisActionState =
  | { status: 'idle' }
  | { status: 'success'; analysis: PersistedAiJobAnalysis }
  | { status: 'error'; message: string };

export const initialAiAnalysisActionState: AiAnalysisActionState = { status: 'idle' };
