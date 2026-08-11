import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { proxy } from './proxy';

describe('Supabase Auth access proxy', () => {
  it('redirects an unauthenticated app route to login without an HTTP Basic challenge', () => {
    const response = proxy(new NextRequest('https://rolepilot.example/jobs'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://rolepilot.example/login');
    expect(response.headers.get('www-authenticate')).toBeNull();
  });

  it('allows the login route without a Supabase session', () => {
    const response = proxy(new NextRequest('https://rolepilot.example/login'));

    expect(response.status).toBe(200);
    expect(response.headers.get('www-authenticate')).toBeNull();
  });

  it('allows an authenticated user without a Basic Authorization header', () => {
    const response = proxy(
      new NextRequest('https://rolepilot.example/jobs', {
        headers: { cookie: 'rolepilot-access-token=session' },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('www-authenticate')).toBeNull();
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
