import type { CandidateProfile, JobUserStatus, PersistedJob } from '@/types/domain';
import type { InsightPeriod } from './periods';

export type RankedInsight = { label: string; count: number };
export type JobInsightResult = {
  profile: CandidateProfile;
  period: InsightPeriod;
  sampleSize: number;
  statuses: Record<JobUserStatus, number>;
  saveRate: number;
  applicationRate: number;
  providers: RankedInsight[];
  companies: RankedInsight[];
  titles: RankedInsight[];
  locations: RankedInsight[];
  workModels: RankedInsight[];
  seniorities: RankedInsight[];
  profileTerms: {
    found: RankedInsight[];
    saved: RankedInsight[];
    applied: RankedInsight[];
    ignored: RankedInsight[];
    rare: string[];
  };
};
export type JobStatusRecord = {
  profileId: string;
  jobId: string;
  status: Exclude<JobUserStatus, 'new'>;
};
export type InsightInput = {
  profile: CandidateProfile;
  period: InsightPeriod;
  jobs: PersistedJob[];
  companies: Map<string, string>;
  statuses: JobStatusRecord[];
  now: Date;
};
