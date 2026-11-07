begin;

-- A status comparison cannot detect a review page that missed a correction or a
-- status round-trip back to the same value. Give each case a monotonic revision
-- that advances on every consequential review change. The page sends the
-- revision it displayed, so the RPC refuses an unseen change even when the
-- status still matches.

alter table public.cases
  add column if not exists review_revision bigint not null default 0;

-- Replace the four-argument signature so the revision guard is the only path.
drop function if exists public.record_case_review(text, text, text, text);

create or replace function public.record_case_review(
  p_reference text,
  p_action text,
  p_note text default null,
  p_expected_status text default null,
  p_expected_revision bigint default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case_id uuid;
  v_actor text;
  v_status text;
  v_revision bigint;
begin
  if not public.is_reviewer() then
    raise exception 'Not authorised';
  end if;

  if p_action not in ('opened', 'marked_reviewed', 'requested_clarification') then
    raise exception 'Unsupported review action';
  end if;

  select c.id, c.status, c.review_revision
    into v_case_id, v_status, v_revision
  from public.cases c
  where c.reference = p_reference
  for update;

  if v_case_id is null then
    raise exception 'Case not found';
  end if;

  -- A page opened before another tab requested clarification, recorded a
  -- correction, or completed a status round-trip must not apply an unseen
  -- decision. The row lock makes the comparison and the write atomic.
  if p_action <> 'opened'
     and (
       (p_expected_status is not null and v_status is distinct from p_expected_status)
       or
       (p_expected_revision is not null and v_revision is distinct from p_expected_revision)
     ) then
    raise exception 'This case changed since you opened it. Refresh before recording a review decision.';
  end if;

  v_actor := coalesce(auth.jwt() ->> 'email', 'reviewer');

  -- Loading a case repeatedly should not fill the audit log with duplicates.
  if p_action = 'opened' and exists (
    select 1
    from public.case_review_log l
    where l.case_id = v_case_id
      and l.actor = v_actor
      and l.action = 'opened'
      and l.created_at > now() - interval '8 hours'
  ) then
    return;
  end if;

  insert into public.case_review_log (case_id, action, actor, note)
  values (v_case_id, p_action, v_actor, p_note);

  if p_action = 'marked_reviewed' then
    update public.cases
    set status = 'reviewed', review_revision = review_revision + 1
    where id = v_case_id;
  elsif p_action = 'requested_clarification' then
    update public.cases
    set status = 'needs_clarification', review_revision = review_revision + 1
    where id = v_case_id;
  end if;
end;
$$;

comment on function public.record_case_review(text,text,text,text,bigint) is
  'Reviewer/AAL2-only review write. A decision is refused when the expected status or case revision no longer matches the locked case row.';

revoke all on function public.record_case_review(text, text, text, text, bigint) from public;
revoke all on function public.record_case_review(text, text, text, text, bigint) from anon;
grant execute on function public.record_case_review(text, text, text, text, bigint) to authenticated;

-- A correction is an unseen case change too. The trigger fires only for a new
-- correction; an idempotent replay inserts no row and therefore does not bump.
create or replace function public.bump_case_review_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cases
  set review_revision = review_revision + 1
  where id = new.case_id;
  return new;
end;
$$;

drop trigger if exists case_corrections_review_revision on public.case_corrections;
create trigger case_corrections_review_revision
after insert on public.case_corrections
for each row execute function public.bump_case_review_revision();

revoke all on function public.bump_case_review_revision() from public, anon, authenticated;

-- Return the revision atomically with the audited case payload.
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
      'status', v_case.status, 'review_revision', v_case.review_revision,
      'payload', v_case.payload,
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
  'Returns one case and its review revision to an allowlisted AAL2 reviewer after recording an opened event in the same transaction.';

commit;
