import { Surface } from '@/components/feitoza-ui';
import type { NotificationDiagnostics } from '@/features/job-notifications/server/load-notification-diagnostics';
import { TelegramTestControl } from '@/features/job-notifications/components/telegram-test-control';

const dateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('pt-BR') : 'Nunca registrado';

export function NotificationDiagnosticsDashboard({
  diagnostics,
}: {
  diagnostics: NotificationDiagnostics;
}) {
  return (
    <Surface className="mt-6 p-5" aria-labelledby="notification-diagnostics-heading">
      <h1 id="notification-diagnostics-heading" className="text-xl font-semibold">
        Diagnóstico de notificações
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Visão administrativa da outbox e do canal Telegram. Credenciais e identificadores não são
        exibidos.
      </p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div>
          <dt className="text-sm text-slate-600 dark:text-slate-300">Telegram</dt>
          <dd className="font-semibold">
            {diagnostics.telegramConfigured ? 'Configurado' : 'Não configurado'}
          </dd>
        </div>
        {(['pending', 'delivered', 'failed', 'skipped'] as const).map((status) => (
          <div key={status}>
            <dt className="text-sm text-slate-600 dark:text-slate-300">
              {status === 'pending'
                ? 'Pendentes'
                : status === 'delivered'
                  ? 'Entregues'
                  : status === 'failed'
                    ? 'Falhos'
                    : 'Não entregáveis'}
            </dt>
            <dd className="text-lg font-semibold">{diagnostics.counts[status]}</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-600 dark:text-slate-300">Último evento criado</dt>
          <dd>{dateTime(diagnostics.lastEventCreatedAt)}</dd>
        </div>
        <div>
          <dt className="text-slate-600 dark:text-slate-300">Última tentativa</dt>
          <dd>{dateTime(diagnostics.lastDeliveryAttemptAt)}</dd>
        </div>
        <div>
          <dt className="text-slate-600 dark:text-slate-300">Última entrega bem-sucedida</dt>
          <dd>{dateTime(diagnostics.lastSuccessfulDeliveryAt)}</dd>
        </div>
      </dl>
      <TelegramTestControl />
      <section className="mt-6" aria-labelledby="recent-notification-events-heading">
        <h2 id="recent-notification-events-heading" className="text-lg font-semibold">
          Eventos recentes
        </h2>
        {diagnostics.events.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-2">Vaga</th>
                  <th className="p-2">Perfil</th>
                  <th className="p-2">Canal</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Criado</th>
                  <th className="p-2">Entregue</th>
                  <th className="p-2">Falha segura</th>
                </tr>
              </thead>
              <tbody>
                {diagnostics.events.map((event) => (
                  <tr key={event.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-2">{event.jobTitle ?? 'Vaga indisponível'}</td>
                    <td className="p-2">{event.profileName ?? 'Perfil indisponível'}</td>
                    <td className="p-2">{event.channel ?? 'Ainda não selecionado'}</td>
                    <td className="p-2">{event.status}</td>
                    <td className="p-2">{dateTime(event.createdAt)}</td>
                    <td className="p-2">{event.deliveredAt ? dateTime(event.deliveredAt) : '—'}</td>
                    <td className="p-2">{event.errorClassification ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Nenhum evento registrado.
          </p>
        )}
      </section>
    </Surface>
  );
}
