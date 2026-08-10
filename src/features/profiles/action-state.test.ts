import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  initialProfileActionState,
  type ProfileActionState,
} from '@/features/profiles/action-state';
import {
  createCandidateProfileAction,
  deleteCandidateProfileAction,
  updateCandidateProfileAction,
} from '@/features/profiles/actions';

describe('profile action state boundary', () => {
  it('keeps the initial state in a provider-independent module', () => {
    const state: ProfileActionState = initialProfileActionState;
    expect(state).toEqual({ status: 'idle' });
  });

  it('keeps profile mutations callable server actions', () => {
    expect(createCandidateProfileAction).toBeTypeOf('function');
    expect(updateCandidateProfileAction).toBeTypeOf('function');
    expect(deleteCandidateProfileAction).toBeTypeOf('function');
  });
});
