begin;

-- Heal s2-delivery-event-scans-every-case: apply_email_event used to look up a
-- case with reference = p_reference OR provider_message_id = p_message_id.
-- Only reference was indexed, so the OR forced a sequential scan of every case
-- for each delivery event. Index the provider id and make the lookup use one
-- indexed predicate at a time, preserving reference-first correlation.
create index if not exists cases_provider_message_id_idx
  on public.cases (provider_message_id)
  where provider_message_id is not null;

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
 if v_event.case_id is not null then
  select c.* into v_case from public.cases c
  where c.id=v_event.case_id
  for update;
 elsif p_reference is not null then
  select c.* into v_case from public.cases c
  where c.reference=p_reference
  for update;
  -- The provider message id is only a fallback when the reference does not
  -- identify a case, matching the old reference-first ordering.
  if v_case.id is null and v_event.message_id is not null then
   select c.* into v_case from public.cases c
   where c.provider_message_id=v_event.message_id
   order by c.submitted_at
   limit 1 for update;
  end if;
 elsif v_event.message_id is not null then
  select c.* into v_case from public.cases c
  where c.provider_message_id=v_event.message_id
  order by c.submitted_at
  limit 1 for update;
 end if;
 if v_case.id is null then return 'unmatched'; end if;
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

commit;
