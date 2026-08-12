import { z } from 'zod';
export const OPPORTUNITY_DOSSIER_SCHEMA_VERSION = '1';
const evidence = z.object({
  sourceId: z.string().uuid(),
  classification: z.enum(['known', 'likely', 'anecdotal', 'unknown']),
});
const text = z.string().trim().min(1).max(800);
const topic = z.object({ topic: text.max(120), why: text, evidence: z.array(evidence).max(4) });
const impact = z.object({
  level: z.enum(['strong', 'moderate', 'limited', 'unknown']),
  explanation: text,
});
export const opportunityDossierSchema = z.object({
  opportunitySummary: text,
  company: z.object({
    overview: text,
    categories: z
      .array(
        z.object({
          label: text.max(80),
          confidence: evidence.shape.classification,
          evidence: z.array(evidence).max(4),
        }),
      )
      .max(8),
    businessModel: text,
    stage: text,
    publicPrivateStatus: text,
    size: text,
    markets: z.array(text.max(160)).max(8),
    engineeringContext: text,
  }),
  companyMoment: z.object({
    knownFacts: z.array(text).max(8),
    recentDevelopments: z.array(text).max(8),
    inferences: z.array(text).max(8),
    unknowns: z.array(text).max(8),
  }),
  compensation: z.object({
    observations: z.array(text).max(8),
    estimatedRange: z.string().trim().max(160).nullable(),
    currencyUnit: z.string().trim().max(80).nullable(),
    components: z.array(text.max(120)).max(4),
    confidence: z.enum(['low', 'medium', 'high']),
    conflicts: z.array(text).max(6),
    unknowns: z.array(text).max(6),
  }),
  hiringProcess: z.object({
    officialKnownStages: z.array(text).max(8),
    anecdotalReportedStages: z.array(text).max(8),
    likelyExpectations: z.array(text).max(8),
    confidence: z.enum(['low', 'medium', 'high']),
  }),
  preparation: z.object({
    mustReview: z.array(topic).max(8),
    shouldReview: z.array(topic).max(8),
    optional: z.array(topic).max(8),
    behavioral: z.array(topic).max(8),
    companyKnowledge: z.array(topic).max(8),
  }),
  candidateFit: z.object({
    alreadyStrong: z.array(text).max(8),
    refresh: z.array(text).max(8),
    realGaps: z.array(text).max(8),
    unknowns: z.array(text).max(8),
  }),
  careerImpact: z.object({
    technicalGrowth: impact,
    leadershipExposure: impact,
    aiExposure: impact,
    productExposure: impact,
    internationalExposure: impact,
    compensationUpside: impact,
    roleScopeRisk: impact,
  }),
  applicationPositioning: z.object({
    emphasize: z.array(text).max(8),
    storiesToPrepare: z.array(text).max(8),
    evidenceToQuantify: z.array(text).max(8),
  }),
  questionsToInvestigate: z.array(text).max(10),
  citations: z.array(evidence).max(30),
  researchTimestamp: z.string().datetime(),
});
