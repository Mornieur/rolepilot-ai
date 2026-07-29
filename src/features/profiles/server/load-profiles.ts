import "server-only";

import type { CandidateProfile } from "@/types/domain";

import { CandidateProfileDataError, listCandidateProfiles } from "@/features/profiles/server/candidate-profiles";
import { SupabaseConfigurationError } from "@/features/profiles/server/supabase";

export type ProfileLoadResult = { profiles: CandidateProfile[]; error: null } | { profiles: null; error: string };

export async function loadCandidateProfiles(): Promise<ProfileLoadResult> {
  try { return { profiles: await listCandidateProfiles(), error: null }; }
  catch (error) {
    if (error instanceof SupabaseConfigurationError || error instanceof CandidateProfileDataError) return { profiles: null, error: error.message };
    return { profiles: null, error: "Candidate profiles could not be loaded." };
  }
}
