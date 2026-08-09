'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, Select, Surface } from '@feitoza-ui/core';

import {
  MetricCard,
  PageContainer,
  PageContent,
  PageHeader,
  SectionHeader,
} from '@/components/page-layout';
import { getMockAnalysis } from '@/features/jobs/mock-data';
import { formatLabel, formatScore } from '@/lib/format';
import type {
  CandidateProfile,
  Job,
  JobAnalysis,
  JobUserStatus,
  Recommendation,
  TargetCompany,
} from '@/types/domain';

type DashboardProps = {
  profiles: CandidateProfile[];
  jobs: Job[];
  analyses: JobAnalysis[];
  companies?: TargetCompany[];
  companyError?: string | null;
  persistedJobCount?: number;
  jobStatusCountsByProfile?: Record<string, Record<JobUserStatus, number>>;
  jobStatusCountsError?: string | null;
};

const recommendationStyles: Record<Recommendation, string> = {
  recommended: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  consider: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
  skipped: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
};
const linkClass =
  'text-sm font-medium text-sky-700 underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:text-cyan-300';

export function Dashboard({
  profiles,
  jobs,
  analyses,
  companies = [],
  companyError = null,
  persistedJobCount = 0,
  jobStatusCountsByProfile = {},
  jobStatusCountsError = null,
}: DashboardProps) {
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.id ?? '');
  const selectedProfile =
    profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0];
  const matchedJobs = useMemo(
    () =>
      !selectedProfile
        ? []
        : jobs
            .flatMap((job) => {
              const analysis = getMockAnalysis(selectedProfile.id, job.id, analyses);
              return analysis ? [{ job, analysis }] : [];
            })
            .sort((left, right) => right.analysis.score - left.analysis.score),
    [analyses, jobs, selectedProfile],
  );

  if (!selectedProfile) return <EmptyDashboard />;
  const recommendationCount = (recommendation: Recommendation) =>
    matchedJobs.filter((item) => item.analysis.recommendation === recommendation).length;
  const statusCounts = jobStatusCountsByProfile[selectedProfile.id] ?? {
    new: 0,
    saved: 0,
    ignored: 0,
    applied: 0,
    rejected: 0,
  };

  return (
    <PageContainer>
      <PageContent>
        <PageHeader
          eyebrow="RolePilot AI"
          title="Job intelligence for focused decisions."
          description="Review a tailored view of opportunities and the reasoning behind each recommendation."
          actions={
            <div className="flex flex-wrap gap-4">
              <Link href="/insights" className={linkClass}>
                Insights
              </Link>
              <Link href="/profiles" className={linkClass}>
                Manage profiles
              </Link>
            </div>
          }
        />
        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-800 dark:text-slate-100">Target:</span>{' '}
            {selectedProfile.desiredRoles.join(' · ')}
          </p>
          <div className="w-full sm:w-72">
            <Select
              id="candidate-profile"
              label="Candidate profile"
              value={selectedProfile.id}
              onChange={(event) => setSelectedProfileId(event.target.value)}
              fullWidth
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <section
          className="grid gap-3 py-8 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Opportunity overview"
        >
          <MetricCard label="Total opportunities" value={matchedJobs.length} />
          <MetricCard
            label="Recommended"
            value={recommendationCount('recommended')}
            tone="text-emerald-800 dark:text-emerald-300"
          />
          <MetricCard
            label="Worth considering"
            value={recommendationCount('consider')}
            tone="text-amber-800 dark:text-amber-300"
          />
          <MetricCard
            label="Skipped"
            value={recommendationCount('skipped')}
            tone="text-slate-600 dark:text-slate-300"
          />
        </section>
        <Surface className="mb-8 p-5">
          <SectionHeader
            title="Collected jobs"
            description={`${persistedJobCount} stored source jobs. No AI analysis has been performed.`}
            action={
              <Link href="/jobs" className={linkClass}>
                Browse jobs
              </Link>
            }
          />
        </Surface>
        <Surface className="mb-8 p-5" aria-labelledby="job-actions-heading">
          <h2 id="job-actions-heading" className="text-lg font-semibold">
            Job actions
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Explicit decisions for {selectedProfile.name}.
          </p>
          {jobStatusCountsError ? (
            <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">
              Job action counters unavailable: {jobStatusCountsError}
            </p>
          ) : (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Saved"
                value={statusCounts.saved}
                tone="text-sky-800 dark:text-cyan-300"
              />
              <MetricCard
                label="Applied"
                value={statusCounts.applied}
                tone="text-emerald-800 dark:text-emerald-300"
              />
              <MetricCard
                label="Ignored"
                value={statusCounts.ignored}
                tone="text-slate-600 dark:text-slate-300"
              />
              <MetricCard
                label="Rejected"
                value={statusCounts.rejected}
                tone="text-red-800 dark:text-red-300"
              />
            </dl>
          )}
        </Surface>
        <Surface className="mb-8 p-5">
          <SectionHeader
            title="Deterministic filtering"
            description="Evaluate collected jobs with explicit rule-based profile preferences — no AI."
          />
          <Link href="/jobs/evaluate" className={`mt-3 inline-block ${linkClass}`}>
            Evaluate collected jobs
          </Link>
        </Surface>
        <Surface className="mb-8 p-5" aria-labelledby="company-summary-heading">
          <SectionHeader
            title={<span id="company-summary-heading">Company monitoring</span>}
            description="Configuration only — job collection is not active yet."
            action={
              <Link href="/companies" className={linkClass}>
                Manage companies
              </Link>
            }
          />
          {companyError ? (
            <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">
              Company configuration unavailable: {companyError}
            </p>
          ) : (
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <MetricCard label="Monitored companies" value={companies.length} />
              <MetricCard
                label="Monitoring enabled"
                value={companies.filter((company) => company.enabled).length}
                tone="text-emerald-800 dark:text-emerald-300"
              />
              <MetricCard
                label="High priority"
                value={companies.filter((company) => company.priority === 'high').length}
                tone="text-amber-800 dark:text-amber-300"
              />
            </dl>
          )}
        </Surface>
        <section aria-labelledby="opportunities-heading">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="opportunities-heading" className="text-xl font-semibold">
              Opportunities
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Mocked job analyses</p>
          </div>
          <div className="space-y-4">
            {matchedJobs.map(({ job, analysis }) => (
              <JobCard key={job.id} job={job} analysis={analysis} />
            ))}
          </div>
        </section>
      </PageContent>
    </PageContainer>
  );
}

function EmptyDashboard() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-xl">
        <Surface className="p-6">
          <p className="text-sm font-semibold tracking-[0.18em] text-sky-700 uppercase dark:text-cyan-300">
            RolePilot AI
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Create your first candidate profile</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            The dashboard will show opportunities once at least one persisted profile exists.
          </p>
          <Link href="/profiles" className={`mt-5 inline-block ${linkClass}`}>
            Manage candidate profiles
          </Link>
        </Surface>
      </div>
    </PageContainer>
  );
}

function JobCard({ job, analysis }: { job: Job; analysis: JobAnalysis }) {
  return (
    <article>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{job.company}</p>
            <h3 className="mt-1 break-words text-xl font-semibold">{job.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {job.location} · {formatLabel(job.workModel)} · {formatLabel(job.seniority)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
            <span
              className="text-2xl font-semibold"
              aria-label={`Match score: ${formatScore(analysis.score)}`}
            >
              {formatScore(analysis.score)}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${recommendationStyles[analysis.recommendation]}`}
            >
              {formatLabel(analysis.recommendation)}
            </span>
          </div>
        </div>
        <p className="mt-4 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
          {analysis.summary}
        </p>
        <div className="mt-5 grid gap-5 border-t border-slate-200 pt-5 dark:border-slate-700 md:grid-cols-2">
          <InsightList title="Key strengths" items={analysis.strengths} />
          <InsightList
            title="Key gaps"
            items={[...analysis.gaps, ...analysis.blockingReasons]}
            muted
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
          <span className="text-slate-500 dark:text-slate-400">Source: {job.source}</span>
          {job.originalUrl ? (
            <a className={linkClass} href={job.originalUrl} target="_blank" rel="noreferrer">
              View original source <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Source links are not connected in this mock"
              className="cursor-not-allowed font-medium text-slate-400"
            >
              Original source unavailable
            </button>
          )}
        </div>
      </Card>
    </article>
  );
}

function InsightList({
  title,
  items,
  muted = false,
}: {
  title: string;
  items: string[];
  muted?: boolean;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul
        className={`mt-2 space-y-1 text-sm ${muted ? 'text-slate-600 dark:text-slate-300' : 'text-slate-700 dark:text-slate-200'}`}
      >
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true">—</span>
            <span className="break-words">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
