export const workModels = ["remote", "hybrid", "on-site"] as const;
export type WorkModel = (typeof workModels)[number];

export const seniorities = ["junior", "mid", "senior", "staff"] as const;
export type Seniority = (typeof seniorities)[number];

export const recommendations = ["recommended", "consider", "skipped"] as const;
export type Recommendation = (typeof recommendations)[number];

export type CandidateProfile = {
  id: string;
  name: string;
  desiredRoles: string[];
  acceptedSeniorities: Seniority[];
  requiredSkills: string[];
  preferredSkills: string[];
  excludedSkills: string[];
  acceptedWorkModels: WorkModel[];
  locations: string[];
};

export type Job = {
  id: string;
  externalId: string;
  source: string;
  title: string;
  company: string;
  location: string;
  workModel: WorkModel;
  seniority: Seniority;
  description: string;
  originalUrl: string | null;
  publishedAt: string;
  collectedAt: string;
};

export type JobMatch = {
  score: number;
  recommendation: Recommendation;
  confidence: number;
  strengths: string[];
  gaps: string[];
  blockingReasons: string[];
  summary: string;
};

export type JobAnalysis = JobMatch & {
  profileId: CandidateProfile["id"];
  jobId: Job["id"];
};
