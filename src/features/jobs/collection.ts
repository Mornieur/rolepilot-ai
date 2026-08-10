import type { PersistedJob } from '@/types/domain';
import type { ExternalJobPreview } from '@/features/job-sources/greenhouse/types';

export type CollectionStatus = 'created' | 'updated' | 'unchanged';
export const normalizeSourceArray = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();

const sameSourceArray = (left: string[], right: string[]) => {
  const normalizedLeft = normalizeSourceArray(left);
  const normalizedRight = normalizeSourceArray(right);
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
};

const sameSourceTimestamp = (left: string | null, right: string | null) => {
  if (left === right) return true;
  if (!left || !right) return false;

  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  return !Number.isNaN(leftTime) && !Number.isNaN(rightTime) && leftTime === rightTime;
};
export function sourceIdentity(preview: ExternalJobPreview) {
  return `${preview.provider}:${preview.companyId}:${preview.externalId}`;
}

/**
 * Compares only material, provider-owned job fields. RolePilot observation and
 * lifecycle fields (for example last_seen_at and missing_successful_runs) are
 * intentionally excluded from this boundary.
 */
export function hasSourceJobChanged(existing: PersistedJob, incoming: ExternalJobPreview) {
  return !(
    existing.title === incoming.title &&
    existing.location === incoming.location &&
    existing.descriptionText === incoming.descriptionText &&
    existing.originalUrl === incoming.originalUrl &&
    sameSourceTimestamp(existing.sourceUpdatedAt, incoming.sourceUpdatedAt) &&
    existing.language === incoming.language &&
    sameSourceArray(existing.departments, incoming.departments) &&
    sameSourceArray(existing.offices, incoming.offices)
  );
}
export function collectionStatus(
  existing: PersistedJob | undefined,
  incoming: ExternalJobPreview,
): CollectionStatus {
  if (!existing) return 'created';
  return hasSourceJobChanged(existing, incoming) ? 'updated' : 'unchanged';
}
