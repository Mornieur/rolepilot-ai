import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => ({ user: vi.fn(), load: vi.fn(), redirect: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: deps.redirect }));
vi.mock('@/features/auth/server/auth', () => ({ requirePageUser: deps.user }));
vi.mock('@/features/job-notifications/server/load-notification-diagnostics', () => ({
  loadNotificationDiagnostics: deps.load,
}));
vi.mock('@/features/job-notifications/components/notification-diagnostics-dashboard', () => ({
  NotificationDiagnosticsDashboard: ({
    diagnostics,
  }: {
    diagnostics: { counts: { pending: number } };
  }) => <div>Pending: {diagnostics.counts.pending}</div>,
}));
import NotificationDiagnosticsPage from './page';

describe('NotificationDiagnosticsPage', () => {
  beforeEach(() => vi.clearAllMocks());
  it('loads aggregate diagnostics only after the admin server boundary', async () => {
    deps.user.mockResolvedValue({ id: 'admin', role: 'admin' });
    deps.load.mockResolvedValue({ counts: { pending: 3 } });
    render(await NotificationDiagnosticsPage());
    expect(screen.getByText('Pending: 3')).toBeInTheDocument();
    expect(deps.load).toHaveBeenCalledOnce();
  });
  it('denies normal and anonymous users before loading outbox data', async () => {
    deps.user.mockResolvedValue({ id: 'user', role: 'user' });
    deps.redirect.mockImplementation(() => {
      throw new Error('redirect');
    });
    await expect(NotificationDiagnosticsPage()).rejects.toThrow('redirect');
    deps.user.mockRejectedValue(new Error('login redirect'));
    await expect(NotificationDiagnosticsPage()).rejects.toThrow('login redirect');
    expect(deps.load).not.toHaveBeenCalled();
  });
});
