import 'server-only';

import type { CandidateProfile } from '@/types/domain';

import type { CandidateProfileInput } from '@/features/profiles/schemas/candidate-profile';
import {
  toCandidateProfile,
  toCandidateProfileInsert,
} from '@/features/profiles/server/profile-mapper';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';

export class CandidateProfileDataError extends Error {
  constructor(message = 'Candidate profiles are unavailable right now. Please try again.') {
    super(message);
  }
}

function throwDataError(operation: string): never {
  console.error(`Candidate profile ${operation} failed.`);
  throw new CandidateProfileDataError();
}

export async function listCandidateProfiles(): Promise<CandidateProfile[]> {
  const { data, error } = await getSupabaseServerClient()
    .from('candidate_profiles')
    .select('*')
    .order('created_at');
  if (error) throwDataError('list');
  if (!data) return [];
  return data.map(toCandidateProfile);
}

export async function getCandidateProfileById(id: string): Promise<CandidateProfile | null> {
  const { data, error } = await getSupabaseServerClient()
    .from('candidate_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throwDataError('lookup');
  return data ? toCandidateProfile(data) : null;
}

export async function createCandidateProfile(
  input: CandidateProfileInput,
): Promise<CandidateProfile> {
  const { data, error } = await getSupabaseServerClient()
    .from('candidate_profiles')
    .insert(toCandidateProfileInsert(input))
    .select()
    .single();
  if (error || !data) throwDataError('create');
  return toCandidateProfile(data);
}

export async function updateCandidateProfile(
  id: string,
  input: CandidateProfileInput,
): Promise<CandidateProfile> {
  const { data, error } = await getSupabaseServerClient()
    .from('candidate_profiles')
    .update(toCandidateProfileInsert(input))
    .eq('id', id)
    .select()
    .single();
  if (error || !data) throwDataError('update');
  return toCandidateProfile(data);
}

export async function deleteCandidateProfile(id: string): Promise<void> {
  const client = getSupabaseServerClient();
  const { count, error: countError } = await client
    .from('candidate_profiles')
    .select('id', { count: 'exact', head: true });
  if (countError || count === null) throwDataError('count');
  if (count <= 1)
    throw new CandidateProfileDataError('The last candidate profile cannot be deleted.');

  const { error } = await client.from('candidate_profiles').delete().eq('id', id);
  if (error) throwDataError('delete');
}
