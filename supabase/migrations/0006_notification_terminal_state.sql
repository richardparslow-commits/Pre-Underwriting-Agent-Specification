-- Life Policy Pilot — delivered notification state is terminal
-- =============================================================================
-- 0003 introduced the first version of `complete_case_notification`. That file
-- is already recorded as applied on the staging project, so editing it does not
-- change an existing database. This migration is the forward fix.
--
-- It does two things:
--   1. Replaces `complete_case_notification` so a late submit/retry completion
--      cannot overwrite a `delivered` case or put it back in the retry queue.
--   2. Adds a table trigger so the invariant holds even if a service-role
--      client updates the notification columns directly, rather than through
--      the RPC.
--
-- It is safe to re-run. No case payload is rewritten.

-- -----------------------------------------------------------------------------
-- Completion path: delivered is terminal
-- -----------------------------------------------------------------------------
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
  v_current text;
begin
  if p_state not in ('not_sent', 'queued', 'accepted', 'delivered', 'failed') then
    raise exception 'Unsupported notification state';
  end if;

  select c.notification_state
  into v_current
  from public.cases c
  where c.reference = p_reference
  for update;

  if not found then
    return;
  end if;

  -- Delivered is terminal. A submit or retry call can finish after the
  -- provider webhook has already recorded delivery; its own result must not
  -- overwrite that evidence or clear the case back into the retry queue. This
  -- guard is the completion-path counterpart to apply_email_event().
  if v_current = 'delivered' then
    return;
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

-- A delivered row from an older build may still carry a retry time or a stale
-- lease. Delivery is terminal, so normalise those fields once; the trigger
-- below then prevents them from being attached again.
update public.cases
set notification_next_attempt_at = null,
    notification_claimed_at = null,
    notification_claimed_by = null
where notification_state = 'delivered'
  and (
    notification_next_attempt_at is not null
    or notification_claimed_at is not null
    or notification_claimed_by is not null
  );

-- -----------------------------------------------------------------------------
-- Table enforcement: no direct write may undo delivery or re-queue the case
-- -----------------------------------------------------------------------------
create or replace function public.cases_prevent_notification_regression()
returns trigger
language plpgsql
as $$
begin
  if old.notification_state = 'delivered'
     and (
       new.notification_state is distinct from 'delivered'
       or new.notification_next_attempt_at is not null
     ) then
    raise exception
      'Delivered notification state is terminal and cannot be re-queued';
  end if;

  return new;
end;
$$;

comment on function public.cases_prevent_notification_regression() is
  'Rejects any update that moves a delivered case out of delivered or attaches a retry time to it.';

drop trigger if exists cases_delivered_is_terminal on public.cases;
create trigger cases_delivered_is_terminal
  before update on public.cases
  for each row
  execute function public.cases_prevent_notification_regression();
