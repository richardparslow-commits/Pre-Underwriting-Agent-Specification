# Remediation ledger — Life Policy Pilot pre-underwriting

**Started:** 27 October 2026  
**Baseline:** `main` @ `07fdbfe632d48ef363caac086e82b8c2f13277a2`  
**Source registers:** [`MASTER-ISSUE-LIST.md`](MASTER-ISSUE-LIST.md), [`2026-10-27-qwencloud/qwencloud-issues.md`](2026-10-27-qwencloud/qwencloud-issues.md)  
**Rule:** a finding is `Resolved` only when the root cause is fixed, a regression check proves it, the documentation is current and the full verification suite passes. Legal, clinical, product and external-vendor decisions stay blocked and open even when the engineering control is complete.

## Summary

| Status | Count | Findings |
|---|---:|---|
| Resolved | 15 | M-01, M-04, M-05, M-06, M-07, M-08, M-10, M-15, M-16, M-19, M-20, M-21, M-22, M-23, M-24 |
| Fixed — Pending Verification | 4 | M-09, M-13, M-17, M-18 |
| Blocked — Legal | 3 | M-02, M-03, M-14 |
| Blocked — Product | 1 | M-12 |
| Blocked — Legal/Product | 1 | M-11 |
| Open | 0 | — |

`Fixed — Pending Verification` means the code/SQL and a local regression pass exist, but a live deployment, provider, browser or operational check named in the row is still missing. It is not a claim that the live environment is verified.

## Verification run

All commands were run on 27 October 2026 in this workspace.

| Check | Result | Evidence |
|---|---|---|
| `npm run typecheck` | PASS | [`typecheck.log`](2026-10-27-remediation/typecheck.log) |
| `npm run build` | PASS (chunk-size warning only) | [`build.log`](2026-10-27-remediation/build.log) |
| `npm run check:bank` | PASS — 92 rows, 87 approved, 5 held, 113 source items, 85 traced, 28 gaps | [`check-bank.log`](2026-10-27-remediation/check-bank.log) |
| `npm run check:docs` | PASS — counts and stale-claim checks | [`check-docs.log`](2026-10-27-remediation/check-docs.log) |
| `npm run check:server-bank` | PASS — 92 rows match | [`check-server-bank.log`](2026-10-27-remediation/check-server-bank.log) |
| `npm run check:server-policy` | PASS | [`check-server-policy.log`](2026-10-27-remediation/check-server-policy.log) |
| `npm run test:consent` | PASS — 7 tests | [`consent-tests.log`](2026-10-27-remediation/consent-tests.log) |
| `npm run test:engine` | PASS — 7 tests | [`engine-tests.log`](2026-10-27-spec-remediation/engine-tests.log) |
| `npm run test:validation` | PASS — 5 tests | [`validation-tests.log`](2026-10-27-spec-remediation/validation-tests.log) |
| `deno test --allow-env --lock=deno.lock supabase/functions/tests/` | PASS — 35 tests | [`deno-tests.log`](2026-10-27-spec-remediation/deno-tests.log) |
| Isolated PostgreSQL replay (migrations 0001–0004) | PASS — 0 failures | [`db-check.log`](2026-10-27-spec-remediation/db-check.log) |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities | [`npm-audit.log`](2026-10-27-remediation/npm-audit.log) |
| `npm ci --ignore-scripts` then build | PASS | local run; CI uses the same install |
| Final `check:docs` + `typecheck` after the last comment/doc edits | PASS | `check-docs.log`; `typecheck.log` |

## Ledger

| ID | Severity | Area / classification | Root cause | Owner | Status | Verification evidence | Remaining risk |
|---|---|---|---|---|---|---|---|
| M-01 | High | Questionnaire integrity / question-bank defect | `submit-case` validated shape but never compared rows with a canonical server bank | Engineering | **Resolved** | `_shared/bank.generated.ts` + drift check; Deno tests reject held MED-11, INVENTED-99, zero answers, forged version; forged source/timeframe is rewritten from the canonical row | None beyond the signed-bank gate (M-03) |
| M-02 | High | Consent / consent defect | Consent records, versions, wording and channel policy were client-authored | Engineering + Legal | **Blocked — Legal** | Engineering controls complete: `policy.generated.ts`; Deno tests reject forged marketing, wrong privacy version, duplicate, unknown, future and stale records; server stores client timestamp separately from `server_received_at` | Counsel approval of the exact wording remains MC-10; marketing remains disabled (M-12) |
| M-03 | High | Questionnaire fidelity / legal gate | Seven source windows replaced; 0/92 rows source-verified | Legal + Product | **Blocked — Legal** | `check:bank` records 7 timeframe changes; live intake returns 503 until `QUESTIONNAIRE_APPROVED=true`; handler test asserts the 503 | Named sign-off for 92 rows, restored/approved windows, and `sourceVerified: true` are outstanding |
| M-04 | High | Crisis triage / security defect | Server stored client `crisisDisclosure` and `flags` | Engineering | **Resolved** | Server derives MH-05 Yes → `crisisDisclosure: true` and an urgent flag; Deno test sends `false`/empty flags and observes the derived values | None; client flags are ignored |
| M-05 | Medium | Interview integrity / interview-flow defect | Parent changes did not prune descendants; payload emitted fields for every row | Engineering | **Resolved** | `pruneBranchClosedAnswers` now iterates to a fixed point; engine tests cover MH-01 → MH-02 and MIL-01 → MIL-02 → MIL-04 close/reopen; server also rejects fields on `not_asked` | None |
| M-06 | Medium | Submission reliability / edge-function defect | No idempotency key or unique constraint | Engineering | **Resolved** | Unique partial index on `idempotency_key`; handler replay path; SQL probe rejects a duplicate key | Live timeout/concurrency test not run (E-02), but the database invariant is proved |
| M-07 | Medium | Notification reliability / edge-function defect | Send-before-status; no lease/claim or provider idempotency | Engineering | **Resolved** | `claim_case_notification` lease; SQL probe shows one winner and no re-claim after acceptance; email test asserts `Idempotency-Key` | Live provider dedupe window not executed (E-03) |
| M-08 | Medium | Delivery evidence / security defect | Shared secret, no signature, dedupe or monotonic status | Engineering | **Resolved** | Svix tests (valid, stale, tampered, rotation); SQL probe rejects duplicate/replayed/out-of-order events and cannot regress `delivered` | Provider payload/signature compatibility not tested live (E-03) |
| M-09 | Medium | Deployment / operational gap | No `supabase/config.toml` or schedule definition | Engineering + Operations | **Fixed — Pending Verification** | `supabase/config.toml` commits all three `verify_jwt=false` settings; `supabase/ops/retry-schedule.sql` defines the five-minute Vault-backed schedule | Clean deployment 401→201 and one real cron tick not executed (E-02) |
| M-10 | Medium | Eligibility / product gate | No DOB/age attestation; any 2–40 char state accepted | Engineering + Product | **Resolved** | Lead DOB/adult attestation; server computes age, uses a 51-code state set, rejects non-self; Deno tests reject 17, `ZZ`, non-self | Licensed-state availability remains a separate product/counsel gate (MC-10) |
| M-11 | Medium | Sensitive-question handling / privacy defect | Review screen rendered held source text | Engineering + Legal | **Blocked — Legal/Product** | UI control complete: held panel shows only a count and generic topic; `check:docs` forbids `question.sourceText` in ReviewScreen; held answers are rejected server-side | Held wording remains in the public bank bundle because the audit table and UI share one bank; a policy decision on bundle redaction is still required (F-02) |
| M-12 | Medium | Marketing revocation / pre-enable gate | Suppression table never read; no revocation route | Product + Operations | **Blocked — Product** | `record_marketing_revocation` + `is_contact_suppressed` + audited rows; SQL probe records a phone revocation and queries suppression; marketing stays disabled and server rejects marketing consent | No customer-facing STOP/withdrawal path and no vendor propagation; do not enable a channel |
| M-13 | Medium | Reviewer authorization / security defect | `is_reviewer()` checked membership, not AAL2 | Engineering + Operations | **Fixed — Pending Verification** | `is_reviewer()` requires `aal2`; portal refuses aal1 and shows a step-up screen; SQL probe shows aal1 sees zero cases and cannot call the RPC, aal2 succeeds | Live MFA enrolment and session step-up not exercised (E-04) |
| M-14 | Medium | Data lifecycle / operational gap | No retention, deletion, backup or incident procedure | Legal + Operations | **Blocked — Legal** | `delete_case` with audit; `purge_expired_cases` no-ops while `retention_months` is null; SQL probe proves deletion, audit, and opt-in expiry; `docs/OPERATIONS.md` runbook | Retention period, backup expiry and incident execution require approval and live evidence |
| M-15 | Low | Consent evidence / consent defect | Privacy record stamped with shared consent version | Engineering | **Resolved** | `privacyVersion` passed separately; consent test asserts the privacy record uses it; server compares the same value | None |
| M-16 | Low | Request limits / security hardening | Character count used for a byte limit; post-read check | Engineering | **Resolved** | Streaming `readBodyWithLimit`; handler test sends 300,000 two-byte characters and receives 413 before parsing | Platform body limit still applies first |
| M-17 | Low | Abuse resistance / security hardening | In-memory limiter keyed by spoofable header | Engineering + Operations | **Fixed — Pending Verification** | Durable salted `consume_submission_rate` RPC; SQL probe allows 2 and rejects the 3rd; in-memory limiter only when unconfigured | Trusted client identity still depends on the platform proxy/WAF; a determined header-rotating caller needs the WAF rule |
| M-18 | Low | Notification recovery / operational gap | `not_sent` never selected by retry | Engineering | **Fixed — Pending Verification** | Retry includes `not_sent` when a provider is configured, claims before sending, and backs off; no live scheduler run | One real not_sent recovery not executed (E-02/E-03) |
| M-19 | Low | Confirmation accuracy / UI defect | Header always said “queued” | Engineering | **Resolved** | Header branches on `notificationSent`/failed/not_sent; `check:docs` requires both states; timeline already distinguished them | None |
| M-20 | Low | Documentation / documentation defect | Stale counts and gate claims | Engineering | **Resolved** | `check:docs` recomputes 92/87/5/0, 113/85/28 and forbids known stale strings; README, LAUNCH-GATES, LOVABLE and customer label corrected | Owner-facing gate status still depends on blocked items |
| M-21 | Low | Supply chain / build defect | Known advisories; tag-pinned actions | Engineering | **Resolved** | Vite 8.3.5, react-router 7.18.5, plugin 4.3.3; `npm audit` 0; all actions SHA-pinned; CI uses `npm ci --ignore-scripts` and builds | Optional native packages still resolve from the registry; review lockfile updates |
| M-22 | Low | Reproducibility / build defect | Deno ranges and no lockfile | Engineering | **Resolved** | Exact npm/jsr versions; committed `deno.lock`; tests and CI use `--lock=deno.lock` | Registry availability remains external |
| M-23 | Low | Access audit / authorization defect | No `opened` entry written on case load | Engineering | **Resolved** | `getCase` calls `record_case_review('opened')`; SQL probe shows one entry across two loads | Live access log not inspected (E-02) |
| M-24 | Informational | Case immutability / schema hardening | Trigger omitted derived evidence columns | Engineering | **Resolved** | Trigger now protects payload, reference, submitted/server times, version, idempotency key, crisis disclosure and residence state; SQL probe rejects service-role changes | Service role remains powerful by design |

## Classification index

| Category | Findings |
|---|---|
| Code defect | M-05, M-19 |
| Security defect | M-01, M-04, M-08, M-13, M-16, M-17 |
| Privacy defect | M-11, M-14 |
| Consent defect | M-02, M-15 |
| Question-bank/reconciliation defect | M-03 |
| Interview-flow defect | M-05, M-10 |
| Supabase schema/RLS defect | M-13, M-24 |
| Edge-function defect | M-01, M-06, M-07, M-18 |
| Test gap | M-01–M-08, M-15–M-17, M-22–M-24 now have local regressions; M-02, M-03, M-11 and M-14 still depend on counsel/product decisions |
| Documentation defect | M-20 |
| Build/tooling defect | M-21, M-22 |
| Operational gap | M-09, M-12, M-14, M-17, M-18 |
| Legal/compliance gate | M-02 (wording), M-03, M-11 (bundle policy), M-14 |
| Clinical/product gate | M-11 (held-question policy), M-12 |

## Evidence gaps retained

E-01 live Supabase, E-02 deployed functions/scheduler, E-03 email delivery/provider, E-04 live MFA/session, E-05 retention execution/backups, E-06 deployment headers, E-07 accessibility/mobile, E-08 legal research, E-09 load, E-10 semantic sign-off. These are not findings and cannot be marked resolved by code.

## Conditions still open (from MC-01..MC-13)

- **MC-01 / M-03:** named sign-off for all 92 rows; restore or approve the seven windows; bump `QUESTIONNAIRE_VERSION`; regenerate the report.
- **MC-09 / M-11:** decide whether held wording must be removed from the public bundle, not only the DOM.
- **MC-10:** counsel approval of entity, notice, intake permission, TCPA wording and sensitive-question handling.
- **MC-11:** live deployment, mailbox ownership, provider settings, scheduler tick and non-customer end-to-end run.
- **MC-08 / M-14:** approved retention period, backup expiry and incident-response execution.
- **M-12:** do not enable marketing until a customer revocation path and vendor suppression check exist and are tested.

## What was not run

- No live Supabase project, hosted migrations, deployed functions, real Resend key, mailbox, scheduler, MFA enrolment or custom domain.
- No screen-reader, keyboard-only full walkthrough, contrast measurement or mobile-device session.
- No load/soak or header-rotation test against a deployed endpoint.
- No independent legal research; no compliance conclusion is made.
- The PGlite replay is an isolated database, not the hosted project.
