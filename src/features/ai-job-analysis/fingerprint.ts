import 'server-only';

import { createHash } from 'node:crypto';
import type { CandidateProfile, PersistedJob } from '@/types/domain';
import type { DeterministicJobEvaluation } from '@/features/job-evaluation/types';
import { shapeAiJobRequest } from '@/features/ai-job-analysis/request-shaping';

export function getAiAnalysisInputFingerprint(
  profile: CandidateProfile,
  job: PersistedJob,
  evaluation: DeterministicJobEvaluation,
) {
  return createHash('sha256')
    .update(JSON.stringify(shapeAiJobRequest(profile, job, evaluation)))
    .digest('hex');
}
