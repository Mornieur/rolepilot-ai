import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { previewAction, saveAction } = vi.hoisted(() => ({
  previewAction: vi.fn(),
  saveAction: vi.fn(),
}));
vi.mock('@/features/job-sources/greenhouse/actions', () => ({
  initialGreenhousePreviewState: { status: 'idle' },
  initialGreenhouseCollectionState: { status: 'idle' },
  previewGreenhouseJobsAction: previewAction,
  saveGreenhouseJobsAction: saveAction,
}));

import { GreenhousePreview } from './greenhouse-preview';
import type { TargetCompany } from '@/types/domain';

const company: TargetCompany = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Example',
  provider: 'greenhouse',
  boardIdentifier: 'example',
  enabled: true,
  priority: 'normal',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('GreenhousePreview', () => {
  it('renders the idle read-only state', () => {
    render(<GreenhousePreview company={company} />);
    expect(
      screen.getByText('Preview only — these jobs have not been saved to RolePilot.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No preview has been requested yet.')).toBeInTheDocument();
  });
  it('prevents active previews for disabled and Lever companies', () => {
    const { rerender } = render(<GreenhousePreview company={{ ...company, enabled: false }} />);
    expect(screen.getByRole('button', { name: 'Preview jobs' })).toBeDisabled();
    expect(
      screen.getByText('Enable monitoring in company settings before requesting a preview.'),
    ).toBeInTheDocument();
    rerender(<GreenhousePreview company={{ ...company, provider: 'lever' }} />);
    expect(
      screen.getByText('Preview is planned for Lever, but is not available yet.'),
    ).toBeInTheDocument();
  });
  it('announces the loading state while a request is in progress', async () => {
    let resolvePreview: (state: { status: 'empty'; message: string }) => void = () => undefined;
    previewAction.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePreview = resolve;
        }),
    );
    render(<GreenhousePreview company={company} />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview jobs' }));
    expect(screen.getByText('Requesting published jobs from Greenhouse…')).toBeInTheDocument();
    resolvePreview({ status: 'empty', message: 'No published jobs were returned for this board.' });
    await waitFor(() =>
      expect(
        screen.getByText('No published jobs were returned for this board.'),
      ).toBeInTheDocument(),
    );
  });
  it('shows success, empty, and retryable error states', async () => {
    previewAction
      .mockResolvedValueOnce({
        status: 'success',
        total: 1,
        skippedJobs: 0,
        requestedAt: '2026-01-01T00:00:00Z',
        jobs: [
          {
            externalId: '1',
            provider: 'greenhouse',
            companyId: company.id,
            companyName: company.name,
            title: 'Engineer',
            location: 'Remote',
            descriptionText: 'Readable description',
            originalUrl: 'https://boards.greenhouse.io/example/jobs/1',
            sourceUpdatedAt: null,
            language: 'en',
            departments: [],
            offices: [],
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 'empty',
        message: 'No published jobs were returned for this board.',
      })
      .mockResolvedValueOnce({
        status: 'error',
        message: 'Greenhouse is temporarily unavailable. Please try again.',
      });
    render(<GreenhousePreview company={company} />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview jobs' }));
    await waitFor(() => expect(screen.getByText('Engineer')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Open original job' })).toHaveAttribute(
      'rel',
      'noreferrer',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Preview jobs' }));
    await waitFor(() =>
      expect(
        screen.getByText('No published jobs were returned for this board.'),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Preview jobs' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Greenhouse is temporarily unavailable'),
    );
    expect(screen.getByRole('button', { name: 'Preview jobs' })).toBeEnabled();
  });
});
