'use client';

import { useActionState } from 'react';
import { Alert, Button, Surface } from '@/components/feitoza-ui';
import { runCollectionNowAction } from '@/features/job-collection/actions';
import type { CollectionRunResult } from '@/features/job-collection/types';

type CollectionActionState =
  { ok: null } | { ok: true; result: CollectionRunResult } | { ok: false; message: string };
const initial: CollectionActionState = { ok: null };
export function CollectionControl({
  lastRun,
}: {
  lastRun?: {
    trigger: string;
    status: string;
    started_at: string;
    created_count: number;
    companies_failed: number;
  } | null;
}) {
  const [state, action, pending] = useActionState(runCollectionNowAction, initial);
  const result = state.ok === true ? state.result : null;
  return (
    <Surface className="mt-6 p-5" aria-labelledby="collection-control-heading">
      <h2 id="collection-control-heading" className="text-lg font-semibold">
        Coleta de vagas
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        A coleta consulta empresas Greenhouse habilitadas; não analisa vagas com IA nem envia
        notificações.
      </p>
      <form action={action} className="mt-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Coletando vagas…' : 'Executar coleta agora'}
        </Button>
      </form>
      {pending && (
        <p className="mt-2 text-sm" role="status">
          Coletando vagas…
        </p>
      )}
      {result && (
        <Alert
          className="mt-3"
          variant={
            result.status === 'partial'
              ? 'warning'
              : result.status === 'failed'
                ? 'danger'
                : 'success'
          }
          title={
            result.status === 'partial'
              ? 'Coleta parcial'
              : result.status === 'failed'
                ? 'Coleta falhou'
                : 'Coleta concluída'
          }
        >
          <span role="status">
            {result.companiesSucceeded} empresas processadas · {result.created} novas ·{' '}
            {result.updated} atualizadas · {result.unchanged} sem alteração ·{' '}
            {result.companiesFailed} falhas.
          </span>
        </Alert>
      )}
      {state.ok === false && (
        <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
          {state.message}
        </p>
      )}
      {lastRun ? (
        <p className="mt-4 text-sm" role="status">
          Última coleta: {new Date(lastRun.started_at).toLocaleString('pt-BR')} ·{' '}
          {lastRun.trigger === 'scheduled' ? 'agendada' : 'manual'} ·{' '}
          {lastRun.status === 'success'
            ? 'sucesso'
            : lastRun.status === 'partial'
              ? 'parcial'
              : 'falhou'}{' '}
          · {lastRun.created_count} novas · {lastRun.companies_failed} falhas.
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300" role="status">
          Nenhuma coleta foi executada ainda.
        </p>
      )}
    </Surface>
  );
}
