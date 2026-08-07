import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InsightsClient, InsightsEmpty, InsightsFilters } from './insights-client';

const profile = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Maria',
  desiredRoles: [],
  acceptedSeniorities: ['senior' as const],
  requiredSkills: [],
  preferredSkills: [],
  excludedSkills: [],
  acceptedWorkModels: ['remote' as const],
  locations: ['Brazil'],
};
describe('FeitozaUI insights client boundary', () => {
  it('renders the real public FeitozaUI pilot components with accessible controls', () => {
    render(
      <InsightsClient>
        <InsightsFilters profiles={[profile]} profileId={profile.id} period="30d" />
        <InsightsEmpty />
      </InsightsClient>,
    );
    expect(screen.getByLabelText('Candidate profile')).toHaveValue(profile.id);
    expect(screen.getByLabelText('Period')).toHaveValue('30d');
    expect(screen.getByRole('button', { name: 'Update insights' })).toBeInTheDocument();
    expect(screen.getByText('No collected jobs exist for this period.')).toBeInTheDocument();
  });
});
