'use server';

import { revalidatePath } from 'next/cache';
import { runCollection } from '@/features/job-collection/server/run-collection';

export async function runCollectionNowAction() {
  try {
    const result = await runCollection('manual');
    revalidatePath('/companies');
    return { ok: true as const, result };
  } catch {
    return { ok: false as const, message: 'Não foi possível iniciar a coleta agora.' };
  }
}
