create or replace function public.acquire_collection_run(
  p_trigger text,
  p_stale_before timestamptz
)
returns table (run_id uuid, acquired boolean)
language plpgsql
as $$
declare
  v_run_id uuid;
begin
  update public.collection_runs
  set status = 'failed', finished_at = now()
  where status = 'running' and started_at < p_stale_before;

  begin
    insert into public.collection_runs (trigger, status)
    values (p_trigger, 'running')
    returning id into v_run_id;

    return query select v_run_id, true;
  exception
    when unique_violation then
      return query select null::uuid, false;
  end;
end;
$$;
