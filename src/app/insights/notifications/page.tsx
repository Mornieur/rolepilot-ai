import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Alert } from '@/components/feitoza-ui';
import { PageContainer, PageContent, PageHeader } from '@/components/page-layout';
import { requirePageUser } from '@/features/auth/server/auth';
import { NotificationDiagnosticsDashboard } from '@/features/job-notifications/components/notification-diagnostics-dashboard';
import { loadNotificationDiagnostics } from '@/features/job-notifications/server/load-notification-diagnostics';

export const dynamic = 'force-dynamic';

export default async function NotificationDiagnosticsPage() {
  const user = await requirePageUser();
  if (user.role !== 'admin') redirect('/insights');
  const result = await loadNotificationDiagnostics()
    .then((diagnostics) => ({ diagnostics }))
    .catch(() => ({ diagnostics: null }));
  return (
    <PageContainer>
      <PageContent>
        <PageHeader
          title="Notificações"
          description="Diagnóstico operacional administrativo da entrega Telegram."
          actions={<Link href="/insights">Voltar aos insights</Link>}
        />
        {result.diagnostics ? (
          <NotificationDiagnosticsDashboard diagnostics={result.diagnostics} />
        ) : (
          <Alert variant="danger" title="Diagnóstico indisponível" role="alert">
            Não foi possível carregar o diagnóstico de notificações agora.
          </Alert>
        )}
      </PageContent>
    </PageContainer>
  );
}
