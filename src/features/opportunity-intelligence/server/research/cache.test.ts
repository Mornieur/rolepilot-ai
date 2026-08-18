import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { isCurrentOpportunityResearchDossier } from './cache';
import type { ResearchDossier } from '@/features/opportunity-intelligence/types';

const dossier = {
  status: 'completed',
  structuredResult: {},
  sources: [{}],
  researchFingerprint: 'current-fingerprint',
  expiresAt: '2026-08-20T12:00:00.000Z',
} as unknown as ResearchDossier;

describe('opportunity research freshness', () => {
  it('recognizes a structurally valid dossier with the current fingerprint and TTL', () => {
    expect(
      isCurrentOpportunityResearchDossier(
        dossier,
        'current-fingerprint',
        new Date('2026-08-19T12:00:00.000Z'),
      ),
    ).toBe(true);
  });

  it('treats an expired dossier as stale', () => {
    expect(
      isCurrentOpportunityResearchDossier(
        dossier,
        'current-fingerprint',
        new Date('2026-08-21T12:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('treats an incompatible semantic fingerprint as stale', () => {
    expect(
      isCurrentOpportunityResearchDossier(
        dossier,
        'new-contract-fingerprint',
        new Date('2026-08-19T12:00:00.000Z'),
      ),
    ).toBe(false);
  });
});
