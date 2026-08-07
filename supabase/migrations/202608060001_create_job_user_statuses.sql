create table public.job_user_statuses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.candidate_profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null check (status in ('new', 'saved', 'ignored', 'applied', 'rejected')) default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, job_id)
);
create trigger job_user_statuses_set_updated_at before update on public.job_user_statuses for each row execute function public.set_updated_at();
