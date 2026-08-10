import { describe, expect, it } from 'vitest';
import {
  aiJobAnalysisJsonSchema,
  aiJobAnalysisSchema,
  classifyAiAnalysisValidationFailure,
  SUMMARY_MAX_LENGTH,
  SUMMARY_MIN_LENGTH,
} from './schema';

const valid = {
  recommendation: 'apply',
  confidence: 'high',
  summary: 'Valid summary',
  strengths: [],
  gaps: [],
  risks: [],
  interviewFocus: [],
  deterministicAssessment: { score: 80, eligible: true },
};
const classification = (value: unknown) => {
  const parsed = aiJobAnalysisSchema.safeParse(value);
  return parsed.success
    ? null
    : classifyAiAnalysisValidationFailure(parsed.error, value).classification;
};

describe('AI structured-output classifier', () => {
  it('accepts the valid contract', () => expect(classification(valid)).toBeNull());
  it('classifies missing fields, enums, types, nulls, and string length constraints', () => {
    const missingRecommendation = { ...valid } as Partial<typeof valid>;
    delete missingRecommendation.recommendation;
    expect(classification(missingRecommendation)).toBe('missing_field');
    expect(classification({ ...valid, recommendation: 'maybe' })).toBe('invalid_enum');
    expect(
      classification({ ...valid, deterministicAssessment: { score: '80', eligible: true } }),
    ).toBe('invalid_type');
    expect(classification({ ...valid, summary: null })).toBe('unexpected_null');
    expect(classification({ ...valid, summary: '' })).toBe('string_too_short');
    expect(classification({ ...valid, summary: 'x'.repeat(SUMMARY_MAX_LENGTH + 1) })).toBe(
      'string_too_long',
    );
  });

  it('enforces the aligned summary boundaries in Zod and the Gemini JSON Schema', () => {
    expect(classification({ ...valid, summary: 'x'.repeat(SUMMARY_MIN_LENGTH) })).toBeNull();
    expect(classification({ ...valid, summary: '' })).toBe('string_too_short');
    expect(classification({ ...valid, summary: 'x'.repeat(SUMMARY_MAX_LENGTH) })).toBeNull();
    expect(classification({ ...valid, summary: 'x'.repeat(SUMMARY_MAX_LENGTH + 1) })).toBe(
      'string_too_long',
    );
    expect(aiJobAnalysisJsonSchema.properties.summary).toEqual({
      type: 'string',
      minLength: SUMMARY_MIN_LENGTH,
      maxLength: SUMMARY_MAX_LENGTH,
    });
  });
});
