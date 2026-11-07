-- A case's first review-log page is bounded to twenty rows. Opening the case
-- writes an audit row each time, so ordinary reloads can fill that page with
-- "Opened" and hide the clarification that prompted the review. Keep every
-- audit row, but coalesce repeat opens by the same reviewer in an eight-hour
-- window when building the first page. Older history pages remain raw so the
-- complete audit trail stays reachable.

create or replace function public.case_review_history_page(
  p_case_id uuid, p_before_at timestamptz, p_before_id bigint
) returns jsonb language sql set search_path = public, pg_temp as $$
  with selected as materialized (
    select id, action, actor, created_at, note,
      case
        when action = 'opened' and created_at > now() - interval '8 hours'
        then row_number() over (
          partition by actor, action
          order by created_at desc, id desc
        )
      end as recent_open_rank
    from public.case_review_log
    where case_id = p_case_id
      and (p_before_at is null or (created_at, id) < (p_before_at, p_before_id))
    order by created_at desc, id desc
  ), visible as (
    select id, action, actor, created_at, note
    from selected
    where p_before_at is not null
       or action <> 'opened'
       or created_at <= now() - interval '8 hours'
       or recent_open_rank = 1
  ), page as (
    select * from visible order by created_at desc, id desc limit 20
  )
  select jsonb_build_object(
    'entries', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id::text, 'action', action, 'actor', actor, 'created_at', created_at, 'note', note
    ) order by created_at desc, id desc) from page), '[]'::jsonb),
    'next_cursor', case when (select count(*) from visible) > 20 then (
      select jsonb_build_object('created_at', created_at, 'id', id::text)
      from page order by created_at, id limit 1
    ) else null end
  );
$$;
revoke all on function public.case_review_history_page(uuid,timestamptz,bigint)
  from public, anon, authenticated;
