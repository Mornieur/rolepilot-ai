import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('browser secret boundary', () => {
  it('does not use server credentials through NEXT_PUBLIC_ environment variables', () => {
    const source = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8');
    expect(source).not.toMatch(
      /NEXT_PUBLIC_(SUPABASE_SERVICE_ROLE_KEY|SCHEDULER_SECRET|NOTIFICATION_WORKER_SECRET|TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID|PERSONAL_ACCESS_SECRET|GEMINI_API_KEY)=/,
    );
  });

  it('keeps the service role and scheduler credentials in server-only modules', () => {
    const supabase = readFileSync(
      resolve(process.cwd(), 'src/features/profiles/server/supabase.ts'),
      'utf8',
    );
    const scheduler = readFileSync(
      resolve(process.cwd(), 'src/app/api/collection/scheduled/route.ts'),
      'utf8',
    );
    expect(supabase).toContain("import 'server-only'");
    expect(scheduler).not.toContain("'use client'");
    expect(scheduler).toContain('process.env.SCHEDULER_SECRET');
    const notificationWorker = readFileSync(
      resolve(process.cwd(), 'src/app/api/notifications/deliver/route.ts'),
      'utf8',
    );
    expect(notificationWorker).not.toContain("'use client'");
    expect(notificationWorker).toContain('process.env.NOTIFICATION_WORKER_SECRET');
  });
});
