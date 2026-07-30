import type { TargetCompany } from "@/types/domain";

import { greenhouseHtmlToText } from "@/features/job-sources/greenhouse/description";
import { greenhouseJobSchema, greenhouseResponseSchema, type GreenhouseJob } from "@/features/job-sources/greenhouse/schemas";
import type { ExternalJobPreview, GreenhousePreviewResult } from "@/features/job-sources/greenhouse/types";

function names(items: { name: string }[] | null | undefined) { return (items ?? []).map((item) => item.name); }

export function mapGreenhouseJob(job: GreenhouseJob, company: TargetCompany): ExternalJobPreview {
  return { externalId: String(job.id), provider: "greenhouse", companyId: company.id, companyName: company.name, title: job.title, location: job.location?.name ?? null, descriptionText: greenhouseHtmlToText(job.content), originalUrl: job.absolute_url, sourceUpdatedAt: job.updated_at ?? null, language: job.language ?? null, departments: names(job.departments), offices: names(job.offices) };
}

export function mapGreenhouseResponse(payload: unknown, company: TargetCompany): GreenhousePreviewResult {
  const response = greenhouseResponseSchema.safeParse(payload);
  if (!response.success) throw new Error("Invalid Greenhouse response.");
  const parsedJobs = response.data.jobs.map((job) => greenhouseJobSchema.safeParse(job));
  const jobs = parsedJobs.filter((job) => job.success).map((job) => mapGreenhouseJob(job.data, company));
  return { jobs, total: response.data.meta?.total ?? jobs.length, skippedJobs: parsedJobs.length - jobs.length };
}
