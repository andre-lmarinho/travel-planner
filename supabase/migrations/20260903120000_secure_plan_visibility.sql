-- The Data API is reachable without tRPC, so enforce this authorization at the database boundary.
-- Keep member updates for other editable plan columns unchanged.
-- ponytail: guard only the privileged column and keep the existing plan update path.
create or replace function public.enforce_plan_visibility_admin()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if new.is_public is distinct from old.is_public
     and not public.is_plan_admin(old.id) then
    raise exception $$enforce_plan_visibility_admin: not authorized for plan_id=% user_id=%$$,
      old.id, (select auth.uid())
      using errcode = $$42501$$;
  end if;

  return new;
end;
$function$;

revoke all on function public.enforce_plan_visibility_admin() from public, anon, authenticated;

create or replace trigger plans_visibility_admin_only
before update of is_public on public.plans
for each row
execute function public.enforce_plan_visibility_admin();
