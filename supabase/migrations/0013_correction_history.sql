-- Heal s7-oldest-corrections-vanish-past-50: bounded, audited correction paging.
-- Additive migration; previously applied migrations remain unchanged.
create index if not exists case_corrections_cursor_idx
  on public.case_corrections (case_id, created_at desc, id desc);

create or replace function public.case_corrections_page(
  p_case_id uuid, p_before_at timestamptz, p_before_id bigint
) returns jsonb language sql set search_path = public, pg_temp as $$
  with selected as materialized (
    select id, detail, recorded_by, created_at from public.case_corrections
    where case_id = p_case_id
      and (p_before_at is null or (created_at, id) < (p_before_at, p_before_id))
    order by created_at desc, id desc limit 51
  ), page as (
    select * from selected order by created_at desc, id desc limit 50
  )
  select jsonb_build_object(
    'entries', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id::text, 'detail', detail, 'recorded_by', recorded_by, 'created_at', created_at
    ) order by created_at desc, id desc) from page), '[]'::jsonb),
    'next_cursor', case when (select count(*) from selected) > 50 then (
      select jsonb_build_object('created_at', created_at, 'id', id::text)
      from page order by created_at, id limit 1
    ) else null end
  );
$$;
revoke all on function public.case_corrections_page(uuid,timestamptz,bigint)
  from public, anon, authenticated;

create or replace function public.get_case_corrections(
  p_reference text, p_before_at timestamptz default null, p_before_id bigint default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_case_id uuid;
begin
  if not public.is_reviewer() then raise exception 'Not authorised'; end if;
  if (p_before_at is null) <> (p_before_id is null)
     or p_before_id <= 0 or not isfinite(p_before_at) then
    raise exception 'Invalid corrections cursor';
  end if;
  select id into v_case_id from public.cases where reference = p_reference;
  if not found then raise exception 'Case not found'; end if;
  -- Direct correction reads carry the same audit requirement as case/history reads.
  insert into public.case_review_log (case_id, action, actor, note)
  values (v_case_id, 'opened', coalesce(auth.jwt() ->> 'email', auth.uid()::text), null);
  return public.case_corrections_page(v_case_id, p_before_at, p_before_id);
end;
$$;
revoke all on function public.get_case_corrections(text,timestamptz,bigint) from public, anon;
grant execute on function public.get_case_corrections(text,timestamptz,bigint) to authenticated;
comment on function public.get_case_corrections(text,timestamptz,bigint) is
  'Allowlisted AAL2 reviewers only. Audited, bounded older corrections with exact bigint cursor IDs.';

-- Preserve all existing payload, history and revocation fields.
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
  v_corrections := public.case_corrections_page(v_case.id, null, null);
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
    'review_log_cursor', v_history -> 'next_cursor',
    'corrections', v_corrections -> 'entries',
    'corrections_cursor', v_corrections -> 'next_cursor', 'revocations', v_revocations
  );
end;
$$;

revoke all on function public.open_case_for_review(text) from public, anon;
grant execute on function public.open_case_for_review(text) to authenticated;
comment on function public.open_case_for_review(text) is
  'Returns one case to an allowlisted AAL2 reviewer only after recording an opened event in the same transaction.';
