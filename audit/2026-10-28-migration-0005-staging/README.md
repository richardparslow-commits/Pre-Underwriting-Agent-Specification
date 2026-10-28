# Migration 0005 — staging verification

**Date:** 28 October 2026
**Target:** Supabase project `mndgqpoxfupiuqlojpoe`, session pooler `aws-0-us-east-1.pooler.supabase.com`
**Status:** `0005` was already applied; the hosted view and its RLS boundary are verified. A live AAL2 HTTP queue response was not captured because the project has no reviewer identity and Auth test-user creation was blocked.
**Scope:** This is staging evidence only. It is not a production migration, a launch approval, or a legal/clinical/compliance approval.

## 1. Migration state

`npx supabase@2.122.0 migration list --db-url …` reported:

```text
Local  | Remote
0001   | 0001
0002   | 0002
0003   | 0003
0004   | 0004
0005   | 0005
```

`0005` was already present, so no DDL was executed during this check. The view exists on the host, and `supabase_migrations.schema_migrations` records all five versions.

## 2. Hosted view and access checks

| Check | Result |
|---|---|
| View columns | `reference`, `submitted_at`, `status`, `notification_state`, `notification_attempts`, `notification_detail`, `notification_updated_at`, `crisis_disclosure`, `first_name`, `last_name`, `residence_state`, `unanswered` |
| Forbidden columns (`payload`, `answers`, `answer_text`, `answer_values`, `fields`, `details`, `review_note`) | **none present** |
| View option | `security_invoker=true` |
| Grants | `anon` select **false**; `authenticated` select **true** |
| Underlying `cases` RLS | **enabled** |
| `select payload from case_summaries` | rejected with `42703` (column does not exist) |
| Anonymous `case_summaries` query | rejected with `42501` (permission denied) |
| AAL1 reviewer role (temporary, rolled back) | **0** summaries |
| AAL2 reviewer role (temporary, rolled back) | **1** summary; `unanswered = 1` |
| Cleanup | 0 cases, 0 reviewers, 0 temporary auth users |

The AAL1/AAL2 proof used a temporary auth user, reviewer allowlist row and labelled case inside one database transaction, then rolled back. It exercised the real hosted RLS policy and `security_invoker` view, but it did not use a GoTrue-issued JWT.

## 3. Live HTTP queue check

The exact client query in `src/lib/api.ts` selects only:

```text
reference, submitted_at, status, notification_state, crisis_disclosure,
first_name, last_name, residence_state, unanswered
```

The deployed view has no payload or answer columns, so this query cannot return them. Anonymous REST access is already denied with `42501`.

A live AAL2 HTTP response was **not** captured. The project had zero reviewers and zero auth users. Creating a test identity through the supported sign-up endpoint was rejected for reserved domains and then hit the project’s email sign-up rate limit; hand-built Auth rows produced a GoTrue `500`. This is a missing test identity, not a failure of `0005`. Do not report the live HTTP reviewer queue as verified until a real reviewer account completes TOTP and the 200 response is captured.

## 4. Cleanup and credential handling

All temporary rows were rolled back or deleted; the final counts are zero. No case, auth user or reviewer remains.

The database password supplied in chat was used for this verification. It was already exposed in chat and **must be rotated**. It is not written to this package, any tracked file, or the verification log; the log redacts connection URLs. No access token, publishable key or MFA secret is stored in this package.

## 5. Remaining actions

1. Create a real reviewer in Auth, add the `reviewers` row, enrol TOTP, and capture an AAL2 `GET /rest/v1/case_summaries` response with exactly the nine summary keys.
2. Rebuild and deploy the client, then verify the portal queue network response.
3. Apply `0001`–`0005` to production only after separate approval; do not treat this staging result as production evidence.
4. Rotate the chat-supplied database password.

Raw command output: [`verification.log`](verification.log).
