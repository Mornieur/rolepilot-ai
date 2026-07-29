"use server";

import { targetCompanyIdSchema } from "@/features/companies/schemas/target-company";
import { getTargetCompanyById, TargetCompanyDataError } from "@/features/companies/server/target-companies";
import { GreenhouseError } from "@/features/job-sources/greenhouse/errors";
import { fetchGreenhouseJobs } from "@/features/job-sources/greenhouse/client";
import type { ExternalJobPreview } from "@/features/job-sources/greenhouse/types";

export type GreenhousePreviewActionState = { status: "idle" | "success" | "empty" | "error"; message?: string; jobs?: ExternalJobPreview[]; total?: number; skippedJobs?: number; requestedAt?: string };
export const initialGreenhousePreviewState: GreenhousePreviewActionState = { status: "idle" };

export async function previewGreenhouseJobsAction(_: GreenhousePreviewActionState, formData: FormData): Promise<GreenhousePreviewActionState> {
  const id = targetCompanyIdSchema.safeParse(formData.get("companyId"));
  if (!id.success) return { status: "error", message: "The company could not be identified." };
  try {
    const company = await getTargetCompanyById(id.data);
    if (!company) return { status: "error", message: "The requested company could not be found." };
    if (company.provider !== "greenhouse") return { status: "error", message: "Job previews are currently available only for Greenhouse companies." };
    if (!company.enabled) return { status: "error", message: "Enable monitoring for this company before requesting a preview." };
    const result = await fetchGreenhouseJobs(company);
    const requestedAt = new Date().toISOString();
    if (result.jobs.length === 0) return { status: "empty", message: "No published jobs were returned for this board.", total: result.total, skippedJobs: result.skippedJobs, requestedAt };
    return { status: "success", jobs: result.jobs, total: result.total, skippedJobs: result.skippedJobs, requestedAt };
  } catch (error) {
    if (error instanceof GreenhouseError || error instanceof TargetCompanyDataError) return { status: "error", message: error.message };
    return { status: "error", message: "Unable to request a Greenhouse preview. Please try again." };
  }
}
