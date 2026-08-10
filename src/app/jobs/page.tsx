import Link from 'next/link';
import { Alert, Card, EmptyState, Surface } from '@/components/feitoza-ui';
import { PageContainer, PageContent, PageHeader } from '@/components/page-layout';
import { loadPersistedJobs } from '@/features/jobs/server/load-jobs';
import { requirePageUser } from '@/features/auth/server/auth';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  await requirePageUser();
  const result = await loadPersistedJobs();
  if (result.error || !result.jobs)
    return (
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <Surface className="p-6">
            <Alert variant="danger" title="Vagas salvas indisponíveis">
              {result.error}
            </Alert>
          </Surface>
        </div>
      </PageContainer>
    );

  return (
    <PageContainer>
      <PageContent>
        <PageHeader
          title="Vagas coletadas"
          description="Estas são todas as vagas coletadas das fontes monitoradas. Use Avaliar vagas para encontrar as mais compatíveis com um perfil."
          actions={
            <div className="flex flex-wrap gap-4">
              <Link
                href="/jobs/evaluate"
                className="text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
              >
                Avaliar vagas
              </Link>
              <Link
                href="/"
                className="text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
              >
                Voltar ao início
              </Link>
            </div>
          }
        />
        {result.jobs.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="Nenhuma vaga coletada ainda"
            description="Faça uma prévia manual de uma empresa Greenhouse e salve as vagas."
            action={
              <Link
                href="/jobs/evaluate"
                className="text-sm font-medium text-sky-700 underline underline-offset-4 dark:text-cyan-300"
              >
                Avaliar vagas
              </Link>
            }
          />
        ) : (
          <div className="mt-6 space-y-4">
            {result.jobs.map((job) => (
              <article key={job.id}>
                <Card className="p-5">
                  <h2 className="break-words text-lg font-semibold">{job.title}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {job.provider} · {job.location ?? 'Localização não informada'}
                  </p>
                  {job.departments.length > 0 && (
                    <p className="mt-3 break-words text-sm">
                      Departamentos: {job.departments.join(', ')}
                    </p>
                  )}
                  {job.offices.length > 0 && (
                    <p className="mt-1 break-words text-sm">
                      Escritórios: {job.offices.join(', ')}
                    </p>
                  )}
                  <p className="mt-3 break-words text-xs text-slate-500 dark:text-slate-400">
                    Fonte atualizada: {job.sourceUpdatedAt ?? 'Não informado'} · Visto pela primeira
                    vez: {job.firstSeenAt} · Visto por último: {job.lastSeenAt}
                  </p>
                  <a
                    href={job.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
                  >
                    Abrir fonte original <span className="sr-only">(abre em nova aba)</span>
                  </a>
                </Card>
              </article>
            ))}
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}
