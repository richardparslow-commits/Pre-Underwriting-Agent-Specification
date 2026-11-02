-- Heal: phone withdrawal must not disappear behind newer email withdrawals.
-- Forward-only, bounded evidence paging; local suppression and consent snapshots stay unchanged.
create index if not exists marketing_revocations_cursor_idx
  on public.marketing_revocations (case_reference, created_at desc, id desc);
create index if not exists marketing_revocations_channel_latest_idx
  on public.marketing_revocations (case_reference, channel, created_at desc, id desc);

create or replace function public.case_marketing_revocations_page(
  p_reference text, p_before_at timestamptz, p_before_id bigint
) returns jsonb language sql set search_path = public, pg_temp as $$
  with selected as materialized (
    select id, channel, reason, source, recorded_by, created_at from public.marketing_revocations
    where case_reference = p_reference
      and (p_before_at is null or (created_at, id) < (p_before_at, p_before_id))
    order by created_at desc, id desc limit 21
  ), page as (
    select * from selected order by created_at desc, id desc limit 20
  )
  select jsonb_build_object(
    'entries', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id::text, 'channel', channel, 'reason', reason, 'source', source,
      'recorded_by', recorded_by, 'created_at', created_at
    ) order by created_at desc, id desc) from page), '[]'::jsonb),
    'next_cursor', case when (select count(*) from selected) > 20 then (
      select jsonb_build_object('created_at', created_at, 'id', id::text)
      from page order by created_at, id limit 1
    ) else null end
  );
$$;
revoke all on function public.case_marketing_revocations_page(text,timestamptz,bigint)
  from public, anon, authenticated;

create or replace function public.get_case_marketing_revocations(
  p_reference text, p_before_at timestamptz default null, p_before_id bigint default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_case_id uuid;
begin
  if not public.is_reviewer() then raise exception 'Not authorised'; end if;
  if (p_before_at is null) <> (p_before_id is null)
     or p_before_id <= 0 or not isfinite(p_before_at) then
    raise exception 'Invalid withdrawals cursor';
  end if;
  select id into v_case_id from public.cases where reference = p_reference;
  if not found then raise exception 'Case not found'; end if;
  insert into public.case_review_log (case_id, action, actor, note)
  values (v_case_id, 'opened', coalesce(auth.jwt() ->> 'email', auth.uid()::text), null);
  return public.case_marketing_revocations_page(p_reference, p_before_at, p_before_id);
end;
$$;
revoke all on function public.get_case_marketing_revocations(text,timestamptz,bigint) from public, anon;
grant execute on function public.get_case_marketing_revocations(text,timestamptz,bigint) to authenticated;
comment on function public.get_case_marketing_revocations(text,timestamptz,bigint) is
  'Audited withdrawal evidence for allowlisted AAL2 reviewers only; exact bigint cursor IDs.';

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
  v_phone jsonb;
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
  v_corrections := public.case_corrections_page(v_case.id, null, null);
  v_revocations := public.case_marketing_revocations_page(v_case.reference, null, null);
  select jsonb_build_object('id', id::text, 'channel', channel, 'reason', reason,
      'source', source, 'recorded_by', recorded_by, 'created_at', created_at)
    into v_phone from public.marketing_revocations
    where case_reference = v_case.reference and channel = 'phone'
    order by created_at desc, id desc limit 1;

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
    'review_log_cursor', v_history -> 'next_cursor',
    'corrections', v_corrections -> 'entries',
    'corrections_cursor', v_corrections -> 'next_cursor',
    'revocations', v_revocations -> 'entries',
    'revocations_cursor', v_revocations -> 'next_cursor',
    'latest_phone_revocation', v_phone
  );
end;
$$;

revoke all on function public.open_case_for_review(text) from public, anon;
grant execute on function public.open_case_for_review(text) to authenticated;
comment on function public.open_case_for_review(text) is
  'Returns one case to an allowlisted AAL2 reviewer only after recording an opened event in the same transaction.';
