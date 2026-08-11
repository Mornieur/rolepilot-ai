import { beforeEach, describe, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => ({
  list: vi.fn(),
  claim: vi.fn(),
  job: vi.fn(),
  company: vi.fn(),
  send: vi.fn(),
  delivered: vi.fn(),
  failed: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/features/job-notifications/server/job-notification-events', () => ({
  listPendingJobNotificationEvents: deps.list,
  claimJobNotificationEventDelivery: deps.claim,
  markJobNotificationEventDelivered: deps.delivered,
  recordJobNotificationEventFailure: deps.failed,
}));
vi.mock('@/features/jobs/server/persisted-jobs', () => ({ getPersistedJobById: deps.job }));
vi.mock('@/features/companies/server/target-companies', () => ({
  getTargetCompanyById: deps.company,
}));
vi.mock('@/features/job-notifications/telegram', () => ({
  TelegramDeliveryError: class TelegramDeliveryError extends Error {
    classification = 'timeout';
  },
  sendTelegramMessage: deps.send,
}));
import {
  deliverPendingNotifications,
  notificationDeliveryBatchLimit,
} from './deliver-pending-notifications';

const event = {
  id: 'event-1',
  jobId: 'job-1',
  eventType: 'new_eligible_job',
  attemptCount: 0,
  profileId: 'profile-1',
  deterministicScore: 80,
  priority: 'excellent',
  status: 'pending',
};
const job = {
  id: 'job-1',
  isActive: true,
  targetCompanyId: 'company-1',
  title: 'Engineer',
  originalUrl: 'https://example.test',
  location: null,
};
describe('deliverPendingNotifications', () => {
  beforeEach(() => {
    deps.list.mockReset().mockResolvedValue([event]);
    deps.job.mockReset().mockResolvedValue(job);
    deps.claim.mockReset().mockImplementation(async (candidate) => ({
      ...candidate,
      attemptCount: candidate.attemptCount + 1,
    }));
    deps.company.mockReset().mockResolvedValue({ name: 'Acme' });
    deps.send.mockReset().mockResolvedValue(undefined);
    deps.delivered.mockReset().mockResolvedValue(undefined);
    deps.failed.mockReset().mockResolvedValue(undefined);
  });
  it('delivers one pending event and records it', async () => {
    await expect(deliverPendingNotifications()).resolves.toEqual({
      attempted: 1,
      delivered: 1,
      failed: 0,
      skipped: 0,
    });
    expect(deps.delivered).toHaveBeenCalledWith(expect.objectContaining({ attemptCount: 1 }));
  });
  it('isolates a failure and proceeds to the next event', async () => {
    deps.list.mockResolvedValue([event, { ...event, id: 'event-2', jobId: 'job-2' }]);
    deps.job.mockResolvedValue({ ...job, id: 'job-2' });
    deps.send.mockRejectedValueOnce(new Error('down'));
    await expect(deliverPendingNotifications()).resolves.toMatchObject({
      attempted: 2,
      delivered: 1,
      failed: 1,
    });
    expect(deps.failed).toHaveBeenCalledWith(
      expect.objectContaining({ attemptCount: 1 }),
      'persistence_failure',
    );
  });
  it('does not call Telegram when there are no pending events', async () => {
    deps.list.mockResolvedValue([]);
    await deliverPendingNotifications();
    expect(deps.send).not.toHaveBeenCalled();
  });
  it('defensively skips an event that is already delivered', async () => {
    deps.list.mockResolvedValue([{ ...event, status: 'delivered' }]);
    await expect(deliverPendingNotifications()).resolves.toMatchObject({
      skipped: 1,
      attempted: 0,
    });
    expect(deps.send).not.toHaveBeenCalled();
  });
  it('records a final failure from the third attempt without blocking later events', async () => {
    const finalAttempt = { ...event, id: 'event-final', attemptCount: 2 };
    deps.list.mockResolvedValue([finalAttempt, { ...event, id: 'event-next', jobId: 'job-2' }]);
    deps.job.mockResolvedValue({ ...job, id: 'job-2' });
    deps.send.mockRejectedValueOnce(new Error('down'));
    await expect(deliverPendingNotifications()).resolves.toMatchObject({ failed: 1, delivered: 1 });
    expect(deps.failed).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'event-final', attemptCount: 3 }),
      'persistence_failure',
    );
  });
  it('records persistence failure after a successful Telegram response', async () => {
    deps.delivered.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(deliverPendingNotifications()).resolves.toMatchObject({ failed: 1, delivered: 0 });
    expect(deps.failed).toHaveBeenCalledWith(
      expect.objectContaining({ attemptCount: 1 }),
      'persistence_failure',
    );
  });
  it('uses the conservative batch limit', async () => {
    await deliverPendingNotifications();
    expect(deps.list).toHaveBeenCalledWith(notificationDeliveryBatchLimit);
  });
  it('does not send when another worker has already claimed the event', async () => {
    deps.claim.mockResolvedValue(null);
    await expect(deliverPendingNotifications()).resolves.toMatchObject({
      attempted: 0,
      skipped: 1,
    });
    expect(deps.send).not.toHaveBeenCalled();
  });
});
