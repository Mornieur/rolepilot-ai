import { z } from 'zod';
export const OPPORTUNITY_DOSSIER_SCHEMA_VERSION = '1';
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

const providerEvidenceJsonSchema = (maxItems: number) =>
  ({ type: 'array', maxItems, items: { type: 'string' } }) as const;
const providerTopicJsonSchema = {
  type: 'object',
  required: ['topic', 'why', 'sourceIds'],
  properties: {
    topic: textJsonSchema,
    why: textJsonSchema,
    sourceIds: providerEvidenceJsonSchema(4),
  },
} as const;
const providerImpactJsonSchema = {
  type: 'object',
  required: ['level', 'explanation'],
  properties: {
    level: { type: 'string', enum: ['strong', 'moderate', 'limited', 'unknown'] },
    explanation: textJsonSchema,
  },
} as const;

/**
 * Gemini's guide schema intentionally omits object closure, string limits, and
 * repeated evidence objects. It retains array cardinality so Gemini is asked
 * to produce output accepted by the authoritative contract below the
 * deterministic mapping boundary.
 */
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
    opportunitySummary: textJsonSchema,
    company: {
      type: 'object',
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
            required: ['label', 'confidence', 'sourceIds'],
            properties: {
              label: textJsonSchema,
              confidence: evidenceJsonSchema.properties.classification,
              sourceIds: providerEvidenceJsonSchema(4),
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
      required: ['mustReview', 'shouldReview', 'optional', 'behavioral', 'companyKnowledge'],
      properties: Object.fromEntries(
        ['mustReview', 'shouldReview', 'optional', 'behavioral', 'companyKnowledge'].map((key) => [
          key,
          { type: 'array', maxItems: 8, items: providerTopicJsonSchema },
        ]),
      ),
    },
    candidateFit: {
      type: 'object',
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
        ].map((key) => [key, providerImpactJsonSchema]),
      ),
    },
    applicationPositioning: {
      type: 'object',
      required: ['emphasize', 'storiesToPrepare', 'evidenceToQuantify'],
      properties: {
        emphasize: textArrayJsonSchema(8),
        storiesToPrepare: textArrayJsonSchema(8),
        evidenceToQuantify: textArrayJsonSchema(8),
      },
    },
    questionsToInvestigate: textArrayJsonSchema(10),
    citations: providerEvidenceJsonSchema(30),
    researchTimestamp: textJsonSchema,
  },
} as const;

const providerEvidence = (maxItems: number) => z.array(z.string().uuid()).max(maxItems);
const providerTopic = z.object({
  topic: z.string(),
  why: z.string(),
  sourceIds: providerEvidence(4),
});
const providerImpact = z.object({
  level: z.enum(['strong', 'moderate', 'limited', 'unknown']),
  explanation: z.string(),
});

export const geminiProviderDossierSchema = z.object({
  opportunitySummary: z.string(),
  company: z.object({
    overview: z.string(),
    categories: z
      .array(
        z.object({
          label: z.string(),
          confidence: evidence.shape.classification,
          sourceIds: providerEvidence(4),
        }),
      )
      .max(8),
    businessModel: z.string(),
    stage: z.string(),
    publicPrivateStatus: z.string(),
    size: z.string(),
    markets: z.array(z.string()).max(8),
    engineeringContext: z.string(),
  }),
  companyMoment: z.object({
    knownFacts: z.array(z.string()).max(8),
    recentDevelopments: z.array(z.string()).max(8),
    inferences: z.array(z.string()).max(8),
    unknowns: z.array(z.string()).max(8),
  }),
  compensation: z.object({
    observations: z.array(z.string()).max(8),
    estimatedRange: z.string().nullable(),
    currencyUnit: z.string().nullable(),
    components: z.array(z.string()).max(4),
    confidence: z.enum(['low', 'medium', 'high']),
    conflicts: z.array(z.string()).max(6),
    unknowns: z.array(z.string()).max(6),
  }),
  hiringProcess: z.object({
    officialKnownStages: z.array(z.string()).max(8),
    anecdotalReportedStages: z.array(z.string()).max(8),
    likelyExpectations: z.array(z.string()).max(8),
    confidence: z.enum(['low', 'medium', 'high']),
  }),
  preparation: z.object({
    mustReview: z.array(providerTopic).max(8),
    shouldReview: z.array(providerTopic).max(8),
    optional: z.array(providerTopic).max(8),
    behavioral: z.array(providerTopic).max(8),
    companyKnowledge: z.array(providerTopic).max(8),
  }),
  candidateFit: z.object({
    alreadyStrong: z.array(z.string()).max(8),
    refresh: z.array(z.string()).max(8),
    realGaps: z.array(z.string()).max(8),
    unknowns: z.array(z.string()).max(8),
  }),
  careerImpact: z.object({
    technicalGrowth: providerImpact,
    leadershipExposure: providerImpact,
    aiExposure: providerImpact,
    productExposure: providerImpact,
    internationalExposure: providerImpact,
    compensationUpside: providerImpact,
    roleScopeRisk: providerImpact,
  }),
  applicationPositioning: z.object({
    emphasize: z.array(z.string()).max(8),
    storiesToPrepare: z.array(z.string()).max(8),
    evidenceToQuantify: z.array(z.string()).max(8),
  }),
  questionsToInvestigate: z.array(z.string()).max(10),
  citations: providerEvidence(30),
  researchTimestamp: z.string(),
});

type GeminiProviderDossier = z.output<typeof geminiProviderDossierSchema>;
type DossierEvidence = z.output<typeof evidence>;

export function mapGeminiProviderDossier(
  dossier: GeminiProviderDossier,
  sourceClassifications: ReadonlyMap<string, DossierEvidence['classification']>,
) {
  const evidenceFor = (sourceIds: string[]) => {
    const references = sourceIds.map((sourceId) => {
      const classification = sourceClassifications.get(sourceId);
      return classification ? { sourceId, classification } : undefined;
    });
    return references.every((reference): reference is DossierEvidence => reference !== undefined)
      ? references
      : null;
  };
  const citations = evidenceFor(dossier.citations);
  if (!citations) return null;
  const categories = dossier.company.categories.map((category) => {
    const references = evidenceFor(category.sourceIds);
    return references ? { ...category, evidence: references } : null;
  });
  if (categories.some((category) => category === null)) return null;
  const preparation = Object.fromEntries(
    Object.entries(dossier.preparation).map(([key, topics]) => [
      key,
      topics.map((topic) => {
        const references = evidenceFor(topic.sourceIds);
        return references ? { topic: topic.topic, why: topic.why, evidence: references } : null;
      }),
    ]),
  );
  if (Object.values(preparation).some((topics) => topics.some((topic) => topic === null)))
    return null;
  return {
    ...dossier,
    company: { ...dossier.company, categories },
    preparation,
    citations,
  };
}

export type GeminiSchemaComplexity = {
  serializedBytes: number;
  maxDepth: number;
  propertyCount: number;
  requiredFieldCount: number;
  enumCount: number;
  arraySchemaCount: number;
};

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
    ...(node.properties && typeof node.properties === 'object'
      ? Object.values(node.properties as Record<string, unknown>).flatMap(
          findUnsupportedGeminiJsonSchemaKeywords,
        )
      : []),
  ];
  return [...unsupported, ...nested];
}
