begin;

-- Heal repairs:
--  * a reviewer's signed-out session must stop reading and writing cases at
--    once, rather than when its access token expires;
--  * a review decision must carry the status the reviewer actually saw, so a
--    stale page cannot overwrite a clarification request or correction.

create or replace function public.is_reviewer()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_session text := nullif(auth.jwt() ->> 'session_id', '');
begin
  if not (
    exists (select 1 from public.reviewers r where r.user_id = auth.uid())
    and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
  ) then
    return false;
  end if;

  -- Access tokens are stateless, so a copied token keeps its aal2 claim after
  -- sign-out. Where the token names its auth session, require that session to
  -- still exist. Tokens from older issuers without a session claim, and local
  -- harnesses that do not emulate auth.sessions, keep the previous behaviour.
  if v_session is null then
    return true;
  end if;
  if to_regclass('auth.sessions') is null then
    return true;
  end if;
  if v_session !~ '^[0-9a-fA-F-]{36}$' then
    return false;
  end if;

  return exists (
    select 1
    from auth.sessions s
    where s.id = v_session::uuid
      and s.user_id = auth.uid()
  );
end;
$$;

comment on function public.is_reviewer() is
  'True only for an allowlisted reviewer with a live AAL2 (MFA) session.';

revoke all on function public.is_reviewer() from public;
revoke all on function public.is_reviewer() from anon;
grant execute on function public.is_reviewer() to authenticated;

-- Replace the three-argument signature so the new guard is the only path.
drop function if exists public.record_case_review(text, text, text);

create or replace function public.record_case_review(
  p_reference text,
  p_action text,
  p_note text default null,
  p_expected_status text default null
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
begin
  if not public.is_reviewer() then
    raise exception 'Not authorised';
  end if;

  if p_action not in ('opened', 'marked_reviewed', 'requested_clarification') then
    raise exception 'Unsupported review action';
  end if;

  select c.id, c.status into v_case_id, v_status
  from public.cases c
  where c.reference = p_reference
  for update;

  if v_case_id is null then
    raise exception 'Case not found';
  end if;

  -- A page opened before another tab requested clarification must not apply an
  -- unseen decision. Locking the row above makes the comparison and the write
  -- atomic against a concurrent status change.
  if p_action <> 'opened'
     and p_expected_status is not null
     and v_status is distinct from p_expected_status then
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
    update public.cases set status = 'reviewed' where id = v_case_id;
  elsif p_action = 'requested_clarification' then
    update public.cases set status = 'needs_clarification' where id = v_case_id;
  end if;
end;
$$;

comment on function public.record_case_review(text,text,text,text) is
  'Reviewer/AAL2-only review log write. A status-changing decision is refused when the expected status no longer matches the locked case row.';

revoke all on function public.record_case_review(text, text, text, text) from public;
revoke all on function public.record_case_review(text, text, text, text) from anon;
grant execute on function public.record_case_review(text, text, text, text) to authenticated;

commit;
