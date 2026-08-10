'use server';

import { revalidatePath } from 'next/cache';
import { runCollection } from '@/features/job-collection/server/run-collection';
import { requirePersonalAccess } from '@/lib/personal-access-server';

export async function runCollectionNowAction() {
  await requirePersonalAccess();
  try {
    const result = await runCollection('manual');
    revalidatePath('/companies');
    return { ok: true as const, result };
  } catch {
    return { ok: false as const, message: 'Não foi possível iniciar a coleta agora.' };
  }
}
