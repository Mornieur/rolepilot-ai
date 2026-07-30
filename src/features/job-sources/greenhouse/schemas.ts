import { z } from "zod";

export const greenhouseBoardIdentifierSchema = z.string().trim().min(1, "Enter a Greenhouse board identifier.").max(120, "Board identifier must be 120 characters or fewer.").regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, hyphens, and underscores.").transform((value) => value.toLocaleLowerCase());

const nameItemSchema = z.object({ name: z.string() });
export const greenhouseJobSchema = z.object({
  id: z.union([z.string(), z.number()]),
  internal_job_id: z.union([z.string(), z.number()]).nullable().optional(),
  title: z.string().min(1),
  updated_at: z.string().nullable().optional(),
  location: z.object({ name: z.string().nullable().optional() }).nullable().optional(),
  absolute_url: z.url(),
  language: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  departments: z.array(nameItemSchema).nullable().optional(),
  offices: z.array(nameItemSchema).nullable().optional(),
});

export const greenhouseResponseSchema = z.object({
  jobs: z.array(z.unknown()),
  meta: z.object({ total: z.number().int().nonnegative().optional() }).optional(),
});

export type GreenhouseJob = z.output<typeof greenhouseJobSchema>;
