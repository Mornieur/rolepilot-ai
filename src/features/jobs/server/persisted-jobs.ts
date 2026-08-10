import 'server-only';

import type { PersistedJob } from '@/types/domain';
import type { ExternalJobPreview } from '@/features/job-sources/greenhouse/types';
import { collectionStatus, type CollectionStatus } from '@/features/jobs/collection';
import { previewToJobFields, toPersistedJob } from '@/features/jobs/server/job-mapper';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';

export class PersistedJobDataError extends Error {
  constructor(message = 'Collected jobs could not be saved. Please try again.') {
    super(message);
  }
}
const fail = (operation: string): never => {
  console.error(`Persisted job ${operation} failed.`);
  throw new PersistedJobDataError();
};

export type JobCollectionResult = {
  companyId: string;
  provider: 'greenhouse';
  startedAt: string;
  completedAt: string;
  discovered: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  malformed: number;
  jobs: { externalId: string; title: string; status: CollectionStatus; persistedJobId: string }[];
};

export async function listPersistedJobs(): Promise<PersistedJob[]> {
  const { data, error } = await getSupabaseServerClient()
    .from('jobs')
    .select('*')
    .order('last_seen_at', { ascending: false });
  if (error) fail('list');
  return (data ?? []).map(toPersistedJob);
}
export async function getPersistedJobById(id: string): Promise<PersistedJob | null> {
  const { data, error } = await getSupabaseServerClient()
    .from('jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) fail('lookup');
  return data ? toPersistedJob(data) : null;
}
export async function listPersistedJobsByCompany(companyId: string): Promise<PersistedJob[]> {
  const { data, error } = await getSupabaseServerClient()
    .from('jobs')
    .select('*')
    .eq('target_company_id', companyId);
  if (error) fail('list');
  return (data ?? []).map(toPersistedJob);
}
export async function listPersistedJobsByIds(ids: string[]): Promise<PersistedJob[]> {
  if (!ids.length) return [];
  const { data, error } = await getSupabaseServerClient().from('jobs').select('*').in('id', ids);
  if (error) fail('list by ids');
  return (data ?? []).map(toPersistedJob);
}

export async function persistCollectedJobs(
  companyId: string,
  previews: ExternalJobPreview[],
  malformed: number,
  startedAt: string,
): Promise<JobCollectionResult> {
  const existing = await listPersistedJobsByCompany(companyId);
  const byIdentity = new Map(
    existing.map((job) => [`greenhouse:${job.targetCompanyId}:${job.externalId}`, job]),
  );
  const result: JobCollectionResult = {
    companyId,
    provider: 'greenhouse',
    startedAt,
    completedAt: startedAt,
    discovered: previews.length,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    malformed,
    jobs: [],
  };
  const client = getSupabaseServerClient();
  const seen = new Set<string>();
  for (const preview of previews) {
    const identity = `greenhouse:${companyId}:${preview.externalId}`;
    if (seen.has(identity)) {
      result.skipped += 1;
      continue;
    }
    seen.add(identity);
    const current = byIdentity.get(identity);
    const status = collectionStatus(current, preview);
    const now = new Date().toISOString();
    if (status === 'created') {
      const { data, error } = await client
        .from('jobs')
        .insert({ ...previewToJobFields(preview), first_seen_at: now, last_seen_at: now })
        .select()
        .single();
      if (error) fail(error.code === '23505' ? 'unique conflict' : 'create');
      if (!data) throw new PersistedJobDataError();
      result.created += 1;
      result.jobs.push({
        externalId: preview.externalId,
        title: preview.title,
        status,
        persistedJobId: data.id,
      });
      continue;
    }
    if (!current) throw new PersistedJobDataError();
    const changes = {
      ...previewToJobFields(preview),
      last_seen_at: now,
      is_active: true,
      missing_successful_runs: 0,
      closed_at: null,
    };
    const { data, error } = await client
      .from('jobs')
      .update(changes)
      .eq('id', current.id)
      .select()
      .single();
    if (error) fail('update');
    if (!data) throw new PersistedJobDataError();
    result[status] += 1;
    result.jobs.push({
      externalId: preview.externalId,
      title: preview.title,
      status,
      persistedJobId: data.id,
    });
  }
  const seenIds = new Set(result.jobs.map((job) => job.persistedJobId));
  for (const job of existing) {
    if (seenIds.has(job.id)) continue;
    const missing = (job.missingSuccessfulRuns ?? 0) + 1;
    const closed = missing >= 3;
    const { error } = await client
      .from('jobs')
      .update({
        missing_successful_runs: missing,
        is_active: !closed,
        closed_at: closed ? new Date().toISOString() : null,
      })
      .eq('id', job.id);
    if (error) fail('lifecycle update');
  }
  result.completedAt = new Date().toISOString();
  return result;
}
