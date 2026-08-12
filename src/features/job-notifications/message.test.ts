import { describe, expect, it } from 'vitest';
import { formatTelegramJobNotification } from './message';

describe('Telegram message', () => {
  it('keeps provider content as plain text and bounds the Telegram payload', () => {
    const text = formatTelegramJobNotification(
      { profileId: 'profile-1', deterministicScore: 85, priority: 'excellent' } as never,
      {
        title: '<script>alert(1)</script>',
        location: 'Brasil\nRemoto',
        originalUrl: 'https://jobs.example/1',
      } as never,
      { name: 'Acme & Co' } as never,
    );
    expect(text).toContain('Cargo: <script>alert(1)</script>');
    expect(text).toContain('Local: Brasil Remoto');
    expect(text.length).toBeLessThanOrEqual(4096);
  });
  it('links a notified profile to its scoped opportunity detail', () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://rolepilot.example';
    const text = formatTelegramJobNotification(
      { profileId: 'profile-1', deterministicScore: 80, priority: 'excellent' } as never,
      {
        id: 'job-1',
        title: 'Frontend Engineer',
        location: null,
        originalUrl: 'https://jobs.example/1',
      } as never,
      null,
    );
    expect(text).toContain('https://rolepilot.example/opportunities/job-1?profileId=profile-1');
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  });
});
