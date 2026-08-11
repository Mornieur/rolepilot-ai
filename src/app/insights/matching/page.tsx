import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Alert, Select, Surface } from '@/components/feitoza-ui';
import { PageContainer, PageContent, PageHeader } from '@/components/page-layout';
import { requirePageUser } from '@/features/auth/server/auth';
import { MatchingDiagnosticsDashboard } from '@/features/matching-diagnostics/components/matching-diagnostics-dashboard';
import {
  MatchingDiagnosticsDataError,
  loadMatchingDiagnostics,
} from '@/features/matching-diagnostics/server/load-matching-diagnostics';
import { selectAccessibleProfile } from '@/features/auth/policy';
import { loadCandidateProfiles } from '@/features/profiles/server/load-profiles';

export const dynamic = 'force-dynamic';

export default async function MatchingDiagnosticsPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const currentUser = await requirePageUser();
  if (currentUser.role !== 'admin') redirect('/insights');
  const [params, profilesResult] = await Promise.all([
    searchParams,
    loadCandidateProfiles(currentUser),
  ]);
  if (profilesResult.error || !profilesResult.profiles)
    return (
      <PageContainer>
        <Alert variant="danger" title="Diagnóstico indisponível">
          Não foi possível carregar os perfis autorizados.
        </Alert>
      </PageContainer>
    );
  const profile = selectAccessibleProfile(profilesResult.profiles, params.profileId);
  if (!profile)
    return (
      <PageContainer>
        <PageContent>
          <Alert variant="danger" title="Perfil indisponível">
            Selecione um perfil autorizado para o diagnóstico.
          </Alert>
        </PageContent>
      </PageContainer>
    );
  let diagnostics = null;
  let error: string | null = null;
  try {
    diagnostics = await loadMatchingDiagnostics(profile);
  } catch (caught) {
    error =
      caught instanceof MatchingDiagnosticsDataError
        ? caught.message
        : 'O diagnóstico do matching está indisponível no momento. Tente novamente.';
  }
  return (
    <PageContainer>
      <PageContent>
        <PageHeader
          title="Diagnóstico do matching"
          description="Visão administrativa, descritiva e somente leitura das regras determinísticas atuais."
          actions={
            <Link
              href="/insights"
              className="text-sm font-medium text-sky-700 underline underline-offset-4 dark:text-cyan-300"
            >
              Voltar aos insights
            </Link>
          }
        />
        {error ? (
          <Alert variant="danger" title="Diagnóstico indisponível" role="alert">
            {error}
          </Alert>
        ) : (
          diagnostics && (
            <Surface className="mt-6 p-5">
              <form method="get">
                <label className="text-sm font-medium" htmlFor="profileId">
                  Perfil
                </label>
                <Select id="profileId" name="profileId" defaultValue={profile.id} className="ml-2">
                  {profilesResult.profiles.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
                </Select>
                <button
                  type="submit"
                  className="ml-2 text-sm font-medium text-sky-700 underline underline-offset-4 dark:text-cyan-300"
                >
                  Atualizar
                </button>
              </form>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Até 3 consultas de dados em lote por carregamento (vagas, empresas e decisões); sem
                Gemini e sem gravações.
              </p>
              <MatchingDiagnosticsDashboard diagnostics={diagnostics} />
            </Surface>
          )
        )}
      </PageContent>
    </PageContainer>
  );
}
