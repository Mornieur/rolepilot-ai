import { z } from 'zod';
export const OPPORTUNITY_DOSSIER_SCHEMA_VERSION = '2';
/** This version describes the deliberately small Gemini transport contract, not the persisted domain. */
export const GEMINI_PROVIDER_DOSSIER_VERSION = '2';
const evidence = z.object({
  sourceId: z.string().uuid(),
  classification: z.enum(['known', 'likely', 'anecdotal', 'unknown']),
});
const text = z.string().trim().min(1).max(800);
const topic = z.object({ topic: text.max(120), why: text, evidence: z.array(evidence).max(4) });
const impact = z.object({
  level: z.enum(['strong', 'moderate', 'limited', 'unknown']),
  explanation: text,
});

const evidenceJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['sourceId', 'classification'],
  properties: {
    sourceId: { type: 'string' },
    classification: { type: 'string', enum: ['known', 'likely', 'anecdotal', 'unknown'] },
  },
} as const;

const textJsonSchema = { type: 'string' } as const;
const textArrayJsonSchema = (maxItems: number) => ({
  type: 'array',
  maxItems,
  items: textJsonSchema,
});

export const opportunityDossierSchema = z.object({
  opportunitySummary: text,
  company: z.object({
    overview: text,
    categories: z
      .array(
        z.object({
          label: text.max(80),
          confidence: evidence.shape.classification,
          evidence: z.array(evidence).max(4),
        }),
      )
      .max(8),
    businessModel: text,
    stage: text,
    publicPrivateStatus: text,
    size: text,
    markets: z.array(text.max(160)).max(8),
    engineeringContext: text,
  }),
  companyMoment: z.object({
    knownFacts: z.array(text).max(8),
    recentDevelopments: z.array(text).max(8),
    inferences: z.array(text).max(8),
    unknowns: z.array(text).max(8),
  }),
  compensation: z.object({
    observations: z.array(text).max(8),
    estimatedRange: z.string().trim().max(160).nullable(),
    currencyUnit: z.string().trim().max(80).nullable(),
    components: z.array(text.max(120)).max(4),
    confidence: z.enum(['low', 'medium', 'high']),
    conflicts: z.array(text).max(6),
    unknowns: z.array(text).max(6),
  }),
  hiringProcess: z.object({
    officialKnownStages: z.array(text).max(8),
    anecdotalReportedStages: z.array(text).max(8),
    likelyExpectations: z.array(text).max(8),
    confidence: z.enum(['low', 'medium', 'high']),
  }),
  preparation: z.object({
    mustReview: z.array(topic).max(8),
    shouldReview: z.array(topic).max(8),
    optional: z.array(topic).max(8),
    behavioral: z.array(topic).max(8),
    companyKnowledge: z.array(topic).max(8),
  }),
  candidateFit: z.object({
    alreadyStrong: z.array(text).max(8),
    refresh: z.array(text).max(8),
    realGaps: z.array(text).max(8),
    unknowns: z.array(text).max(8),
  }),
  careerImpact: z.object({
    technicalGrowth: impact,
    leadershipExposure: impact,
    aiExposure: impact,
    productExposure: impact,
    internationalExposure: impact,
    compensationUpside: impact,
    roleScopeRisk: impact,
  }),
  applicationPositioning: z.object({
    emphasize: z.array(text).max(8),
    storiesToPrepare: z.array(text).max(8),
    evidenceToQuantify: z.array(text).max(8),
  }),
  questionsToInvestigate: z.array(text).max(10),
  citations: z.array(evidence).max(30),
  researchTimestamp: z.string().datetime(),
});

export const opportunityDossierJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'opportunitySummary',
    'company',
    'companyMoment',
    'compensation',
    'hiringProcess',
    'preparation',
    'candidateFit',
    'careerImpact',
    'applicationPositioning',
    'questionsToInvestigate',
    'citations',
    'researchTimestamp',
  ],
  properties: {
    opportunitySummary: textJsonSchema,
    company: {
      type: 'object',
      additionalProperties: false,
      required: [
        'overview',
        'categories',
        'businessModel',
        'stage',
        'publicPrivateStatus',
        'size',
        'markets',
        'engineeringContext',
      ],
      properties: {
        overview: textJsonSchema,
        categories: {
          type: 'array',
          maxItems: 8,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['label', 'confidence', 'evidence'],
            properties: {
              label: textJsonSchema,
              confidence: evidenceJsonSchema.properties.classification,
              evidence: { type: 'array', maxItems: 4, items: evidenceJsonSchema },
            },
          },
        },
        businessModel: textJsonSchema,
        stage: textJsonSchema,
        publicPrivateStatus: textJsonSchema,
        size: textJsonSchema,
        markets: textArrayJsonSchema(8),
        engineeringContext: textJsonSchema,
      },
    },
    companyMoment: {
      type: 'object',
      additionalProperties: false,
      required: ['knownFacts', 'recentDevelopments', 'inferences', 'unknowns'],
      properties: {
        knownFacts: textArrayJsonSchema(8),
        recentDevelopments: textArrayJsonSchema(8),
        inferences: textArrayJsonSchema(8),
        unknowns: textArrayJsonSchema(8),
      },
    },
    compensation: {
      type: 'object',
      additionalProperties: false,
      required: [
        'observations',
        'estimatedRange',
        'currencyUnit',
        'components',
        'confidence',
        'conflicts',
        'unknowns',
      ],
      properties: {
        observations: textArrayJsonSchema(8),
        estimatedRange: { type: ['string', 'null'] },
        currencyUnit: { type: ['string', 'null'] },
        components: textArrayJsonSchema(4),
        confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        conflicts: textArrayJsonSchema(6),
        unknowns: textArrayJsonSchema(6),
      },
    },
    hiringProcess: {
      type: 'object',
      additionalProperties: false,
      required: [
        'officialKnownStages',
        'anecdotalReportedStages',
        'likelyExpectations',
        'confidence',
      ],
      properties: {
        officialKnownStages: textArrayJsonSchema(8),
        anecdotalReportedStages: textArrayJsonSchema(8),
        likelyExpectations: textArrayJsonSchema(8),
        confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
    },
    preparation: {
      type: 'object',
      additionalProperties: false,
      required: ['mustReview', 'shouldReview', 'optional', 'behavioral', 'companyKnowledge'],
      properties: Object.fromEntries(
        ['mustReview', 'shouldReview', 'optional', 'behavioral', 'companyKnowledge'].map((key) => [
          key,
          {
            type: 'array',
            maxItems: 8,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['topic', 'why', 'evidence'],
              properties: {
                topic: textJsonSchema,
                why: textJsonSchema,
                evidence: { type: 'array', maxItems: 4, items: evidenceJsonSchema },
              },
            },
          },
        ]),
      ),
    },
    candidateFit: {
      type: 'object',
      additionalProperties: false,
      required: ['alreadyStrong', 'refresh', 'realGaps', 'unknowns'],
      properties: {
        alreadyStrong: textArrayJsonSchema(8),
        refresh: textArrayJsonSchema(8),
        realGaps: textArrayJsonSchema(8),
        unknowns: textArrayJsonSchema(8),
      },
    },
    careerImpact: {
      type: 'object',
      additionalProperties: false,
      required: [
        'technicalGrowth',
        'leadershipExposure',
        'aiExposure',
        'productExposure',
        'internationalExposure',
        'compensationUpside',
        'roleScopeRisk',
      ],
      properties: Object.fromEntries(
        [
          'technicalGrowth',
          'leadershipExposure',
          'aiExposure',
          'productExposure',
          'internationalExposure',
          'compensationUpside',
          'roleScopeRisk',
        ].map((key) => [
          key,
          {
            type: 'object',
            additionalProperties: false,
            required: ['level', 'explanation'],
            properties: {
              level: { type: 'string', enum: ['strong', 'moderate', 'limited', 'unknown'] },
              explanation: textJsonSchema,
            },
          },
        ]),
      ),
    },
    applicationPositioning: {
      type: 'object',
      additionalProperties: false,
      required: ['emphasize', 'storiesToPrepare', 'evidenceToQuantify'],
      properties: {
        emphasize: textArrayJsonSchema(8),
        storiesToPrepare: textArrayJsonSchema(8),
        evidenceToQuantify: textArrayJsonSchema(8),
      },
    },
    questionsToInvestigate: textArrayJsonSchema(10),
    citations: { type: 'array', maxItems: 30, items: evidenceJsonSchema },
    researchTimestamp: { type: 'string', format: 'date-time' },
  },
} as const;

const providerIds = z.array(z.string()).max(4);
const providerFinding = z.object({
  text: z.string(),
  sourceIds: providerIds,
  confidence: z.enum(['low', 'medium', 'high']),
});
const providerFindings = z.array(providerFinding).max(5);
const providerFindingJsonSchema = {
  type: 'object',
  required: ['text', 'sourceIds', 'confidence'],
  properties: {
    text: { type: 'string' },
    sourceIds: { type: 'array', maxItems: 4, items: { type: 'string' } },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
} as const;
const providerFindingsJsonSchema = {
  type: 'array',
  maxItems: 5,
  items: providerFindingJsonSchema,
} as const;

/** Transport-only contract: simple types/cardinality, never domain refinements or UUID formats. */
export const geminiProviderDossierJsonSchema = {
  type: 'object',
  required: [
    'opportunitySummary',
    'company',
    'companyMoment',
    'compensation',
    'hiringProcess',
    'preparation',
    'candidateFit',
    'careerImpact',
    'applicationPositioning',
    'questionsToInvestigate',
    'citations',
    'researchTimestamp',
  ],
  properties: {
    opportunitySummary: { type: 'string' },
    company: {
      type: 'object',
      required: ['findings', 'unknowns'],
      properties: {
        findings: providerFindingsJsonSchema,
        unknowns: { type: 'array', maxItems: 5, items: { type: 'string' } },
      },
    },
    companyMoment: {
      type: 'object',
      required: ['facts', 'inferences', 'unknowns'],
      properties: {
        facts: providerFindingsJsonSchema,
        inferences: providerFindingsJsonSchema,
        unknowns: { type: 'array', maxItems: 5, items: { type: 'string' } },
      },
    },
    compensation: {
      type: 'object',
      required: [
        'findings',
        'estimatedRange',
        'currencyUnit',
        'components',
        'confidence',
        'unknowns',
      ],
      properties: {
        findings: providerFindingsJsonSchema,
        estimatedRange: { type: ['string', 'null'] },
        currencyUnit: { type: ['string', 'null'] },
        components: { type: 'array', maxItems: 4, items: { type: 'string' } },
        confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        unknowns: { type: 'array', maxItems: 5, items: { type: 'string' } },
      },
    },
    hiringProcess: {
      type: 'object',
      required: ['official', 'anecdotal', 'likely', 'confidence'],
      properties: {
        official: providerFindingsJsonSchema,
        anecdotal: providerFindingsJsonSchema,
        likely: providerFindingsJsonSchema,
        confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
    },
    preparation: {
      type: 'object',
      required: ['technical', 'behavioral', 'company'],
      properties: {
        technical: providerFindingsJsonSchema,
        behavioral: providerFindingsJsonSchema,
        company: providerFindingsJsonSchema,
      },
    },
    candidateFit: {
      type: 'object',
      required: ['strengths', 'refresh', 'gaps', 'unknowns'],
      properties: {
        strengths: { type: 'array', maxItems: 5, items: { type: 'string' } },
        refresh: { type: 'array', maxItems: 5, items: { type: 'string' } },
        gaps: { type: 'array', maxItems: 5, items: { type: 'string' } },
        unknowns: { type: 'array', maxItems: 5, items: { type: 'string' } },
      },
    },
    careerImpact: providerFindingsJsonSchema,
    applicationPositioning: {
      type: 'object',
      required: ['emphasize', 'stories', 'evidence'],
      properties: {
        emphasize: { type: 'array', maxItems: 5, items: { type: 'string' } },
        stories: { type: 'array', maxItems: 5, items: { type: 'string' } },
        evidence: { type: 'array', maxItems: 5, items: { type: 'string' } },
      },
    },
    questionsToInvestigate: { type: 'array', maxItems: 6, items: { type: 'string' } },
    citations: { type: 'array', maxItems: 10, items: { type: 'string' } },
    researchTimestamp: { type: 'string' },
  },
} as const;

type ProviderSchemaSection = keyof typeof geminiProviderDossierJsonSchema.properties;
const providerSchemaSections = geminiProviderDossierJsonSchema.properties as Record<
  ProviderSchemaSection,
  Record<string, unknown>
>;
function providerSchemaFor(sections: readonly ProviderSchemaSection[]) {
  return {
    type: 'object',
    required: [...sections],
    properties: Object.fromEntries(
      sections.map((section) => [section, providerSchemaSections[section]]),
    ),
  } as const;
}

export const COMPANY_INTELLIGENCE_PROVIDER_DTO_VERSION = '1';
export const CANDIDATE_INTELLIGENCE_PROVIDER_DTO_VERSION = '1';
export const companyIntelligenceProviderJsonSchema = providerSchemaFor([
  'opportunitySummary',
  'company',
  'companyMoment',
  'compensation',
  'hiringProcess',
  'citations',
]);
export const candidateIntelligenceProviderJsonSchema = providerSchemaFor([
  'preparation',
  'candidateFit',
  'careerImpact',
  'applicationPositioning',
  'questionsToInvestigate',
  'citations',
]);

export const geminiProviderDossierSchema = z.object({
  opportunitySummary: z.string(),
  company: z.object({ findings: providerFindings, unknowns: z.array(z.string()).max(5) }),
  companyMoment: z.object({
    facts: providerFindings,
    inferences: providerFindings,
    unknowns: z.array(z.string()).max(5),
  }),
  compensation: z.object({
    findings: providerFindings,
    estimatedRange: z.string().nullable(),
    currencyUnit: z.string().nullable(),
    components: z.array(z.string()).max(4),
    confidence: z.enum(['low', 'medium', 'high']),
    unknowns: z.array(z.string()).max(5),
  }),
  hiringProcess: z.object({
    official: providerFindings,
    anecdotal: providerFindings,
    likely: providerFindings,
    confidence: z.enum(['low', 'medium', 'high']),
  }),
  preparation: z.object({
    technical: providerFindings,
    behavioral: providerFindings,
    company: providerFindings,
  }),
  candidateFit: z.object({
    strengths: z.array(z.string()).max(5),
    refresh: z.array(z.string()).max(5),
    gaps: z.array(z.string()).max(5),
    unknowns: z.array(z.string()).max(5),
  }),
  careerImpact: providerFindings,
  applicationPositioning: z.object({
    emphasize: z.array(z.string()).max(5),
    stories: z.array(z.string()).max(5),
    evidence: z.array(z.string()).max(5),
  }),
  questionsToInvestigate: z.array(z.string()).max(6),
  citations: z.array(z.string()).max(10),
  researchTimestamp: z.string(),
});
export const companyIntelligenceProviderSchema = geminiProviderDossierSchema.pick({
  opportunitySummary: true,
  company: true,
  companyMoment: true,
  compensation: true,
  hiringProcess: true,
  citations: true,
});
export const candidateIntelligenceProviderSchema = geminiProviderDossierSchema.pick({
  preparation: true,
  candidateFit: true,
  careerImpact: true,
  applicationPositioning: true,
  questionsToInvestigate: true,
  citations: true,
});
type GeminiProviderDossier = z.output<typeof geminiProviderDossierSchema>;
type CompanyIntelligenceProviderDossier = z.output<typeof companyIntelligenceProviderSchema>;
type CandidateIntelligenceProviderDossier = z.output<typeof candidateIntelligenceProviderSchema>;
type DossierEvidence = z.output<typeof evidence>;
export function mapGeminiProviderDossier(
  dossier: GeminiProviderDossier,
  sourceClassifications: ReadonlyMap<string, DossierEvidence['classification']>,
) {
  const refs = (ids: string[]) => {
    const values = ids.map((sourceId) => {
      const classification = sourceClassifications.get(sourceId);
      return classification ? { sourceId, classification } : null;
    });
    return values.every((value): value is DossierEvidence => value !== null) ? values : null;
  };
  const citations = refs(dossier.citations);
  if (!citations) return null;
  const findings = (items: typeof dossier.company.findings) =>
    items
      .map((item) => ({ item, evidence: refs(item.sourceIds) }))
      .every((value) => value.evidence !== null)
      ? items
      : null;
  const allFindings = [
    dossier.company.findings,
    dossier.companyMoment.facts,
    dossier.companyMoment.inferences,
    dossier.compensation.findings,
    dossier.hiringProcess.official,
    dossier.hiringProcess.anecdotal,
    dossier.hiringProcess.likely,
    dossier.preparation.technical,
    dossier.preparation.behavioral,
    dossier.preparation.company,
    dossier.careerImpact,
  ];
  if (allFindings.some((items) => !findings(items))) return null;
  const topic = (item: (typeof dossier.preparation.technical)[number]) => ({
    topic: item.text,
    why: item.text,
    evidence: refs(item.sourceIds)!,
  });
  const impactKeys = [
    'technicalGrowth',
    'leadershipExposure',
    'aiExposure',
    'productExposure',
    'internationalExposure',
    'compensationUpside',
    'roleScopeRisk',
  ] as const;
  const firstImpact = dossier.careerImpact[0];
  const defaultImpact = { level: 'unknown' as const, explanation: 'No provider finding.' };
  return {
    opportunitySummary: dossier.opportunitySummary,
    company: {
      overview: dossier.company.findings.map((x) => x.text).join(' ') || 'Unknown.',
      categories: dossier.company.findings.map((x) => ({
        label: x.text,
        confidence: sourceClassifications.get(x.sourceIds[0] ?? '') ?? 'unknown',
        evidence: refs(x.sourceIds)!,
      })),
      businessModel: 'Unknown.',
      stage: 'Unknown.',
      publicPrivateStatus: 'Unknown.',
      size: 'Unknown.',
      markets: [],
      engineeringContext: 'Unknown.',
    },
    companyMoment: {
      knownFacts: dossier.companyMoment.facts.map((x) => x.text),
      recentDevelopments: [],
      inferences: dossier.companyMoment.inferences.map((x) => x.text),
      unknowns: dossier.companyMoment.unknowns,
    },
    compensation: {
      observations: dossier.compensation.findings.map((x) => x.text),
      estimatedRange: dossier.compensation.estimatedRange,
      currencyUnit: dossier.compensation.currencyUnit,
      components: dossier.compensation.components,
      confidence: dossier.compensation.confidence,
      conflicts: [],
      unknowns: dossier.compensation.unknowns,
    },
    hiringProcess: {
      officialKnownStages: dossier.hiringProcess.official.map((x) => x.text),
      anecdotalReportedStages: dossier.hiringProcess.anecdotal.map((x) => x.text),
      likelyExpectations: dossier.hiringProcess.likely.map((x) => x.text),
      confidence: dossier.hiringProcess.confidence,
    },
    preparation: {
      mustReview: dossier.preparation.technical.map(topic),
      shouldReview: [],
      optional: [],
      behavioral: dossier.preparation.behavioral.map(topic),
      companyKnowledge: dossier.preparation.company.map(topic),
    },
    candidateFit: {
      alreadyStrong: dossier.candidateFit.strengths,
      refresh: dossier.candidateFit.refresh,
      realGaps: dossier.candidateFit.gaps,
      unknowns: dossier.candidateFit.unknowns,
    },
    careerImpact: Object.fromEntries(
      impactKeys.map((key) => [
        key,
        firstImpact
          ? {
              level:
                firstImpact.confidence === 'high'
                  ? 'strong'
                  : firstImpact.confidence === 'medium'
                    ? 'moderate'
                    : 'limited',
              explanation: firstImpact.text,
            }
          : defaultImpact,
      ]),
    ),
    applicationPositioning: {
      emphasize: dossier.applicationPositioning.emphasize,
      storiesToPrepare: dossier.applicationPositioning.stories,
      evidenceToQuantify: dossier.applicationPositioning.evidence,
    },
    questionsToInvestigate: dossier.questionsToInvestigate,
    citations,
    researchTimestamp: dossier.researchTimestamp,
  };
}

/** Server-owned merge: DTO sections are disjoint; citations are deduplicated before validation. */
export function mergeGeminiProviderIntelligence(
  company: CompanyIntelligenceProviderDossier,
  candidate: CandidateIntelligenceProviderDossier,
  researchTimestamp: string,
) {
  return geminiProviderDossierSchema.parse({
    ...company,
    ...candidate,
    citations: [...new Set([...company.citations, ...candidate.citations])],
    researchTimestamp,
  });
}

export type GeminiSchemaComplexity = {
  serializedBytes: number;
  maxDepth: number;
  propertyCount: number;
  requiredFieldCount: number;
  enumCount: number;
  arraySchemaCount: number;
};

/** Internal regression guardrails, deliberately not presented as Gemini API limits. */
export const GEMINI_PROVIDER_SCHEMA_BUDGET = {
  maxSerializedBytes: 6_000,
  maxDepth: 6,
  maxPropertyCount: 75,
} as const;

export function assertGeminiProviderSchemaBudget(schema: unknown) {
  const metrics = geminiSchemaComplexity(schema);
  if (
    metrics.serializedBytes > GEMINI_PROVIDER_SCHEMA_BUDGET.maxSerializedBytes ||
    metrics.maxDepth > GEMINI_PROVIDER_SCHEMA_BUDGET.maxDepth ||
    metrics.propertyCount > GEMINI_PROVIDER_SCHEMA_BUDGET.maxPropertyCount
  )
    throw new Error('Gemini provider schema exceeds the internal complexity budget.');
  return metrics;
}

export function geminiSchemaComplexity(schema: unknown): GeminiSchemaComplexity {
  const metrics: GeminiSchemaComplexity = {
    serializedBytes: Buffer.byteLength(JSON.stringify(schema), 'utf8'),
    maxDepth: 0,
    propertyCount: 0,
    requiredFieldCount: 0,
    enumCount: 0,
    arraySchemaCount: 0,
  };
  const walk = (value: unknown, depth: number) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const node = value as Record<string, unknown>;
    metrics.maxDepth = Math.max(metrics.maxDepth, depth);
    if (node.type === 'array') metrics.arraySchemaCount += 1;
    if (Array.isArray(node.enum)) metrics.enumCount += 1;
    if (node.properties && typeof node.properties === 'object' && !Array.isArray(node.properties)) {
      const properties = Object.values(node.properties as Record<string, unknown>);
      metrics.propertyCount += properties.length;
      properties.forEach((property) => walk(property, depth + 1));
    }
    if (Array.isArray(node.required)) metrics.requiredFieldCount += node.required.length;
    if (node.items) walk(node.items, depth + 1);
  };
  walk(schema, 1);
  return metrics;
}

export function geminiSchemaSectionComplexity(schema: unknown) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return {};
  const properties = (schema as { properties?: unknown }).properties;
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return {};
  return Object.fromEntries(
    Object.entries(properties as Record<string, unknown>).map(([name, section]) => [
      name,
      geminiSchemaComplexity(section),
    ]),
  );
}

function valueAtPath(value: unknown, path: PropertyKey[]): unknown {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== 'object' || !Object.hasOwn(current, key)) return undefined;
    current = (current as Record<PropertyKey, unknown>)[key];
  }
  return current;
}

function jsonValueCategory(value: unknown) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function opportunityDossierValidationIssues(error: z.ZodError, value: unknown) {
  return error.issues.slice(0, 20).map((issue) => {
    const expected =
      issue.code === 'invalid_value'
        ? 'enum'
        : typeof (issue as { expected?: unknown }).expected === 'string'
          ? (issue as { expected: string }).expected
          : undefined;
    return {
      path: issue.path.join('.') || 'root',
      code: issue.code,
      ...(expected ? { expected } : {}),
      actual: jsonValueCategory(valueAtPath(value, issue.path)),
    };
  });
}

export function hasOnlyKnownDossierCitations(
  dossier: z.output<typeof opportunityDossierSchema>,
  sourceIds: Set<string>,
) {
  const references = [
    ...dossier.citations,
    ...dossier.company.categories.flatMap((category) => category.evidence),
    ...Object.values(dossier.preparation).flatMap((topics) =>
      topics.flatMap((topic) => topic.evidence),
    ),
  ];
  return references.every((reference) => sourceIds.has(reference.sourceId));
}

const geminiJsonSchemaKeywords = new Set([
  '$id',
  '$defs',
  '$ref',
  '$anchor',
  'type',
  'format',
  'title',
  'description',
  'enum',
  'items',
  'prefixItems',
  'minItems',
  'maxItems',
  'minimum',
  'maximum',
  'anyOf',
  'oneOf',
  'properties',
  'additionalProperties',
  'required',
  'propertyOrdering',
]);

export function findUnsupportedGeminiJsonSchemaKeywords(schema: unknown): string[] {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return [];
  const node = schema as Record<string, unknown>;
  const unsupported = Object.keys(node).filter((key) => !geminiJsonSchemaKeywords.has(key));
  const nested = [
    ...(node.items ? findUnsupportedGeminiJsonSchemaKeywords(node.items) : []),
    ...(node.$defs && typeof node.$defs === 'object' && !Array.isArray(node.$defs)
      ? Object.values(node.$defs as Record<string, unknown>).flatMap(
          findUnsupportedGeminiJsonSchemaKeywords,
        )
      : []),
    ...(Array.isArray(node.anyOf)
      ? node.anyOf.flatMap(findUnsupportedGeminiJsonSchemaKeywords)
      : []),
    ...(Array.isArray(node.oneOf)
      ? node.oneOf.flatMap(findUnsupportedGeminiJsonSchemaKeywords)
      : []),
    ...(node.properties && typeof node.properties === 'object'
      ? Object.values(node.properties as Record<string, unknown>).flatMap(
          findUnsupportedGeminiJsonSchemaKeywords,
        )
      : []),
  ];
  return [...unsupported, ...nested];
}
