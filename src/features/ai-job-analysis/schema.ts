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
    summary: { type: 'string' },
    strengths: {
      type: 'array',
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'evidence'],
        properties: { title: { type: 'string' }, evidence: { type: 'string' } },
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
          title: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          explanation: { type: 'string' },
        },
      },
    },
    risks: { type: 'array', maxItems: 4, items: { type: 'string' } },
    interviewFocus: { type: 'array', maxItems: 4, items: { type: 'string' } },
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
