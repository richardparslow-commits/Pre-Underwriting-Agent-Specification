-- Life Policy Pilot — marketing revocation replay safety
-- =============================================================================
-- 0007 accepts an optional request id, but a repeated customer request with the
-- same id still performs the suppression upsert. The contact_suppressions
-- trigger then re-queues the vendor outbox, even if that row has already been
-- marked synced. A browser retry therefore creates duplicate audit evidence and
-- can re-open a completed propagation.
--
-- This forward migration makes the customer RPC replay-safe: when the same
-- request id, channel, address, suppression and outbox row already exist, it
-- returns the recorded channel without writing again. A new request id is still
-- allowed to re-queue propagation, so a genuinely new withdrawal is not hidden.
--
-- It is safe to re-run. It changes no case payload or consent evidence.

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
    -- The whole triple must still exist before treating this as a replay. If a
    -- suppression or outbox row was removed manually, continue and rebuild it.
    if p_request_id is not null
       and exists (
         select 1
         from public.marketing_revocations r
         where r.request_id = p_request_id
           and r.channel = 'phone'
           and r.address_normalized = v_phone
       )
       and exists (
         select 1
         from public.contact_suppressions s
         where s.channel = 'phone'
           and s.address_normalized = v_phone
       )
       and exists (
         select 1
         from public.marketing_suppression_sync q
         where q.channel = 'phone'
           and q.address_normalized = v_phone
       )
    then
      -- Replay: no update means the contact_suppressions trigger cannot reset
      -- an already-synced outbox row to pending.
      null;
    else
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
    end if;

    v_channels := v_channels || to_jsonb('phone'::text);
    v_recorded := true;
  end if;

  if v_email <> '' and v_case_email <> '' and v_email = v_case_email then
    if p_request_id is not null
       and exists (
         select 1
         from public.marketing_revocations r
         where r.request_id = p_request_id
           and r.channel = 'email'
           and r.address_normalized = v_email
       )
       and exists (
         select 1
         from public.contact_suppressions s
         where s.channel = 'email'
           and s.address_normalized = v_email
       )
       and exists (
         select 1
         from public.marketing_suppression_sync q
         where q.channel = 'email'
           and q.address_normalized = v_email
       )
    then
      null;
    else
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
    end if;

    v_channels := v_channels || to_jsonb('email'::text);
    v_recorded := true;
  end if;

  return jsonb_build_object('recorded', v_recorded, 'channels', v_channels);
end;
$$;

comment on function public.request_marketing_revocation(text, text, text, text, text, uuid) is
  'Matches a reference and the contact on file, then suppresses the matching channel. A repeated request id is a no-op that cannot re-open a synced outbox row. A non-match returns recorded=false without revealing whether the case exists.';

revoke all on function public.request_marketing_revocation(text, text, text, text, text, uuid) from public;
revoke all on function public.request_marketing_revocation(text, text, text, text, text, uuid) from anon, authenticated;
grant execute on function public.request_marketing_revocation(text, text, text, text, text, uuid) to service_role;
