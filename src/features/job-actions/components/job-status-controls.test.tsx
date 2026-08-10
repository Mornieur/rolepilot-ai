import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ui = vi.hoisted(() => ({
  state: { status: 'idle' } as {
    status: 'idle' | 'success' | 'error';
    current?: string;
    message?: string;
  },
  pending: false,
  action: vi.fn(),
}));
vi.mock('@/features/job-actions/actions', () => ({
  saveJobStatusAction: vi.fn(),
}));
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useActionState: () => [ui.state, ui.action, ui.pending],
}));

import { JobStatusControls } from './job-status-controls';

describe('JobStatusControls', () => {
  beforeEach(() => {
    ui.state = { status: 'idle' };
    ui.pending = false;
    ui.action.mockReset();
  });

  it('shows an unselected initial state with accessible action buttons', () => {
    render(<JobStatusControls profileId="profile" jobId="job" />);
    for (const name of ['Salvar', 'Ignorar', 'Candidatada', 'Rejeitada']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('shows the current status with accessible action buttons and pressed state', () => {
    render(<JobStatusControls profileId="profile" jobId="job" currentStatus="applied" />);
    expect(screen.getByRole('status')).toHaveTextContent('Estado atual: candidatada');
    expect(screen.getByRole('button', { name: 'Candidatada' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Ignorar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Rejeitada' })).toBeEnabled();
  });

  it('shows a Portuguese pending label and disables only the submitted control', () => {
    ui.pending = true;
    const { rerender } = render(<JobStatusControls profileId="profile" jobId="job" />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ignorar' })).toBeEnabled();

    ui.pending = false;
    ui.state = { status: 'success', current: 'saved', message: 'Decisão salva.' };
    rerender(<JobStatusControls profileId="profile" jobId="job" />);
    expect(screen.getByText('Decisão salva.')).toBeInTheDocument();
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Estado atual: salva');
    expect(screen.getByRole('button', { name: '✓ Salva' })).toHaveAttribute('aria-pressed', 'true');

    ui.state = { status: 'error', message: 'Não foi possível salvar a decisão.' };
    rerender(<JobStatusControls profileId="profile" jobId="job" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar a decisão.');

    ui.state = { status: 'idle' };
    rerender(<JobStatusControls profileId="profile" jobId="job" />);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });

  it.each([
    ['ignored', 'Ignorar', 'Ignorando…'],
    ['applied', 'Candidatada', 'Marcando candidatura…'],
    ['rejected', 'Rejeitada', 'Rejeitando…'],
  ])('uses the matching pending label for %s', (_, label, pendingLabel) => {
    ui.pending = true;
    render(<JobStatusControls profileId="profile" jobId="job" />);
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(screen.getByRole('button', { name: pendingLabel })).toBeDisabled();
  });

  it('submits the selected status exactly once with the profile and job identifiers', () => {
    render(<JobStatusControls profileId="profile" jobId="job" />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(ui.action).toHaveBeenCalledOnce();
    const formData = ui.action.mock.calls[0][0] as FormData;
    expect(formData.get('profileId')).toBe('profile');
    expect(formData.get('jobId')).toBe('job');
    expect(formData.get('status')).toBe('saved');
  });

  it.each([
    ['saved', '✓ Salva'],
    ['ignored', 'Ignorada'],
    ['applied', 'Candidatada'],
    ['rejected', 'Rejeitada'],
  ])('renders a server-loaded %s state as selected', (status, label) => {
    render(<JobStatusControls profileId="profile" jobId="job" currentStatus={status} />);
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders a server-loaded saved state and allows switching to ignored', () => {
    const { rerender } = render(
      <JobStatusControls profileId="profile" jobId="job" currentStatus="saved" />,
    );
    expect(screen.getByRole('button', { name: '✓ Salva' })).toHaveAttribute('aria-pressed', 'true');

    ui.state = { status: 'success', current: 'ignored', message: 'Decisão salva.' };
    rerender(<JobStatusControls profileId="profile" jobId="job" currentStatus="saved" />);
    expect(screen.getByRole('button', { name: 'Ignorada' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
