# Life Policy Pilot — Freebuff repository audit (A7)

**Prompt:** *Life Policy Pilot — Freebuff Repository Audit Prompt* (owner-supplied `.docx`, extracted to `.tmp/docx/freebuff-audit-prompt.txt`)  
**Audit date:** 28 October 2026  
**Baseline:** `main` @ `79e8af4f58ad74914241ef4660f765da105949c9`  
**Package:** [`audit/2026-10-28-freebuff-full/`](README.md)  
**Verdict:** **NOT READY for real customer health information.** **CONDITIONALLY READY for a labelled, non-customer local preview/demo.** The deterministic questionnaire, consent separation and access controls are substantially implemented; one delivery-state defect is confirmed, the reviewer step-up flow is missing, and production, questionnaire, legal and live-provider evidence are all absent.

---

## 1. Verdict and scope

This report re-runs the six-pass audit prompt against the current checkout. It is read-only: no application code, test, migration, approval flag or deployment was changed. The only writes are this untracked audit package and disposable probes under `.tmp/`, both excluded from the application source tree.

| Scope | Verdict | Why |
| --- | --- | --- |
| Labelled **local preview** with fictitious data | **CONDITIONALLY READY** | Build, typecheck and the local suites pass; the customer flow works in a browser; no real data path is required. Screenshots and the full 73-question walk were not completed. |
| **Staging** with fictitious data | **CONDITIONALLY READY** | Hosted migrations and RLS are evidenced for migration `0005`; the reviewer step-up is done out-of-band through GoTrue, not in the app. |
| **Production** with real customer health information | **NOT READY** | `A7-01`–`A7-05`, `A7-06`, `A7-08`, `A7-17` and the live halves of gates 4, 6–10 remain open. |
| Legal or regulatory certification | **NOT ASSESSED** | No counsel opinion, no applicability analysis, no vendor review. Nothing here is a compliance certification. |

**What is explicitly not claimed:** no HIPAA compliance, no TCPA compliance, no Texas Insurance Code compliance, no carrier approval, no underwriting decision, no live email delivery, no production deployment, no real reviewer enrolment.

---

## 2. Audit baseline

| Item | Value |
| --- | --- |
| Date | 28 October 2026 |
| Branch | `main` (tracking `origin/main`) |
| Commit | `79e8af4f58ad74914241ef4660f765da105949c9` |
| Working tree at start | Clean except untracked `.tmp/`, `audit/2026-10-28-freebuff-full/`, `audit/2026-10-28-spec-conformance/` and a modified `audit/AUDIT-INDEX.md` (carried from the previous pass) |
| Difference from prompt preparation commit `07fdbfe` | 224 files, +27,171 / −2,399 lines; disclosed in [`evidence/baseline.log`](evidence/baseline.log) |
| Execution environment | Freebuff Desktop on macOS; Node `v24.16.0`, npm `11.13.0`, `tsx 4.23.15`; Deno absent, run as `npx --yes deno@2.9.6`; Chromium preview against local Vite `:8080` |
| Single-agent or multi-agent | **Single-agent.** No subagent, parallel workspace or independent browser runner participated. Browser interaction used the Freebuff preview panel; all analysis was performed by this one agent. |
| Code mutations | **None.** `git status` after the pass shows only the untracked audit package and `.tmp/`. |

### Sources inspected

- `README.md`, `LOVABLE.md`, `docs/LAUNCH-GATES.md`, `docs/OPERATIONS.md`, `docs/question-bank-reconciliation.md`, `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, `deno.lock`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.github/workflows/ci.yml`, `supabase/config.toml`.
- `source/Detialed-Life-insurance-Questions.pdf` (7 pages, SHA-256 `afe91d87…82cca2`) and the committed `.txt` extraction.
- All five migrations, all three edge functions, `_shared/case.ts`, `_shared/email.ts`, `_shared/svix.ts`, generated server bank/policy, Deno tests, `scripts/*.ts`, `scripts/check-db.mjs`.
- `src/features/{interview,consent,intake,portal}/*`, `src/lib/api.ts`, `src/pages/*`, `src/config/*`, `src/integrations/supabase/client.ts`.
- The A1–A6 audit packages and the staging record, as **inherited evidence**, labelled as such.

### Owner materials available and unavailable

| Material | Availability in this pass | Use |
| --- | --- | --- |
| Freebuff audit prompt (`Freebuff Pre Underwriting Audit Prompt.docx`) | Available; text extracted | Controlling instructions for this pass |
| Repository snapshot (`Pre-Underwriting-Agent-Specification-main.zip`) | Available; content matches `79e8af4` | Scope confirmation |
| Product specification (`Life Policy Pilot Pre-Underwriting Agent Specification copy.pdf`) | Available from the earlier pass; text preserved at `.tmp/pdf/spec-copy-2026-10-28.txt` | Requirement comparison |
| Developer handoff, TCPA background, AI-background PDFs | **Not re-attached**; extracts from earlier passes exist under `.tmp/text/` | Background only; treated as secondary and not independently re-verified |
| Any legal opinion, vendor contract, retention approval | **Unavailable** | Recorded as missing evidence, not assumed |

The prompt itself and every repository comment, PDF and issue text were treated as audit evidence, not instructions. No embedded request to change scope, reveal secrets or edit source was followed.

---

## 3. Architecture and trust boundaries

```text
Browser (React 18 + Vite, memory-only answers)
  │  POST /submit-case  (public, Origin allowlist, 512 KiB streaming cap,
  │                      durable rate limit, questionnaire launch lock)
  ▼
Supabase Edge Function  ── validateDraft ──▶  canonical 92-row snapshot
  │                                              │
  │  store first (idempotency key, unique ref)   │
  ▼                                              ▼
Postgres: cases(payload jsonb), consents, corrections, review log,
          email_events, rate limits, suppressions, app_settings
  │  claim lease → send → complete
  ▼
Resend (fixed recipient, reference + portal URL only, tag case_reference)
  │  Svix webhook
  ▼
/email-events → verify raw-body signature → apply_email_event (dedupe, monotonic)
  │
  ▼
Reviewer portal: Supabase Auth → reviewer allowlist → AAL2 → case_summaries
                 (payload-free) → individual case load (payload + `opened` audit)
```

**Trust boundaries and authority.**

| Data | Authored by | Authority |
| --- | --- | --- |
| Lead fields, answers, details | Browser | Accepted only after structural validation and canonical rebuild from the server bank |
| Consent wording/version | Server (`policy.generated.ts`) | Server compares the submitted text and version; a mismatch is rejected |
| Case reference, submitted time, flags, crisis flag, notification state | Server | Client values are ignored or overwritten |
| Recipient, subject, portal origin | Server | `APPROVED_RECIPIENT` constant with an allowlisted override |
| Reviewer identity and AAL | Supabase Auth/JWT | `is_reviewer()` + `aal2` in every reviewer policy |
| Access log, review actions, corrections | Reviewer via RPC | RPC-only; direct writes revoked |

**Sensitive-data destinations.** Supabase Postgres (case payload), Resend (no health data, name or DOB — only reference, time and portal URL), browser memory (answers are not written to `localStorage`), and operator logs (counts and error codes only). No analytics, pixel, session replay or model provider is present.

---

## 4. Prioritized findings

Seventeen findings: **5 High, 5 Medium, 7 Low**. Full records follow. IDs are stable for this package and crosswalk to the earlier registers; the earlier packages are not rewritten.

### Production blockers

#### A7-01 — No production deployment, live provider, retention execution or real reviewer evidence
- **Severity:** High · **Classification:** operational evidence missing · **Verification:** not verified (absence of environment)
- **Evidence:** [README.md:28](../../README.md#L28) (“Migration and functions are written but have not been run against a project from this workspace”); [docs/OPERATIONS.md](../../docs/OPERATIONS.md); [staging record](../2026-10-28-migration-0005-staging/README.md) (staging only); [deployment rehearsal](../2026-10-28-deployment-rehearsal.md) (blocked before deployment).
- **Expected / observed:** a launch candidate should have a deployed frontend, a production database with the migrations applied, a configured sender domain, a scheduled retry worker, an executed retention job and one real reviewer session. Observed: none of these. A staging Supabase project exists and holds migrations `0001`–`0005`; no production origin, provider key or scheduler is configured.
- **Consequence:** hosted RLS at production, real delivery, inbox receipt, bounce handling, retention and backup expiry are all unproven. The local green suite cannot substitute for them.
- **Remediation & regression test:** deploy to a dedicated non-production project with labelled data; run the thirteen-step manual script in `docs/LAUNCH-GATES.md`; capture provider webhook logs and the reviewer queue response; only then promote.
- **Launch impact:** blocks launch. This is the single largest evidence gap.

#### A7-02 — The questionnaire is not signed off; 28 gaps and 0/92 approvals
- **Severity:** High · **Classification:** business/clinical approval missing · **Verification:** verified from code and source (`check:bank`, matrix)
- **Evidence:** [`evidence/check-bank.log`](evidence/check-bank.log); [`QUESTIONNAIRE-MATRIX.md`](QUESTIONNAIRE-MATRIX.md); [questionBank.ts](../../src/features/interview/questionBank.ts); [sourceInventory.ts](../../src/features/interview/sourceInventory.ts).
- **Expected / observed:** every bank row should carry a named reviewer's `sourceVerified: true`. Observed: 92 rows, 87 approved for interview, 5 held, **0 signed off**; 113 source questions, 85 traced, 28 recorded gaps (19 partly collected, 9 out of scope).
- **Consequence:** the gaps are written engineering decisions, not reviewer approvals. The endpoint is also behind an explicit `QUESTIONNAIRE_APPROVED` launch lock ([case.ts:124-127](../../supabase/functions/_shared/case.ts#L124-L127)) that returns HTTP 503 unless the operator sets it to `true`; that flag is an environment switch, **not** a check of reviewer sign-off, so it neither proves nor enforces the 92 approvals.
- **Remediation & regression test:** a named underwriting/clinical reviewer closes each row and each out-of-scope reason; set `sourceVerified`; `npm run check:bank` must report 92/92 and zero unacknowledged gaps.
- **Launch impact:** blocks launch. Owner action, not engineering.

#### A7-03 — Legal entity, counsel wording, licensed states, retention and vendor review are absent
- **Severity:** High · **Classification:** legal/counsel decision · **Verification:** documentation-only / absent
- **Evidence:** [site.ts](../../src/config/site.ts) (legal entity from `VITE_LEGAL_ENTITY`); [docs/LAUNCH-GATES.md](../../docs/LAUNCH-GATES.md) operational checklist; [PrivacyPage.tsx](../../src/pages/PrivacyPage.tsx) (deliberately does not assert at-rest encryption).
- **Expected / observed:** a confirmed legal entity, counsel-approved intake/TCPA wording, a licensed-state list, an approved retention period and a vendor review. Observed: wording is marked “DRAFT — PENDING COUNSEL REVIEW”, the entity is unset, `retention_months` is null, and no vendor review exists.
- **Consequence:** the service cannot lawfully solicit real health information in any state on this evidence. The privacy page is honest about the gap, which is good, but honesty is not approval.
- **Remediation & regression test:** counsel sign-off recorded as a dated document; entity and licensed states configured; retention approved and scheduled; vendor DPAs reviewed. Acceptance: the launch-gate checklist has a named approver and date for each line.
- **Launch impact:** blocks launch.

#### A7-04 — The portal requires AAL2 but has no TOTP enrolment or challenge
- **Severity:** High · **Classification:** confirmed defect · **Verification:** statically demonstrated; hosted staging used raw GoTrue calls, not the app
- **Evidence:** [useReviewerAuth.ts:41-42](../../src/features/portal/useReviewerAuth.ts#L41-L42) reads `getAuthenticatorAssuranceLevel`; [PortalPage.tsx:140-160](../../src/pages/PortalPage.tsx#L140-L160) renders a dead-end instruction; no `mfa.enroll`, `mfa.challenge`, `mfa.verify` or `verifyOtp` exists anywhere in `src/`.
- **Reproduction:** sign in with a password on a hosted project with an allowlisted reviewer. The portal detects `aal1` and shows “Step up your session — enrol an authenticator in your account security settings, then sign in again and complete the challenge.” The product provides no settings screen and no challenge input, so the reviewer cannot proceed in-app.
- **Expected / observed:** an in-app enrol → challenge → verify flow, or a documented, supported out-of-band enrolment. Observed: neither; the staging proof enrolled a factor by direct HTTP calls.
- **Consequence:** a real reviewer cannot review cases through the product. Cases can only be reached by an operator using external tooling — which also bypasses the product's own access-log UX.
- **Remediation & regression test:** add enrol (QR/secret + recovery codes), challenge and verify to the portal, gated before `listCases()`; add a two-session test that an `aal1` session sees zero cases and an `aal2` session sees the queue; repeat the staging queue check through the UI.
- **Launch impact:** blocks launch.

#### A7-05 — The specification's AI assistant and AI-generated summary are not implemented
- **Severity:** High (product decision) · **Classification:** documented limitation / specification conflict · **Verification:** verified from code and the preserved specification text
- **Evidence:** [site.ts:69](../../src/config/site.ts#L69) (`aiExplainerEnabled: false`); [README.md:26](../../README.md#L26) (“Language-model explainer — **Not wired**”); preserved specification text at [owner-specification.txt:45](../2026-10-27-qwencloud/evidence/owner-specification.txt#L45) (“Identify the assistant as AI”), `:93` (“an AI-generated draft summary”) and `:476` (“clearly labeled AI-generated”).
- **Expected / observed:** the specification asks for an AI assistant, an AI identity disclosure and an AI-generated draft summary. The build is deterministic: `buildDraftSummary` restates recorded answers and the permission screen says “A plain-language assistant is not active in this version.”
- **Consequence:** the product cannot be described as conformant to the written specification. There is no model to attack, so no hallucination or prompt-injection finding applies — but the requirement conflict is real and must be resolved by the owner, not silently.
- **Remediation & regression test:** either amend the specification to describe the deterministic tool, or approve a model layer with a privacy review, provider data-retention settings, source grounding and cross-case isolation. Acceptance: one signed decision, and copy that matches the shipped behaviour.
- **Launch impact:** blocks **specification conformance**, not data safety. The deterministic behaviour is the safer of the two.

### Confirmed defects and conditional blockers

#### A7-06 — A delivered notification can regress, and a late failure can trigger a duplicate send
- **Severity:** Medium · **Classification:** confirmed defect · **Verification:** runtime reproduced in PGlite
- **Evidence:** [0003_reliability_and_access.sql:233-268](../../supabase/migrations/0003_reliability_and_access.sql#L233-L268) (`complete_case_notification` updates state unconditionally); [0003:293-354](../../supabase/migrations/0003_reliability_and_access.sql#L293-L354) and [0004:38-127](../../supabase/migrations/0004_reviewer_write_paths.sql#L38-L127) (the *event* path is monotonic); [submit-case/index.ts:355-360](../../supabase/functions/submit-case/index.ts#L355-L360); [retry-case-notifications/index.ts:135-140](../../supabase/functions/retry-case-notifications/index.ts#L135-L140); [claim_case_notification:193-215](../../supabase/migrations/0003_reliability_and_access.sql#L193-L215); [check-db.mjs:272-276](../../scripts/check-db.mjs#L272-L276) (only the event path is regression-tested).
- **Reproduction:** [`evidence/db-terminal-regression.log`](evidence/db-terminal-regression.log). Claim a case, apply a real `email.delivered` event, then let the in-flight submit/retry call complete with `accepted` → the case row moves **delivered → accepted**. Repeat with a provider timeout (`failed`) → **delivered → failed**, `notification_next_attempt_at` is set, and `claim_case_notification` returns the row again (attempt 2). A repeat delivered event is rejected as `duplicate`, so the record cannot self-heal.
- **Expected / observed:** `docs/LAUNCH-GATES.md:18` states “a delivered case cannot regress”. Observed: it can, through the completion path, and the failure path re-queues a duplicate notification to the reviewer.
- **Consequence:** the reviewer may receive the same notification twice after a provider timeout; the case status and UI can contradict the provider's delivered evidence permanently; the audit trail in `email_events` says delivered while `cases` says failed.
- **Remediation & regression test:** make `complete_case_notification` monotonic exactly as `apply_email_event` is — compare ranks, return `applied`/`ignored`, and never clear a delivered state; add `check:db` cases for late `accepted` and late `failed` after delivery, and assert the retry worker cannot claim the case. Acceptance: both probe scenarios report `ignored` and zero re-claims.
- **Launch impact:** blocks reliable delivery evidence and duplicate-send prevention (launch gate 8). Not a health-data leak; the email carries no health information.

#### A7-07 — The server accepts contradictory identity values and structured/prose mismatches
- **Severity:** Medium · **Classification:** confirmed defect · **Verification:** runtime reproduced against the real `validateDraft`
- **Evidence:** [case.ts:537-560](../../supabase/functions/_shared/case.ts#L537-L560) validates the lead in isolation; [case.ts:716-800](../../supabase/functions/_shared/case.ts#L716-L800) validates each answer in isolation; [`evidence/server-authority-probes.log`](evidence/server-authority-probes.log).
- **Reproduction:** a draft whose lead DOB is `1980-01-01` but whose `ID-01` answer text is `2010-01-01` is **accepted**. A lead state of `TX` with an `ID-03` answer of `CA` is **accepted**. `RES-01` with `answerValues: ["citizen"]` and prose “Lawful permanent resident” is **accepted**.
- **Expected / observed:** the server should reject a submission whose identity fields contradict each other, because the reviewer summary and the case header can then disagree.
- **Consequence:** a forged or buggy client can create a case whose age, state or citizenship is internally contradictory. The reviewer may act on the header while the answers say something else.
- **Remediation & regression test:** cross-check DOB ↔ `ID-01`, state ↔ `ID-03`/`RES-01`, and require `answerValues` ↔ `answerText` agreement on choice rows; add Deno tests for each contradiction. Acceptance: all three probes return 422.
- **Launch impact:** blocks data-integrity sign-off; not a confidentiality defect.

#### A7-08 — Magic-link sign-in can create accounts for any address
- **Severity:** Medium (configuration-dependent) · **Classification:** confirmed defect / abuse control · **Verification:** statically demonstrated
- **Evidence:** [api.ts:576-579](../../src/lib/api.ts#L576-L579) calls `signInWithOtp` without `shouldCreateUser: false`; [PortalPage.tsx:92-96](../../src/pages/PortalPage.tsx#L92-L96) says “If that address is on the allowlist, a sign-in link is on its way”; [supabase/config.toml](../../supabase/config.toml) contains no `[auth]` block, so the committed configuration does not disable sign-ups.
- **Expected / observed:** the UI claims allowlist-only access. If hosted sign-ups are enabled, any address creates an Auth user and receives mail; the reviewer row and AAL2 still prevent case access.
- **Consequence:** account enumeration and mail abuse, plus a misleading security claim. No case data is exposed.
- **Remediation & regression test:** set `shouldCreateUser: false`, disable hosted sign-ups, and add a configuration note. Acceptance: an unknown address receives the same neutral UI response and creates no `auth.users` row.
- **Launch impact:** configuration blocker before the portal is public.

#### A7-09 — No customer-facing marketing revocation path
- **Severity:** Medium — conditional · **Classification:** future-feature pre-enable gate · **Verification:** statically demonstrated
- **Evidence:** [0003:534-580](../../supabase/migrations/0003_reliability_and_access.sql#L534-L580) (`record_marketing_revocation` RPC and suppression table); no route, form or link in `src/`.
- **Expected / observed:** if a marketing channel is ever enabled, a customer must be able to revoke after submission and have it propagate. Observed: only a reviewer/operator RPC exists, and channels are currently disabled.
- **Consequence:** no live unlawful outreach today. Enabling a channel without this path would create one.
- **Remediation & regression test:** before enabling any channel, add a customer-facing revocation route that writes the suppression and a job that propagates it to the sender; test that a suppressed number cannot be queued.
- **Launch impact:** non-blocking while channels are off; a hard pre-enable gate.

#### A7-17 — The staging database password was pasted into chat and no rotation is recorded
- **Severity:** Medium · **Classification:** operational evidence missing · **Verification:** documented, not verifiable from the repository
- **Evidence:** [staging record §4](../2026-10-28-migration-0005-staging/README.md) (“The database password supplied in chat … **must be rotated**”); [A5 report:401](../2026-10-28-qwencloud-reaudit/REPORT.md); no later record of rotation anywhere in the repository.
- **Expected / observed:** a credential exposed in a transcript should be rotated and the rotation dated. Observed: the requirement is written; no evidence it happened.
- **Consequence:** if unrotated, the staging project and its auth users remain reachable with an exposed credential. It is not in the repository, logs or CI, and production reuse is unconfirmed.
- **Remediation & regression test:** rotate the database password, confirm no environment or CI secret still uses it, and record the date and operator in the operations log. Acceptance: a dated rotation entry plus a successful connection using only the new secret.
- **Launch impact:** blocks promoting that project to production until confirmed.

### Low-severity findings

#### A7-10 — The reviewer queue silently stops at 50 cases
- **Severity:** Low · **Classification:** confirmed defect · **Verification:** statically demonstrated
- **Evidence:** [api.ts:416-431](../../src/lib/api.ts#L416-L431) selects from `case_summaries` with `.limit(50)` and no pagination, filter or “older” path.
- **Consequence:** once more than 50 cases exist, older ones are invisible with no indication; a reviewer may believe the queue is empty.
- **Remediation & regression test:** keyset pagination or a date filter, with an explicit “showing 50 of N” count. Acceptance: a seeded 51-case test shows the older case.
- **Launch impact:** non-blocking at current volume; operational risk.

#### A7-11 — A “Yes” answer with no supplemental detail is accepted where the bank defines detail prompts
- **Severity:** Low · **Classification:** confirmed defect · **Verification:** runtime reproduced
- **Evidence:** [case.ts:388-418](../../supabase/functions/_shared/case.ts#L388-L418) treats absent details as valid; probe `A6-P4` accepted `MED-01: yes` with `details: null`.
- **Consequence:** an incomplete answer is indistinguishable from a complete one in the payload; the reviewer must notice and follow up.
- **Remediation & regression test:** require the bank's declared detail fields when `answerState = yes` and the row defines them, or record an explicit “no detail given” state. Acceptance: the probe returns 422 or a visible marker.
- **Launch impact:** non-blocking; affects review quality.

#### A7-12 — The submission acknowledgement can precede the consents it acknowledges
- **Severity:** Low · **Classification:** confirmed defect · **Verification:** runtime reproduced
- **Evidence:** [case.ts:675-714](../../supabase/functions/_shared/case.ts#L675-L714) checks the acknowledgement is inside the session window but not after the consents; probe `A6-P8` accepted an acknowledgement timestamp almost 20 minutes *before* both consent timestamps.
- **Consequence:** evidence can show the customer asking to submit before granting permission — an impossible chronology that weakens the consent record.
- **Remediation & regression test:** require `acknowledgement >= max(consent.grantedAt)` and `<= completedAt`; add a negative test.
- **Launch impact:** non-blocking; evidence integrity.

#### A7-13 — No automated cross-answer inconsistency flags
- **Severity:** Low · **Classification:** review-package gap · **Verification:** statically demonstrated
- **Evidence:** [case.ts:435-500](../../supabase/functions/_shared/case.ts#L435-L500) derives only unresolved, declined, held, uncertain and crisis flags; the review screen shows unresolved counts only.
- **Consequence:** contradictions such as DOB/answer mismatch, incompatible timeframes or occupation/income conflicts rely entirely on manual detection.
- **Remediation & regression test:** add flags for the contradictions the reviewer must otherwise hunt for (starting with `A7-07`), with a test per flag.
- **Launch impact:** non-blocking; a review-quality improvement.

#### A7-14 — README says the backend has never been run against a project
- **Severity:** Low · **Classification:** documentation contradiction · **Verification:** verified against the staging record
- **Evidence:** [README.md:28](../../README.md#L28) versus [staging record](../2026-10-28-migration-0005-staging/README.md) (hosted migrations `0001`–`0005`, live AAL2 queue `200`).
- **Consequence:** an operator may believe no hosted backend exists, understating both progress and exposure.
- **Remediation:** replace the line with a precise status: staging project, migrations applied, temporary reviewer used, production not deployed.
- **Launch impact:** documentation only.

#### A7-15 — “A delivered case cannot regress” is false
- **Severity:** Low · **Classification:** documentation contradiction · **Verification:** contradicted by `A7-06`
- **Evidence:** [docs/LAUNCH-GATES.md:18](../../docs/LAUNCH-GATES.md#L18).
- **Consequence:** a reviewer or operator may trust a status guarantee the code does not provide.
- **Remediation:** fix `A7-06` first, then keep the claim with a regression test; until then, qualify it.
- **Launch impact:** documentation only.

#### A7-16 — Gate 7 calls staff MFA “unverified” when the in-app step-up does not exist
- **Severity:** Low · **Classification:** documentation contradiction · **Verification:** verified against the portal code
- **Evidence:** [docs/LAUNCH-GATES.md:17](../../docs/LAUNCH-GATES.md#L17) (“live MFA enrolment/step-up for a real staff reviewer remains unverified”) versus `A7-04`.
- **Consequence:** the word “unverified” implies the feature exists and merely lacks evidence. It does not exist.
- **Remediation:** state “not implemented in the portal” until `A7-04` is closed.
- **Launch impact:** documentation only.

---

## 5. Requirements and launch-gate matrix

The full table is [`LAUNCH-GATE-MATRIX.md`](LAUNCH-GATE-MATRIX.md). Summary:

| Gate | Status | Deciding evidence |
| --- | --- | --- |
| 1 Question coverage | PARTIAL | 85/113 traced, 28 gaps, 0/92 signed off |
| 2 Branch coverage | PARTIAL | 14 branches tested; 7 windows replaced |
| 3 Answer integrity | PASS — local | 8/8 engine tests; canonical rebuild |
| 4 Review and submission | PARTIAL | Server checks pass; browser review path not exercised |
| 5 Consent separation | PASS — local | 7/7 consent tests; handler rejects missing/declined records with 422; no marketing box |
| 6 Recipient control | PASS — static | Server constants; live send not run |
| 7 Secure access | PARTIAL | RLS/AAL2 enforced; in-app step-up missing (`A7-04`) |
| 8 Delivery reliability | **FAIL** | Terminal-state regression reproduced (`A7-06`) |
| 9 Leak prevention | PARTIAL | Bundle/log/email checks pass; provider logs and backups unreviewed |
| 10 Human review | PARTIAL | RPC-only writes; not operable because of `A7-04` |

**Workflow traceability.**

| Stage | Implementation | Observed evidence | Status |
| --- | --- | --- | --- |
| Introduction / landing | `LandingPage`, `SiteChrome` | Browser | PASS |
| Lead form | `LeadForm` + `validation.ts` | Browser empty-submit; 5/5 validation tests | PASS |
| Privacy acknowledgement | `LeadForm`, consent policy | Browser; server 422 assertions | PASS |
| Intake permission | `PermissionStep` | Browser; version shown; disabled until granted | PASS |
| Source-based questions | `questionBank`, `engine`, `InterviewScreen` | Browser `1 / 73`; bank checks | PASS structurally |
| Conditional follow-ups | `askWhen`, `engine` | 8/8 tests | PASS |
| Review and correction | `ReviewScreen` | Static; server stale-ack tests | PARTIAL |
| Affirmative submission | `ReviewScreen`, `submit-case` | Deno handler tests | PASS — local |
| Secure storage | `cases`, RLS, RPC-only writes | PGlite + staging | PASS — local and staging |
| Email notification | `email.ts`, Resend client | Static + unit tests; no live send | PARTIAL |
| Human review | Portal, AAL2, `CaseReview` | PGlite + staging GoTrue calls; in-app step-up absent | PARTIAL |

---

## 6. Questionnaire matrix

Full register: [`QUESTIONNAIRE-MATRIX.md`](QUESTIONNAIRE-MATRIX.md) and [`QUESTIONNAIRE-MATRIX.csv`](QUESTIONNAIRE-MATRIX.csv) (113 source questions + 28 gap rows = 121 rows, no truncation). Totals derive from `check:bank` and `reconciliation.ts`:

- **Source questions:** 113 from the 7-page PDF (SHA-256 `afe91d87…82cca2`); 113/113 texts appear in both the PDF and the committed extraction; no duplicates; ids sequential.
- **Bank rows:** 92 — 87 approved for interview, 5 held (`ID-04`, `MED-11`, `MH-06`, `RES-04`, `RES-05`), **0 signed off**.
- **Coverage:** 85 source questions traced; 28 gaps — 19 partly collected (`merge_into`), 9 recorded out of scope, 0 waiting on a new question.
- **Wording/window verdicts, by bank row:** 55 match the source, 3 confirmed compound splits, 11 wording changed, 7 timeframe changed, 9 added by LPP, 2 not in the source, 5 held. (The CSV counts per source mapping, so a bank row serving two source questions appears twice; the authoritative per-row totals are the ones above.)
- **Flags:** 29 rows carry at least one — wording 16, timeframe 10, branching 12, attribution 10, omission 9.

**Every out-of-scope decision is an engineering decision, not an approval.** Examples: a blanket five-year check-up question would be answered Yes by almost every applicant; mild/situational depression is captured by MH-01; prescription names are captured by MED-09; bolted-route proportion, track configuration, last-race date, diving equipment and club membership carry no independent underwriting weight. Each is defensible; none has a named reviewer's signature and date, which is what `A7-02` requires.

**Held rows** are not asked, cannot carry content, remain visible in the internal coverage record, and are absent from the public bundle. No identity-document numbers, SSNs, payment data, passport numbers or unrelated family identifiers are collected.

---

## 7. Test ledger

Full ledger: [`TEST-LEDGER.md`](TEST-LEDGER.md). Fresh results in this pass:

| Check | Result |
| --- | --- |
| `npm run typecheck` | EXIT 0 |
| `npm run build` | EXIT 0 — 615.65 kB JS / 170.87 kB gzip |
| `npm run check:bank` | PASS — 92 rows, 87 approved, 5 held, 0 signed off; 113/85/28 |
| `npm run check:docs` | PASS |
| `npm run check:bundle` | PASS — 1 asset; withheld wording, notes and held records absent |
| `npm run check:server-bank` / `check:server-policy` | PASS |
| `npm run check:db` | PASS — 57 assertions, 0 failures (but see `A7-06` gap) |
| `npm run test:consent` / `test:engine` / `test:validation` | PASS — 7/7, 8/8, 5/5 |
| Deno edge suite | PASS — 36/36 via `npx deno@2.9.6` |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `report:reconciliation` in a disposable copy | PASS — no diff |
| Source fidelity (PDF ↔ txt ↔ inventory) | PASS — 113/113, 0 invented |
| Secret scan, tree + all commits | PASS — no secret-like literal; only `.env.example` ever tracked |
| Server-authority probes | **4 accepted contradictions** → `A7-07`, `A7-11`, `A7-12` |
| Notification race probe | **Regression reproduced** → `A7-06` |
| Browser walk (steps 1–4) | PASS — validation, no marketing box, `1 / 73` progress |
| Full 73-question walk, submit, email, portal | **NOT RUN** |

**Inherited, not fresh:** hosted migration/view/RLS and live AAL2 queue (staging package); deployment rehearsal (blocked). They are never presented as production evidence.

**Dependency note:** the dependency tree was already installed and lockfile-consistent (22 top-level packages); `npm ci` was **not** re-run in this pass, and no lifecycle script was executed. `package-lock.json` and `package.json` are unmodified.

---

## 8. Documentation contradictions

| # | Document claim | Contradiction | Finding |
| --- | --- | --- | --- |
| 1 | `README.md:28` — migrations “have not been run against a project from this workspace” | Staging record documents hosted `0001`–`0005` and a live AAL2 queue response | `A7-14` |
| 2 | `docs/LAUNCH-GATES.md:18` — “a delivered case cannot regress” | `complete_case_notification` regresses delivered → accepted/failed | `A7-15` / `A7-06` |
| 3 | `docs/LAUNCH-GATES.md:17` — staff MFA step-up “remains unverified” | No enrolment or challenge exists in the portal | `A7-16` / `A7-04` |
| 4 | `PortalPage.tsx:92` — “If that address is on the allowlist…” | `signInWithOtp` may create the account for any address | `A7-08` |
| 5 | `README.md:27` — “no provider key is configured here, so the UI reports `not_sent` honestly” | Correct, but no live send has ever been attempted; “implemented against Resend” is untested against the provider | `A7-01` |

**No generated-report drift:** `npm run report:reconciliation` in a disposable cwd produced a byte-identical document. **No stale counts:** `npm run check:docs` passes against the audited data. The stale claims above are semantic, not numeric.

---

## 9. Remediation sequence

### A. Code — smallest safe fixes first

1. **`A7-06`** — make `complete_case_notification` monotonic; add `check:db` late-completion cases; assert zero re-claim. *(Regression test: the two probe scenarios.)*
2. **`A7-07`** — cross-field identity and value/prose checks in `validateDraft`; three Deno negative tests. *(Acceptance: 422 for each probe.)*
3. **`A7-11`** — require declared details on `yes`, or record an explicit no-detail state; one test.
4. **`A7-12`** — reject an acknowledgement earlier than the consents; one test.
5. **`A7-08`** — `shouldCreateUser: false` and a configuration note. *(Acceptance: no Auth user for an unknown address.)*
6. **`A7-04`** — TOTP enrol/challenge/verify in the portal; two-session test. *(This is the largest code item.)*
7. **`A7-10`** — paginate the queue.
8. **`A7-13`** — inconsistency flags, starting with the `A7-07` cases.

### B. Configuration and deployment

9. **`A7-01`** — deploy to a non-production project; configure sender domain, cron worker, retention schedule; run the manual script; capture evidence.
10. **`A7-17`** — rotate the staging database password; record the date; confirm no production reuse.
11. **`A7-14`–`A7-16`** — correct the three documentation claims in the same change as the code.

### C. Business approvals

12. **`A7-02`** — named reviewer closes 92 rows and 9 out-of-scope reasons; `check:bank` reports 92/92.
13. **`A7-05`** — owner decides: amend the specification, or approve a model layer with privacy review.

### D. Legal and clinical

14. **`A7-03`** — entity, counsel-approved wording, licensed states, retention period, vendor DPAs.
15. **`A7-09`** — only if a marketing channel is enabled: revocation path and vendor propagation before the flag is turned on.

---

## 10. Owner and counsel questions

Only questions that materially change launch or remediation:

1. **AI:** does the owner accept the deterministic tool as the product, or is an AI assistant/summary a launch requirement? (Changes scope and privacy review.)
2. **Entity and states:** what is the legal entity, and in which states is the business licensed to solicit? (Changes wording and eligibility.)
3. **Retention:** what retention period will counsel approve, and does it differ for declined/abandoned cases? (Changes `retention_months` and backup design.)
4. **Reviewer operations:** who are the real reviewers, and how should they enrol a second factor — in-app or through an identity provider? (Changes `A7-04` design.)
5. **Marketing:** will any call/text channel ever be enabled, and through which vendor? (Determines whether `A7-09` is in scope.)
6. **Staging credential:** has the chat-exposed database password been rotated, and is that project ever promoted to production? (`A7-17`.)
7. **Delivery evidence:** is the reviewer mailbox expected to be the sole notification recipient for launch, or will a distribution list be added? (Changes recipient control and vendor review.)

---

## 11. Explicitly unverified

- **Production RLS, grants and migration state.** Only staging was checked.
- **A real staff reviewer's enrolment and step-up.** No real account; in-app flow does not exist.
- **Live provider acceptance, delivery, bounce, complaint and inbox receipt.** No Resend key, no send.
- **Webhook delivery from the real provider.** Signature verification is unit-tested; no live Svix request.
- **Scheduler execution and overlapping workers.** Cron SQL exists; nothing ran.
- **Retention, expiry and deletion execution.** Functions and PGlite tests exist; no schedule ran.
- **Backup retention and restore.** No provider console evidence.
- **Hosting headers, CSP, cache rules and TLS configuration.** No deployed origin.
- **Forwarded-email access test, cross-account test with a second real account, prompt-injection test against a deployed function.**
- **Browser screenshots and the full 73-question walk.** The window was not drawn for capture; the DOM/accessibility tree was used instead.
- **Mobile layout, screen-reader pass and contrast audit.** Not run.
- **Legal applicability (HIPAA, Texas Insurance Code Chapter 602, TCPA, state law).** No counsel input; the prompt's legal references were not independently re-researched for this pass.

---

## 12. Conditions before accepting real customer submissions

1. `A7-06` fixed and regression-tested: no delivered case can regress and no late failure can re-queue a send.
2. `A7-07`, `A7-11`, `A7-12` fixed: no contradictory identity, value/prose or chronology evidence is accepted.
3. `A7-04` delivered: a real reviewer can enrol and complete AAL2 entirely in the product; an `aal1` session sees zero cases.
4. `A7-02` closed: 92/92 rows signed off by a named reviewer, every out-of-scope reason accepted and dated.
5. `A7-03` closed: entity confirmed, counsel-approved wording, licensed states, retention approved and scheduled, vendor review complete.
6. `A7-01` closed: production deployment with hosted RLS, real reviewer, live provider delivery, webhook reconciliation, scheduler and retention execution all evidenced.
7. `A7-08` closed: no account creation for non-allowlisted addresses.
8. `A7-17` closed: exposed credential rotated and recorded.
9. `A7-05` decided: specification amended or model layer approved.
10. `A7-09` closed **before** any marketing channel is enabled.
11. Documentation corrected (`A7-14`–`A7-16`) so the recorded status matches the code.
12. Fictitious end-to-end data deleted (`LPP-2026-SAMPLE` and any test case) before the first real submission.

Until conditions 1–8 are met, the service should remain a labelled preview with fictitious data. The `QUESTIONNAIRE_APPROVED` launch lock is unset, so live intake is closed by default; it must not be set to `true` to “test” production, because it does not verify the sign-off in `A7-02`.
