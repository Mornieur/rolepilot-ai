import type { ExternalJobPreview } from '@/features/job-sources/greenhouse/types';
import type { JobCollectionResult } from '@/features/jobs/server/persisted-jobs';

export type GreenhousePreviewActionState = {
  status: 'idle' | 'success' | 'empty' | 'error';
  message?: string;
  jobs?: ExternalJobPreview[];
  total?: number;
  skippedJobs?: number;
  requestedAt?: string;
};
export const initialGreenhousePreviewState: GreenhousePreviewActionState = { status: 'idle' };

export type GreenhouseCollectionActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  result?: JobCollectionResult;
};
export const initialGreenhouseCollectionState: GreenhouseCollectionActionState = { status: 'idle' };
