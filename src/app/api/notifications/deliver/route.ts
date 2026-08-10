import { timingSafeEqual } from 'node:crypto';

import { deliverPendingNotifications } from '@/features/job-notifications/server/deliver-pending-notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.NOTIFICATION_WORKER_SECRET;
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || !provided) return false;
  const expected = Buffer.from(secret);
  const received = Buffer.from(provided);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return Response.json(await deliverPendingNotifications());
  } catch {
    return Response.json({ error: 'Notification delivery unavailable' }, { status: 503 });
  }
}
