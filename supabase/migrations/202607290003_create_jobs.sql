create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('greenhouse')),
  target_company_id uuid not null references public.target_companies(id) on delete cascade,
  external_id text not null,
  title text not null,
  location text,
  description_text text,
  original_url text not null,
  source_updated_at timestamptz,
  language text,
  departments text[] not null default '{}',
  offices text[] not null default '{}',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, target_company_id, external_id)
);

create trigger jobs_set_updated_at before update on public.jobs for each row execute function public.set_updated_at();
