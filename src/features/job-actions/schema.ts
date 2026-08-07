import { z } from "zod";

import { jobUserStatuses } from "@/types/domain";

export const jobStatusInputSchema = z.object({
  profileId: z.string().uuid("Profile identifier is invalid."),
  jobId: z.string().uuid("Job identifier is invalid."),
  status: z.enum(jobUserStatuses),
  notes: z.string().trim().max(1000, "Notes must be 1000 characters or fewer.").optional(),
});

export type JobStatusInput = z.output<typeof jobStatusInputSchema>;
