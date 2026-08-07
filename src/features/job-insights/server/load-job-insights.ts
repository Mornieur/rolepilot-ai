import 'server-only';
import { getCandidateProfileById } from '@/features/profiles/server/candidate-profiles';
import { listPersistedJobs } from '@/features/jobs/server/persisted-jobs';
import { listTargetCompanies } from '@/features/companies/server/target-companies';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';
import { buildJobInsights } from '../aggregations';
import type { InsightPeriod } from '../periods';

export class JobInsightsDataError extends Error {
  constructor() {
    super('Insights are unavailable right now. Please try again.');
  }
}
export async function loadJobInsights(profileId: string, period: InsightPeriod) {
  const profile = await getCandidateProfileById(profileId);
  if (!profile) return null;
  try {
    const [jobs, companies, response] = await Promise.all([
      listPersistedJobs(),
      listTargetCompanies(),
      getSupabaseServerClient()
        .from('job_user_statuses')
        .select('profile_id, job_id, status')
        .eq('profile_id', profileId),
    ]);
    if (response.error) throw new Error();
    return buildJobInsights({
      profile,
      period,
      jobs,
      companies: new Map(companies.map((company) => [company.id, company.name])),
      statuses: (response.data ?? []).map((row) => ({
        profileId: row.profile_id,
        jobId: row.job_id,
        status: row.status as 'saved' | 'ignored' | 'applied' | 'rejected',
      })),
      now: new Date(),
    });
  } catch {
    throw new JobInsightsDataError();
  }
}
