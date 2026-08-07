import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Dashboard } from './dashboard';
import { jobAnalyses, jobs, mockProfileIds } from '../mock-data';
import type { CandidateProfile } from '@/types/domain';
import type { TargetCompany } from '@/types/domain';

const profiles: CandidateProfile[] = [
  {
    id: mockProfileIds.frontend,
    name: 'Frontend specialist',
    desiredRoles: ['Frontend Engineer', 'React Engineer'],
    acceptedSeniorities: ['senior', 'staff'],
    requiredSkills: ['React', 'TypeScript'],
    preferredSkills: [],
    excludedSkills: [],
    acceptedWorkModels: ['remote', 'hybrid'],
    locations: ['Brazil'],
  },
  {
    id: mockProfileIds.data,
    name: 'Data and BI specialist',
    desiredRoles: ['Data Analyst'],
    acceptedSeniorities: ['mid', 'senior'],
    requiredSkills: ['SQL', 'Python'],
    preferredSkills: [],
    excludedSkills: [],
    acceptedWorkModels: ['remote', 'hybrid'],
    locations: ['Brazil'],
  },
];

const companies: TargetCompany[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Example Platform',
    provider: 'greenhouse',
    boardIdentifier: 'example-platform',
    enabled: true,
    priority: 'high',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Sample Studio',
    provider: 'lever',
    boardIdentifier: 'sample-studio',
    enabled: false,
    priority: 'normal',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('Dashboard', () => {
  it('renders the initial profile, mocked jobs, and recommendation labels', () => {
    render(<Dashboard profiles={profiles} jobs={jobs} analyses={jobAnalyses} />);

    expect(
      screen.getByRole('heading', { name: 'Job intelligence for focused decisions.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
    expect(screen.getAllByText('Recommended')).toHaveLength(2);
    expect(screen.getAllByText('Worth considering')).toHaveLength(2);
    expect(screen.getAllByText('Skipped')).toHaveLength(4);
    expect(screen.getByText('React and TypeScript core match')).toBeInTheDocument();
  });

  it('updates job analyses and summary values when the profile changes', () => {
    render(<Dashboard profiles={profiles} jobs={jobs} analyses={jobAnalyses} />);

    expect(screen.getByText('94%')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Candidate profile'), {
      target: { value: mockProfileIds.data },
    });

    expect(screen.getByText('96%')).toBeInTheDocument();
    expect(screen.getByText('SQL and Python core match')).toBeInTheDocument();
    expect(screen.getAllByText('Skipped')).toHaveLength(4);
  });

  it('supports a single persisted profile and an empty profile list', () => {
    const { rerender } = render(
      <Dashboard profiles={[profiles[0]]} jobs={jobs} analyses={jobAnalyses} />,
    );
    expect(screen.getByLabelText('Candidate profile')).toHaveValue(mockProfileIds.frontend);

    rerender(<Dashboard profiles={[]} jobs={jobs} analyses={jobAnalyses} />);
    expect(
      screen.getByRole('heading', { name: 'Create your first candidate profile' }),
    ).toBeInTheDocument();
  });

  it('summarizes configured companies without implying collection is active', () => {
    render(
      <Dashboard profiles={profiles} jobs={jobs} analyses={jobAnalyses} companies={companies} />,
    );
    expect(screen.getByRole('heading', { name: 'Company monitoring' })).toBeInTheDocument();
    expect(
      screen.getByText('Configuration only — job collection is not active yet.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Monitored companies').parentElement).toHaveTextContent('2');
    expect(screen.getByText('Monitoring enabled').parentElement).toHaveTextContent('1');
    expect(screen.getByText('High priority').parentElement).toHaveTextContent('1');
  });

  it('links to deterministic persisted-job evaluation', () => {
    render(<Dashboard profiles={profiles} jobs={jobs} analyses={jobAnalyses} />);
    expect(screen.getByRole('link', { name: 'Evaluate collected jobs' })).toHaveAttribute(
      'href',
      '/jobs/evaluate',
    );
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('href', '/insights');
  });

  it('shows per-profile job-action counters, including zero, and switches them with the profile', () => {
    render(
      <Dashboard
        profiles={profiles}
        jobs={jobs}
        analyses={jobAnalyses}
        jobStatusCountsByProfile={{
          [mockProfileIds.frontend]: { new: 0, saved: 3, ignored: 0, applied: 1, rejected: 0 },
          [mockProfileIds.data]: { new: 0, saved: 0, ignored: 2, applied: 0, rejected: 4 },
        }}
      />,
    );
    expect(screen.getByText('Saved').parentElement).toHaveTextContent('3');
    expect(screen.getByText('Ignored').parentElement).toHaveTextContent('0');
    fireEvent.change(screen.getByLabelText('Candidate profile'), {
      target: { value: mockProfileIds.data },
    });
    expect(screen.getByText('Saved').parentElement).toHaveTextContent('0');
    expect(screen.getByText('Rejected').parentElement).toHaveTextContent('4');
  });
});
