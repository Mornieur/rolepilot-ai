import 'server-only';

import { createHash } from 'node:crypto';
import type { CandidateProfile, PersistedJob } from '@/types/domain';
import type { ResearchDossier } from '@/features/opportunity-intelligence/types';
import { opportunityResearchContractVersions } from './contract';

type ResearchFingerprintProfile = Pick<
  CandidateProfile,
  | 'desiredRoles'
  | 'acceptedSeniorities'
  | 'requiredSkills'
  | 'preferredSkills'
  | 'acceptedWorkModels'
  | 'locations'
>;
type ResearchFingerprintJob = Pick<
  PersistedJob,
  'title' | 'descriptionText' | 'location' | 'sourceUpdatedAt'
>;

export function opportunityResearchFingerprint(
  profile: ResearchFingerprintProfile | null,
  job: ResearchFingerprintJob | null,
  model: string,
  contract = opportunityResearchContractVersions(model),
) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        profile,
        job,
        contract,
      }),
    )
    .digest('hex');
}

/**
 * A dossier returned by the loader has already passed its structural and
 * citation checks. This is the remaining authoritative cacheability check:
 * completed state, current semantic contract, and unexpired TTL.
 */
export function isCurrentOpportunityResearchDossier(
  dossier: ResearchDossier | null,
  expectedFingerprint: string,
  now = new Date(),
) {
  return Boolean(
    dossier?.status === 'completed' &&
    dossier.structuredResult !== null &&
    dossier.sources.length > 0 &&
    dossier.researchFingerprint === expectedFingerprint &&
    dossier.expiresAt &&
    new Date(dossier.expiresAt) > now,
  );
}
