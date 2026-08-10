create table public.job_ai_analyses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.candidate_profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  provider text not null check (provider = 'gemini'),
  model text not null check (char_length(trim(model)) > 0),
  schema_version text not null check (char_length(trim(schema_version)) > 0),
  result jsonb not null,
  recommendation text not null check (recommendation in ('strong_apply', 'apply', 'consider', 'skip')),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  total_tokens integer check (total_tokens is null or total_tokens >= 0),
  input_fingerprint text,
  created_at timestamptz not null default now()
);

create index job_ai_analyses_profile_job_created_at_idx
  on public.job_ai_analyses (profile_id, job_id, created_at desc);
