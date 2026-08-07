import { describe, expect, it } from 'vitest';

import { mapGreenhouseResponse } from './mapper';
import type { TargetCompany } from '@/types/domain';

const company: TargetCompany = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Example',
  provider: 'greenhouse',
  boardIdentifier: 'example',
  enabled: true,
  priority: 'normal',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('Greenhouse response mapping', () => {
  it('maps valid jobs and excludes malformed individual jobs', () => {
    const result = mapGreenhouseResponse(
      {
        meta: { total: 2 },
        jobs: [
          {
            id: 12,
            internal_job_id: null,
            title: 'Engineer',
            updated_at: '2026-01-01',
            location: { name: 'Remote' },
            absolute_url: 'https://boards.greenhouse.io/example/jobs/12',
            content: '<p>Build things.</p>',
            departments: [{ name: 'Engineering' }],
            offices: [{ name: 'São Paulo' }],
          },
          { id: 13, title: 'Broken' },
        ],
      },
      company,
    );
    expect(result).toMatchObject({
      total: 2,
      skippedJobs: 1,
      jobs: [
        {
          externalId: '12',
          provider: 'greenhouse',
          companyId: company.id,
          location: 'Remote',
          descriptionText: 'Build things.',
          departments: ['Engineering'],
          offices: ['São Paulo'],
        },
      ],
    });
  });

  it('handles missing optional content', () => {
    const result = mapGreenhouseResponse(
      {
        jobs: [
          {
            id: '13',
            title: 'Analyst',
            absolute_url: 'https://boards.greenhouse.io/example/jobs/13',
          },
        ],
      },
      company,
    );
    expect(result.jobs[0]).toMatchObject({
      externalId: '13',
      descriptionText: null,
      location: null,
      departments: [],
      offices: [],
    });
  });
});
