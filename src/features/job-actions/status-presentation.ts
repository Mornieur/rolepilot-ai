import type { JobUserStatus } from '@/types/domain';

export const jobDecisionLabels: Record<JobUserStatus, string> = {
  new: 'Sem decisão',
  saved: 'Salva',
  applied: 'Candidatada',
  ignored: 'Ignorada',
  rejected: 'Rejeitada',
};
