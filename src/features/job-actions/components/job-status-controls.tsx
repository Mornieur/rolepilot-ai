'use client';

import { useActionState, useState } from 'react';
import { Button } from '@feitoza-ui/core';
import { saveJobStatusAction } from '@/features/job-actions/actions';
import { initialJobStatusActionState } from '@/features/job-actions/action-state';

export function JobStatusControls({
  profileId,
  jobId,
  currentStatus = 'new',
}: {
  profileId: string;
  jobId: string;
  currentStatus?: string;
}) {
  const [state, action, pending] = useActionState(saveJobStatusAction, initialJobStatusActionState);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const current = state.current ?? currentStatus;
  const labels = {
    saved: 'Salvar',
    ignored: 'Ignorar',
    applied: 'Candidatada',
    rejected: 'Rejeitada',
  } as const;
  const selectedLabels = {
    saved: '✓ Salva',
    ignored: 'Ignorada',
    applied: 'Candidatada',
    rejected: 'Rejeitada',
  } as const;
  const stateLabels = {
    new: 'nova',
    saved: 'salva',
    ignored: 'ignorada',
    applied: 'candidatada',
    rejected: 'rejeitada',
  } as const;
  const pendingLabels = {
    saved: 'Salvando…',
    ignored: 'Ignorando…',
    applied: 'Marcando candidatura…',
    rejected: 'Rejeitando…',
  } as const;
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="jobId" value={jobId} />
      <h4 className="text-sm font-semibold">Sua decisão</h4>
      <p className="mt-1 text-sm" role="status">
        Estado atual: {stateLabels[current as keyof typeof stateLabels] ?? current}
      </p>
      <div className="mt-2 flex flex-wrap gap-2" aria-label="Sua decisão">
        {['saved', 'ignored', 'applied', 'rejected'].map((status) => (
          <Button
            key={status}
            type="submit"
            name="status"
            value={status}
            disabled={pending && pendingStatus === status}
            aria-pressed={current === status}
            variant={current === status ? 'primary' : 'secondary'}
            className="capitalize"
            onClick={() => setPendingStatus(status)}
          >
            {pending && pendingStatus === status
              ? pendingLabels[status as keyof typeof pendingLabels]
              : current === status
                ? selectedLabels[status as keyof typeof selectedLabels]
                : labels[status as keyof typeof labels]}
          </Button>
        ))}
      </div>
      {pending && pendingStatus && (
        <p className="mt-1 text-sm" role="status">
          {pendingLabels[pendingStatus as keyof typeof pendingLabels]}
        </p>
      )}
      {state.status === 'success' && (
        <p className="mt-1 text-sm" role="status">
          {state.message}
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">
          {state.message}
        </p>
      )}
    </form>
  );
}
