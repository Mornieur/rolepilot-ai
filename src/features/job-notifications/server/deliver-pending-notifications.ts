import 'server-only';

import { getTargetCompanyById } from '@/features/companies/server/target-companies';
import { getPersistedJobById } from '@/features/jobs/server/persisted-jobs';
import { formatTelegramJobNotification } from '@/features/job-notifications/message';
import { TelegramDeliveryError, sendTelegramMessage } from '@/features/job-notifications/telegram';
import {
  claimJobNotificationEventDelivery,
  listPendingJobNotificationEvents,
  markJobNotificationEventDelivered,
  recordJobNotificationEventFailure,
} from '@/features/job-notifications/server/job-notification-events';

export const notificationDeliveryBatchLimit = 20;
export type NotificationDeliveryResult = {
  attempted: number;
  delivered: number;
  failed: number;
  skipped: number;
};

export async function deliverPendingNotifications(): Promise<NotificationDeliveryResult> {
  const result: NotificationDeliveryResult = { attempted: 0, delivered: 0, failed: 0, skipped: 0 };
  const events = await listPendingJobNotificationEvents(notificationDeliveryBatchLimit);
  for (const event of events) {
    const job = await getPersistedJobById(event.jobId).catch(() => null);
    if (
      !job ||
      !job.isActive ||
      event.eventType !== 'new_eligible_job' ||
      event.status !== 'pending'
    ) {
      result.skipped += 1;
      continue;
    }
    const claimed = await claimJobNotificationEventDelivery(event);
    if (!claimed) {
      result.skipped += 1;
      continue;
    }
    result.attempted += 1;
    try {
      const company = await getTargetCompanyById(job.targetCompanyId).catch(() => null);
      await sendTelegramMessage({
        chatId: process.env.TELEGRAM_CHAT_ID ?? '',
        text: formatTelegramJobNotification(claimed, job, company),
      });
      await markJobNotificationEventDelivered(claimed);
      result.delivered += 1;
    } catch (error) {
      const classification =
        error instanceof TelegramDeliveryError ? error.classification : 'persistence_failure';
      try {
        await recordJobNotificationEventFailure(claimed, classification);
      } catch {
        // The event remains pending when attempt persistence is unavailable.
      }
      result.failed += 1;
    }
  }
  return result;
}
