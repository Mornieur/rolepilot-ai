import { beforeEach, describe, expect, it, vi } from "vitest";
const generateContent = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("@google/genai", () => ({ GoogleGenAI: class { models = { generateContent }; } }));
vi.mock("@/features/profiles/server/candidate-profiles", () => ({ getCandidateProfileById: vi.fn() }));
vi.mock("@/features/jobs/server/persisted-jobs", () => ({ getPersistedJobById: vi.fn() }));
vi.mock("@/features/job-evaluation/evaluate", () => ({ evaluateJob: vi.fn() }));

import { analyzeEligibleJob } from "./analyze-job";
import { getCandidateProfileById } from "@/features/profiles/server/candidate-profiles";
import { getPersistedJobById } from "@/features/jobs/server/persisted-jobs";
import { evaluateJob } from "@/features/job-evaluation/evaluate";

const profile = { id: "p", desiredRoles: [], acceptedSeniorities: [], requiredSkills: [], preferredSkills: [], excludedSkills: [], acceptedWorkModels: [], locations: [] };
const job = { id: "j", title: "Role", location: null, descriptionText: "text", departments: [], offices: [], language: null };
const evaluation = { eligible: true, score: 80, matchedRequiredKeywords: [], matchedPreferredKeywords: [], reasons: [] };
const valid = { recommendation: "apply", confidence: "high", summary: "Good fit", strengths: [], gaps: [], risks: [], interviewFocus: [], deterministicAssessment: { score: 80, eligible: true } };

describe("Gemini job analysis boundary", () => {
  const previous = process.env;
  beforeEach(() => { process.env = { ...previous, GEMINI_API_KEY: "test-key" }; vi.clearAllMocks(); vi.mocked(getCandidateProfileById).mockResolvedValue(profile as never); vi.mocked(getPersistedJobById).mockResolvedValue(job as never); vi.mocked(evaluateJob).mockReturnValue(evaluation as never); generateContent.mockResolvedValue({ text: JSON.stringify(valid) }); });
  it("returns controlled configuration error without a key", async () => { delete process.env.GEMINI_API_KEY; await expect(analyzeEligibleJob("p", "j")).rejects.toThrow("not configured"); expect(generateContent).not.toHaveBeenCalled(); });
  it("uses bounded structured Gemini request and default model", async () => { await expect(analyzeEligibleJob("p", "j")).resolves.toEqual(valid); expect(generateContent).toHaveBeenCalledOnce(); expect(generateContent.mock.calls[0][0]).toMatchObject({ model: "gemini-2.5-flash-lite", config: { responseMimeType: "application/json", maxOutputTokens: 700 } }); });
  it("uses configured model and maps malformed output safely", async () => { process.env.GEMINI_MODEL = "custom"; generateContent.mockResolvedValue({ text: "{" }); await expect(analyzeEligibleJob("p", "j")).rejects.toThrow("invalid structured"); expect(generateContent.mock.calls[0][0].model).toBe("custom"); });
  it("does not call Gemini for an ineligible job", async () => { vi.mocked(evaluateJob).mockReturnValue({ ...evaluation, eligible: false } as never); await expect(analyzeEligibleJob("p", "j")).rejects.toThrow("only for deterministically eligible"); expect(generateContent).not.toHaveBeenCalled(); });
});
