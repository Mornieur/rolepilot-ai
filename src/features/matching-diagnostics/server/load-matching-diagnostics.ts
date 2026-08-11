import 'server-only';

import { listTargetCompanies } from '@/features/companies/server/target-companies';
import { listStatusesForJobs } from '@/features/job-actions/server/job-statuses';
import { listPersistedJobs } from '@/features/jobs/server/persisted-jobs';
import type { CandidateProfile } from '@/types/domain';
import { buildMatchingDiagnostics } from '../aggregations';

export class MatchingDiagnosticsDataError extends Error {
  constructor() {
    super('O diagnóstico do matching está indisponível no momento. Tente novamente.');
  }
}

function within<T>(promise: Promise<T>, timeoutMs = 12_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export async function loadMatchingDiagnostics(profile: CandidateProfile) {
  try {
    const [jobs, companies] = await within(
      Promise.all([listPersistedJobs(), listTargetCompanies()]),
    );
    const statuses = await within(
      listStatusesForJobs(
        profile.id,
        jobs.map((job) => job.id),
      ),
    );
    return buildMatchingDiagnostics({
      profile,
      jobs,
      companyNames: new Map(companies.map((company) => [company.id, company.name])),
      statuses,
    });
  } catch {
    throw new MatchingDiagnosticsDataError();
  }
}
