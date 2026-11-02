-- Heal s8-bounce-after-timed-out-send-lost-on-retry / s7 timeout wording.
-- Local send state is not provider evidence. Preserve both independently,
-- serialize event application with send completion, and recover old ignored events.
create or replace function public.apply_email_event(
 p_event_id text,p_event_type text,p_reference text,p_message_id text,p_state text
)
returns text language plpgsql security definer set search_path=public
as $$
declare
 v_event public.email_events%rowtype;
 v_case public.cases%rowtype;
 v_inserted bigint;
 v_duplicate boolean;
 v_rank_new integer;
 v_rank_provider integer;
 v_rank_current integer;
 v_provider text;
 v_state text;
begin
 if p_event_id is null or length(p_event_id)<1 or length(p_event_id)>200 then
  raise exception 'Invalid event id';
 end if;
 if p_state is null or p_state not in ('accepted','delivered','failed') then
  raise exception 'Unsupported delivery state';
 end if;
 insert into public.email_events(event_id,event_type,notification_state,message_id)
 values(p_event_id,left(coalesce(p_event_type,'unknown'),100),p_state,left(p_message_id,200))
 on conflict(event_id) do nothing returning id into v_inserted;
 v_duplicate := v_inserted is null;
 -- Replays use the original recorded state/message and cannot rebind a case.
 select * into strict v_event from public.email_events where event_id=p_event_id for update;
 select c.* into v_case from public.cases c
 where (v_event.case_id is not null and c.id=v_event.case_id)
 or (v_event.case_id is null and
     ((p_reference is not null and c.reference=p_reference)
      or (v_event.message_id is not null and c.provider_message_id=v_event.message_id)))
 order by case when p_reference is not null and c.reference=p_reference then 0 else 1 end,c.submitted_at
 limit 1 for update;
 if not found then return 'unmatched'; end if;
 update public.email_events set case_id=v_case.id where id=v_event.id and case_id is null;

 v_rank_new := case v_event.notification_state when 'accepted' then 1 when 'failed' then 2 else 3 end;
 v_rank_provider := case v_case.notification_provider_state when 'accepted' then 1 when 'failed' then 2 when 'delivered' then 3 else 0 end;
 v_rank_current := case v_case.notification_state when 'accepted' then 1 when 'failed' then 2 when 'delivered' then 3 else 0 end;
 v_provider := case when v_rank_new>v_rank_provider then v_event.notification_state else v_case.notification_provider_state end;
 v_state := case when greatest(v_rank_new,v_rank_provider)>v_rank_current then v_provider else v_case.notification_state end;
 -- A local timeout may already read failed. Equal case rank must not hide a
 -- newly authoritative bounce; compare the provider evidence independently.
 if v_provider is not distinct from v_case.notification_provider_state
    and v_state is not distinct from v_case.notification_state then
  return case when v_duplicate and v_event.case_id is not null then 'duplicate' else 'ignored' end;
 end if;
 update public.cases set
  notification_state=v_state,notification_provider_state=v_provider,
  notification_updated_at=now(),provider_message_id=coalesce(provider_message_id,v_event.message_id),
  notification_detail=case when v_provider='failed' then json_build_object('provider','resend','messageId',v_event.message_id,'note','Email provider reported a delivery failure')::text
    when v_provider='delivered' then json_build_object('provider','resend','messageId',v_event.message_id,'note','Delivery confirmed by the email provider')::text
    else notification_detail end,
  notification_claimed_at=case when v_provider in ('failed','delivered') then null else notification_claimed_at end,
  notification_claimed_by=case when v_provider in ('failed','delivered') then null else notification_claimed_by end,
  notification_next_attempt_at=case when v_provider in ('failed','delivered') then null else notification_next_attempt_at end
 where id=v_case.id;
 return 'applied';
end;
$$;

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
  if v_provider = 'failed' then
    -- An already-claimed sender can finish after the bounce. Release its lease
    -- without replacing authoritative evidence or scheduling another send.
    update public.cases set notification_state='failed',
      notification_claimed_at=null,notification_claimed_by=null,
      notification_next_attempt_at=null where reference=p_reference;
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
    and c.notification_provider_state is distinct from 'failed'
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


revoke all on function public.apply_email_event(text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.complete_case_notification(text,text,text,text) from public,anon,authenticated;
revoke all on function public.claim_case_notification(text,text) from public,anon,authenticated;
grant execute on function public.apply_email_event(text,text,text,text,text) to service_role;
grant execute on function public.complete_case_notification(text,text,text,text) to service_role;
grant execute on function public.claim_case_notification(text,text) to service_role;

-- Repair existing correlated events that older rank/duplicate guards ignored.
-- One strongest ledger event per case is sufficient; delivery outranks bounce.
-- No message is sent and no clinical payload or consent is changed.
do $$
declare e record;
begin
 for e in select distinct on(case_id) event_id,event_type,message_id,notification_state,case_id
  from public.email_events where case_id is not null
  order by case_id,case notification_state when 'delivered' then 3 when 'failed' then 2 else 1 end desc,received_at desc,id desc
 loop
  perform public.apply_email_event(e.event_id,e.event_type,null,e.message_id,e.notification_state);
 end loop;
end;
$$;
