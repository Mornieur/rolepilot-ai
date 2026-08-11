import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

describe('Telegram test Server Action boundary', () => {
  it('exports only async functions from the module-level use server file', async () => {
    const source = readFileSync(
      join(process.cwd(), 'src/features/job-notifications/actions.ts'),
      'utf8',
    );
    const declarations = [...source.matchAll(/^export\s+(.+)$/gm)].map((match) => match[1]);
    expect(source).toMatch(/^'use server';/);
    expect(declarations).toEqual(['async function sendTelegramTestAction(']);

    const exports = await import('./actions');
    expect(
      Object.values(exports).every(
        (value) => typeof value === 'function' && value.constructor.name === 'AsyncFunction',
      ),
    ).toBe(true);
  });
});
