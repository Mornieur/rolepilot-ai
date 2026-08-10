import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CollectionRunResult } from '@/features/job-collection/types';

type State =
  { ok: null } | { ok: true; result: CollectionRunResult } | { ok: false; message: string };

const state = vi.hoisted(() => ({
  value: { ok: null } as State,
  pending: false,
  action: vi.fn(),
}));
vi.mock('@/features/job-collection/actions', () => ({ runCollectionNowAction: vi.fn() }));
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useActionState: () => [state.value, state.action, state.pending],
}));
import { CollectionControl } from './collection-control';

const result = {
  trigger: 'manual' as const,
  status: 'success' as const,
  startedAt: '2026-08-10T00:00:00Z',
  finishedAt: '2026-08-10T00:01:00Z',
  companiesAttempted: 2,
  companiesSucceeded: 2,
  companiesFailed: 0,
  discovered: 4,
  created: 2,
  updated: 1,
  unchanged: 1,
  malformed: 0,
  skipped: 0,
  companies: [],
};
describe('CollectionControl', () => {
  it('shows idle and no prior run in Portuguese', () => {
    state.value = { ok: null };
    state.pending = false;
    render(<CollectionControl />);
    expect(screen.getByRole('button', { name: 'Executar coleta agora' })).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma coleta');
  });
  it('shows pending feedback and disables the action', () => {
    state.value = { ok: null };
    state.pending = true;
    render(<CollectionControl />);
    expect(screen.getByRole('button', { name: 'Coletando vagas…' })).toBeDisabled();
    expect(
      screen
        .getAllByRole('status')
        .map((x) => x.textContent)
        .join(' '),
    ).toContain('Coletando vagas');
  });
  it('shows success, partial and controlled failure states', () => {
    state.value = { ok: true, result };
    state.pending = false;
    const { rerender } = render(<CollectionControl />);
    expect(screen.getByText(/2 empresas processadas/)).toBeInTheDocument();
    state.value = { ok: true, result: { ...result, status: 'partial', companiesFailed: 1 } };
    rerender(<CollectionControl />);
    expect(screen.getByText('Coleta parcial')).toBeInTheDocument();
    state.value = { ok: false, message: 'Falha controlada.' };
    rerender(<CollectionControl />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha controlada.');
  });
  it('renders manual and scheduled latest-run state', () => {
    state.value = { ok: null };
    render(
      <CollectionControl
        lastRun={{
          trigger: 'scheduled',
          status: 'partial',
          started_at: '2026-08-10T00:00:00Z',
          created_count: 3,
          companies_failed: 1,
        }}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('agendada');
    expect(screen.getByRole('status')).toHaveTextContent('parcial');
  });
});
