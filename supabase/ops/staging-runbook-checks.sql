-- Life Policy Pilot — staging runbook checks (0006–0010)
-- =============================================================================
-- Read-only. Run in the Supabase SQL editor or with:
--
--   psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f supabase/ops/staging-runbook-checks.sql
--
-- Every row should return passed = true. Failures sort first.
--
-- Run this after each deployment window. Rows for a migration that has not been
-- applied yet are expected to fail until that step is complete; do not treat the
-- first window's 0009/0010 rows as regressions.
--
-- The checks inspect catalog state and grants only. They read no case payload,
-- contact detail or health answer. Behaviour is exercised separately in the
-- runbook, because a SQL editor session does not carry a reviewer JWT.
-- =============================================================================

with checks as (
  -- 0006 — delivered is terminal
  select '0006 — terminal-state trigger installed' as check_name,
         exists (
           select 1 from pg_trigger where tgname = 'cases_delivered_is_terminal'
         ) as passed
  union all
  select '0006 — complete_case_notification present',
         to_regprocedure('public.complete_case_notification(text,text,text,text)') is not null

  -- 0007 — customer revocation and vendor outbox
  union all
  select '0007 — contact_suppressions table',
         to_regclass('public.contact_suppressions') is not null
  union all
  select '0007 — marketing_suppression_sync outbox',
         to_regclass('public.marketing_suppression_sync') is not null
  union all
  select '0007 — revocation source and request-id columns',
         exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'marketing_revocations'
             and column_name = 'source'
         )
         and exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'marketing_revocations'
             and column_name = 'request_id'
         )
  union all
  select '0007 — customer revocation RPC (six arguments)',
         to_regprocedure('public.request_marketing_revocation(text,text,text,text,text,uuid)') is not null
  union all
  select '0007 — outbound send guard',
         to_regprocedure('public.assert_marketing_send_allowed(text,text)') is not null
  union all
  select '0007 — suppression sync RPCs',
         to_regprocedure('public.pending_marketing_suppressions(integer)') is not null
         and to_regprocedure('public.mark_marketing_suppression_synced(text,text,text)') is not null
         and to_regprocedure('public.mark_marketing_suppression_failed(text,text,text)') is not null

  -- 0008 — replay safety
  union all
  select '0008 — replay guard present in the revocation RPC',
         coalesce(
           pg_get_functiondef(
             'public.request_marketing_revocation(text,text,text,text,text,uuid)'::regprocedure
           ) ilike '%marketing_suppression_sync%'
           and pg_get_functiondef(
             'public.request_marketing_revocation(text,text,text,text,text,uuid)'::regprocedure
           ) ilike '%request_id%',
           false
         )

  -- 0009 — audited reviewer access
  union all
  select '0009 — metadata-only queue view',
         to_regclass('public.case_summaries') is not null
  union all
  select '0009 — queue view has no payload or answers column',
         not exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'case_summaries'
             and column_name in ('payload', 'answers')
         )
  union all
  select '0009 — audited open RPC',
         to_regprocedure('public.open_case_for_review(text)') is not null
  union all
  select '0009 — authenticated cannot select cases directly',
         not has_table_privilege('authenticated', 'public.cases', 'SELECT')
  union all
  select '0009 — authenticated cannot select the review log directly',
         not has_table_privilege('authenticated', 'public.case_review_log', 'SELECT')
  union all
  select '0009 — authenticated cannot select corrections directly',
         not has_table_privilege('authenticated', 'public.case_corrections', 'SELECT')
  union all
  select '0009 — authenticated can execute the audited read',
         has_function_privilege(
           'authenticated',
           'public.open_case_for_review(text)',
           'EXECUTE'
         )
  union all
  select '0009 — anonymous cannot read the queue view',
         not has_table_privilege('anon', 'public.case_summaries', 'SELECT')
  union all
  select '0009 — anonymous cannot execute the audited read',
         not has_function_privilege('anon', 'public.open_case_for_review(text)', 'EXECUTE')

  -- 0010 — retries cannot outlive the provider dedupe window
  union all
  select '0010 — first-attempt column exists',
         exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'cases'
             and column_name = 'notification_first_attempted_at'
         )
  union all
  select '0010 — retry backlog view exists',
         to_regclass('public.notification_retry_backlog') is not null
  union all
  select '0010 — claim enforces the 24-hour window',
         coalesce(
           pg_get_functiondef(
             'public.claim_case_notification(text,text)'::regprocedure
           ) ilike '%notification_first_attempted_at%'
           and pg_get_functiondef(
             'public.claim_case_notification(text,text)'::regprocedure
           ) ilike '%24 hours%',
           false
         )
  union all
  select '0010 — authenticated cannot read the retry backlog',
         not has_table_privilege('authenticated', 'public.notification_retry_backlog', 'SELECT')
)
select check_name, passed
from checks
union all
select 'SUMMARY — every check passed', count(*) = 0
from checks
where not passed
order by passed, check_name;
