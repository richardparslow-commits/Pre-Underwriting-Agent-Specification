-- The worker reports the exact key returned by pending_marketing_suppressions.
-- Prefer that key, including legacy ten-digit phones, before accepting a
-- normalized address from an operator. Canonical and legacy rows can coexist.
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
