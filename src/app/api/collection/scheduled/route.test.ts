import { beforeEach, describe, expect, it, vi } from 'vitest';
const run = vi.hoisted(() => vi.fn());
const overlap = vi.hoisted(() => class CollectionAlreadyRunningError extends Error {});
vi.mock('server-only', () => ({}));
vi.mock('@/features/job-collection/server/run-collection', () => ({ runCollection: run }));
vi.mock('@/features/job-collection/server/collection-runs', () => ({
  CollectionAlreadyRunningError: overlap,
}));
import { POST } from './route';
describe('scheduled collection route', () => {
  beforeEach(() => {
    process.env.SCHEDULER_SECRET = 'secret';
    run.mockReset().mockResolvedValue({ status: 'success', created: 2, companiesFailed: 0 });
  });
  it('rejects missing, malformed and wrong authorization', async () => {
    for (const header of [undefined, 'Basic secret', 'Bearer wrong']) {
      const response = await POST(
        new Request('http://test', {
          method: 'POST',
          headers: header ? { authorization: header } : {},
        }),
      );
      expect(response.status).toBe(401);
    }
    expect(run).not.toHaveBeenCalled();
  });
  it('runs exactly once with the scheduled trigger and ignores the body', async () => {
    const response = await POST(
      new Request('http://test', {
        method: 'POST',
        headers: { authorization: 'Bearer secret' },
        body: JSON.stringify({ url: 'https://bad', jobs: [] }),
      }),
    );
    expect(response.status).toBe(200);
    expect(run).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledWith('scheduled');
    expect(JSON.stringify(await response.json())).not.toContain('secret');
  });
  it('returns a controlled failure', async () => {
    run.mockRejectedValueOnce(new Error('internal'));
    expect(
      (
        await POST(
          new Request('http://test', {
            method: 'POST',
            headers: { authorization: 'Bearer secret' },
          }),
        )
      ).status,
    ).toBe(503);
  });
  it('maps an overlapping run to 409 without retrying or exposing the secret', async () => {
    run.mockRejectedValueOnce(new overlap());
    const response = await POST(
      new Request('http://test', { method: 'POST', headers: { authorization: 'Bearer secret' } }),
    );
    expect(response.status).toBe(409);
    expect(JSON.stringify(await response.json())).not.toContain('secret');
    expect(run).toHaveBeenCalledOnce();
  });
});
