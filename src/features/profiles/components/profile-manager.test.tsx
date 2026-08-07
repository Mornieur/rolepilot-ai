import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/profiles/actions', () => ({
  initialProfileActionState: { status: 'idle' },
  createCandidateProfileAction: vi.fn(),
  updateCandidateProfileAction: vi.fn(),
  deleteCandidateProfileAction: vi.fn(),
}));

import { ProfileManager } from './profile-manager';
import type { CandidateProfile } from '@/types/domain';

const profile: CandidateProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Frontend specialist',
  desiredRoles: ['Frontend Engineer'],
  acceptedSeniorities: ['senior'],
  requiredSkills: ['React'],
  preferredSkills: [],
  excludedSkills: [],
  acceptedWorkModels: ['remote'],
  locations: ['Brazil'],
};

describe('ProfileManager', () => {
  it('renders the create form and guides an empty profile list', () => {
    render(<ProfileManager profiles={[]} />);
    expect(screen.getByLabelText('Profile name')).toBeInTheDocument();
    expect(
      screen.getByText('No profiles yet. Create the first profile above to use the dashboard.'),
    ).toBeInTheDocument();
  });

  it('renders a saved profile and disables deletion of the final profile', () => {
    render(<ProfileManager profiles={[profile]} />);
    fireEvent.click(screen.getByText('Frontend specialist'));
    expect(screen.getByRole('button', { name: 'Delete profile' })).toBeDisabled();
  });
});
