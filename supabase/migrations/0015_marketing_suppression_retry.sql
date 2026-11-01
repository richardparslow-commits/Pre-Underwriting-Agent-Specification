-- Heal s3-opt-out-dropped-after-five-failures: a vendor outage longer than
-- five scheduled syncs must not permanently drop a do-not-contact propagation.
-- Additive forward migration; 0007 stays unchanged where it was applied.
--
-- A row remains in the work list until a worker records a vendor
-- acknowledgement. `attempts` is diagnostic: it shows how often the vendor has
-- failed, but it is not a permanent cap. Retrying is safe because the worker
-- sends the deterministic `suppress:<channel>:<address>` idempotency key, so a
-- vendor that already accepted the suppression can deduplicate a replay.
create or replace function public.pending_marketing_suppressions(p_limit integer default 100)
returns table (
  channel text,
  address_normalized text,
  source_case_reference text,
  request_id uuid,
  attempts integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.channel,
    s.address_normalized,
    s.source_case_reference,
    s.request_id,
    s.attempts,
    s.created_at
  from public.marketing_suppression_sync s
  where s.status in ('pending', 'failed')
  order by s.created_at
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

revoke all on function public.pending_marketing_suppressions(integer) from public;
revoke all on function public.pending_marketing_suppressions(integer) from anon, authenticated;
grant execute on function public.pending_marketing_suppressions(integer) to service_role;

comment on function public.pending_marketing_suppressions(integer) is
  'Suppression outbox work list. A row stays eligible until a worker records a vendor acknowledgement; attempts is diagnostic, not a permanent retry cap.';
