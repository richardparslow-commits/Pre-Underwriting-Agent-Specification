-- Fair due-work selection, per-send leases and fenced completion. Forward-only:
-- 0015's recovery beyond five failures and legacy stored keys remain intact.
alter table public.marketing_suppression_sync
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists claim_token uuid,
  add column if not exists lease_expires_at timestamptz;

create index if not exists marketing_suppression_sync_due_idx
  on public.marketing_suppression_sync(next_attempt_at,created_at,channel,address_normalized)
  where status in ('pending','failed');

create or replace function public.claim_next_marketing_suppression(
  p_worker text,
  p_lease_seconds integer default 600
)
returns table (
  channel text, address_normalized text, source_case_reference text,
  request_id uuid, attempts integer, created_at timestamptz,
  vendor_address text, claim_token uuid, lease_expires_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
declare
  v_lease integer := greatest(60,least(coalesce(p_lease_seconds,600),3600));
begin
  if p_worker is null or btrim(p_worker) = '' or length(p_worker) > 200 then
    raise exception 'Invalid worker identity';
  end if;
  return query
  with candidate as (
    select s.channel,s.address_normalized
    from public.marketing_suppression_sync s
    where s.status in ('pending','failed')
      and s.next_attempt_at <= now()
      and (s.claimed_at is null or
        coalesce(s.lease_expires_at,s.claimed_at + interval '10 minutes') <= now())
    -- A failure advances its due time, so even due-again refusals cannot
    -- monopolize older untouched work. Eligibility is checked BEFORE LIMIT.
    order by s.next_attempt_at,s.created_at,s.channel,s.address_normalized
    limit 1 for update skip locked
  ), claimed as (
    update public.marketing_suppression_sync s
    set claimed_at=now(),claimed_by=p_worker,claim_token=gen_random_uuid(),
        lease_expires_at=now()+make_interval(secs=>v_lease),updated_at=now()
    from candidate c
    where s.channel=c.channel and s.address_normalized=c.address_normalized
    returning s.*
  )
  select s.channel,s.address_normalized,s.source_case_reference,s.request_id,
    s.attempts,s.created_at,public.normalize_contact(s.channel,s.address_normalized),
    s.claim_token,s.lease_expires_at from claimed s;
end;
$$;

create or replace function public.complete_marketing_suppression(
  p_channel text, p_address text, p_worker text, p_claim_token uuid,
  p_state text, p_detail text default null
)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if p_channel not in ('phone','email') or p_state not in ('synced','failed') then
    raise exception 'Unsupported suppression result';
  end if;
  update public.marketing_suppression_sync s
  set status=p_state,
      attempts=case when p_state='failed' then least(s.attempts::bigint+1,2147483647)::integer else s.attempts end,
      last_attempted_at=now(),
      last_error=case when p_state='failed' then left(coalesce(p_detail,'Propagation failed'),500) else null end,
      -- First failure waits one minute; exponential retries cap at one hour.
      -- No attempt count permanently removes an unacknowledged suppression.
      next_attempt_at=case when p_state='failed' then now()+make_interval(secs=>
        least(3600,60*power(2,least(greatest(s.attempts,0),6)))::integer)
        else s.next_attempt_at end,
      synced_at=case when p_state='synced' then now() else s.synced_at end,
      synced_by=case when p_state='synced' then 'marketing-webhook' else s.synced_by end,
      claimed_at=null,claimed_by=null,claim_token=null,lease_expires_at=null,updated_at=now()
  where s.channel=p_channel and s.address_normalized=p_address
    and s.status in ('pending','failed') and s.claimed_by=p_worker
    and s.claim_token=p_claim_token and s.lease_expires_at>now();
  return found;
end;
$$;

-- A fresh/repeated suppression invalidates an in-flight result as well as
-- resetting its retry schedule. The exact stored key is never rewritten.
create or replace function public.enqueue_marketing_suppression_sync()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.marketing_suppression_sync
    (channel,address_normalized,source_case_reference,status,next_attempt_at)
  values (new.channel,new.address_normalized,new.source_case_reference,'pending',now())
  on conflict (channel,address_normalized) do update set
    source_case_reference=coalesce(excluded.source_case_reference,marketing_suppression_sync.source_case_reference),
    status='pending',attempts=0,last_attempted_at=null,last_error=null,
    synced_at=null,synced_by=null,next_attempt_at=now(),claimed_at=null,claimed_by=null,
    claim_token=null,lease_expires_at=null,updated_at=now();
  return new;
end;
$$;

revoke all on function public.claim_next_marketing_suppression(text,integer) from public,anon,authenticated;
revoke all on function public.complete_marketing_suppression(text,text,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.claim_next_marketing_suppression(text,integer) to service_role;
grant execute on function public.complete_marketing_suppression(text,text,text,uuid,text,text) to service_role;
revoke all on function public.enqueue_marketing_suppression_sync() from public,anon,authenticated,service_role;

-- Old workers must fail closed, rather than acknowledge without ownership.
-- The database owner can still perform explicit administrative recovery.
revoke all on function public.claim_marketing_suppressions(integer,text,integer) from public,anon,authenticated,service_role;
revoke all on function public.mark_marketing_suppression_synced(text,text,text) from public,anon,authenticated,service_role;
revoke all on function public.mark_marketing_suppression_failed(text,text,text) from public,anon,authenticated,service_role;

comment on function public.claim_next_marketing_suppression(text,integer) is
  'Service-only single-row due-work claim. Vendor identity is normalized, stored acknowledgement identity is preserved; every lease has a fresh fencing token.';
comment on function public.complete_marketing_suppression(text,text,text,uuid,text,text) is
  'Service-only result accepted once for the current owner/token before lease expiry; failures receive bounded backoff, never a permanent attempt cutoff.';
