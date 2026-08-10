import { z } from 'zod';

export const AI_JOB_ANALYSIS_SCHEMA_VERSION = '1';
export const SUMMARY_MIN_LENGTH = 1;
export const SUMMARY_MAX_LENGTH = 600;

const short = z.string().trim().min(1).max(280);
const summary = z.string().trim().min(SUMMARY_MIN_LENGTH).max(SUMMARY_MAX_LENGTH);
export const aiJobAnalysisSchema = z.object({
  recommendation: z.enum(['strong_apply', 'apply', 'consider', 'skip']),
  confidence: z.enum(['low', 'medium', 'high']),
  summary,
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
  | 'incomplete_output'
  | 'missing_field'
  | 'invalid_enum'
  | 'invalid_type'
  | 'unexpected_null'
  | 'string_too_short'
  | 'string_too_long'
  | 'deterministic_score_mismatch'
  | 'schema_validation_failed';

export function jsonValueCategory(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function valueAtPath(value: unknown, path: PropertyKey[]): unknown {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== 'object' || !Object.hasOwn(current, key)) return undefined;
    current = (current as Record<PropertyKey, unknown>)[key];
  }
  return current;
}

export function classifyAiAnalysisValidationFailure(
  error: z.ZodError,
  value?: unknown,
): { classification: InvalidAiAnalysisClassification; fieldPath: string } {
  const issue = error.issues[0];
  const fieldPath = issue?.path.join('.') || 'root';
  const pathIsMissing = (path: PropertyKey[]) => {
    return valueAtPath(value, path) === undefined;
  };
  if (issue && pathIsMissing(issue.path)) return { classification: 'missing_field', fieldPath };
  if (issue?.code === 'invalid_type' && /undefined|required/i.test(issue.message))
    return { classification: 'missing_field', fieldPath };
  if (issue?.code === 'invalid_type' && /null/i.test(issue.message))
    return { classification: 'unexpected_null', fieldPath };
  if (issue?.code === 'invalid_value') return { classification: 'invalid_enum', fieldPath };
  if (issue?.code === 'invalid_type') return { classification: 'invalid_type', fieldPath };
  const issueOrigin = (issue as { origin?: unknown } | undefined)?.origin;
  if (issue?.code === 'too_small' && issueOrigin === 'string')
    return { classification: 'string_too_short', fieldPath };
  if (issue?.code === 'too_big' && issueOrigin === 'string')
    return { classification: 'string_too_long', fieldPath };
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
    summary: { type: 'string', minLength: SUMMARY_MIN_LENGTH, maxLength: SUMMARY_MAX_LENGTH },
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
