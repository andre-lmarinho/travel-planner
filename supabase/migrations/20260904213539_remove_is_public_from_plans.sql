begin;

-- Read/edit/create is authenticated-membership only. Anonymous access is removed:
-- Public sharing and the legacy visibility column are no longer supported.

-- Drop the anon SELECT policies. The matching "Member ... are readable" policies
-- (to authenticated + is_plan_member) already cover all legitimate reads.
drop policy if exists "Public plans are readable" on public.plans;
drop policy if exists "Public snapshots are readable" on public.plan_snapshots;
drop policy if exists "Public events are readable" on public.plan_events;
drop policy if exists "Public budget entries are readable" on public.budget_entries;
drop policy if exists "Public plan owner profiles are readable" on public.profiles;

-- Redundant once anon has no grants at all.
drop policy if exists "Plan members are hidden from anonymous users" on public.plan_members;

-- Revoke every anon table grant. Nothing in public is reachable by anon anymore.
revoke select on table public.plans from anon;
revoke select on table public.plan_snapshots from anon;
revoke select on table public.plan_events from anon;
revoke select on table public.budget_entries from anon;
revoke select on table public.plan_members from anon;
revoke select on table public.profiles from anon;
revoke usage on type public.plan_member_tier from anon;

-- Rebuild the demo reset function without the removed column before dropping it.
create or replace function public.maybe_reset_demo()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  demo_uid uuid;
  last_reset_at timestamptz;
  b record;
begin
  select id into demo_uid from auth.users where email = 'demo@turistar.me';
  if demo_uid is null then return false; end if;

  select r.last_reset_at into last_reset_at from public.demo_reset_state r where r.id = true;
  if last_reset_at is not null and last_reset_at > now() - interval '1 hour' then return false; end if;

  delete from public.plans p where p.user_id = demo_uid and p.id not in (select plan_id from public.demo_baseline);
  delete from public.plan_events e where e.plan_id in (select plan_id from public.demo_baseline);

  for b in select * from public.demo_baseline loop
    update public.plans
       set title = nullif(b.plan->>'title', ''),
           start_date = coalesce((b.plan->>'start_date')::date, start_date),
           end_date = coalesce((b.plan->>'end_date')::date, end_date),
           budget = (b.plan->>'budget')::numeric,
           cover_image = nullif(b.plan->>'cover_image', '')
     where id = b.plan_id;

    update public.plan_snapshots
       set version = (b.snapshot->>'version')::bigint,
           state = coalesce(b.snapshot->'state', state),
           updated_at = now()
     where plan_id = b.plan_id;

    delete from public.budget_entries where plan_id = b.plan_id;
    insert into public.budget_entries (id, plan_id, description, category, amount)
    select (x->>'id')::uuid, b.plan_id, x->>'description', x->>'category', (x->>'amount')::numeric
      from jsonb_array_elements(b.budget) x;
  end loop;

  update public.profiles set display_name = 'Demo User', slug = 'demouser' where id = demo_uid;
  update public.demo_reset_state set last_reset_at = now() where id = true;
  return true;
end;
$$;

revoke all on function public.maybe_reset_demo() from anon, authenticated;
grant execute on function public.maybe_reset_demo() to authenticated;
-- Remove the obsolete visibility guard before dropping its column.
drop trigger if exists plans_visibility_admin_only on public.plans;
drop function if exists public.enforce_plan_visibility_admin();
alter table public.plans drop column if exists is_public;
-- Re-grant plans SELECT to authenticated without visibility controls.
revoke select on table public.plans from authenticated;
grant select (id, user_id, title, start_date, end_date, created_at, budget, public_slug, cover_image, destination_name, destination_country, latitude, longitude)
  on table public.plans to authenticated;


commit;
