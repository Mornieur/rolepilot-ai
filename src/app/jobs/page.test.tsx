import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({ loadPersistedJobs: vi.fn() }));

vi.mock('@/features/jobs/server/load-jobs', () => ({
  loadPersistedJobs: dependencies.loadPersistedJobs,
}));

import JobsPage from './page';

const job = {
  id: 'job-1',
  provider: 'greenhouse',
  targetCompanyId: 'company-1',
  externalId: 'external-1',
  title: 'Senior Frontend Engineer',
  location: 'Remote',
  descriptionText: null,
  originalUrl: 'https://example.test/jobs/1',
  sourceUpdatedAt: '2026-08-01T00:00:00Z',
  language: null,
  departments: ['Engineering'],
  offices: ['Brazil'],
  firstSeenAt: '2026-08-01T00:00:00Z',
  lastSeenAt: '2026-08-02T00:00:00Z',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-02T00:00:00Z',
};

describe('JobsPage', () => {
  it('renders persisted jobs as clearly labelled source records with safe external links', async () => {
    dependencies.loadPersistedJobs.mockResolvedValue({ jobs: [job], error: null });

    render(await JobsPage());

    expect(screen.getByRole('heading', { name: 'Collected source jobs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: job.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open original source/i })).toHaveAttribute(
      'href',
      job.originalUrl,
    );
  });

  it('renders controlled empty and error states', async () => {
    dependencies.loadPersistedJobs.mockResolvedValue({ jobs: [], error: null });
    const view = render(await JobsPage());
    expect(screen.getByText('No jobs collected yet')).toBeInTheDocument();

    view.unmount();
    dependencies.loadPersistedJobs.mockResolvedValue({
      jobs: null,
      error: 'Connection unavailable.',
    });
    render(await JobsPage());
    expect(screen.getByRole('alert')).toHaveTextContent('Connection unavailable.');
  });
});
