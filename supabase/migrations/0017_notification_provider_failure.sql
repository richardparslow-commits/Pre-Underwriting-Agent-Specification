-- Heal s3-bounce-during-submit-send-overwritten: a bounce webhook can land
-- while submit-case is still awaiting the provider's answer. The send's own
-- completion then wrote `accepted` over the provider's `failed` and the case
-- never healed, because the event was already correlated. Provider evidence is
-- authoritative: a provider failure or delivery cannot be replaced by a later
-- local send result.
-- Additive forward migration; 0006 and 0004 stay unchanged where applied.
alter table public.cases
  add column if not exists notification_provider_state text
  check (notification_provider_state in ('accepted', 'delivered', 'failed'));

-- -----------------------------------------------------------------------------
-- Delivery events: record the provider's evidence, not just the case state
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

  if v_rank_new <= v_rank_current then
    return 'ignored';
  end if;

  update public.cases
  set notification_state = v_event_state,
      notification_provider_state = v_event_state,
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
-- Completion path: provider failure survives the send result
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
  v_provider text;
begin
  if p_state not in ('not_sent', 'queued', 'accepted', 'delivered', 'failed') then
    raise exception 'Unsupported notification state';
  end if;

  select c.notification_state, c.notification_provider_state
  into v_current, v_provider
  from public.cases c
  where c.reference = p_reference
  for update;

  if not found then
    return;
  end if;

  -- Delivered or provider-failed evidence is terminal against a later send
  -- result. The event was already correlated, so a redelivery would answer
  -- duplicate; overwriting it would leave the case permanently wrong.
  if v_current = 'delivered' or v_provider = 'delivered' then
    return;
  end if;
  if v_provider = 'failed' and p_state in ('accepted', 'delivered') then
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

-- -----------------------------------------------------------------------------
-- Direct writes cannot downgrade provider evidence either
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

  if old.notification_provider_state = 'delivered'
     and new.notification_state is distinct from 'delivered' then
    raise exception
      'A provider delivery cannot be overwritten by a later send result';
  end if;

  if old.notification_provider_state = 'failed'
     and new.notification_state = 'accepted' then
    raise exception
      'A provider-reported failure cannot be overwritten by an accepted send';
  end if;

  return new;
end;
$$;

comment on function public.cases_prevent_notification_regression() is
  'Rejects any update that moves a delivered case out of delivered, re-queues it, or overwrites provider delivery/failure evidence.';
