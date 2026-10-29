# Staging run evidence — <YYYY-MM-DD>

> **Template.** Replace the angle-bracket fields, fill every `Actual` and `Verdict` cell, and delete this banner. A blank verdict is `NOT RUN`, not a pass.
>
> Procedure: [docs/STAGING-RUNBOOK.md](../../docs/STAGING-RUNBOOK.md). Package rules: [README.md](README.md).

**Verdicts:** `PASS` (observed, output attached) · `FAIL` (observed, output attached) · `NOT RUN` (not attempted or no output).

---

## Run metadata

| Field | Value |
|---|---|
| Run date and window (UTC) | `<YYYY-MM-DD HH:MM–HH:MM>` |
| Staging project ref | `<ref>` |
| Commit deployed (`git rev-parse HEAD`) | `<sha>` |
| Operator | `<name>` |
| Verifier (second pair of eyes) | `<name>` |
| Reviewer account label (no address) | `<label>` |
| Pre-run snapshot / backup reference | `<ref>` |
| Intake state confirmed | `QUESTIONNAIRE_APPROVED=false` |
| Migrations before the run | remote `0001`–`0005`; local `0006`–`0010` |

---

## 0. Preconditions (runbook §0)

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| Target is the staging project, not production | ref matches the dashboard | | |
| `supabase --version` and `psql --version` recorded | both present | | |
| Credentials supplied from the secret store | names only in this record | | |
| Test data is synthetic | `@example.com`, `555` number | | |
| `npm run check:db` | 0 failures | | |
| `deno test --allow-env --lock=deno.lock supabase/functions/tests/` | 0 failed (86 at this baseline; record the actual count) | | |

Local pre-check output is optional; if either local check is cited, prepend its output to `00-baseline.log`.

---

## 1. Baseline (runbook §1)

Log: `00-baseline.log`

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| Remote migration list | `0001`–`0005` applied | | |
| Local migration list | `0006`–`0010` pending | | |
| Remote already contains `0006`+ | no — if yes, stop and reconcile | | |
| Commit recorded | SHA matches the deployed build | | |

---

## 2. Apply `0006`–`0008` (runbook §2)

Log: `01-checks-0006-0008.log` — append the apply output before the checks output.

| File | Expected | Actual | Verdict |
|---|---|---|---|
| `0006_notification_terminal_state.sql` | exit 0, no error | | |
| `0007_marketing_revocation.sql` | exit 0, no error | | |
| `0008_marketing_revocation_idempotency.sql` | exit 0, no error | | |
| Migration repair for each version | recorded, or the CLI's rejection documented | | |

Do not use `supabase db push` here; record if it was used, because it invalidates this window's ordering.

---

## 3. Catalog checks after the first window (runbook §3)

Log: `01-checks-0006-0008.log`

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| Row count | 23 (22 assertions + summary) | | |
| `0006` rows | all `t` | | |
| `0007` rows | all `t` | | |
| `0008` row | `t` | | |
| `0009` rows | `f` — expected at this point | | |
| `0010` rows | `f` — expected at this point | | |
| Any unexpected failure outside `0009`/`0010` | none | | |

---

## 4. Functions and environment (runbook §4)

Log: `02-functions-deploy.log`

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| `submit-case` deployed | `verify_jwt = false` | | |
| `revoke-marketing` deployed | `verify_jwt = false` | | |
| `email-events` deployed | `verify_jwt = false` | | |
| `retry-case-notifications` deployed | `verify_jwt = false` | | |
| `sync-marketing-suppressions` deployed | `verify_jwt = false` | | |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | set (names only) | | |
| `APP_ORIGIN` | set to the portal origin | | |
| `RATE_LIMIT_SALT` | set | | |
| `CRON_SECRET` | set | | |
| `RESEND_API_KEY`, `EMAIL_WEBHOOK_SECRET` | set, or recorded as not needed for this run | | |
| `MARKETING_SUPPRESSION_WEBHOOK_URL` / `_SECRET` | **unset** for step 8.5 | | |
| Secret values in this log | none | | |

---

## 5. `0009` and the portal (runbook §5)

Log: `03-checks-0009.log` — append the build, apply and deploy output before the checks output.

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| `npm run build` before the window | passes | | |
| `0009_audited_case_access.sql` applied | exit 0 | | |
| Portal deployed from the same commit | yes | | |
| Queue still loads after deployment | yes | | |
| Case open works after deployment | yes | | |
| Row count in checks | 23 | | |
| `0009` rows | all `t` | | |
| `0010` rows | `f` — still expected | | |
| Window length (case opens unavailable) | recorded | | |

A queue that works while every case open fails is the expected half-state. Record it, keep the window short, and do not re-grant direct selects to "fix" it.

---

## 6. `0010` and the retry worker (runbook §6)

Log: `04-checks-0010.log` — append the apply and worker deploy output before the checks output.

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| `0010_notification_retry_window.sql` applied | exit 0 | | |
| `retry-case-notifications` redeployed | yes, same commit | | |
| Checks | all rows `t` | | |
| Summary row | `SUMMARY — every check passed` = `t` | | |

---

## 7. Audited case read (runbook §7)

Log: `05-audited-read.log` · screenshots: `05-queue.png`, `05-case.png` (optional)

### 7.1 Synthetic case

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| Insert `LPP-2026-STG001` | 1 row, no error | | |
| Reviewer allowlist row exists | at least one row for the account used | | |
| Intake remained locked | `QUESTIONNAIRE_APPROVED=false` throughout | | |

### 7.2 Sign-in and AAL2 step-up

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| Password grant | `200`, AAL1 token | | |
| TOTP factor present or enrolled | one factor | | |
| Challenge | `200` | | |
| Verify with the current code | `200`, AAL2 token | | |
| Portal treated the session as stepped up | queue loads | | |

If the project's auth version differs, complete the flow in the portal and record that the token-based checks were `NOT RUN`.

### 7.3 Queue and audited open

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| Case appears in `/portal` | once | | |
| Queue columns | first name, last name, state, status, notification state, unanswered only | | |
| Answer text in the queue | none | | |
| Case opens | answers, consents and draft summary render | | |
| `case_review_log` row | at least one `opened`, actor = reviewer, written before the payload returned | | |

```sql
-- paste the result, not just the count
select action, actor, created_at
from public.case_review_log
where case_id = (select id from public.cases where reference = 'LPP-2026-STG001')
order by created_at desc;
```

### 7.4 Direct reads must fail

| Request | Expected | Actual | Verdict |
|---|---|---|---|
| AAL2 `GET /rest/v1/cases` | `401`/`403`, `42501` | | |
| AAL2 `GET /rest/v1/case_corrections` | `401`/`403`, `42501` | | |
| AAL2 `GET /rest/v1/case_review_log` | `401`/`403`, `42501` | | |
| AAL2 `GET /rest/v1/marketing_revocations` | `401`/`403`, `42501` | | |
| `anon` `GET /rest/v1/case_summaries` | denied, or empty with `42501` | | |
| Any `200` with rows | none — a hit is a stop condition | | |

### 7.5 Locally covered, not repeated here

| Check | Evidence | Verdict |
|---|---|---|
| Log-write failure withholds the payload | `npm run check:db` case `case is not returned when the access log fails` | |

---

## 8. Customer marketing withdrawal (runbook §8)

Log: `06-withdrawal.log`

### 8.1 First request

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| HTTP status | `202` | | |
| Body | `{"status":"received"}` | | |

### 8.2 Replay with the same key

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| HTTP status | `202` | | |
| Revocations for the reference, `phone` | `1` | | |
| Outbox rows for `15125550199` | `1`, `pending` | | |
| Suppression row updated again | no | | |

### 8.3 New intent, new key

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| HTTP status | `202` | | |
| Revocations | `2` | | |
| Outbox state | `pending` | | |
| Request prefix differs from 8.2 | yes | | |

### 8.4 Suppression guard

| Call | Expected | Actual | Verdict |
|---|---|---|---|
| `assert_marketing_send_allowed('phone', '+1 (512) 555-0199')` | raises `Contact is suppressed for marketing` | | |
| `assert_marketing_send_allowed('phone', '+15125550001')` | `true` | | |

### 8.5 Vendor worker, unconfigured

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| Response | `200`, `{"inspected":0,"synced":0,"failed":0,"provider":"not_configured"}` | | |
| Pending row after the call | still `pending` | | |
| Manual `mark_marketing_suppression_synced` used | **no** | | |

### 8.6 Email-only scope

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| Email request with key `staging-revoke-003` | `202` | | |
| Email suppressed | yes | | |
| Phone suppressed by the email-only request | **no** — current documented behaviour; record, do not treat as a defect | | |

### 8.7 Rate limit (last)

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| Requests 1–5 from the same client | processed | | |
| Sixth request in ten minutes | `429` | | |

---

## 9. Notification retry window (runbook §9)

Log: `07-retry-window.log`

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| 25-hour case: `claim_case_notification` | `0` rows | | |
| 25-hour case: `notification_retry_backlog` | lists `LPP-2026-STG002` | | |
| 23-hour case: `claim_case_notification` | `1` row | | |
| Attempt count after the claim | incremented | | |
| AAL2 `GET /rest/v1/notification_retry_backlog` | `401`/`403` or `42501` | | |
| Synthetic rows cleaned up | counts back to the pre-run baseline | | |

---

## 10. Evidence set

| Item | Expected | Actual | Verdict |
|---|---|---|---|
| `EVIDENCE.md` verdicts | every row filled | | |
| Logs `00`–`07` | all present | | |
| Screenshots (if allowed) | named `05-queue.png`, `05-case.png` | | |
| Redaction scan | no credential-shaped strings | | |
| `MANIFEST.sha256` | verifies with `shasum -a 256 -c` | | |

---

## 11. Rollback and failure handling (runbook §11)

| Question | Answer |
|---|---|
| Was any step stopped? | `<no / yes — step>` |
| Was a snapshot restored? | `<no / yes — reference>` |
| Was an applied migration edited? | `<no — must be no>` |
| Was a direct select re-granted? | `<no — must be no>` |
| If `0009`/portal were mismatched, how long? | `<minutes>` |

---

## 12. Completion checklist

Fill `Recorded` with the observed value or `PASS`/`FAIL`, not a tick.

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

**Run result:** `<COMPLETE / INCOMPLETE / ABORTED>` — a run is complete only when all twelve rows carry an observed value and the manifest verifies.

**Operator:** `<name>` `<date>`  **Verifier:** `<name>` `<date>`

---

## 13. What this run does not establish

- No production deployment, migration or rollback.
- No provider delivery or vendor propagation: step 8.5 proves the not-configured path only.
- No scheduler tick, retention execution, deletion or restore drill.
- No auth-setting confirmation on the hosted project (sign-up off, anonymous off).
- No legal, clinical or product approval. Those stay in the [sign-off pack](../2026-10-28-owner-signoff-pack.md) and [LAUNCH-GATES.md](../../docs/LAUNCH-GATES.md).
