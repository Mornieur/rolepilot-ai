import { beforeEach, describe, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => ({
  companies: vi.fn(),
  fetch: vi.fn(),
  persist: vi.fn(),
  start: vi.fn(),
  finish: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/features/companies/server/target-companies', () => ({
  listTargetCompanies: deps.companies,
}));
vi.mock('@/features/job-sources/greenhouse/client', () => ({ fetchGreenhouseJobs: deps.fetch }));
vi.mock('@/features/jobs/server/persisted-jobs', () => ({ persistCollectedJobs: deps.persist }));
vi.mock('@/features/job-collection/server/collection-runs', () => ({
  startCollectionRun: deps.start,
  finishCollectionRun: deps.finish,
}));
vi.mock('@/features/job-sources/greenhouse/errors', () => ({
  GreenhouseError: class GreenhouseError extends Error {
    code = 'timeout';
  },
}));
import { runCollection } from './run-collection';

const greenhouse = {
  id: 'company-1',
  name: 'iFood',
  provider: 'greenhouse' as const,
  enabled: true,
};
const saved = { discovered: 3, created: 1, updated: 1, unchanged: 1, malformed: 0, skipped: 0 };
describe('runCollection', () => {
  beforeEach(() => {
    deps.companies.mockReset();
    deps.fetch.mockReset();
    deps.persist.mockReset();
    deps.start.mockReset().mockResolvedValue({ id: 'run-1' });
    deps.finish.mockReset().mockResolvedValue(undefined);
    deps.fetch.mockResolvedValue({ jobs: [], skippedJobs: 0 });
    deps.persist.mockResolvedValue(saved);
  });
  it('records a successful scheduled run and aggregates counts without AI or decisions', async () => {
    deps.companies.mockResolvedValue([greenhouse]);
    const result = await runCollection('scheduled');
    expect(result).toMatchObject({
      trigger: 'scheduled',
      status: 'success',
      companiesAttempted: 1,
      companiesSucceeded: 1,
      created: 1,
      updated: 1,
      unchanged: 1,
    });
    expect(deps.finish).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({
        companies: [expect.objectContaining({ companyName: 'iFood', status: 'success' })],
      }),
    );
  });
  it('handles no enabled companies and safely skips Lever', async () => {
    deps.companies.mockResolvedValue([
      { ...greenhouse, enabled: false },
      { id: 'lever-1', name: 'Lever', provider: 'lever', enabled: true },
    ]);
    const result = await runCollection('manual');
    expect(result).toMatchObject({
      trigger: 'manual',
      status: 'success',
      companiesAttempted: 0,
      skipped: 1,
    });
    expect(result.companies[0]).toMatchObject({ status: 'skipped', errorCategory: 'unsupported' });
    expect(deps.fetch).not.toHaveBeenCalled();
  });
  it('keeps a successful company when another fails', async () => {
    deps.companies.mockResolvedValue([
      greenhouse,
      { ...greenhouse, id: 'company-2', name: 'Wellhub' },
    ]);
    deps.fetch
      .mockResolvedValueOnce({ jobs: [], skippedJobs: 0 })
      .mockRejectedValueOnce(new Error('timeout'));
    const result = await runCollection('manual');
    expect(result).toMatchObject({ status: 'partial', companiesSucceeded: 1, companiesFailed: 1 });
    expect(result.companies[1]).toMatchObject({ status: 'failed', errorCategory: 'persistence' });
  });
  it('records a failed provider run without calling persistence or advancing job lifecycle', async () => {
    deps.companies.mockResolvedValue([greenhouse]);
    deps.fetch.mockRejectedValueOnce(new Error('timeout'));
    await expect(runCollection('scheduled')).resolves.toMatchObject({
      status: 'failed',
      companiesFailed: 1,
    });
    expect(deps.persist).not.toHaveBeenCalled();
  });
  it('aggregates malformed results and processes multiple successful companies', async () => {
    deps.companies.mockResolvedValue([greenhouse, { ...greenhouse, id: 'company-2' }]);
    deps.persist.mockResolvedValue({
      ...saved,
      created: 2,
      updated: 0,
      unchanged: 0,
      malformed: 3,
    });
    await expect(runCollection('manual')).resolves.toMatchObject({
      companiesSucceeded: 2,
      created: 4,
      malformed: 6,
    });
  });
  it('records an immediate identical recollection as unchanged in collection history', async () => {
    deps.companies.mockResolvedValue([greenhouse]);
    deps.persist.mockResolvedValue({
      discovered: 253,
      created: 0,
      updated: 0,
      unchanged: 253,
      malformed: 0,
      skipped: 0,
    });

    const result = await runCollection('scheduled');

    expect(result).toMatchObject({ created: 0, updated: 0, unchanged: 253, malformed: 0 });
    expect(deps.finish).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ created: 0, updated: 0, unchanged: 253, malformed: 0 }),
    );
  });
});
