import Link from 'next/link';
import { loadCandidateProfiles } from '@/features/profiles/server/load-profiles';
import { InsightsDashboard } from '@/features/job-insights/components/insights-dashboard';
import {
  InsightsClient,
  InsightsEmpty,
  InsightsFilters,
} from '@/features/job-insights/components/insights-client';
import { insightPeriodSchema } from '@/features/job-insights/periods';
import {
  JobInsightsDataError,
  loadJobInsights,
} from '@/features/job-insights/server/load-job-insights';

export const dynamic = 'force-dynamic';
export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string; period?: string }>;
}) {
  const [params, profiles] = await Promise.all([searchParams, loadCandidateProfiles()]);
  if (profiles.error || !profiles.profiles)
    return <main className="p-8">Profiles are unavailable.</main>;
  const period = insightPeriodSchema.catch('30d').parse(params.period);
  const profileId = params.profileId ?? profiles.profiles[0]?.id;
  let insight = null;
  let error: string | null = null;
  if (profileId)
    try {
      insight = await loadJobInsights(profileId, period);
    } catch (caught) {
      error =
        caught instanceof JobInsightsDataError
          ? caught.message
          : 'Insights are unavailable right now.';
    }
  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <InsightsClient>
        <Link href="/" className="text-sm font-medium text-blue-700 underline">
          Back to dashboard
        </Link>
        <h1 className="mt-6 text-3xl font-semibold">Collected job insights</h1>
        <p className="mt-2 text-slate-600">
          Descriptive insights from collected jobs and explicit decisions; this is not a view of the
          whole market.
        </p>
        {profiles.profiles.length ? (
          <InsightsFilters profiles={profiles.profiles} profileId={profileId} period={period} />
        ) : (
          <p className="mt-6">Create a candidate profile first.</p>
        )}
        {error && (
          <p role="alert" className="mt-6 text-red-700">
            {error}
          </p>
        )}
        {insight &&
          (insight.sampleSize ? <InsightsDashboard insight={insight} /> : <InsightsEmpty />)}
      </InsightsClient>
    </main>
  );
}
