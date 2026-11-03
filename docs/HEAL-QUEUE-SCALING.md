# Bounded queue projection

Heal Nov 1 run: [queue pages read every case](https://app.heal.dev/fa38cc97-45dd-4b98-8550-5fde5c59913c/runs/fae088ee-8575-4656-8440-c5cbc58b432e/defects/s4-queue-page-reads-every-case-1).

The security-barrier summary view could compute unanswered counts over every case before applying the outer page limit. The inspected 2,001-case plan processed 2,001 answer arrays for a 26-row fetch. Migration `0021` adds an indexed, reviewer-only RPC that selects at most 26 case payload rows, then projects metadata and calculates unanswered counts for only the 25 returned entries. An independent exact total and newest-case identity share the same stable statement snapshot. Keyset paging retains full timestamp precision and the reference tie-breaker.

**This does not make exact totals constant-time.** The exact count still examines queue-wide lightweight metadata. The bounded guarantee concerns payload selection and answer-array processing. PostgreSQL planner choice and latency depend on deployed data and statistics; isolated plan evidence is not a hosted latency benchmark.

## Access and rollout

`get_case_queue_page` explicitly requires the allowlisted AAL2 reviewer check before reading cases. Its internal projection helper is not executable by authenticated or anonymous callers. The response contains the same explicit queue metadata fields as before; no payload, health answer, contact address or phone is returned. Audited per-case access and the legacy read-only security-barrier view remain intact.

The frontend uses one RPC call and rejects malformed metadata. Only PostgREST `PGRST202` specifically naming the missing `public.get_case_queue_page` permits the older metadata-view path during staged rollout. Authorization, server, network and malformed-success failures never select that fallback. No missing-RPC result is cached, so later reads adopt the RPC after migration. Until `0021` is hosted, preview remains compatible but uses the existing slower query.

The migration and read-only `supabase/ops/queue-page-checks.sql` are prepared here, not manually applied to hosted Supabase in this repair. The source main-branch Supabase integration may apply migrations after a separately authorized merge. Apply through that authorized rollout and verify the catalog checks before claiming the hosted scaling defect resolved. No Edge Function deployment or secret change is needed.

Public intake remains locked (`QUESTIONNAIRE_APPROVED=false`; Policy Compass `QUESTIONNAIRE_INTAKE_LOCKED=true`). Marketing, MFA, questionnaire wording and consent behavior are unchanged. Preview sync does not authorize Lovable publication.

## Regression evidence

- Five isolated database tests apply all migrations twice and page through 2,001 synthetic cases, including timestamp ties. They check exact totals, newest identity, safe zero state, metadata-only output, reviewer/AAL2 boundaries, helper privacy and read-only catalog checks.
- Actual EXPLAIN ANALYZE of the helper body at first-page and mid-queue cursors uses `cases_queue_page_idx`, selects 26 payload rows and runs 25 answer-array projections in both cases.
- Six new actual Supabase-client transport regressions cover the one-call contract, microsecond cursors, empty state, malformed data, denied/failed responses, invalid cursors and unreachable backend behavior. Ten existing legacy projection tests remain active, now explicitly exercising only the confirmed missing-RPC path.
- Source reviewer suite: 93 passing; combined database reviewer visibility suite: 21 passing. Build and database replay/provider/suppression suites pass.
- Policy Compass runs the same transport fixtures through its actual `listCases` adapter; 34 targeted queue/transport/rendered-hook tests pass with strict typecheck and lint.

All fixture cases exist only in disposable in-memory PostgreSQL; no hosted synthetic case cleanup is required.
