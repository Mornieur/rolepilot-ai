export type AiJobAnalysis = {
  recommendation: "strong_apply" | "apply" | "consider" | "skip";
  confidence: "low" | "medium" | "high";
  summary: string;
  strengths: { title: string; evidence: string }[];
  gaps: { title: string; severity: "low" | "medium" | "high"; explanation: string }[];
  risks: string[];
  interviewFocus: string[];
  deterministicAssessment: { score: number; eligible: true };
};
