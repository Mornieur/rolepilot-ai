import 'server-only';

import { randomUUID } from 'node:crypto';

export type OpportunityResearchStage =
  | 'action'
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
  | 'gemini_company'
  | 'gemini_candidate'
  | 'gemini_company_parse'
  | 'gemini_candidate_parse'
  | 'dossier_merge'
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
  model?: string;
  httpStatus?: number;
  providerCode?: number;
  providerStatus?: string;
  providerReason?: string;
  providerDetailTypes?: string[];
  providerFieldViolations?: string[];
  providerSchemaVersion?: string;
  providerDtoVersion?: string;
  schemaBytes?: number;
  schemaDepth?: number;
  attempt?: number;
  issues?: { path: string; code: string; expected?: string; actual: string }[];
  normalizationCounts?: Partial<Record<'companyCategoryLabel' | 'preparationTopic', number>>;
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
    ...(input.model ? { model: input.model } : {}),
    ...(input.httpStatus !== undefined ? { http_status: input.httpStatus } : {}),
    ...(input.providerCode !== undefined ? { provider_code: input.providerCode } : {}),
    ...(input.providerStatus ? { provider_status: input.providerStatus } : {}),
    ...(input.providerReason ? { provider_reason: input.providerReason } : {}),
    ...(input.providerDetailTypes?.length
      ? { provider_detail_types: input.providerDetailTypes }
      : {}),
    ...(input.providerFieldViolations?.length
      ? { provider_field_violations: input.providerFieldViolations }
      : {}),
    ...(input.providerSchemaVersion
      ? { provider_schema_version: input.providerSchemaVersion }
      : {}),
    ...(input.providerDtoVersion ? { provider_dto_version: input.providerDtoVersion } : {}),
    ...(input.schemaBytes !== undefined ? { schema_bytes: input.schemaBytes } : {}),
    ...(input.schemaDepth !== undefined ? { schema_depth: input.schemaDepth } : {}),
    ...(input.attempt !== undefined ? { attempt: input.attempt } : {}),
    ...(input.issues ? { issues: input.issues } : {}),
    ...(input.normalizationCounts && Object.keys(input.normalizationCounts).length
      ? { normalization_counts: input.normalizationCounts }
      : {}),
  };
  (input.outcome === 'failed' ? console.error : console.info)(JSON.stringify(entry));
}
