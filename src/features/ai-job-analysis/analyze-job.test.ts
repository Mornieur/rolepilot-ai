import { beforeEach, describe, expect, it, vi } from 'vitest';
const generateContent = vi.fn();
vi.mock('server-only', () => ({}));
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));
vi.mock('@/features/profiles/server/candidate-profiles', () => ({
  getCandidateProfileById: vi.fn(),
}));
vi.mock('@/features/jobs/server/persisted-jobs', () => ({ getPersistedJobById: vi.fn() }));
vi.mock('@/features/job-evaluation/evaluate', () => ({ evaluateJob: vi.fn() }));

import { analyzeEligibleJob, generateEligibleJobAnalysis, resolveGeminiModel } from './analyze-job';
import { getCandidateProfileById } from '@/features/profiles/server/candidate-profiles';
import { getPersistedJobById } from '@/features/jobs/server/persisted-jobs';
import { evaluateJob } from '@/features/job-evaluation/evaluate';

const profile = {
  id: 'p',
  desiredRoles: [],
  acceptedSeniorities: [],
  requiredSkills: [],
  preferredSkills: [],
  excludedSkills: [],
  acceptedWorkModels: [],
  locations: [],
};
const job = {
  id: 'j',
  title: 'Role',
  location: null,
  descriptionText: 'text',
  departments: [],
  offices: [],
  language: null,
};
const evaluation = {
  eligible: true,
  score: 80,
  matchedRequiredKeywords: [],
  matchedPreferredKeywords: [],
  reasons: [],
};
const valid = {
  recommendation: 'apply',
  confidence: 'high',
  summary: 'Good fit',
  strengths: [],
  gaps: [],
  risks: [],
  interviewFocus: [],
  deterministicAssessment: { score: 80, eligible: true },
};

describe('Gemini job analysis boundary', () => {
  const previous = process.env;
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  beforeEach(() => {
    process.env = { ...previous, GEMINI_API_KEY: 'test-key' };
    vi.clearAllMocks();
    vi.mocked(getCandidateProfileById).mockResolvedValue(profile as never);
    vi.mocked(getPersistedJobById).mockResolvedValue(job as never);
    vi.mocked(evaluateJob).mockReturnValue(evaluation as never);
    generateContent.mockResolvedValue({ text: JSON.stringify(valid) });
    warn.mockClear();
  });
  it('returns controlled configuration error without a key', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(analyzeEligibleJob('p', 'j')).rejects.toThrow('não está configurada');
    expect(generateContent).not.toHaveBeenCalled();
  });
  it('uses bounded structured Gemini request and default model', async () => {
    await expect(analyzeEligibleJob('p', 'j')).resolves.toEqual(valid);
    expect(generateContent).toHaveBeenCalledOnce();
    expect(generateContent.mock.calls[0][0]).toMatchObject({
      model: 'gemini-2.5-flash-lite',
      config: { responseMimeType: 'application/json', maxOutputTokens: 700 },
    });
  });
  it('uses configured model and maps malformed output safely', async () => {
    process.env.GEMINI_MODEL = 'custom';
    generateContent.mockResolvedValue({ text: '{' });
    await expect(analyzeEligibleJob('p', 'j')).rejects.toThrow('resultado estruturado inválido');
    expect(generateContent.mock.calls[0][0].model).toBe('custom');
  });
  it('resolves an override before the centralized default and returns the actual model metadata', async () => {
    process.env.GEMINI_MODEL = 'gemini-test-model';
    expect(resolveGeminiModel()).toBe('gemini-test-model');
    await expect(generateEligibleJobAnalysis('p', 'j')).resolves.toMatchObject({
      model: 'gemini-test-model',
    });
  });
  it.each([
    ['empty response', undefined],
    ['missing top-level field', { ...valid, confidence: undefined }],
    ['missing nested field', { ...valid, deterministicAssessment: { score: 80 } }],
    ['invalid recommendation', { ...valid, recommendation: 'maybe' }],
    ['invalid confidence', { ...valid, confidence: 'certain' }],
    ['wrong scalar type', { ...valid, summary: 12 }],
    ['unexpected null', { ...valid, summary: null }],
    ['too-short string', { ...valid, summary: '' }],
    ['too-long string', { ...valid, summary: 'x'.repeat(601) }],
    ['score mismatch', { ...valid, deterministicAssessment: { score: 79, eligible: true } }],
  ])('rejects %s without retrying or persisting', async (_name, payload) => {
    generateContent.mockResolvedValue({
      text: payload === undefined ? undefined : JSON.stringify(payload),
    });
    await expect(analyzeEligibleJob('p', 'j')).rejects.toThrow();
    expect(generateContent).toHaveBeenCalledOnce();
  });
  it('logs only safe contract metadata for a structured validation rejection', async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify({ ...valid, gaps: [{ title: 'Gap', explanation: 'Missing severity' }] }),
    });
    await expect(analyzeEligibleJob('p', 'j')).rejects.toThrow();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('classification=missing_field path=gaps.0.severity'),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('schema=1 model='));
    expect(warn.mock.calls.flat().join(' ')).not.toContain('Missing severity');
  });
  it('classifies max-token malformed output as incomplete without logging the raw response', async () => {
    generateContent.mockResolvedValue({ text: '{', candidates: [{ finishReason: 'MAX_TOKENS' }] });
    await expect(analyzeEligibleJob('p', 'j')).rejects.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('classification=incomplete_output'));
    expect(warn.mock.calls.flat().join(' ')).not.toContain('{');
  });
  it('does not call Gemini for an ineligible job', async () => {
    vi.mocked(evaluateJob).mockReturnValue({ ...evaluation, eligible: false } as never);
    await expect(analyzeEligibleJob('p', 'j')).rejects.toThrow('apenas para vagas elegíveis');
    expect(generateContent).not.toHaveBeenCalled();
  });
});
