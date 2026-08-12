import 'server-only';

import { randomUUID } from 'node:crypto';

export type OpportunityResearchStage =
  | 'input'
  | 'auth'
  | 'authorization'
  | 'data_load'
  | 'cache'
  | 'company_load'
  | 'tavily_config'
  | 'tavily_search'
  | 'source_selection'
  | 'tavily_extract'
  | 'sanitization'
  | 'matching'
  | 'gemini_config'
  | 'gemini'
  | 'gemini_parse'
  | 'dossier_validation'
  | 'citation_validation'
  | 'dossier_persistence'
  | 'source_persistence';

export type OpportunityResearchFailureClassification =
  | 'invalid_input'
  | 'authentication'
  | 'authorization'
  | 'profile_not_found'
  | 'job_not_found'
  | 'data_access'
  | 'cache_read'
  | 'company_load'
  | 'tavily_configuration'
  | 'tavily_timeout'
  | 'tavily_http'
  | 'tavily_network'
  | 'source_selection'
  | 'tavily_extract'
  | 'gemini_configuration'
  | 'gemini_timeout'
  | 'gemini_http'
  | 'gemini_network'
  | 'gemini_parse'
  | 'dossier_validation'
  | 'citation_validation'
  | 'dossier_persistence'
  | 'source_persistence'
  | 'unexpected';

export function createOpportunityResearchExecutionId() {
  return randomUUID();
}

export function logOpportunityResearch(input: {
  execution: string;
  stage: OpportunityResearchStage | 'pipeline';
  outcome: 'start' | 'success' | 'failed';
  classification?: OpportunityResearchFailureClassification;
  durationMs?: number;
  count?: number;
  cache?: 'hit' | 'miss';
  httpStatus?: number;
}) {
  const entry = {
    event: 'opportunity_research',
    execution: input.execution,
    stage: input.stage,
    outcome: input.outcome,
    ...(input.classification ? { classification: input.classification } : {}),
    ...(input.durationMs !== undefined ? { duration_ms: input.durationMs } : {}),
    ...(input.count !== undefined ? { count: input.count } : {}),
    ...(input.cache ? { cache: input.cache } : {}),
    ...(input.httpStatus !== undefined ? { http_status: input.httpStatus } : {}),
  };
  (input.outcome === 'failed' ? console.error : console.info)(JSON.stringify(entry));
}
