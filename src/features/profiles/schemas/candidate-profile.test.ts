import { describe, expect, it } from 'vitest';

import { candidateProfileInputSchema, parseCandidateProfileFormData } from './candidate-profile';

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

  it('accepts empty excluded skills and normalizes comma-separated values', () => {
    const formData = new FormData();
    Object.entries({
      name: 'Maria',
      desiredRoles: 'Engineer',
      requiredSkills: 'React',
      preferredSkills: 'TypeScript, TypeScript',
      excludedSkills: '  ',
      locations: 'Brazil',
    }).forEach(([key, value]) => formData.set(key, value));
    formData.append('acceptedSeniorities', 'senior');
    formData.append('acceptedWorkModels', 'remote');

    const emptyExcluded = parseCandidateProfileFormData(formData);
    expect(emptyExcluded.success && emptyExcluded.data.excludedSkills).toEqual([]);
    formData.set('excludedSkills', 'Travel, travel, Night shifts');
    const populatedExcluded = parseCandidateProfileFormData(formData);
    expect(populatedExcluded.success && populatedExcluded.data.excludedSkills).toEqual([
      'Travel',
      'Night shifts',
    ]);
  });
});
