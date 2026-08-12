import Link from 'next/link';
import { Alert, Badge, Card, EmptyState } from '@/components/feitoza-ui';
import { PageContainer, PageContent, PageHeader } from '@/components/page-layout';
import { requirePageUser } from '@/features/auth/server/auth';
import { selectAccessibleProfile } from '@/features/auth/policy';
import { loadCandidateProfiles } from '@/features/profiles/server/load-profiles';
import { getPersistedJobById } from '@/features/jobs/server/persisted-jobs';
import { getTargetCompanyById } from '@/features/companies/server/target-companies';
import { getStatus } from '@/features/job-actions/server/job-statuses';
import { JobStatusControls } from '@/features/job-actions/components/job-status-controls';
import { evaluateJob } from '@/features/job-evaluation/evaluate';
import { getLatestResearchDossier } from '@/features/opportunity-intelligence/server/dossiers';
import { OpportunityDossierView } from '@/features/opportunity-intelligence/components/opportunity-dossier';
import { ResearchTrigger } from '@/features/opportunity-intelligence/components/research-trigger';
export const dynamic = 'force-dynamic';
export default async function OpportunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ profileId?: string }>;
}) {
  const user = await requirePageUser();
  const [{ jobId }, query, profilesResult] = await Promise.all([
    params,
    searchParams,
    loadCandidateProfiles(user),
  ]);
  const profile = profilesResult.profiles
    ? selectAccessibleProfile(profilesResult.profiles, query.profileId)
    : null;
  if (!profile || (query.profileId && !profile))
    return (
      <PageContainer>
        <Alert variant="danger" title="Oportunidade indisponível">
          Perfil indisponível.
        </Alert>
      </PageContainer>
    );
  const job = await getPersistedJobById(jobId);
  if (!job)
    return (
      <PageContainer>
        <EmptyState
          title="Vaga não encontrada"
          description="A oportunidade pode ter sido removida."
        />
      </PageContainer>
    );
  const [company, decision, dossier] = await Promise.all([
    getTargetCompanyById(job.targetCompanyId),
    getStatus(profile.id, job.id),
    getLatestResearchDossier(profile.id, job.id),
  ]);
  const evaluation = evaluateJob(profile, job);
  const warnings = evaluation.reasons
    .filter((reason) => reason.outcome === 'fail' || reason.code === 'required-partial')
    .map((reason) => reason.message);
  const positives = evaluation.reasons
    .filter((reason) => reason.outcome === 'pass')
    .map((reason) => reason.message);
  return (
    <PageContainer>
      <PageContent>
        <PageHeader
          eyebrow={company?.name ?? 'Empresa monitorada'}
          title={job.title}
          description={`${job.location ?? 'Localização não informada'} · ${job.isActive === false ? 'Encerrada' : 'Ativa'}`}
          actions={
            <a
              href={job.originalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-sky-700 underline dark:text-cyan-300"
            >
              Abrir fonte
            </a>
          }
        />
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="success">Score {evaluation.score}/100</Badge>
          <Badge variant={evaluation.score >= 80 ? 'success' : 'primary'}>
            {evaluation.score >= 80 ? 'Excelente' : evaluation.score >= 70 ? 'Boa' : 'Revisar'}
          </Badge>
          <Badge variant="neutral">{decision.status}</Badge>
          {job.isActive === false && <Badge variant="warning">Encerrada</Badge>}
        </div>
        <Card className="mt-6 p-5">
          <p className="text-sm">
            Descoberta em{' '}
            {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
              new Date(job.firstSeenAt),
            )}
          </p>
          <JobStatusControls
            profileId={profile.id}
            jobId={job.id}
            currentStatus={decision.status}
          />
        </Card>
        <section className="mt-8" aria-labelledby="fit-heading">
          <h2 id="fit-heading" className="text-2xl font-semibold">
            Por que combina com seu perfil
          </h2>
          <Card className="mt-4 p-5">
            <h3 className="font-semibold">Pontos fortes</h3>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {positives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="mt-4 font-semibold">Pontos de atenção</h3>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {warnings.length ? (
                warnings.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>Nenhum alerta determinístico.</li>
              )}
            </ul>
          </Card>
        </section>
        {dossier?.status === 'completed' && dossier.structuredResult ? (
          <OpportunityDossierView dossier={dossier} />
        ) : (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold">Inteligência da oportunidade</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              A pesquisa é manual e não altera sua decisão nem o score determinístico.
            </p>
            <div className="mt-4">
              <ResearchTrigger profileId={profile.id} jobId={job.id} />
            </div>
          </section>
        )}
        <Link
          className="mt-8 inline-block text-sm text-sky-700 underline dark:text-cyan-300"
          href={`/inbox?profileId=${encodeURIComponent(profile.id)}`}
        >
          Voltar para a Caixa
        </Link>
      </PageContent>
    </PageContainer>
  );
}
