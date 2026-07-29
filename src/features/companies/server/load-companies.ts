import "server-only";

import type { TargetCompany } from "@/types/domain";

import { listTargetCompanies, TargetCompanyDataError } from "@/features/companies/server/target-companies";
import { SupabaseConfigurationError } from "@/features/profiles/server/supabase";

export type CompanyLoadResult = { companies: TargetCompany[]; error: null } | { companies: null; error: string };

export async function loadTargetCompanies(): Promise<CompanyLoadResult> {
  try { return { companies: await listTargetCompanies(), error: null }; }
  catch (error) {
    if (error instanceof SupabaseConfigurationError || error instanceof TargetCompanyDataError) return { companies: null, error: error.message };
    return { companies: null, error: "Target companies could not be loaded." };
  }
}
