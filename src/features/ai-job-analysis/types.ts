export type AiJobAnalysis = {
  recommendation: 'strong_apply' | 'apply' | 'consider' | 'skip';
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  strengths: { title: string; evidence: string }[];
  gaps: { title: string; severity: 'low' | 'medium' | 'high'; explanation: string }[];
  risks: string[];
  interviewFocus: string[];
  deterministicAssessment: { score: number; eligible: true };
};

export type PersistedAiJobAnalysis = {
  id: string;
  profileId: string;
  jobId: string;
  provider: 'gemini';
  model: string;
  schemaVersion: string;
  analysis: AiJobAnalysis;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  inputFingerprint: string | null;
  createdAt: string;
};

export type GeneratedAiJobAnalysis = Omit<PersistedAiJobAnalysis, 'id' | 'createdAt'>;
