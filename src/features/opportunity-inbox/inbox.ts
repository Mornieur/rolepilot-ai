import { evaluateJob } from '@/features/job-evaluation/evaluate';
import type { CandidateProfile, PersistedJob, JobUserStatus } from '@/types/domain';
import type { InboxOpportunity, InboxSummary, OpportunityPriority } from './types';

export const inboxNewWindowMs = 24 * 60 * 60 * 1000;

export function priorityForScore(score: number): OpportunityPriority {
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  return 'review';
}

export function isNewOpportunity(job: Pick<PersistedJob, 'firstSeenAt'>, now: Date) {
  const firstSeenAt = new Date(job.firstSeenAt).getTime();
  return Number.isFinite(firstSeenAt) && now.getTime() - firstSeenAt <= inboxNewWindowMs;
}

const priorityOrder: Record<OpportunityPriority, number> = { excellent: 0, good: 1, review: 2 };

/** Eligible active jobs only; priority, newest discovery, title, then id keep the queue deterministic. */
export function buildInboxOpportunities({
  profile,
  jobs,
  companyNames,
  statuses,
  now = new Date(),
}: {
  profile: CandidateProfile;
  jobs: PersistedJob[];
  companyNames: Map<string, string>;
  statuses: Record<string, JobUserStatus>;
  now?: Date;
}): InboxOpportunity[] {
  return jobs
    .filter((job) => job.isActive !== false)
    .map((job) => evaluateJob(profile, job))
    .filter((evaluation) => evaluation.eligible)
    .map((evaluation) => {
      const decision = statuses[evaluation.job.id] ?? 'new';
      return {
        ...evaluation,
        companyName: companyNames.get(evaluation.job.targetCompanyId) ?? 'Empresa não identificada',
        decision,
        priority: priorityForScore(evaluation.score),
        isNew: isNewOpportunity(evaluation.job, now),
      };
    })
    .sort(
      (left, right) =>
        priorityOrder[left.priority] - priorityOrder[right.priority] ||
        right.job.firstSeenAt.localeCompare(left.job.firstSeenAt) ||
        left.job.title.localeCompare(right.job.title) ||
        left.job.id.localeCompare(right.job.id),
    );
}

export function summarizeInbox(opportunities: InboxOpportunity[]): InboxSummary {
  return opportunities.reduce(
    (summary, opportunity) => ({
      compatible: summary.compatible + 1,
      new: summary.new + Number(opportunity.isNew),
      saved: summary.saved + Number(opportunity.decision === 'saved'),
      excellent: summary.excellent + Number(opportunity.priority === 'excellent'),
    }),
    { compatible: 0, new: 0, saved: 0, excellent: 0 },
  );
}

export function whyMatches(opportunity: InboxOpportunity) {
  const parts = [
    opportunity.matchedRequiredKeywords.length
      ? opportunity.matchedRequiredKeywords.join(', ')
      : null,
    opportunity.matchedPreferredKeywords.length
      ? opportunity.matchedPreferredKeywords.join(', ')
      : null,
    opportunity.seniorityMatch.matched === true ? 'senioridade próxima ao perfil' : null,
    opportunity.workModelMatch.matched === true ? 'modelo de trabalho compatível' : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length ? `Por que combina: ${parts.join('. ')}.` : null;
}

export function inboxWarnings(opportunity: InboxOpportunity) {
  return opportunity.reasons
    .filter(
      (reason) =>
        reason.outcome === 'fail' ||
        reason.code === 'required-partial' ||
        (['seniority', 'location'].includes(reason.code) && reason.message.includes('diferente')),
    )
    .map((reason) => reason.message);
}
