import type { JobUserStatus, PersistedJob } from '@/types/domain';
import { periodStart } from './periods';
import type { InsightInput, JobInsightResult, RankedInsight } from './types';

const limit = 5;
const rank = (items: Iterable<string>): RankedInsight[] => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = item.trim() || 'Unknown';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
};
const normalized = (job: PersistedJob) =>
  [job.title, job.descriptionText, job.location, ...job.departments, ...job.offices]
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const workModel = (job: PersistedJob) => {
  const text = normalized(job);
  return /\bremote\b|\bremoto\b/.test(text)
    ? 'Remote'
    : /\bhybrid\b|\bhibrido\b/.test(text)
      ? 'Hybrid'
      : /\bonsite\b|\bon-site\b|\bpresencial\b/.test(text)
        ? 'On-site'
        : 'Unknown';
};
const seniority = (job: PersistedJob) => {
  const text = job.title.toLowerCase();
  return /staff|principal/.test(text)
    ? 'Staff/principal'
    : /lead/.test(text)
      ? 'Lead'
      : /senior|sênior/.test(text)
        ? 'Senior'
        : /mid|pleno/.test(text)
          ? 'Mid-level'
          : /junior|júnior|est[aá]gio|intern/.test(text)
            ? 'Junior/intern'
            : 'Unknown';
};
const termsFor = (jobs: PersistedJob[], terms: string[]) =>
  rank(
    terms.filter((term) =>
      jobs.some((job) =>
        normalized(job).includes(
          term
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase(),
        ),
      ),
    ),
  );

export function buildJobInsights(input: InsightInput): JobInsightResult {
  const start = periodStart(input.period, input.now);
  const jobs = input.jobs.filter((job) => !start || new Date(job.firstSeenAt) >= start);
  const byJob = new Map(
    input.statuses
      .filter((row) => row.profileId === input.profile.id)
      .map((row) => [row.jobId, row.status]),
  );
  const statuses: Record<JobUserStatus, number> = {
    new: 0,
    saved: 0,
    ignored: 0,
    applied: 0,
    rejected: 0,
  };
  for (const job of jobs) statuses[byJob.get(job.id) ?? 'new'] += 1;
  const explicit = jobs.filter((job) => byJob.has(job.id)).length;
  const terms = [
    ...input.profile.requiredSkills,
    ...input.profile.preferredSkills,
    ...input.profile.excludedSkills,
    ...input.profile.desiredRoles,
  ];
  const selected = (status: string) => jobs.filter((job) => byJob.get(job.id) === status);
  return {
    profile: input.profile,
    period: input.period,
    sampleSize: jobs.length,
    statuses,
    saveRate: explicit ? statuses.saved / explicit : 0,
    applicationRate: explicit ? statuses.applied / explicit : 0,
    providers: rank(jobs.map((job) => job.provider)),
    companies: rank(
      jobs.map((job) => input.companies.get(job.targetCompanyId) ?? 'Unknown company'),
    ),
    titles: rank(jobs.map((job) => job.title)),
    locations: rank(jobs.map((job) => job.location ?? 'Unknown')),
    workModels: rank(jobs.map(workModel)),
    seniorities: rank(jobs.map(seniority)),
    profileTerms: {
      found: termsFor(jobs, terms),
      saved: termsFor(selected('saved'), terms),
      applied: termsFor(selected('applied'), terms),
      ignored: termsFor(selected('ignored'), terms),
      rare: terms.filter(
        (term) =>
          !jobs.some((job) =>
            normalized(job).includes(
              term
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase(),
            ),
          ),
      ),
    },
  };
}
