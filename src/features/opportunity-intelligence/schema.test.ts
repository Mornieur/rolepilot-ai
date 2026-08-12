import { describe, expect, it } from 'vitest';
import {
  assertGeminiProviderSchemaBudget,
  candidateIntelligenceProviderJsonSchema,
  candidateIntelligenceProviderSchema,
  companyIntelligenceProviderJsonSchema,
  companyIntelligenceProviderSchema,
  findUnsupportedGeminiJsonSchemaKeywords,
  geminiProviderDossierJsonSchema,
  geminiProviderDossierSchema,
  geminiSchemaComplexity,
  hasOnlyKnownDossierCitations,
  mapGeminiProviderDossier,
  mergeGeminiProviderIntelligence,
  opportunityDossierSchema,
} from './schema';

const sourceId = '11111111-1111-4111-8111-111111111111';
const finding = { text: 'Sourced fact.', sourceIds: [sourceId], confidence: 'high' as const };
const provider = {
  opportunitySummary: 'Summary.',
  company: { findings: [finding], unknowns: [] },
  companyMoment: { facts: [finding], inferences: [], unknowns: [] },
  compensation: {
    findings: [],
    estimatedRange: null,
    currencyUnit: null,
    components: [],
    confidence: 'low' as const,
    unknowns: ['Unknown.'],
  },
  hiringProcess: { official: [], anecdotal: [], likely: [], confidence: 'low' as const },
  preparation: { technical: [finding], behavioral: [], company: [] },
  candidateFit: { strengths: [], refresh: [], gaps: [], unknowns: ['Unknown.'] },
  careerImpact: [],
  applicationPositioning: { emphasize: [], stories: [], evidence: [] },
  questionsToInvestigate: [],
  citations: [sourceId],
  researchTimestamp: '2026-08-12T12:00:00.000Z',
};

describe('Gemini provider DTO boundary', () => {
  it('keeps Company and Candidate provider contracts smaller than the rejected full runtime contract', () => {
    expect(
      geminiSchemaComplexity(companyIntelligenceProviderJsonSchema).serializedBytes,
    ).toBeLessThan(geminiSchemaComplexity(geminiProviderDossierJsonSchema).serializedBytes);
    expect(
      geminiSchemaComplexity(candidateIntelligenceProviderJsonSchema).serializedBytes,
    ).toBeLessThan(geminiSchemaComplexity(geminiProviderDossierJsonSchema).serializedBytes);
  });
  it('uses only supported essential JSON Schema keywords and fits the internal complexity budget', () => {
    expect(findUnsupportedGeminiJsonSchemaKeywords(geminiProviderDossierJsonSchema)).toEqual([]);
    const metrics = assertGeminiProviderSchemaBudget(geminiProviderDossierJsonSchema);
    expect(metrics).toMatchObject({
      maxDepth: expect.any(Number),
      propertyCount: expect.any(Number),
    });
    expect(metrics.serializedBytes).toBeLessThan(
      geminiSchemaComplexity(geminiProviderDossierJsonSchema).serializedBytes + 1,
    );
  });

  it('maps provider findings and source ids deterministically before authoritative validation', () => {
    const parsedProvider = geminiProviderDossierSchema.parse(provider);
    const mapped = mapGeminiProviderDossier(
      parsedProvider,
      new Map([[sourceId, 'known' as const]]),
    );
    expect(mapped).not.toBeNull();
    const dossier = opportunityDossierSchema.parse(mapped);
    expect(dossier.preparation.mustReview[0]?.evidence[0]).toEqual({
      sourceId,
      classification: 'known',
    });
    expect(hasOnlyKnownDossierCitations(dossier, new Set([sourceId]))).toBe(true);
  });

  it('merges disjoint provider sections, deduplicates citations, and assigns a server timestamp', () => {
    const company = companyIntelligenceProviderSchema.parse({
      opportunitySummary: provider.opportunitySummary,
      company: provider.company,
      companyMoment: provider.companyMoment,
      compensation: provider.compensation,
      hiringProcess: provider.hiringProcess,
      citations: [sourceId],
    });
    const candidate = candidateIntelligenceProviderSchema.parse({
      preparation: provider.preparation,
      candidateFit: provider.candidateFit,
      careerImpact: provider.careerImpact,
      applicationPositioning: provider.applicationPositioning,
      questionsToInvestigate: provider.questionsToInvestigate,
      citations: [sourceId],
    });
    const merged = mergeGeminiProviderIntelligence(company, candidate, '2026-08-12T12:00:00.000Z');
    expect(merged.citations).toEqual([sourceId]);
    expect(merged.researchTimestamp).toBe('2026-08-12T12:00:00.000Z');
  });

  it('rejects unknown citation ids, over-budget schema, and malformed null compensation', () => {
    const unknown = geminiProviderDossierSchema.parse({ ...provider, citations: ['not-a-source'] });
    expect(mapGeminiProviderDossier(unknown, new Map([[sourceId, 'known' as const]]))).toBeNull();
    expect(() =>
      assertGeminiProviderSchemaBudget({
        type: 'object',
        properties: Object.fromEntries(
          Array.from({ length: 76 }, (_, i) => [`p${i}`, { type: 'string' }]),
        ),
      }),
    ).toThrow('complexity budget');
    expect(
      geminiProviderDossierSchema.safeParse({
        ...provider,
        compensation: { ...provider.compensation, estimatedRange: {} },
      }).success,
    ).toBe(false);
  });
});
