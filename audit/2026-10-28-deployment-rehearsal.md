# Deployment rehearsal — 28 October 2026

**Status:** **BLOCKED — external credentials and runtime not available. No hosted verification was executed.**
**Repository baseline:** `main` @ `b51ebf9` (the merge of PR #4).
**Target:** a new, free, non-production Supabase project with labelled test data only.
**Product:** Life Policy Pilot — Pre-Underwriting Agent.

This is a rehearsal-attempt record, not a launch approval and not evidence that hosted MFA, database migrations, edge functions, rate limiting, email delivery or webhook recovery work.

## 1. What was attempted

| Check | Command / surface | Result |
|---|---|---|
| Supabase CLI | `npx --yes supabase@2.122.0 projects list` | **BLOCKED** — `Access token not provided` |
| Browser login | `npx --yes supabase@2.122.0 login` | **BLOCKED** — automatic flow refuses non-TTY environments |
| Pseudo-TTY login | `script` / `expect` wrapper | Reached the browser login link, then required a verification code the tool shell cannot receive; process stopped |
| Supabase dashboard | Preview browser | Reached the sign-in page; no active Supabase session |
| GitHub OAuth | “Continue with GitHub” | Redirected to GitHub sign-in; no active GitHub web session |
| Project link | `npx --yes supabase@2.122.0 status` | **BLOCKED** — not linked; `docker: command not found` |
| Local stack runtime | `docker`, `podman`, `colima`, `podman`, `psql` | None installed |
| Repository Actions secrets | `gh secret list` | Empty — no deploy/test secrets available |
| Rehearsal token files | `.tmp/rehearsal/supabase-token`, `.tmp/rehearsal/resend-key` | Absent |

No Supabase project was created. No migration, function, secret, auth user, MFA factor, test case, email or webhook was sent to a hosted environment.

The one-time CLI login artifacts were removed and the preview browser tab was closed. No access token, login code or Resend key was written to the repository or printed in a log.

## 2. Code-side preflight already evidenced

These checks were run on the same code tree in the 27 October remediation pass. They are **not** hosted evidence.

| Check | Evidence | Result |
|---|---|---|
| Migrations 0001–0004 replay twice | [`2026-10-27-qwencode-remediation/logs/check-db.log`](2026-10-27-qwencode-remediation/logs/check-db.log) | PASS — 0 failures |
| RLS, AAL2, RPC-only reviewer writes, rate-limit RPC, webhook race | same PGlite log | PASS — local isolated database only |
| 36 Deno function tests | [`logs/deno-tests.log`](2026-10-27-qwencode-remediation/logs/deno-tests.log) | PASS — includes fail-closed limiter |
| Server bank / consent policy drift | [`logs/check-server-bank.log`](2026-10-27-qwencode-remediation/logs/check-server-bank.log), [`logs/check-server-policy.log`](2026-10-27-qwencode-remediation/logs/check-server-policy.log) | PASS |
| Production build and bundle scan | [`logs/build.log`](2026-10-27-qwencode-remediation/logs/build.log), [`logs/check-bundle.log`](2026-10-27-qwencode-remediation/logs/check-bundle.log) | PASS |

The PGlite replay is not the hosted Supabase database. The Deno tests do not prove the deployed functions, `verify_jwt` settings, secrets, provider compatibility or auth configuration.

## 3. What remains unverified

- Creating the project and recording its ref, region and organization.
- Applying migrations 0001–0004 through the Supabase CLI and confirming the applied versions in `supabase_migrations.schema_migrations`.
- Deploying `submit-case`, `email-events` and `retry-case-notifications` with the committed `verify_jwt = false` settings.
- The deployed function environment: `APP_ORIGIN`, `RATE_LIMIT_SALT`, `QUESTIONNAIRE_APPROVED`, `RESEND_API_KEY`, `CASE_NOTIFY_FROM`, `EMAIL_WEBHOOK_SECRET`, `CRON_SECRET`.
- A live Origin-allowlist rejection and a live accepted submission.
- A durable-rate-limit `429` after the configured window.
- TOTP enrolment, an aal1 → aal2 step-up, and live reviewer RLS with a non-customer test user.
- Resend provider acceptance and real inbox receipt. Without a key, only the honest `not_sent` path can be checked.
- A real Svix-signed webhook, duplicate suppression, monotonic state, and unmatched-event recovery.
- One scheduler tick from `supabase/ops/retry-schedule.sql`.
- Provider at-rest encryption, backup/PITR settings and deletion-from-backup evidence.

## 4. Completion procedure

Run this only against a **new non-production project** and only with labelled test data. Never paste a token or key into chat, a tracked file or a commit.

```bash
# 1. Authenticate in a real terminal (not this non-TTY tool shell).
npx --yes supabase@2.122.0 login

# 2. Choose an organization and create a clearly labelled rehearsal project.
npx --yes supabase@2.122.0 orgs list
npx --yes supabase@2.122.0 projects create lpp-rehearsal-2026-10-28 \
  --org-id <ORG_ID> --region us-east-1 --db-password '<generated-password>'

# 3. Link and apply all four migrations.
npx --yes supabase@2.122.0 link --project-ref <REF> --password '<generated-password>'
npx --yes supabase@2.122.0 db push

# 4. Set the rehearsal-only secrets. Do not reuse production values.
npx --yes supabase@2.122.0 secrets set --project-ref <REF> \
  APP_ORIGIN=http://localhost:4173 \
  ENVIRONMENT=production \
  RATE_LIMIT_SALT='<random-32+-chars>' \
  QUESTIONNAIRE_APPROVED=true \
  RESEND_API_KEY='<test-key>' \
  CASE_NOTIFY_FROM='Life Policy Pilot <onboarding@resend.dev>' \
  EMAIL_WEBHOOK_SECRET='whsec_<test-secret>' \
  CRON_SECRET='<random-32+-chars>'

# 5. Deploy all three functions with the committed JWT settings.
npx --yes supabase@2.122.0 functions deploy submit-case --project-ref <REF> --no-verify-jwt
npx --yes supabase@2.122.0 functions deploy email-events --project-ref <REF> --no-verify-jwt
npx --yes supabase@2.122.0 functions deploy retry-case-notifications --project-ref <REF> --no-verify-jwt
```

`QUESTIONNAIRE_APPROVED=true` is a **rehearsal-only** exception. The repository still has 0/92 source-verified rows and must not be launched with live intake. Reset it to `false` after the test and delete the project.

### Required assertions

1. **Migrations:** all four versions are present; `cases`, `case_review_log`, `email_events`, `case_deletions`, `marketing_revocations`, `submission_rate_limits` and `app_settings` have RLS enabled.
2. **Origin:** a request with a foreign `Origin` returns `403`; an allowed `Origin` can reach validation.
3. **Submission:** one labelled draft returns `201` with a server-generated `LPP-YYYY-XXXXXX` reference and one case row; replaying the same idempotency key returns the same reference.
4. **Rate limit:** after ten attempts from the same client key, the next attempt returns `429`.
5. **MFA:** the test reviewer can enrol TOTP; an aal1 token sees zero cases and cannot call `record_case_review`; the aal2 token sees the case and the RPC succeeds.
6. **Direct writes:** the aal2 reviewer cannot update `cases.status` or insert `case_review_log` directly.
7. **Email:** the provider accepts the message (`accepted`); do not call that `delivered` until a signed `email.delivered` event is applied.
8. **Webhook:** a valid `email.delivered` event moves the case to `delivered`; a duplicate `svix-id` is ignored; a late `email.sent` cannot regress it; an unmatched event is re-correlated on retry.
9. **Cron:** one `retry-case-notifications` invocation with the `x-cron-secret` header returns a count-only response and leaves no duplicate email.
10. **Cleanup:** delete the test case and auth user, delete the rehearsal project, and revoke the CLI token if it is no longer needed.

## 5. Decision

The deployment rehearsal is **not complete**. The repository is still **not ready for real customer health information**. The code-side controls are unchanged and locally verified, but the live gates remain open until a real non-production project produces the evidence above.

No legal, clinical, vendor, retention or production-readiness gate is resolved by this attempt.
