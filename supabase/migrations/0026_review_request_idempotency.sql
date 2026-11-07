begin;

-- A lost response after a committed review decision must be retried safely.
-- The request ID identifies one decision intent per case and reviewer; a
-- replay returns the original result instead of adding a second audit row.
alter table public.case_review_log add column if not exists request_id uuid;
create unique index if not exists case_review_log_request_idx
  on public.case_review_log(case_id, actor, request_id)
  where request_id is not null;

drop function if exists public.record_case_review(text, text, text, text, bigint);

create or replace function public.record_case_review(
  p_reference text,
  p_action text,
  p_note text default null,
  p_expected_status text default null,
  p_expected_revision bigint default null,
  p_request_id uuid default null
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
  v_existing_action text;
  v_existing_note text;
begin
  if not public.is_reviewer() then
    raise exception 'Not authorised';
  end if;

  if p_action not in ('opened', 'marked_reviewed', 'requested_clarification') then
    raise exception 'Unsupported review action';
  end if;

  -- A decision without an idempotency key can still be duplicated by a retry.
  -- Loading a case remains idempotent through the existing eight-hour open
  -- coalescing path and does not need a client request ID.
  if p_action <> 'opened' and p_request_id is null then
    raise exception 'Review request ID is required';
  end if;

  v_actor := coalesce(auth.jwt() ->> 'email', 'reviewer');

  select c.id, c.status, c.review_revision
    into v_case_id, v_status, v_revision
  from public.cases c
  where c.reference = p_reference
  for update;

  if v_case_id is null then
    raise exception 'Case not found';
  end if;

  -- Replay before checking the status/revision. A lost acknowledgement leaves
  -- the caller holding the status and revision from before its own committed
  -- write, so that retry must succeed rather than look like a stale page.
  if p_action <> 'opened' then
    select l.action, l.note
      into v_existing_action, v_existing_note
    from public.case_review_log l
    where l.case_id = v_case_id
      and l.actor = v_actor
      and l.request_id = p_request_id;

    if found then
      if v_existing_action is distinct from p_action
         or v_existing_note is distinct from p_note then
        raise exception 'Review request already used for a different decision';
      end if;
      return;
    end if;
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

  insert into public.case_review_log (case_id, action, actor, note, request_id)
  values (v_case_id, p_action, v_actor, p_note, p_request_id);

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

comment on function public.record_case_review(text,text,text,text,bigint,uuid) is
  'Reviewer/AAL2-only review write. A decision requires a request ID; a replay with the same case, reviewer and request ID returns the original result, while changed content is rejected. Expected status and revision are checked under the case row lock.';

revoke all on function public.record_case_review(text, text, text, text, bigint, uuid) from public;
revoke all on function public.record_case_review(text, text, text, text, bigint, uuid) from anon;
grant execute on function public.record_case_review(text, text, text, text, bigint, uuid) to authenticated;

commit;
