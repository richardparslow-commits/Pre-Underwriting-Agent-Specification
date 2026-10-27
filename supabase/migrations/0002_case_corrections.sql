-- Life Policy Pilot — post-submission corrections
--
-- A submitted case is an immutable snapshot. A correction is recorded beside
-- it, never by editing the original payload. The portal reads this table and
-- the reviewer records entries through a permission-checked RPC.

create table if not exists public.case_corrections (
  id bigserial primary key,
  case_id uuid not null references public.cases (id) on delete cascade,
  detail text not null
    check (length(btrim(detail)) between 1 and 4000),
  recorded_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists case_corrections_case_id_idx
  on public.case_corrections (case_id, created_at desc);

comment on table public.case_corrections is
  'Append-only customer corrections recorded after submission. The original case snapshot is never edited.';

alter table public.case_corrections enable row level security;

drop policy if exists case_corrections_select_reviewer on public.case_corrections;
create policy case_corrections_select_reviewer
  on public.case_corrections
  for select
  to authenticated
  using (public.is_reviewer());

-- No insert/update/delete policy: entries are written only through the
-- permission-checked function below, and are never amended or removed.
revoke all on public.case_corrections from anon;
grant select on public.case_corrections to authenticated;

create or replace function public.record_case_correction(
  p_reference text,
  p_detail text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case_id uuid;
  v_actor text;
  v_detail text;
begin
  if not public.is_reviewer() then
    raise exception 'Not authorised';
  end if;

  v_detail := btrim(coalesce(p_detail, ''));
  if length(v_detail) = 0 then
    raise exception 'Correction text is required';
  end if;
  if length(v_detail) > 4000 then
    raise exception 'Correction text is too long';
  end if;

  select c.id into v_case_id
  from public.cases c
  where c.reference = p_reference;

  if v_case_id is null then
    raise exception 'Case not found';
  end if;

  v_actor := coalesce(auth.jwt() ->> 'email', 'reviewer');

  insert into public.case_corrections (case_id, detail, recorded_by)
  values (v_case_id, v_detail, v_actor);
end;
$$;

comment on function public.record_case_correction(text, text) is
  'Records a post-submission customer correction beside the immutable case snapshot. Reviewer only.';

revoke all on function public.record_case_correction(text, text) from public;
revoke all on function public.record_case_correction(text, text) from anon;
grant execute on function public.record_case_correction(text, text) to authenticated;
