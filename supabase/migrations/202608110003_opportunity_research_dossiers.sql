-- Opportunity intelligence is profile-scoped derived data. Source metadata is kept
-- separately so every externally grounded claim can be inspected without storing HTML.
create table public.opportunity_research_dossiers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.candidate_profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  schema_version text not null check (char_length(trim(schema_version)) > 0),
  status text not null check (status in ('pending', 'completed', 'failed')),
  research_fingerprint text not null check (char_length(trim(research_fingerprint)) > 0),
  structured_result jsonb,
  research_provider text not null default 'tavily' check (research_provider = 'tavily'),
  synthesis_provider text check (synthesis_provider is null or synthesis_provider = 'gemini'),
  synthesis_model text,
  researched_at timestamptz,
  expires_at timestamptz,
  error_classification text check (error_classification is null or error_classification in (
    'research_configuration', 'search_timeout', 'search_rate_limit', 'search_unavailable',
    'source_extract_failure', 'insufficient_evidence', 'gemini_timeout', 'gemini_rate_limit',
    'gemini_unavailable', 'schema_validation', 'persistence_failure', 'unknown'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'completed') = (structured_result is not null)),
  check ((status = 'completed') = (researched_at is not null))
);
create trigger opportunity_research_dossiers_set_updated_at before update on public.opportunity_research_dossiers
for each row execute function public.set_updated_at();
create unique index opportunity_research_dossiers_one_pending_fingerprint_idx
  on public.opportunity_research_dossiers(profile_id, job_id, research_fingerprint)
  where status = 'pending';
create index opportunity_research_dossiers_profile_job_researched_idx
  on public.opportunity_research_dossiers(profile_id, job_id, researched_at desc);

create table public.opportunity_research_sources (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.opportunity_research_dossiers(id) on delete cascade,
  tier smallint not null check (tier between 1 and 3),
  source_kind text not null check (source_kind in ('official', 'press', 'compensation', 'career_platform', 'community', 'job_posting', 'other')),
  title text not null check (char_length(trim(title)) > 0),
  organization text,
  domain text not null check (char_length(trim(domain)) > 0),
  url text not null check (char_length(trim(url)) > 0),
  published_at timestamptz,
  collected_at timestamptz not null default now(),
  evidence_scopes text[] not null default '{}',
  normalized_excerpt text not null check (char_length(normalized_excerpt) <= 6000),
  evidence_classification text not null check (evidence_classification in ('known', 'likely', 'anecdotal', 'unknown')),
  unique(dossier_id, url)
);
create index opportunity_research_sources_dossier_idx on public.opportunity_research_sources(dossier_id);
create index opportunity_research_sources_domain_tier_idx on public.opportunity_research_sources(domain, tier);

alter table public.opportunity_research_dossiers enable row level security;
alter table public.opportunity_research_sources enable row level security;
create policy opportunity_research_dossiers_owned on public.opportunity_research_dossiers for select to authenticated
using (public.is_app_admin() or exists (select 1 from public.candidate_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy opportunity_research_sources_owned on public.opportunity_research_sources for select to authenticated
using (public.is_app_admin() or exists (
  select 1 from public.opportunity_research_dossiers d join public.candidate_profiles p on p.id = d.profile_id
  where d.id = dossier_id and p.user_id = auth.uid()
));
