import Link from 'next/link';
import { Alert, Button, EmptyState, Select, Surface } from '@/components/feitoza-ui';
import { PageContainer, PageContent, PageHeader } from '@/components/page-layout';
import { EvaluationResults } from '@/features/job-evaluation/components/evaluation-results';
import { evaluatePersistedJobsForProfile } from '@/features/job-evaluation/server';
import { loadCandidateProfiles } from '@/features/profiles/server/load-profiles';
import { getStatus } from '@/features/job-actions/server/job-statuses';
import type { JobUserStatus } from '@/types/domain';
import type { PersistedAiJobAnalysis } from '@/features/ai-job-analysis/types';
import { getLatestAiAnalysis } from '@/features/ai-job-analysis/server/job-ai-analyses';
import { getAiAnalysisInputFingerprint } from '@/features/ai-job-analysis/fingerprint';

export const dynamic = 'force-dynamic';

export default async function EvaluateJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const [{ profileId }, profiles] = await Promise.all([searchParams, loadCandidateProfiles()]);
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
  if (profileId)
    try {
      results = await evaluatePersistedJobsForProfile(profileId);
      statuses = Object.fromEntries(
        await Promise.all(
          results.map(async (result) => [
            result.job.id,
            (await getStatus(result.profileId, result.job.id)).status,
          ]),
        ),
      );
      const profile = profiles.profiles.find((candidate) => candidate.id === profileId);
      if (profile)
        latestAnalyses = Object.fromEntries(
          (
            await Promise.all(
              results.map(async (result) => {
                const latest = await getLatestAiAnalysis(profile.id, result.job.id);
                return latest
                  ? [
                      result.job.id,
                      {
                        ...latest,
                        stale:
                          latest.inputFingerprint !==
                          getAiAnalysisInputFingerprint(profile, result.job, result),
                      },
                    ]
                  : null;
              }),
            )
          ).filter(
            (entry): entry is [string, PersistedAiJobAnalysis & { stale: boolean }] =>
              entry !== null,
          ),
        );
    } catch {
      error = 'A avaliação não pôde ser concluída. Selecione um perfil atual e tente novamente.';
    }
  return (
    <PageContainer>
      <PageContent>
        <PageHeader
          title="Avaliação de vagas por regras"
          description="A avaliação determinística é separada da análise opcional do Gemini e da sua decisão."
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
                  {profiles.profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
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
          />
        )}
      </PageContent>
    </PageContainer>
  );
}
