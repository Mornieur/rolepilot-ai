import { describe, expect, it } from 'vitest';
import { evaluateJob } from './evaluate';
import type { CandidateProfile, PersistedJob } from '@/types/domain';

const profile: CandidateProfile = {
  id: 'maria',
  name: 'Maria',
  desiredRoles: ['Frontend Engineer'],
  acceptedSeniorities: ['mid', 'senior'],
  requiredSkills: ['React', 'TypeScript'],
  preferredSkills: [],
  excludedSkills: [],
  acceptedWorkModels: ['remote', 'hybrid'],
  locations: ['Sao Paulo'],
};
const base = (title: string, descriptionText = 'React TypeScript remote') =>
  ({
    id: title,
    provider: 'greenhouse',
    targetCompanyId: 'company',
    externalId: title,
    title,
    location: 'Sao Paulo',
    descriptionText,
    originalUrl: 'https://example.test',
    sourceUpdatedAt: null,
    language: 'en',
    departments: [],
    offices: [],
    firstSeenAt: '2026-01-01',
    lastSeenAt: '2026-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }) as PersistedJob;

const cases = [
  ['ideal React TypeScript frontend', base('Senior Frontend Engineer'), true],
  ['frontend title without React', base('Frontend Developer'), true],
  ['UI Engineer is a direct frontend title', base('UI Engineer', 'TypeScript remote'), true],
  ['UI Designer is not a frontend engineering title', base('UI Designer'), false],
  [
    'software engineer frontend-heavy',
    base('Software Engineer', 'React TypeScript frontend web remote'),
    true,
  ],
  ['full stack frontend', base('Full Stack Engineer', 'React TypeScript frontend remote'), true],
  [
    'web engineer needs frontend requirements beyond its title',
    base('Web Engineer', 'React TypeScript remote'),
    true,
  ],
  [
    'web engineer without frontend requirements is rejected',
    base('Web Engineer', 'Node.js remote'),
    false,
  ],
  [
    'design system engineer is adjacent with frontend requirements',
    base('Design System Engineer', 'React TypeScript frontend remote'),
    true,
  ],
  [
    'design system engineer without frontend requirements is rejected',
    base('Design System Engineer', 'Node.js remote'),
    false,
  ],
  ['backend only', base('Backend Engineer', 'Java Spring remote'), false],
  [
    'backend software engineer remains distant when the profile also accepts generic engineering titles',
    base('Senior Backend Software Engineer', 'Java Spring remote'),
    false,
  ],
  ['data engineer', base('Data Engineer', 'Python SQL remote'), false],
  ['cybersecurity', base('Cybersecurity Engineer', 'Security remote'), false],
  ['product manager', base('Product Manager', 'Roadmap remote'), false],
  ['sales', base('Sales Executive', 'Pipeline remote'), false],
  ['account executive', base('Account Executive', 'Pipeline remote'), false],
  ['customer success', base('Customer Success Manager', 'Customer retention remote'), false],
  ['HR', base('HR Business Partner', 'People remote'), false],
  ['finance', base('Finance Analyst', 'Excel remote'), false],
  ['operations', base('Operations Manager', 'Process improvement remote'), false],
  ['legal', base('Legal Counsel', 'Contracts remote'), false],
  ['data analyst', base('Data Analyst', 'SQL dashboards remote'), false],
  ['mid versus senior', base('Senior Frontend Engineer'), true],
  ['senior versus mid', base('Mid Frontend Engineer'), true],
  ['remote Portugal', { ...base('Frontend Engineer'), location: 'Portugal (Remote)' }, true],
  [
    'hybrid Sao Paulo',
    {
      ...base('Frontend Engineer'),
      location: 'Sao Paulo (Hybrid)',
      descriptionText: 'React TypeScript hybrid',
    },
    true,
  ],
  [
    'on-site outside Sao Paulo',
    {
      ...base('Frontend Engineer'),
      location: 'Rio de Janeiro',
      descriptionText: 'React TypeScript onsite',
    },
    false,
  ],
  [
    'unknown location',
    { ...base('Frontend Engineer'), location: null, descriptionText: 'React TypeScript' },
    true,
  ],
  ['unknown seniority', base('Frontend Engineer'), true],
  ['partial required skills', base('Frontend Engineer', 'React remote'), true],
  ['zero required skills', base('Frontend Engineer', 'CSS HTML remote'), false],
  ['UI design-system role', base('UI Engineer', 'React TypeScript design system remote'), true],
] as const;

describe('matching quality fixture dataset', () => {
  it.each(cases)('%s follows the documented eligibility policy', (_name, job, eligible) => {
    expect(evaluateJob(profile, job).eligible).toBe(eligible);
  });
  it('records partial skill coverage as a warning and hard rejections as failures', () => {
    expect(evaluateJob(profile, base('Frontend Engineer', 'React remote')).reasons).toContainEqual(
      expect.objectContaining({ code: 'required-partial', outcome: 'neutral' }),
    );
    expect(evaluateJob(profile, base('Sales Executive', 'Pipeline remote')).reasons).toContainEqual(
      expect.objectContaining({ code: 'title', outcome: 'fail' }),
    );
  });
  it('requires frontend evidence for a generic software-engineering target', () => {
    const genericEngineeringProfile = {
      ...profile,
      desiredRoles: [...profile.desiredRoles, 'Software Engineer'],
    };

    expect(
      evaluateJob(
        genericEngineeringProfile,
        base('Senior Backend Software Engineer', 'Java Spring remote'),
      ).titleMatch.matched,
    ).toBe(false);
    expect(
      evaluateJob(
        genericEngineeringProfile,
        base('Senior Software Engineer', 'React TypeScript frontend remote'),
      ).eligible,
    ).toBe(true);
    expect(
      evaluateJob(
        genericEngineeringProfile,
        base('Senior Software Engineer - Android', 'React TypeScript UI design system remote'),
      ).titleMatch.matched,
    ).toBe(false);
  });
});
