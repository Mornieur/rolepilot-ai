import type { Recommendation, Seniority, WorkModel } from '@/types/domain';

const labels: Record<Recommendation | Seniority | WorkModel, string> = {
  recommended: 'Recommended',
  consider: 'Worth considering',
  skipped: 'Skipped',
  junior: 'Junior',
  mid: 'Mid-level',
  senior: 'Senior',
  staff: 'Staff',
  remote: 'Remote',
  hybrid: 'Hybrid',
  'on-site': 'On-site',
};

export function formatLabel(value: Recommendation | Seniority | WorkModel) {
  return labels[value];
}
export function formatScore(score: number) {
  return `${score}%`;
}
