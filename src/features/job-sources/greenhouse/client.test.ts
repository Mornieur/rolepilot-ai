import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { fetchGreenhouseJobs, greenhouseJobsUrl } from './client';
import { GreenhouseError } from './errors';
import type { TargetCompany } from '@/types/domain';

const company: TargetCompany = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Example',
  provider: 'greenhouse',
  boardIdentifier: 'Example_Board',
  enabled: true,
  priority: 'normal',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

afterEach(() => vi.unstubAllGlobals());

describe('Greenhouse client', () => {
  it('constructs an official HTTPS API URL and rejects unsafe board identifiers', () => {
    expect(greenhouseJobsUrl('Example_Board')).toBe(
      'https://boards-api.greenhouse.io/v1/boards/example_board/jobs?content=true',
    );
    expect(() => greenhouseJobsUrl('https://evil.test')).toThrow(GreenhouseError);
    expect(() => greenhouseJobsUrl('board/name')).toThrow(GreenhouseError);
  });

  it('maps a successful no-store connector response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          jobs: [
            {
              id: 1,
              title: 'Engineer',
              absolute_url: 'https://boards.greenhouse.io/example/jobs/1',
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchGreenhouseJobs(company)).resolves.toMatchObject({
      total: 1,
      jobs: [{ externalId: '1' }],
    });
    expect(fetchMock.mock.calls[0][0]).toContain('boards-api.greenhouse.io');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: 'no-store' });
  });

  it('returns safe errors for non-success responses, timeout, and malformed payloads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(fetchGreenhouseJobs(company)).rejects.toMatchObject({ code: 'not-found' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(fetchGreenhouseJobs(company)).rejects.toMatchObject({ code: 'unavailable' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError')),
    );
    await expect(fetchGreenhouseJobs(company)).rejects.toMatchObject({ code: 'timeout' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{', { status: 200 })));
    await expect(fetchGreenhouseJobs(company)).rejects.toMatchObject({ code: 'invalid-response' });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ unexpected: true }), { status: 200 })),
    );
    await expect(fetchGreenhouseJobs(company)).rejects.toMatchObject({ code: 'invalid-response' });
  });
});
