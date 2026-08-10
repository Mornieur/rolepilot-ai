-- Staged ownership foundation. Existing candidate profiles intentionally remain unassigned.
create table public.app_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger app_users_set_updated_at before update on public.app_users
for each row execute function public.set_updated_at();

alter table public.candidate_profiles add column user_id uuid references auth.users(id) on delete restrict;
create index candidate_profiles_user_id_idx on public.candidate_profiles (user_id, created_at);
create index job_user_statuses_profile_id_idx on public.job_user_statuses (profile_id);
create index job_notification_events_profile_id_idx on public.job_notification_events (profile_id, created_at desc);

-- Kept SECURITY DEFINER so policy evaluation does not recurse through app_users RLS.
create or replace function public.is_app_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.app_users where user_id = auth.uid() and role = 'admin') $$;

alter table public.app_users enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.target_companies enable row level security;
alter table public.jobs enable row level security;
alter table public.job_user_statuses enable row level security;
alter table public.job_ai_analyses enable row level security;
alter table public.collection_runs enable row level security;
alter table public.job_notification_events enable row level security;

create policy app_users_select_self on public.app_users for select to authenticated using (user_id = auth.uid() or public.is_app_admin());
create policy candidate_profiles_select_owned on public.candidate_profiles for select to authenticated using (user_id = auth.uid() or public.is_app_admin());
create policy candidate_profiles_insert_owned on public.candidate_profiles for insert to authenticated with check (user_id = auth.uid() or public.is_app_admin());
create policy candidate_profiles_update_owned on public.candidate_profiles for update to authenticated using (user_id = auth.uid() or public.is_app_admin()) with check (user_id = auth.uid() or public.is_app_admin());
create policy candidate_profiles_delete_owned on public.candidate_profiles for delete to authenticated using (user_id = auth.uid() or public.is_app_admin());

create policy target_companies_select_authenticated on public.target_companies for select to authenticated using (true);
create policy jobs_select_authenticated on public.jobs for select to authenticated using (true);
create policy collection_runs_select_authenticated on public.collection_runs for select to authenticated using (true);

create policy job_user_statuses_owned on public.job_user_statuses for all to authenticated
using (public.is_app_admin() or exists (select 1 from public.candidate_profiles p where p.id = profile_id and p.user_id = auth.uid()))
with check (public.is_app_admin() or exists (select 1 from public.candidate_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy job_ai_analyses_owned on public.job_ai_analyses for select to authenticated
using (public.is_app_admin() or exists (select 1 from public.candidate_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy job_notification_events_owned on public.job_notification_events for select to authenticated
using (public.is_app_admin() or exists (select 1 from public.candidate_profiles p where p.id = profile_id and p.user_id = auth.uid()));
