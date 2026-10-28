# Specification conformance review — 28 October 2026

**Baseline:** `main` @ `79e8af4f58ad74914241ef4660f765da105949c9`  
**Specification:** *Life Policy Pilot — Pre-Underwriting Agent Specification* (attached PDF)  
**Specification SHA-256:** `e4bc308484c657e6d13cdff18cedd756f00d72003b7278ae9e1ef9490bfdc498`  
**Issue register:** [`ISSUES.md`](ISSUES.md)  
**Cross-pass preservation register:** [`CURRENT-FINDING-REGISTER.md`](CURRENT-FINDING-REGISTER.md) (A5 + A6)  
**Additional findings:** `SC-09`–`SC-12` (4, from the live-review and server-authority checks)  
**Verdict:** **SPEC-CONFORMANT for the deterministic customer questionnaire; NOT READY for production or real customer health information.** The live reviewer step-up is incomplete (`SC-09`), and the production, questionnaire sign-off and legal gates remain open.

## What this package is

This is **A6**, a conformance review of the attached product specification against the checkout. It is not a replacement for A5's full security audit and it does not reopen or close any A5 finding. The current security assessment remains [`../2026-10-28-qwencloud-reaudit/REPORT.md`](../2026-10-28-qwencloud-reaudit/REPORT.md), with its remediation in [`../2026-10-28-qwencloud-remediation/`](../2026-10-28-qwencloud-remediation/). `SC-09`–`SC-12` are additional targeted findings from this pass.

The attached zip is the same source snapshot as the current `main` commit `79e8af4`; it contains no separate code to apply. **No application code was changed by this pass.** The package preserves the issues, evidence and context so the review is not discarded.

The first pass recorded eight specification-conformance issues. The final pass adds four findings from the reviewer and server-authority checks: the missing TOTP enrolment/challenge (`SC-09`), accepted contradictory identity fields and out-of-bank choice values (`SC-10`), conditional magic-link account creation (`SC-11`), and the 50-case queue truncation (`SC-12`). These are additive; the earlier eight findings remain in the same register.

The PDF itself describes a **proposed implementation**, not an operating integration. Its production acceptance tests and launch dependencies remain the authority for whether the service can accept real customer data.

## Conformance result

| Specification area | Result | Evidence |
| --- | --- | --- |
| Introduction, lead form, intake permission, questionnaire, review, affirmative submission | **Implemented** | React flow in `src/features/intake/`; consent records and versions in `src/features/consent/consentTexts.ts` |
| One question at a time, visible progress, source windows preserved | **Implemented structurally** | 92 bank rows, 113 source questions, 14 branches; `npm run check:bank` |
| Answer integrity: blanks/uncertainty/refusal never saved as “No” | **Implemented** | `src/features/interview/engine.ts`; `npm run test:engine` |
| Current crisis separated from historical disclosure; 988/911 support | **Implemented** | `CrisisPanel`, `MH-05`, engine tests |
| Corrections before submission; edits invalidate review confirmation | **Implemented** | `ReviewScreen`; server acknowledgement checks in `supabase/functions/_shared/case.ts` |
| Secure reviewer access with source references and a review summary | **Partly** — AAL2 enforcement and RLS are implemented; the portal has no TOTP enrolment or challenge, so a real reviewer cannot step up (`SC-09`) | AAL2 checks in `useReviewerAuth.ts`, `PortalPage.tsx`, `CaseReview.tsx`; deterministic `buildDraftSummary` |
| Consent separation; marketing off unless configured | **Implemented; revocation is conditional** | `src/config/site.ts`; `docs/OPERATIONS.md` |
| Minimal notification, fixed recipient, retries, delivery states | **Implemented; not exercised against a live provider** | `supabase/functions/_shared/email.ts`; `StatusTimeline`; `check:db` |
| No SSN, payment, passport, visa/green-card numbers, or identity scans | **Implemented** | Held rows `RES-05`; bank review; `docs/LAUNCH-GATES.md` |
| Production deployment, real reviewer MFA, live mailbox, retention | **Not completed** | `README.md` status table; `docs/LAUNCH-GATES.md`; staging record |

## Issues saved

| ID | Severity | Issue | Status |
| --- | --- | --- | --- |
| [`SC-01`](ISSUES.md#sc-01--the-ai-assistant-and-ai-generated-summary-are-not-implemented) | High — product decision | The spec asks for an AI assistant and an AI-generated draft summary; the build is deterministic and says no AI assistant is active. | Open — owner must amend the spec or approve a model layer |
| [`SC-02`](ISSUES.md#sc-02--no-customer-facing-marketing-revocation-path) | Medium — conditional | No customer-facing marketing revocation or local-time/state enforcement exists; only an operator RPC exists while marketing is off. | Open — becomes a launch blocker only if a channel is enabled |
| [`SC-03`](ISSUES.md#sc-03--production-deployment-and-live-verification-are-incomplete) | High — launch blocker | No production deployment, staff AAL2 enrolment, live provider/inbox test, or retention execution. | Open |
| [`SC-04`](ISSUES.md#sc-04--the-question-bank-is-not-signed-off) | High — launch blocker | 0 of 92 rows are signed off; 28 source gaps remain documented; 5 rows are held. | Open — named reviewer required |
| [`SC-05`](ISSUES.md#sc-05--legal-and-operational-approvals-are-absent) | High — legal/ops blocker | Legal entity, counsel-approved wording, licensed states, retention, vendor review and mailbox/MFA are unconfirmed. | Open |
| [`SC-06`](ISSUES.md#sc-06--readme-status-table-contradicts-the-staging-record) | Low — documentation | `README.md` says the backend has not been run, while the staging package records migration 0005 and a live AAL2 queue response. | Open |
| [`SC-07`](ISSUES.md#sc-07--edge-function-tests-were-not-run-in-this-pass) | Info — verification gap | The first pass could not run Deno; the re-run passed 36/36. | Closed in this pass — evidence retained |
| [`SC-08`](ISSUES.md#sc-08--no-automated-inconsistency-flags) | Low — review-package gap | Flags cover unresolved, declined, held, uncertain and crisis, but not cross-answer inconsistencies or approximate-date notices. | Open — decide whether manual detection is acceptable |
| [`SC-09`](ISSUES.md#sc-09--the-portal-enforces-aal2-but-has-no-totp-enrolment-or-challenge) | High — launch blocker | The portal checks for AAL2 and then shows an instruction screen; it never enrols a factor, creates a challenge or verifies a code. A real reviewer cannot reach AAL2 in the app. | Open — engineering |
| [`SC-10`](ISSUES.md#sc-10--server-accepts-contradictory-identity-answers-and-out-of-bank-field-values) | Medium — data integrity | A forged draft can submit a DOB or state that contradicts the lead and a choice field value outside the bank; the probes were accepted. | Open — engineering |
| [`SC-11`](ISSUES.md#sc-11--magic-link-sign-in-can-create-accounts-for-any-address) | Medium — abuse/configuration | `signInWithOtp` omits `shouldCreateUser: false`; if hosted signups are enabled, any address creates an Auth user and receives mail, while the UI says allowlist-only. | Open — engineering/operations |
| [`SC-12`](ISSUES.md#sc-12--the-reviewer-queue-silently-stops-at-50-cases) | Low — operational | The queue selects at most 50 cases with no pagination, filter or older-case path. | Open — engineering |

## Verification performed

| Command | Result | Log |
| --- | --- | --- |
| `npm run build` | PASS — typecheck and production build; 615.65 kB JS / 170.87 kB gzip | [`evidence/build.log`](evidence/build.log) |
| `npm run check:bank` | PASS — 92 rows, 87 approved, 5 held, 0 signed off; 113 source questions, 85 traced, 28 gaps | [`evidence/check-bank.log`](evidence/check-bank.log) |
| `npm run check:bundle` | PASS — withheld source and reviewer notes absent | [`evidence/check-bundle.log`](evidence/check-bundle.log) |
| `npm run check:docs` | PASS — documentation counts match | [`evidence/check-docs.log`](evidence/check-docs.log) |
| `npm run check:db` | PASS — migrations 0001–0005, RLS/AAL2, queue view, retries, delivery events, revocation, deletion; 0 failures | [`evidence/check-db.log`](evidence/check-db.log) |
| `npm run test:consent` | PASS — 7/7 | [`evidence/tests-consent.log`](evidence/tests-consent.log) |
| `npm run test:engine` | PASS — 8/8 | [`evidence/tests-engine.log`](evidence/tests-engine.log) |
| `npm run test:validation` | PASS — 5/5 | [`evidence/tests-validation.log`](evidence/tests-validation.log) |
| `npm run check:server-bank` | PASS — 92 rows; server notes present only in the server bank | [`evidence/full-verification.log`](evidence/full-verification.log) |
| `npm run check:server-policy` | PASS — consent wording/version match | [`evidence/full-verification.log`](evidence/full-verification.log) |
| `npm audit --audit-level=high` | PASS — 0 high/critical vulnerabilities | [`evidence/full-verification.log`](evidence/full-verification.log) |
| Deno edge-function suite | **PASS — 36/36** via pinned `npx --yes deno@2.9.6` | [`evidence/deno-tests.log`](evidence/deno-tests.log) |
| Identity/field consistency probe | **FAIL AS EXPECTED** — three forged drafts accepted; recorded as `SC-10` | [`evidence/identity-and-field-probe.log`](evidence/identity-and-field-probe.log) |

The green local suite does not prove hosted RLS, production migration, a real reviewer's TOTP step-up, provider delivery, inbox receipt, scheduler execution, retention or a browser walkthrough. It also cannot make the missing MFA challenge work. The only hosted evidence remains the staging record at [`../2026-10-28-migration-0005-staging/README.md`](../2026-10-28-migration-0005-staging/README.md); that check used direct GoTrue calls, not this portal.

## Minimum adversarial scenarios

This is the audit prompt's scenario floor, recorded against this pass. It is not a substitute for the earlier A4/A5 security packages; a scenario marked **PARTIAL** or **NOT RUN** is not a pass.

| # | Scenario | Status | Evidence / limitation |
| --- | --- | --- | --- |
| 1 | Intake completes with optional marketing disabled/unchecked; no enrollment | **PASS — local** | 7/7 consent tests; no marketing record when no channel is enabled |
| 2 | Missing or declined required permissions rejected through direct API requests | **PASS — local** | 7/7 `submit-case` Deno tests; 422 assertions |
| 3 | Forged payload attempts disabled marketing consent or altered disclosure versions | **PASS — local** | `validate-draft` Deno tests reject disabled marketing and wrong versions |
| 4 | Parent answers change after detail entry; orphaned answers disappear downstream | **PASS — local** | 8/8 engine tests, including nested `MIL-01 → MIL-02 → MIL-04` pruning |
| 5 | Unknown, declined, blank, not asked and held answers remain distinct; no fabricated No | **PASS — local** | Engine and validation tests; server canonical rebuild |
| 6 | Review acknowledgment invalidated by edits; forged/stale acknowledgment rejected server-side | **PARTIAL** | Server stale-ack test passes; UI invalidation was inspected statically, not exercised in a browser |
| 7 | Held questions, unknown IDs, changed timeframes and invented source wording submitted directly | **PASS — local** | Deno validation tests reject held/unknown rows and restore canonical source text |
| 8 | Unauthenticated and authenticated non-reviewer case/correction/RPC access | **PARTIAL** | PGlite and staging deny anonymous and `aal1`; a real authenticated non-allowlisted account was not exercised in this pass |
| 9 | Copied notification or guessed reference does not grant access | **PARTIAL** | RLS and AAL2 deny access in PGlite/staging; no live forwarded-email test in this pass |
| 10 | Recipient/routing fields and instruction-like answers cannot redirect notification | **PASS — static; live not run** | Recipient and subject are server constants; no live provider call was made |
| 11 | Duplicate submissions, ambiguous timeouts and overlapping notification retries | **PARTIAL** | PGlite idempotency/claim tests pass; no live timeout/concurrency test |
| 12 | Forged, replayed, malformed and out-of-order delivery events cannot create false status | **PASS — local** | 5/5 Svix tests and PGlite event-state checks; no live webhook |
| 13 | Current-crisis handling still works when history is No, Unknown or declined | **PASS — local** | 8/8 engine tests cover all three history states |
| 14 | Fictitious sensitive-data canaries across browser, network, log and email surfaces | **PARTIAL** | Bundle and log checks pass; no live network/provider capture or browser canary run |

## What this package does not do

- It does not approve the questionnaire, the legal wording, the crisis script, the retention period or any vendor.
- It does not deploy anything to production.
- It does not claim HIPAA, Texas Insurance Code or any other compliance status.
- It does not turn the deterministic summary into an AI-generated summary.
- It does not implement the missing TOTP enrolment/challenge (`SC-09`) or fix the server-authority gaps in `SC-10`.
- It does not replace A5, the master issue list or the launch gates in [`../../docs/LAUNCH-GATES.md`](../../docs/LAUNCH-GATES.md).

## Preservation

The package is dated and additive. Do not rewrite it to make a later finding disappear; add a later package and link it from [`../AUDIT-INDEX.md`](../AUDIT-INDEX.md). The evidence logs, this report and the cross-pass register are covered by [`MANIFEST.sha256`](MANIFEST.sha256).
