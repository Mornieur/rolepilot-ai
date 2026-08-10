create table public.job_notification_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.candidate_profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  event_type text not null check (event_type in ('new_eligible_job')),
  status text not null default 'pending' check (status in ('pending', 'delivered', 'failed', 'skipped')),
  priority text not null check (priority in ('excellent', 'good', 'review')),
  deterministic_score integer not null check (deterministic_score between 0 and 100),
  channel text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  error_classification text check (error_classification is null or error_classification in ('delivery-unavailable', 'invalid-response', 'unknown')),
  created_at timestamptz not null default now(),
  unique (profile_id, job_id, event_type)
);

create index job_notification_events_pending_idx
  on public.job_notification_events (created_at asc)
  where status = 'pending';

create index job_notification_events_recent_idx
  on public.job_notification_events (created_at desc);
