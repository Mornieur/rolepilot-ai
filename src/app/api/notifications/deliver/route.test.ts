import { beforeEach, describe, expect, it, vi } from 'vitest';
const deliver = vi.hoisted(() => vi.fn());
vi.mock('server-only', () => ({}));
vi.mock('@/features/job-notifications/server/deliver-pending-notifications', () => ({
  deliverPendingNotifications: deliver,
}));
import { POST } from './route';
describe('notification delivery route', () => {
  beforeEach(() => {
    process.env.NOTIFICATION_WORKER_SECRET = 'worker-secret';
    deliver.mockReset().mockResolvedValue({ attempted: 1, delivered: 1, failed: 0, skipped: 0 });
  });
  it('requires the dedicated bearer secret and ignores the body', async () => {
    expect((await POST(new Request('http://test', { method: 'POST' }))).status).toBe(401);
    const response = await POST(
      new Request('http://test', {
        method: 'POST',
        headers: { authorization: 'Bearer worker-secret' },
        body: JSON.stringify({ chat_id: 'bad' }),
      }),
    );
    expect(response.status).toBe(200);
    expect(deliver).toHaveBeenCalledOnce();
    expect(JSON.stringify(await response.json())).not.toContain('worker-secret');
  });
});
