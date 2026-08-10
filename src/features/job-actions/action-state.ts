export type JobStatusActionState = {
  status: 'idle' | 'success' | 'error';
  current?: string;
  message?: string;
};

export const initialJobStatusActionState: JobStatusActionState = { status: 'idle' };
