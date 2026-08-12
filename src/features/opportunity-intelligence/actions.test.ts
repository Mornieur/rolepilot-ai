import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const dependencies = vi.hoisted(() => ({ research: vi.fn(), ownership: vi.fn(), user: vi.fn() }));
vi.mock('@/features/opportunity-intelligence/server/research/pipeline', () => ({
  OpportunityResearchError: class OpportunityResearchError extends Error {
    constructor(public classification: string) {
      super('safe boundary');
    }
  },
  researchOpportunity: dependencies.research,
}));
vi.mock('@/features/auth/server/auth', () => ({
  AuthenticationRequiredError: class AuthenticationRequiredError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
  requireCurrentUser: dependencies.user,
}));
vi.mock('@/features/profiles/server/supabase', () => ({
  getSupabaseServerClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: dependencies.ownership }) }) }),
  }),
}));

import { researchOpportunityAction } from './actions';
import { initialOpportunityResearchActionState } from './action-state';

describe('opportunity research Server Action boundary', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.user.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      role: 'user',
    });
    dependencies.ownership.mockResolvedValue({
      data: { user_id: '11111111-1111-4111-8111-111111111111' },
      error: null,
    });
    error.mockClear();
  });

  it('returns controlled state for an unexpected pipeline error', async () => {
    dependencies.research.mockRejectedValue(new Error('provider response with secret-like text'));
    const form = new FormData();
    form.set('profileId', '11111111-1111-4111-8111-111111111111');
    form.set('jobId', '22222222-2222-4222-8222-222222222222');
    await expect(
      researchOpportunityAction(initialOpportunityResearchActionState, form),
    ).resolves.toEqual({
      status: 'error',
      message: 'Não foi possível pesquisar a oportunidade agora.',
    });
    const logs = error.mock.calls.flat().join(' ');
    expect(logs).toContain('"classification":"unexpected"');
    expect(logs).not.toContain('secret-like text');
  });
});
