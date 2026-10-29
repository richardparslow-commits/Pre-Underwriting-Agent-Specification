# Staging deployment runbook — migrations 0006–0010

**Status:** prepared and locally checked, **not executed against a hosted project.** No staging credentials were available for this run, so this document is a procedure and a verification plan, not deployment evidence.

**Scope:** apply `0006`–`0010`, deploy the matching functions and portal build, then exercise the audited case read and the customer marketing withdrawal end to end with labelled non-customer data.

**Why `0010` is included:** the requested range was `0006`–`0009`. `0010` is in the same commit and the current retry worker queries `notification_first_attempted_at`, which does not exist until `0010` is applied. Deploying the worker without `0010` makes every retry run fail; applying `0010` without the worker leaves old rows unclaimed. They ship together.

**What this run can prove:** the migrations apply cleanly, the grants and RPC boundaries behave as designed, a reviewer can read a case only through the audited path, and a customer withdrawal is recorded, suppressible and replay-safe on this project.

**What it cannot prove:** production readiness, provider delivery, vendor propagation, retention execution, legal or clinical approval. Those stay in [LAUNCH-GATES.md](LAUNCH-GATES.md) and the [sign-off pack](../audit/2026-10-28-owner-signoff-pack.md).

---

## 0. Preconditions and guardrails

- **Staging project only.** Confirm the project ref against the dashboard before every command. Never run this against the production project.
- **Tools:** Supabase CLI (`supabase --version`), `psql` 15+, `curl`, `jq`, Node 22 and Deno 2.9.6 for the local pre-check.
- **Credentials:** `SUPABASE_ACCESS_TOKEN` and the database connection string come from the operator's secret store. Never commit them, echo them, or paste them into an issue. The anon key is public by design; the service-role key is not.
- **Data:** synthetic only. Use a reserved example address (`…@example.com`) and a 555 number; never enter a real applicant's health information.
- **Intake stays locked.** Keep `QUESTIONNAIRE_APPROVED=false`. Do not enable it to create a test case; insert the labelled case with the service role instead.
- **Take a snapshot first.** Record the migration list and, if the plan allows, a database backup. Migrations are additive but `0009` revokes direct reads, so a bad pairing with the portal is visible immediately.
- **Pair the code with the schema:**
  - `0009` + the portal build that calls `open_case_for_review` (they must ship together; each without the other breaks reviewer case opens);
  - `0010` + the retry worker in this commit.
- **Stop on the first failure.** Do not edit an applied migration; write a forward migration instead.

Local pre-check before touching staging (proves the chain applies twice and the checks resolve):

```bash
npm run check:db
npx --yes --package=deno@2.9.6 deno test --allow-env --lock=deno.lock supabase/functions/tests/
```

## 1. Record the baseline

```bash
git rev-parse HEAD
supabase login            # or export SUPABASE_ACCESS_TOKEN
supabase link --project-ref "$STAGING_PROJECT_REF"
supabase migration list
```

Record the commit and the local/remote migration columns. Expected: remote shows `0001`–`0005`; `0006`–`0010` are local only. If remote already shows any of them, stop and reconcile before applying.

Save the baseline output:

```bash
mkdir -p "audit/2026-10-28-staging-run-$(date +%Y%m%d)"
{ git rev-parse HEAD; supabase migration list; } \
  | tee "audit/2026-10-28-staging-run-$(date +%Y%m%d)/00-baseline.log"
```

## 2. Apply 0006–0008

These are additive and backward compatible.

```bash
export STAGING_DB_URL='postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres'

for version in 0006 0007 0008; do
  file=$(ls supabase/migrations/${version}_*.sql)
  echo "== applying $file"
  psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f "$file"
done
```

If `psql` is not permitted, paste the same files, one at a time, into the SQL editor in that order. Do not use `supabase db push` here: it applies every pending migration, including `0009` and `0010`, before the matching code is deployed.

Record the application so the CLI does not think they are pending:

```bash
for version in 0006 0007 0008; do
  supabase migration repair --status applied "$version"
done
```

If the CLI rejects the numeric version, skip the repair, record the three versions in the evidence log, and rely on the catalog checks below. Do not re-run a file that already succeeded.

## 3. Check the schema after the first window

```bash
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 \
  -f supabase/ops/staging-runbook-checks.sql \
  | tee "audit/2026-10-28-staging-run-$(date +%Y%m%d)/01-checks-0006-0008.log"
```

Expected: every `0006`, `0007` and `0008` row is `t`. `0009` and `0010` rows are `f` at this point; that is expected, not a regression.

## 4. Deploy the functions and their environment

```bash
supabase functions deploy \
  submit-case \
  revoke-marketing \
  email-events \
  retry-case-notifications \
  sync-marketing-suppressions \
  --project-ref "$STAGING_PROJECT_REF"
```

`supabase/config.toml` already sets `verify_jwt = false` for these five. Confirm the deployed settings rather than assuming.

Set secrets from a gitignored file or the dashboard. Required names:

| Secret | Needed for this run |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | every service-role function |
| `APP_ORIGIN` | portal origin used in the notification email |
| `RATE_LIMIT_SALT` | durable submission and revocation limiting |
| `CRON_SECRET` | both scheduled workers |
| `RESEND_API_KEY`, `EMAIL_WEBHOOK_SECRET` | notification delivery (optional for step 5) |
| `MARKETING_SUPPRESSION_WEBHOOK_URL`, `MARKETING_SUPPRESSION_WEBHOOK_SECRET` | vendor propagation (leave unset to prove the not-configured path) |

Never print a secret value into the evidence log.

## 5. Apply 0009 and deploy the portal together

Build and publish the portal from the same commit first, but do not send traffic to it until `0009` is applied. The current portal opens cases through `open_case_for_review`; the migration is what removes the direct reads it no longer uses.

```bash
npm ci --ignore-scripts
npm run build                    # must pass before the window opens

psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/0009_audited_case_access.sql

supabase migration repair --status applied 0009
```

Then deploy the built site immediately. Expect a short window in which reviewer case opens fail; the queue summary continues to work. If the window cannot be kept short, schedule it.

Re-run the checks: all `0009` rows must now be `t`, and only `0010` rows may remain `f`.

## 6. Apply 0010 and deploy the retry worker

```bash
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/0010_notification_retry_window.sql

supabase migration repair --status applied 0010

supabase functions deploy retry-case-notifications \
  --project-ref "$STAGING_PROJECT_REF"
```

Re-run the checks. Every row must now be `t`, including `SUMMARY — every check passed`.

## 7. End-to-end: audited case read

### 7.1 Create a labelled synthetic case

Run in the SQL editor or with `psql` as the database owner. This bypasses the locked intake on purpose.

```sql
insert into public.cases (reference, questionnaire_version, submitted_at, residence_state, payload)
values (
  'LPP-2026-STG001',
  '2026.10-draft.9',
  now(),
  'TX',
  jsonb_build_object(
    'reference', 'LPP-2026-STG001',
    'submittedAt', now(),
    'relationship', 'self',
    'questionnaireVersion', '2026.10-draft.9',
    'lead', jsonb_build_object(
      'firstName', 'Staging',
      'lastName', 'Synthetic',
      'email', 'staging-review@example.com',
      'phone', '+15125550199',
      'state', 'TX'
    ),
    'answers', '[]'::jsonb,
    'consents', '[]'::jsonb,
    'acknowledgements', '[]'::jsonb,
    'crisisDisclosure', false,
    'flags', '[]'::jsonb
  )
);
```

Confirm the reviewer allowlist row exists for the account you will use:

```sql
select user_id, email from public.reviewers;
```

### 7.2 Sign in and step up to AAL2

Open `/portal`, sign in as the reviewer, enrol the TOTP factor if this account has none, then complete the challenge. The portal will not call `listCases()` before the step-up.

If you need an AAL2 token for the REST checks, the GoTrue calls the client makes are:

```bash
# AAL1 password grant
SESSION=$(curl -sS "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "content-type: application/json" \
  -d '{"email":"'"$REVIEWER_EMAIL"'","password":"'"$REVIEWER_PASSWORD"'"}')
AAL1=$(jq -r .access_token <<<"$SESSION")

# List the enrolled factor, challenge it, then verify with the current 6-digit code
curl -sS "$SUPABASE_URL/auth/v1/factors" -H "Authorization: Bearer $AAL1"
curl -sS -X POST "$SUPABASE_URL/auth/v1/factors/$FACTOR_ID/challenge" \
  -H "Authorization: Bearer $AAL1" -H "content-type: application/json" -d '{}'
curl -sS -X POST "$SUPABASE_URL/auth/v1/factors/$FACTOR_ID/verify" \
  -H "Authorization: Bearer $AAL1" -H "content-type: application/json" \
  -d '{"challenge_id":"'"$CHALLENGE_ID"'","code":"'"$TOTP_CODE"'"}'
```

Take the `access_token` from the verify response as `$AAL2`. If the project's auth version differs, complete the flow in the portal instead and skip the token-based checks.

### 7.3 Queue and audited open

1. Load `/portal`. Confirm the case appears once, with only first name, last name, state, status, notification state and unanswered count. No answer text.
2. Open the case. Confirm the answers, consents and draft summary render.
3. Confirm the access event was written **before** the case was returned:

```sql
select action, actor, created_at
from public.case_review_log
where case_id = (select id from public.cases where reference = 'LPP-2026-STG001')
order by created_at desc;
```

Expected: at least one `opened` row with the reviewer's email.

### 7.4 Direct reads must fail

```bash
for path in cases case_corrections case_review_log marketing_revocations; do
  echo "== $path"
  curl -sS -o /tmp/direct.json -w '%{http_code}\n' \
    "$SUPABASE_URL/rest/v1/$path?select=*&limit=1" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $AAL2"
  cat /tmp/direct.json | jq -c '.code // .message // .'
done
```

Expected: HTTP `401` or `403` and PostgreSQL code `42501` (`permission denied for table …`) for each table. A `200` with rows is a failure — stop.

Also confirm `anon` sees nothing:

```bash
curl -sS -o /tmp/anon.json -w '%{http_code}\n' \
  "$SUPABASE_URL/rest/v1/case_summaries?select=reference" \
  -H "apikey: $ANON_KEY"
```

Expected: `401`/`403` or an empty array with no rows; `42501` for the view is the stronger result.

The "log write fails, payload is withheld" path cannot be triggered safely on a hosted project without DDL. It is covered locally by `npm run check:db` (`case is not returned when the access log fails`); record it as local evidence only.

## 8. End-to-end: customer marketing withdrawal

Keep the form and the function on the same origin expectations: `revoke-marketing` checks `APP_ORIGIN`, and the preflight must allow `Idempotency-Key`.

### 8.1 First request

```bash
curl -sS -o /tmp/revoke1.json -w '%{http_code}\n' \
  -X POST "$SUPABASE_URL/functions/v1/revoke-marketing" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "content-type: application/json" \
  -H "origin: $APP_ORIGIN" \
  -H "Idempotency-Key: staging-revoke-001" \
  -d '{"reference":"LPP-2026-STG001","phone":"(512) 555-0199","reason":"Staging synthetic withdrawal"}'
cat /tmp/revoke1.json
```

Expected: `202` and `{"status":"received"}`. A non-match is deliberately indistinguishable from a match.

### 8.2 Replay with the same key

Repeat the exact request and key. Expected: `202`, and the database still holds **one** revocation and **one** outbox row:

```sql
select count(*) as revocations
from public.marketing_revocations
where case_reference = 'LPP-2026-STG001' and channel = 'phone';

select channel, status, left(request_id::text, 8) as request_prefix
from public.marketing_suppression_sync
where address_normalized = '15125550199';
```

Expected: `revocations = 1`; one outbox row, `pending`.

### 8.3 A new intent re-queues

Repeat with `Idempotency-Key: staging-revoke-002` and a new reason. Expected: `202`, `revocations = 2`, and the outbox row returns to `pending` with a **different** request prefix (if the vendor worker had marked it synced).

### 8.4 Suppression guard

```sql
select public.assert_marketing_send_allowed('phone', '+1 (512) 555-0199');
```

Expected: error `Contact is suppressed for marketing`.

```sql
select public.assert_marketing_send_allowed('phone', '+15125550001');
```

Expected: `true`.

### 8.5 Vendor propagation path

With `MARKETING_SUPPRESSION_WEBHOOK_URL` and its secret unset:

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/sync-marketing-suppressions" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "content-type: application/json" -d '{}'
```

Expected: `200` and `{"inspected":0,"synced":0,"failed":0,"provider":"not_configured"}`. The pending row must remain pending. **Do not** call `mark_marketing_suppression_synced` manually to make the check look complete; that would fabricate vendor propagation.

### 8.6 Scope caveat

Send one email-only request with `staging-revoke-003` and no phone. Expected: the email is suppressed; the phone remains **not** suppressed. That is the documented current behaviour pending the counsel decision in the [sign-off pack](../audit/2026-10-28-owner-signoff-pack.md) (L-4). Record it; do not treat it as a defect.

### 8.7 Rate limit (last)

`revoke-marketing` allows five requests per ten minutes per hashed client. The sixth request from the same IP returns `429`. Run this last, because it blocks further calls for the window.

## 9. End-to-end: notification retry window (0010)

```sql
-- A case whose first send was 25 hours ago must not be retried.
insert into public.cases
  (reference, questionnaire_version, notification_state,
   notification_attempts, notification_first_attempted_at,
   notification_next_attempt_at, payload)
values
  ('LPP-2026-STG002', '2026.10-draft.9', 'failed',
   1, now() - interval '25 hours', now() - interval '1 minute', '{}'::jsonb);

select * from public.claim_case_notification('LPP-2026-STG002', 'staging-worker');
select reference, notification_state from public.notification_retry_backlog
where reference = 'LPP-2026-STG002';
```

Expected: the claim returns **0 rows**, and the backlog lists the case.

```sql
-- A case inside the window is still retryable.
update public.cases
set notification_first_attempted_at = now() - interval '23 hours',
    notification_next_attempt_at = now() - interval '1 minute'
where reference = 'LPP-2026-STG002';

select * from public.claim_case_notification('LPP-2026-STG002', 'staging-worker');
```

Expected: one row, attempt count incremented. Clean up the synthetic case afterwards.

Also confirm the backlog is not readable by a signed-in user:

```bash
curl -sS -o /tmp/backlog.json -w '%{http_code}\n' \
  "$SUPABASE_URL/rest/v1/notification_retry_backlog?select=reference" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $AAL2"
```

Expected: `401`/`403` or `42501`.

## 10. Evidence to record

Save under `audit/2026-10-28-staging-run-<date>/`. Start from the [staging evidence template](../audit/2026-10-28-staging-evidence-template/README.md), which supplies the per-step record, the expected value for every row and the log names below; then hash the directory:

- baseline commit and `supabase migration list` before and after;
- each `staging-runbook-checks.sql` output;
- function deploy output (versions only, no secrets);
- the `opened` log query result;
- the direct-read status codes and error codes;
- the withdrawal counts, outbox states and guard results;
- the retry-window claim and backlog results;
- screenshots of the portal queue and case view if the project allows them.

Redact addresses and any token. Record command, expected value and actual value per row. A failed check is evidence too; do not delete it or re-run until it passes and keep only the later log.

## 11. Rollback and failure handling

- There are no down migrations. If a window fails, stop, record the failing step, and restore the pre-run snapshot rather than editing an applied file.
- If `0009` is applied without a compatible portal, reviewer case opens fail while the queue still works. Deploy the matching portal immediately; do not re-grant direct table selects to "fix" it, because that reopens `AS-03`.
- If `0010` is applied without the worker, retries stop for old rows only; the claim guard is what prevents duplicates, so do not disable it.
- If the withdrawal replay creates two rows for one key, stop and treat `AS-05` as regressed; capture both request ids before changing anything.
- If any direct read returns rows, stop and treat `AS-03` as regressed; do not continue the remaining checks on that project.

## 12. Completion checklist

| # | Check | Expected | Recorded |
|---|---|---|---|
| 1 | `0006`–`0010` applied | catalog checks all `t` | |
| 2 | Portal + `0009` deployed together | queue and case open work | |
| 3 | Reviewer AAL2 step-up | portal opens; `opened` row written | |
| 4 | Direct table reads | `42501` for cases, corrections, log, revocations | |
| 5 | `anon` queue read | denied | |
| 6 | Withdrawal first request | `202`, one revocation, one pending outbox | |
| 7 | Withdrawal replay | still one revocation; synced outbox not re-opened | |
| 8 | New withdrawal key | second revocation; outbox re-queued | |
| 9 | Suppression guard | suppressed phone raises; unrelated phone allowed | |
| 10 | Vendor worker unconfigured | `provider: not_configured`; row stays pending | |
| 11 | Retry window | 25-hour claim refused and backlogged; 23-hour claim allowed | |
| 12 | Backlog privacy | signed-in read denied | |

**A run is complete only when the table is filled in, the evidence directory exists, and no check is marked passed without an output.** This runbook does not by itself close `SC-03`, `AS-07` or any legal or clinical gate.
