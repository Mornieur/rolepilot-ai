import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./opportunity-dossier', () => ({
  OpportunityDossierView: ({ isCurrent }: { isCurrent?: boolean }) => (
    <p>{isCurrent ? 'Dossier atual' : 'Dossier histórico'}</p>
  ),
}));
vi.mock('./research-trigger', () => ({
  ResearchTrigger: ({ label = 'Pesquisar empresa e preparar candidatura' }: { label?: string }) => (
    <button type="button">{label}</button>
  ),
}));

import { OpportunityResearchPanel } from './opportunity-research-panel';
import type { ResearchDossier } from '@/features/opportunity-intelligence/types';

const dossier = {
  status: 'completed',
  structuredResult: {},
} as ResearchDossier;

describe('OpportunityResearchPanel', () => {
  const props = { profileId: 'profile', jobId: 'job' };

  it('keeps a current dossier current without an unnecessary refresh CTA', () => {
    render(<OpportunityResearchPanel {...props} dossier={dossier} isCurrent />);

    expect(screen.getByText('Dossier atual')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows an expired or incompatible dossier as historical and offers an explicit refresh', () => {
    render(<OpportunityResearchPanel {...props} dossier={dossier} isCurrent={false} />);

    expect(screen.getByText('Dossier histórico')).toBeInTheDocument();
    expect(screen.getByText('Pesquisa desatualizada')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Atualizar pesquisa da oportunidade' }),
    ).toBeInTheDocument();
  });

  it('keeps the initial research CTA when no dossier exists', () => {
    render(<OpportunityResearchPanel {...props} dossier={null} isCurrent={false} />);

    expect(
      screen.getByRole('button', { name: 'Pesquisar empresa e preparar candidatura' }),
    ).toBeInTheDocument();
  });
});
