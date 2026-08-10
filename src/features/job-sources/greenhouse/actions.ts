'use server';

import { targetCompanyIdSchema } from '@/features/companies/schemas/target-company';
import {
  getTargetCompanyById,
  TargetCompanyDataError,
} from '@/features/companies/server/target-companies';
import { GreenhouseError } from '@/features/job-sources/greenhouse/errors';
import { fetchGreenhouseJobs } from '@/features/job-sources/greenhouse/client';
import { PersistedJobDataError } from '@/features/jobs/server/persisted-jobs';
import { runCollection } from '@/features/job-collection/server/run-collection';
import { revalidatePath } from 'next/cache';
import { requirePersonalAccess } from '@/lib/personal-access-server';
import type {
  GreenhouseCollectionActionState,
  GreenhousePreviewActionState,
} from '@/features/job-sources/greenhouse/action-state';

export async function previewGreenhouseJobsAction(
  _: GreenhousePreviewActionState,
  formData: FormData,
): Promise<GreenhousePreviewActionState> {
  await requirePersonalAccess();
  const id = targetCompanyIdSchema.safeParse(formData.get('companyId'));
  if (!id.success) return { status: 'error', message: 'The company could not be identified.' };
  try {
    const company = await getTargetCompanyById(id.data);
    if (!company) return { status: 'error', message: 'The requested company could not be found.' };
    if (company.provider !== 'greenhouse')
      return {
        status: 'error',
        message: 'Job previews are currently available only for Greenhouse companies.',
      };
    if (!company.enabled)
      return {
        status: 'error',
        message: 'Enable monitoring for this company before requesting a preview.',
      };
    const result = await fetchGreenhouseJobs(company);
    const requestedAt = new Date().toISOString();
    if (result.jobs.length === 0)
      return {
        status: 'empty',
        message: 'No published jobs were returned for this board.',
        total: result.total,
        skippedJobs: result.skippedJobs,
        requestedAt,
      };
    return {
      status: 'success',
      jobs: result.jobs,
      total: result.total,
      skippedJobs: result.skippedJobs,
      requestedAt,
    };
  } catch (error) {
    if (error instanceof GreenhouseError || error instanceof TargetCompanyDataError)
      return { status: 'error', message: error.message };
    return {
      status: 'error',
      message: 'Unable to request a Greenhouse preview. Please try again.',
    };
  }
}

export async function saveGreenhouseJobsAction(
  _: GreenhouseCollectionActionState,
  formData: FormData,
): Promise<GreenhouseCollectionActionState> {
  await requirePersonalAccess();
  const id = targetCompanyIdSchema.safeParse(formData.get('companyId'));
  if (!id.success) return { status: 'error', message: 'The company could not be identified.' };
  const startedAt = new Date().toISOString();
  try {
    const company = await getTargetCompanyById(id.data);
    if (!company) return { status: 'error', message: 'The requested company could not be found.' };
    if (!company.enabled)
      return { status: 'error', message: 'Enable monitoring for this company before saving jobs.' };
    if (company.provider !== 'greenhouse')
      return {
        status: 'error',
        message: 'Job collection is currently available only for Greenhouse companies.',
      };
    const run = await runCollection('manual', company.id);
    const result = run.companies[0];
    if (!result || result.status !== 'success') throw new PersistedJobDataError();
    revalidatePath('/');
    revalidatePath('/jobs');
    revalidatePath(`/companies/${company.id}/jobs-preview`);
    return {
      status: 'success',
      message: 'Collected jobs saved.',
      result: {
        ...result,
        companyId: company.id,
        provider: 'greenhouse',
        startedAt,
        completedAt: run.finishedAt,
        jobs: [],
      },
    };
  } catch (error) {
    if (
      error instanceof GreenhouseError ||
      error instanceof TargetCompanyDataError ||
      error instanceof PersistedJobDataError
    )
      return { status: 'error', message: error.message };
    return { status: 'error', message: 'Unable to save collected jobs. Please try again.' };
  }
}
