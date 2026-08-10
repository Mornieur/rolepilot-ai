import { Dashboard } from '@/features/jobs/components/dashboard';
import { jobAnalyses, jobs } from '@/features/jobs/mock-data';
import { loadTargetCompanies } from '@/features/companies/server/load-companies';
import { loadCandidateProfiles } from '@/features/profiles/server/load-profiles';
import { loadPersistedJobs } from '@/features/jobs/server/load-jobs';
import { listStatusCountsByProfile } from '@/features/job-actions/server/job-statuses';
import type { JobUserStatus } from '@/types/domain';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [profileResult, companyResult, persistedJobs] = await Promise.all([
    loadCandidateProfiles(),
    loadTargetCompanies(),
    loadPersistedJobs(),
  ]);
  if (profileResult.error !== null)
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-xl rounded-lg border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-slate-900">
          <p className="text-sm font-semibold tracking-[0.18em] text-blue-700 uppercase">
            RolePilot AI
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Início indisponível</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{profileResult.error}</p>
          <Link
            href="/profiles"
            className="mt-5 inline-block font-medium text-blue-700 underline underline-offset-4"
          >
            Gerenciar perfis
          </Link>
        </div>
      </main>
    );
  let jobStatusCountsByProfile: Record<string, Record<JobUserStatus, number>> = {};
  let jobStatusCountsError: string | null = null;
  try {
    jobStatusCountsByProfile = Object.fromEntries(
      await Promise.all(
        profileResult.profiles.map(async (profile) => [
          profile.id,
          await listStatusCountsByProfile(profile.id),
        ]),
      ),
    );
  } catch {
    jobStatusCountsError = 'Tente novamente.';
  }
  return (
    <Dashboard
      profiles={profileResult.profiles}
      jobs={jobs}
      analyses={jobAnalyses}
      companies={companyResult.companies ?? []}
      companyError={companyResult.error}
      persistedJobCount={persistedJobs.jobs?.length ?? 0}
      jobStatusCountsByProfile={jobStatusCountsByProfile}
      jobStatusCountsError={jobStatusCountsError}
    />
  );
}
