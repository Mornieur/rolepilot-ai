import 'server-only';

import type { TargetCompany } from '@/types/domain';

import { targetCompanyDatabaseMessage } from '@/features/companies/company-errors';
import type { TargetCompanyInput } from '@/features/companies/schemas/target-company';
import { toTargetCompany, toTargetCompanyInsert } from '@/features/companies/server/company-mapper';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';

export class TargetCompanyDataError extends Error {
  constructor(message = targetCompanyDatabaseMessage(false)) {
    super(message);
  }
}

function throwDataError(operation: string, duplicate = false): never {
  console.error(`Target company ${operation} failed.`);
  throw new TargetCompanyDataError(targetCompanyDatabaseMessage(duplicate));
}

export async function listTargetCompanies(): Promise<TargetCompany[]> {
  const { data, error } = await getSupabaseServerClient()
    .from('target_companies')
    .select('*')
    .order('created_at');
  if (error) throwDataError('list');
  return (data ?? []).map(toTargetCompany);
}

export async function getTargetCompanyById(id: string): Promise<TargetCompany | null> {
  const { data, error } = await getSupabaseServerClient()
    .from('target_companies')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throwDataError('lookup');
  return data ? toTargetCompany(data) : null;
}

export async function createTargetCompany(input: TargetCompanyInput): Promise<TargetCompany> {
  const { data, error } = await getSupabaseServerClient()
    .from('target_companies')
    .insert(toTargetCompanyInsert(input))
    .select()
    .single();
  if (error || !data) throwDataError('create', error?.code === '23505');
  return toTargetCompany(data);
}

export async function updateTargetCompany(
  id: string,
  input: TargetCompanyInput,
): Promise<TargetCompany> {
  const { data, error } = await getSupabaseServerClient()
    .from('target_companies')
    .update(toTargetCompanyInsert(input))
    .eq('id', id)
    .select()
    .single();
  if (error || !data) throwDataError('update', error?.code === '23505');
  return toTargetCompany(data);
}

export async function deleteTargetCompany(id: string): Promise<void> {
  const { error } = await getSupabaseServerClient().from('target_companies').delete().eq('id', id);
  if (error) throwDataError('delete');
}

export async function setTargetCompanyEnabled(
  id: string,
  enabled: boolean,
): Promise<TargetCompany> {
  const { data, error } = await getSupabaseServerClient()
    .from('target_companies')
    .update({ enabled })
    .eq('id', id)
    .select()
    .single();
  if (error || !data) throwDataError('monitoring update');
  return toTargetCompany(data);
}
