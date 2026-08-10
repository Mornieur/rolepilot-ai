import 'server-only';
import { evaluateJob, sortEvaluations } from '@/features/job-evaluation/evaluate';
import type { DeterministicJobEvaluation } from '@/features/job-evaluation/types';
import type { CandidateProfile } from '@/types/domain';
import { getCandidateProfileById } from '@/features/profiles/server/candidate-profiles';
import { listPersistedJobs } from '@/features/jobs/server/persisted-jobs';
export async function evaluatePersistedJobsForProfile(
  profileId: string,
): Promise<DeterministicJobEvaluation[]> {
  const profile = await getCandidateProfileById(profileId);
  if (!profile) throw new Error('The selected profile could not be found.');

  return evaluatePersistedJobs(profile);
}

export async function evaluatePersistedJobs(
  profile: CandidateProfile,
): Promise<DeterministicJobEvaluation[]> {
  return sortEvaluations(
    (await listPersistedJobs()).map((persistedJob) => evaluateJob(profile, persistedJob)),
  );
}
