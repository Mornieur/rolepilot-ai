import type { JobSourceProvider } from '@/types/domain';

export type CollectionTrigger = 'manual' | 'scheduled';
export type CollectionRunStatus = 'running' | 'success' | 'partial' | 'failed';
export type CompanyCollectionResult = {
  companyId: string;
  companyName: string;
  provider: JobSourceProvider;
  status: 'success' | 'failed' | 'skipped';
  discovered: number;
  created: number;
  updated: number;
  unchanged: number;
  malformed: number;
  skipped: number;
  errorCategory?: 'timeout' | 'unavailable' | 'invalid-response' | 'unsupported' | 'persistence';
};
export type CollectionRunResult = {
  id?: string;
  trigger: CollectionTrigger;
  status: CollectionRunStatus;
  startedAt: string;
  finishedAt: string;
  companiesAttempted: number;
  companiesSucceeded: number;
  companiesFailed: number;
  discovered: number;
  created: number;
  updated: number;
  unchanged: number;
  malformed: number;
  skipped: number;
  companies: CompanyCollectionResult[];
};
