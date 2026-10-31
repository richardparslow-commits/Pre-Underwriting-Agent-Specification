-- Read-only 0013 catalog checks; never read customer corrections or payloads.
select 'corrections RPC requires authenticated execute' check_name,
  has_function_privilege('authenticated', 'public.get_case_corrections(text,timestamptz,bigint)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.get_case_corrections(text,timestamptz,bigint)', 'EXECUTE') passed
union all
select 'private correction helper cannot be called by browser roles',
  not has_function_privilege('authenticated', 'public.case_corrections_page(uuid,timestamptz,bigint)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.case_corrections_page(uuid,timestamptz,bigint)', 'EXECUTE')
union all
select 'correction cursor index exists', to_regclass('public.case_corrections_cursor_idx') is not null;
