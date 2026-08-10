import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { proxy } from './proxy';

const authorizationFor = (secret: string) =>
  `Basic ${Buffer.from(`rolepilot:${secret}`).toString('base64')}`;

describe('personal MVP access proxy', () => {
  const originalSecret = process.env.PERSONAL_ACCESS_SECRET;

  beforeEach(() => {
    process.env.PERSONAL_ACCESS_SECRET = 'test-secret';
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.PERSONAL_ACCESS_SECRET;
    else process.env.PERSONAL_ACCESS_SECRET = originalSecret;
  });

  it('blocks anonymous real-data routes with an HTTP Basic challenge', () => {
    const response = proxy(new NextRequest('https://rolepilot.example/jobs'));
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain('Basic');
  });

  it('redirects an authenticated-gate browser without a Supabase session to login', () => {
    const response = proxy(
      new NextRequest('https://rolepilot.example/jobs', {
        headers: { authorization: authorizationFor('test-secret') },
      }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://rolepilot.example/login');
  });

  it('allows a browser request with both temporary gate and session cookie', () => {
    const response = proxy(
      new NextRequest('https://rolepilot.example/jobs', {
        headers: {
          authorization: authorizationFor('test-secret'),
          cookie: 'rolepilot-access-token=session',
        },
      }),
    );
    expect(response.status).toBe(200);
  });

  it('does not apply user access protection to the separately authenticated scheduler route', () => {
    const response = proxy(new NextRequest('https://rolepilot.example/api/collection/scheduled'));
    expect(response.status).toBe(200);
  });

  it('does not apply user access protection to the separately authenticated notification worker', () => {
    const response = proxy(new NextRequest('https://rolepilot.example/api/notifications/deliver'));
    expect(response.status).toBe(200);
  });
});
