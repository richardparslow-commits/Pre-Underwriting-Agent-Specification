# Remediation ledger — Life Policy Pilot pre-underwriting

**Started:** 27 October 2026
**Contract:** [`audit/2026-10-27-master-issue-list.md`](../2026-10-27-master-issue-list.md) — 30 deduplicated findings from A1, A3 and A4.
**Baseline:** `main` @ `96446f9`
**Rule:** `Resolved` means the root cause is fixed in the repository, a regression or structural check proves it, the documentation matches, and the full local suite passes. It does not mean a hosted deployment, provider, MFA, scheduler, retention period or legal approval has been verified.

## Summary

| Status | Count | Findings |
|---|---:|---|
| Resolved (local engineering evidence) | 22 | M-01, M-04–M-08, M-10, M-11, M-15, M-16, M-19–M-30 |
| Fixed — Pending Verification | 4 | M-09, M-13, M-17, M-18 |
| Blocked — Legal / Product / Operations | 4 | M-02, M-03, M-12, M-14 |
| **Total** | **30** | |

The four blocked findings require human or external action. None is marked resolved by engineering.

## Changes made in this pass

| Finding | Change | Why it was still open |
|---|---|---|
| M-11 | Split verbatim source wording out of the customer bundle. `sourceInventory.ts` and `reconciliation.ts` are now build/audit-only; generated `sourceIndex.ts` and `questionSourceRefs.ts` carry ids, pages and locators only; the server attaches `sourceText` from its canonical bank. Held customer labels were genericized so they do not name the withheld topic. Added `check:bundle` and a held-label rule in `check:bank`. | The UI had stopped rendering held wording, but the bank still imported the reconciliation module for locators, so both source text and reviewer flags were in production JavaScript. |
| M-17 | `submit-case` now returns 503 in production when the durable salted limiter is unavailable; the in-memory limiter is used only when `ENVIRONMENT=test`. Added a Deno regression. | The in-memory fallback could silently replace the durable limiter in a live deployment. |
| M-27 | Updated `.env.example`, README and the deployment checklist to state that a missing salt fails closed. | The configuration gap was fixed, but the insecure fallback remained. |
| M-30 | Reworded the privacy page to claim TLS and access control only; at-rest encryption/key management are explicitly unverified provider controls. `check:docs` forbids the old claim. | The page asserted a provider control the repository cannot evidence. |

## Ledger

| ID | Severity | Classification | Root cause | Owner | Status | Verification | Remaining risk |
|---|---|---|---|---|---|---|---|
| M-01 | High | Security / edge-function defect | Public intake validated shape but not the canonical bank | Engineering | **Resolved** | `validate-draft_test.ts` rejects held HIV, invented id, zero answers and forged version; accepted drafts are rebuilt from `SERVER_BANK`; `check:server-bank` matches 92 rows | Questionnaire sign-off remains M-03 |
| M-02 | High | Consent defect | Consent wording/versions were client-authored | Engineering + Legal | **Blocked — Legal** | Server policy generated and compared; consent tests pass 7/7; Deno rejects forged marketing, wrong privacy version, duplicate/future/unknown records | Counsel approval of exact wording is MC-10 |
| M-03 | High | Question-bank / legal gate | Seven source windows replaced; 0/92 rows source-verified | Legal + Product | **Blocked — Legal/Product** | `check:bank` records 92 rows, 87 approved, 5 held, 0 signed off, 7 timeframe changes, 28 gaps; launch lock test asserts 503 until `QUESTIONNAIRE_APPROVED=true` | Named sign-off for 92 rows and the seven windows |
| M-04 | High | Security / crisis triage | Server stored client crisis flags | Engineering | **Resolved** | Deno derives crisis disclosure and urgent flag from MH-05 Yes while ignoring forged client values; engine crisis tests pass | None |
| M-05 | Medium | Interview-flow defect | Parent changes did not prune nested descendants | Engineering | **Resolved** | Engine tests cover nested close/reopen (`MIL-01 → MIL-02 → MIL-04`) and payload stripping; 7 tests pass | None |
| M-06 | Medium | Edge-function defect | No idempotency key/unique constraint | Engineering | **Resolved** | `check:db` rejects a duplicate key; handler replay path returns the original receipt | Live timeout/concurrency not exercised (E-02) |
| M-07 | Medium | Edge-function defect | Send-before-status; no lease or provider key | Engineering | **Resolved** | `check:db` proves one claim winner and no re-claim after acceptance; email test asserts `Idempotency-Key` | Live provider dedupe not exercised (E-03) |
| M-08 | Medium | Security / delivery evidence | No Svix signature, dedupe or monotonic state | Engineering | **Resolved** | 5 Svix tests pass; `check:db` rejects replay/out-of-order and cannot regress `delivered` | Live provider payload not exercised (E-03) |
| M-09 | Medium | Operational gap | No committed function config or schedule | Engineering + Operations | **Fixed — Pending Verification** | `supabase/config.toml` and `supabase/ops/retry-schedule.sql` committed | No clean deployment or cron tick (E-02) |
| M-10 | Medium | Product / eligibility gate | No DOB, adult-self or state validation | Engineering + Product | **Resolved** | Deno rejects age 17, `ZZ`, non-self; 51 state codes; adult attestation | Licensed-state availability remains counsel/product |
| M-11 | Medium | Privacy / sensitive-question handling | Held source wording and reviewer detail reached the public bundle | Engineering | **Resolved** | `check:bundle` passes: 5 withheld source items and 5 held reconciliation records absent; generated locator maps only; held labels name no withheld topic; `check:bank` verifies both generated files | Whether to ask held questions remains M-03 |
| M-12 | Medium | Consent / pre-enable product gate | No customer STOP route or vendor propagation | Product + Operations | **Blocked — Product/Operations** | `check:db` records a revocation and queries suppression; marketing remains disabled and server rejects marketing consent | Do not enable a channel until the customer path and vendor suppression exist |
| M-13 | Medium | Reviewer authorization | `is_reviewer()` did not require AAL2 | Engineering + Operations | **Fixed — Pending Verification** | `check:db` shows aal1 sees zero cases and cannot call the RPC; aal2 succeeds; portal refuses aal1 | Live MFA enrolment/step-up not exercised (E-04) |
| M-14 | Medium | Privacy / data lifecycle | No approved retention, backup expiry or incident execution | Legal + Operations | **Blocked — Legal/Operations** | `check:db` proves audited deletion and opt-in expiry; `retention_months` remains null; runbook exists | Approved period, backup expiry and incident drill required |
| M-15 | Low | Consent defect | Privacy record used the shared consent version | Engineering | **Resolved** | Consent test asserts separate `privacyVersion`; server compares it | None |
| M-16 | Low | Security hardening | Character cap checked after reading | Engineering | **Resolved** | Deno returns 413 for a 300,000 two-byte-character body before parsing | Platform body limit still applies first |
| M-17 | Low | Abuse resistance | Per-instance limiter and spoofable header | Engineering + Operations | **Fixed — Pending Verification** | `check:db` allows two and rejects the third durable request; new Deno test proves production fails closed with 503 | Trusted client identity still depends on proxy/WAF; live RPC not exercised |
| M-18 | Low | Notification recovery | `not_sent` never selected by retry | Engineering | **Fixed — Pending Verification** | Retry includes `not_sent` when configured, claims before sending and backs off; SQL lease checks pass | One real recovery not executed (E-02/E-03) |
| M-19 | Low | UI defect | Header always said “queued” | Engineering | **Resolved** | `check:docs` requires sent/failed/not_sent branches; timeline distinguishes states | None |
| M-20 | Low | Documentation defect | Stale counts and gate claims | Engineering | **Resolved** | `check:docs` recomputes 92/87/5/0 and 113/85/28 and forbids known stale strings | Owner-facing gates still depend on blocked items |
| M-21 | Low | Build/supply chain | Known advisories; tag-pinned actions | Engineering | **Resolved** | `npm audit --audit-level=high` reports 0; actions are SHA-pinned; CI uses `npm ci --ignore-scripts` | Registry availability remains external |
| M-22 | Low | Build/reproducibility | Deno ranges and no lockfile | Engineering | **Resolved** | Exact versions and committed `deno.lock`; tests run with `--lock=deno.lock` | Registry availability remains external |
| M-23 | Low | Access audit | No `opened` entry on case load | Engineering | **Resolved** | `check:db` shows one deduplicated `opened` entry across two loads | Live access log not inspected (E-02) |
| M-24 | Informational | Schema hardening | Immutability trigger omitted evidence columns | Engineering | **Resolved** | `check:db` rejects service-role changes to crisis, residence and idempotency evidence | Service role remains powerful by design |
| M-25 | Medium | Supabase RLS defect | AAL2 reviewer could write status/log directly | Engineering | **Resolved** | `check:db` proves direct updates/inserts are denied and the RPC still works | Hosted grants remain unverified |
| M-26 | Low | Validation defect | Phone/text accepted without a usable number | Engineering | **Resolved** | 5 lead validation tests and 3 Deno contact tests pass; numbers normalised | None |
| M-27 | Low | Configuration defect | Salt/launch lock missing from example config | Engineering | **Resolved** | `.env.example` contains both; `check:docs` fails if removed; production fails closed without the salt | Closed locally |
| M-28 | Low | Delivery evidence race | Unmatched event consumed its id before correlation | Engineering | **Resolved** | `check:db` proves event-before-message-id is retained and re-correlated on retry | Live webhook not exercised |
| M-29 | Low | Audit/documentation defect | Ledger overstated M-02/M-11 and understated M-03 | Engineering | **Resolved** | Master list and this ledger mark blocked items blocked; M-03 records 92 rows, 0 signed off | Documentation only |
| M-30 | Informational | Privacy copy / evidence gap | Privacy page asserted at-rest encryption without evidence | Engineering + Legal | **Resolved** | Copy claims TLS/access control only; `check:docs` forbids the old assertion; provider verification remains E-05 | Confirm provider controls before restoring any at-rest claim |

## Classification index

| Category | Findings |
|---|---|
| Code defect | M-05, M-19 |
| Security defect | M-01, M-04, M-08, M-13, M-16, M-17, M-25 |
| Privacy defect | M-11, M-14, M-30 |
| Consent defect | M-02, M-12, M-15 |
| Question-bank/reconciliation defect | M-03 |
| Interview-flow defect | M-05, M-10 |
| Supabase schema/RLS defect | M-13, M-24, M-25 |
| Edge-function defect | M-01, M-06, M-07, M-18 |
| Test gap | Closed by the regressions listed above; legal/product gates remain |
| Documentation defect | M-20, M-29, M-30 |
| Build/tooling defect | M-21, M-22 |
| Operational gap | M-09, M-12, M-14, M-17, M-18 |
| Legal/compliance gate | M-02, M-03, M-14 |
| Clinical/product gate | M-03, M-11, M-12 |

## Verification

All commands were run on 27 October 2026 in this workspace. Raw logs are in [`logs/`](logs/).

| Command | Result |
|---|---|
| `npm ci --ignore-scripts` | PASS — 135 packages, 0 vulnerabilities |
| `npm run typecheck` | PASS |
| `npm run check:bank` | PASS — 92 rows, 87 approved, 5 held, 0 signed off; 113 source items, 85 traced, 28 gaps |
| `npm run check:docs` | PASS |
| `npm run check:server-bank` | PASS — 92 rows |
| `npm run check:server-policy` | PASS |
| `npm run test:consent` | PASS — 7 tests |
| `npm run test:engine` | PASS — 7 tests |
| `npm run test:validation` | PASS — 5 tests |
| `npx deno test --allow-env --lock=deno.lock supabase/functions/tests/` | PASS — 36 tests |
| `npm run check:db` | PASS — 0 failures; migrations 0001–0004 replayed twice |
| `npm run build` | PASS — 616.80 kB JS, 171.21 kB gzip; chunk-size warning only |
| `npm run check:bundle` | PASS — 1 JS asset; 5 withheld source items and 5 held reconciliation records absent |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run report:reconciliation` (twice) | PASS — deterministic output; document updated for the generic held labels |
| `git diff --check` | PASS |

## What is not verified

- No hosted Supabase project, applied migration history, live RLS/grant inspection or MFA step-up.
- No Resend key, mailbox, provider acceptance, signed webhook delivery or scheduler tick.
- No approved retention period, backup expiry, restore drill, incident execution or on-call evidence.
- No provider attestation for at-rest encryption or key management (E-05).
- No customer-facing marketing withdrawal path or vendor propagation; marketing remains disabled.
- No screen-reader, keyboard-only, contrast or mobile-device pass; no load/soak test.
- No legal, HIPAA, TCPA or Texas Insurance Code conclusion.

## Conditions still open

- **MC-01 / M-03:** named sign-off for all 92 rows; restore or approve seven windows; decide 28 gaps; bump `QUESTIONNAIRE_VERSION`; only then set `QUESTIONNAIRE_APPROVED=true`.
- **MC-03 / MC-10 / M-02:** counsel approval of entity, privacy notice, intake permission, TCPA wording and sensitive-question handling.
- **MC-08 / M-14:** approved retention period, backup expiry and incident-response execution.
- **MC-11 / M-12:** do not enable marketing until a customer STOP/withdrawal path and vendor suppression check are implemented and tested live.
- **MC-06 / MC-07 / MC-11:** hosted deployment, reviewer MFA, provider, webhook, cron and labelled non-customer end-to-end run.
