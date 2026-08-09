import Link from 'next/link';
import { Alert, Card, EmptyState, Surface } from '@/components/feitoza-ui';
import { PageContainer, PageContent, PageHeader } from '@/components/page-layout';
import { loadPersistedJobs } from '@/features/jobs/server/load-jobs';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const result = await loadPersistedJobs();
  if (result.error || !result.jobs)
    return (
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <Surface className="p-6">
            <Alert variant="danger" title="Stored jobs unavailable">
              {result.error}
            </Alert>
          </Surface>
        </div>
      </PageContainer>
    );

  return (
    <PageContainer>
      <PageContent>
        <PageHeader
          title="Collected source jobs"
          description="These are collected source records, not AI recommendations."
          actions={
            <Link
              href="/"
              className="text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
            >
              Back to dashboard
            </Link>
          }
        />
        {result.jobs.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="No jobs collected yet"
            description="Preview an enabled Greenhouse company and save its jobs."
          />
        ) : (
          <div className="mt-6 space-y-4">
            {result.jobs.map((job) => (
              <article key={job.id}>
                <Card className="p-5">
                  <h2 className="break-words text-lg font-semibold">{job.title}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {job.provider} · {job.location ?? 'Location not provided'}
                  </p>
                  {job.departments.length > 0 && (
                    <p className="mt-3 break-words text-sm">
                      Departments: {job.departments.join(', ')}
                    </p>
                  )}
                  {job.offices.length > 0 && (
                    <p className="mt-1 break-words text-sm">Offices: {job.offices.join(', ')}</p>
                  )}
                  <p className="mt-3 break-words text-xs text-slate-500 dark:text-slate-400">
                    Source updated: {job.sourceUpdatedAt ?? 'Not provided'} · First seen:{' '}
                    {job.firstSeenAt} · Last seen: {job.lastSeenAt}
                  </p>
                  <a
                    href={job.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300"
                  >
                    Open original source <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Card>
              </article>
            ))}
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}
