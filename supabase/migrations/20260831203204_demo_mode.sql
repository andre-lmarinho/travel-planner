-- Demo mode infrastructure. Visitors enter through a "demo" button that signs 
-- into the shared account; everything they do (edit/create/delete) lives 
-- in that account and is wiped back to the baseline once per hour.
--
-- IMPORTANT: this migration is intentionally FREE of data/mock. It only defines the
-- schema so a full rebuild (db reset / fresh env) never fails for lack of rows.
-- The curated baseline itself is composed by the NON-versioned seed script
-- (supabase/seed.sql), which runs after migrations on `db reset` and transfers the
-- two demo plans + snapshots their state. See that file for the data.

-- Baseline store + reset bookkeeping. RLS stays OFF on both: nothing must be
-- client-readable, and the security-definer restore below touches them as owner.
create table if not exists public.demo_baseline (
  plan_id  uuid primary key,
  plan     jsonb not null,
  snapshot jsonb not null,
  budget   jsonb not null default '[]'::jsonb
);

create table if not exists public.demo_reset_state (
  id            boolean primary key default true,
  last_reset_at timestamptz not null,
  constraint demo_reset_state_single_row check (id)
);

insert into public.demo_reset_state (id, last_reset_at)
values (true, now())
on conflict (id) do nothing;

-- Restore: wipe demo-created plans + events, then replay the baseline.
-- Exactly once per hour (self-guarded) so any visitor change disappears.
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
  if demo_uid is null then
    return false;
  end if;

  select r.last_reset_at into last_reset_at from public.demo_reset_state r where r.id = true;
  if last_reset_at is not null and last_reset_at > now() - interval '1 hour' then
    return false;
  end if;

  -- Anything the visitor created/imported under the demo account is gone.
  delete from public.plans p
   where p.user_id = demo_uid
     and p.id not in (select plan_id from public.demo_baseline);

  -- Visitors edit by appending events; dropping them returns each plan to its
  -- snapshot (the client rebuilds days from the snapshot alone).
  delete from public.plan_events e
   where e.plan_id in (select plan_id from public.demo_baseline);

  for b in select * from public.demo_baseline loop
    update public.plans
       set title       = nullif(b.plan->>'title', ''),
           start_date  = coalesce((b.plan->>'start_date')::date, start_date),
           end_date    = coalesce((b.plan->>'end_date')::date, end_date),
           budget      = (b.plan->>'budget')::numeric,
           is_public   = coalesce((b.plan->>'is_public')::boolean, is_public),
           cover_image = nullif(b.plan->>'cover_image', '')
     where id = b.plan_id;

    update public.plan_snapshots
       set version = (b.snapshot->>'version')::bigint,
           state   = coalesce(b.snapshot->'state', state),
           updated_at = now()
     where plan_id = b.plan_id;

    delete from public.budget_entries where plan_id = b.plan_id;
    insert into public.budget_entries (id, plan_id, description, category, amount)
    select (x->>'id')::uuid, b.plan_id, x->>'description', x->>'category', (x->>'amount')::numeric
      from jsonb_array_elements(b.budget) x;
  end loop;

  update public.demo_reset_state set last_reset_at = now() where id = true;
  return true;
end;
$$;

revoke all on function public.maybe_reset_demo() from anon, authenticated;
grant execute on function public.maybe_reset_demo() to authenticated;
