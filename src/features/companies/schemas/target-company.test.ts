import { describe, expect, it } from 'vitest';

import { targetCompanyInputSchema } from './target-company';

const validCompany = {
  name: '  Example Platform ',
  provider: 'greenhouse',
  boardIdentifier: ' Example-Board ',
  careersUrl: ' https://careers.example.test ',
  enabled: true,
  priority: 'high',
};

describe('target company validation', () => {
  it('trims and normalizes a valid company configuration', () => {
    expect(targetCompanyInputSchema.parse(validCompany)).toEqual({
      name: 'Example Platform',
      provider: 'greenhouse',
      boardIdentifier: 'example-board',
      careersUrl: 'https://careers.example.test',
      enabled: true,
      priority: 'high',
    });
  });

  it('rejects unsupported providers and invalid careers URLs', () => {
    const result = targetCompanyInputSchema.safeParse({
      ...validCompany,
      provider: 'workday',
      careersUrl: 'not a url',
    });
    expect(result.success).toBe(false);
  });

  it('does not store an empty optional careers URL', () => {
    expect(
      targetCompanyInputSchema.parse({ ...validCompany, careersUrl: '   ' }).careersUrl,
    ).toBeUndefined();
  });
});
