import Link from 'next/link';
import { Alert, Button, EmptyState, Select, Surface } from '@/components/feitoza-ui';
import { PageContainer, PageContent, PageHeader } from '@/components/page-layout';
import { EvaluationResults } from '@/features/job-evaluation/components/evaluation-results';
import { evaluatePersistedJobs } from '@/features/job-evaluation/server';
import { loadCandidateProfiles } from '@/features/profiles/server/load-profiles';
import { loadTargetCompanies } from '@/features/companies/server/load-companies';
import { listStatusesForJobs } from '@/features/job-actions/server/job-statuses';
import type { PersistedAiJobAnalysis } from '@/features/ai-job-analysis/types';
import { listLatestAiAnalysesForJobs } from '@/features/ai-job-analysis/server/job-ai-analyses';
import { getAiAnalysisInputFingerprint } from '@/features/ai-job-analysis/fingerprint';
import type { JobUserStatus } from '@/types/domain';
import { requirePageUser } from '@/features/auth/server/auth';

export const dynamic = 'force-dynamic';

export default async function EvaluateJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const currentUser = await requirePageUser();
  const [{ profileId }, profiles, companies] = await Promise.all([
    searchParams,
    loadCandidateProfiles(currentUser),
    loadTargetCompanies(),
  ]);
  if (profiles.error || !profiles.profiles)
    return (
      <PageContainer>
        <div className="mx-auto max-w-5xl">
          <Alert variant="danger" title="Configuração de perfis indisponível">
            {profiles.error ?? 'Tente novamente.'}
          </Alert>
        </div>
      </PageContainer>
    );

  let results = null;
  let statuses: Record<string, JobUserStatus> = {};
  let latestAnalyses: Record<string, PersistedAiJobAnalysis & { stale: boolean }> = {};
  let error: string | null = null;
  const profile = profiles.profiles.find((candidate) => candidate.id === profileId);
  if (profileId)
    try {
      if (!profile) throw new Error('Selected profile is unavailable.');
      results = await evaluatePersistedJobs(profile);
      const eligibleResults = results.filter((result) => result.eligible);
      const [loadedStatuses, loadedAnalyses] = await Promise.all([
        listStatusesForJobs(
          profile.id,
          results.map((result) => result.job.id),
        ),
        listLatestAiAnalysesForJobs(
          profile.id,
          eligibleResults.map((result) => result.job.id),
        ),
      ]);
      statuses = loadedStatuses;
      latestAnalyses = Object.fromEntries(
        eligibleResults.flatMap((result) => {
          const latest = loadedAnalyses[result.job.id];
          return latest
            ? [
                [
                  result.job.id,
                  {
                    ...latest,
                    stale:
                      latest.inputFingerprint !==
                      getAiAnalysisInputFingerprint(profile, result.job, result),
                  },
                ],
              ]
            : [];
        }),
      );
    } catch {
      error = 'A avaliação não pôde ser concluída. Selecione um perfil atual e tente novamente.';
    }

  const companyNames = Object.fromEntries(
    (companies.companies ?? []).map((company) => [company.id, company.name]),
  );
  return (
    <PageContainer>
      <PageContent>
        <PageHeader
          title="Avaliar vagas"
          description="Priorize oportunidades compatíveis, registre sua decisão e use a análise manual do Gemini quando precisar."
          actions={
            <Link
              href="/jobs"
              className="text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
            >
              Voltar às vagas
            </Link>
          }
        />
        {profiles.profiles.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="Crie um perfil primeiro"
            description="Um perfil é necessário antes de avaliar as vagas coletadas."
            action={
              <Link
                href="/profiles"
                className="text-sm font-medium text-sky-700 underline underline-offset-4 dark:text-cyan-300"
              >
                Gerenciar perfis
              </Link>
            }
          />
        ) : (
          <Surface className="mt-6 p-5">
            <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <Select
                  id="profileId"
                  name="profileId"
                  label="Perfil"
                  defaultValue={profileId}
                  fullWidth
                >
                  <option value="">Escolha um perfil</option>
                  {profiles.profiles.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                Avaliar vagas
              </Button>
            </form>
          </Surface>
        )}
        {!profileId && profiles.profiles.length > 0 && (
          <EmptyState
            className="mt-6"
            title="Escolha um perfil para começar"
            description="A avaliação usa apenas regras determinísticas; ela não chama o Gemini nem envia candidaturas."
          />
        )}
        {error && (
          <Alert className="mt-4" variant="danger" title="Avaliação indisponível" role="alert">
            {error}
          </Alert>
        )}
        {results && (
          <EvaluationResults
            results={results}
            statuses={statuses}
            latestAnalyses={latestAnalyses}
            companyNames={companyNames}
          />
        )}
      </PageContent>
    </PageContainer>
  );
}
