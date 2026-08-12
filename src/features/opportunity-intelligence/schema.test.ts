import { describe, expect, it } from 'vitest';
import {
  hasOnlyKnownDossierCitations,
  opportunityDossierSchema,
  opportunityDossierValidationIssues,
} from './schema';

const sourceId = '11111111-1111-4111-8111-111111111111';
const unknownSourceId = '22222222-2222-4222-8222-222222222222';
const evidence = { sourceId, classification: 'known' } as const;

const representativeDossier = {
  opportunitySummary: 'A structured opportunity summary.',
  company: {
    overview: 'A product company.',
    categories: [{ label: 'SaaS', confidence: 'known', evidence: [evidence] }],
    businessModel: 'Subscription software.',
    stage: 'Private company.',
    publicPrivateStatus: 'Private.',
    size: 'Unknown.',
    markets: ['Brazil'],
    engineeringContext: 'Engineering context is unknown.',
  },
  companyMoment: {
    knownFacts: ['One sourced fact.'],
    recentDevelopments: [],
    inferences: ['One cautious inference.'],
    unknowns: ['Current financial detail is unknown.'],
  },
  compensation: {
    observations: [],
    estimatedRange: null,
    currencyUnit: null,
    components: [],
    confidence: 'low',
    conflicts: [],
    unknowns: ['No compatible salary evidence was supplied.'],
  },
  hiringProcess: {
    officialKnownStages: [],
    anecdotalReportedStages: ['Anecdotal interview stage.'],
    likelyExpectations: ['Prepare role-relevant examples.'],
    confidence: 'medium',
  },
  preparation: {
    mustReview: [{ topic: 'System design', why: 'Relevant to the role.', evidence: [evidence] }],
    shouldReview: [],
    optional: [],
    behavioral: [],
    companyKnowledge: [],
  },
  candidateFit: {
    alreadyStrong: ['Relevant experience.'],
    refresh: ['Refresh fundamentals.'],
    realGaps: [],
    unknowns: ['Interview expectations are unknown.'],
  },
  careerImpact: {
    technicalGrowth: { level: 'strong', explanation: 'Potential technical scope.' },
    leadershipExposure: { level: 'unknown', explanation: 'No sourced leadership detail.' },
    aiExposure: { level: 'limited', explanation: 'Limited evidence of AI work.' },
    productExposure: { level: 'moderate', explanation: 'Product collaboration is likely.' },
    internationalExposure: { level: 'unknown', explanation: 'No sourced international detail.' },
    compensationUpside: { level: 'unknown', explanation: 'Salary is unknown.' },
    roleScopeRisk: { level: 'moderate', explanation: 'Scope should be confirmed.' },
  },
  applicationPositioning: {
    emphasize: ['Relevant outcome.'],
    storiesToPrepare: ['A delivery story.'],
    evidenceToQuantify: ['A measurable result.'],
  },
  questionsToInvestigate: ['What is the team scope?'],
  citations: [evidence],
  researchTimestamp: '2026-08-12T12:00:00.000Z',
};

describe('Opportunity Intelligence dossier contract', () => {
  it('accepts representative Gemini-shaped output with intentional null compensation facts', () => {
    expect(opportunityDossierSchema.safeParse(representativeDossier).success).toBe(true);
    expect(
      hasOnlyKnownDossierCitations(
        opportunityDossierSchema.parse(representativeDossier),
        new Set([sourceId]),
      ),
    ).toBe(true);
  });

  it('reports the exact safe path for the known confidence enum mismatch', () => {
    const output = {
      ...representativeDossier,
      compensation: { ...representativeDossier.compensation, confidence: 'média' },
    };
    const result = opportunityDossierSchema.safeParse(output);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(opportunityDossierValidationIssues(result.error, output)).toContainEqual({
      path: 'compensation.confidence',
      code: 'invalid_value',
      expected: 'enum',
      actual: 'string',
    });
  });

  it('rejects malformed salary objects while preserving null as the explicit unknown state', () => {
    const output = {
      ...representativeDossier,
      compensation: { ...representativeDossier.compensation, estimatedRange: { minimum: 1 } },
    };
    const result = opportunityDossierSchema.safeParse(output);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(opportunityDossierValidationIssues(result.error, output)).toContainEqual({
      path: 'compensation.estimatedRange',
      code: 'invalid_type',
      expected: 'string',
      actual: 'object',
    });
  });

  it('rejects citations that do not reference supplied evidence IDs', () => {
    const output = {
      ...representativeDossier,
      preparation: {
        ...representativeDossier.preparation,
        mustReview: [
          {
            ...representativeDossier.preparation.mustReview[0],
            evidence: [{ sourceId: unknownSourceId, classification: 'unknown' }],
          },
        ],
      },
    };
    const parsed = opportunityDossierSchema.parse(output);
    expect(hasOnlyKnownDossierCitations(parsed, new Set([sourceId]))).toBe(false);
  });
});
