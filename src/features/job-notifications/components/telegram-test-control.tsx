'use client';

import { useActionState } from 'react';
import { Alert, Button } from '@/components/feitoza-ui';
import { sendTelegramTestAction } from '@/features/job-notifications/actions';
import { initialTelegramTestActionState } from '@/features/job-notifications/telegram-test-action-state';

export function TelegramTestControl() {
  const [state, action, pending] = useActionState(
    sendTelegramTestAction,
    initialTelegramTestActionState,
  );
  return (
    <section className="mt-6" aria-labelledby="telegram-test-heading">
      <h2 id="telegram-test-heading" className="text-lg font-semibold">
        Teste de integração
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Envia somente a mensagem de teste configurada; não cria vaga, matching, decisão ou evento de
        outbox.
      </p>
      <form action={action} className="mt-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Enviando teste…' : 'Enviar mensagem de teste'}
        </Button>
      </form>
      {state.status !== 'idle' && (
        <Alert
          className="mt-3"
          variant={state.status === 'success' ? 'success' : 'danger'}
          role="status"
        >
          {state.message}
        </Alert>
      )}
    </section>
  );
}
