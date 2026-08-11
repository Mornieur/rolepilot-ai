import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({ user: vi.fn(), profiles: vi.fn(), inbox: vi.fn() }));
vi.mock('@/features/auth/server/auth', () => ({ requirePageUser: dependencies.user }));
vi.mock('@/features/profiles/server/load-profiles', () => ({
  loadCandidateProfiles: dependencies.profiles,
}));
vi.mock('@/features/opportunity-inbox/server/load-opportunity-inbox', () => ({
  OpportunityInboxDataError: class OpportunityInboxDataError extends Error {},
  loadOpportunityInbox: dependencies.inbox,
}));
vi.mock('@/features/opportunity-inbox/components/opportunity-inbox', () => ({
  OpportunityInbox: () => <div>Inbox carregado</div>,
}));
import InboxPage from './page';

const profile = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Maria',
  desiredRoles: [],
  acceptedSeniorities: [],
  requiredSkills: [],
  preferredSkills: [],
  excludedSkills: [],
  acceptedWorkModels: [],
  locations: [],
};
const otherProfile = { ...profile, id: '22222222-2222-4222-8222-222222222222', name: 'Flávia' };
describe('InboxPage authorization boundary', () => {
  beforeEach(() => {
    dependencies.user.mockReset().mockResolvedValue({ id: 'user-1', role: 'user' });
    dependencies.profiles.mockReset().mockResolvedValue({ profiles: [profile], error: null });
    dependencies.inbox.mockReset().mockResolvedValue({
      opportunities: [],
      summary: { compatible: 0, new: 0, saved: 0, excellent: 0 },
    });
  });
  it('loads only a selected profile from the authorized list', async () => {
    render(await InboxPage({ searchParams: Promise.resolve({ profileId: profile.id }) }));
    expect(dependencies.inbox).toHaveBeenCalledWith(profile);
    expect(screen.getByText('Inbox carregado')).toBeInTheDocument();
  });
  it('does not load or reveal an unauthorized profile id', async () => {
    render(await InboxPage({ searchParams: Promise.resolve({ profileId: otherProfile.id }) }));
    expect(dependencies.inbox).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Perfil indisponível.');
  });
});
