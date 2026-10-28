-- Life Policy Pilot — reliability, reviewer access and data lifecycle
-- =============================================================================
-- This migration closes the controls that cannot be enforced in the browser:
--   * one case per idempotency key,
--   * a claimed notification lease instead of a send-before-status race,
--   * AAL2 (MFA) as a requirement for every reviewer policy,
--   * a deduplicated delivery-event ledger that cannot regress status,
--   * durable anonymous submission rate limiting,
--   * an audited deletion path and an opt-in retention job,
--   * an operator path for marketing revocation, while channels stay disabled.
--
-- It is safe to re-run. No case payload is rewritten.

-- -----------------------------------------------------------------------------
-- Cases: idempotency, claims, server receipt time, provider reconciliation
-- -----------------------------------------------------------------------------
alter table public.cases
  add column if not exists idempotency_key text,
  add column if not exists server_received_at timestamptz not null default now(),
  add column if not exists notification_claimed_at timestamptz,
  add column if not exists notification_claimed_by text,
  add column if not exists notification_next_attempt_at timestamptz,
  add column if not exists provider_message_id text,
  add column if not exists retention_expires_at timestamptz;

create unique index if not exists cases_idempotency_key_idx
  on public.cases (idempotency_key)
  where idempotency_key is not null;

create index if not exists cases_notification_retry_idx
  on public.cases (notification_state, notification_next_attempt_at, submitted_at)
  where notification_state in ('queued', 'failed', 'not_sent');

comment on column public.cases.idempotency_key is
  'Client-supplied per-draft key. Unique: one submission creates at most one case.';
comment on column public.cases.server_received_at is
  'Server receipt time. Kept separately from the client-asserted submission time.';
comment on column public.cases.notification_claimed_at is
  'Lease timestamp. A non-expired lease means another worker owns the send.';

-- A submitted case is evidence: the snapshot and derived triage evidence must
-- never change, including through the service role.
create or replace function public.cases_prevent_snapshot_mutation()
returns trigger
language plpgsql
as $$
begin
  if new.payload is distinct from old.payload
     or new.reference is distinct from old.reference
     or new.submitted_at is distinct from old.submitted_at
     or new.server_received_at is distinct from old.server_received_at
     or new.questionnaire_version is distinct from old.questionnaire_version
     or new.idempotency_key is distinct from old.idempotency_key
     or new.crisis_disclosure is distinct from old.crisis_disclosure
     or new.residence_state is distinct from old.residence_state then
    raise exception 'Submitted case snapshots and triage evidence are immutable';
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Reviewer check: allowlist membership AND a stepped-up (AAL2) session
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
  )
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

comment on function public.is_reviewer() is
  'True only for an allowlisted reviewer with an AAL2 (MFA) session.';

revoke all on function public.is_reviewer() from public;
revoke all on function public.is_reviewer() from anon;
grant execute on function public.is_reviewer() to authenticated;

create index if not exists case_review_log_opened_idx
  on public.case_review_log (case_id, actor, action, created_at desc);

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

-- -----------------------------------------------------------------------------
-- Durable anonymous submission rate limit
-- -----------------------------------------------------------------------------
create table if not exists public.submission_rate_limits (
  key_hash text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key_hash, window_start)
);

comment on table public.submission_rate_limits is
  'Durable anonymous submission counters. key_hash is a salted hash, never a raw IP address.';

alter table public.submission_rate_limits enable row level security;
revoke all on public.submission_rate_limits from anon, authenticated;

create or replace function public.consume_submission_rate(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_count integer;
  v_limit integer := greatest(1, least(coalesce(p_limit, 10), 1000));
  v_seconds integer := greatest(60, least(coalesce(p_window_seconds, 600), 86400));
begin
  if p_key_hash is null or length(p_key_hash) < 16 or length(p_key_hash) > 128 then
    raise exception 'Invalid rate-limit key';
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / v_seconds) * v_seconds);

  insert into public.submission_rate_limits (key_hash, window_start, count)
  values (p_key_hash, v_window, 1)
  on conflict (key_hash, window_start)
  do update set count = public.submission_rate_limits.count + 1
  returning count into v_count;

  return v_count <= v_limit;
end;
$$;

revoke all on function public.consume_submission_rate(text, integer, integer) from public;
revoke all on function public.consume_submission_rate(text, integer, integer) from anon, authenticated;
grant execute on function public.consume_submission_rate(text, integer, integer) to service_role;

-- -----------------------------------------------------------------------------
-- Notification claim / complete / release
-- -----------------------------------------------------------------------------
create or replace function public.claim_case_notification(
  p_reference text,
  p_worker text
)
returns table (
  reference text,
  submitted_at timestamptz,
  notification_attempts integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.cases c
  set notification_claimed_at = now(),
      notification_claimed_by = p_worker,
      notification_attempts = c.notification_attempts + 1
  where c.reference = p_reference
    and c.notification_state in ('queued', 'failed', 'not_sent')
    and c.notification_attempts < 5
    and (c.notification_next_attempt_at is null or c.notification_next_attempt_at <= now())
    and (c.notification_claimed_at is null
         or c.notification_claimed_at < now() - interval '10 minutes')
  returning c.reference, c.submitted_at, c.notification_attempts;
end;
$$;

revoke all on function public.claim_case_notification(text, text) from public;
revoke all on function public.claim_case_notification(text, text) from anon, authenticated;
grant execute on function public.claim_case_notification(text, text) to service_role;

create or replace function public.complete_case_notification(
  p_reference text,
  p_state text,
  p_detail text,
  p_message_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_retry timestamptz;
begin
  if p_state not in ('not_sent', 'queued', 'accepted', 'delivered', 'failed') then
    raise exception 'Unsupported notification state';
  end if;

  v_retry := case
    when p_state = 'failed' then now() + interval '15 minutes'
    when p_state = 'not_sent' then now() + interval '1 hour'
    else null
  end;

  update public.cases
  set notification_state = p_state,
      notification_detail = left(coalesce(p_detail, ''), 1000),
      notification_updated_at = now(),
      notification_claimed_at = null,
      notification_claimed_by = null,
      notification_next_attempt_at = v_retry,
      provider_message_id = coalesce(p_message_id, provider_message_id)
  where reference = p_reference;
end;
$$;

revoke all on function public.complete_case_notification(text, text, text, text) from public;
revoke all on function public.complete_case_notification(text, text, text, text) from anon, authenticated;
grant execute on function public.complete_case_notification(text, text, text, text) to service_role;

-- -----------------------------------------------------------------------------
-- Delivery events: deduplicated, reconciled and monotonic
-- -----------------------------------------------------------------------------
create table if not exists public.email_events (
  id bigserial primary key,
  event_id text not null unique,
  case_id uuid references public.cases (id) on delete set null,
  event_type text not null,
  notification_state text not null
    check (notification_state in ('accepted', 'delivered', 'failed')),
  message_id text,
  received_at timestamptz not null default now()
);

comment on table public.email_events is
  'Minimal delivery-event ledger. No recipient, subject, body or health data is stored.';

alter table public.email_events enable row level security;
revoke all on public.email_events from anon, authenticated;

create or replace function public.apply_email_event(
  p_event_id text,
  p_event_type text,
  p_reference text,
  p_message_id text,
  p_state text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case_id uuid;
  v_current text;
  v_rank_new integer;
  v_rank_current integer;
  v_inserted bigint;
begin
  if p_event_id is null or length(p_event_id) < 1 or length(p_event_id) > 200 then
    raise exception 'Invalid event id';
  end if;
  if p_state not in ('accepted', 'delivered', 'failed') then
    raise exception 'Unsupported delivery state';
  end if;

  insert into public.email_events (event_id, event_type, notification_state, message_id)
  values (left(p_event_id, 200), left(coalesce(p_event_type, 'unknown'), 100), p_state, left(p_message_id, 200))
  on conflict (event_id) do nothing
  returning id into v_inserted;

  if v_inserted is null then
    return 'duplicate';
  end if;

  select c.id, c.notification_state
  into v_case_id, v_current
  from public.cases c
  where (p_reference is not null and c.reference = p_reference)
     or (p_reference is null and p_message_id is not null and c.provider_message_id = p_message_id)
  limit 1;

  if v_case_id is null then
    return 'unmatched';
  end if;

  update public.email_events set case_id = v_case_id where id = v_inserted;

  v_rank_new := case p_state when 'accepted' then 1 when 'failed' then 2 else 3 end;
  v_rank_current := case v_current when 'accepted' then 1 when 'failed' then 2 when 'delivered' then 3 else 0 end;

  -- Delivered is terminal. A late "sent" event cannot overwrite a bounce, and
  -- no event can move a delivered case backwards.
  if v_rank_new <= v_rank_current then
    return 'ignored';
  end if;

  update public.cases
  set notification_state = p_state,
      notification_updated_at = now(),
      provider_message_id = coalesce(provider_message_id, p_message_id)
  where id = v_case_id;

  return 'applied';
end;
$$;

revoke all on function public.apply_email_event(text, text, text, text, text) from public;
revoke all on function public.apply_email_event(text, text, text, text, text) from anon, authenticated;
grant execute on function public.apply_email_event(text, text, text, text, text) to service_role;

-- -----------------------------------------------------------------------------
-- Data lifecycle: approved deletion and an opt-in retention job
-- -----------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('retention_months', null)
on conflict (key) do nothing;

comment on table public.app_settings is
  'Operational settings. retention_months stays null until counsel approves a schedule.';

alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;

create table if not exists public.case_deletions (
  id bigserial primary key,
  case_reference text not null,
  reason text not null,
  actor text not null,
  deleted_at timestamptz not null default now()
);

alter table public.case_deletions enable row level security;

drop policy if exists case_deletions_select_reviewer on public.case_deletions;
create policy case_deletions_select_reviewer
  on public.case_deletions
  for select
  to authenticated
  using (public.is_reviewer());

revoke all on public.case_deletions from anon, authenticated;
grant select on public.case_deletions to authenticated;

create or replace function public.delete_case(
  p_reference text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text;
begin
  if not public.is_reviewer() then
    raise exception 'Not authorised';
  end if;

  if p_reason is null or length(btrim(p_reason)) < 3 then
    raise exception 'A deletion reason is required';
  end if;

  v_actor := coalesce(auth.jwt() ->> 'email', 'reviewer');

  if not exists (select 1 from public.cases where reference = p_reference) then
    raise exception 'Case not found';
  end if;

  insert into public.case_deletions (case_reference, reason, actor)
  values (p_reference, left(btrim(p_reason), 1000), v_actor);

  delete from public.cases where reference = p_reference;
end;
$$;

revoke all on function public.delete_case(text, text) from public;
revoke all on function public.delete_case(text, text) from anon;
grant execute on function public.delete_case(text, text) to authenticated;

create or replace function public.purge_expired_cases()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_months integer;
  v_count integer := 0;
begin
  select nullif(value, '')::integer into v_months
  from public.app_settings
  where key = 'retention_months';

  -- No approved schedule means no automatic deletion.
  if v_months is null or v_months < 1 then
    return 0;
  end if;

  with expired as (
    delete from public.cases
    where submitted_at < now() - make_interval(months => v_months)
    returning reference
  ), audited as (
    insert into public.case_deletions (case_reference, reason, actor)
    select reference, 'Retention schedule', 'retention_job' from expired
    returning 1
  )
  select count(*) into v_count from audited;

  return v_count;
end;
$$;

revoke all on function public.purge_expired_cases() from public;
revoke all on function public.purge_expired_cases() from anon, authenticated;
grant execute on function public.purge_expired_cases() to service_role;

-- -----------------------------------------------------------------------------
-- Marketing revocation / suppression (channels remain disabled)
-- -----------------------------------------------------------------------------
create table if not exists public.marketing_revocations (
  id bigserial primary key,
  case_reference text,
  channel text not null check (channel in ('phone', 'email')),
  address_normalized text not null,
  reason text not null,
  recorded_by text not null,
  created_at timestamptz not null default now()
);

alter table public.marketing_revocations enable row level security;

drop policy if exists marketing_revocations_select_reviewer on public.marketing_revocations;
create policy marketing_revocations_select_reviewer
  on public.marketing_revocations
  for select
  to authenticated
  using (public.is_reviewer());

revoke all on public.marketing_revocations from anon, authenticated;
grant select on public.marketing_revocations to authenticated;

create or replace function public.normalize_contact(p_channel text, p_value text)
returns text
language sql
immutable
as $$
  select case
    when p_channel = 'phone' then regexp_replace(coalesce(p_value, ''), '\D', '', 'g')
    when p_channel = 'email' then lower(btrim(coalesce(p_value, '')))
    else null
  end;
$$;

create or replace function public.is_contact_suppressed(p_channel text, p_address text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contact_suppressions s
    where s.channel = p_channel
      and s.address_normalized = public.normalize_contact(p_channel, p_address)
  );
$$;

revoke all on function public.is_contact_suppressed(text, text) from public;
revoke all on function public.is_contact_suppressed(text, text) from anon, authenticated;
grant execute on function public.is_contact_suppressed(text, text) to service_role;

create or replace function public.record_marketing_revocation(
  p_reference text,
  p_channel text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case public.cases%rowtype;
  v_address text;
  v_actor text;
begin
  if not public.is_reviewer() then
    raise exception 'Not authorised';
  end if;

  if p_channel not in ('phone', 'email') then
    raise exception 'Unsupported contact channel';
  end if;

  select * into v_case from public.cases where reference = p_reference;
  if v_case.id is null then
    raise exception 'Case not found';
  end if;

  v_address := case
    when p_channel = 'phone' then v_case.payload #>> '{lead,phone}'
    else v_case.payload #>> '{lead,email}'
  end;

  if v_address is null or btrim(v_address) = '' then
    raise exception 'No contact address is recorded for that channel';
  end if;

  v_actor := coalesce(auth.jwt() ->> 'email', 'reviewer');

  insert into public.contact_suppressions (channel, address_normalized, reason, source_case_reference)
  values (p_channel, public.normalize_contact(p_channel, v_address), left(coalesce(p_reason, 'Customer revocation'), 500), p_reference)
  on conflict (channel, address_normalized) do update
    set reason = excluded.reason;

  insert into public.marketing_revocations (case_reference, channel, address_normalized, reason, recorded_by)
  values (p_reference, p_channel, public.normalize_contact(p_channel, v_address), left(coalesce(p_reason, 'Customer revocation'), 500), v_actor);
end;
$$;

revoke all on function public.record_marketing_revocation(text, text, text) from public;
revoke all on function public.record_marketing_revocation(text, text, text) from anon;
grant execute on function public.record_marketing_revocation(text, text, text) to authenticated;
