import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DeterministicJobEvaluation } from '@/features/job-evaluation/types';

vi.mock('@/features/ai-job-analysis/components/ai-analysis-card', () => ({
  AiAnalysisCard: () => <p>Análise manual do Gemini carregada</p>,
}));
vi.mock('@/features/job-actions/components/job-status-controls', () => ({
  JobStatusControls: ({ currentStatus }: { currentStatus: string }) => (
    <p role="status">Decisão carregada: {currentStatus}</p>
  ),
}));

import { EvaluationResults } from './evaluation-results';

const result = (
  id: string,
  eligible: boolean,
  reasons: DeterministicJobEvaluation['reasons'] = [
    { code: 'title', outcome: 'pass', message: 'Cargo-alvo compatível.' },
    {
      code: 'required-partial',
      outcome: 'neutral',
      message: 'Uma skill obrigatória não foi encontrada; verifique manualmente.',
    },
    { code: 'location', outcome: 'pass', message: 'Localização compatível.' },
  ],
): DeterministicJobEvaluation => ({
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
    title: eligible ? 'Pessoa desenvolvedora Front-end' : 'Pessoa analista de dados',
    location: 'Remoto',
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
  reasons,
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
  it('prioritizes compact compatible opportunities and keeps rejected jobs out of the main flow', () => {
    render(
      <EvaluationResults
        results={[
          result('eligible-job', true),
          result('rejected-job', false, [
            { code: 'title', outcome: 'fail', message: 'Cargo distante do perfil.' },
          ]),
        ]}
        statuses={{ 'eligible-job': 'saved' }}
        companyNames={{ 'company-1': 'Wellhub' }}
      />,
    );
    expect(screen.getByRole('heading', { name: '1 oportunidade compatível' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Pessoa desenvolvedora Front-end' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Wellhub · Remoto')).toBeInTheDocument();
    expect(screen.getByText('Decisão: salva')).toBeInTheDocument();
    expect(screen.getByText('Análise por IA: ainda não analisada')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Pessoa analista de dados' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver 1 vaga descartada' }));
    expect(screen.getByRole('heading', { name: 'Pessoa analista de dados' })).toBeInTheDocument();
  });

  it('makes warnings more prominent while keeping normal passes in an accessible disclosure', () => {
    render(<EvaluationResults results={[result('eligible-job', true)]} />);
    const warning = screen.getByLabelText('Atenção necessária');
    expect(warning).toHaveClass('border-amber-500');
    expect(warning).toHaveTextContent('Uma skill obrigatória não foi encontrada');
    expect(screen.getByText('Ver detalhes da avaliação determinística')).toBeInTheDocument();
    expect(screen.getByText('Cargo-alvo compatível.')).not.toBeVisible();
    fireEvent.click(screen.getByText('Ver detalhes da avaliação determinística'));
    expect(screen.getByText('Cargo-alvo compatível.')).toBeVisible();
  });

  it('uses Portuguese primary labels and renders current and stale AI states', () => {
    const analysis = {
      id: 'analysis-1',
      profileId: 'profile-1',
      jobId: 'eligible-job',
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
        summary: 'Resumo',
        strengths: [],
        gaps: [],
        risks: [],
        interviewFocus: [],
        deterministicAssessment: { score: 80, eligible: true as const },
      },
      stale: true,
    };
    render(
      <EvaluationResults
        results={[result('eligible-job', true)]}
        statuses={{ 'eligible-job': 'applied' }}
        latestAnalyses={{ 'eligible-job': analysis }}
      />,
    );
    expect(screen.getByText('Resultados da avaliação')).toBeInTheDocument();
    expect(screen.getByText('Decisão: candidatada')).toBeInTheDocument();
    expect(screen.getByText('Análise por IA: desatualizada')).toBeInTheDocument();
    expect(screen.getByText('Abrir análise manual do Gemini')).toBeInTheDocument();
  });

  it('explains a zero-compatible result without hiding diagnostics', () => {
    render(
      <EvaluationResults
        results={[
          result('rejected-job', false, [
            {
              code: 'work-model',
              outcome: 'fail',
              message: 'Modelo de trabalho incompatível com o perfil.',
            },
          ]),
        ]}
      />,
    );
    expect(screen.getByText('Nenhuma oportunidade compatível agora')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver 1 vaga descartada' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
