import type { TargetCompany } from '@/types/domain';

import type { TargetCompanyInput } from '@/features/companies/schemas/target-company';
import type { TargetCompanyRow } from '@/features/profiles/types/database';

function isProvider(value: string): value is TargetCompany['provider'] {
  return value === 'greenhouse' || value === 'lever';
}
function isPriority(value: string): value is TargetCompany['priority'] {
  return value === 'normal' || value === 'high';
}

export function toTargetCompany(row: TargetCompanyRow): TargetCompany {
  if (!isProvider(row.provider) || !isPriority(row.priority))
    throw new Error('Invalid target company row.');
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    boardIdentifier: row.board_identifier,
    careersUrl: row.careers_url ?? undefined,
    enabled: row.enabled,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toTargetCompanyInsert(input: TargetCompanyInput) {
  return {
    name: input.name,
    provider: input.provider,
    board_identifier: input.boardIdentifier,
    careers_url: input.careersUrl ?? null,
    enabled: input.enabled,
    priority: input.priority,
  };
}
