'use client';

import { Surface } from '@feitoza-ui/core';

import type { JobNotificationEvent } from '@/features/job-notifications/types';

export function NotificationCandidatesSummary({ events }: { events: JobNotificationEvent[] }) {
  const count = (status: JobNotificationEvent['status']) =>
    events.filter((event) => event.status === status).length;
  return (
    <Surface className="mt-6 p-5" aria-labelledby="notification-candidates-heading">
      <h2 id="notification-candidates-heading" className="text-lg font-semibold">
        Candidatos de notificacao
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Eventos deterministas para vagas novas e elegiveis. A entrega Telegram e processada por
        worker protegido.
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-slate-600 dark:text-slate-300">Pendentes</dt>
          <dd className="text-lg font-semibold">{count('pending')}</dd>
        </div>
        <div>
          <dt className="text-slate-600 dark:text-slate-300">Entregues</dt>
          <dd className="text-lg font-semibold">{count('delivered')}</dd>
        </div>
        <div>
          <dt className="text-slate-600 dark:text-slate-300">Falhos</dt>
          <dd className="text-lg font-semibold">{count('failed')}</dd>
        </div>
      </dl>
      {events[0]?.errorClassification && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Última classificação de falha: {events[0].errorClassification}.
        </p>
      )}
    </Surface>
  );
}
