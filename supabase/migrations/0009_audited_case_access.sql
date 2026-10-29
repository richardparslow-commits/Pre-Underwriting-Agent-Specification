-- Enforce sensitive reviewer reads at the database boundary. Apply after 0008.
-- The queue is owner-executed because authenticated users may no longer read
-- cases directly. Its explicit reviewer check is mandatory on every query.
revoke select on public.cases from public, anon, authenticated;
revoke select on public.case_review_log from public, anon, authenticated;
revoke select on public.case_corrections from public, anon, authenticated;
revoke select on public.marketing_revocations from public, anon, authenticated;

create or replace view public.case_summaries
with (security_invoker = false, security_barrier = true)
as
select
  c.reference, c.submitted_at, c.status, c.notification_state,
  c.notification_attempts, c.notification_detail, c.notification_updated_at,
  c.crisis_disclosure,
  c.payload #>> '{lead,firstName}' as first_name,
  c.payload #>> '{lead,lastName}' as last_name,
  coalesce(c.residence_state, c.payload #>> '{lead,state}') as residence_state,
  case when jsonb_typeof(c.payload -> 'answers') = 'array' then (
    select count(*)::integer from jsonb_array_elements(c.payload -> 'answers') as answer
    where answer ->> 'disposition' = 'unresolved'
  ) else 0 end as unanswered
from public.cases c
where public.is_reviewer();

revoke all on public.case_summaries from public, anon;
grant select on public.case_summaries to authenticated;
comment on view public.case_summaries is
  'Metadata-only queue, explicitly restricted to allowlisted AAL2 reviewers.';

create or replace function public.open_case_for_review(p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_case public.cases%rowtype;
  v_log jsonb;
  v_log_total integer;
  v_corrections jsonb;
  v_revocations jsonb;
begin
  if not public.is_reviewer() then
    raise exception 'Not authorised';
  end if;

  select * into v_case from public.cases where reference = p_reference;
  if not found then
    return null;
  end if;

  -- Every successful payload read has its own event; an insert failure aborts
  -- the whole function, so the payload is not returned without a record.
  insert into public.case_review_log (case_id, action, actor, note)
  values (v_case.id, 'opened', coalesce(auth.jwt() ->> 'email', auth.uid()::text), null);

  select count(*)::integer into v_log_total
  from public.case_review_log
  where case_id = v_case.id;

  -- Twenty opens must not bury a `marked_reviewed` or `requested_clarification`.
  -- Consequential actions sort first (`is_open` false before true); the
  -- aggregate strips the sort key and the row id so the JSON shape is stable.
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'action', action,
        'actor', actor,
        'created_at', created_at,
        'note', note
      )
      order by is_open, created_at desc, id desc
    ),
    '[]'::jsonb
  )
  into v_log
  from (
    select action, actor, created_at, note, id, (action = 'opened') as is_open
    from public.case_review_log
    where case_id = v_case.id
    order by (action = 'opened'), created_at desc, id desc
    limit 20
  ) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
    into v_corrections from (
      select id, detail, recorded_by, created_at from public.case_corrections
      where case_id = v_case.id order by created_at desc, id desc limit 50
    ) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
    into v_revocations from (
      select channel, reason, source, recorded_by, created_at from public.marketing_revocations
      where case_reference = v_case.reference order by created_at desc, id desc limit 20
    ) x;

  return jsonb_build_object(
    'case', jsonb_build_object(
      'id', v_case.id, 'reference', v_case.reference, 'submitted_at', v_case.submitted_at,
      'status', v_case.status, 'payload', v_case.payload,
      'notification_state', v_case.notification_state,
      'notification_attempts', v_case.notification_attempts,
      'notification_detail', v_case.notification_detail,
      'notification_updated_at', v_case.notification_updated_at,
      'crisis_disclosure', v_case.crisis_disclosure
    ),
    'review_log', v_log, 'review_log_total', v_log_total,
    'corrections', v_corrections, 'revocations', v_revocations
  );
end;
$$;

revoke all on function public.open_case_for_review(text) from public, anon;
grant execute on function public.open_case_for_review(text) to authenticated;
comment on function public.open_case_for_review(text) is
  'Returns one case to an allowlisted AAL2 reviewer only after recording an opened event in the same transaction.';
