-- Read-only migration 0012 catalog checks. No case payload or notes are read.
with checks as (
  select 'history RPC installed with authenticated execute' check_name,
    has_function_privilege('authenticated', 'public.get_case_review_history(text,timestamptz,bigint)', 'EXECUTE') passed
  union all
  select 'safety RPC installed with authenticated execute',
    has_function_privilege('authenticated', 'public.get_queue_safety_disclosures(timestamptz,text)', 'EXECUTE')
  union all
  select 'anonymous cannot execute history or safety RPCs',
    not has_function_privilege('anon', 'public.get_case_review_history(text,timestamptz,bigint)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.get_queue_safety_disclosures(timestamptz,text)', 'EXECUTE')
  union all
  select 'authenticated cannot execute the private history helper',
    not has_function_privilege('authenticated', 'public.case_review_history_page(uuid,timestamptz,bigint)', 'EXECUTE')
  union all
  select 'direct review-log reads remain denied',
    not has_table_privilege('authenticated', 'public.case_review_log', 'SELECT')
  union all
  select 'both cursor indexes exist',
    to_regclass('public.case_review_log_history_cursor_idx') is not null
    and to_regclass('public.cases_safety_disclosures_idx') is not null
)
select check_name, passed from checks order by passed, check_name;
