import 'server-only';

import { evaluateJob } from '@/features/job-evaluation/evaluate';
import { listStatusesForJobs } from '@/features/job-actions/server/job-statuses';
import { listCandidateProfiles } from '@/features/profiles/server/candidate-profiles';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';
import { listPersistedJobsByIds } from '@/features/jobs/server/persisted-jobs';
import type {
  JobNotificationErrorClassification,
  JobNotificationEvent,
  NotificationCandidateResult,
} from '@/features/job-notifications/types';
import { priorityForDeterministicScore } from '@/features/job-notifications/types';

export class JobNotificationEventDataError extends Error {
  constructor(message = 'Os eventos de notificacao estao indisponiveis no momento.') {
    super(message);
  }
}

const skipDiscoveryStatuses = new Set(['saved', 'ignored', 'applied', 'rejected']);
const mapEvent = (row: {
  id: string;
  profile_id: string;
  job_id: string;
  event_type: 'new_eligible_job';
  status: JobNotificationEvent['status'];
  priority: JobNotificationEvent['priority'];
  deterministic_score: number;
  channel: string | null;
  attempt_count: number;
  last_attempt_at: string | null;
  delivered_at: string | null;
  error_classification: JobNotificationErrorClassification | null;
  created_at: string;
}): JobNotificationEvent => ({
  id: row.id,
  profileId: row.profile_id,
  jobId: row.job_id,
  eventType: row.event_type,
  status: row.status,
  priority: row.priority,
  deterministicScore: row.deterministic_score,
  channel: row.channel,
  attemptCount: row.attempt_count,
  lastAttemptAt: row.last_attempt_at,
  deliveredAt: row.delivered_at,
  errorClassification: row.error_classification,
  createdAt: row.created_at,
});

export async function createNewEligibleJobNotificationEvents(
  createdJobIds: string[],
): Promise<NotificationCandidateResult> {
  const uniqueJobIds = [...new Set(createdJobIds)];
  const result: NotificationCandidateResult = {
    consideredJobIds: uniqueJobIds,
    eligible: 0,
    pending: 0,
    skipped: 0,
  };
  if (!uniqueJobIds.length) return result;

  const [jobs, profiles] = await Promise.all([
    listPersistedJobsByIds(uniqueJobIds),
    listCandidateProfiles(),
  ]);
  const client = getSupabaseServerClient();
  for (const profile of profiles) {
    const statuses = await listStatusesForJobs(
      profile.id,
      jobs.map((job) => job.id),
    );
    for (const job of jobs) {
      if (!job.isActive) continue;
      const evaluation = evaluateJob(profile, job);
      if (!evaluation.eligible) continue;
      result.eligible += 1;
      const skipped = skipDiscoveryStatuses.has(statuses[job.id] ?? 'new');
      const { error } = await client.from('job_notification_events').upsert(
        {
          profile_id: profile.id,
          job_id: job.id,
          event_type: 'new_eligible_job',
          status: skipped ? 'skipped' : 'pending',
          priority: priorityForDeterministicScore(evaluation.score),
          deterministic_score: evaluation.score,
        },
        { onConflict: 'profile_id,job_id,event_type', ignoreDuplicates: true },
      );
      if (error) throw new JobNotificationEventDataError();
      if (skipped) result.skipped += 1;
      else result.pending += 1;
    }
  }
  return result;
}

export async function listPendingJobNotificationEvents(
  limit = 20,
): Promise<JobNotificationEvent[]> {
  const { data, error } = await getSupabaseServerClient()
    .from('job_notification_events')
    .select('*')
    .eq('status', 'pending')
    .lt('attempt_count', 3)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw new JobNotificationEventDataError();
  return (data ?? []).map(mapEvent);
}

export async function listRecentJobNotificationEvents(limit = 5): Promise<JobNotificationEvent[]> {
  const { data, error } = await getSupabaseServerClient()
    .from('job_notification_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new JobNotificationEventDataError();
  return (data ?? []).map(mapEvent);
}

export async function markJobNotificationEventDelivered(
  event: Pick<JobNotificationEvent, 'id' | 'attemptCount'>,
): Promise<void> {
  const now = new Date().toISOString();
  const { data, error } = await getSupabaseServerClient()
    .from('job_notification_events')
    .update({
      status: 'delivered',
      channel: 'telegram',
      attempt_count: event.attemptCount + 1,
      delivered_at: now,
      last_attempt_at: now,
      error_classification: null,
    })
    .eq('id', event.id)
    .eq('status', 'pending')
    .eq('attempt_count', event.attemptCount)
    .select('id')
    .maybeSingle();
  if (error || !data) throw new JobNotificationEventDataError();
}

export async function recordJobNotificationEventFailure(
  event: Pick<JobNotificationEvent, 'id' | 'attemptCount'>,
  errorClassification: JobNotificationErrorClassification,
): Promise<void> {
  const attemptCount = event.attemptCount + 1;
  const { data, error } = await getSupabaseServerClient()
    .from('job_notification_events')
    .update({
      status: attemptCount >= 3 ? 'failed' : 'pending',
      channel: 'telegram',
      attempt_count: attemptCount,
      last_attempt_at: new Date().toISOString(),
      error_classification: errorClassification,
    })
    .eq('id', event.id)
    .eq('status', 'pending')
    .eq('attempt_count', event.attemptCount)
    .select('id')
    .maybeSingle();
  if (error || !data) throw new JobNotificationEventDataError();
}
