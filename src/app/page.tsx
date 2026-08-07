import { Dashboard } from "@/features/jobs/components/dashboard";
import { jobAnalyses, jobs } from "@/features/jobs/mock-data";
import { loadTargetCompanies } from "@/features/companies/server/load-companies";
import { loadCandidateProfiles } from "@/features/profiles/server/load-profiles";
import { loadPersistedJobs } from "@/features/jobs/server/load-jobs";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [profileResult, companyResult, persistedJobs] = await Promise.all([loadCandidateProfiles(), loadTargetCompanies(), loadPersistedJobs()]);
  if (profileResult.error !== null) return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900"><div className="mx-auto max-w-xl rounded-lg border border-red-200 bg-white p-6"><p className="text-sm font-semibold tracking-[0.18em] text-blue-700 uppercase">RolePilot AI</p><h1 className="mt-3 text-2xl font-semibold">Dashboard unavailable</h1><p className="mt-3 text-slate-600">{profileResult.error}</p><Link href="/profiles" className="mt-5 inline-block font-medium text-blue-700 underline underline-offset-4">Manage candidate profiles</Link></div></main>;
  return <Dashboard profiles={profileResult.profiles} jobs={jobs} analyses={jobAnalyses} companies={companyResult.companies ?? []} companyError={companyResult.error} persistedJobCount={persistedJobs.jobs?.length ?? 0} />;
}
