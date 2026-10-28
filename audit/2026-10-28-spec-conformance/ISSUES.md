# Specification conformance — issue register

**Package:** [`README.md`](README.md)  
**Baseline:** `main` @ `79e8af4f58ad74914241ef4660f765da105949c9`  
**Specification SHA-256:** `e4bc308484c657e6d13cdff18cedd756f00d72003b7278ae9e1ef9490bfdc498`  
**Review date:** 28 October 2026

This register preserves every issue identified by the specification conformance review, plus four additional findings from the live-review and server-authority checks performed in the same pass. It is not a replacement for A5's security audit. Severity reflects the effect on **literal conformance and launch readiness**, not necessarily a vulnerability.

## Summary

| ID | Severity | Type | Status | Owner |
| --- | --- | --- | --- | --- |
| `SC-01` | High | Requirement conflict / missing feature | Open | Product owner; counsel/model reviewer if AI is approved |
| `SC-02` | Medium (conditional) | Missing customer path | Open | Product owner; counsel; future outbound owner |
| `SC-03` | High | Launch blocker | Open | Engineering and operations |
| `SC-04` | High | Content approval blocker | Open | Named clinical/underwriting reviewer |
| `SC-05` | High | Legal/operational blocker | Open | Business owner and counsel |
| `SC-06` | Low | Documentation inconsistency | Open | Engineering documentation |
| `SC-07` | Info | Verification gap | Resolved in this pass — 36/36 | Engineering/CI |
| `SC-08` | Low | Review-package gap | Open | Product/engineering; named reviewer |
| `SC-09` | High | Live reviewer access / implementation gap | Open | Engineering; operations for enrolment |
| `SC-10` | Medium | Server authority / data integrity | Open | Engineering |
| `SC-11` | Medium (conditional) | Auth abuse / configuration | Open | Engineering/operations |
| `SC-12` | Low | Queue completeness | Open | Engineering |

**Counts:** High 5 · Medium 3 · Low 3 · Info 1. Apart from `SC-07`, which was a verification gap resolved by re-running the suite in this pass, none of these issues is marked resolved. No application code, questionnaire row, consent text or deployment was changed.

---

## SC-01 — The AI assistant and AI-generated summary are not implemented

**Severity:** High — literal specification conformance; product decision  
**Status:** Open  
**Specification requirement:** The specification opens with “The AI Customer Health Agent conducts a guided pre-underwriting interview,” requires the introduction to “Identify the assistant as AI,” permits a conversation layer to explain unfamiliar words and request clarification, and requires “a clearly labeled AI-generated draft summary.”  
**Observed:** The build is deliberately deterministic.

- `FEATURES.aiExplainerEnabled` is `false` in [`src/config/site.ts:69`](../../src/config/site.ts#L69).
- The permission screen says: “A plain-language assistant is not active in this version” in [`src/features/intake/PermissionStep.tsx:25`](../../src/features/intake/PermissionStep.tsx#L25).
- The consent intro is conditional and uses the non-AI wording in [`src/features/consent/consentTexts.ts:28`](../../src/features/consent/consentTexts.ts#L28).
- `buildDraftSummary` is an extractive, deterministic function that restates recorded answers in [`src/features/interview/engine.ts:387`](../../src/features/interview/engine.ts#L387). It makes no model call.
- The portal labels it “Draft summary” and “Generated automatically from the recorded answers,” not “AI-generated,” in [`src/features/portal/CaseReview.tsx:326`](../../src/features/portal/CaseReview.tsx#L326).
- The README records the gap explicitly in [`README.md:26`](../../README.md#L26).
- The prior audit already classified this as a **specification conflict**, not a hallucination finding: [`../2026-10-27-qwencloud/qwencloud-audit.md`](../2026-10-27-qwencloud/qwencloud-audit.md).

**Impact:** The deterministic build cannot truthfully claim to be an AI assistant or to produce an AI-generated summary. The customer copy is accurate for what is running, and the deterministic summary avoids model hallucination. The issue is literal conformance, not a hidden model failure.

**Next action:** Choose one path and record the decision.

1. **Amend the specification** to describe the deterministic guided interview and deterministic summary. This is the lowest-risk path and matches the current build.
2. **Add an approved AI layer.** This requires a selected model provider, a server-side key, a privacy/vendor review, prompt-injection and recipient controls, a strict scope that cannot alter questions or answers, and source-linked citations. It must not send health data to an unapproved provider or claim emergency monitoring.

**Acceptance test:** Either a signed specification amendment, or an end-to-end non-customer test showing the explainer cannot change a question, window or answer; every summary fact links to a question ID; no health payload appears in provider logs; and the AI copy is truthful.

---

## SC-02 — No customer-facing marketing revocation path

**Severity:** Medium — conditional; becomes a launch blocker if a marketing channel is enabled  
**Status:** Open  
**Specification requirement:** The product must enforce selected contact permissions and applicable suppression rules, local-time/state restrictions, and reasonable revocation requests outside the language model. Selected permissions and later withdrawals must propagate correctly.

**Observed:**

- Marketing calls and texts are disabled by default in [`src/config/site.ts:33`](../../src/config/site.ts#L33); `MARKETING_ENABLED` requires a configured legal entity and at least one channel.
- The database has a reviewer-only revocation RPC and suppression check in [`supabase/migrations/0003_reliability_and_access.sql:481`](../../supabase/migrations/0003_reliability_and_access.sql#L481). `npm run check:db` proves the RPC and suppression behaviour.
- There is **no customer-facing revocation endpoint**, no STOP/withdrawal intake, and no outbound sender that calls `is_contact_suppressed`.
- The operations document says this explicitly: “no live intake yet because no channel is operated; this is a pre-enable gate, not a completed control” in [`docs/OPERATIONS.md:60`](../../docs/OPERATIONS.md#L60).

**Impact:** No live marketing risk while every channel is off. The control is incomplete for the specification’s “later withdrawals propagate correctly” test, and enabling a channel without this path would create a compliance and customer-rights gap.

**Next action:** Keep marketing off and record that decision, **or** build a verified customer revocation path (reference plus email/phone verification), write to `contact_suppressions` and `marketing_revocations`, make every future sender call `is_contact_suppressed`, and add local-time/state checks. Do not enable a channel until the path and tests exist.

**Acceptance test:** An unchecked marketing box creates no enrollment; a revocation through the customer path blocks a simulated send immediately; a STOP/withdrawal is auditable; a send outside permitted local time/state is refused; and the consent evidence shows the withdrawal.

---

## SC-03 — Production deployment and live verification are incomplete

**Severity:** High — launch blocker  
**Status:** Open  
**Specification requirement:** Production acceptance tests 7–9 (secure access, delivery reliability, leak prevention) and the production requirements for encrypted transport/storage, restricted access, MFA, retention, audit, incident procedures and vendor review.

**Observed:**

- The staging record verifies migration 0005, the payload-free view, AAL1/AAL2 RLS and a live AAL2 HTTP queue response: [`../2026-10-28-migration-0005-staging/README.md`](../2026-10-28-migration-0005-staging/README.md).
- No production migration or function deployment is recorded.
- No real staff reviewer has completed MFA enrolment and AAL2 step-up.
- No live Resend key, sender-domain verification, provider acceptance, inbox receipt, bounce/complaint test or webhook interoperability test is recorded.
- No retention schedule is approved or executed; `app_settings.retention_months` remains null.
- The earlier deployment rehearsal was blocked before deployment: [`../2026-10-28-deployment-rehearsal.md`](../2026-10-28-deployment-rehearsal.md).
- The launch gates still mark delivery and secure access as “Partly” and list the provider/inbox tests as not run: [`../../docs/LAUNCH-GATES.md:17`](../../docs/LAUNCH-GATES.md#L17).

**Impact:** The local/Staging evidence is not production evidence. Real customer submissions cannot be accepted until the hosted path, human access and delivery are exercised with labelled non-customer data.

**Next action:** Use a production or production-like project, apply migrations in order, deploy the functions, enrol the real reviewer with MFA, configure the approved sender, run a labelled end-to-end case, verify the forwarded-email and second-account denials, test failure/retry paths, approve and execute retention, and record the logs in a dated package.

**Acceptance test:** A live non-customer case is saved, notified, visible only to the AAL2 reviewer, correctly retried on failure, and deleted afterward; a forwarded link grants nothing; retention runs under the approved schedule; every result has a raw log.

---

## SC-04 — The question bank is not signed off

**Severity:** High — launch blocker  
**Status:** Open  
**Specification requirement:** Reconcile every PDF question against the approved bank, document sensitive-item restrictions and every intentional revision, and preserve an immutable copy of the approved questionnaire version used in each case.

**Observed (`npm run check:bank`):**

- 92 bank rows: 87 approved for interview, 5 held for human review (`ID-04`, `MED-11`, `MH-06`, `RES-04`, `RES-05`).
- 14 branching questions, 11 supplemental rows.
- **0 rows signed off by a named reviewer.**
- 113 source questions: 85 traced to a bank row, **28 gaps recorded** (19 partly collected, 9 out of scope, 0 collected nowhere).
- 92 reconciliation records, 29 with flags: 55 match source, 3 split a compound source, 11 wording changed, 7 timeframe changed, 9 added by LPP, 2 not in source, 5 held.

**Impact:** The code proves structural coverage and preserves the decisions, but it cannot prove that a clinician, underwriter or counsel approved the wording, windows, exclusions or omissions. The server launch lock `QUESTIONNAIRE_APPROVED` remains false by design.

**Next action:** A named reviewer closes each row and each gap in [`../../docs/question-bank-reconciliation.md`](../../docs/question-bank-reconciliation.md), sets `sourceVerified: true` only with evidence, approves or keeps held rows held, records the reviewer/date, bumps `QUESTIONNAIRE_VERSION` if wording changes, and regenerates the report.

**Acceptance test:** All 92 rows and 28 gaps have a named decision; `npm run check:bank` shows the intended sign-off; the approved version is recorded; and the launch lock is set only after that record exists.

---

## SC-05 — Legal and operational approvals are absent

**Severity:** High — legal/operations blocker  
**Status:** Open  
**Specification requirement:** Confirm the actual legal operating entity, licensed states, approved questionnaire, sensitive-question rules, privacy notice, authorization forms, TCPA disclosure, hosting/model vendors, secure store, authenticated portal, retention schedule and email configuration before treating the implementation as production-ready.

**Observed:**

- `SITE.legalEntity` is unset and `SITE.legalReviewPending` is true; marketing stays off while the seller is blank.
- Counsel approval is still pending for the intake acknowledgment, privacy notice and TCPA disclosure.
- Licensed states and the approved questionnaire version are unconfirmed.
- Retention is unapproved (`retention_months = null`) and backup expiry/incident response are not documented.
- Vendor review is open for hosting, database/backups, email, auth and any future model/SMS/CRM provider.
- Access to `richardparslow@lifepolicypilot.blog` and mailbox MFA are unverified.
- The launch-gate checklist records these as unchecked: [`../../docs/LAUNCH-GATES.md:37`](../../docs/LAUNCH-GATES.md#L37).

**Impact:** These are not engineering acceptance tests. Code cannot close them, and the product must not claim HIPAA/Texas compliance or accept real health information until the decisions and documents exist.

**Next action:** The business owner and counsel complete the checklist, record the legal entity and licensed states, approve the wording/retention/vendors, verify the mailbox and MFA, and document the HIPAA/Texas applicability analysis.

**Acceptance test:** Each launch-gate item has a dated, named approval and the corresponding configuration or evidence; no approval is inferred from a green test suite.

---

## SC-06 — README status table contradicts the staging record

**Severity:** Low — documentation  
**Status:** Open  
**Specification requirement:** Accurate status and confirmation wording; the specification itself says no website/store/email has been deployed or verified, so the repository must not overstate or understate its evidence.

**Observed:**

- [`README.md:28`](../../README.md#L28) says: “Migration and functions are written but have not been run against a project from this workspace.”
- The same README later links a hosted staging check at [`README.md:413`](../../README.md#L413), and the staging package records migration 0005 plus a live AAL2 HTTP queue response.
- The status table is therefore stale in one direction while the later verification section is accurate.

**Impact:** A reader can wrongly conclude that no hosted database evidence exists, or miss that only staging (not production) was verified. This is a documentation inconsistency, not a code defect.

**Next action:** Replace the table line with the precise state: migrations 0001–0005 applied to staging; the 0005 view, grants and AAL1/AAL2 boundary verified; a live AAL2 queue response captured; edge functions and production not deployed. Keep the distinction between staging and production explicit.

**Acceptance test:** The README table, the staging package and `docs/LAUNCH-GATES.md` agree; `npm run check:docs` still passes.

---

## SC-07 — Edge-function tests were not run in this pass

**Severity:** Info — verification gap  
**Status:** Resolved in this pass — 36/36  
**Specification requirement:** The server must enforce consent, canonical answers, rate limits, byte caps, recipient control and delivery reliability; the repository’s evidence should be reproducible.

**Observed (first pass):** `deno` was not installed in the environment used for the first pass. `npm run test:consent`, `test:engine` and `test:validation` passed, but the 36 Deno edge-function tests were not executed then. The original no-run record is preserved at [`evidence/deno-tests-not-run.log`](evidence/deno-tests-not-run.log). CI runs the suite with Deno 2 according to [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

**Re-run (28 October 2026):** `npx --yes deno@2.9.6 test --allow-env --lock=deno.lock supabase/functions/tests/` returned `ok | 36 passed | 0 failed`. The dated output is [`evidence/deno-tests.log`](evidence/deno-tests.log); the full suite is [`evidence/full-verification.log`](evidence/full-verification.log).

**Impact:** The local server test results are now independently confirmed on this machine. This does not prove a hosted deployment, live provider delivery, a real reviewer's MFA step-up or a browser walkthrough.

**Next action:** Keep the CI job and lockfile; attach the CI run or a fresh dated log to any later deployment audit.

**Acceptance test:** A dated log shows the Deno version and 36/36 (or the current count) passing, with the lockfile.

---

## SC-08 — No automated inconsistency flags

**Severity:** Low — review-package gap  
**Status:** Open  
**Specification requirement:** The review package should include flags for “inconsistencies, approximate dates, uncertain answers, incomplete branches, and necessary clarification.”

**Observed:** `buildFlags` in [`src/features/interview/engine.ts:320`](../../src/features/interview/engine.ts#L320) emits flags for current crisis, unresolved items, declined items, held rows and uncertain answers. It does **not** compare answers for contradictions or emit a flag solely because a date is approximate. The portal does display every answer, and the bank labels date prompts “Approximate …” (for example, the conviction detail fields), so a human can see the approximation.

**Impact:** The named reviewer must detect any cross-answer inconsistency manually. No known pair of questions currently creates a deterministic contradiction, so this is a completeness gap rather than a live false-negative. It becomes more important if new questions add overlapping dates or ages.

**Next action:** Either record that manual detection is acceptable for the current bank, or add a small deterministic check for the few cross-checkable pairs (for example, a release date before a conviction date, or an age inconsistent with date of birth) and a neutral “approximate date” note. Do not infer a contradiction from unrelated answers.

**Acceptance test:** The reviewer package either documents manual detection as the approved control, or a test proves each added check fires on a known inconsistency and stays silent on a valid case.

---

## SC-09 — The portal enforces AAL2 but has no TOTP enrolment or challenge

**Severity:** High — live reviewer access / launch blocker  
**Status:** Open  
**Classification:** Confirmed implementation gap (statically demonstrated; live browser not run because no hosted project was connected).  
**Specification requirement:** “Secure reviewer access” and production acceptance test 7: a forwarded email or password-only session must not grant access, and the authorised reviewer must be able to complete MFA and review cases.

**Observed:**

- The portal reads the session assurance level and sets `needsMfa` whenever the current level is not `aal2`: [`src/features/portal/useReviewerAuth.ts:41`](../../src/features/portal/useReviewerAuth.ts#L41). While `needsMfa` is true, `signedIn` is false and the queue never loads: [`src/features/portal/useReviewerAuth.ts:84`](../../src/features/portal/useReviewerAuth.ts#L84).
- The “MFA required” screen tells the reviewer to “Enrol an authenticator in your account security settings, then sign in again and complete the challenge,” but offers only **Sign out and try again**: [`src/pages/PortalPage.tsx:146`](../../src/pages/PortalPage.tsx#L146). The case page offers only a link back to the portal: [`src/pages/PortalCasePage.tsx:49`](../../src/pages/PortalCasePage.tsx#L49).
- There is no `mfa.enroll`, `mfa.challenge`, `mfa.verify`, `challengeAndVerify` or `listFactors` call anywhere in `src`. The static probe is [`evidence/auth-surface.log`](evidence/auth-surface.log).
- The only sign-in action is `signInWithOtp`; it creates an `aal1` session and does not step it up: [`src/lib/api.ts:574`](../../src/lib/api.ts#L574).
- The hosted staging proof did complete TOTP challenge/verify, but through direct GoTrue HTTP calls (`/auth/v1/factors/.../challenge` and `/verify`), not through this portal: [`../2026-10-28-migration-0005-staging/README.md:51`](../2026-10-28-migration-0005-staging/README.md#L51).

**Impact:** A real reviewer who signs in with a magic link is routed to an instructional dead end. Because every reviewer RLS policy requires `aal2`, the reviewer cannot see any case, and there is no in-app path to create the required factor or verify a code. The staging result proves the database boundary, not that the product can be operated.

**Reproduction:** On a hosted project with a reviewer account and MFA enabled, request a magic link, follow it, and observe the “Step up your session” screen. There is no input for a TOTP code and no enrolment flow. Static confirmation: `grep -RInE 'mfa\.(enroll|challenge|verify)' src` returns no matches.

**Remediation:** Add a reviewer MFA flow that (1) enrols a TOTP factor and displays the QR/secret once, (2) creates a challenge and verifies the six-digit code, (3) refreshes the session/assurance level after verification, (4) handles wrong/expired codes and recovery, and (5) is covered by an end-to-end test with a labelled account. Alternatively, use an approved external identity provider that returns an AAL2-equivalent session, and document the trust boundary. Do not weaken the RLS requirement to make the screen disappear.

**Acceptance test:** A labelled reviewer enrols TOTP, signs out and back in, completes the challenge in the app, and sees the queue. An `aal1` session sees zero cases; a wrong code is rejected; a forwarded email grants nothing; sign-out clears the session.

**Launch impact:** Blocks live human review until implemented or replaced. This is not closed by the staging AAL2 capture.

---

## SC-10 — Server accepts contradictory identity answers and out-of-bank field values

**Severity:** Medium — server authority / evidence integrity  
**Status:** Open  
**Classification:** Confirmed defect (statically demonstrated and reproduced with the real `validateDraft`).  
**Specification requirement:** The server must validate the submitted snapshot against the canonical bank, preserve answer integrity, and prevent a fabricated client snapshot from being treated as authoritative.

**Observed:**

- The lead is validated independently for state and date of birth: [`supabase/functions/_shared/case.ts:544`](../../supabase/functions/_shared/case.ts#L544). The questionnaire rows `ID-01` (date of birth) and `ID-03` (state) are separate answers and are prefilled from the lead, but can then be edited: [`src/features/interview/questionBank.ts:146`](../../src/features/interview/questionBank.ts#L146), [`src/features/interview/questionBank.ts:169`](../../src/features/interview/questionBank.ts#L169), [`src/features/interview/useInterview.ts:139`](../../src/features/interview/useInterview.ts#L139). Nothing compares the two representations.
- For free-text and date questions, the server accepts the client's `answerText` after only a length/control-character check and stores it as authoritative: [`supabase/functions/_shared/case.ts:752`](../../supabase/functions/_shared/case.ts#L752), [`supabase/functions/_shared/case.ts:900`](../../supabase/functions/_shared/case.ts#L900).
- `parseFields` checks that a field ID belongs to the question and that the value is non-empty, but never checks the field's `kind` or its `options`: [`supabase/functions/_shared/case.ts:369`](../../supabase/functions/_shared/case.ts#L369). A single-choice field therefore accepts a value that is not in the bank.

**Reproduction (fictitious data):** Run `npx --yes deno@2.9.6 run --allow-env audit/2026-10-28-spec-conformance/evidence/probes/identity-and-field-probe.ts`. The output is [`evidence/identity-and-field-probe.log`](evidence/identity-and-field-probe.log):

| Probe | Expected | Observed |
| --- | --- | --- |
| Lead DOB `1980-01-01`; `ID-01` answer `2010-01-01` | Reject the conflict | **Accepted**; stored both values |
| Lead state `TX`; `ID-03` answer `CA` | Reject the conflict | **Accepted**; stored both values |
| `MH-02.condition` value `invented-option-not-in-bank` | Reject the unknown option | **Accepted**; stored as the condition |

**Impact:** A syntactically valid case can contain two different dates of birth or two different states, and a structured choice can hold text the questionnaire never offered. A reviewer may rely on the wrong identity or condition detail, and the record no longer supports the claim that every answer was rebuilt from the canonical bank. This is a data-integrity defect, not a direct data-exposure vulnerability; React escapes the stored text.

**Remediation:** Canonicalise `ID-01`/`ID-03` from the lead (or reject a mismatch); validate every field value against `field.options` for `single_choice`/`multi_choice`; validate `date`/`number` field formats and required components; derive `answerText` server-side from structured values where the question type allows it; add Deno tests for each case.

**Acceptance test:** The three probes are rejected with specific reasons; a normal canonical draft still passes; the portal never displays a value outside the approved option set.

**Launch impact:** Should close before live intake. It does not by itself expose another customer's data, but it weakens the evidence and identity controls the launch gates rely on.

---

## SC-11 — Magic-link sign-in can create accounts for any address

**Severity:** Medium (conditional) — abuse/configuration  
**Status:** Open  
**Classification:** Confirmed client behaviour; hosted signup setting not verified.  
**Specification requirement:** Reviewer access must be restricted to the authorised allowlist, and the portal must not imply a control it does not enforce.

**Observed:**

- `sendSignInLink` calls `supabase.auth.signInWithOtp` without `shouldCreateUser: false`: [`src/lib/api.ts:576`](../../src/lib/api.ts#L576). The installed `@supabase/auth-js` documents and implements `create_user: options?.shouldCreateUser ?? true` (default **true**).
- The portal says “Sign in with the address on the reviewer allowlist” and “If that address is on the allowlist, a sign-in link is on its way”: [`src/pages/PortalPage.tsx:61`](../../src/pages/PortalPage.tsx#L61), [`src/pages/PortalPage.tsx:91`](../../src/pages/PortalPage.tsx#L91). The allowlist is not consulted before the link is requested.
- The repository has no `[auth]` signup setting or `shouldCreateUser` guard: [`supabase/config.toml`](../../supabase/config.toml); static evidence in [`evidence/auth-surface.log`](evidence/auth-surface.log).

**Impact:** If the hosted project allows new users (the Supabase default), any unauthenticated visitor can create an Auth user and cause a sign-in email to an arbitrary address. The new user is not in `reviewers` and cannot read cases because RLS and AAL2 still deny access, so this is not a confidentiality breach. It is an abuse, cost and sender-reputation risk, and the UI currently overstates the allowlist check.

**Remediation:** Pass `shouldCreateUser: false`; disable sign-ups in the hosted Supabase Auth settings; add CAPTCHA or an equivalent abuse control; keep the response generic to avoid account enumeration; confirm the redirect allowlist. Record the hosted setting as deployment evidence.

**Acceptance test:** A non-allowlisted address receives no link and no user is created; an allowlisted address receives the link; the response does not reveal allowlist membership; repeated requests are rate-limited.

**Launch impact:** Nonblocking for data access, but should close before public launch.

---

## SC-12 — The reviewer queue silently stops at 50 cases

**Severity:** Low — operational completeness  
**Status:** Open  
**Classification:** Confirmed limitation (static).  
**Specification requirement:** Human review must be able to reach every submitted case; the queue is the reviewer’s entry point.

**Observed:** `listCases` reads the payload-free summary view with `.limit(50)` and no `range`, cursor, filter or “older” control: [`src/lib/api.ts:421`](../../src/lib/api.ts#L421). The portal renders the returned list without a pagination control.

**Impact:** Once more than 50 cases exist, older cases disappear from the only queue UI. They remain in the database and can be fetched by reference, but a reviewer has no normal way to discover them. This can leave a real submission unreviewed.

**Remediation:** Add keyset or range pagination, a status filter and a total/older indicator; test with 51+ labelled cases. Do not remove the payload-free projection while doing so.

**Acceptance test:** 51 labelled cases are all reachable through the queue; the 51st is visible on the next page/older action; no payload is selected by the queue.

**Launch impact:** Low at initial volume; becomes an operational risk as submissions accumulate.

---

## What this register is not

- It is not a legal, clinical or underwriting approval.
- It is not a penetration test or a hosted security assessment.
- It does not reopen the A5 findings; their status is in [`../2026-10-28-qwencloud-remediation/README.md`](../2026-10-28-qwencloud-remediation/README.md). `SC-09`–`SC-12` are additional findings from this pass, not a restatement of A5.
- It does not change the code or the questionnaire.
