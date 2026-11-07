begin;

-- Heal s9-in-flight-retry-spends-submit-limit: a retry could miss the saved-case
-- lookup while the first request was still inserting, consume a second unit,
-- then lose the unique idempotency-key insert and replay. The claim below is
-- written before the counter; a duplicate key returns allowed without another
-- increment. A denied new key removes its claim so a later request is not
-- bypassed by a failed attempt.
create table if not exists public.submission_rate_claims (
  idempotency_key text primary key,
  created_at timestamptz not null default now()
);

comment on table public.submission_rate_claims is
  'One durable claim per submission idempotency key. Prevents in-flight retries from consuming a second rate-limit allowance.';

alter table public.submission_rate_claims enable row level security;
revoke all on public.submission_rate_claims from public, anon, authenticated;

create or replace function public.consume_submission_rate_for_key(
  p_key_hash text,
  p_idempotency_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_count integer;
  v_limit integer := greatest(1, least(coalesce(p_limit, 10), 1000));
  v_seconds integer := greatest(60, least(coalesce(p_window_seconds, 600), 86400));
  v_claimed boolean;
begin
  if p_key_hash is null or length(p_key_hash) < 16 or length(p_key_hash) > 128 then
    raise exception 'Invalid rate-limit key';
  end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 or length(p_idempotency_key) > 128 then
    raise exception 'Invalid idempotency key';
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / v_seconds) * v_seconds);

  insert into public.submission_rate_claims (idempotency_key)
  values (p_idempotency_key)
  on conflict (idempotency_key) do nothing
  returning true into v_claimed;

  -- Another request for the same logical submission already holds the claim.
  -- It owns the one allowance for this key, whether it is still in flight or
  -- has already saved the case.
  if not coalesce(v_claimed, false) then
    return true;
  end if;

  insert into public.submission_rate_limits (key_hash, window_start, count)
  values (p_key_hash, v_window, 1)
  on conflict (key_hash, window_start)
  do update set count = public.submission_rate_limits.count + 1
  returning count into v_count;

  if v_count <= v_limit then
    return true;
  end if;

  -- Do not leave an allowance claim behind for a request that was refused.
  delete from public.submission_rate_claims
  where idempotency_key = p_idempotency_key;
  return false;
end;
$$;

revoke all on function public.consume_submission_rate_for_key(text, text, integer, integer) from public;
revoke all on function public.consume_submission_rate_for_key(text, text, integer, integer) from anon, authenticated;
grant execute on function public.consume_submission_rate_for_key(text, text, integer, integer) to service_role;

commit;
