-- Life Policy Pilot — pre-underwriting case store
-- =============================================================================
-- Run this file top-to-bottom in the Supabase SQL editor (or as a migration).
-- It is safe to re-run: every object is created with IF NOT EXISTS or CREATE OR
-- REPLACE.
--
-- Security model
--   * The customer-facing site never talks to these tables. Submissions arrive
--     through the `submit-case` edge function using the service-role key.
--   * The reviewer portal talks to these tables with the anon key plus a
--     signed-in Supabase user, and row level security limits every row to
--     members of `public.reviewers`.
--   * `anon` is explicitly revoked: possession of the site's public key grants
--     no access whatsoever.
--
-- Before the portal works, the reviewer must exist in Supabase Auth
-- (Authentication → Users → Add user) and then be registered in `reviewers`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Reviewer allowlist
-- -----------------------------------------------------------------------------
create table if not exists public.reviewers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

comment on table public.reviewers is
  'Allowlist of staff who may read submitted pre-underwriting cases. Service role only for writes.';

alter table public.reviewers enable row level security;

-- A reviewer may see only their own allowlist row.
drop policy if exists reviewers_select_self on public.reviewers;
create policy reviewers_select_self
  on public.reviewers
  for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policies: reviewers are added by an administrator
-- using the service role or the SQL editor.
revoke all on public.reviewers from anon;
grant select on public.reviewers to authenticated;

-- Create the reviewer in Auth first, then register them here. Replace the
-- placeholders with the real user id and address:
--
--   insert into public.reviewers (user_id, email, display_name)
--   select id, email, 'Richard Parslow'
--   from auth.users
--   where email = 'richardparslow@lifepolicypilot.blog'
--   on conflict (user_id) do nothing;

-- -----------------------------------------------------------------------------
-- Reviewer check used by every policy below
-- -----------------------------------------------------------------------------
create or replace function public.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reviewers r
    where r.user_id = auth.uid()
  );
$$;

comment on function public.is_reviewer() is
  'True when the current authenticated user is on the reviewer allowlist.';

revoke all on function public.is_reviewer() from public;
revoke all on function public.is_reviewer() from anon;
grant execute on function public.is_reviewer() to authenticated;

-- -----------------------------------------------------------------------------
-- Cases: one immutable snapshot per submission
-- -----------------------------------------------------------------------------
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  submitted_at timestamptz not null default now(),
  questionnaire_version text not null,
  status text not null default 'submitted'
    check (status in ('saved', 'submitted', 'reviewed', 'needs_clarification')),
  crisis_disclosure boolean not null default false,
  residence_state text,
  notification_state text not null default 'queued'
    check (notification_state in ('not_sent', 'queued', 'accepted', 'delivered', 'failed')),
  notification_attempts integer not null default 0,
  notification_detail text,
  notification_updated_at timestamptz,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

comment on table public.cases is
  'Immutable submitted pre-underwriting cases. `payload` is the validated CaseRecord as sent by the interview.';
comment on column public.cases.notification_detail is
  'Safe operational detail only: provider status code, or a JSON object with provider message id. Never health data.';

create index if not exists cases_submitted_at_idx on public.cases (submitted_at desc);
create index if not exists cases_reference_idx on public.cases (reference);
create index if not exists cases_residence_state_idx on public.cases (residence_state);

-- A submitted case is evidence: the snapshot fields must never change.
create or replace function public.cases_prevent_snapshot_mutation()
returns trigger
language plpgsql
as $$
begin
  if new.payload is distinct from old.payload
     or new.reference is distinct from old.reference
     or new.submitted_at is distinct from old.submitted_at
     or new.questionnaire_version is distinct from old.questionnaire_version then
    raise exception 'Submitted case snapshots are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists cases_immutable_snapshot on public.cases;
create trigger cases_immutable_snapshot
  before update on public.cases
  for each row
  execute function public.cases_prevent_snapshot_mutation();

alter table public.cases enable row level security;

drop policy if exists cases_select_reviewer on public.cases;
create policy cases_select_reviewer
  on public.cases
  for select
  to authenticated
  using (public.is_reviewer());

drop policy if exists cases_update_status_reviewer on public.cases;
create policy cases_update_status_reviewer
  on public.cases
  for update
  to authenticated
  using (public.is_reviewer())
  with check (public.is_reviewer());

-- Belt and braces: even with the update policy above, an authenticated
-- reviewer may only change the workflow status. Notification columns are
-- written by the service role, which bypasses these grants.
revoke all on public.cases from anon;
grant select on public.cases to authenticated;
revoke update on public.cases from authenticated;
grant update (status) on public.cases to authenticated;

-- No delete policy: cases are retained according to the retention schedule.

-- -----------------------------------------------------------------------------
-- Review log: Richard's human activity, recorded separately from the case
-- -----------------------------------------------------------------------------
create table if not exists public.case_review_log (
  id bigserial primary key,
  case_id uuid not null references public.cases (id) on delete cascade,
  action text not null
    check (action in ('opened', 'marked_reviewed', 'requested_clarification')),
  actor text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists case_review_log_case_id_idx on public.case_review_log (case_id, created_at desc);

alter table public.case_review_log enable row level security;

drop policy if exists case_review_log_select_reviewer on public.case_review_log;
create policy case_review_log_select_reviewer
  on public.case_review_log
  for select
  to authenticated
  using (public.is_reviewer());

drop policy if exists case_review_log_insert_reviewer on public.case_review_log;
create policy case_review_log_insert_reviewer
  on public.case_review_log
  for insert
  to authenticated
  with check (public.is_reviewer() and actor = coalesce(auth.jwt() ->> 'email', ''));

revoke all on public.case_review_log from anon;
grant select, insert on public.case_review_log to authenticated;
-- bigserial sequence access for inserts
grant usage, select on sequence public.case_review_log_id_seq to authenticated;

-- -----------------------------------------------------------------------------
-- Contact suppressions: marketing outreach is blocked outside the language model
-- -----------------------------------------------------------------------------
create table if not exists public.contact_suppressions (
  id bigserial primary key,
  channel text not null check (channel in ('phone', 'email')),
  address_normalized text not null,
  reason text not null,
  source_case_reference text,
  created_at timestamptz not null default now(),
  unique (channel, address_normalized)
);

comment on table public.contact_suppressions is
  'Do-not-contact list. Every outbound marketing attempt must be checked against this table before sending.';

alter table public.contact_suppressions enable row level security;

drop policy if exists contact_suppressions_select_reviewer on public.contact_suppressions;
create policy contact_suppressions_select_reviewer
  on public.contact_suppressions
  for select
  to authenticated
  using (public.is_reviewer());

-- No insert/update/delete policies: written by the service role or by an
-- operator in the SQL editor after a revocation request.
revoke all on public.contact_suppressions from anon;
grant select on public.contact_suppressions to authenticated;

-- -----------------------------------------------------------------------------
-- RPC used by the reviewer portal
-- -----------------------------------------------------------------------------
create or replace function public.record_case_review(
  p_reference text,
  p_action text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case_id uuid;
  v_actor text;
begin
  if not public.is_reviewer() then
    raise exception 'Not authorised';
  end if;

  if p_action not in ('opened', 'marked_reviewed', 'requested_clarification') then
    raise exception 'Unsupported review action';
  end if;

  select c.id into v_case_id
  from public.cases c
  where c.reference = p_reference;

  if v_case_id is null then
    raise exception 'Case not found';
  end if;

  v_actor := coalesce(auth.jwt() ->> 'email', 'reviewer');

  insert into public.case_review_log (case_id, action, actor, note)
  values (v_case_id, p_action, v_actor, p_note);

  if p_action = 'marked_reviewed' then
    update public.cases set status = 'reviewed' where id = v_case_id;
  elsif p_action = 'requested_clarification' then
    update public.cases set status = 'needs_clarification' where id = v_case_id;
  end if;
end;
$$;

comment on function public.record_case_review(text, text, text) is
  'Records a human review action against a case. Consequential decisions stay with the reviewer.';

revoke all on function public.record_case_review(text, text, text) from public;
revoke all on function public.record_case_review(text, text, text) from anon;
grant execute on function public.record_case_review(text, text, text) to authenticated;
