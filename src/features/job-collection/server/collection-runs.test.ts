import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => ({ rpc: vi.fn(), maybeSingle: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/features/profiles/server/supabase', () => ({
  getSupabaseServerClient: () => ({ rpc: deps.rpc }),
}));

import {
  COLLECTION_RUN_STALE_AFTER_MS,
  CollectionAlreadyRunningError,
  startCollectionRun,
} from './collection-runs';

describe('collection run acquisition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-11T18:30:00Z'));
    deps.rpc.mockReset().mockReturnValue({ maybeSingle: deps.maybeSingle });
    deps.maybeSingle.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('treats a recent running run as a controlled overlap', async () => {
    deps.maybeSingle.mockResolvedValue({ data: { run_id: null, acquired: false }, error: null });
    await expect(startCollectionRun('scheduled')).rejects.toBeInstanceOf(
      CollectionAlreadyRunningError,
    );
  });

  it('requests atomic stale recovery with a five-minute boundary before acquisition', async () => {
    deps.maybeSingle.mockResolvedValue({
      data: { run_id: 'new-run', acquired: true },
      error: null,
    });
    await expect(startCollectionRun('scheduled')).resolves.toEqual({ id: 'new-run' });
    expect(deps.rpc).toHaveBeenCalledWith('acquire_collection_run', {
      p_trigger: 'scheduled',
      p_stale_before: new Date(Date.now() - COLLECTION_RUN_STALE_AFTER_MS).toISOString(),
    });
  });

  it('allows exactly one caller to acquire a new running row when concurrent callers race', async () => {
    deps.maybeSingle
      .mockResolvedValueOnce({ data: { run_id: 'new-run', acquired: true }, error: null })
      .mockResolvedValueOnce({ data: { run_id: null, acquired: false }, error: null });
    const results = await Promise.allSettled([
      startCollectionRun('scheduled'),
      startCollectionRun('scheduled'),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
  });

  it('keeps a unique-index race as controlled overlap semantics', async () => {
    deps.maybeSingle.mockResolvedValue({ data: { run_id: null, acquired: false }, error: null });
    await expect(startCollectionRun('manual')).rejects.toBeInstanceOf(
      CollectionAlreadyRunningError,
    );
  });

  it('defines stale recovery as failed with finished_at while preserving stored counters', () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        'supabase/migrations/202608110002_acquire_collection_run_with_stale_recovery.sql',
      ),
      'utf8',
    );
    expect(migration).toMatch(/set status = 'failed', finished_at = now\(\)/);
    expect(migration).toMatch(/where status = 'running' and started_at < p_stale_before/);
    expect(migration).not.toMatch(/companies_attempted|created_count|company_results/);
  });
});
