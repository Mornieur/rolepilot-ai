import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialJobStatusActionState } from '@/features/job-actions/action-state';
import type { InboxOpportunity } from '../types';

const dependencies = vi.hoisted(() => ({ saveJobStatusAction: vi.fn() }));
vi.mock('@/features/job-actions/actions', () => ({
  saveJobStatusAction: dependencies.saveJobStatusAction,
}));

import { OpportunityInbox } from './opportunity-inbox';

const opportunity = (id: string, companyName: string, decision: InboxOpportunity['decision']) =>
  ({
    job: {
      id,
      provider: 'greenhouse',
      targetCompanyId: 'company-1',
      externalId: id,
      title: `Senior Frontend Engineer ${id}`,
      location: 'Remote',
      descriptionText: 'React TypeScript remote',
      originalUrl: `https://jobs.example/${id}`,
      sourceUpdatedAt: null,
      language: 'en',
      departments: [],
      offices: [],
      firstSeenAt: '2026-08-11T10:00:00Z',
      lastSeenAt: '2026-08-11T10:00:00Z',
      createdAt: '2026-08-11T10:00:00Z',
      updatedAt: '2026-08-11T10:00:00Z',
      isActive: true,
    },
    profileId: 'profile-1',
    eligible: true,
    status: 'eligible',
    evaluatedAt: '2026-08-11T12:00:00Z',
    score: 82,
    reasons: [],
    matchedKeywords: [],
    matchedRequiredKeywords: [],
    matchedPreferredKeywords: [],
    excludedKeywordMatches: [],
    titleMatch: { matched: true, matchedTerms: [] },
    seniorityMatch: { matched: true, detectedSeniorities: [] },
    locationMatch: { matched: true, matchedTerms: [] },
    workModelMatch: { matched: true, detectedModels: ['remote'] },
    companyName,
    decision,
    priority: 'excellent',
    isNew: decision === 'new',
  }) as InboxOpportunity;

describe('OpportunityInbox interactivity', () => {
  beforeEach(() =>
    dependencies.saveJobStatusAction
      .mockReset()
      .mockResolvedValue({ status: 'success', current: 'saved', message: 'DecisÃ£o salva.' }),
  );

  it('filters opportunities by status, priority, and company inside the client boundary', () => {
    render(
      <OpportunityInbox
        profileId="profile-1"
        opportunities={[opportunity('one', 'Acme', 'new'), opportunity('two', 'Beta', 'saved')]}
        summary={{ compatible: 2, new: 1, saved: 1, excellent: 2 }}
      />,
    );

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'saved' } });
    expect(screen.queryByText('Senior Frontend Engineer one')).not.toBeInTheDocument();
    expect(screen.getByText('Senior Frontend Engineer two')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Empresa'), { target: { value: 'Acme' } });
    expect(screen.getByRole('heading', { name: /salvou oportunidades/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Prioridade'), { target: { value: 'review' } });
    expect(screen.getByRole('heading', { name: /salvou oportunidades/ })).toBeInTheDocument();
  });

  it('executes a quick action and immediately reflects its persisted decision', async () => {
    render(
      <OpportunityInbox
        profileId="profile-1"
        opportunities={[opportunity('one', 'Acme', 'new')]}
        summary={{ compatible: 1, new: 1, saved: 0, excellent: 1 }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(dependencies.saveJobStatusAction).toHaveBeenCalledWith(
        initialJobStatusActionState,
        expect.any(FormData),
      ),
    );
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('DecisÃ£o salva.');
  });
});
