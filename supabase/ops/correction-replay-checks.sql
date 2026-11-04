-- Read-only deployment catalog verification; no customer payloads or writes.
select '0022 request columns present' as check_name,
  (select count(*)=2 from information_schema.columns where table_schema='public' and table_name='case_corrections' and column_name in ('request_id','request_actor')) as passed
union all select '0022 legacy unsafe RPC absent', to_regprocedure('public.record_case_correction(text,text)') is null
union all select '0022 safe RPC present', to_regprocedure('public.record_case_correction(text,text,uuid)') is not null
union all select '0022 authenticated execute', coalesce(has_function_privilege('authenticated',to_regprocedure('public.record_case_correction(text,text,uuid)'),'execute'),false)
union all select '0022 anonymous execute denied', not coalesce(has_function_privilege('anon',to_regprocedure('public.record_case_correction(text,text,uuid)'),'execute'),true)
union all select '0022 direct writes denied', not has_table_privilege('authenticated','public.case_corrections','INSERT,UPDATE,DELETE')
union all select '0022 unique replay index', exists(select 1 from pg_indexes where schemaname='public' and tablename='case_corrections' and indexname='case_corrections_request_idx' and indexdef like 'CREATE UNIQUE INDEX%');
