-- Life Policy Pilot — notification retries stay inside the provider dedupe window
-- =============================================================================
-- The retry worker re-sends a case notification with the case reference as the
-- provider idempotency key. The provider honours that key for 24 hours. The
-- worker's own eligibility window was seven days, so an uncertain acceptance
-- (a request that timed out after the provider had already queued the email)
-- could be retried after the key expired and produce a second reviewer email.
--
-- This migration makes the automatic path fail closed:
--   * records when the first send was attempted,
--   * refuses any further automatic claim more than 24 hours after it,
--   * exposes the cases that fell out for operator review instead of leaving
--     them looking queued forever.
--
-- It does not send, delete or rewrite a case payload. It is safe to re-run.
--
-- Residual limitation: the 24-hour figure is the provider's documented window,
-- not something this repository can verify. A shorter real window would still
-- expose an ambiguous acceptance; see docs/OPERATIONS.md before relying on it.

-- -----------------------------------------------------------------------------
-- First-attempt timestamp
-- -----------------------------------------------------------------------------
alter table public.cases
  add column if not exists notification_first_attempted_at timestamptz;

comment on column public.cases.notification_first_attempted_at is
  'When the first notification send was attempted. Automatic retries stop 24 hours after this, the provider idempotency-key window.';

-- Existing rows already attempted at least once have an unknown first-attempt
-- time. submitted_at is the earliest it could have been, so using it can only
-- shorten the retry window: those rows stop retrying rather than risk a
-- duplicate after the provider key has expired. Rows with no attempt stay null.
update public.cases
set notification_first_attempted_at = submitted_at
where notification_attempts > 0
  and notification_first_attempted_at is null;

create index if not exists cases_notification_retry_window_idx
  on public.cases (notification_first_attempted_at)
  where notification_state in ('queued', 'failed', 'not_sent');

-- -----------------------------------------------------------------------------
-- Claim: record the first attempt and refuse claims after its window
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
      notification_first_attempted_at = coalesce(c.notification_first_attempted_at, now()),
      notification_attempts = c.notification_attempts + 1
  where c.reference = p_reference
    and c.notification_state in ('queued', 'failed', 'not_sent')
    and c.notification_attempts < 5
    and (c.notification_next_attempt_at is null or c.notification_next_attempt_at <= now())
    and (c.notification_claimed_at is null
         or c.notification_claimed_at < now() - interval '10 minutes')
    -- The provider deduplicates on the case reference for 24 hours. Once that
    -- window has passed, a retry can no longer be proven idempotent, so the
    -- automatic path stops and the case appears in the backlog view.
    and (c.notification_first_attempted_at is null
         or c.notification_first_attempted_at > now() - interval '24 hours')
  returning c.reference, c.submitted_at, c.notification_attempts;
end;
$$;

comment on function public.claim_case_notification(text, text) is
  'Claims one due notification. Refuses a claim more than 24 hours after the first attempt so a retry cannot outlive the provider idempotency window.';

revoke all on function public.claim_case_notification(text, text) from public;
revoke all on function public.claim_case_notification(text, text) from anon, authenticated;
grant execute on function public.claim_case_notification(text, text) to service_role;

-- -----------------------------------------------------------------------------
-- Operator backlog: cases that will not be retried automatically
-- -----------------------------------------------------------------------------
create or replace view public.notification_retry_backlog as
select
  c.reference,
  c.submitted_at,
  c.notification_state,
  c.notification_attempts,
  c.notification_first_attempted_at,
  c.notification_updated_at,
  c.notification_detail
from public.cases c
where c.notification_state in ('queued', 'failed', 'not_sent')
  and c.notification_attempts < 5
  and c.notification_first_attempted_at is not null
  and c.notification_first_attempted_at <= now() - interval '24 hours';

comment on view public.notification_retry_backlog is
  'Cases the retry worker will not claim again because the provider idempotency window has passed. Operator review required.';

revoke all on public.notification_retry_backlog from public, anon, authenticated;
grant select on public.notification_retry_backlog to service_role;
