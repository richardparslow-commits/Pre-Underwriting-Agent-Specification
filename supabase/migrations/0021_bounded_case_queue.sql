-- Heal: bound payload/answer projection before computing queue summaries.
-- Exact totals still count metadata across the queue; no health answers are returned.
create index if not exists cases_queue_page_idx
  on public.cases (submitted_at desc, reference desc);

create or replace function public.case_queue_page_data(
  p_before_at timestamptz, p_before_reference text
) returns jsonb language sql stable set search_path = public, pg_temp as $$
  with selected as materialized (
    (select reference, submitted_at, status, notification_state, crisis_disclosure, residence_state, payload
     from public.cases where p_before_at is null
     order by submitted_at desc, reference desc limit 26)
    union all
    (select reference, submitted_at, status, notification_state, crisis_disclosure, residence_state, payload
     from public.cases where p_before_at is not null
       and (submitted_at, reference) < (p_before_at, p_before_reference)
     order by submitted_at desc, reference desc limit 26)
  ), page as materialized (
    select * from selected order by submitted_at desc, reference desc limit 25
  )
  select jsonb_build_object(
    'entries', coalesce((select jsonb_agg(jsonb_build_object(
      'reference', reference, 'submitted_at', submitted_at, 'status', status,
      'notification_state', notification_state, 'crisis_disclosure', crisis_disclosure,
      'first_name', payload #>> '{lead,firstName}', 'last_name', payload #>> '{lead,lastName}',
      'residence_state', coalesce(residence_state, payload #>> '{lead,state}'),
      'unanswered', case when jsonb_typeof(payload -> 'answers') = 'array' then (
        select count(*)::integer from jsonb_array_elements(payload -> 'answers') answer
        where answer ->> 'disposition' = 'unresolved'
      ) else 0 end
    ) order by submitted_at desc, reference desc) from page), '[]'::jsonb),
    'total', (select count(*) from public.cases),
    'head', (select jsonb_build_object('submitted_at', submitted_at, 'reference', reference)
      from public.cases order by submitted_at desc, reference desc limit 1),
    'next_cursor', case when (select count(*) from selected) > 25 then (
      select jsonb_build_object('submitted_at', submitted_at, 'reference', reference)
      from page order by submitted_at, reference limit 1
    ) else null end
  );
$$;
revoke all on function public.case_queue_page_data(timestamptz,text) from public, anon, authenticated;

create or replace function public.get_case_queue_page(
  p_before_at timestamptz default null, p_before_reference text default null
) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_reviewer() then raise exception 'Not authorised'; end if;
  if (p_before_at is null) <> (p_before_reference is null)
     or not isfinite(p_before_at) or btrim(p_before_reference) = '' then
    raise exception 'Invalid queue cursor';
  end if;
  return public.case_queue_page_data(p_before_at, p_before_reference);
end;
$$;
revoke all on function public.get_case_queue_page(timestamptz,text) from public, anon;
grant execute on function public.get_case_queue_page(timestamptz,text) to authenticated;
comment on function public.get_case_queue_page(timestamptz,text) is
  'Metadata-only queue for allowlisted AAL2 reviewers. Indexed selection is limited before answer counting; exact total and head share the statement snapshot. No payload or contact address is returned.';
