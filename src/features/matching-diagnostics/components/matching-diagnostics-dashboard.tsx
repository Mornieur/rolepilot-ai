import Link from 'next/link';
import { Badge, Card, EmptyState } from '@/components/feitoza-ui';
import type { DiagnosticJob, MatchingDiagnostics } from '../types';

const decisionLabel = {
  new: 'Sem decisão',
  saved: 'Salva',
  applied: 'Candidatada',
  ignored: 'Ignorada',
  rejected: 'Rejeitada',
};
const percent = (value: number) => `${Math.round(value * 100)}%`;

function CountList({
  items,
  empty = 'Sem ocorrências na amostra.',
}: {
  items: { label: string; count: number; percentage?: number }[];
  empty?: string;
}) {
  if (!items.length)
    return <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{empty}</p>;
  return (
    <ul className="mt-3 space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.label} className="flex justify-between gap-4">
          <span>{item.label}</span>
          <span className="font-medium">
            {item.count}
            {item.percentage !== undefined ? ` · ${percent(item.percentage)}` : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}
function JobRow({
  job,
  profileId,
  rejected = false,
}: {
  job: DiagnosticJob;
  profileId: string;
  rejected?: boolean;
}) {
  return (
    <article className="border-t border-slate-200 py-4 first:border-t-0 dark:border-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{job.job.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {job.companyName} · {job.job.location ?? 'Localização não informada'}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={rejected ? 'neutral' : 'success'}>{job.score}/100</Badge>
          <Badge variant={job.decision === 'new' ? 'neutral' : 'primary'}>
            {decisionLabel[job.decision]}
          </Badge>
        </div>
      </div>
      <p className="mt-2 text-sm">
        {rejected
          ? `Bloqueios: ${job.hardReasonCodes.map((code) => ({ title: 'Cargo incompatível', required: 'Skills obrigatórias insuficientes', excluded: 'Skill excluída', 'work-model': 'Modelo incompatível' })[code] ?? code).join(' · ')}`
          : `Obrigatórias: ${job.matchedRequiredKeywords.join(', ') || 'nenhuma'} · Preferenciais: ${job.matchedPreferredKeywords.join(', ') || 'nenhuma'}`}
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Senioridade: {job.seniorityMatch.detectedSeniorities.join(', ') || 'desconhecida'} · Modelo:{' '}
        {job.workModelMatch.detectedModels.join(', ') || 'desconhecido'}
        {job.warningCodes.length ? ` · Alertas: ${job.warningCodes.join(', ')}` : ''}
      </p>
      {job.exactlyOneHardRule && rejected && (
        <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200">
          Bloqueada por exatamente uma regra dura.
        </p>
      )}
      <p className="mt-2 text-sm">
        <Link
          className="text-sky-700 underline underline-offset-4 dark:text-cyan-300"
          href={`/jobs/evaluate?profileId=${profileId}`}
        >
          Abrir avaliação
        </Link>
        {' · '}
        <a
          className="text-sky-700 underline underline-offset-4 dark:text-cyan-300"
          href={job.job.originalUrl}
          target="_blank"
          rel="noreferrer"
        >
          Abrir fonte<span className="sr-only"> (abre em nova aba)</span>
        </a>
      </p>
    </article>
  );
}
function JobGroup({
  title,
  description,
  jobs,
  profileId,
  rejected,
}: {
  title: string;
  description: string;
  jobs: DiagnosticJob[];
  profileId: string;
  rejected?: boolean;
}) {
  return (
    <section className="mt-8" aria-labelledby={title}>
      <h2 id={title} className="text-xl font-semibold">
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      <Card className="mt-4 p-4">
        {jobs.length ? (
          jobs.map((job) => (
            <JobRow key={job.job.id} job={job} profileId={profileId} rejected={rejected} />
          ))
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sem candidatos na amostra atual.
          </p>
        )}
      </Card>
    </section>
  );
}

export function MatchingDiagnosticsDashboard({
  diagnostics,
}: {
  diagnostics: MatchingDiagnostics;
}) {
  const metrics = diagnostics.jobs;
  return (
    <div className="mt-6">
      <section aria-labelledby="resumo">
        <h2 id="resumo" className="text-xl font-semibold">
          Resumo
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Vagas persistidas', metrics.total],
            ['Ativas', metrics.active],
            ['Inativas/fechadas', metrics.inactive],
            ['Compatíveis', `${metrics.eligible} · ${percent(diagnostics.eligibleRate)}`],
            ['Descartadas', metrics.rejected],
          ].map(([label, value]) => (
            <Card key={String(label)} className="p-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </Card>
          ))}
        </div>
        <Card className="mt-4 p-4">
          <h3 className="font-semibold">Por empresa</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {diagnostics.byCompany.map((company) => (
              <li key={company.company} className="flex justify-between gap-3">
                <span>{company.company}</span>
                <span>
                  {company.eligible} compatíveis · {company.rejected} descartadas
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
      {metrics.total === 0 ? (
        <EmptyState
          className="mt-6"
          title="Não há vagas persistidas para diagnosticar"
          description="A página não altera a coleta nem as regras de matching."
        />
      ) : (
        <>
          <section className="mt-8 grid gap-4 lg:grid-cols-3">
            <Card className="p-4">
              <h2 className="text-lg font-semibold">Distribuição de pontuação</h2>
              <CountList items={diagnostics.scoreBuckets} />
            </Card>
            <Card className="p-4">
              <h2 className="text-lg font-semibold">Motivos de descarte</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Uma vaga pode contribuir para mais de um bloqueio.
              </p>
              <CountList items={diagnostics.rejectionReasons} />
            </Card>
            <Card className="p-4">
              <h2 className="text-lg font-semibold">Alertas</h2>
              <CountList items={diagnostics.warnings} />
            </Card>
          </section>
          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h2 className="text-lg font-semibold">Modelo de trabalho detectado</h2>
              <CountList items={diagnostics.workModels} />
            </Card>
            <Card className="p-4">
              <h2 className="text-lg font-semibold">Senioridade detectada</h2>
              <CountList items={diagnostics.seniorities} />
            </Card>
          </section>
          <JobGroup
            title="Top oportunidades compatíveis"
            description="Até 20 vagas, na ordenação determinística existente."
            jobs={diagnostics.topEligible}
            profileId={diagnostics.profile.id}
          />
          <JobGroup
            title="Rejeitadas por pouco"
            description="Até 30 descartadas por pontuação; destaque para uma única regra dura."
            jobs={diagnostics.borderlineRejected}
            profileId={diagnostics.profile.id}
            rejected
          />
          <JobGroup
            title="Possíveis falsos positivos"
            description="Sinais textuais diagnósticos em vagas compatíveis; não alteram a elegibilidade."
            jobs={diagnostics.falsePositives}
            profileId={diagnostics.profile.id}
          />
          <JobGroup
            title="Possíveis falsos negativos"
            description="Sinais frontend em vagas descartadas; não alteram a elegibilidade."
            jobs={diagnostics.falseNegatives}
            profileId={diagnostics.profile.id}
            rejected
          />
          <section className="mt-8" aria-labelledby="decisoes">
            <h2 id="decisoes" className="text-xl font-semibold">
              Decisões vs matching
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Amostra descritiva, sem aprendizado automático.
              {diagnostics.decisions.saved +
                diagnostics.decisions.applied +
                diagnostics.decisions.ignored +
                diagnostics.decisions.rejected <
              10
                ? ' Amostra pequena.'
                : ''}
            </p>
            <Card className="mt-4 p-4">
              <p className="text-sm">
                Decisões explícitas:{' '}
                {diagnostics.decisions.saved +
                  diagnostics.decisions.applied +
                  diagnostics.decisions.ignored +
                  diagnostics.decisions.rejected}{' '}
                · Salvas: {diagnostics.decisions.saved} · Candidatadas:{' '}
                {diagnostics.decisions.applied} · Ignoradas: {diagnostics.decisions.ignored} ·
                Rejeitadas: {diagnostics.decisions.rejected} · Sem decisão:{' '}
                {diagnostics.decisions.new}
              </p>
              <CountList
                items={diagnostics.decisionComparison.map((row) => ({
                  label: `${decisionLabel[row.decision]}: ${row.eligible} compatíveis · ${row.rejected} descartadas · média ${row.averageScore?.toFixed(1) ?? '—'}`,
                  count: row.count,
                }))}
              />
              <p className="mt-4 text-sm">
                Compatíveis: salvas {diagnostics.crossCheck['eligible-saved']}, candidatadas{' '}
                {diagnostics.crossCheck['eligible-applied']}, ignoradas{' '}
                {diagnostics.crossCheck['eligible-ignored']}, rejeitadas{' '}
                {diagnostics.crossCheck['eligible-rejected']}. Descartadas: salvas{' '}
                {diagnostics.crossCheck['rejected-saved']}, candidatadas{' '}
                {diagnostics.crossCheck['rejected-applied']}.
              </p>
            </Card>
          </section>
          <section className="mt-8">
            <h2 className="text-xl font-semibold">Sinais de qualidade</h2>
            <Card className="mt-4 p-4">
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                <li>Compatíveis revisadas: {diagnostics.qualitySignals.reviewedEligible}</li>
                <li>
                  Taxa manualmente interessante:{' '}
                  {percent(diagnostics.qualitySignals.manuallyInterestingEligibleRate)}
                </li>
                <li>
                  Compatíveis ignoradas/rejeitadas:{' '}
                  {diagnostics.qualitySignals.eligibleIgnoredOrRejected}
                </li>
                <li>
                  Descartadas salvas/candidatadas:{' '}
                  {diagnostics.qualitySignals.rejectedSavedOrApplied}
                </li>
                <li>
                  Bloqueio por cargo: {percent(diagnostics.qualitySignals.titleRejectionShare)}
                </li>
                <li>
                  Bloqueio por skills: {percent(diagnostics.qualitySignals.requiredRejectionShare)}
                </li>
                <li>
                  Bloqueio por modelo: {percent(diagnostics.qualitySignals.workModelRejectionShare)}
                </li>
                <li>
                  Alerta de senioridade: {percent(diagnostics.qualitySignals.seniorityWarningShare)}
                </li>
                <li>
                  Alerta de localização: {percent(diagnostics.qualitySignals.locationWarningShare)}
                </li>
                <li>
                  Alerta de cobertura parcial:{' '}
                  {percent(diagnostics.qualitySignals.partialSkillWarningShare)}
                </li>
              </ul>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
