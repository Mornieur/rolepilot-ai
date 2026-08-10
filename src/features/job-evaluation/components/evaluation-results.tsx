'use client';

import { useState } from 'react';
import { Badge, Button, Card, EmptyState } from '@/components/feitoza-ui';
import type { DeterministicJobEvaluation, EvaluationReason } from '@/features/job-evaluation/types';
import { AiAnalysisCard } from '@/features/ai-job-analysis/components/ai-analysis-card';
import { JobStatusControls } from '@/features/job-actions/components/job-status-controls';
import type { JobUserStatus } from '@/types/domain';
import type { PersistedAiJobAnalysis } from '@/features/ai-job-analysis/types';

function warningReasons(reasons: EvaluationReason[]) {
  return reasons.filter(
    (reason) =>
      reason.outcome === 'fail' ||
      reason.code === 'required-partial' ||
      (['seniority', 'location'].includes(reason.code) && reason.message.includes('diferente')),
  );
}

function AiState({ analysis }: { analysis?: PersistedAiJobAnalysis & { stale: boolean } }) {
  if (!analysis) return <span>Análise por IA: ainda não analisada</span>;
  return <span>Análise por IA: {analysis.stale ? 'desatualizada' : 'atual'}</span>;
}

function JobCard({
  result,
  status,
  analysis,
  companyName,
}: {
  result: DeterministicJobEvaluation;
  status: JobUserStatus;
  analysis?: PersistedAiJobAnalysis & { stale: boolean };
  companyName?: string;
}) {
  const warnings = warningReasons(result.reasons);
  const detailsId = `deterministic-details-${result.job.id}`;
  return (
    <article>
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold">{result.job.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {companyName ?? 'Empresa não identificada'} ·{' '}
              {result.job.location ?? 'Localização não informada'}
            </p>
          </div>
          <Badge variant={result.eligible ? 'success' : 'neutral'}>
            Pontuação: {result.score}/100
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm" aria-label="Estado da oportunidade">
          <Badge variant={status === 'new' ? 'neutral' : 'primary'}>
            Decisão:{' '}
            {
              {
                new: 'sem decisão',
                saved: 'salva',
                ignored: 'ignorada',
                applied: 'candidatada',
                rejected: 'rejeitada',
              }[status]
            }
          </Badge>
          <Badge variant={analysis?.stale ? 'warning' : analysis ? 'info' : 'neutral'}>
            <AiState analysis={analysis} />
          </Badge>
        </div>
        {warnings.length > 0 && (
          <section
            className="mt-3 border-l-4 border-amber-500 pl-3"
            aria-label="Atenção necessária"
          >
            <h4 className="text-sm font-semibold">Atenção antes de decidir</h4>
            <ul className="mt-1 space-y-1 text-sm">
              {warnings.map((reason) => (
                <li key={reason.code}>{reason.message}</li>
              ))}
            </ul>
          </section>
        )}
        <details id={detailsId} className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium focus:outline-none focus:ring-2 focus:ring-sky-400">
            Ver detalhes da avaliação determinística
          </summary>
          <ul className="mt-2 space-y-1">
            {result.reasons.map((reason) => (
              <li key={reason.code} className="break-words">
                <span className="font-medium">
                  {reason.outcome === 'pass'
                    ? 'Compatível'
                    : reason.outcome === 'fail'
                      ? 'Incompatível'
                      : 'Verificar'}
                  :
                </span>{' '}
                {reason.message}
              </li>
            ))}
          </ul>
        </details>
        <JobStatusControls
          profileId={result.profileId}
          jobId={result.job.id}
          currentStatus={status}
        />
        {result.eligible ? (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-400">
              Abrir análise manual do Gemini
            </summary>
            <AiAnalysisCard
              profileId={result.profileId}
              jobId={result.job.id}
              latestAnalysis={analysis}
            />
          </details>
        ) : (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            A análise manual do Gemini fica disponível somente para oportunidades compatíveis.
          </p>
        )}
        <a
          href={result.job.originalUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
        >
          Abrir fonte <span className="sr-only">(abre em nova aba)</span>
        </a>
      </Card>
    </article>
  );
}

export function EvaluationResults({
  results,
  statuses = {},
  latestAnalyses = {},
  companyNames = {},
}: {
  results: DeterministicJobEvaluation[];
  statuses?: Record<string, JobUserStatus>;
  latestAnalyses?: Record<string, PersistedAiJobAnalysis & { stale: boolean }>;
  companyNames?: Record<string, string>;
}) {
  const [showRejected, setShowRejected] = useState(false);
  const eligibleResults = results.filter((result) => result.eligible);
  const rejectedResults = results.filter((result) => !result.eligible);
  const rejectionReasons = [
    ...rejectedResults
      .flatMap((result) => result.reasons.filter((reason) => reason.outcome === 'fail'))
      .reduce(
        (counts, reason) => counts.set(reason.message, (counts.get(reason.message) ?? 0) + 1),
        new Map<string, number>(),
      ),
  ]
    .sort(([, left], [, right]) => right - left)
    .slice(0, 3);
  return (
    <section className="mt-8" aria-live="polite" aria-labelledby="evaluation-results-heading">
      <h2 id="evaluation-results-heading" className="text-xl font-semibold">
        Resultados da avaliação
      </h2>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        {results.length} avaliadas · {eligibleResults.length} compatíveis · {rejectedResults.length}{' '}
        descartadas
      </p>
      {rejectionReasons.length > 0 && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Principais motivos de descarte:{' '}
          {rejectionReasons.map(([reason, count]) => `${reason} (${count})`).join(' · ')}
        </p>
      )}
      {results.length === 0 ? (
        <EmptyState className="mt-4" title="Não há vagas salvas para avaliar" />
      ) : (
        <>
          <section className="mt-6" aria-labelledby="eligible-jobs-heading">
            <h3 id="eligible-jobs-heading" className="text-lg font-semibold">
              {eligibleResults.length}{' '}
              {eligibleResults.length === 1
                ? 'oportunidade compatível'
                : 'oportunidades compatíveis'}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Estas são as oportunidades prioritárias para sua revisão.
            </p>
            {eligibleResults.length === 0 ? (
              <EmptyState
                className="mt-4"
                title="Nenhuma oportunidade compatível agora"
                description="As vagas coletadas continuam disponíveis nos detalhes de descarte para diagnóstico das regras."
              />
            ) : (
              <div className="mt-4 space-y-4">
                {eligibleResults.map((result) => (
                  <JobCard
                    key={result.job.id}
                    result={result}
                    status={statuses[result.job.id] ?? 'new'}
                    analysis={latestAnalyses[result.job.id]}
                    companyName={companyNames[result.job.targetCompanyId]}
                  />
                ))}
              </div>
            )}
          </section>
          {rejectedResults.length > 0 && (
            <section className="mt-8" aria-labelledby="rejected-jobs-heading">
              <h3 id="rejected-jobs-heading" className="text-lg font-semibold">
                Diagnóstico de vagas descartadas
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Use esta lista para validar as regras, sem misturá-la ao fluxo principal.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                aria-expanded={showRejected}
                aria-controls="rejected-jobs"
                onClick={() => setShowRejected((value) => !value)}
              >
                {showRejected
                  ? 'Ocultar vagas descartadas'
                  : `Ver ${rejectedResults.length} ${rejectedResults.length === 1 ? 'vaga descartada' : 'vagas descartadas'}`}
              </Button>
              {showRejected && (
                <div id="rejected-jobs" className="mt-4 space-y-4">
                  {rejectedResults.map((result) => (
                    <JobCard
                      key={result.job.id}
                      result={result}
                      status={statuses[result.job.id] ?? 'new'}
                      companyName={companyNames[result.job.targetCompanyId]}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </section>
  );
}
