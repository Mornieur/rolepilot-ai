import { describe, expect, it, vi } from 'vitest';

const runCollection = vi.hoisted(() => vi.fn());
const requireCurrentUser = vi.hoisted(() => vi.fn());
const requireAdmin = vi.hoisted(() => vi.fn());

vi.mock('@/features/job-collection/server/run-collection', () => ({ runCollection }));
vi.mock('@/features/auth/server/auth', () => ({ requireCurrentUser, requireAdmin }));

import { runCollectionNowAction } from './actions';

describe('manual collection access protection', () => {
  it('does not invoke the collection mutation when admin authorization is denied', async () => {
    requireCurrentUser.mockResolvedValueOnce({ role: 'user' });
    requireAdmin.mockImplementationOnce(() => {
      throw new Error('Você não tem permissão para esta operação.');
    });

    await expect(runCollectionNowAction()).rejects.toThrow(
      'Você não tem permissão para esta operação.',
    );
    expect(runCollection).not.toHaveBeenCalled();
  });
});
