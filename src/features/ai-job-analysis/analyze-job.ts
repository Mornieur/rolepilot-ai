import 'server-only';
import { GoogleGenAI } from '@google/genai';
import { evaluateJob } from '@/features/job-evaluation/evaluate';
import { getPersistedJobById } from '@/features/jobs/server/persisted-jobs';
import { getCandidateProfileById } from '@/features/profiles/server/candidate-profiles';
import { aiError, AiJobAnalysisError } from '@/features/ai-job-analysis/errors';
import { AI_JOB_ANALYSIS_INSTRUCTIONS } from '@/features/ai-job-analysis/prompt';
import { shapeAiJobRequest } from '@/features/ai-job-analysis/request-shaping';
import {
  aiJobAnalysisJsonSchema,
  aiJobAnalysisSchema,
  classifyAiAnalysisValidationFailure,
} from '@/features/ai-job-analysis/schema';
import { AI_JOB_ANALYSIS_SCHEMA_VERSION } from '@/features/ai-job-analysis/schema';
import { getAiAnalysisInputFingerprint } from '@/features/ai-job-analysis/fingerprint';
import type { AiJobAnalysis, GeneratedAiJobAnalysis } from '@/features/ai-job-analysis/types';

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
export async function analyzeEligibleJob(profileId: string, jobId: string): Promise<AiJobAnalysis> {
  return (await generateEligibleJobAnalysis(profileId, jobId)).analysis;
}

export async function generateEligibleJobAnalysis(
  profileId: string,
  jobId: string,
): Promise<GeneratedAiJobAnalysis> {
  if (!process.env.GEMINI_API_KEY) throw aiError.configuration();
  const [profile, job] = await Promise.all([
    getCandidateProfileById(profileId),
    getPersistedJobById(jobId),
  ]);
  if (!profile) throw aiError.profile();
  if (!job) throw aiError.job();
  const evaluation = evaluateJob(profile, job);
  if (!evaluation.eligible) throw aiError.ineligible();
  const input = shapeAiJobRequest(profile, job, evaluation);
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const startedAt = Date.now();
  try {
    const response = await new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    }).models.generateContent({
      model,
      contents: JSON.stringify(input),
      config: {
        systemInstruction: AI_JOB_ANALYSIS_INSTRUCTIONS,
        responseMimeType: 'application/json',
        responseJsonSchema: aiJobAnalysisJsonSchema,
        maxOutputTokens: 700,
        abortSignal: AbortSignal.timeout(20_000),
      },
    });
    if (!response.text) throw aiError.refused();
    let output: unknown;
    try {
      output = JSON.parse(response.text);
    } catch {
      throw aiError.invalid();
    }
    const parsed = aiJobAnalysisSchema.safeParse(output);
    if (!parsed.success) {
      classifyAiAnalysisValidationFailure(parsed.error, output);
      throw aiError.invalid();
    }
    if (parsed.data.deterministicAssessment.score !== evaluation.score) throw aiError.invalid();
    const usage = response.usageMetadata;
    return {
      profileId,
      jobId,
      provider: 'gemini',
      model,
      schemaVersion: AI_JOB_ANALYSIS_SCHEMA_VERSION,
      analysis: parsed.data,
      latencyMs: Date.now() - startedAt,
      inputTokens: usage?.promptTokenCount ?? null,
      outputTokens: usage?.candidatesTokenCount ?? null,
      totalTokens: usage?.totalTokenCount ?? null,
      inputFingerprint: getAiAnalysisInputFingerprint(profile, job, evaluation),
    };
  } catch (error) {
    if (error instanceof AiJobAnalysisError) throw error;
    if (error instanceof DOMException && error.name === 'TimeoutError') throw aiError.timeout();
    if (
      typeof error === 'object' &&
      error &&
      'status' in error &&
      (error as { status?: number }).status === 429
    )
      throw aiError.rateLimit();
    if (
      typeof error === 'object' &&
      error &&
      'message' in error &&
      /blocked|safety/i.test(String((error as { message?: unknown }).message))
    )
      throw aiError.refused();
    throw aiError.unavailable();
  }
}
