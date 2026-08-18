import {
  CANDIDATE_INTELLIGENCE_PROVIDER_DTO_VERSION,
  COMPANY_INTELLIGENCE_PROVIDER_DTO_VERSION,
  GEMINI_PROVIDER_DOSSIER_VERSION,
  OPPORTUNITY_DOSSIER_SCHEMA_VERSION,
} from '@/features/opportunity-intelligence/schema';

/**
 * Explicit, semantic cache contract versions. Bump the affected component when
 * changing reusable research output; never store prompt text in the fingerprint.
 */
export const OPPORTUNITY_RESEARCH_CONTRACT_VERSION = '1';
export const OPPORTUNITY_RESEARCH_PROMPT_VERSION = '1';
export const OPPORTUNITY_RESEARCH_OUTPUT_CONTRACT_VERSION = '1';
export const OPPORTUNITY_RESEARCH_RETRIEVAL_STRATEGY_VERSION = '2';
export const OPPORTUNITY_RESEARCH_MATCHING_CONTEXT_VERSION = '1';

export function opportunityResearchContractVersions(model: string) {
  return {
    contract: OPPORTUNITY_RESEARCH_CONTRACT_VERSION,
    dossierSchema: OPPORTUNITY_DOSSIER_SCHEMA_VERSION,
    providerSchema: GEMINI_PROVIDER_DOSSIER_VERSION,
    companyDto: COMPANY_INTELLIGENCE_PROVIDER_DTO_VERSION,
    candidateDto: CANDIDATE_INTELLIGENCE_PROVIDER_DTO_VERSION,
    prompt: OPPORTUNITY_RESEARCH_PROMPT_VERSION,
    output: OPPORTUNITY_RESEARCH_OUTPUT_CONTRACT_VERSION,
    retrieval: OPPORTUNITY_RESEARCH_RETRIEVAL_STRATEGY_VERSION,
    matchingContext: OPPORTUNITY_RESEARCH_MATCHING_CONTEXT_VERSION,
    synthesisModel: model,
  };
}
