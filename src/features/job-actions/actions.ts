'use server';
import { JobStatusDataError, saveStatus } from '@/features/job-actions/server/job-statuses';
import { jobStatusInputSchema } from '@/features/job-actions/schema';
import { getCandidateProfileById } from '@/features/profiles/server/candidate-profiles';
import { getPersistedJobById } from '@/features/jobs/server/persisted-jobs';
import { requirePersonalAccess } from '@/lib/personal-access-server';
import type { JobStatusActionState } from '@/features/job-actions/action-state';
export async function saveJobStatusAction(
  _: JobStatusActionState,
  formData: FormData,
): Promise<JobStatusActionState> {
  await requirePersonalAccess();
  const parsed = jobStatusInputSchema.safeParse({
    profileId: formData.get('profileId'),
    jobId: formData.get('jobId'),
    status: formData.get('status'),
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) return { status: 'error', message: 'A decisão da vaga é inválida.' };
  try {
    const [profile, job] = await Promise.all([
      getCandidateProfileById(parsed.data.profileId),
      getPersistedJobById(parsed.data.jobId),
    ]);
    if (!profile || !job)
      return { status: 'error', message: 'O perfil ou a vaga não foi encontrado.' };
    const result = await saveStatus(
      parsed.data.profileId,
      parsed.data.jobId,
      parsed.data.status,
      parsed.data.notes ?? null,
    );
    return { status: 'success', current: result.status, message: 'Decisão salva.' };
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof JobStatusDataError ? error.message : 'Não foi possível salvar a decisão.',
    };
  }
}
