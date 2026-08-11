import 'server-only';

import { listTargetCompanies } from '@/features/companies/server/target-companies';
import { listStatusesForJobs } from '@/features/job-actions/server/job-statuses';
import { listPersistedJobs } from '@/features/jobs/server/persisted-jobs';
import { buildInboxOpportunities, summarizeInbox } from '@/features/opportunity-inbox/inbox';
import type { CandidateProfile } from '@/types/domain';

export class OpportunityInboxDataError extends Error {
  constructor() {
    super('A Caixa de oportunidades está indisponível neste momento.');
  }
}

/** Exactly three bounded batch reads: jobs, companies, and statuses for the selected profile. */
export async function loadOpportunityInbox(profile: CandidateProfile, now = new Date()) {
  try {
    const [jobs, companies] = await Promise.all([listPersistedJobs(), listTargetCompanies()]);
    const statuses = await listStatusesForJobs(
      profile.id,
      jobs.map((job) => job.id),
    );
    const opportunities = buildInboxOpportunities({
      profile,
      jobs,
      companyNames: new Map(companies.map((company) => [company.id, company.name])),
      statuses,
      now,
    });
    return { opportunities, summary: summarizeInbox(opportunities) };
  } catch {
    throw new OpportunityInboxDataError();
  }
}
