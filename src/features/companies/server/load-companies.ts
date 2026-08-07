import 'server-only';

import type { TargetCompany } from '@/types/domain';

import {
  getTargetCompanyById,
  listTargetCompanies,
  TargetCompanyDataError,
} from '@/features/companies/server/target-companies';
import { targetCompanyIdSchema } from '@/features/companies/schemas/target-company';
import { SupabaseConfigurationError } from '@/features/profiles/server/supabase';

export type CompanyLoadResult =
  { companies: TargetCompany[]; error: null } | { companies: null; error: string };

export async function loadTargetCompanies(): Promise<CompanyLoadResult> {
  try {
    return { companies: await listTargetCompanies(), error: null };
  } catch (error) {
    if (error instanceof SupabaseConfigurationError || error instanceof TargetCompanyDataError)
      return { companies: null, error: error.message };
    return { companies: null, error: 'Target companies could not be loaded.' };
  }
}

export async function loadTargetCompanyById(
  id: string,
): Promise<{ company: TargetCompany | null; error: string | null }> {
  if (!targetCompanyIdSchema.safeParse(id).success)
    return { company: null, error: 'The requested company could not be found.' };
  try {
    const company = await getTargetCompanyById(id);
    return company
      ? { company, error: null }
      : { company: null, error: 'The requested company could not be found.' };
  } catch (error) {
    if (error instanceof SupabaseConfigurationError || error instanceof TargetCompanyDataError)
      return { company: null, error: error.message };
    return { company: null, error: 'The requested company could not be loaded.' };
  }
}
