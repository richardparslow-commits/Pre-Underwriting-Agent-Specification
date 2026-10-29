-- Forward fix: owner-executed views must have explicit read-only caller ACLs.
-- CREATE OR REPLACE VIEW retains earlier/default grants. Granting SELECT does
-- not remove those grants, and table REVOKE does not remove column grants.
revoke all privileges on table public.case_summaries from public, anon, authenticated;

do $$
declare
  v_column text;
begin
  for v_column in
    select attname from pg_attribute
    where attrelid = 'public.case_summaries'::regclass
      and attnum > 0 and not attisdropped
  loop
    execute format(
      'revoke all privileges (%I) on table public.case_summaries from public, anon, authenticated',
      v_column
    );
  end loop;
end;
$$;

grant select on table public.case_summaries to authenticated;
comment on view public.case_summaries is
  'Read-only metadata queue for allowlisted AAL2 reviewers. All mutations use audited RPCs.';
