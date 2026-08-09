import Link from 'next/link';
import { Alert, EmptyState } from '@/components/feitoza-ui';
import { PageContainer, PageContent, PageHeader } from '@/components/page-layout';
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
    return (
      <PageContainer>
        <div className="mx-auto max-w-6xl">
          <Alert variant="danger" title="Profiles are unavailable">
            {profiles.error ?? 'Please try again.'}
          </Alert>
        </div>
      </PageContainer>
    );
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
    <PageContainer>
      <PageContent>
        <PageHeader
          title="Collected job insights"
          description="Descriptive insights from collected jobs and explicit decisions; this is not a view of the whole market."
          actions={
            <Link
              href="/"
              className="text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
            >
              Back to dashboard
            </Link>
          }
        />
        <InsightsClient>
          {profiles.profiles.length ? (
            <InsightsFilters profiles={profiles.profiles} profileId={profileId} period={period} />
          ) : (
            <EmptyState
              className="mt-6"
              title="Create a candidate profile first"
              description="A profile is required before reviewing collected job insights."
            />
          )}
          {error && (
            <Alert className="mt-6" variant="danger" title="Insights unavailable" role="alert">
              {error}
            </Alert>
          )}
          {insight &&
            (insight.sampleSize ? <InsightsDashboard insight={insight} /> : <InsightsEmpty />)}
        </InsightsClient>
      </PageContent>
    </PageContainer>
  );
}
