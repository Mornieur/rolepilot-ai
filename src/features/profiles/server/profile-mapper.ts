import type { CandidateProfile, Seniority, WorkModel } from "@/types/domain";

import type { CandidateProfileInput } from "@/features/profiles/schemas/candidate-profile";
import type { CandidateProfileRow } from "@/features/profiles/types/database";

const seniorityValues: Seniority[] = ["junior", "mid", "senior", "staff"];
const workModelValues: WorkModel[] = ["remote", "hybrid", "on-site"];

function isSeniority(value: string): value is Seniority { return seniorityValues.some((candidate) => candidate === value); }
function isWorkModel(value: string): value is WorkModel { return workModelValues.some((candidate) => candidate === value); }
const arrayOrEmpty = (value: string[] | null) => value ?? [];

export function toCandidateProfile(row: CandidateProfileRow): CandidateProfile {
  return {
    id: row.id,
    name: row.name,
    desiredRoles: arrayOrEmpty(row.desired_roles),
    acceptedSeniorities: arrayOrEmpty(row.accepted_seniorities).filter(isSeniority),
    requiredSkills: arrayOrEmpty(row.required_skills),
    preferredSkills: arrayOrEmpty(row.preferred_skills),
    excludedSkills: arrayOrEmpty(row.excluded_skills),
    acceptedWorkModels: arrayOrEmpty(row.accepted_work_models).filter(isWorkModel),
    locations: arrayOrEmpty(row.locations),
  };
}

export function toCandidateProfileInsert(input: CandidateProfileInput) {
  return {
    name: input.name,
    desired_roles: input.desiredRoles,
    accepted_seniorities: input.acceptedSeniorities,
    required_skills: input.requiredSkills,
    preferred_skills: input.preferredSkills,
    excluded_skills: input.excludedSkills,
    accepted_work_models: input.acceptedWorkModels,
    locations: input.locations,
  };
}
