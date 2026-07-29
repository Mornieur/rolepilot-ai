import { z } from "zod";

import { seniorities, workModels } from "@/types/domain";

const listItem = z.string().trim().min(1, "Entries cannot be empty.").max(80, "Entries must be 80 characters or fewer.");
const list = (minimum = 0, message = "") => z.array(listItem).min(minimum, message).max(20, "Use no more than 20 entries.").transform((items) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
});

export const candidateProfileInputSchema = z.object({
  name: z.string().trim().min(1, "Enter a profile name.").max(100, "Name must be 100 characters or fewer."),
  desiredRoles: list(1, "Add at least one desired role."),
  acceptedSeniorities: z.array(z.enum(seniorities)).min(1, "Choose at least one seniority.").transform((items) => [...new Set(items)]),
  requiredSkills: list(1, "Add at least one required skill."),
  preferredSkills: list(),
  excludedSkills: list(),
  acceptedWorkModels: z.array(z.enum(workModels)).min(1, "Choose at least one work model.").transform((items) => [...new Set(items)]),
  locations: list(1, "Add at least one location."),
});

export const candidateProfileIdSchema = z.string().uuid("Profile identifier is invalid.");
export type CandidateProfileInput = z.output<typeof candidateProfileInputSchema>;

const splitList = (value: FormDataEntryValue | null) => typeof value === "string" ? value.split(",") : [];
const selectedValues = (formData: FormData, field: string) => formData.getAll(field).filter((value): value is string => typeof value === "string");

export function parseCandidateProfileFormData(formData: FormData) {
  return candidateProfileInputSchema.safeParse({
    name: formData.get("name"),
    desiredRoles: splitList(formData.get("desiredRoles")),
    acceptedSeniorities: selectedValues(formData, "acceptedSeniorities"),
    requiredSkills: splitList(formData.get("requiredSkills")),
    preferredSkills: splitList(formData.get("preferredSkills")),
    excludedSkills: splitList(formData.get("excludedSkills")),
    acceptedWorkModels: selectedValues(formData, "acceptedWorkModels"),
    locations: splitList(formData.get("locations")),
  });
}
