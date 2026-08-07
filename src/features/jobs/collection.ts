import type { PersistedJob } from '@/types/domain';
import type { ExternalJobPreview } from '@/features/job-sources/greenhouse/types';

export type CollectionStatus = 'created' | 'updated' | 'unchanged';
export const normalizeSourceArray = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
export function sourceIdentity(preview: ExternalJobPreview) {
  return `${preview.provider}:${preview.companyId}:${preview.externalId}`;
}
export function collectionStatus(
  existing: PersistedJob | undefined,
  incoming: ExternalJobPreview,
): CollectionStatus {
  if (!existing) return 'created';
  const same =
    existing.title === incoming.title &&
    existing.location === incoming.location &&
    existing.descriptionText === incoming.descriptionText &&
    existing.originalUrl === incoming.originalUrl &&
    existing.sourceUpdatedAt === incoming.sourceUpdatedAt &&
    existing.language === incoming.language &&
    JSON.stringify(normalizeSourceArray(existing.departments)) ===
      JSON.stringify(normalizeSourceArray(incoming.departments)) &&
    JSON.stringify(normalizeSourceArray(existing.offices)) ===
      JSON.stringify(normalizeSourceArray(incoming.offices));
  return same ? 'unchanged' : 'updated';
}
