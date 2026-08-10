alter table public.jobs
  add column is_active boolean not null default true,
  add column missing_successful_runs integer not null default 0 check (missing_successful_runs >= 0),
  add column closed_at timestamptz;

create table public.collection_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null check (trigger in ('manual', 'scheduled')),
  status text not null check (status in ('running', 'success', 'partial', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  companies_attempted integer not null default 0,
  companies_succeeded integer not null default 0,
  companies_failed integer not null default 0,
  discovered_count integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  unchanged_count integer not null default 0,
  malformed_count integer not null default 0,
  skipped_count integer not null default 0,
  company_results jsonb not null default '[]'::jsonb
);

create unique index collection_runs_one_running on public.collection_runs ((status)) where status = 'running';
create index collection_runs_started_at_idx on public.collection_runs (started_at desc);
