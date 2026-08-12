import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  formatCompensationRange,
  OpportunityDossierView,
  sourceBadge,
} from './opportunity-dossier';
import type { ResearchDossier } from '@/features/opportunity-intelligence/types';

const sourceId = '11111111-1111-4111-8111-111111111111';
const dossier: ResearchDossier = {
  id: 'dossier',
  profileId: 'profile',
  jobId: 'job',
  schemaVersion: '2',
  status: 'completed',
  researchFingerprint: 'fingerprint',
  researchedAt: '2026-08-12T20:33:00.000Z',
  expiresAt: '2026-08-26T20:33:00.000Z',
  errorClassification: null,
  sources: [
    {
      id: sourceId,
      tier: 1,
      sourceKind: 'official',
      title: 'VTEX careers',
      organization: 'VTEX',
      domain: 'vtex.com',
      url: 'https://vtex.com/careers',
      publishedAt: null,
      collectedAt: '2026-08-12T20:33:00.000Z',
      evidenceScopes: [],
      normalizedExcerpt: 'Fonte.',
      evidenceClassification: 'known',
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      tier: 3,
      sourceKind: 'community',
      title: 'Candidate report',
      organization: null,
      domain: 'glassdoor.com',
      url: 'https://glassdoor.com/example',
      publishedAt: null,
      collectedAt: '2026-08-12T20:33:00.000Z',
      evidenceScopes: [],
      normalizedExcerpt: 'Fonte.',
      evidenceClassification: 'anecdotal',
    },
  ],
  structuredResult: {
    opportunitySummary: 'Resumo em português.',
    company: {
      overview: 'A empresa oferece tecnologia para comércio digital.',
      categories: [{ label: 'SaaS para comércio digital', confidence: 'known', evidence: [] }],
      businessModel: 'SaaS',
      stage: 'Não confirmado pelas fontes pesquisadas.',
      publicPrivateStatus: 'Empresa de capital aberto',
      size: 'Grande porte',
      markets: ['Global'],
      engineeringContext: 'React e TypeScript',
    },
    companyMoment: {
      knownFacts: ['Expansão internacional recente.'],
      recentDevelopments: [],
      inferences: ['Vale confirmar as prioridades do time.'],
      unknowns: [],
    },
    compensation: {
      observations: ['Relatórios de mercado para Senior Software Engineer.'],
      estimatedRange: 'R$143K - R$277K',
      currencyUnit: 'BRL/year',
      components: [],
      confidence: 'medium',
      conflicts: [],
      unknowns: [],
    },
    hiringProcess: {
      officialKnownStages: ['Entrevista técnica.'],
      anecdotalReportedStages: ['Conversa com liderança.'],
      likelyExpectations: [],
      confidence: 'medium',
    },
    preparation: {
      mustReview: [
        {
          topic: 'TypeScript',
          why: 'TypeScript',
          evidence: [{ sourceId, classification: 'known' }],
        },
      ],
      shouldReview: [],
      optional: [],
      behavioral: [],
      companyKnowledge: [],
    },
    candidateFit: {
      alreadyStrong: ['Experiência com React.'],
      refresh: ['Revise GraphQL.'],
      realGaps: ['Prática com arquitetura distribuída.'],
      unknowns: [],
    },
    careerImpact: {
      technicalGrowth: { level: 'strong', explanation: 'Amplia a atuação em arquitetura.' },
      leadershipExposure: { level: 'unknown', explanation: 'No provider finding.' },
      aiExposure: { level: 'unknown', explanation: 'No provider finding.' },
      productExposure: { level: 'unknown', explanation: 'No provider finding.' },
      internationalExposure: { level: 'unknown', explanation: 'No provider finding.' },
      compensationUpside: { level: 'unknown', explanation: 'No provider finding.' },
      roleScopeRisk: { level: 'unknown', explanation: 'No provider finding.' },
    },
    applicationPositioning: {
      emphasize: ['Impacto em produtos B2B.'],
      storiesToPrepare: ['Projeto de escalabilidade.'],
      evidenceToQuantify: ['Redução de latência.'],
    },
    questionsToInvestigate: ['Como funciona o ownership do time?'],
    citations: [{ sourceId, classification: 'known' }],
    researchTimestamp: '2026-08-12T20:33:00.000Z',
  },
};

describe('OpportunityDossierView', () => {
  it('renders a concise localized dossier without raw internal enums or duplicated study text', () => {
    render(<OpportunityDossierView dossier={dossier} />);
    expect(screen.getByText('Pesquisa atualizada em', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Média', { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText('Confirmado', { exact: true })).not.toHaveLength(0);
    expect(screen.getByText('Relatos de candidatos')).toBeInTheDocument();
    expect(screen.getByText('Experiências individuais podem variar.')).toBeInTheDocument();
    expect(screen.getByText('Prioridade')).toBeInTheDocument();
    expect(screen.queryByText('Recomendado')).not.toBeInTheDocument();
    expect(screen.queryByText('Diferencial')).not.toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getAllByText('TypeScript')).toHaveLength(1);
    expect(screen.getByText('Seu encaixe')).toBeInTheDocument();
    expect(screen.getByText('Impacto na sua carreira')).toBeInTheDocument();
    expect(screen.getByText('Como se posicionar')).toBeInTheDocument();
    expect(screen.getByText('Perguntas para levar ao processo')).toBeInTheDocument();
    expect(screen.getByText('Oficial')).toBeInTheDocument();
    expect(screen.getByText('Comunidade')).toBeInTheDocument();
    expect(screen.queryByText('anecdotal')).not.toBeInTheDocument();
    expect(screen.queryByText('medium')).not.toBeInTheDocument();
    expect(screen.queryByText('Tier 1')).not.toBeInTheDocument();
    expect(document.querySelector('.lg\\:grid-cols-2')).not.toBeNull();
  });

  it('formats compensation without inventing an annual period and preserves insufficient evidence', () => {
    expect(formatCompensationRange('R$143K - R$277K')).toBe('R$ 143 mil – R$ 277 mil');
    const withoutPeriod = structuredClone(dossier);
    withoutPeriod.structuredResult!.compensation.currencyUnit = null;
    render(<OpportunityDossierView dossier={withoutPeriod} />);
    expect(screen.getByText('Período não confirmado.')).toBeInTheDocument();

    const insufficient = structuredClone(dossier);
    insufficient.structuredResult!.compensation.estimatedRange = null;
    render(<OpportunityDossierView dossier={insufficient} />);
    expect(
      screen.getByText('Não encontramos evidência suficiente para estimar uma faixa confiável.'),
    ).toBeInTheDocument();
  });

  it('maps source tiers to product labels', () => {
    expect(sourceBadge({ tier: 1, sourceKind: 'official' })).toBe('Oficial');
    expect(sourceBadge({ tier: 2, sourceKind: 'press' })).toBe('Imprensa / fonte especializada');
    expect(sourceBadge({ tier: 3, sourceKind: 'career_platform' })).toBe('Mercado');
    expect(sourceBadge({ tier: 3, sourceKind: 'community' })).toBe('Comunidade');
  });
});
