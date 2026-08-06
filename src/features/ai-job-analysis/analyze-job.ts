import "server-only";
import OpenAI from "openai";
import { evaluateJob } from "@/features/job-evaluation/evaluate";
import { getPersistedJobById } from "@/features/jobs/server/persisted-jobs";
import { getCandidateProfileById } from "@/features/profiles/server/candidate-profiles";
import { aiError, AiJobAnalysisError } from "@/features/ai-job-analysis/errors";
import { AI_JOB_ANALYSIS_INSTRUCTIONS } from "@/features/ai-job-analysis/prompt";
import { shapeAiJobRequest } from "@/features/ai-job-analysis/request-shaping";
import { aiJobAnalysisJsonSchema, aiJobAnalysisSchema } from "@/features/ai-job-analysis/schema";
import type { AiJobAnalysis } from "@/features/ai-job-analysis/types";

const DEFAULT_MODEL = "gpt-5.6-luna";
export async function analyzeEligibleJob(profileId: string, jobId: string): Promise<AiJobAnalysis> {
  if (!process.env.OPENAI_API_KEY) throw aiError.configuration();
  const [profile, job] = await Promise.all([getCandidateProfileById(profileId), getPersistedJobById(jobId)]);
  if (!profile) throw aiError.profile(); if (!job) throw aiError.job();
  const evaluation = evaluateJob(profile, job); if (!evaluation.eligible) throw aiError.ineligible();
  try {
    const response = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 20_000 }).responses.create({ model: process.env.OPENAI_MODEL || DEFAULT_MODEL, store: false, max_output_tokens: 700, instructions: AI_JOB_ANALYSIS_INSTRUCTIONS, input: JSON.stringify(shapeAiJobRequest(profile, job, evaluation)), text: { format: { type: "json_schema", name: "job_analysis", strict: true, schema: aiJobAnalysisJsonSchema } } });
    if (response.status === "incomplete") throw aiError.invalid();
    if (!response.output_text) throw aiError.refused();
    const parsed = aiJobAnalysisSchema.safeParse(JSON.parse(response.output_text));
    if (!parsed.success || parsed.data.deterministicAssessment.score !== evaluation.score) throw aiError.invalid();
    return parsed.data;
  } catch (error) {
    if (error instanceof AiJobAnalysisError) throw error;
    if (error instanceof OpenAI.RateLimitError) throw aiError.rateLimit();
    if (error instanceof OpenAI.APIConnectionTimeoutError) throw aiError.timeout();
    throw aiError.unavailable();
  }
}
