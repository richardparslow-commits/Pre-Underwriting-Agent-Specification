# Life Policy Pilot — Pre-Underwriting Agent

## Independent audit report

**Audit date:** 27 October 2026
**Repository:** `richardparslow-commits/Pre-Underwriting-Agent-Specification`
**Audited commit:** `173b0a0da8c72c7c3ff859a5a441da79e3fed234` (`main`)
**Previous preparation baseline:** `07fdbfe632d48ef363caac086e82b8c2f13277a2`
**Working tree:** clean except the untracked `.tmp/` audit workspace
**Method:** single agent; no subagents or cloud workers were used. No tracked file was modified.

---

## 1. Verdict

**CONDITIONALLY READY FOR A LABELLED, NON-CUSTOMER PREVIEW. NOT READY TO ACCEPT REAL CUSTOMER HEALTH INFORMATION.**

The engineering controls are materially stronger than the preparation baseline: server-owned questionnaire rows, server-owned consent wording, derived crisis state, idempotent submission, notification leases, Svix-verified delivery events, AAL2 reviewer policies and a launch lock are present and locally tested. The preview is honest: it has no fake login, no fake email delivery and no persistent browser storage.

The launch verdict is still negative because:

1. **0 of 92 bank rows are source-verified.** Seven source windows were changed and 28 source questions remain only partly collected or out of scope. The code correctly refuses live intake until `QUESTIONNAIRE_APPROVED=true`, so the current deployment posture is honest, but the questionnaire gate is not closed.
2. **Held sensitive source wording remains in the public JavaScript bundle.** The customer UI no longer renders it, but a customer can read it in developer tools. A legal/product decision on bundle redaction is outstanding.
3. **A reviewer can bypass the atomic review RPC.** The database grants a direct `UPDATE (status)` on cases and a direct `INSERT` on the review log, so a reviewer can change status without a log entry or insert a log entry without changing status.
4. **Nested branch answers can be revived after a parent closes.** Direct child pruning works, but a descendant under an intermediate parent survives in state and reappears if the path is reopened.
5. **Server-side contact validation is incomplete.** A direct API caller can choose phone or text contact with no phone number, or submit `abc` and have it stored as `+`.
6. **Legal and operational gates remain open:** counsel approval of the consent wording and sensitive-question policy, a customer-facing marketing revocation path, an approved retention period, backup expiry, incident response, and live verification of MFA, email, webhook, cron and deployment.

This is not a legal or compliance certification. It is an engineering and product-readiness assessment.

---

## 2. Baseline and evidence

| Item | Observed |
|---|---|
| Branch | `main` |
| Commit | `173b0a0da8c72c7c3ff859a5a441da79e3fed234` |
| Working tree | `?? .tmp/` only; no tracked modification |
| Node / npm | Node `v24.16.0`; npm from the installed toolchain |
| Deno | `2.9.6` |
| Source PDF | `source/Detialed-Life-insurance-Questions.pdf` |
| Source PDF SHA-256 | `afe91d876f2c9e932302267ad10d0c46b774b4161efea8d0d2ffe71e3c82cca2` |
| Source extraction | `source/Detialed-Life-insurance-Questions.txt`, 268 lines |
| Source inventory | 113 source questions |
| Bank | 92 rows: 87 approved, 5 held, 0 signed off |
| Reconciliation | 55 match source, 3 compound splits, 11 wording changes, 7 timeframe changes, 9 LPP additions, 2 not in source, 5 held |
| Source gaps | 28: 19 partly collected, 9 out of scope, 0 awaiting a new question |

### Commands actually run

| Command | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS (only the 671 kB chunk-size warning) |
| `npm run check:bank` | PASS — 92 rows, 87 approved, 5 held, 0 signed off, 113 source, 85 traced, 28 gaps |
| `npm run check:docs` | PASS — 92/87/5/0 and 113/85/28 |
| `npm run check:server-bank` | PASS — 92 rows match |
| `npm run check:server-policy` | PASS |
| `npm run test:consent` | PASS — 7 tests |
| `npm run test:engine` | PASS — 6 tests |
| `deno test --allow-env --lock=deno.lock supabase/functions/tests/` | PASS — 32 tests |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| Isolated PGlite replay of migrations 0001–0003 | PASS — existing checks, 0 failures |
| Targeted RLS probes added in `.tmp/freebuff-audit/sql_probe_security.mjs` | 42 PASS, 0 FAIL; three probes deliberately record the direct-write gap |
| `validateDraft` phone probe | 5 scenarios; missing and junk phones accepted |
| Browser `/start` empty submit | PASS — required errors shown, first invalid field focused |
| Browser `/portal` preview | PASS — explicit preview label, no fake login |
| Browser `/portal/LPP-2026-SAMPLE` direct route | PASS — requires sign-in; “Preview this case locally” is explicit |
| Browser console/network | No application console errors; only Vite/React dev messages and Google Fonts requests |
| Full 92-question browser walkthrough | **NOT RUN** |
| Live Supabase / Resend / MFA / cron | **NOT RUN** |
| Screen-reader, contrast, mobile-device pass | **NOT RUN** |

The `check:docs` and `check:bank` commands prove structural consistency only. They cannot prove that a question wording, window or exclusion is legally or clinically approved.

---

## 3. Architecture and trust boundaries

```text
Browser (React/Vite)
  lead + privacy acknowledgement + optional marketing selection
  deterministic interview state (memory only)
  no localStorage/sessionStorage/analytics/URL answers
        |
        | POST submit-case + Idempotency-Key + Origin
        v
Supabase Edge Function (public, JWT off by design)
  Origin allowlist
  streaming 512 KiB byte cap
  durable salted rate limit (service role RPC)
  canonical server bank + consent policy
  derives crisis state and flags
  service-role insert into cases
        |
        +--> Resend notification (fixed recipient, no PHI)
        |
        +--> retry-case-notifications (cron secret, lease/claim)
        |
        +--> email-events (Svix signature, dedupe, monotonic state)
        v
Postgres with RLS
  cases (immutable snapshot columns; reviewer select)
  case_review_log (reviewer select; insert path must be RPC-only)
  case_corrections (reviewer select; RPC-only append)
  contact_suppressions / marketing_revocations
  email_events / case_deletions / app_settings / submission_rate_limits
        ^
        |
Reviewer browser (Supabase Auth, reviewer allowlist, AAL2)
```

Trust boundaries:

- The browser is untrusted for every question, answer state, consent version, wording, flag, crisis state, timestamp, recipient and reference.
- The public function is intentionally anonymous but bounded by Origin, byte cap, canonical validation and rate limiting. CORS is not authentication.
- The service role is trusted and bypasses RLS. A reviewer is trusted only after allowlist membership and AAL2; a reviewer is not trusted to write arbitrary audit evidence.
- The provider webhook is trusted only after a Svix signature over the raw body and timestamp window.
- The legal entity, retention period, marketing channel and clinical wording are owner/counsel decisions, not code defaults.

---

## 4. Findings

### F-01 — High — Questionnaire approval gate is still open

**Area:** questionnaire fidelity / legal gate
**Maps to:** M-03, MC-01
**Status:** **Blocked — Legal/Product**

**Evidence.** `npm run check:bank` reports 92 rows, 87 approved, 5 held and **0 signed off**. `src/features/interview/types.ts` has `sourceVerified: false` on every row. `docs/question-bank-reconciliation.md` records `0 / 92` sign-off and lists 28 source gaps. Seven rows replace a source window:

| Row | Source | Bank window | Recorded problem |
|---|---|---|---|
| `MED-10` | SRC-021 / SRC-022 / SRC-037 | Past 5 years | Source rows are current-state; a mental-health 5-year window was mixed in |
| `AVI-04` | SRC-050 | Next 12 months | Source asks about the next two years |
| `AVO-01` | SRC-055 | Past 5 years | Source uses a 2-year window |
| `RES-02` | SRC-101 / SRC-103 | Past 5 years | Bank question is neither source question exactly |
| `RES-03` | SRC-099 / SRC-100 | Next 12 months | Source uses next 2 years / next 24 months |
| `MIL-01` | SRC-109 | Ever | Source asks whether currently serving, not ever served |
| `MIL-03` | SRC-110 | Past 12 months | Source asks about current deployment, with no 12-month lookback |

**Observed behavior.** The launch lock is correctly implemented: `submit-case` returns HTTP 503 until `QUESTIONNAIRE_APPROVED=true` (`supabase/functions/submit-case/index.ts:150-163`), and `supabase/functions/tests/submit-case_test.ts` asserts it. The lock prevents a false launch claim; it does not approve the bank.

**Impact.** A live launch with the current bank cannot claim the source questionnaire is faithfully collected. The seven changed windows and 28 gaps are exactly the decisions a named reviewer must make. The audit prompt forbids setting `sourceVerified: true` without evidence, and none exists.

**Remediation.** Restore or explicitly approve each of the seven windows; close the 28 gap decisions; set `sourceVerified` only with a named reviewer/date; bump `QUESTIONNAIRE_VERSION`; regenerate the report. Keep `QUESTIONNAIRE_APPROVED=false` until then.

**Regression.** `check:bank` must fail on a changed window without a reconciliation flag; the sign-off count must remain 0 until the reviewer table is filled.

---

### F-02 — Medium — Held sensitive source wording remains in the public bundle

**Area:** privacy / sensitive-question handling
**Maps to:** M-11, MC-09
**Status:** **Blocked — Legal/Product**

**Evidence.** `src/features/intake/ReviewScreen.tsx` correctly shows only a count and a generic topic and `check-docs.ts` forbids `question.sourceText` there. But `ReviewScreen.tsx` imports `QUESTION_BANK`; `questionBank.ts` contains `sourceText` for all 92 rows, including `ID-04`, `MED-11`, `MH-06`, `RES-04` and `RES-05`. Vite bundles the imported module, so the held wording is present in the shipped JavaScript even though React never renders it. The reviewer portal's `CaseReview.tsx` also includes a “Source record” disclosure for each row; that is internal and appropriate, but it confirms the same data is in the bundle.

**Impact.** A customer who opens developer tools or downloads the bundle can read the sensitive source wording (sex/gender, HIV/AIDS, suicide-attempt detail, immigration category, visa/green-card number). The wording is not a health answer, but it is exactly the material the held-row policy says is withheld pending approval.

**Remediation.** Decide and implement a bundle-redaction policy: split the customer bank from the internal reconciliation/audit bank, or ship held rows with a generic `sourceText` and keep the internal wording server-side. Do not claim the held rows are private until this is done.

**Regression.** A build-artifact check should search `dist/assets/*.js` for a canary held phrase and fail. The current `check-docs` only checks the DOM source.

---

### F-03 — Medium — Reviewer RLS allows direct status updates and forged review-log entries

**Area:** Supabase schema / RLS / audit integrity
**Maps to:** new, related to M-13/M-24
**Status:** **Open — confirmed by local database probe**

**Evidence.**
- `supabase/migrations/0001_pre_underwriting.sql:156` grants `UPDATE (status)` on `public.cases` to `authenticated`.
- `supabase/migrations/0001_pre_underwriting.sql:192` grants `SELECT, INSERT` on `public.case_review_log` to `authenticated`.
- The RLS policies at lines 142–146 and 184–190 allow those writes for any `public.is_reviewer()` user.
- The targeted PGlite probe printed:
  - `PASS | GAP: reviewer can update workflow status directly`
  - `PASS | GAP: reviewer can insert a review-log entry directly`
  - `PASS | review-log direct insert and status update are not atomic`

**Observed behavior.** `record_case_review` is atomic and attributes the actor, but a reviewer is not required to use it. A reviewer can set `cases.status = 'reviewed'` without a log entry, or insert `case_review_log` `marked_reviewed` without changing status. The `actor` column can be set to the reviewer's own email because the policy checks it, but the action/status evidence can still be manufactured.

**Impact.** The review log is the evidence that a human reviewed a case. A reviewer — or a compromised reviewer session — can make the portal show a status or log that did not result from the intended action. This is an evidence-integrity defect, not an unauthenticated access defect.

**Remediation (smallest safe fix).**
1. Add `supabase/migrations/0004_reviewer_write_paths.sql`:
   ```sql
   revoke update on public.cases from authenticated;
   revoke update (status) on public.cases from authenticated;
   drop policy if exists cases_update_status_reviewer on public.cases;

   revoke insert on public.case_review_log from authenticated;
   revoke usage, select on sequence public.case_review_log_id_seq from authenticated;
   drop policy if exists case_review_log_insert_reviewer on public.case_review_log;
   ```
2. Keep `record_case_review` and `record_case_correction` as `security definer` paths. They are owned by the migration role and continue to update/insert atomically.
3. Re-run the PGlite probe; assert direct update and direct insert both fail while the RPC still records one `opened` and one `marked_reviewed` entry.
4. Update `README.md`, `docs/OPERATIONS.md` and the ledger to say `0001–0004`.

**Regression.** Commit a local SQL test (PGlite or a disposable Postgres) rather than leaving the probe in `.tmp`. The test must assert `has_column_privilege('authenticated','public.cases','status','UPDATE') = false` and `has_table_privilege('authenticated','public.case_review_log','INSERT') = false`, then call the RPC.

---

### F-04 — Medium — Nested branch answers are left in state and revive when a path reopens

**Area:** interview integrity / branch pruning
**Maps to:** M-05 (incomplete fix)
**Status:** **Open — confirmed by probe**

**Evidence.** `src/features/interview/engine.ts:246-261` computes `visibleQuestions(answers)` once, then removes only rows whose own `askWhen` is not in that old visible set. Consider `MIL-01` (ever served) → `MIL-02` (flying/aircraft) → `MIL-04` (mission type):

- Start: `MIL-01=yes`, `MIL-02=yes`, `MIL-04=['proficiency']`.
- Close `MIL-01=no`.
- The direct child `MIL-02` is removed because it is no longer visible.
- `MIL-04` remains in state because, under the *old* answer set, its parent `MIL-02` was still visible.
- Submitted answers while closed are correctly `not_asked` (`toSubmittedAnswers` strips the data), so there is no closed-branch payload leak.
- Reopen `MIL-01=yes` and `MIL-02=yes`: `MIL-04` returns as `answered` with the old `proficiency` value, although the customer never re-confirmed it.

The probe output:

```text
retainedWhileClosed: [ 'MIL-01', 'MIL-04' ]
visibleWhenReopened: [ 'MIL-01', 'MIL-02', 'MIL-03', 'MIL-04' ]
staleNestedAnswerRevived: true
```

**Impact.** A withdrawn detail can reappear in a later submission without a fresh customer answer. The direct-child test passes, which is why M-05 was marked resolved, but the nested case is not covered.

**Remediation.** Make `pruneBranchClosedAnswers` iterate to a fixed point: recompute visibility after each removal, remove newly unreachable descendants, and stop when a pass removes nothing. Add a regression test for `MIL-01 → MIL-02 → MIL-04` that closes and then reopens the path. The server already rejects a closed row carrying content, but the client must not revive stale state.

**Regression.** `npm run test:engine` should include the nested close/reopen assertion; `toSubmittedAnswers` should show `MIL-04` unresolved after reopen, not answered.

---

### F-05 — Low — Server does not enforce a phone number for phone/text contact

**Area:** server validation / contactability
**Maps to:** new
**Status:** **Open — confirmed by `validateDraft` probe**

**Evidence.** `supabase/functions/_shared/case.ts:567` reads `phone` with `optionalText`, and there is no cross-field rule with `preferredContact`. The client `validateLead` requires at least 10 digits for phone/text, but the public API is the security boundary. A direct request accepted:

| Scenario | Result | Stored phone |
|---|---|---|
| `preferredContact: "phone"`, no phone | accepted | `null` |
| `preferredContact: "text"`, no phone | accepted | `null` |
| `preferredContact: "phone"`, phone `abc` | accepted | `+` |
| `preferredContact: "phone"`, phone `512` | accepted | `+512` |
| `preferredContact: "phone"`, valid 10 digits | accepted | `+15125550134` |

**Impact.** A case can be recorded as wanting a call or text when no usable number exists. The reviewer can still use the email on file, but the customer's stated contact method cannot be honored. This is a data-quality/contactability defect, not a health-data leak.

**Remediation.** After `preferredContact` validation, require `phone` when the preference is `phone` or `text`; normalize digits; require 10 digits or 11 digits beginning with `1`; reject letters and punctuation-only input. Add a Deno test with the five scenarios. If a phone is supplied for email/chat, either validate it or omit it from the case.

---

### F-06 — Medium — Marketing revocation is still a pre-enable gate, not a customer control

**Area:** consent / TCPA pre-enable
**Maps to:** M-12, MC-03, MC-08
**Status:** **Blocked — Product/Operations**

**Evidence.** `supabase/migrations/0003_reliability_and_access.sql` implements `record_marketing_revocation` and `is_contact_suppressed`; the PGlite probe records a phone revocation and queries suppression. But there is no customer-facing STOP/withdrawal intake, no vendor/CRM propagation, and no outbound marketing path that calls `is_contact_suppressed`. The operator runbook says the path is “BLOCKED — OPERATIONS.” The server rejects every `marketing_*` consent record, so marketing cannot be enabled by configuration alone.

**Impact.** Marketing is currently disabled, so there is no active unlawful outreach. The existing “stop” language in `MessagingTermsPage.tsx` is only a promise; it must not be exposed as a live control until the inbound path and suppression check are implemented and tested.

**Remediation.** Product/operations: choose the channels (or keep them off); implement a customer-facing withdrawal route; propagate suppression to the dialer/SMS/CRM; call `is_contact_suppressed` immediately before any send; add a labelled non-customer STOP test. Do not enable a channel before this.

---

### F-07 — Medium — Retention, backup expiry and incident response remain unapproved and unexecuted

**Area:** data lifecycle / operations
**Maps to:** M-14, MC-08
**Status:** **Blocked — Legal/Operations**

**Evidence.** `app_settings.retention_months` is `null`; `purge_expired_cases()` returns 0 while null. `docs/OPERATIONS.md` marks the period, scheduled deletion, backup expiry and incident execution as BLOCKED/UNVERIFIED. `delete_case` and the audit row work in PGlite. No live backup/PITR window or restore drill is evidenced.

**Impact.** Real customer data would be retained indefinitely by default. The absence of an approved period is correct while counsel has not decided; it is not a completed lifecycle control. Deletion in the primary database does not prove deletion from backups.

**Remediation.** Counsel approves a period; operations records the backup/PITR window and deletion-from-backup behavior; schedule `purge_expired_cases`; execute one non-customer deletion and one expiry test; record evidence. Keep retention null until then.

---

### F-08 — Low — Live deployment, MFA, email, webhook and cron are unverified

**Area:** operational evidence
**Maps to:** M-09, M-13, M-17, M-18; E-01–E-04
**Status:** **Fixed locally / Pending live verification**

**Evidence.** `supabase/config.toml` commits `verify_jwt=false` for the three functions; `supabase/ops/retry-schedule.sql` defines a five-minute Vault-backed schedule. `is_reviewer()` requires AAL2; the PGlite probe shows aal1 sees zero cases and cannot call the RPC. The durable rate-limit RPC works in PGlite. But there is no hosted project, no live MFA enrolment/step-up, no Resend key, no inbox receipt, no provider webhook delivery and no cron tick.

**Impact.** Local correctness does not prove the deployed functions, auth settings, provider compatibility or scheduler are configured. A clean deployment could still fail at the first real request.

**Remediation.** Deploy to a non-production project; run a labelled non-customer end-to-end submission; test aal1 → aal2; send one real notification to the approved mailbox; send one signed webhook; run one cron tick; record results. Keep `QUESTIONNAIRE_APPROVED=false` for the live project until F-01 closes.

---

### F-09 — Low — `RATE_LIMIT_SALT` is missing from `.env.example`

**Area:** configuration / abuse resistance
**Maps to:** M-17
**Status:** **Open — documentation/config gap**

**Evidence.** `README.md:238` documents `RATE_LIMIT_SALT`, but `.env.example` does not. `submit-case` falls back to the per-instance in-memory limiter when the salt is absent (`durableRateLimited` returns null). An operator who copies `.env.example` will silently deploy without the durable limiter.

**Impact.** The durable rate limiter is optional in practice. A restart or multiple warm instances weaken abuse protection; the fallback trusts a spoofable forwarded header.

**Remediation.** Add `# RATE_LIMIT_SALT=...` and `# QUESTIONNAIRE_APPROVED=false` to `.env.example`; make the deploy checklist verify the salt is set; consider failing closed or logging a loud startup warning when it is missing in live mode.

---

### F-10 — Low — An unmatched delivery event consumes its Svix ID before the case is correlated

**Area:** delivery evidence / reliability
**Maps to:** M-08 residual
**Status:** **Open — static/SQL analysis**

**Evidence.** `apply_email_event` inserts into `email_events` first (`0003_reliability_and_access.sql:319`), then looks up the case (`:328`). If the webhook arrives before `complete_case_notification` stores `provider_message_id`, the event is stored with `case_id = null` and returns `unmatched`. A retry of the same `svix-id` hits the unique event ID and returns `duplicate` at `:324`, so the later case match is never applied.

**Impact.** A provider delivery event can be lost from the case's notification state if it races the completion call. The case remains `accepted` even though delivery was reported. This does not create a false `delivered`; it loses true evidence.

**Remediation.** Match the case before recording the event, or make an unmatched event re-correlatable (update the existing `email_events.case_id` and apply the state when the case later matches). Add a SQL regression for the race: event with message ID before `provider_message_id`, then complete, then retry the same event ID.

---

### F-11 — Low — Remediation ledger overstates two statuses and understates the sign-off count

**Area:** documentation / audit honesty
**Maps to:** M-02, M-03, M-11, M-20
**Status:** **Open — documentation defect**

**Evidence.** `audit/2026-10-27-remediation-ledger.md`:
- M-02 is marked **Resolved** even though the “remaining risk” says counsel approval of the wording remains open and the classification index lists M-02 as a legal/compliance gate.
- M-11 is marked **Fixed — Pending Verification** even though the same row says held wording remains in the public bank bundle and a policy decision is needed. That is a legal/product blocker, not a verification step.
- M-03 says “Named sign-off for **37 rows**” while `check:bank`, `docs/LAUNCH-GATES.md` and `docs/question-bank-reconciliation.md` all say **0/92** and 92 rows need sign-off.

**Impact.** A reader could conclude the consent and held-wording issues are closed. The audit prompt forbids marking a legal gate resolved by engineering alone.

**Remediation.** Change M-02 to **Blocked — Legal** (engineering controls complete), M-11 to **Blocked — Legal/Product**, and the M-03 remaining risk to “92 rows.” Then update the summary counts. This is a documentation correction, not a code change.

---

### F-12 — Informational — Privacy page asserts at-rest encryption without provider evidence in the repository

**Area:** privacy copy / evidence gap
**Maps to:** E-05/E-06
**Status:** **Documented limitation**

**Evidence.** `src/pages/PrivacyPage.tsx` says submitted answers are “written to an access-controlled case store with encryption in transit and at rest.” The repository can prove TLS and access control in code; it cannot prove the hosted provider's at-rest encryption, backup encryption or key management. No provider configuration or attestation is committed.

**Impact.** The copy may be true for Supabase, but it is a vendor claim, not a repository-verified control. This is not a confirmed defect; it is an evidence gap that should be confirmed in the provider console or softened.

---

## 5. Master finding crosswalk

Statuses are this audit's assessment, not the prior ledger's claims.

| ID | Severity | Finding | Status | Evidence / gap |
|---|---|---|---|---|
| M-01 | High | Fabricated questionnaire snapshot accepted | **Resolved — local** | Canonical server bank; Deno tests reject held/invented/zero/forged version; source text/timeframe rebuilt |
| M-02 | High | Consent evidence client-asserted | **Blocked — Legal** | Server policy and 9 consent tests pass; counsel approval of wording still absent |
| M-03 | High | Seven source windows replaced; no source-verified row | **Blocked — Legal/Product** | 0/92 signed off; 7 timeframe changes; 28 gaps; launch lock 503 |
| M-04 | High | Client crisis flag/flags trusted | **Resolved — local** | Derived from MH-05; Deno test sends false/empty and observes derived urgent flag |
| M-05 | Medium | Branch-closed details survive | **Open — nested gap** | Direct child pruning works; `MIL-01→MIL-02→MIL-04` revives stale answer after reopen |
| M-06 | Medium | No submission idempotency | **Resolved — local** | Unique idempotency key; handler replay; SQL duplicate rejected; live concurrency not run |
| M-07 | Medium | Duplicate notification sends / no claim | **Resolved — local** | Lease claim; one winner; provider idempotency header; live provider not run |
| M-08 | Medium | Replayed/out-of-order webhook | **Resolved — local** | Svix signature tests; SQL dedupe/monotonic; unmatched-event race remains F-10 |
| M-09 | Medium | No deployment config/schedule | **Fixed — Pending Verification** | `supabase/config.toml`, retry schedule; no clean deploy or cron tick |
| M-10 | Medium | No adult/self or jurisdiction verification | **Resolved — local** | DOB/age 18+, 51 state codes, self-only; Deno tests |
| M-11 | Medium | Held source wording shown to customers | **Blocked — Legal/Product** | UI generic; bundle still contains source text (F-02) |
| M-12 | Medium | Marketing revocation/suppression unimplemented | **Blocked — Product** | Reviewer RPC + suppression table; no customer path or vendor propagation |
| M-13 | Medium | Reviewer MFA enrollment-only | **Fixed — Pending Verification** | `is_reviewer` requires AAL2; aal1 denied in PGlite; live step-up not run |
| M-14 | Medium | No retention/deletion/backup/incident control | **Blocked — Legal/Operations** | Delete/expiry code; retention null; backups/incident unexecuted |
| M-15 | Low | Privacy acknowledgement wrong version | **Resolved — local** | Separate `privacyVersion`; consent test; server compares |
| M-16 | Low | Character cap instead of byte cap | **Resolved — local** | Streaming byte reader; 300k two-byte test returns 413 |
| M-17 | Low | Per-instance spoofable rate limit | **Fixed — Pending Verification** | Durable salted RPC; in-memory fallback; `.env.example` salt gap (F-09); WAF/client IP unverified |
| M-18 | Low | `not_sent` never retried | **Fixed — Pending Verification** | Retry includes `not_sent` when provider configured; no live scheduler |
| M-19 | Low | Confirmation says queued when not sent | **Resolved — local** | Header branches `notificationSent`/failed/not_sent; docs check |
| M-20 | Low | Stale/misleading docs and UI counts | **Resolved — customer docs** | `check:docs` passes 92/87/5/0; audit ledger still has F-11 contradictions |
| M-21 | Low | Dependency/CI supply chain | **Resolved — local** | `npm audit` 0; actions SHA-pinned; `npm ci --ignore-scripts` |
| M-22 | Low | Deno unpinned/no lockfile | **Resolved — local** | Exact versions; `deno.lock`; tests use `--lock` |
| M-23 | Low | No `opened` access entry | **Resolved — local** | `getCase` RPC; PGlite one entry across two loads; live log not inspected |
| M-24 | Info | Immutability trigger incomplete | **Resolved — local** | Payload/times/version/idempotency/crisis/state protected; service role can still change status (F-03) |

**Counts:** 14 resolved-local, 4 fixed-pending, 5 blocked legal/product, 1 open (M-05), plus new findings F-03/F-04/F-05/F-09/F-10/F-11/F-12. The 14 resolved-local rows are not a claim that the live deployment is verified.

---

## 6. Questionnaire matrix

The full 113-source / 92-row matrix is preserved in [`docs/question-bank-reconciliation.md`](../../docs/question-bank-reconciliation.md) and [`audit/2026-10-27-questionnaire-matrix.md`](../2026-10-27-questionnaire-matrix.md). This section records the totals and the decisions that remain open.

| Verdict | Count | Meaning |
|---|---:|---|
| `matches_source` | 55 | Bank row follows the source wording/window |
| `split_source_compound` | 3 | Source compound question split into two rows |
| `wording_changed` | 11 | Wording differs; reviewer decision required |
| `timeframe_changed` | 7 | Window differs; reviewer decision required |
| `added_by_lpp` | 9 | LPP addition not in source |
| `not_in_source` | 2 | Misattributed as source; now supplemental |
| `held_for_review` | 5 | Not asked; legal/clinical review required |

### Seven changed windows

| Row | Source | Bank window | Open decision |
|---|---|---|---|
| `MED-10` | SRC-021/022/037 | Past 5 years | Current-state source; mixed 5-year mental-health window |
| `AVI-04` | SRC-050 | Next 12 months | Source says next two years |
| `AVO-01` | SRC-055 | Past 5 years | Source says 2 years |
| `RES-02` | SRC-101/103 | Past 5 years | Bank question is neither source question exactly |
| `RES-03` | SRC-099/100 | Next 12 months | Source says next 2 years / 24 months |
| `MIL-01` | SRC-109 | Ever | Source asks current service |
| `MIL-03` | SRC-110 | Past 12 months | Source asks current deployment, no lookback |

### Held rows

| Row | Topic | State |
|---|---|---|
| `ID-04` | Sex/gender | Held; no source wording rendered; bundle issue F-02 |
| `MED-11` | HIV/AIDS | Held; server rejects answered content; bundle issue F-02 |
| `MH-06` | Suicide-attempt detail | Held; clinical/legal review |
| `RES-04` | Immigration category | Held; legal review |
| `RES-05` | Visa/green-card number | Held; should not be collected in this intake |

### Source gaps

28 source questions are not fully represented: 19 `merge_into` (partly collected) and 9 `out_of_scope` (written reason). None is `add_question`. Every source question is either traced or recorded; `check:bank` fails on an unacknowledged source item. The reviewer must accept or revise each gap; the audit cannot do so.

### Crisis and answer states

- `MH-05` is unconditional (`crisisFollowUp: true`, no `askWhen`); the engine test covers history answers No/Unknown/declined.
- Yes, No, Unknown, Prefer not to answer, unresolved, held, not asked and not applicable remain distinct. `not_applicable` is rejected server-side; the UI never offers it.
- A blank is `unresolved`, never `No`.
- Current-crisis copy offers 988 and 911, says the site does not monitor emergencies, and does not claim dispatch.

---

## 7. Launch-gate matrix

| # | Gate | Status | Evidence / remaining |
|---|---|---|---|
| 1 | Question coverage | **PARTIAL** | 113 inventory, 92 rows, 28 gaps, 0/92 signed off; seven changed windows |
| 2 | Branch coverage | **PARTIAL** | 14 branches; direct child tests pass; nested `MIL-04` revival (F-04) |
| 3 | Answer integrity | **PASS — local** | Distinct states; server canonical rebuild; held/closed content rejected |
| 4 | Review and submission | **PASS — local** | Edit clears acknowledgement; exactly one current acknowledgement; server rejects stale/forged |
| 5 | Consent separation | **PARTIAL** | Two required consents; marketing off; legal wording and customer revocation open |
| 6 | Recipient control | **PASS — local** | Server constant/allowlist; no browser recipient; email has no PHI |
| 7 | Secure access | **PARTIAL** | AAL2 + RLS; live MFA unverified; direct reviewer-write gap (F-03) |
| 8 | Delivery reliability | **PARTIAL** | Idempotency/claim/monotonic code; no live provider/scheduler; unmatched-event race (F-10) |
| 9 | Leak prevention | **PARTIAL** | No analytics/storage/URL answers; minimal email; held bundle (F-02); provider logs/backups unverified |
| 10 | Human review | **PASS — local** | Append-only corrections; explicit review actions; no eligibility decision |

---

## 8. Documentation contradictions

| Contradiction | Evidence | Required correction |
|---|---|---|
| M-02 marked Resolved but counsel approval remains open | `audit/2026-10-27-remediation-ledger.md:45` | Mark **Blocked — Legal**; keep engineering evidence |
| M-11 marked Fixed—Pending but held wording remains in bundle | `audit/2026-10-27-remediation-ledger.md:54` | Mark **Blocked — Legal/Product** until F-02 is decided |
| M-03 remaining risk says 37 rows | `audit/2026-10-27-remediation-ledger.md:46` | Say **92 rows**; current data is 0/92 |
| Gate 7 says “Implemented” while live MFA is unverified | `docs/LAUNCH-GATES.md` Gate 7 | Mark PARTIAL or keep the explicit E-04 caveat |
| Privacy page claims at-rest encryption | `src/pages/PrivacyPage.tsx` | Confirm provider evidence or soften; F-12 |
| `.env.example` omits the rate-limit salt the README requires | `.env.example` vs `README.md:238` | Add the variable; F-09 |

The customer-facing docs otherwise pass `check:docs` on the audited counts. The audit ledger's statuses are the material contradiction.

---

## 9. Test ledger

| Check | Environment | Expected | Actual | Status |
|---|---|---|---|---|
| `npm run typecheck` | local Node | no type errors | no errors | PASS |
| `npm run build` | local Vite | production build | 671 kB chunk warning only | PASS |
| `npm run check:bank` | local Node | 92/87/5, 113/85/28 | matches | PASS |
| `npm run check:docs` | local Node | docs counts/claims | matches | PASS |
| `npm run check:server-bank` | local Node | 92 rows match | matches | PASS |
| `npm run check:server-policy` | local Node | policy matches | matches | PASS |
| `npm run test:consent` | local Node | 7 tests | 7 pass | PASS |
| `npm run test:engine` | local Node | 6 tests | 6 pass | PASS |
| Deno tests | local Deno 2.9.6 | 32 tests | 32 pass | PASS |
| PGlite 0001–0003 replay | isolated PGlite | migrations idempotent, controls hold | 0 failures | PASS |
| Targeted RLS probe | isolated PGlite | direct writes denied | direct writes allowed | **FAIL (F-03)** |
| Nested branch probe | local tsx | no stale answer on reopen | stale `MIL-04` revived | **FAIL (F-04)** |
| Phone probe | local Deno | phone/text requires usable phone | missing/junk accepted | **FAIL (F-05)** |
| `npm audit --audit-level=high` | local Node | no high advisories | 0 vulnerabilities | PASS |
| `/start` empty submit | Vite preview, browser | required errors, focus first | 5 errors, first field focused | PASS |
| `/portal` preview | Vite preview, browser | explicit preview, no fake login | labelled preview button | PASS |
| `/portal/LPP-2026-SAMPLE` | Vite preview, browser | reference alone denied | sign-in required; local preview button | PASS |
| Console/network | browser | no app errors | no app errors; external Google Fonts | PASS with note |
| Full 92-question walkthrough | browser | complete flow | not attempted | **NOT RUN** |
| Accessibility/mobile | browser/device | keyboard/screen-reader/contrast | not attempted | **NOT RUN** |
| Live Supabase/Resend/MFA/cron | hosted | end-to-end evidence | no project/key | **NOT RUN** |

The targeted probes are disposable and are not yet committed regression tests. That is a gap: F-03, F-04 and F-05 should become repository tests before they can be marked resolved.

---

## 10. Remediation sequence

### P0 — before any real customer data

1. **F-01:** obtain named reviewer/counsel sign-off for all 92 rows and all 28 gaps; restore or approve the seven windows; bump `QUESTIONNAIRE_VERSION`; regenerate the report. Keep `QUESTIONNAIRE_APPROVED=false`.
2. **F-02:** decide the held-wording bundle policy; split the customer bank from internal audit data or redact held `sourceText`; add a built-bundle canary check.
3. **F-03:** add migration 0004 revoking direct `cases` update and `case_review_log` insert; drop the corresponding policies; keep the RPC; commit a PGlite regression and run it in CI.
4. **F-04:** make branch pruning recursive; add the `MIL-01→MIL-02→MIL-04` close/reopen test.
5. **F-05:** enforce phone for phone/text on the server; reject non-digit/junk; add Deno tests.
6. **F-07:** counsel approves retention; operations records backup/PITR expiry and incident execution; schedule the purge job.

### P1 — before public launch

7. **F-06:** implement and test a customer STOP/withdrawal route and vendor suppression; keep channels off until then.
8. **F-08:** deploy to a non-production project; verify AAL2 step-up, one notification, one signed webhook, one cron tick, clean 401→201; run a labelled non-customer end-to-end.
9. **F-09:** add `RATE_LIMIT_SALT` and `QUESTIONNAIRE_APPROVED` to `.env.example`; make live-mode missing-salt visible.
10. **F-10:** fix the unmatched-event race and add a SQL regression.
11. **F-11:** correct the ledger statuses and the 37/92 count.
12. **F-12:** confirm or soften the at-rest encryption claim.

### P2 — hardening

13. Commit the SQL probes as a test target; add `check:rls` to CI.
14. Add a build-artifact held-wording check to CI.
15. Add a live non-customer deletion/expiry drill and a backup-restore drill.
16. Re-run the full suite after every change; do not close a legal/product gate by documentation alone.

---

## 11. Owner and counsel questions

1. **Questionnaire:** Do you approve each of the seven changed windows, or should the bank be changed to the source windows? Who signs each of the 92 rows and each of the 28 gaps, and on what date?
2. **Held wording:** May the five held source phrases remain in the public JavaScript bundle? If not, should the customer bank be split from the internal audit bank?
3. **Consent wording:** Has counsel approved the intake permission, privacy acknowledgement, submission acknowledgement and (if any) TCPA disclosure? The current text is a draft.
4. **Entity and channels:** What is the actual legal seller entity? Are any marketing calls/texts operated? If not, keep every channel off and remove the “stop” promise from live use.
5. **Retention:** What retention period, backup expiry and deletion-from-backup rule does counsel require? Who executes a deletion request?
6. **Clinical:** Who approves the current-crisis script and the held mental-health rows? Is 988/911 the approved support path in every served state?
7. **Licensing:** Which states are you licensed/authorized to serve? The current 51-code check verifies a US state, not your authority to do business there.
8. **Operations:** Who owns the review mailbox, MFA enrolment, Resend sender domain, webhook secret, cron secret and incident on-call?
9. **Rate limiting:** What WAF/proxy guarantee provides a trusted client IP? The durable limiter salts a forwarded header but cannot make a spoofed header trustworthy.
10. **HIPAA/Texas:** Has counsel decided whether HIPAA, Texas Insurance Code Chapter 602 or another regime applies? The repository does not claim compliance.

---

## 12. Explicitly unverified

- **E-01:** hosted Supabase schema, migration history, RLS, grants and RPCs. Only PGlite replay.
- **E-02:** deployed functions, `verify_jwt`, environment variables, Origin allowlist, cron, timeouts, memory, observed rate limiting. No deployed project.
- **E-03:** Resend acceptance, inbox receipt, bounce/complaint handling, Svix compatibility, sender-domain authentication. No key/mailbox.
- **E-04:** live MFA enrolment and aal1→aal2 step-up. Code and PGlite only.
- **E-05:** retention execution, backup/PITR window, deletion from backups, incident response. Documents are runbooks, not evidence.
- **E-06:** CSP, cache rules and security headers. No host configuration.
- **E-07:** screen-reader, keyboard-only full walkthrough, contrast, mobile device. Not run.
- **E-08:** current primary-law research. The attached TCPA article is secondary; no legal conclusion.
- **E-09:** concurrency, soak and rate-limit evasion against a deployed endpoint. Not run.
- **E-10:** word-by-word semantic approval of the 55 `matches_source` rows and all 28 gap reasons. The matrix records them; a human must approve.

---

## 13. Conditions before accepting real customer submissions

1. **MC-01 / F-01:** all 92 rows signed off; seven windows restored or approved; 28 gaps accepted/revised; version bumped; report regenerated; `QUESTIONNAIRE_APPROVED=true` only after that.
2. **MC-02 / M-01/M-04:** canonical server bank and derived crisis state remain enforced; no regression.
3. **MC-03 / F-06:** counsel-approved consent wording; server-owned policy; marketing channels off until a tested revocation/suppression path exists.
4. **MC-04 / F-04/F-05:** recursive branch pruning and server-side phone validation; no stale answer can revive.
5. **MC-05 / M-06:** idempotent submission and fresh acknowledgement; no duplicate case on timeout.
6. **MC-06 / F-08/F-10:** live delivery, lease, provider idempotency, signed/deduplicated/monotonic webhook; honest `not_sent`.
7. **MC-07 / F-03:** AAL2 reviewer access plus RPC-only review writes; no direct status/log writes.
8. **MC-08 / F-07:** approved retention, deletion, backup expiry, incident response and revocation execution.
9. **MC-09 / F-02:** held wording not exposed to customers, including the bundle; privacy version and counts correct.
10. **MC-10:** legal/clinical approval of entity, notice, intake permission, TCPA, sensitive questions and crisis script.
11. **MC-11:** mailbox ownership, sender domain, provider settings, monitoring, on-call, deployment config and labelled end-to-end test.
12. **MC-12:** pinned dependencies, SHA-pinned CI actions, Deno lockfile, reviewed install scripts.
13. **MC-13:** keep the environment labelled preview and accept no real applicant data until 1–12 close.

---

## 14. Bottom line

The implementation is no longer the preparation-baseline prototype that accepted a fabricated questionnaire. The canonical bank, server consent policy, derived crisis state, idempotency, leases, webhook verification, AAL2 policies and byte cap are real improvements and their local tests pass. The launch posture is honest because the public function refuses live intake until the questionnaire is approved.

It is still **not ready for real customer health information**. The questionnaire is unsigned, held wording is in the bundle, reviewer writes bypass the audit RPC, nested branch state can revive, server contact validation is incomplete, and the legal/operational gates are open. The preview is suitable only for labelled non-customer demonstrations.
