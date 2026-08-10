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
  jsonValueCategory,
  valueAtPath,
} from '@/features/ai-job-analysis/schema';
import { AI_JOB_ANALYSIS_SCHEMA_VERSION } from '@/features/ai-job-analysis/schema';
import { getAiAnalysisInputFingerprint } from '@/features/ai-job-analysis/fingerprint';
import type { AiJobAnalysis, GeneratedAiJobAnalysis } from '@/features/ai-job-analysis/types';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

export function resolveGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

function rejectionExpectedCategory(issue: { code: string; expected?: unknown } | undefined) {
  if (!issue) return 'schema';
  if (issue.code === 'invalid_value') return 'enum';
  if (issue.code === 'too_small' || issue.code === 'too_big') return 'string constraint';
  return typeof issue.expected === 'string' ? issue.expected : issue.code;
}

function isMaxTokenResponse(response: unknown) {
  const finishReason = (response as { candidates?: { finishReason?: unknown }[] }).candidates?.[0]
    ?.finishReason;
  return typeof finishReason === 'string' && /max.?tokens|length/i.test(finishReason);
}

function logStructuredRejection(input: {
  classification: string;
  model: string;
  fieldPath?: string;
  expected?: string;
  actual?: string;
}) {
  console.warn(
    [
      'AI structured result rejected:',
      `classification=${input.classification}`,
      `path=${input.fieldPath ?? 'root'}`,
      input.expected ? `expected=${input.expected}` : null,
      input.actual ? `actual=${input.actual}` : null,
      `schema=${AI_JOB_ANALYSIS_SCHEMA_VERSION}`,
      `model=${input.model}`,
    ]
      .filter(Boolean)
      .join(' '),
  );
}
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
  const model = resolveGeminiModel();
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
    if (!response.text) {
      logStructuredRejection({
        classification: isMaxTokenResponse(response) ? 'incomplete_output' : 'invalid_json',
        model,
      });
      throw aiError.refused();
    }
    let output: unknown;
    try {
      output = JSON.parse(response.text);
    } catch {
      logStructuredRejection({
        classification: isMaxTokenResponse(response) ? 'incomplete_output' : 'invalid_json',
        model,
      });
      throw aiError.invalid();
    }
    const parsed = aiJobAnalysisSchema.safeParse(output);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const rejection = classifyAiAnalysisValidationFailure(parsed.error, output);
      logStructuredRejection({
        classification: rejection.classification,
        fieldPath: rejection.fieldPath,
        expected: rejectionExpectedCategory(issue),
        actual: jsonValueCategory(valueAtPath(output, issue?.path ?? [])),
        model,
      });
      throw aiError.invalid();
    }
    if (parsed.data.deterministicAssessment.score !== evaluation.score) {
      logStructuredRejection({
        classification: 'deterministic_score_mismatch',
        fieldPath: 'deterministicAssessment.score',
        expected: 'integer matching deterministic score',
        actual: 'number',
        model,
      });
      throw aiError.invalid();
    }
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
