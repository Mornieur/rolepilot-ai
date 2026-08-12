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
const repeat = <T>(count: number, value: T) => Array.from({ length: count }, () => value);

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

const providerDossierAtArrayMaximums = {
  ...representativeDossier,
  company: {
    ...representativeDossier.company,
    categories: repeat(8, { label: 'SaaS', confidence: 'known', sourceIds: repeat(4, sourceId) }),
    markets: repeat(8, 'Brazil'),
  },
  companyMoment: {
    knownFacts: repeat(8, 'One sourced fact.'),
    recentDevelopments: repeat(8, 'One sourced development.'),
    inferences: repeat(8, 'One cautious inference.'),
    unknowns: repeat(8, 'One unknown.'),
  },
  compensation: {
    observations: repeat(8, 'One compensation observation.'),
    estimatedRange: null,
    currencyUnit: null,
    components: repeat(4, 'Base salary'),
    confidence: 'low',
    conflicts: repeat(6, 'One compensation conflict.'),
    unknowns: repeat(6, 'One compensation unknown.'),
  },
  hiringProcess: {
    officialKnownStages: repeat(8, 'One official stage.'),
    anecdotalReportedStages: repeat(8, 'One anecdotal stage.'),
    likelyExpectations: repeat(8, 'One likely expectation.'),
    confidence: 'medium',
  },
  preparation: {
    mustReview: repeat(8, {
      topic: 'System design',
      why: 'Relevant to the role.',
      sourceIds: repeat(4, sourceId),
    }),
    shouldReview: repeat(8, {
      topic: 'Domain knowledge',
      why: 'Relevant to the role.',
      sourceIds: repeat(4, sourceId),
    }),
    optional: repeat(8, {
      topic: 'Optional topic',
      why: 'Relevant to the role.',
      sourceIds: repeat(4, sourceId),
    }),
    behavioral: repeat(8, {
      topic: 'Behavioral interview',
      why: 'Relevant to the role.',
      sourceIds: repeat(4, sourceId),
    }),
    companyKnowledge: repeat(8, {
      topic: 'Company knowledge',
      why: 'Relevant to the role.',
      sourceIds: repeat(4, sourceId),
    }),
  },
  candidateFit: {
    alreadyStrong: repeat(8, 'Relevant experience.'),
    refresh: repeat(8, 'Refresh fundamentals.'),
    realGaps: repeat(8, 'One gap.'),
    unknowns: repeat(8, 'One unknown.'),
  },
  applicationPositioning: {
    emphasize: repeat(8, 'Relevant outcome.'),
    storiesToPrepare: repeat(8, 'A delivery story.'),
    evidenceToQuantify: repeat(8, 'A measurable result.'),
  },
  questionsToInvestigate: repeat(10, 'What is the team scope?'),
  citations: repeat(30, sourceId),
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

  it('matches every bounded Gemini-controlled array to its authoritative Zod maximum', () => {
    const schema = geminiProviderDossierJsonSchema;
    const properties = schema.properties;
    const arrayMaximums = [
      ['company.categories', 8, properties.company.properties.categories],
      [
        'company.categories[].sourceIds',
        4,
        properties.company.properties.categories.items.properties.sourceIds,
      ],
      ['company.markets', 8, properties.company.properties.markets],
      ['companyMoment.knownFacts', 8, properties.companyMoment.properties.knownFacts],
      [
        'companyMoment.recentDevelopments',
        8,
        properties.companyMoment.properties.recentDevelopments,
      ],
      ['companyMoment.inferences', 8, properties.companyMoment.properties.inferences],
      ['companyMoment.unknowns', 8, properties.companyMoment.properties.unknowns],
      ['compensation.observations', 8, properties.compensation.properties.observations],
      ['compensation.components', 4, properties.compensation.properties.components],
      ['compensation.conflicts', 6, properties.compensation.properties.conflicts],
      ['compensation.unknowns', 6, properties.compensation.properties.unknowns],
      [
        'hiringProcess.officialKnownStages',
        8,
        properties.hiringProcess.properties.officialKnownStages,
      ],
      [
        'hiringProcess.anecdotalReportedStages',
        8,
        properties.hiringProcess.properties.anecdotalReportedStages,
      ],
      [
        'hiringProcess.likelyExpectations',
        8,
        properties.hiringProcess.properties.likelyExpectations,
      ],
      ['preparation.mustReview', 8, properties.preparation.properties.mustReview],
      [
        'preparation.mustReview[].sourceIds',
        4,
        properties.preparation.properties.mustReview.items.properties.sourceIds,
      ],
      ['preparation.shouldReview', 8, properties.preparation.properties.shouldReview],
      [
        'preparation.shouldReview[].sourceIds',
        4,
        properties.preparation.properties.shouldReview.items.properties.sourceIds,
      ],
      ['preparation.optional', 8, properties.preparation.properties.optional],
      [
        'preparation.optional[].sourceIds',
        4,
        properties.preparation.properties.optional.items.properties.sourceIds,
      ],
      ['preparation.behavioral', 8, properties.preparation.properties.behavioral],
      [
        'preparation.behavioral[].sourceIds',
        4,
        properties.preparation.properties.behavioral.items.properties.sourceIds,
      ],
      ['preparation.companyKnowledge', 8, properties.preparation.properties.companyKnowledge],
      [
        'preparation.companyKnowledge[].sourceIds',
        4,
        properties.preparation.properties.companyKnowledge.items.properties.sourceIds,
      ],
      ['candidateFit.alreadyStrong', 8, properties.candidateFit.properties.alreadyStrong],
      ['candidateFit.refresh', 8, properties.candidateFit.properties.refresh],
      ['candidateFit.realGaps', 8, properties.candidateFit.properties.realGaps],
      ['candidateFit.unknowns', 8, properties.candidateFit.properties.unknowns],
      [
        'applicationPositioning.emphasize',
        8,
        properties.applicationPositioning.properties.emphasize,
      ],
      [
        'applicationPositioning.storiesToPrepare',
        8,
        properties.applicationPositioning.properties.storiesToPrepare,
      ],
      [
        'applicationPositioning.evidenceToQuantify',
        8,
        properties.applicationPositioning.properties.evidenceToQuantify,
      ],
      ['questionsToInvestigate', 10, properties.questionsToInvestigate],
      ['citations', 30, properties.citations],
    ] as const;

    expect(arrayMaximums).toHaveLength(33);
    for (const [path, maxItems, providerArray] of arrayMaximums) {
      expect(providerArray.maxItems, path).toBe(maxItems);
    }
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
        "serializedBytes": 6242,
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

  it('accepts provider-shaped output at every array maximum and maps it to the authoritative dossier', () => {
    const provider = geminiProviderDossierSchema.parse(providerDossierAtArrayMaximums);
    const mapped = mapGeminiProviderDossier(provider, new Map([[sourceId, 'known' as const]]));
    expect(mapped).not.toBeNull();
    expect(opportunityDossierSchema.safeParse(mapped).success).toBe(true);
  });

  it('rejects compensation components one item above the authoritative maximum', () => {
    const output = {
      ...representativeDossier,
      compensation: {
        ...representativeDossier.compensation,
        components: repeat(5, 'Base salary'),
      },
    };
    const result = opportunityDossierSchema.safeParse(output);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(opportunityDossierValidationIssues(result.error, output)).toContainEqual({
      path: 'compensation.components',
      code: 'too_big',
      actual: 'array',
    });
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
