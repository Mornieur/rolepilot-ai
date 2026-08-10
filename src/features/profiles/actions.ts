'use server';

import { revalidatePath } from 'next/cache';
import { AuthorizationError, requireCurrentUser } from '@/features/auth/server/auth';

import {
  candidateProfileIdSchema,
  parseCandidateProfileFormData,
} from '@/features/profiles/schemas/candidate-profile';
import {
  CandidateProfileDataError,
  createCandidateProfile,
  deleteCandidateProfile,
  getCandidateProfileById,
  updateCandidateProfile,
} from '@/features/profiles/server/candidate-profiles';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';
import type { ProfileActionState } from '@/features/profiles/action-state';

function validationState(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}): ProfileActionState {
  return {
    status: 'error',
    message: 'Please correct the highlighted fields.',
    fieldErrors: error.flatten().fieldErrors,
  };
}

function dataErrorState(error: unknown): ProfileActionState {
  if (error instanceof AuthorizationError) return { status: 'error', message: error.message };
  if (error instanceof CandidateProfileDataError)
    return { status: 'error', message: error.message };
  return { status: 'error', message: 'Unable to save the profile. Please try again.' };
}

function refreshProfileViews() {
  revalidatePath('/');
  revalidatePath('/profiles');
}

export async function createCandidateProfileAction(
  _: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireCurrentUser();
  const parsed = parseCandidateProfileFormData(formData);
  if (!parsed.success) return validationState(parsed.error);
  try {
    await createCandidateProfile(parsed.data, user.id);
    refreshProfileViews();
    return { status: 'success', message: 'Profile created.' };
  } catch (error) {
    return dataErrorState(error);
  }
}

export async function updateCandidateProfileAction(
  _: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireCurrentUser();
  const id = candidateProfileIdSchema.safeParse(formData.get('id'));
  const parsed = parseCandidateProfileFormData(formData);
  if (!id.success) return { status: 'error', message: 'The profile could not be identified.' };
  if (!parsed.success) return validationState(parsed.error);
  try {
    const profile = await getCandidateProfileById(id.data);
    if (
      !profile ||
      (user.role !== 'admin' &&
        (
          await getSupabaseServerClient()
            .from('candidate_profiles')
            .select('user_id')
            .eq('id', id.data)
            .single()
        ).data?.user_id !== user.id)
    )
      throw new AuthorizationError();
    await updateCandidateProfile(id.data, parsed.data);
    refreshProfileViews();
    return { status: 'success', message: 'Profile updated.' };
  } catch (error) {
    return dataErrorState(error);
  }
}

export async function deleteCandidateProfileAction(
  _: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireCurrentUser();
  const id = candidateProfileIdSchema.safeParse(formData.get('id'));
  if (!id.success) return { status: 'error', message: 'The profile could not be identified.' };
  try {
    const row = await getSupabaseServerClient()
      .from('candidate_profiles')
      .select('user_id')
      .eq('id', id.data)
      .maybeSingle();
    if (!row.data || (user.role !== 'admin' && row.data.user_id !== user.id))
      throw new AuthorizationError();
    await deleteCandidateProfile(id.data);
    refreshProfileViews();
    return { status: 'success', message: 'Profile deleted.' };
  } catch (error) {
    return dataErrorState(error);
  }
}
