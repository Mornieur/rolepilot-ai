import Link from 'next/link';
import { Alert, Button, EmptyState, Select, Surface } from '@/components/feitoza-ui';
import { PageContainer, PageContent, PageHeader } from '@/components/page-layout';
import { EvaluationResults } from '@/features/job-evaluation/components/evaluation-results';
import { evaluatePersistedJobsForProfile } from '@/features/job-evaluation/server';
import { loadCandidateProfiles } from '@/features/profiles/server/load-profiles';
import { getStatus } from '@/features/job-actions/server/job-statuses';
import type { JobUserStatus } from '@/types/domain';

export const dynamic = 'force-dynamic';

export default async function EvaluateJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const [{ profileId }, profiles] = await Promise.all([searchParams, loadCandidateProfiles()]);
  if (profiles.error || !profiles.profiles)
    return (
      <PageContainer>
        <div className="mx-auto max-w-5xl">
          <Alert variant="danger" title="Profile configuration unavailable">
            {profiles.error ?? 'Please try again.'}
          </Alert>
        </div>
      </PageContainer>
    );
  let results = null;
  let statuses: Record<string, JobUserStatus> = {};
  let error: string | null = null;
  if (profileId)
    try {
      results = await evaluatePersistedJobsForProfile(profileId);
      statuses = Object.fromEntries(
        await Promise.all(
          results.map(async (result) => [
            result.job.id,
            (await getStatus(result.profileId, result.job.id)).status,
          ]),
        ),
      );
    } catch {
      error =
        'Evaluation could not be completed. Select a current candidate profile and try again.';
    }
  return (
    <PageContainer>
      <PageContent>
        <PageHeader
          title="Rule-based job evaluation"
          description="Deterministic evaluation is separate from optional Gemini analysis and your decision."
          actions={
            <Link
              href="/jobs"
              className="text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
            >
              Back to jobs
            </Link>
          }
        />
        {profiles.profiles.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="Create a candidate profile first"
            description="A profile is required before evaluating collected jobs."
            action={
              <Link
                href="/profiles"
                className="text-sm font-medium text-sky-700 underline underline-offset-4 dark:text-cyan-300"
              >
                Manage profiles
              </Link>
            }
          />
        ) : (
          <Surface className="mt-6 p-5">
            <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <Select
                  id="profileId"
                  name="profileId"
                  label="Candidate profile"
                  defaultValue={profileId}
                  fullWidth
                >
                  <option value="">Choose a profile</option>
                  {profiles.profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                Evaluate jobs
              </Button>
            </form>
          </Surface>
        )}
        {error && (
          <Alert className="mt-4" variant="danger" title="Evaluation unavailable" role="alert">
            {error}
          </Alert>
        )}
        {results && <EvaluationResults results={results} statuses={statuses} />}
      </PageContent>
    </PageContainer>
  );
}
