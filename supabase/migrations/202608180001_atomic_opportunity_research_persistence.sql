-- A completed dossier is reusable only after its validated sources commit with it.
create or replace function public.persist_completed_opportunity_research_dossier(
  p_profile_id uuid,
  p_job_id uuid,
  p_schema_version text,
  p_research_fingerprint text,
  p_structured_result jsonb,
  p_synthesis_model text,
  p_researched_at timestamptz,
  p_expires_at timestamptz,
  p_sources jsonb
)
returns public.opportunity_research_dossiers
language plpgsql
set search_path = public
as $$
declare
  v_dossier public.opportunity_research_dossiers;
begin
  if jsonb_typeof(p_sources) <> 'array' or jsonb_array_length(p_sources) = 0 then
    raise exception 'Opportunity research requires at least one source';
  end if;

  insert into public.opportunity_research_dossiers (
    profile_id, job_id, schema_version, status, research_fingerprint,
    structured_result, research_provider, synthesis_provider, synthesis_model,
    researched_at, expires_at, error_classification
  ) values (
    p_profile_id, p_job_id, p_schema_version, 'pending', p_research_fingerprint,
    null, 'tavily', 'gemini', p_synthesis_model, null, p_expires_at, null
  ) returning * into v_dossier;

  insert into public.opportunity_research_sources (
    id, dossier_id, tier, source_kind, title, organization, domain, url,
    published_at, evidence_scopes, normalized_excerpt, evidence_classification
  )
  select
    source.id, v_dossier.id, source.tier, source.source_kind, source.title,
    source.organization, source.domain, source.url, source.published_at,
    source.evidence_scopes, source.normalized_excerpt, source.evidence_classification
  from jsonb_to_recordset(p_sources) as source(
    id uuid, tier smallint, source_kind text, title text, organization text,
    domain text, url text, published_at timestamptz, evidence_scopes text[],
    normalized_excerpt text, evidence_classification text
  );

  update public.opportunity_research_dossiers
  set status = 'completed', structured_result = p_structured_result,
      researched_at = p_researched_at, updated_at = now()
  where id = v_dossier.id
  returning * into v_dossier;

  return v_dossier;
end;
$$;
