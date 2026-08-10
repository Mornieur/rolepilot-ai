'use server';

import { revalidatePath } from 'next/cache';
import { runCollection } from '@/features/job-collection/server/run-collection';
import { requireAdmin, requireCurrentUser } from '@/features/auth/server/auth';

export async function runCollectionNowAction() {
  requireAdmin(await requireCurrentUser());
  try {
    const result = await runCollection('manual');
    revalidatePath('/companies');
    return { ok: true as const, result };
  } catch {
    return { ok: false as const, message: 'Não foi possível iniciar a coleta agora.' };
  }
}
