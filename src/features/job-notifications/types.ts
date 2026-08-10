import type { PersistedJob } from '@/types/domain';

export const jobNotificationEventTypes = ['new_eligible_job'] as const;
export type JobNotificationEventType = (typeof jobNotificationEventTypes)[number];
export const jobNotificationEventStatuses = ['pending', 'delivered', 'failed', 'skipped'] as const;
export type JobNotificationEventStatus = (typeof jobNotificationEventStatuses)[number];
export const jobNotificationPriorities = ['excellent', 'good', 'review'] as const;
export type JobNotificationPriority = (typeof jobNotificationPriorities)[number];
export const jobNotificationErrorClassifications = [
  'delivery-unavailable',
  'invalid-response',
  'unknown',
] as const;
export type JobNotificationErrorClassification =
  (typeof jobNotificationErrorClassifications)[number];

export type JobNotificationEvent = {
  id: string;
  profileId: string;
  jobId: string;
  eventType: JobNotificationEventType;
  status: JobNotificationEventStatus;
  priority: JobNotificationPriority;
  deterministicScore: number;
  channel: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  deliveredAt: string | null;
  errorClassification: JobNotificationErrorClassification | null;
  createdAt: string;
};

export type NotificationCandidateResult = {
  consideredJobIds: string[];
  eligible: number;
  pending: number;
  skipped: number;
};

export const priorityForDeterministicScore = (score: number): JobNotificationPriority =>
  score >= 80 ? 'excellent' : score >= 70 ? 'good' : 'review';

export type NotificationEventWithJob = JobNotificationEvent & { job: PersistedJob };
