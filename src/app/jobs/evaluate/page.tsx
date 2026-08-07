import Link from "next/link";
import { EvaluationResults } from "@/features/job-evaluation/components/evaluation-results";
import { evaluatePersistedJobsForProfile } from "@/features/job-evaluation/server";
import { loadCandidateProfiles } from "@/features/profiles/server/load-profiles";
import { getStatus } from "@/features/job-actions/server/job-statuses";
import type { JobUserStatus } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function EvaluateJobsPage({ searchParams }: { searchParams: Promise<{ profileId?: string }> }) {
  const [{ profileId }, profiles] = await Promise.all([searchParams, loadCandidateProfiles()]);
  if (profiles.error || !profiles.profiles) return <main className="p-8">Profile configuration unavailable.</main>;

  let results = null;
  let statuses: Record<string, JobUserStatus> = {};
  let error: string | null = null;
  if (profileId) {
    try {
      results = await evaluatePersistedJobsForProfile(profileId);
      statuses = Object.fromEntries(await Promise.all(results.map(async (result) => [result.job.id, (await getStatus(result.profileId, result.job.id)).status])));
    } catch {
      error = "Evaluation could not be completed. Select a current candidate profile and try again.";
    }
  }

  return <main className="min-h-screen bg-slate-50 p-8 text-slate-900"><div className="mx-auto max-w-5xl">
    <Link href="/jobs" className="text-blue-700 underline">Back to jobs</Link>
    <h1 className="mt-6 text-3xl font-semibold">Rule-based job evaluation</h1>
    <p className="mt-2 text-slate-600">Rule-based evaluation only — no AI analysis has been performed.</p>
    {profiles.profiles.length === 0 ? <p className="mt-6">Create a candidate profile before evaluating jobs.</p> : <form className="mt-6 flex flex-wrap items-center gap-3">
      <label htmlFor="profileId">Candidate profile</label>
      <select id="profileId" name="profileId" defaultValue={profileId} className="rounded border border-slate-300 px-2 py-1">
        <option value="">Choose a profile</option>
        {profiles.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
      </select>
      <button className="rounded bg-blue-700 px-3 py-1 text-white">Evaluate jobs</button>
    </form>}
    {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
    {results && <EvaluationResults results={results} statuses={statuses} />}
  </div></main>;
}
