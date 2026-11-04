begin;

-- Corrections remain append-only. A request identifies one save intent per case
-- and authenticated reviewer, so a lost acknowledgement can be retried safely.
alter table public.case_corrections add column if not exists request_id uuid;
alter table public.case_corrections add column if not exists request_actor uuid;
create unique index if not exists case_corrections_request_idx
  on public.case_corrections(case_id, request_actor, request_id)
  where request_id is not null;

-- Never leave the legacy unconditional insert available as an unsafe fallback.
drop function if exists public.record_case_correction(text, text);
create or replace function public.record_case_correction(
  p_reference text, p_detail text, p_request_id uuid
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_case_id uuid;
  v_actor uuid := auth.uid();
  v_detail text := btrim(coalesce(p_detail, ''));
  v_id bigint;
  v_saved_detail text;
begin
  -- Recheck membership and AAL2 on every call, including replays.
  if not public.is_reviewer() or v_actor is null then raise exception 'Not authorised'; end if;
  if p_request_id is null then raise exception 'Correction request ID is required'; end if;
  if length(v_detail) = 0 then raise exception 'Correction text is required'; end if;
  if length(v_detail) > 4000 then raise exception 'Correction text is too long'; end if;
  select id into v_case_id from public.cases where reference = p_reference;
  if v_case_id is null then raise exception 'Case not found'; end if;

  insert into public.case_corrections(case_id, detail, recorded_by, request_actor, request_id)
    values(v_case_id, v_detail, coalesce(auth.jwt()->>'email', 'reviewer'), v_actor, p_request_id)
    on conflict(case_id, request_actor, request_id) where request_id is not null
    do nothing returning id into v_id;
  if v_id is null then
    -- ON CONFLICT waits for an overlapping insert. This subsequent statement
    -- observes its committed row; a different payload must never replay silently.
    select id, detail into v_id, v_saved_detail from public.case_corrections
      where case_id = v_case_id and request_actor = v_actor and request_id = p_request_id;
    if v_id is null then raise exception 'Correction replay could not be confirmed'; end if;
    if v_saved_detail is distinct from v_detail then
      raise exception 'Correction request already used for different content';
    end if;
  end if;
  return jsonb_build_object('recorded', true, 'correction_id', v_id::text);
end;
$$;
comment on function public.record_case_correction(text,text,uuid) is
  'Reviewer/AAL2-only append-only correction save. Request IDs replay once per case and reviewer; changed payloads fail.';
revoke all on function public.record_case_correction(text,text,uuid) from public, anon;
grant execute on function public.record_case_correction(text,text,uuid) to authenticated;

commit;
