export const dossierEvidenceClasses = ['known', 'likely', 'anecdotal', 'unknown'] as const;
export type DossierEvidenceClass = (typeof dossierEvidenceClasses)[number];
export type ResearchFailureClassification =
  | 'research_configuration'
  | 'search_timeout'
  | 'search_rate_limit'
  | 'search_unavailable'
  | 'source_extract_failure'
  | 'insufficient_evidence'
  | 'gemini_timeout'
  | 'gemini_rate_limit'
  | 'gemini_unavailable'
  | 'schema_validation'
  | 'persistence_failure'
  | 'unknown';
export type ResearchSource = {
  id: string;
  tier: 1 | 2 | 3;
  sourceKind: string;
  title: string;
  organization: string | null;
  domain: string;
  url: string;
  publishedAt: string | null;
  collectedAt: string;
  evidenceScopes: string[];
  normalizedExcerpt: string;
  evidenceClassification: DossierEvidenceClass;
};
export type ResearchDossier = {
  id: string;
  profileId: string;
  jobId: string;
  schemaVersion: string;
  status: 'pending' | 'completed' | 'failed';
  researchFingerprint: string;
  structuredResult: OpportunityDossier | null;
  researchedAt: string | null;
  expiresAt: string | null;
  errorClassification: ResearchFailureClassification | null;
  sources: ResearchSource[];
};
export type EvidenceReference = { sourceId: string; classification: DossierEvidenceClass };
export type PreparationTopic = { topic: string; why: string; evidence: EvidenceReference[] };
export type OpportunityDossier = {
  opportunitySummary: string;
  company: {
    overview: string;
    categories: {
      label: string;
      confidence: DossierEvidenceClass;
      evidence: EvidenceReference[];
    }[];
    businessModel: string;
    stage: string;
    publicPrivateStatus: string;
    size: string;
    markets: string[];
    engineeringContext: string;
  };
  companyMoment: {
    knownFacts: string[];
    recentDevelopments: string[];
    inferences: string[];
    unknowns: string[];
  };
  compensation: {
    observations: string[];
    estimatedRange: string | null;
    currencyUnit: string | null;
    components: string[];
    confidence: 'low' | 'medium' | 'high';
    conflicts: string[];
    unknowns: string[];
  };
  hiringProcess: {
    officialKnownStages: string[];
    anecdotalReportedStages: string[];
    likelyExpectations: string[];
    confidence: 'low' | 'medium' | 'high';
  };
  preparation: {
    mustReview: PreparationTopic[];
    shouldReview: PreparationTopic[];
    optional: PreparationTopic[];
    behavioral: PreparationTopic[];
    companyKnowledge: PreparationTopic[];
  };
  candidateFit: {
    alreadyStrong: string[];
    refresh: string[];
    realGaps: string[];
    unknowns: string[];
  };
  careerImpact: Record<
    | 'technicalGrowth'
    | 'leadershipExposure'
    | 'aiExposure'
    | 'productExposure'
    | 'internationalExposure'
    | 'compensationUpside'
    | 'roleScopeRisk',
    { level: 'strong' | 'moderate' | 'limited' | 'unknown'; explanation: string }
  >;
  applicationPositioning: {
    emphasize: string[];
    storiesToPrepare: string[];
    evidenceToQuantify: string[];
  };
  questionsToInvestigate: string[];
  citations: EvidenceReference[];
  researchTimestamp: string;
};
