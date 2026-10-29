-- Bounded, reviewer-authorized history and queue-wide safety disclosure reads.
-- 0011 is reserved for the independent queue-ACL repair; this migration also
-- applies to the 0010 baseline and does not change queue view privileges.

create index if not exists case_review_log_history_cursor_idx
  on public.case_review_log (case_id, created_at desc, id desc);

-- Internal page reader: callers must use an authorized, audited public RPC.
create or replace function public.case_review_history_page(
  p_case_id uuid, p_before_at timestamptz, p_before_id bigint
) returns jsonb language sql set search_path = public, pg_temp as $$
  with selected as materialized (
    select id, action, actor, created_at, note from public.case_review_log
    where case_id = p_case_id
      and (p_before_at is null or (created_at, id) < (p_before_at, p_before_id))
    order by created_at desc, id desc limit 21
  ), page as (
    select * from selected order by created_at desc, id desc limit 20
  )
  select jsonb_build_object(
    'entries', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id::text, 'action', action, 'actor', actor, 'created_at', created_at, 'note', note
    ) order by created_at desc, id desc) from page), '[]'::jsonb),
    'next_cursor', case when (select count(*) from selected) > 20 then (
      select jsonb_build_object('created_at', created_at, 'id', id::text)
      from page order by created_at, id limit 1
    ) else null end
  );
$$;
revoke all on function public.case_review_history_page(uuid,timestamptz,bigint)
  from public, anon, authenticated;

create or replace function public.get_case_review_history(
  p_reference text, p_before_at timestamptz default null, p_before_id bigint default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_case_id uuid;
begin
  if not public.is_reviewer() then raise exception 'Not authorised'; end if;
  if (p_before_at is null) <> (p_before_id is null)
     or p_before_id <= 0 or not isfinite(p_before_at) then
    raise exception 'Invalid history cursor';
  end if;
  select id into v_case_id from public.cases where reference = p_reference;
  if not found then raise exception 'Case not found'; end if;

  -- A direct history RPC cannot bypass the sensitive-read audit. New opens
  -- sort ahead of an older-page cursor, so pagination does not feed itself.
  insert into public.case_review_log (case_id, action, actor, note)
  values (v_case_id, 'opened', coalesce(auth.jwt() ->> 'email', auth.uid()::text), null);
  return public.case_review_history_page(v_case_id, p_before_at, p_before_id);
end;
$$;
revoke all on function public.get_case_review_history(text,timestamptz,bigint) from public, anon;
grant execute on function public.get_case_review_history(text,timestamptz,bigint) to authenticated;

create index if not exists cases_safety_disclosures_idx
  on public.cases (submitted_at desc, reference desc) where crisis_disclosure;

create or replace function public.get_queue_safety_disclosures(
  p_before_at timestamptz default null, p_before_reference text default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_page jsonb;
begin
  if not public.is_reviewer() then raise exception 'Not authorised'; end if;
  if (p_before_at is null) <> (p_before_reference is null)
     or not isfinite(p_before_at) or length(btrim(p_before_reference)) = 0 then
    raise exception 'Invalid safety cursor';
  end if;
  -- All flagged cases, including reviewed and needs_clarification. This is
  -- visibility of recorded disclosures, not an emergency monitoring service.
  with eligible as not materialized (
    select reference, submitted_at, status from public.cases where crisis_disclosure
  ), selected as materialized (
    select * from eligible
    where p_before_at is null or (submitted_at, reference) < (p_before_at, p_before_reference)
    order by submitted_at desc, reference desc limit 26
  ), page as (
    select * from selected order by submitted_at desc, reference desc limit 25
  )
  select jsonb_build_object(
    'total', (select count(*) from eligible),
    'entries', coalesce((select jsonb_agg(to_jsonb(page) order by submitted_at desc, reference desc)
      from page), '[]'::jsonb),
    'next_cursor', case when (select count(*) from selected) > 25 then (
      select jsonb_build_object('submitted_at', submitted_at, 'reference', reference)
      from page order by submitted_at, reference limit 1
    ) else null end
  ) into v_page;
  return v_page;
end;
$$;
revoke all on function public.get_queue_safety_disclosures(timestamptz,text) from public, anon;
grant execute on function public.get_queue_safety_disclosures(timestamptz,text) to authenticated;
comment on function public.get_queue_safety_disclosures(timestamptz,text) is
  'AAL2 reviewers only. Queue-wide disclosure count and bounded reference-only pages, independent of the normal queue cursor.';

-- Keep the initial page atomic with its existing audited case open.
create or replace function public.open_case_for_review(p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_case public.cases%rowtype;
  v_history jsonb;
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

  v_history := public.case_review_history_page(v_case.id, null, null);
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
    'review_log', v_history -> 'entries',
    'review_log_cursor', v_history -> 'next_cursor', 'corrections', v_corrections, 'revocations', v_revocations
  );
end;
$$;

revoke all on function public.open_case_for_review(text) from public, anon;
grant execute on function public.open_case_for_review(text) to authenticated;
comment on function public.open_case_for_review(text) is
  'Returns one case to an allowlisted AAL2 reviewer only after recording an opened event in the same transaction.';
