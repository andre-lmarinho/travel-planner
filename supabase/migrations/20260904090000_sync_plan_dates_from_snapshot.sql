-- Keep the denormalized plan dates in sync with the collaboration snapshot.
create or replace function public.sync_plan_dates_from_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_days jsonb := new.state->'days';
begin
  if jsonb_typeof(v_days) = 'array' and jsonb_array_length(v_days) > 0 then
    update public.plans
    set start_date = (v_days->0->>'id')::date,
        end_date = (v_days -> (jsonb_array_length(v_days) - 1) ->> 'id')::date
    where id = new.plan_id;
  end if;

  return new;
end;
$$;

drop trigger if exists plan_snapshots_sync_plan_dates on public.plan_snapshots;

create trigger plan_snapshots_sync_plan_dates
after update of version, state on public.plan_snapshots
for each row
when (old.version is distinct from new.version or old.state is distinct from new.state)
execute function public.sync_plan_dates_from_snapshot();
