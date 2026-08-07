import 'server-only';
import type { PersistedJob } from '@/types/domain';
import { PersistedJobDataError, listPersistedJobs } from '@/features/jobs/server/persisted-jobs';
import { SupabaseConfigurationError } from '@/features/profiles/server/supabase';
export async function loadPersistedJobs(): Promise<{
  jobs: PersistedJob[] | null;
  error: string | null;
}> {
  try {
    return { jobs: await listPersistedJobs(), error: null };
  } catch (error) {
    if (error instanceof SupabaseConfigurationError || error instanceof PersistedJobDataError)
      return { jobs: null, error: error.message };
    return { jobs: null, error: 'Collected jobs could not be loaded.' };
  }
}
