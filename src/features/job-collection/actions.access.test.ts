import { describe, expect, it, vi } from 'vitest';

const runCollection = vi.hoisted(() => vi.fn());
const requirePersonalAccess = vi.hoisted(() => vi.fn());

vi.mock('@/features/job-collection/server/run-collection', () => ({ runCollection }));
vi.mock('@/lib/personal-access-server', () => ({ requirePersonalAccess }));

import { runCollectionNowAction } from './actions';

describe('manual collection access protection', () => {
  it('does not invoke the collection mutation when personal access is denied', async () => {
    requirePersonalAccess.mockRejectedValueOnce(new Error('Personal access is required.'));

    await expect(runCollectionNowAction()).rejects.toThrow('Personal access is required.');
    expect(runCollection).not.toHaveBeenCalled();
  });
});
