import type { DeterministicJobEvaluation } from '@/features/job-evaluation/types';
import type { JobUserStatus } from '@/types/domain';

export type OpportunityPriority = 'excellent' | 'good' | 'review';

export type InboxOpportunity = DeterministicJobEvaluation & {
  companyName: string;
  decision: JobUserStatus;
  priority: OpportunityPriority;
  isNew: boolean;
};

export type InboxSummary = {
  compatible: number;
  new: number;
  saved: number;
  excellent: number;
};
