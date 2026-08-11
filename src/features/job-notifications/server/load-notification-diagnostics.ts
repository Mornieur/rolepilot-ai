import 'server-only';

import { listPersistedJobsByIds } from '@/features/jobs/server/persisted-jobs';
import { listCandidateProfiles } from '@/features/profiles/server/candidate-profiles';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';
import type { JobNotificationEvent } from '@/features/job-notifications/types';
import { listRecentJobNotificationEvents } from '@/features/job-notifications/server/job-notification-events';

export type NotificationDiagnostics = {
  telegramConfigured: boolean;
  counts: Record<'pending' | 'delivered' | 'failed', number>;
  lastEventCreatedAt: string | null;
  lastDeliveryAttemptAt: string | null;
  lastSuccessfulDeliveryAt: string | null;
  events: Array<
    JobNotificationEvent & {
      jobTitle: string | null;
      profileName: string | null;
    }
  >;
};

async function countEvents(status: 'pending' | 'delivered' | 'failed') {
  const { count, error } = await getSupabaseServerClient()
    .from('job_notification_events')
    .select('id', { count: 'exact', head: true })
    .eq('status', status);
  if (error) throw error;
  return count ?? 0;
}

async function latestTimestamp(column: 'created_at' | 'last_attempt_at' | 'delivered_at') {
  const query = getSupabaseServerClient()
    .from('job_notification_events')
    .select(column)
    .not(column, 'is', null)
    .order(column, { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await query;
  if (error) throw error;
  return (data as Record<string, string | null> | null)?.[column] ?? null;
}

export async function loadNotificationDiagnostics(): Promise<NotificationDiagnostics> {
  const [
    pending,
    delivered,
    failed,
    lastEventCreatedAt,
    lastDeliveryAttemptAt,
    lastSuccessfulDeliveryAt,
  ] = await Promise.all([
    countEvents('pending'),
    countEvents('delivered'),
    countEvents('failed'),
    latestTimestamp('created_at'),
    latestTimestamp('last_attempt_at'),
    latestTimestamp('delivered_at'),
  ]);
  const events: JobNotificationEvent[] = await listRecentJobNotificationEvents(12);
  const [jobs, profiles] = await Promise.all([
    listPersistedJobsByIds(events.map((event) => event.jobId)),
    listCandidateProfiles(),
  ]);
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  return {
    telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    counts: { pending, delivered, failed },
    lastEventCreatedAt,
    lastDeliveryAttemptAt,
    lastSuccessfulDeliveryAt,
    events: events.map((event) => ({
      ...event,
      jobTitle: jobsById.get(event.jobId)?.title ?? null,
      profileName: profilesById.get(event.profileId)?.name ?? null,
    })),
  };
}
