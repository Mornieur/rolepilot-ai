'use client';

import Link from 'next/link';
import { startTransition, useMemo, useState } from 'react';
import { Badge, Button, Card, EmptyState, Select, Surface } from '@/components/feitoza-ui';
import { saveJobStatusAction } from '@/features/job-actions/actions';
import { initialJobStatusActionState } from '@/features/job-actions/action-state';
import { inboxWarnings, whyMatches } from '@/features/opportunity-inbox/inbox';
import type {
  InboxOpportunity,
  InboxSummary,
  OpportunityPriority,
} from '@/features/opportunity-inbox/types';
import type { JobUserStatus } from '@/types/domain';

const priorityLabels = { excellent: 'Excelente', good: 'Boa', review: 'Revisar' } as const;
const decisionLabels = {
  new: 'Sem decisão',
  saved: 'Salva',
  applied: 'Candidatei',
  ignored: 'Ignorada',
  rejected: 'Rejeitada',
} as const;
const workModelLabels = { remote: 'Remoto', hybrid: 'Híbrido', 'on-site': 'Presencial' } as const;

function relativeDate(value: string) {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000));
  if (hours < 1) return 'descoberta há menos de uma hora';
  if (hours < 24) return `descoberta há ${hours}h`;
  return `descoberta em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value))}`;
}

function OpportunityActions({
  opportunity,
  onDecision,
}: {
  opportunity: InboxOpportunity;
  onDecision: (status: JobUserStatus) => void;
}) {
  const [pending, setPending] = useState<JobUserStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const actions: { status: Exclude<JobUserStatus, 'new'>; label: string }[] = [
    { status: 'saved', label: 'Salvar' },
    { status: 'applied', label: 'Candidatei' },
    { status: 'ignored', label: 'Ignorar' },
    { status: 'rejected', label: 'Não tenho interesse' },
  ];
  function submit(status: Exclude<JobUserStatus, 'new'>) {
    setPending(status);
    setMessage(null);
    const formData = new FormData();
    formData.set('profileId', opportunity.profileId);
    formData.set('jobId', opportunity.job.id);
    formData.set('status', status);
    startTransition(async () => {
      const result = await saveJobStatusAction(initialJobStatusActionState, formData);
      setPending(null);
      setMessage(result.message ?? null);
      if (
        result.status === 'success' &&
        result.current &&
        ['new', 'saved', 'ignored', 'applied', 'rejected'].includes(result.current)
      )
        onDecision(result.current as JobUserStatus);
    });
  }
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2" aria-label={`Ações para ${opportunity.job.title}`}>
        {actions.map((action) => (
          <Button
            key={action.status}
            type="button"
            variant={opportunity.decision === action.status ? 'primary' : 'secondary'}
            disabled={pending !== null}
            aria-pressed={opportunity.decision === action.status}
            onClick={() => submit(action.status)}
          >
            {pending === action.status ? 'Salvando…' : action.label}
          </Button>
        ))}
      </div>
      {message && (
        <p className="mt-2 text-sm" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function OpportunityCard({
  opportunity,
  onDecision,
}: {
  opportunity: InboxOpportunity;
  onDecision: (status: JobUserStatus) => void;
}) {
  const why = whyMatches(opportunity);
  const warnings = inboxWarnings(opportunity);
  const workModels = opportunity.workModelMatch.detectedModels.filter(
    (model): model is keyof typeof workModelLabels => model in workModelLabels,
  );
  return (
    <article>
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold">{opportunity.job.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {opportunity.companyName} · {opportunity.job.location ?? 'Localização não informada'}
              {workModels.length
                ? ` · ${workModels.map((model) => workModelLabels[model]).join(', ')}`
                : ''}
            </p>
          </div>
          <Badge variant="success">{opportunity.score}/100</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Resumo da oportunidade">
          {opportunity.isNew && <Badge variant="info">Nova</Badge>}
          <Badge variant={opportunity.priority === 'excellent' ? 'success' : 'primary'}>
            {priorityLabels[opportunity.priority]}
          </Badge>
          <Badge variant={opportunity.decision === 'new' ? 'neutral' : 'primary'}>
            {decisionLabels[opportunity.decision]}
          </Badge>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {relativeDate(opportunity.job.firstSeenAt)}
        </p>
        {opportunity.matchedRequiredKeywords.length > 0 && (
          <p className="mt-3 text-sm">
            <strong>Obrigatórias:</strong> {opportunity.matchedRequiredKeywords.join(', ')}
          </p>
        )}
        {opportunity.matchedPreferredKeywords.length > 0 && (
          <p className="mt-1 text-sm">
            <strong>Desejáveis:</strong> {opportunity.matchedPreferredKeywords.join(', ')}
          </p>
        )}
        {why && <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{why}</p>}
        {warnings.length > 0 && (
          <section
            className="mt-3 border-l-4 border-amber-500 pl-3"
            aria-label="Atenção antes de decidir"
          >
            <h4 className="text-sm font-semibold">Atenção</h4>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        )}
        <OpportunityActions opportunity={opportunity} onDecision={onDecision} />
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
          <Link
            href={`/opportunities/${encodeURIComponent(opportunity.job.id)}?profileId=${encodeURIComponent(opportunity.profileId)}`}
            className="text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
          >
            Ver oportunidade
          </Link>
          <a
            href={opportunity.job.originalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
          >
            Abrir fonte <span className="sr-only">(abre em nova aba)</span>
          </a>
        </div>
      </Card>
    </article>
  );
}

export function OpportunityInbox({
  profileId,
  opportunities: initialOpportunities,
  summary,
}: {
  profileId: string;
  opportunities: InboxOpportunity[];
  summary: InboxSummary;
}) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [status, setStatus] = useState('actionable');
  const [priority, setPriority] = useState<'all' | OpportunityPriority>('all');
  const [company, setCompany] = useState('all');
  const companies = [
    ...new Set(opportunities.map((opportunity) => opportunity.companyName)),
  ].sort();
  const visible = useMemo(
    () =>
      opportunities.filter(
        (opportunity) =>
          (status === 'actionable'
            ? ['new', 'saved'].includes(opportunity.decision)
            : status === 'all' || opportunity.decision === status) &&
          (priority === 'all' || opportunity.priority === priority) &&
          (company === 'all' || opportunity.companyName === company),
      ),
    [company, opportunities, priority, status],
  );
  function decisionChanged(jobId: string, decision: JobUserStatus) {
    setOpportunities((current) =>
      current.map((opportunity) =>
        opportunity.job.id === jobId ? { ...opportunity, decision } : opportunity,
      ),
    );
  }
  const empty =
    status === 'saved'
      ? 'Você ainda não salvou oportunidades.'
      : status === 'new'
        ? 'Nenhuma oportunidade sem decisão no momento.'
        : status === 'actionable'
          ? 'Nenhuma oportunidade sem decisão ou salva no momento.'
          : 'Nenhuma oportunidade compatível no momento.';
  return (
    <section className="mt-6" aria-labelledby="inbox-heading">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo diário">
        {[
          [summary.compatible, 'oportunidades compatíveis'],
          [summary.new, 'novas'],
          [summary.saved, 'salvas'],
          [summary.excellent, 'excelentes'],
        ].map(([count, label]) => (
          <Surface key={String(label)} className="p-4">
            <strong className="text-2xl">{count}</strong>
            <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
          </Surface>
        ))}
      </div>
      <Surface className="mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            fullWidth
          >
            <option value="actionable">Sem decisão e salvas</option>
            <option value="new">Sem decisão</option>
            <option value="saved">Salvas</option>
            <option value="applied">Candidatei</option>
            <option value="ignored">Ignoradas</option>
            <option value="rejected">Rejeitadas</option>
            <option value="all">Todas compatíveis</option>
          </Select>
          <Select
            label="Prioridade"
            value={priority}
            onChange={(event) => setPriority(event.target.value as 'all' | OpportunityPriority)}
            fullWidth
          >
            <option value="all">Todas</option>
            <option value="excellent">Excelente</option>
            <option value="good">Boa</option>
            <option value="review">Revisar</option>
          </Select>
          <Select
            label="Empresa"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            fullWidth
          >
            <option value="all">Todas</option>
            {companies.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      </Surface>
      <h2 id="inbox-heading" className="mt-8 text-xl font-semibold">
        Oportunidades para revisar
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Ordenadas por prioridade e, dentro de cada grupo, por descoberta mais recente.
      </p>
      {visible.length ? (
        <div className="mt-4 space-y-4">
          {visible.map((opportunity) => (
            <OpportunityCard
              key={opportunity.job.id}
              opportunity={opportunity}
              onDecision={(decision) => decisionChanged(opportunity.job.id, decision)}
            />
          ))}
        </div>
      ) : (
        <EmptyState className="mt-4" title={empty} />
      )}
      <input type="hidden" value={profileId} readOnly aria-hidden="true" />
    </section>
  );
}
