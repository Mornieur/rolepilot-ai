"use server";

import { revalidatePath } from "next/cache";

import { candidateProfileIdSchema, parseCandidateProfileFormData } from "@/features/profiles/schemas/candidate-profile";
import { CandidateProfileDataError, createCandidateProfile, deleteCandidateProfile, updateCandidateProfile } from "@/features/profiles/server/candidate-profiles";

export type ProfileActionState = { status: "idle" | "success" | "error"; message?: string; fieldErrors?: Record<string, string[] | undefined> };
export const initialProfileActionState: ProfileActionState = { status: "idle" };

function validationState(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }): ProfileActionState {
  return { status: "error", message: "Please correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors };
}

function dataErrorState(error: unknown): ProfileActionState {
  if (error instanceof CandidateProfileDataError) return { status: "error", message: error.message };
  return { status: "error", message: "Unable to save the profile. Please try again." };
}

function refreshProfileViews() { revalidatePath("/"); revalidatePath("/profiles"); }

export async function createCandidateProfileAction(_: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const parsed = parseCandidateProfileFormData(formData);
  if (!parsed.success) return validationState(parsed.error);
  try { await createCandidateProfile(parsed.data); refreshProfileViews(); return { status: "success", message: "Profile created." }; }
  catch (error) { return dataErrorState(error); }
}

export async function updateCandidateProfileAction(_: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const id = candidateProfileIdSchema.safeParse(formData.get("id"));
  const parsed = parseCandidateProfileFormData(formData);
  if (!id.success) return { status: "error", message: "The profile could not be identified." };
  if (!parsed.success) return validationState(parsed.error);
  try { await updateCandidateProfile(id.data, parsed.data); refreshProfileViews(); return { status: "success", message: "Profile updated." }; }
  catch (error) { return dataErrorState(error); }
}

export async function deleteCandidateProfileAction(_: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const id = candidateProfileIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: "The profile could not be identified." };
  try { await deleteCandidateProfile(id.data); refreshProfileViews(); return { status: "success", message: "Profile deleted." }; }
  catch (error) { return dataErrorState(error); }
}
