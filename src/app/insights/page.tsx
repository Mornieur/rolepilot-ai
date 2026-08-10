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
  searchParams: Promise<{ profileId?: string; period?: string; scope?: string }>;
}) {
  const [params, profiles] = await Promise.all([searchParams, loadCandidateProfiles()]);
  if (profiles.error || !profiles.profiles)
    return (
      <PageContainer>
        <div className="mx-auto max-w-6xl">
          <Alert variant="danger" title="Perfis indisponíveis">
            {profiles.error ?? 'Tente novamente.'}
          </Alert>
        </div>
      </PageContainer>
    );
  const period = insightPeriodSchema.catch('30d').parse(params.period);
  const scope = params.scope === 'relevant' ? 'relevant' : 'all';
  const profileId = params.profileId ?? profiles.profiles[0]?.id;
  let insight = null;
  let error: string | null = null;
  if (profileId)
    try {
      insight = await loadJobInsights(profileId, period, scope);
    } catch (caught) {
      error =
        caught instanceof JobInsightsDataError
          ? caught.message
          : 'Insights estão indisponíveis neste momento.';
    }
  return (
    <PageContainer>
      <PageContent>
        <PageHeader
          title="Insights das vagas coletadas"
          description="Insights descritivos das vagas coletadas e decisões explícitas; não é uma visão de todo o mercado."
          actions={
            <Link
              href="/"
              className="text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
            >
              Voltar ao início
            </Link>
          }
        />
        <InsightsClient>
          {profiles.profiles.length ? (
            <InsightsFilters
              profiles={profiles.profiles}
              profileId={profileId}
              period={period}
              scope={scope}
            />
          ) : (
            <EmptyState
              className="mt-6"
              title="Crie um perfil primeiro"
              description="Um perfil é necessário antes de consultar os insights das vagas coletadas."
            />
          )}
          {error && (
            <Alert className="mt-6" variant="danger" title="Insights indisponíveis" role="alert">
              {error}
            </Alert>
          )}
          {insight &&
            (insight.sampleSize ? (
              <InsightsDashboard insight={insight} scope={scope} />
            ) : (
              <InsightsEmpty />
            ))}
        </InsightsClient>
      </PageContent>
    </PageContainer>
  );
}
