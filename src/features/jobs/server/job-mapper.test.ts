import { describe, expect, it } from 'vitest';
import { previewToJobFields, toPersistedJob } from './job-mapper';

describe('persisted job mapping', () => {
  it('maps rows and normalized previews without leaking database names', () => {
    const row = {
      id: 'job',
      provider: 'greenhouse',
      target_company_id: 'company',
      external_id: '1',
      title: 'Engineer',
      location: null,
      description_text: null,
      original_url: 'https://example.test',
      source_updated_at: null,
      language: null,
      departments: null,
      offices: null,
      first_seen_at: 'a',
      last_seen_at: 'b',
      created_at: 'c',
      updated_at: 'd',
    };
    expect(toPersistedJob(row)).toMatchObject({
      targetCompanyId: 'company',
      externalId: '1',
      departments: [],
    });
    expect(
      previewToJobFields({
        externalId: '1',
        provider: 'greenhouse',
        companyId: 'company',
        companyName: 'Company',
        title: 'Engineer',
        location: null,
        descriptionText: null,
        originalUrl: 'https://example.test',
        sourceUpdatedAt: null,
        language: null,
        departments: [],
        offices: [],
      }),
    ).toMatchObject({ target_company_id: 'company', external_id: '1' });
  });
});
