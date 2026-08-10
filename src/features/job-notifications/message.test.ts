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
});
