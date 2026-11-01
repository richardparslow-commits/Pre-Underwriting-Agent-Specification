-- Heal s2-overlapping-sync-double-counts-attempts: two scheduled runs could
-- read the same outbox row, send it twice and count two failures for one vendor
-- outage. Claim the batch atomically with a lease so an overlapping worker
-- skips rows another worker owns, and a crashed worker's rows return when the
-- lease expires.
-- Additive forward migration; 0015 stays unchanged where it was applied.
alter table public.marketing_suppression_sync
  add column if not exists claimed_at timestamptz,
  add column if not exists claimed_by text;

create index if not exists marketing_suppression_sync_claim_idx
  on public.marketing_suppression_sync (created_at)
  where status in ('pending', 'failed');

create or replace function public.claim_marketing_suppressions(
  p_limit integer default 100,
  p_worker text default null,
  p_lease_seconds integer default 600
)
returns table (
  channel text,
  address_normalized text,
  source_case_reference text,
  request_id uuid,
  attempts integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker text := left(coalesce(nullif(btrim(p_worker), ''), 'worker'), 200);
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 500));
  v_lease integer := greatest(60, least(coalesce(p_lease_seconds, 600), 3600));
begin
  return query
  with candidate as (
    select s.channel, s.address_normalized
    from public.marketing_suppression_sync s
    where s.status in ('pending', 'failed')
      and (
        s.claimed_at is null
        or s.claimed_at < now() - make_interval(secs => v_lease)
      )
    order by s.created_at
    limit v_limit
    for update skip locked
  ), claimed as (
    update public.marketing_suppression_sync s
    set claimed_at = now(),
        claimed_by = v_worker,
        updated_at = now()
    from candidate c
    where s.channel = c.channel
      and s.address_normalized = c.address_normalized
    returning
      s.channel,
      s.address_normalized,
      s.source_case_reference,
      s.request_id,
      s.attempts,
      s.created_at
  )
  select * from claimed;
end;
$$;

revoke all on function public.claim_marketing_suppressions(integer, text, integer) from public;
revoke all on function public.claim_marketing_suppressions(integer, text, integer) from anon, authenticated;
grant execute on function public.claim_marketing_suppressions(integer, text, integer) to service_role;

comment on function public.claim_marketing_suppressions(integer, text, integer) is
  'Atomically claims up to p_limit suppression outbox rows for one worker. A claimed row is skipped until its lease expires; the mark functions clear the claim.';

-- Both acknowledgement paths release the claim so a later run sees the row (a
-- failure) or the row leaves the work list (success).
create or replace function public.mark_marketing_suppression_synced(
  p_channel text,
  p_address text,
  p_provider text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_channel not in ('phone', 'email') then
    raise exception 'Unsupported contact channel';
  end if;

  update public.marketing_suppression_sync
  set status = 'synced',
      synced_at = now(),
      synced_by = left(coalesce(nullif(btrim(p_provider), ''), 'operator'), 200),
      last_error = null,
      claimed_at = null,
      claimed_by = null,
      updated_at = now()
  where channel = p_channel
    and address_normalized = coalesce(
      (select s.address_normalized from public.marketing_suppression_sync s
       where s.channel = p_channel and s.address_normalized = p_address),
      public.normalize_contact(p_channel, p_address)
    );

  return found;
end;
$$;

revoke all on function public.mark_marketing_suppression_synced(text, text, text) from public;
revoke all on function public.mark_marketing_suppression_synced(text, text, text) from anon, authenticated;
grant execute on function public.mark_marketing_suppression_synced(text, text, text) to service_role;

create or replace function public.mark_marketing_suppression_failed(
  p_channel text,
  p_address text,
  p_error text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_channel not in ('phone', 'email') then
    raise exception 'Unsupported contact channel';
  end if;

  update public.marketing_suppression_sync
  set status = 'failed',
      attempts = attempts + 1,
      last_attempted_at = now(),
      last_error = left(coalesce(p_error, 'Unknown propagation error'), 500),
      claimed_at = null,
      claimed_by = null,
      updated_at = now()
  where channel = p_channel
    and address_normalized = coalesce(
      (select s.address_normalized from public.marketing_suppression_sync s
       where s.channel = p_channel and s.address_normalized = p_address),
      public.normalize_contact(p_channel, p_address)
    );

  return found;
end;
$$;

revoke all on function public.mark_marketing_suppression_failed(text, text, text) from public;
revoke all on function public.mark_marketing_suppression_failed(text, text, text) from anon, authenticated;
grant execute on function public.mark_marketing_suppression_failed(text, text, text) to service_role;
