-- Life Policy Pilot — reviewer queue summary projection
-- =============================================================================
-- The queue must not download a case payload. It needs identity, workflow,
-- notification and triage fields plus an unanswered count, but never the
-- health answers. This view is the only queue read path.
--
-- `security_invoker = true` (PostgreSQL 15+, which Supabase provides) makes
-- the caller's RLS policies on public.cases apply. An AAL2 reviewer sees the
-- allowed rows; an AAL1 or anonymous caller sees none, exactly as the
-- underlying table requires.
--
-- No payload, answer text, value, field or detail is exposed. The full payload
-- remains available only through getCase(), which records the opened event.
-- =============================================================================

create or replace view public.case_summaries
with (security_invoker = true)
as
select
  c.reference,
  c.submitted_at,
  c.status,
  c.notification_state,
  c.notification_attempts,
  c.notification_detail,
  c.notification_updated_at,
  c.crisis_disclosure,
  c.payload #>> '{lead,firstName}' as first_name,
  c.payload #>> '{lead,lastName}' as last_name,
  coalesce(c.residence_state, c.payload #>> '{lead,state}') as residence_state,
  case
    when jsonb_typeof(c.payload -> 'answers') = 'array' then (
      select count(*)::integer
      from jsonb_array_elements(c.payload -> 'answers') as answer
      where answer ->> 'disposition' = 'unresolved'
    )
    else 0
  end as unanswered
from public.cases as c;

comment on view public.case_summaries is
  'Reviewer queue projection: workflow and triage metadata only, never answer content. RLS is inherited from public.cases through security_invoker.';

revoke all on public.case_summaries from public;
revoke all on public.case_summaries from anon;
grant select on public.case_summaries to authenticated;
