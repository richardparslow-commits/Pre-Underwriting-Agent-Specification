-- Read-only 0021 catalog checks; no customer data or payload reads.
select 'bounded queue RPC is authenticated-only' check_name,
  has_function_privilege('authenticated','public.get_case_queue_page(timestamptz,text)','EXECUTE')
  and not has_function_privilege('anon','public.get_case_queue_page(timestamptz,text)','EXECUTE') passed
union all
select 'queue projection helper stays private',
  not has_function_privilege('authenticated','public.case_queue_page_data(timestamptz,text)','EXECUTE')
  and not has_function_privilege('anon','public.case_queue_page_data(timestamptz,text)','EXECUTE')
union all
select 'composite queue cursor index exists',to_regclass('public.cases_queue_page_idx') is not null
union all
select 'queue RPC retains reviewer check and statement-snapshot stability',
  position('public.is_reviewer()' in pg_get_functiondef('public.get_case_queue_page(timestamptz,text)'::regprocedure))>0
  and (select provolatile='s' and prosecdef from pg_proc where oid='public.get_case_queue_page(timestamptz,text)'::regprocedure);
