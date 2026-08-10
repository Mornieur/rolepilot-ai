import { z } from 'zod';

export const AI_JOB_ANALYSIS_SCHEMA_VERSION = '1';

const short = z.string().trim().min(1).max(280);
export const aiJobAnalysisSchema = z.object({
  recommendation: z.enum(['strong_apply', 'apply', 'consider', 'skip']),
  confidence: z.enum(['low', 'medium', 'high']),
  summary: short.max(600),
  strengths: z.array(z.object({ title: short.max(100), evidence: short })).max(4),
  gaps: z
    .array(
      z.object({
        title: short.max(100),
        severity: z.enum(['low', 'medium', 'high']),
        explanation: short,
      }),
    )
    .max(4),
  risks: z.array(short).max(4),
  interviewFocus: z.array(short).max(4),
  deterministicAssessment: z.object({
    score: z.number().int().min(0).max(100),
    eligible: z.literal(true),
  }),
});
export type InvalidAiAnalysisClassification =
  | 'invalid_json'
  | 'missing_field'
  | 'invalid_enum'
  | 'invalid_type'
  | 'unexpected_null'
  | 'string_constraint'
  | 'deterministic_score_mismatch'
  | 'schema_validation_failed';

export function classifyAiAnalysisValidationFailure(
  error: z.ZodError,
  value?: unknown,
): { classification: InvalidAiAnalysisClassification; fieldPath: string } {
  const issue = error.issues[0];
  const fieldPath = issue?.path.join('.') || 'root';
  const pathIsMissing = (path: PropertyKey[]) => {
    let current: unknown = value;
    for (const key of path) {
      if (!current || typeof current !== 'object' || !Object.hasOwn(current, key)) return true;
      current = (current as Record<PropertyKey, unknown>)[key];
    }
    return false;
  };
  if (issue && pathIsMissing(issue.path)) return { classification: 'missing_field', fieldPath };
  if (issue?.code === 'invalid_type' && /undefined|required/i.test(issue.message))
    return { classification: 'missing_field', fieldPath };
  if (issue?.code === 'invalid_type' && /null/i.test(issue.message))
    return { classification: 'unexpected_null', fieldPath };
  if (issue?.code === 'invalid_value') return { classification: 'invalid_enum', fieldPath };
  if (issue?.code === 'invalid_type') return { classification: 'invalid_type', fieldPath };
  if (issue?.code === 'too_small' || issue?.code === 'too_big')
    return { classification: 'string_constraint', fieldPath };
  return { classification: 'schema_validation_failed', fieldPath };
}
export const aiJobAnalysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'recommendation',
    'confidence',
    'summary',
    'strengths',
    'gaps',
    'risks',
    'interviewFocus',
    'deterministicAssessment',
  ],
  properties: {
    recommendation: { type: 'string', enum: ['strong_apply', 'apply', 'consider', 'skip'] },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    summary: { type: 'string', minLength: 1, maxLength: 600 },
    strengths: {
      type: 'array',
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'evidence'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 100 },
          evidence: { type: 'string', minLength: 1, maxLength: 280 },
        },
      },
    },
    gaps: {
      type: 'array',
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'severity', 'explanation'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 100 },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          explanation: { type: 'string', minLength: 1, maxLength: 280 },
        },
      },
    },
    risks: { type: 'array', maxItems: 4, items: { type: 'string', minLength: 1, maxLength: 280 } },
    interviewFocus: {
      type: 'array',
      maxItems: 4,
      items: { type: 'string', minLength: 1, maxLength: 280 },
    },
    deterministicAssessment: {
      type: 'object',
      additionalProperties: false,
      required: ['score', 'eligible'],
      properties: {
        score: { type: 'integer', minimum: 0, maximum: 100 },
        eligible: { type: 'boolean', const: true },
      },
    },
  },
} as const;
