-- Life Policy Pilot — reviewer write paths and delivery-event correlation
-- =============================================================================
-- Two integrity gaps are closed here:
--
--   1. A reviewer must not be able to change workflow status or write audit
--      evidence directly. Those writes belong to the SECURITY DEFINER RPCs,
--      which record the actor and keep the action/status change atomic.
--
--   2. A delivery event that arrives before the case has stored its provider
--      message id must remain re-correlatable. Previously the event id was
--      consumed with case_id = null, so the provider retry was rejected as a
--      duplicate and the later case match was never applied.
--
-- This migration is safe to re-run. It does not rewrite any case payload.

-- -----------------------------------------------------------------------------
-- Reviewer writes: remove direct table/column privileges
-- -----------------------------------------------------------------------------
revoke insert, update, delete on public.cases from authenticated;
revoke update (status) on public.cases from authenticated;

drop policy if exists cases_update_status_reviewer on public.cases;

revoke insert on public.case_review_log from authenticated;
revoke usage, select on sequence public.case_review_log_id_seq from authenticated;

drop policy if exists case_review_log_insert_reviewer on public.case_review_log;

comment on table public.case_review_log is
  'Append-only human review evidence. Inserts are allowed only through record_case_review().';

comment on function public.record_case_review(text, text, text) is
  'Records a human review action and updates workflow status atomically. Direct authenticated writes are denied.';

-- -----------------------------------------------------------------------------
-- Delivery events: record first, correlate now or on a later retry
-- -----------------------------------------------------------------------------
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
  v_event_row_id bigint;
  v_event_case_id uuid;
  v_event_state text;
  v_case_id uuid;
  v_current text;
  v_rank_new integer;
  v_rank_current integer;
begin
  if p_event_id is null or length(p_event_id) < 1 or length(p_event_id) > 200 then
    raise exception 'Invalid event id';
  end if;
  if p_state not in ('accepted', 'delivered', 'failed') then
    raise exception 'Unsupported delivery state';
  end if;

  insert into public.email_events (event_id, event_type, notification_state, message_id)
  values (
    left(p_event_id, 200),
    left(coalesce(p_event_type, 'unknown'), 100),
    p_state,
    left(p_message_id, 200)
  )
  on conflict (event_id) do nothing
  returning id, case_id, notification_state
  into v_event_row_id, v_event_case_id, v_event_state;

  if v_event_row_id is null then
    select id, case_id, notification_state
    into v_event_row_id, v_event_case_id, v_event_state
    from public.email_events
    where event_id = left(p_event_id, 200);

    if v_event_row_id is null then
      raise exception 'Delivery event could not be recorded';
    end if;

    -- A correlated event has already been considered. An uncorrelated event
    -- is retried below; this is the race the old function lost.
    if v_event_case_id is not null then
      return 'duplicate';
    end if;
  end if;

  select c.id, c.notification_state
  into v_case_id, v_current
  from public.cases c
  where (p_reference is not null and c.reference = p_reference)
     or (p_message_id is not null and c.provider_message_id = p_message_id)
  order by
    case when p_reference is not null and c.reference = p_reference then 0 else 1 end,
    c.submitted_at
  limit 1;

  if v_case_id is null then
    return 'unmatched';
  end if;

  update public.email_events
  set case_id = v_case_id
  where id = v_event_row_id
    and case_id is null;

  v_rank_new := case v_event_state when 'accepted' then 1 when 'failed' then 2 else 3 end;
  v_rank_current := case v_current when 'accepted' then 1 when 'failed' then 2 when 'delivered' then 3 else 0 end;

  -- Delivered is terminal. A late "sent" event cannot overwrite a bounce, and
  -- no event can move a delivered case backwards.
  if v_rank_new <= v_rank_current then
    return 'ignored';
  end if;

  update public.cases
  set notification_state = v_event_state,
      notification_updated_at = now(),
      provider_message_id = coalesce(provider_message_id, p_message_id)
  where id = v_case_id;

  return 'applied';
end;
$$;

revoke all on function public.apply_email_event(text, text, text, text, text) from public;
revoke all on function public.apply_email_event(text, text, text, text, text) from anon, authenticated;
grant execute on function public.apply_email_event(text, text, text, text, text) to service_role;

comment on function public.apply_email_event(text, text, text, text, text) is
  'Deduplicated delivery-event reconciliation. An unmatched event stays eligible for a later retry.';
