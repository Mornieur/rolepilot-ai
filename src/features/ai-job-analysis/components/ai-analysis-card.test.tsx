import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const useActionState = vi.hoisted(() => vi.fn());
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useActionState,
}));
vi.mock('@/features/ai-job-analysis/actions', () => ({
  analyzeJobAction: vi.fn(),
}));

import { AiAnalysisCard } from './ai-analysis-card';

const latest = {
  id: 'analysis-1',
  profileId: 'profile-1',
  jobId: 'job-1',
  provider: 'gemini' as const,
  model: 'gemini-2.5-flash-lite',
  schemaVersion: '1',
  createdAt: '2026-08-09T12:00:00.000Z',
  inputFingerprint: 'current',
  latencyMs: 10,
  inputTokens: 5,
  outputTokens: 6,
  totalTokens: 11,
  analysis: {
    recommendation: 'apply' as const,
    confidence: 'high' as const,
    summary: 'Persisted summary',
    strengths: [{ title: 'React', evidence: 'Required skill matched' }],
    gaps: [{ title: 'GraphQL', severity: 'low' as const, explanation: 'Nice to have' }],
    risks: ['Timezone overlap'],
    interviewFocus: ['Architecture tradeoffs'],
    deterministicAssessment: { score: 80, eligible: true as const },
  },
};

function renderCard(overrides: Partial<typeof latest> & { stale?: boolean } = {}) {
  const { stale = false, ...analysis } = overrides;
  return render(
    <AiAnalysisCard
      profileId="profile-1"
      jobId="job-1"
      latestAnalysis={Object.keys(analysis).length ? { ...latest, ...analysis, stale } : null}
    />,
  );
}

describe('AiAnalysisCard persisted analysis UI', () => {
  it('shows the manual action when no saved analysis exists', () => {
    useActionState.mockReturnValue([{ status: 'idle' }, vi.fn(), false]);
    renderCard();
    expect(screen.getByRole('button', { name: 'Analyze with Gemini' })).toBeEnabled();
  });

  it('renders a current persisted analysis, its textual status, metadata, and all result sections', () => {
    useActionState.mockReturnValue([{ status: 'idle' }, vi.fn(), false]);
    renderCard(latest);
    expect(screen.getByRole('status')).toHaveTextContent('current');
    expect(screen.getByText('apply · high confidence')).toBeInTheDocument();
    expect(screen.getByText('Persisted summary')).toBeInTheDocument();
    expect(screen.getByText('React: Required skill matched')).toBeInTheDocument();
    expect(screen.getByText('GraphQL (low): Nice to have')).toBeInTheDocument();
    expect(screen.getByText('Timezone overlap')).toBeInTheDocument();
    expect(screen.getByText('Architecture tradeoffs')).toBeInTheDocument();
    expect(screen.getByText(/Analyzed:/)).toBeInTheDocument();
    expect(
      screen.getByText(/Provider\/model: gemini \/ gemini-2.5-flash-lite/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reanalyze with Gemini' })).toBeEnabled();
  });

  it('keeps stale analysis visible with a textual context-change warning', () => {
    useActionState.mockReturnValue([{ status: 'idle' }, vi.fn(), false]);
    renderCard({ ...latest, stale: true });
    expect(
      screen
        .getAllByRole('status')
        .map((node) => node.textContent)
        .join(' '),
    ).toMatch(/stale/);
    expect(screen.getByText(/profile or job context changed/)).toBeInTheDocument();
    expect(screen.getByText('Persisted summary')).toBeInTheDocument();
  });

  it('uses action state for pending, successful reanalysis, and safe failures without erasing history', () => {
    useActionState.mockReturnValue([{ status: 'idle' }, vi.fn(), true]);
    const pending = renderCard(latest);
    expect(screen.getByRole('button', { name: 'Analyzing…' })).toBeDisabled();
    pending.unmount();

    useActionState.mockReturnValue([
      {
        status: 'success',
        analysis: {
          ...latest,
          id: 'analysis-2',
          analysis: { ...latest.analysis, summary: 'New summary' },
        },
      },
      vi.fn(),
      false,
    ]);
    const success = renderCard(latest);
    expect(screen.getByText('New summary')).toBeInTheDocument();
    expect(screen.queryByText('Persisted summary')).not.toBeInTheDocument();
    success.unmount();

    useActionState.mockReturnValue([
      { status: 'error', message: 'AI analysis could not be saved. Please try again.' },
      vi.fn(),
      false,
    ]);
    renderCard(latest);
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved');
    expect(screen.getByText('Persisted summary')).toBeInTheDocument();
  });
});
