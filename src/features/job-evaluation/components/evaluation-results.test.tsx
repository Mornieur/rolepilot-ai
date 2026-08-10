import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DeterministicJobEvaluation } from '@/features/job-evaluation/types';

import { vi } from 'vitest';

vi.mock('@/features/ai-job-analysis/components/ai-analysis-card', () => ({
  AiAnalysisCard: () => <p>Manual Gemini analysis</p>,
}));
vi.mock('@/features/job-actions/components/job-status-controls', () => ({
  JobStatusControls: ({ currentStatus }: { currentStatus: string }) => (
    <section>
      <h4>Your decision</h4>
      <p role="status">Current state: {currentStatus}</p>
    </section>
  ),
}));

import { EvaluationResults } from './evaluation-results';

const result = (id: string, eligible: boolean): DeterministicJobEvaluation => ({
  profileId: 'profile-1',
  eligible,
  status: eligible ? 'eligible' : 'rejected',
  evaluatedAt: '2026-08-06T00:00:00Z',
  score: eligible ? 85 : 20,
  job: {
    id,
    provider: 'greenhouse',
    targetCompanyId: 'company-1',
    externalId: id,
    title: eligible ? 'Eligible role' : 'Rejected role',
    location: 'Remote',
    descriptionText: null,
    originalUrl: `https://example.test/${id}`,
    sourceUpdatedAt: null,
    language: null,
    departments: [],
    offices: [],
    firstSeenAt: '2026-08-01T00:00:00Z',
    lastSeenAt: '2026-08-01T00:00:00Z',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  reasons: [
    { code: 'required', outcome: eligible ? 'pass' : 'fail', message: 'Requirements checked.' },
  ],
  matchedKeywords: [],
  matchedRequiredKeywords: [],
  matchedPreferredKeywords: [],
  excludedKeywordMatches: [],
  titleMatch: { matched: eligible, matchedTerms: [] },
  seniorityMatch: { matched: null, detectedSeniorities: [] },
  locationMatch: { matched: null, matchedTerms: [] },
  workModelMatch: { matched: null, detectedModels: [] },
});

describe('EvaluationResults', () => {
  it('separates deterministic evaluation, Gemini availability, and decisions while filtering results', () => {
    render(
      <EvaluationResults
        results={[result('eligible-job', true), result('rejected-job', false)]}
        statuses={{ 'eligible-job': 'saved' }}
      />,
    );
    expect(screen.getAllByText('Avaliação determinística')).toHaveLength(2);
    expect(screen.getByText('Manual Gemini analysis')).toBeInTheDocument();
    expect(screen.getAllByText('Your decision')).toHaveLength(2);
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Current state: saved');
    fireEvent.click(screen.getByRole('button', { name: 'rejeitadas' }));
    expect(screen.queryByRole('heading', { name: /eligible role/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /rejected role/i })).toBeInTheDocument();
  });
});
