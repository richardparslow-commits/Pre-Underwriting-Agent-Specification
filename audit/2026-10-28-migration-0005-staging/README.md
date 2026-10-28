# Migration 0005 — staging verification

**Date:** 28 October 2026
**Target:** Supabase project `mndgqpoxfupiuqlojpoe`, session pooler `aws-0-us-east-1.pooler.supabase.com`
**Status:** `0005` was already applied; the hosted view, its RLS boundary, and the live AAL2 HTTP queue response are verified with a labelled temporary reviewer. No production migration or launch approval is claimed.
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

The AAL1/AAL2 role proof used a temporary auth user, reviewer allowlist row and labelled case inside one database transaction, then rolled back. It exercised the real hosted RLS policy and `security_invoker` view, but it did not use a GoTrue-issued JWT. Section 3 records the separate GoTrue password + TOTP HTTP proof.

## 3. Live HTTP queue check

The exact client query in `src/lib/api.ts` selects only:

```text
reference, submitted_at, status, notification_state, crisis_disclosure,
first_name, last_name, residence_state, unanswered
```

The deployed view has no payload or answer columns, so this query cannot return them. Anonymous REST access is already denied with `42501`.

A live AAL2 HTTP response **was captured** on 28 October 2026 with a labelled temporary reviewer, a reviewer allowlist row and one labelled case. The flow was:

1. password grant returned `200` and an `aal1` access token;
2. TOTP factor enrolment returned `200` with a secret;
3. `POST /auth/v1/factors/{id}/challenge` returned `200`;
4. `POST /auth/v1/factors/{id}/verify` returned `200` and an `aal2` access token;
5. `GET /rest/v1/case_summaries` with the exact client select returned `200`, **1 row**, the exact nine summary keys and `unanswered = 1`;
6. the AAL1 token returned `200` with **0 rows**;
7. `select=payload` returned `400` with `42703`;
8. an anonymous request returned `401`.

The temporary Auth row was provisioned directly because the supported sign-up endpoint was rate-limited on confirmation email; the password grant and TOTP challenge/verify were genuine GoTrue flows. The temporary user and case were deleted; the final counts are zero. Raw output: [`http-queue-verification.log`](http-queue-verification.log).

## 4. Cleanup and credential handling

All temporary rows were rolled back or deleted; the final counts are zero. No case, auth user or reviewer remains.

The database password supplied in chat was used for this verification. It was already exposed in chat and **must be rotated**. It is not written to this package, any tracked file, or either verification log; the logs redact connection URLs and print no access token, publishable key or MFA secret.

## 5. Remaining actions

1. Enrol a real staff reviewer (the hosted test used a labelled temporary account) and repeat the AAL2 queue check.
2. Rebuild and deploy the client, then verify the portal queue network response.
3. Apply `0001`–`0005` to production only after separate approval; do not treat this staging result as production evidence.
4. Rotate the chat-supplied database password.

Raw command output: [`verification.log`](verification.log) and [`http-queue-verification.log`](http-queue-verification.log).
