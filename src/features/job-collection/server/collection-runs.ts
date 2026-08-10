import 'server-only';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';
import type { CollectionRunResult, CollectionTrigger } from '@/features/job-collection/types';

export class CollectionAlreadyRunningError extends Error {}

export async function startCollectionRun(trigger: CollectionTrigger) {
  const { data, error } = await getSupabaseServerClient()
    .from('collection_runs')
    .insert({ trigger, status: 'running' })
    .select('*')
    .single();
  if (error?.code === '23505') throw new CollectionAlreadyRunningError();
  if (error || !data) throw new Error('collection-run-unavailable');
  return data;
}
export async function finishCollectionRun(id: string, result: CollectionRunResult) {
  const { error } = await getSupabaseServerClient()
    .from('collection_runs')
    .update({
      status: result.status,
      finished_at: result.finishedAt,
      companies_attempted: result.companiesAttempted,
      companies_succeeded: result.companiesSucceeded,
      companies_failed: result.companiesFailed,
      discovered_count: result.discovered,
      created_count: result.created,
      updated_count: result.updated,
      unchanged_count: result.unchanged,
      malformed_count: result.malformed,
      skipped_count: result.skipped,
      company_results: result.companies,
    })
    .eq('id', id);
  if (error) throw new Error('collection-run-unavailable');
}

export async function getLatestCollectionRun() {
  const { data, error } = await getSupabaseServerClient()
    .from('collection_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('collection-run-unavailable');
  return data;
}
