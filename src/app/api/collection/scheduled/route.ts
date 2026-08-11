import { timingSafeEqual } from 'node:crypto';
import { runCollection } from '@/features/job-collection/server/run-collection';
import { CollectionAlreadyRunningError } from '@/features/job-collection/server/collection-runs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 180;

function authorized(request: Request) {
  const secret = process.env.SCHEDULER_SECRET;
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || !provided) return false;
  const expected = Buffer.from(secret);
  const received = Buffer.from(provided);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await runCollection('scheduled');
    return Response.json({
      status: result.status,
      created: result.created,
      failed: result.companiesFailed,
    });
  } catch (error) {
    if (error instanceof CollectionAlreadyRunningError)
      return Response.json({ error: 'Collection already running' }, { status: 409 });
    return Response.json({ error: 'Collection unavailable' }, { status: 503 });
  }
}
