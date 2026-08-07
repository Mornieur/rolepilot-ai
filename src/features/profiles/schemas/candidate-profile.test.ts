import { describe, expect, it } from 'vitest';

import { candidateProfileInputSchema } from './candidate-profile';

const validProfile = {
  name: '  Product analyst  ',
  desiredRoles: [' Data Analyst ', 'data analyst'],
  acceptedSeniorities: ['mid', 'mid'],
  requiredSkills: [' SQL ', 'Python'],
  preferredSkills: ['dbt', 'DBT'],
  excludedSkills: [],
  acceptedWorkModels: ['remote', 'remote'],
  locations: [' Brazil ', 'brazil'],
};

describe('candidate profile validation', () => {
  it('trims values and removes duplicate array entries', () => {
    const parsed = candidateProfileInputSchema.parse(validProfile);
    expect(parsed).toMatchObject({
      name: 'Product analyst',
      desiredRoles: ['Data Analyst'],
      preferredSkills: ['dbt'],
      acceptedSeniorities: ['mid'],
      locations: ['Brazil'],
    });
  });

  it('rejects empty names, list items, and unsupported literals', () => {
    const result = candidateProfileInputSchema.safeParse({
      ...validProfile,
      name: ' ',
      desiredRoles: [''],
      acceptedWorkModels: ['flexible'],
    });
    expect(result.success).toBe(false);
  });
});
