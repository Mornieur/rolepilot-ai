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
  shortenDossierPresentationLabel,
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

  it('shortens presentation labels at word boundaries without changing factual text', () => {
    const exact = 'a'.repeat(80);
    expect(shortenDossierPresentationLabel(exact, 80)).toEqual({ value: exact, normalized: false });
    expect(shortenDossierPresentationLabel('a'.repeat(120), 120)).toEqual({
      value: 'a'.repeat(120),
      normalized: false,
    });
    expect(shortenDossierPresentationLabel('a'.repeat(81), 80).normalized).toBe(false);
    expect(shortenDossierPresentationLabel('a'.repeat(121), 120).normalized).toBe(false);
    expect(shortenDossierPresentationLabel('palavra '.repeat(50), 80)).toMatchObject({
      normalized: true,
    });
    expect(shortenDossierPresentationLabel('Produto financeiro para empresas', 20)).toEqual({
      value: 'Produto financeiro…',
      normalized: true,
    });
    expect(
      shortenDossierPresentationLabel('Pesquisa com português e ação para clientes', 28),
    ).toEqual({
      value: 'Pesquisa com português e…',
      normalized: true,
    });
    expect(shortenDossierPresentationLabel('x'.repeat(81), 80)).toEqual({
      value: 'x'.repeat(81),
      normalized: false,
    });
  });

  it('normalizes every approved provider label while preserving citations and full topic rationale', () => {
    const category =
      'Categoria estratégica de plataforma para clientes empresariais globais regulados de alto crescimento';
    const topic =
      'Preparação aprofundada sobre arquitetura distribuída, confiabilidade e decisões técnicas para entrevistas de sistemas complexos';
    const normalized: string[] = [];
    const mapped = mapGeminiProviderDossier(
      geminiProviderDossierSchema.parse({
        ...provider,
        company: { findings: [{ ...finding, text: category }], unknowns: [] },
        preparation: {
          technical: [{ ...finding, text: topic }],
          behavioral: [{ ...finding, text: topic }],
          company: [{ ...finding, text: topic }],
        },
      }),
      new Map([[sourceId, 'known' as const]]),
      (field) => normalized.push(field),
    );
    const dossier = opportunityDossierSchema.parse(mapped);
    expect(dossier.company.categories[0]?.label.length).toBeLessThanOrEqual(80);
    expect(dossier.preparation.mustReview[0]?.topic.length).toBeLessThanOrEqual(120);
    expect(dossier.preparation.behavioral[0]?.topic.length).toBeLessThanOrEqual(120);
    expect(dossier.preparation.companyKnowledge[0]?.topic.length).toBeLessThanOrEqual(120);
    expect(dossier.preparation.mustReview[0]?.why).toBe(topic);
    expect(dossier.citations).toEqual([{ sourceId, classification: 'known' }]);
    expect(normalized).toEqual([
      'companyCategoryLabel',
      'preparationTopic',
      'preparationTopic',
      'preparationTopic',
    ]);

    const unnormalizedLabels = {
      ...dossier,
      company: {
        ...dossier.company,
        categories: [{ ...dossier.company.categories[0]!, label: category }],
      },
      preparation: {
        ...dossier.preparation,
        mustReview: [{ ...dossier.preparation.mustReview[0]!, topic }],
        behavioral: [{ ...dossier.preparation.behavioral[0]!, topic }],
        companyKnowledge: [{ ...dossier.preparation.companyKnowledge[0]!, topic }],
      },
    };
    expect(opportunityDossierSchema.safeParse(unnormalizedLabels).success).toBe(false);
  });

  it('keeps non-presentation and unbreakable semantic violations fail-fast', () => {
    const longCompensation = geminiProviderDossierSchema.parse({
      ...provider,
      compensation: { ...provider.compensation, estimatedRange: 'R$ '.repeat(54) },
    });
    const mappedCompensation = mapGeminiProviderDossier(
      longCompensation,
      new Map([[sourceId, 'known' as const]]),
    );
    expect(opportunityDossierSchema.safeParse(mappedCompensation).success).toBe(false);

    const unbreakableCategory = geminiProviderDossierSchema.parse({
      ...provider,
      company: { findings: [{ ...finding, text: 'x'.repeat(81) }], unknowns: [] },
    });
    const mappedCategory = mapGeminiProviderDossier(
      unbreakableCategory,
      new Map([[sourceId, 'known' as const]]),
    );
    expect(opportunityDossierSchema.safeParse(mappedCategory).success).toBe(false);
    expect(
      mapGeminiProviderDossier(
        geminiProviderDossierSchema.parse({
          ...provider,
          citations: ['citation-id-must-not-change'],
        }),
        new Map([[sourceId, 'known' as const]]),
      ),
    ).toBeNull();
  });
});
