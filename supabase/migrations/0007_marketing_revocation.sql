-- Life Policy Pilot — customer marketing revocation and suppression propagation
-- =============================================================================
-- 0003 added an operator-only revocation RPC and a suppression table. It did
-- not give a customer a way to withdraw marketing consent, and it had no path
-- for a suppression to reach a vendor or an outbound sender.
--
-- This migration adds:
--   1. A service-role-only RPC that matches a case reference plus the email or
--      phone recorded on that case and writes the suppression and audit rows.
--      A non-match is returned as `{ recorded: false }`, not as an enumeration
--      signal.
--   2. A durable `marketing_suppression_sync` outbox. A suppression insert or
--      update queues a row; a vendor worker can read pending rows and mark them
--      synced. No vendor credentials are configured in this build.
--   3. A service-role-only send guard that raises when the contact is
--      suppressed. Every future outbound marketing path must call it
--      immediately before sending.
--
-- It is safe to re-run. It does not rewrite a case payload or delete a row.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Revocation evidence: source and request correlation
-- -----------------------------------------------------------------------------
alter table public.marketing_revocations
  add column if not exists source text not null default 'operator';

alter table public.marketing_revocations
  add column if not exists request_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.marketing_revocations'::regclass
      and conname = 'marketing_revocations_source_check'
  ) then
    alter table public.marketing_revocations
      add constraint marketing_revocations_source_check
      check (source in ('operator', 'customer_web', 'stop_reply', 'email'));
  end if;
end;
$$;

create unique index if not exists marketing_revocations_request_unique
  on public.marketing_revocations (request_id, channel, address_normalized)
  where request_id is not null;

create index if not exists marketing_revocations_case_created_idx
  on public.marketing_revocations (case_reference, created_at desc);

-- -----------------------------------------------------------------------------
-- Canonical US phone matching
-- -----------------------------------------------------------------------------
-- 0003 only stripped punctuation, so "5125550199" and "+1 512 555 0199" were
-- different suppression addresses. Customers type both forms. Canonicalise to
-- 11 digits with a leading 1 for storage and comparison; the legacy forms are
-- still accepted by is_contact_suppressed below.
create or replace function public.normalize_phone(p_value text)
returns text
language sql
immutable
as $$
  select case
    when length(regexp_replace(coalesce(p_value, ''), '\D', '', 'g')) = 10
      then '1' || regexp_replace(coalesce(p_value, ''), '\D', '', 'g')
    when length(regexp_replace(coalesce(p_value, ''), '\D', '', 'g')) = 11
      and left(regexp_replace(coalesce(p_value, ''), '\D', '', 'g'), 1) = '1'
      then regexp_replace(coalesce(p_value, ''), '\D', '', 'g')
    else regexp_replace(coalesce(p_value, ''), '\D', '', 'g')
  end;
$$;

create or replace function public.normalize_contact(p_channel text, p_value text)
returns text
language sql
immutable
as $$
  select case
    when p_channel = 'phone' then public.normalize_phone(p_value)
    when p_channel = 'email' then lower(btrim(coalesce(p_value, '')))
    else null
  end;
$$;

-- Canonicalise rows written by an earlier build where no canonical duplicate
-- already exists. A conflicting row is left in place; the suppression check
-- below still recognises both forms.
update public.contact_suppressions s
set address_normalized = public.normalize_phone(s.address_normalized)
where s.channel = 'phone'
  and s.address_normalized <> public.normalize_phone(s.address_normalized)
  and not exists (
    select 1
    from public.contact_suppressions other
    where other.channel = 'phone'
      and other.address_normalized = public.normalize_phone(s.address_normalized)
  );

update public.marketing_revocations r
set address_normalized = public.normalize_phone(r.address_normalized)
where r.channel = 'phone'
  and r.address_normalized <> public.normalize_phone(r.address_normalized);

create or replace function public.is_contact_suppressed(p_channel text, p_address text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contact_suppressions s
    where s.channel = p_channel
      and (
        s.address_normalized = public.normalize_contact(p_channel, p_address)
        or (
          p_channel = 'phone'
          and s.address_normalized = regexp_replace(coalesce(p_address, ''), '\D', '', 'g')
        )
        or (
          p_channel = 'phone'
          and length(regexp_replace(coalesce(p_address, ''), '\D', '', 'g')) = 11
          and left(regexp_replace(coalesce(p_address, ''), '\D', '', 'g'), 1) = '1'
          and s.address_normalized = substr(
            regexp_replace(coalesce(p_address, ''), '\D', '', 'g'),
            2
          )
        )
      )
  );
$$;

revoke all on function public.is_contact_suppressed(text, text) from public;
revoke all on function public.is_contact_suppressed(text, text) from anon, authenticated;
grant execute on function public.is_contact_suppressed(text, text) to service_role;

-- -----------------------------------------------------------------------------
-- Vendor propagation outbox
-- -----------------------------------------------------------------------------
create table if not exists public.marketing_suppression_sync (
  channel text not null check (channel in ('phone', 'email')),
  address_normalized text not null,
  source_case_reference text,
  request_id uuid,
  status text not null default 'pending'
    check (status in ('pending', 'synced', 'failed')),
  attempts integer not null default 0,
  last_attempted_at timestamptz,
  last_error text,
  synced_at timestamptz,
  synced_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (channel, address_normalized)
);

comment on table public.marketing_suppression_sync is
  'Do-not-contact propagation outbox. A row is pending until a vendor/CRM worker marks it synced. Suppression itself is already effective in contact_suppressions.';

alter table public.marketing_suppression_sync enable row level security;

drop policy if exists marketing_suppression_sync_select_reviewer
  on public.marketing_suppression_sync;
create policy marketing_suppression_sync_select_reviewer
  on public.marketing_suppression_sync
  for select
  to authenticated
  using (public.is_reviewer());

revoke all on public.marketing_suppression_sync from anon, authenticated;
grant select on public.marketing_suppression_sync to authenticated;

-- Existing suppressions predate the outbox. Queue them so a vendor sync does
-- not silently miss contacts that were suppressed by the operator.
insert into public.marketing_suppression_sync
  (channel, address_normalized, source_case_reference, status)
select
  s.channel,
  s.address_normalized,
  s.source_case_reference,
  'pending'
from public.contact_suppressions s
on conflict (channel, address_normalized) do nothing;

-- Any suppression written by the operator RPC or directly by a service-role
-- caller must enter the propagation outbox. Updating an existing suppression
-- re-queues it, because the vendor may not have the new reason or reference.
create or replace function public.enqueue_marketing_suppression_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.marketing_suppression_sync
    (channel, address_normalized, source_case_reference, status)
  values
    (new.channel, new.address_normalized, new.source_case_reference, 'pending')
  on conflict (channel, address_normalized) do update
    set source_case_reference = coalesce(
          excluded.source_case_reference,
          marketing_suppression_sync.source_case_reference
        ),
        status = 'pending',
        attempts = 0,
        last_attempted_at = null,
        last_error = null,
        synced_at = null,
        synced_by = null,
        updated_at = now();

  return new;
end;
$$;

comment on function public.enqueue_marketing_suppression_sync() is
  'Queues every contact suppression for vendor propagation. The suppression is effective before the vendor acknowledges it.';

revoke all on function public.enqueue_marketing_suppression_sync() from public;

drop trigger if exists contact_suppressions_enqueue_sync on public.contact_suppressions;
create trigger contact_suppressions_enqueue_sync
  after insert or update on public.contact_suppressions
  for each row
  execute function public.enqueue_marketing_suppression_sync();

-- -----------------------------------------------------------------------------
-- Customer revocation: reference plus the contact on file
-- -----------------------------------------------------------------------------
create or replace function public.request_marketing_revocation(
  p_reference text,
  p_phone text default null,
  p_email text default null,
  p_reason text default null,
  p_source text default 'customer_web',
  p_request_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case public.cases%rowtype;
  v_reference text;
  v_phone text;
  v_email text;
  v_case_phone text;
  v_case_email text;
  v_reason text;
  v_source text;
  v_recorded boolean := false;
  v_channels jsonb := '[]'::jsonb;
begin
  v_source := coalesce(nullif(btrim(p_source), ''), 'customer_web');
  if v_source not in ('operator', 'customer_web', 'stop_reply', 'email') then
    raise exception 'Unsupported revocation source';
  end if;

  v_reference := upper(btrim(coalesce(p_reference, '')));
  if v_reference = '' then
    return jsonb_build_object('recorded', false, 'channels', '[]'::jsonb);
  end if;

  v_phone := public.normalize_contact('phone', p_phone);
  v_email := public.normalize_contact('email', p_email);

  if v_phone = '' and v_email = '' then
    return jsonb_build_object('recorded', false, 'channels', '[]'::jsonb);
  end if;

  select * into v_case
  from public.cases
  where reference = v_reference;

  if v_case.id is null then
    return jsonb_build_object('recorded', false, 'channels', '[]'::jsonb);
  end if;

  v_case_phone := public.normalize_contact('phone', v_case.payload #>> '{lead,phone}');
  v_case_email := public.normalize_contact('email', v_case.payload #>> '{lead,email}');
  v_reason := left(
    coalesce(nullif(btrim(p_reason), ''), 'Customer marketing revocation'),
    500
  );

  -- A phone suppression covers both marketing calls and texts: both use the
  -- same telephone number and both check the 'phone' channel before sending.
  if v_phone <> '' and v_case_phone <> '' and v_phone = v_case_phone then
    insert into public.contact_suppressions
      (channel, address_normalized, reason, source_case_reference)
    values
      ('phone', v_phone, v_reason, v_reference)
    on conflict (channel, address_normalized) do update
      set reason = excluded.reason,
          source_case_reference = excluded.source_case_reference;

    insert into public.marketing_revocations
      (case_reference, channel, address_normalized, reason, recorded_by, source, request_id)
    values
      (v_reference, 'phone', v_phone, v_reason, v_source, v_source, p_request_id)
    on conflict do nothing;

    update public.marketing_suppression_sync
    set request_id = coalesce(p_request_id, request_id),
        updated_at = now()
    where channel = 'phone' and address_normalized = v_phone;

    v_channels := v_channels || to_jsonb('phone'::text);
    v_recorded := true;
  end if;

  if v_email <> '' and v_case_email <> '' and v_email = v_case_email then
    insert into public.contact_suppressions
      (channel, address_normalized, reason, source_case_reference)
    values
      ('email', v_email, v_reason, v_reference)
    on conflict (channel, address_normalized) do update
      set reason = excluded.reason,
          source_case_reference = excluded.source_case_reference;

    insert into public.marketing_revocations
      (case_reference, channel, address_normalized, reason, recorded_by, source, request_id)
    values
      (v_reference, 'email', v_email, v_reason, v_source, v_source, p_request_id)
    on conflict do nothing;

    update public.marketing_suppression_sync
    set request_id = coalesce(p_request_id, request_id),
        updated_at = now()
    where channel = 'email' and address_normalized = v_email;

    v_channels := v_channels || to_jsonb('email'::text);
    v_recorded := true;
  end if;

  return jsonb_build_object('recorded', v_recorded, 'channels', v_channels);
end;
$$;

comment on function public.request_marketing_revocation(text, text, text, text, text, uuid) is
  'Matches a reference and the contact on file, then suppresses the matching channel. A non-match returns recorded=false without revealing whether the case exists.';

revoke all on function public.request_marketing_revocation(text, text, text, text, text, uuid) from public;
revoke all on function public.request_marketing_revocation(text, text, text, text, text, uuid) from anon, authenticated;
grant execute on function public.request_marketing_revocation(text, text, text, text, text, uuid) to service_role;

-- -----------------------------------------------------------------------------
-- Outbound guard: no sender may pass a suppressed contact
-- -----------------------------------------------------------------------------
create or replace function public.assert_marketing_send_allowed(
  p_channel text,
  p_address text
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

  if public.normalize_contact(p_channel, p_address) = '' then
    raise exception 'Contact address is required';
  end if;

  if public.is_contact_suppressed(p_channel, p_address) then
    raise exception 'Contact is suppressed for marketing';
  end if;

  return true;
end;
$$;

comment on function public.assert_marketing_send_allowed(text, text) is
  'Raises when a contact is suppressed. Every future marketing sender must call this immediately before an outbound attempt.';

revoke all on function public.assert_marketing_send_allowed(text, text) from public;
revoke all on function public.assert_marketing_send_allowed(text, text) from anon, authenticated;
grant execute on function public.assert_marketing_send_allowed(text, text) to service_role;

-- -----------------------------------------------------------------------------
-- Vendor worker interface
-- -----------------------------------------------------------------------------
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
    and s.attempts < 5
  order by s.created_at
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

revoke all on function public.pending_marketing_suppressions(integer) from public;
revoke all on function public.pending_marketing_suppressions(integer) from anon, authenticated;
grant execute on function public.pending_marketing_suppressions(integer) to service_role;

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
    and address_normalized = public.normalize_contact(p_channel, p_address);

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
    and address_normalized = public.normalize_contact(p_channel, p_address);

  return found;
end;
$$;

revoke all on function public.mark_marketing_suppression_failed(text, text, text) from public;
revoke all on function public.mark_marketing_suppression_failed(text, text, text) from anon, authenticated;
grant execute on function public.mark_marketing_suppression_failed(text, text, text) to service_role;
