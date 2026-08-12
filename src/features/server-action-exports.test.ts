import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const modules = [
  () => import('@/features/profiles/actions'),
  () => import('@/features/companies/actions'),
  () => import('@/features/job-actions/actions'),
  () => import('@/features/ai-job-analysis/actions'),
  () => import('@/features/job-collection/actions'),
  () => import('@/features/job-sources/greenhouse/actions'),
  () => import('@/features/opportunity-intelligence/actions'),
];

describe('dedicated use server modules', () => {
  it('expose only runtime functions', async () => {
    for (const load of modules) {
      const exports = await load();
      expect(Object.values(exports).every((value) => typeof value === 'function')).toBe(true);
    }
  }, 20_000);
});
