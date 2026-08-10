'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import {
  previewGreenhouseJobsAction,
  saveGreenhouseJobsAction,
} from '@/features/job-sources/greenhouse/actions';
import {
  initialGreenhouseCollectionState,
  initialGreenhousePreviewState,
  type GreenhousePreviewActionState,
} from '@/features/job-sources/greenhouse/action-state';
import { shortenPreview } from '@/features/job-sources/greenhouse/description';
import type { ExternalJobPreview } from '@/features/job-sources/greenhouse/types';
import type { TargetCompany } from '@/types/domain';
import { Button, Card, Surface } from '@/components/feitoza-ui';
import { PageContainer, PageContent } from '@/components/page-layout';

export function GreenhousePreview({ company }: { company: TargetCompany }) {
  const [state, formAction, pending] = useActionState(
    previewGreenhouseJobsAction,
    initialGreenhousePreviewState,
  );
  const [collection, collectionAction, saving] = useActionState(
    saveGreenhouseJobsAction,
    initialGreenhouseCollectionState,
  );
  const unavailableReason =
    company.provider !== 'greenhouse'
      ? 'A prévia para Lever está planejada, mas ainda não está disponível.'
      : !company.enabled
        ? 'Marque a empresa para monitoramento futuro antes de solicitar uma prévia manual.'
        : null;
  return (
    <PageContainer>
      <PageContent>
        <Surface className="p-5 sm:p-6">
          <Link
            href="/companies"
            className="text-sm font-medium text-blue-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Voltar às empresas
          </Link>
          <header className="mt-6 border-b border-slate-200 pb-6 dark:border-slate-700">
            <p className="text-sm font-semibold tracking-[0.18em] text-blue-700 uppercase">
              RolePilot AI
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Prévia de vagas Greenhouse
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {company.name} · {company.boardIdentifier}
            </p>
            <p className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950 dark:border-cyan-900 dark:bg-slate-900 dark:text-cyan-100">
              Apenas prévia — estas vagas ainda não foram salvas no RolePilot.
            </p>
          </header>
          <section className="mt-8" aria-labelledby="preview-request">
            <h2 id="preview-request" className="text-xl font-semibold">
              Coleta manual
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Solicite vagas publicadas atualmente pela API pública oficial do Greenhouse.
            </p>
            <form action={formAction} className="mt-4">
              <input type="hidden" name="companyId" value={company.id} />
              <Button type="submit" disabled={pending || Boolean(unavailableReason)}>
                {pending ? 'Solicitando prévia…' : 'Ver vagas'}
              </Button>
            </form>
            {unavailableReason && (
              <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">{unavailableReason}</p>
            )}
            <PreviewStatus state={state} loading={pending} />
          </section>
          {state.status === 'success' && state.jobs && (
            <>
              <JobList
                jobs={state.jobs}
                total={state.total ?? state.jobs.length}
                skippedJobs={state.skippedJobs ?? 0}
                requestedAt={state.requestedAt}
              />
              <form action={collectionAction} className="mt-6">
                <input type="hidden" name="companyId" value={company.id} />
                <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                  Salvar consulta o Greenhouse novamente no servidor; os dados da prévia não são
                  enviados pelo navegador.
                </p>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando vagas coletadas…' : 'Salvar vagas coletadas'}
                </Button>
              </form>
              {collection.status === 'error' && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {collection.message}
                </p>
              )}
              {collection.status === 'success' && collection.result && (
                <p role="status" className="mt-3 text-sm text-emerald-700">
                  Salvas: {collection.result.created} criadas, {collection.result.updated}{' '}
                  atualizadas, {collection.result.unchanged} sem alteração,{' '}
                  {collection.result.skipped} ignoradas, {collection.result.malformed} inválidas.
                </p>
              )}
            </>
          )}
        </Surface>
      </PageContent>
    </PageContainer>
  );
}

function PreviewStatus({
  state,
  loading,
}: {
  state: GreenhousePreviewActionState;
  loading: boolean;
}) {
  if (loading)
    return (
      <p role="status" className="mt-3 text-sm text-slate-600">
        Solicitando vagas publicadas no Greenhouse…
      </p>
    );
  if (state.status === 'idle')
    return (
      <p role="status" className="mt-3 text-sm text-slate-500">
        Nenhuma prévia foi solicitada ainda.
      </p>
    );
  if (state.status === 'success')
    return (
      <p role="status" className="mt-3 text-sm text-emerald-700">
        Prévia recebida com sucesso.
      </p>
    );
  if (state.status === 'empty')
    return (
      <p role="status" className="mt-3 text-sm text-slate-600">
        {state.message}
      </p>
    );
  return (
    <p role="alert" className="mt-3 text-sm text-red-700">
      {state.message}
    </p>
  );
}

function JobList({
  jobs,
  total,
  skippedJobs,
  requestedAt,
}: {
  jobs: ExternalJobPreview[];
  total: number;
  skippedJobs: number;
  requestedAt?: string;
}) {
  return (
    <section className="mt-10" aria-labelledby="preview-results">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="preview-results" className="text-xl font-semibold">
          Vagas publicadas
        </h2>
        <p className="text-sm text-slate-600">
          {total} retornadas
          {skippedJobs > 0 ? ` · ${skippedJobs} entradas inválidas excluídas` : ''}
        </p>
      </div>
      {requestedAt && (
        <p className="mt-2 text-sm text-slate-500">
          Solicitada em {new Date(requestedAt).toLocaleString('pt-BR')}
        </p>
      )}
      <div className="mt-4 space-y-4">
        {jobs.map((job) => (
          <article key={job.externalId}>
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {[job.location, job.language].filter(Boolean).join(' · ') ||
                      'Localização não informada'}
                  </p>
                </div>
                <a
                  href={job.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-blue-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  Abrir vaga original
                </a>
              </div>
              {job.descriptionText && (
                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {shortenPreview(job.descriptionText)}
                </p>
              )}
              <Metadata label="Departamentos" values={job.departments} />
              <Metadata label="Escritórios" values={job.offices} />
              {job.sourceUpdatedAt && (
                <p className="mt-3 text-xs text-slate-500">
                  Atualizada na fonte: {job.sourceUpdatedAt}
                </p>
              )}
            </Card>
          </article>
        ))}
      </div>
    </section>
  );
}
function Metadata({ label, values }: { label: string; values: string[] }) {
  return values.length ? (
    <p className="mt-3 text-sm text-slate-600">
      <span className="font-medium text-slate-800">{label}:</span> {values.join(', ')}
    </p>
  ) : null;
}
