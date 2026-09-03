-- Validate event shapes at the persistence boundary, regardless of caller.
create or replace function public.validate_plan_event_payload()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  payload jsonb := new.payload;
  activity jsonb;
  day jsonb;
begin
  if new.event_type not in (
    'activity.created',
    'activity.updated',
    'activity.deleted',
    'activity.moved',
    'day.created',
    'day.updated',
    'day.removed',
    'day.reordered'
  ) then
    raise exception 'validate_plan_event_payload: unsupported event_type=%', new.event_type
      using errcode = '22023';
  end if;

  if jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'validate_plan_event_payload: payload must be an object for event_id=%', new.event_id
      using errcode = '22023';
  end if;

  case new.event_type
    when 'activity.created' then
      activity := payload->'activity';
      if jsonb_typeof(activity) is distinct from 'object'
         or jsonb_typeof(payload->'dayId') is distinct from 'string'
         or jsonb_typeof(payload->'position') is distinct from 'string'
         or jsonb_typeof(activity->'id') is distinct from 'string'
         or jsonb_typeof(activity->'title') is distinct from 'string'
         or jsonb_typeof(activity->'color') is distinct from 'string' then
        raise exception 'validate_plan_event_payload: invalid activity.created payload for event_id=%', new.event_id
          using errcode = '22023';
      end if;
    when 'activity.updated' then
      if jsonb_typeof(payload->'activityId') is distinct from 'string'
         or jsonb_typeof(payload->'patch') is distinct from 'object' then
        raise exception 'validate_plan_event_payload: invalid activity.updated payload for event_id=%', new.event_id
          using errcode = '22023';
      end if;
    when 'activity.deleted', 'activity.moved' then
      if jsonb_typeof(payload->'activityId') is distinct from 'string' then
        raise exception 'validate_plan_event_payload: invalid % payload for event_id=%', new.event_type, new.event_id
          using errcode = '22023';
      end if;
      if new.event_type = 'activity.moved'
         and (
           jsonb_typeof(payload->'fromDayId') is distinct from 'string'
           or jsonb_typeof(payload->'toDayId') is distinct from 'string'
           or jsonb_typeof(payload->'position') is distinct from 'string'
         ) then
        raise exception 'validate_plan_event_payload: invalid activity.moved payload for event_id=%', new.event_id
          using errcode = '22023';
      end if;
    when 'day.created' then
      day := payload->'day';
      if jsonb_typeof(day) is distinct from 'object'
         or jsonb_typeof(day->'id') is distinct from 'string'
         or jsonb_typeof(day->'label') is distinct from 'string'
         or jsonb_typeof(day->'activities') is distinct from 'array'
         or jsonb_typeof(day->'position') is distinct from 'string' then
        raise exception 'validate_plan_event_payload: invalid day.created payload for event_id=%', new.event_id
          using errcode = '22023';
      end if;
    when 'day.updated' then
      if jsonb_typeof(payload->'dayId') is distinct from 'string'
         or jsonb_typeof(payload->'patch') is distinct from 'object' then
        raise exception 'validate_plan_event_payload: invalid day.updated payload for event_id=%', new.event_id
          using errcode = '22023';
      end if;
    when 'day.removed', 'day.reordered' then
      if jsonb_typeof(payload->'dayId') is distinct from 'string' then
        raise exception 'validate_plan_event_payload: invalid % payload for event_id=%', new.event_type, new.event_id
          using errcode = '22023';
      end if;
      if new.event_type = 'day.reordered'
         and jsonb_typeof(payload->'position') is distinct from 'string' then
        raise exception 'validate_plan_event_payload: invalid day.reordered payload for event_id=%', new.event_id
          using errcode = '22023';
      end if;
  end case;

  return new;
end;
$function$;

revoke all on function public.validate_plan_event_payload() from public, anon, authenticated;

drop trigger if exists plan_events_validate_payload on public.plan_events;

create trigger plan_events_validate_payload
before insert on public.plan_events
for each row
execute function public.validate_plan_event_payload();
