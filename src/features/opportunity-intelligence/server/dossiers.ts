import 'server-only';
import { opportunityDossierSchema } from '@/features/opportunity-intelligence/schema';
import type { ResearchDossier, ResearchSource } from '@/features/opportunity-intelligence/types';
import { getSupabaseServerClient } from '@/features/profiles/server/supabase';
import type {
  OpportunityResearchDossierRow,
  OpportunityResearchSourceRow,
} from '@/features/profiles/types/database';
export class OpportunityResearchDataError extends Error {
  constructor(
    public operation: 'cache_read' | 'dossier_persistence' | 'source_persistence' = 'cache_read',
  ) {
    super('A inteligência da oportunidade está indisponível agora.');
  }
}
function source(row: OpportunityResearchSourceRow): ResearchSource {
  return {
    id: row.id,
    tier: row.tier as 1 | 2 | 3,
    sourceKind: row.source_kind,
    title: row.title,
    organization: row.organization,
    domain: row.domain,
    url: row.url,
    publishedAt: row.published_at,
    collectedAt: row.collected_at,
    evidenceScopes: row.evidence_scopes ?? [],
    normalizedExcerpt: row.normalized_excerpt,
    evidenceClassification: row.evidence_classification as ResearchSource['evidenceClassification'],
  };
}
function dossier(row: OpportunityResearchDossierRow, sources: ResearchSource[]): ResearchDossier {
  const parsed = row.structured_result
    ? opportunityDossierSchema.safeParse(row.structured_result)
    : null;
  if (row.status === 'completed' && (!parsed || !parsed.success))
    throw new OpportunityResearchDataError('cache_read');
  return {
    id: row.id,
    profileId: row.profile_id,
    jobId: row.job_id,
    schemaVersion: row.schema_version,
    status: row.status,
    researchFingerprint: row.research_fingerprint,
    structuredResult: parsed?.success ? parsed.data : null,
    researchedAt: row.researched_at,
    expiresAt: row.expires_at,
    errorClassification: row.error_classification as ResearchDossier['errorClassification'],
    sources,
  };
}
export async function getLatestResearchDossier(profileId: string, jobId: string) {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('opportunity_research_dossiers')
    .select('*')
    .eq('profile_id', profileId)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new OpportunityResearchDataError('cache_read');
  if (!data) return null;
  const { data: sourceRows, error: sourceError } = await client
    .from('opportunity_research_sources')
    .select('*')
    .eq('dossier_id', data.id);
  if (sourceError) throw new OpportunityResearchDataError('cache_read');
  return dossier(data, (sourceRows ?? []).map(source));
}
export async function persistCompletedDossier(
  input: Omit<ResearchDossier, 'id' | 'status' | 'sources'> & {
    sources: Omit<ResearchSource, 'collectedAt'>[];
  },
) {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('opportunity_research_dossiers')
    .insert({
      profile_id: input.profileId,
      job_id: input.jobId,
      schema_version: input.schemaVersion,
      status: 'completed',
      research_fingerprint: input.researchFingerprint,
      structured_result: input.structuredResult,
      research_provider: 'tavily',
      synthesis_provider: 'gemini',
      synthesis_model: null,
      researched_at: input.researchedAt,
      expires_at: input.expiresAt,
      error_classification: null,
    })
    .select()
    .single();
  if (error || !data) throw new OpportunityResearchDataError('dossier_persistence');
  const { data: rows, error: sourceError } = await client
    .from('opportunity_research_sources')
    .insert(
      input.sources.map((item) => ({
        id: item.id,
        dossier_id: data.id,
        tier: item.tier,
        source_kind: item.sourceKind,
        title: item.title,
        organization: item.organization,
        domain: item.domain,
        url: item.url,
        published_at: item.publishedAt,
        evidence_scopes: item.evidenceScopes,
        normalized_excerpt: item.normalizedExcerpt,
        evidence_classification: item.evidenceClassification,
      })),
    )
    .select();
  if (sourceError) throw new OpportunityResearchDataError('source_persistence');
  return dossier(data, (rows ?? []).map(source));
}
