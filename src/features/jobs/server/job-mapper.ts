import type { PersistedJob } from "@/types/domain";
import type { ExternalJobPreview } from "@/features/job-sources/greenhouse/types";
import type { PersistedJobRow } from "@/features/profiles/types/database";

const arrays = (value: string[] | null) => value ?? [];

export function toPersistedJob(row: PersistedJobRow): PersistedJob {
  if (row.provider !== "greenhouse") throw new Error("Invalid persisted job row.");
  return { id: row.id, provider: "greenhouse", targetCompanyId: row.target_company_id, externalId: row.external_id, title: row.title, location: row.location, descriptionText: row.description_text, originalUrl: row.original_url, sourceUpdatedAt: row.source_updated_at, language: row.language, departments: arrays(row.departments), offices: arrays(row.offices), firstSeenAt: row.first_seen_at, lastSeenAt: row.last_seen_at, createdAt: row.created_at, updatedAt: row.updated_at };
}

export function previewToJobFields(preview: ExternalJobPreview) { return { provider: "greenhouse" as const, target_company_id: preview.companyId, external_id: preview.externalId, title: preview.title, location: preview.location, description_text: preview.descriptionText, original_url: preview.originalUrl, source_updated_at: preview.sourceUpdatedAt, language: preview.language, departments: preview.departments, offices: preview.offices }; }
