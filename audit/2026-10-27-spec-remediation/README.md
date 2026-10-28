# Specification remediation evidence — 27 October 2026

- **Specification:** `Life Policy Pilot  Pre-Underwriting Agent Specification copy.pdf`
- **Repository baseline:** `363aab8` (the audit-preservation commit, on top of audited `173b0a0`)
- **Scope:** close the code-level gaps identified by the Freebuff audit against the product specification. Legal, clinical, product and live-deployment gates were not invented or marked closed.

## What changed

| Finding | Change | Evidence |
|---|---|---|
| F-03 — reviewer RLS bypass | `supabase/migrations/0004_reviewer_write_paths.sql` revokes direct `cases` updates and `case_review_log` inserts, drops the direct-write policies, and keeps `record_case_review` as the SECURITY DEFINER path. | `npm run check:db` proves authenticated direct writes fail and the RPC still updates status and log atomically. |
| F-04 — nested branch revival | `pruneBranchClosedAnswers` now iterates to a fixed point, removing descendants that become unreachable after a parent is removed. | `npm run test:engine` covers `MIL-01 → MIL-02 → MIL-04` close/reopen. |
| F-05 — server phone validation | `validateDraft` now requires a usable phone for phone/text, rejects letters and wrong-length values, and normalises 10/11-digit US numbers; the lead form repeats the same rule. | `npm run test:validation` (5 tests) and the Deno suite (35 tests). |
| F-09 — missing config guidance | `.env.example` now lists `RATE_LIMIT_SALT` and `QUESTIONNAIRE_APPROVED`; `check-docs` fails if either is removed. | `npm run check:docs`. |
| F-10 — unmatched delivery-event race | `apply_email_event` retains an unmatched event and re-correlates it on retry instead of returning `duplicate` forever. | `npm run check:db` simulates event-before-message-id, retries, and verifies `delivered`. |
| F-11 — ledger overclaims | The remediation ledger now marks M-02 **Blocked — Legal**, M-11 **Blocked — Legal/Product**, and M-03 as **92 rows**. | Ledger summary and rows. |

`0004_reviewer_write_paths.sql` is a new migration. It has been replayed twice in isolated PGlite; it has **not** been applied to a hosted Supabase project.

## Specification acceptance tests

| # | Gate | Status after this pass | Remaining |
|---|---|---|---|
| 1 | Question coverage | **Partly** | 0/92 rows are source-verified; 7 windows changed; 28 gaps. Counsel/reviewer sign-off required. |
| 2 | Branch coverage | **Partly — improved** | Nested pruning fixed and tested; seven source windows still differ. |
| 3 | Answer integrity | **Pass — local** | Deterministic engine, distinct states, server canonical rebuild, held/closed content rejected. |
| 4 | Review and submission | **Pass — local** | Edit clears acknowledgement; explicit submit; server rejects stale/forged acknowledgement. |
| 5 | Consent separation | **Partly** | Two required consents enforced; marketing off. Customer-facing revocation and vendor propagation remain blocked (M-12). |
| 6 | Recipient control | **Pass — local** | Server constant; no browser recipient; minimal email. |
| 7 | Secure access | **Partly — improved** | AAL2 + RPC-only reviewer writes proven locally; live MFA, hosted grants and step-up unverified (E-04). |
| 8 | Delivery reliability | **Partly — improved** | Idempotency, leases, monotonic events and unmatched-event retry proven locally; no live provider, webhook or cron. |
| 9 | Leak prevention | **Partly** | No analytics/storage/URL answers; held source wording remains in the public bundle (F-02); provider logs/backups unverified. |
| 10 | Human review | **Pass — local** | Append-only corrections; explicit review actions; no eligibility decision. |

## Verification

All commands were run on 27 October 2026 in this workspace. Logs are next to this README.

| Command | Result |
|---|---|
| `npm ci --ignore-scripts` | PASS — 135 packages, no lifecycle scripts |
| `npm run typecheck` | PASS |
| `npm run build` | PASS — chunk-size warning only |
| `npm run check:bank` | PASS — 92 rows, 87 approved, 5 held, 0 signed off; 113/85/28 |
| `npm run check:docs` | PASS |
| `npm run check:server-bank` | PASS |
| `npm run check:server-policy` | PASS |
| `npm run test:consent` | PASS — 7 tests |
| `npm run test:engine` | PASS — 7 tests |
| `npm run test:validation` | PASS — 5 tests |
| `npx deno test --allow-env --lock=deno.lock supabase/functions/tests/` | PASS — 35 tests |
| `npm run check:db` | PASS — 0 failures; migrations 0001–0004 replayed twice |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |

## Not closed by this pass

- **F-01 / M-03:** questionnaire sign-off is a legal/product decision.
- **F-02 / M-11:** whether the five held source phrases may remain in the public bundle is a legal/product decision.
- **F-06 / M-12:** no customer-facing STOP/withdrawal path or vendor suppression execution. Marketing must stay off.
- **F-07 / M-14:** retention period, backup expiry and incident response require approval and live evidence.
- **F-08 / M-09/M-13/M-17/M-18:** no hosted deployment, live MFA, Resend receipt, webhook delivery or cron tick.
- **F-12:** at-rest encryption is a provider claim, not repository evidence.
- **E-07/E-09:** no screen-reader/mobile walkthrough or live load test.

The repository remains suitable only for a labelled, non-customer preview until those gates close.
