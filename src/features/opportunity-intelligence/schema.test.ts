import { describe, expect, it } from 'vitest';
import {
  findUnsupportedGeminiJsonSchemaKeywords,
  geminiProviderDossierJsonSchema,
  geminiProviderDossierSchema,
  geminiSchemaComplexity,
  geminiSchemaSectionComplexity,
  hasOnlyKnownDossierCitations,
  mapGeminiProviderDossier,
  opportunityDossierJsonSchema,
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
  it('uses only Gemini-supported JSON Schema keywords while retaining the structured shape', () => {
    expect(findUnsupportedGeminiJsonSchemaKeywords(geminiProviderDossierJsonSchema)).toEqual([]);
    expect(geminiProviderDossierJsonSchema.required).toEqual(
      expect.arrayContaining(['compensation', 'citations', 'researchTimestamp']),
    );
    expect(opportunityDossierJsonSchema.required).toContain('compensation');
    expect(opportunityDossierJsonSchema.properties.compensation.required).toContain(
      'estimatedRange',
    );
    expect(opportunityDossierJsonSchema.properties.compensation.properties.estimatedRange).toEqual({
      type: ['string', 'null'],
    });
    expect(
      opportunityDossierJsonSchema.properties.careerImpact.properties.aiExposure.properties.level,
    ).toEqual({ type: 'string', enum: ['strong', 'moderate', 'limited', 'unknown'] });
  });

  it('measures a materially smaller, shallower provider schema without changing the authority schema', () => {
    const authoritative = geminiSchemaComplexity(opportunityDossierJsonSchema);
    const provider = geminiSchemaComplexity(geminiProviderDossierJsonSchema);
    expect(authoritative).toMatchInlineSnapshot(`
      {
        "arraySchemaCount": 33,
        "enumCount": 17,
        "maxDepth": 7,
        "propertyCount": 100,
        "requiredFieldCount": 100,
        "serializedBytes": 8268,
      }
    `);
    expect(provider.serializedBytes).toBeLessThan(authoritative.serializedBytes);
    expect(provider.maxDepth).toBeLessThan(authoritative.maxDepth);
    expect(provider.propertyCount).toBeLessThan(authoritative.propertyCount);
    expect(provider.requiredFieldCount).toBeLessThan(authoritative.requiredFieldCount);
    expect(provider.enumCount).toBeLessThan(authoritative.enumCount);
    expect(provider.arraySchemaCount).toBeLessThanOrEqual(authoritative.arraySchemaCount);
    expect(provider).toMatchInlineSnapshot(`
      {
        "arraySchemaCount": 33,
        "enumCount": 10,
        "maxDepth": 6,
        "propertyCount": 86,
        "requiredFieldCount": 86,
        "serializedBytes": 5811,
      }
    `);
    const largestSections = Object.entries(
      geminiSchemaSectionComplexity(opportunityDossierJsonSchema),
    )
      .sort(([, left], [, right]) => right.serializedBytes - left.serializedBytes)
      .slice(0, 3)
      .map(([name]) => name);
    expect(largestSections).toEqual(['preparation', 'careerImpact', 'company']);
    expect(JSON.stringify(geminiProviderDossierJsonSchema)).not.toContain('"format"');
  });

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

  it('maps the provider source IDs to known source classifications before authoritative validation', () => {
    const provider = geminiProviderDossierSchema.parse({
      ...representativeDossier,
      company: {
        ...representativeDossier.company,
        categories: [{ label: 'SaaS', confidence: 'known', sourceIds: [sourceId] }],
      },
      preparation: {
        ...representativeDossier.preparation,
        mustReview: [
          { topic: 'System design', why: 'Relevant to the role.', sourceIds: [sourceId] },
        ],
      },
      citations: [sourceId],
    });
    const mapped = mapGeminiProviderDossier(provider, new Map([[sourceId, 'known' as const]]));
    expect(mapped).not.toBeNull();
    if (!mapped) throw new Error('Expected provider dossier mapping to succeed');
    expect(opportunityDossierSchema.safeParse(mapped).success).toBe(true);
    expect(mapped.citations).toEqual([evidence]);
    expect(mapped.preparation.mustReview[0]!.evidence).toEqual([evidence]);
  });

  it('rejects provider source IDs that cannot be deterministically classified', () => {
    const provider = geminiProviderDossierSchema.parse({
      ...representativeDossier,
      company: { ...representativeDossier.company, categories: [] },
      preparation: {
        ...representativeDossier.preparation,
        mustReview: [],
      },
      citations: [unknownSourceId],
    });
    expect(mapGeminiProviderDossier(provider, new Map([[sourceId, 'known' as const]]))).toBeNull();
  });
});
