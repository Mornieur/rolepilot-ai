import { z } from "zod";

import { companyPriorities, jobSourceProviders } from "@/types/domain";

const optionalUrl = z.string().trim().max(500, "Careers URL must be 500 characters or fewer.").transform((value) => value || undefined).pipe(z.url("Enter a valid URL.").optional());

export const targetCompanyInputSchema = z.object({
  name: z.string().trim().min(1, "Enter a company name.").max(100, "Name must be 100 characters or fewer."),
  provider: z.enum(jobSourceProviders),
  boardIdentifier: z.string().trim().min(1, "Enter a board identifier.").max(120, "Board identifier must be 120 characters or fewer.").transform((value) => value.toLocaleLowerCase()),
  careersUrl: optionalUrl,
  enabled: z.boolean(),
  priority: z.enum(companyPriorities),
});

export const targetCompanyIdSchema = z.string().uuid("Company identifier is invalid.");
export type TargetCompanyInput = z.output<typeof targetCompanyInputSchema>;

export function parseTargetCompanyFormData(formData: FormData) {
  return targetCompanyInputSchema.safeParse({
    name: formData.get("name"),
    provider: formData.get("provider"),
    boardIdentifier: formData.get("boardIdentifier"),
    careersUrl: formData.get("careersUrl"),
    enabled: formData.get("enabled") === "on",
    priority: formData.get("priority"),
  });
}
