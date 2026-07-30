create table public.target_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  provider text not null check (provider in ('greenhouse', 'lever')),
  board_identifier text not null check (char_length(trim(board_identifier)) > 0),
  careers_url text,
  enabled boolean not null default true,
  priority text not null default 'normal' check (priority in ('normal', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, board_identifier)
);

create trigger target_companies_set_updated_at
before update on public.target_companies
for each row execute function public.set_updated_at();
