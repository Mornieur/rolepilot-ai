import 'server-only';
import {
  hasOnlyKnownDossierCitations,
  opportunityDossierSchema,
} from '@/features/opportunity-intelligence/schema';
import { z } from 'zod';
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
  const parsed = researchSourceRowSchema.safeParse(row);
  if (!parsed.success) throw new OpportunityResearchDataError('cache_read');
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

const researchSourceRowSchema = z.object({
  id: z.string().uuid(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  source_kind: z.string().trim().min(1),
  title: z.string().trim().min(1),
  organization: z.string().nullable(),
  domain: z.string().trim().min(1),
  url: z.string().url(),
  published_at: z.string().nullable(),
  collected_at: z.string(),
  evidence_scopes: z.array(z.string()).nullable(),
  normalized_excerpt: z.string().max(6000),
  evidence_classification: z.enum(['known', 'likely', 'anecdotal', 'unknown']),
});
function dossier(
  row: OpportunityResearchDossierRow,
  sources: ResearchSource[],
): ResearchDossier | null {
  const parsed = row.structured_result
    ? opportunityDossierSchema.safeParse(row.structured_result)
    : null;
  if (
    row.status === 'completed' &&
    (!parsed ||
      !parsed.success ||
      sources.length === 0 ||
      !hasOnlyKnownDossierCitations(parsed.data, new Set(sources.map((item) => item.id))))
  )
    return null;
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
  try {
    return dossier(data, (sourceRows ?? []).map(source));
  } catch (error) {
    if (error instanceof OpportunityResearchDataError) return null;
    throw error;
  }
}
export async function persistCompletedDossier(
  input: Omit<ResearchDossier, 'id' | 'status' | 'sources' | 'researchedAt' | 'expiresAt'> & {
    sources: Omit<ResearchSource, 'collectedAt'>[];
    synthesisModel: string;
    researchedAt: string;
    expiresAt: string;
  },
) {
  const client = getSupabaseServerClient();
  const { data, error } = await client.rpc('persist_completed_opportunity_research_dossier', {
    p_profile_id: input.profileId,
    p_job_id: input.jobId,
    p_schema_version: input.schemaVersion,
    p_research_fingerprint: input.researchFingerprint,
    p_structured_result: input.structuredResult,
    p_synthesis_model: input.synthesisModel,
    p_researched_at: input.researchedAt,
    p_expires_at: input.expiresAt,
    p_sources: input.sources.map((item) => ({
      id: item.id,
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
  });
  if (error || !data) throw new OpportunityResearchDataError('dossier_persistence');
  const sources = input.sources.map((item) => ({ ...item, collectedAt: input.researchedAt }));
  const persisted = dossier(data, sources);
  if (!persisted) throw new OpportunityResearchDataError('dossier_persistence');
  return persisted;
}
