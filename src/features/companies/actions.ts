'use server';

import { revalidatePath } from 'next/cache';

import {
  parseTargetCompanyFormData,
  targetCompanyIdSchema,
} from '@/features/companies/schemas/target-company';
import {
  createTargetCompany,
  deleteTargetCompany,
  setTargetCompanyEnabled,
  TargetCompanyDataError,
  updateTargetCompany,
} from '@/features/companies/server/target-companies';
import type { CompanyActionState } from '@/features/companies/action-state';

function validationState(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}): CompanyActionState {
  return {
    status: 'error',
    message: 'Please correct the highlighted fields.',
    fieldErrors: error.flatten().fieldErrors,
  };
}
function dataErrorState(error: unknown): CompanyActionState {
  return error instanceof TargetCompanyDataError
    ? { status: 'error', message: error.message }
    : { status: 'error', message: 'Unable to save the company. Please try again.' };
}
function refreshCompanyViews() {
  revalidatePath('/');
  revalidatePath('/companies');
}

export async function createTargetCompanyAction(
  _: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const parsed = parseTargetCompanyFormData(formData);
  if (!parsed.success) return validationState(parsed.error);
  try {
    await createTargetCompany(parsed.data);
    refreshCompanyViews();
    return { status: 'success', message: 'Company configured.' };
  } catch (error) {
    return dataErrorState(error);
  }
}

export async function updateTargetCompanyAction(
  _: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const id = targetCompanyIdSchema.safeParse(formData.get('id'));
  const parsed = parseTargetCompanyFormData(formData);
  if (!id.success) return { status: 'error', message: 'The company could not be identified.' };
  if (!parsed.success) return validationState(parsed.error);
  try {
    await updateTargetCompany(id.data, parsed.data);
    refreshCompanyViews();
    return { status: 'success', message: 'Company updated.' };
  } catch (error) {
    return dataErrorState(error);
  }
}

export async function deleteTargetCompanyAction(
  _: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const id = targetCompanyIdSchema.safeParse(formData.get('id'));
  if (!id.success) return { status: 'error', message: 'The company could not be identified.' };
  try {
    await deleteTargetCompany(id.data);
    refreshCompanyViews();
    return { status: 'success', message: 'Company deleted.' };
  } catch (error) {
    return dataErrorState(error);
  }
}

export async function setTargetCompanyEnabledAction(
  _: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const id = targetCompanyIdSchema.safeParse(formData.get('id'));
  const enabled = formData.get('enabled') === 'true';
  if (!id.success) return { status: 'error', message: 'The company could not be identified.' };
  try {
    await setTargetCompanyEnabled(id.data, enabled);
    refreshCompanyViews();
    return { status: 'success', message: enabled ? 'Monitoring enabled.' : 'Monitoring disabled.' };
  } catch (error) {
    return dataErrorState(error);
  }
}
