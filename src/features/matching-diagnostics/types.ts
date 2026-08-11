import type { DeterministicJobEvaluation } from '@/features/job-evaluation/types';
import type { CandidateProfile, JobUserStatus } from '@/types/domain';

export type DiagnosticJob = DeterministicJobEvaluation & {
  companyName: string;
  decision: JobUserStatus;
  hardReasonCodes: string[];
  warningCodes: string[];
  exactlyOneHardRule: boolean;
};

export type Count = { label: string; count: number; percentage?: number };

export type MatchingDiagnostics = {
  profile: CandidateProfile;
  queryCount: 3;
  jobs: { total: number; active: number; inactive: number; eligible: number; rejected: number };
  eligibleRate: number;
  byCompany: Array<{ company: string; eligible: number; rejected: number }>;
  scoreBuckets: Count[];
  rejectionReasons: Count[];
  warnings: Count[];
  workModels: Count[];
  seniorities: Count[];
  topEligible: DiagnosticJob[];
  borderlineRejected: DiagnosticJob[];
  falsePositives: DiagnosticJob[];
  falseNegatives: DiagnosticJob[];
  decisions: Record<JobUserStatus, number>;
  decisionComparison: Array<{
    decision: Exclude<JobUserStatus, 'new'>;
    count: number;
    eligible: number;
    rejected: number;
    averageScore: number | null;
  }>;
  crossCheck: Record<string, number>;
  qualitySignals: Record<string, number>;
};
