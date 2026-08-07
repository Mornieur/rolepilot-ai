import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({ profiles: vi.fn(), insights: vi.fn() }));
vi.mock('@/features/profiles/server/load-profiles', () => ({
  loadCandidateProfiles: dependencies.profiles,
}));
vi.mock('@/features/job-insights/server/load-job-insights', () => ({
  JobInsightsDataError: class JobInsightsDataError extends Error {},
  loadJobInsights: dependencies.insights,
}));
import InsightsPage from './page';

const profile = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Maria',
  desiredRoles: [],
  acceptedSeniorities: ['senior'],
  requiredSkills: [],
  preferredSkills: [],
  excludedSkills: [],
  acceptedWorkModels: ['remote'],
  locations: ['Brazil'],
};
const secondProfile = { ...profile, id: '22222222-2222-4222-8222-222222222222', name: 'Flávia' };
const insight = {
  profile,
  period: '30d' as const,
  sampleSize: 2,
  statuses: { new: 1, saved: 1, ignored: 0, applied: 0, rejected: 0 },
  saveRate: 1,
  applicationRate: 0,
  providers: [{ label: 'greenhouse', count: 2 }],
  companies: [{ label: 'Acme', count: 2 }],
  titles: [{ label: 'Engineer', count: 2 }],
  locations: [{ label: 'Brazil', count: 2 }],
  workModels: [{ label: 'Remote', count: 2 }],
  seniorities: [{ label: 'Senior', count: 2 }],
  profileTerms: {
    found: [{ label: 'React', count: 1 }],
    saved: [],
    applied: [],
    ignored: [],
    rare: [],
  },
};
describe('InsightsPage', () => {
  it('renders accessible profile and period selection with descriptive metrics and small-sample warning', async () => {
    dependencies.profiles.mockResolvedValue({ profiles: [profile], error: null });
    dependencies.insights.mockResolvedValue(insight);
    render(
      await InsightsPage({
        searchParams: Promise.resolve({ profileId: profile.id, period: '30d' }),
      }),
    );
    expect(screen.getByLabelText('Candidate profile')).toHaveValue(profile.id);
    expect(screen.getByLabelText('Period')).toHaveValue('30d');
    expect(screen.getByText('Collected jobs').parentElement).toHaveTextContent('2');
    expect(screen.getByText('Companies with most collected jobs')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Very small sample');
  });
  it('uses selected query values and renders empty and controlled error states', async () => {
    dependencies.profiles.mockResolvedValue({ profiles: [profile, secondProfile], error: null });
    dependencies.insights.mockResolvedValue({ ...insight, sampleSize: 0, profile: secondProfile });
    const view = render(
      await InsightsPage({
        searchParams: Promise.resolve({ profileId: secondProfile.id, period: '7d' }),
      }),
    );
    expect(screen.getByLabelText('Candidate profile')).toHaveValue(secondProfile.id);
    expect(screen.getByLabelText('Period')).toHaveValue('7d');
    expect(dependencies.insights).toHaveBeenCalledWith(secondProfile.id, '7d');
    expect(screen.getByText('No collected jobs exist for this period.')).toBeInTheDocument();
    view.unmount();
    dependencies.insights.mockRejectedValue(new Error('no connection'));
    render(
      await InsightsPage({
        searchParams: Promise.resolve({ profileId: profile.id, period: 'invalid' }),
      }),
    );
    expect(screen.getByLabelText('Period')).toHaveValue('30d');
    expect(screen.getByRole('alert')).toHaveTextContent('Insights are unavailable right now.');
  });
});
