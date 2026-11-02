-- Read-only 0020 catalog checks; no customer contact addresses, evidence or payloads.
select 'withdrawal RPC is authenticated-only' check_name,
  has_function_privilege('authenticated', 'public.get_case_marketing_revocations(text,timestamptz,bigint)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.get_case_marketing_revocations(text,timestamptz,bigint)', 'EXECUTE') passed
union all
select 'withdrawal helper remains private',
  not has_function_privilege('authenticated', 'public.case_marketing_revocations_page(text,timestamptz,bigint)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.case_marketing_revocations_page(text,timestamptz,bigint)', 'EXECUTE')
union all
select 'withdrawal cursor indexes exist',
  to_regclass('public.marketing_revocations_cursor_idx') is not null
  and to_regclass('public.marketing_revocations_channel_latest_idx') is not null
union all
select 'case read includes separate current phone evidence',
  position('latest_phone_revocation' in pg_get_functiondef('public.open_case_for_review(text)'::regprocedure)) > 0;
