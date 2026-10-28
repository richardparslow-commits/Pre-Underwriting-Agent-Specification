# Qwencloud audit — independent issue register

Audit date: **2026-10-27**  
Repository: `richardparslow-commits/Pre-Underwriting-Agent-Specification`  
Branch / commit: `main` / `07fdbfe632d48ef363caac086e82b8c2f13277a2`  
Prompt: `audit/archive/2026-10-27-pre-qwencloud/INPUT-QwencloudPre-Underwriting-Agent.md`  
Prompt status: Incomplete: 53 lines / 2,296 bytes; ends at the workflow line 'human review' with an unclosed code fence and no detailed specification, test commands or output format.

**Verdict:** **NOT READY to accept real customer health information.** Suitable only for a labelled, non-customer local preview/demo.

This register is a fresh reconciliation of every prior finding, not a reprint. The two prior lists are frozen at `audit/archive/2026-10-27-pre-qwencloud/LIST-1-FINDINGS.md` and `LIST-2-CONDITIONS.md`; the archive index records that no separate second independent audit report was present in this checkout.

## Totals

| Measure | Count |
|---|---:|
| Total findings | 24 |
| Critical | 0 |
| High | 4 |
| Medium | 10 |
| Low | 9 |
| Informational | 1 |
| Launch-blocking now | 13 |
| Nonblocking / conditional / pre-enable | 11 |
| Prior findings reconfirmed | 18 |
| New findings | 6 |

| ID | Severity | Prior | Finding | Launch impact |
|---|---|---|---|---|
| QW-01 | High | F-01 | Public submission accepts a fabricated questionnaire snapshot | Blocks launch |
| QW-02 | High | F-02 | Consent evidence is client-asserted and not validated against server policy | Blocks launch; independently blocks enabling marketing |
| QW-03 | High | F-14 | The questionnaire replaces seven source windows and has no source-verified row | Blocks launch; primary blocker |
| QW-04 | High | new | Client-supplied crisis flag and review flags are not re-derived server-side | Blocks launch |
| QW-05 | Medium | F-03 | Branch-closed details survive into the submitted record | Blocks launch for the answer-integrity gate |
| QW-06 | Medium | F-04 | No submission idempotency; ambiguous retries duplicate cases | Blocks launch for the delivery-reliability gate |
| QW-07 | Medium | F-05 | Notification retry can duplicate sends and has no row claiming | Blocks launch for the delivery-reliability gate |
| QW-08 | Medium | F-06 | Delivery webhook accepts replay/out-of-order events and can regress status | Blocks launch for the delivery-evidence gate |
| QW-09 | Medium | F-07 | Deployment configuration and retry schedule are absent from the repository | Blocks deployment and launch |
| QW-10 | Medium | F-08 | No adult/self or jurisdiction verification | Blocks launch unless the business accepts the risk in writing |
| QW-11 | Medium | F-09 | Held sensitive source questions are shown verbatim to customers | Blocks launch for the sensitive-question gate |
| QW-12 | Medium | new | Marketing revocation and suppression are promised but unimplemented | Pre-enable gate; blocks enabling marketing, not the current disabled-channel build |
| QW-22 | Medium | new | Reviewer MFA is enrollment-only; no policy requires an AAL2 session | Blocks launch for real customer data |
| QW-23 | Medium | new | No retention, deletion, backup or incident-response control is implemented | Blocks launch for real customer data |
| QW-13 | Low | F-10 | Privacy acknowledgement records the wrong notice version | Nonblocking independently; fix with QW-02 |
| QW-14 | Low | F-11 | Body cap counts characters, not bytes | Nonblocking hardening |
| QW-15 | Low | F-12 | Rate limiting is per-instance and keyed by a spoofable header | Nonblocking at low volume with monitoring; relevant before public launch |
| QW-16 | Low | F-13 | not_sent cases are never retried | Nonblocking only if no real case is submitted before provider configuration; otherwise operational blocker |
| QW-17 | Low | new | Confirmation says the case was queued when notification was not sent | Nonblocking; fix before launch |
| QW-18 | Low | F-15 | Stale and misleading documentation and UI counts | Nonblocking; fix before launch |
| QW-19 | Low | F-16 | Dependency and CI supply-chain exposure | Nonblocking |
| QW-20 | Low | F-17 | Deno dependencies are unpinned and there is no lockfile | Nonblocking |
| QW-24 | Low | new | Live portal never records an 'opened' access entry | Nonblocking; fix with access logging |
| QW-21 | Informational | F-18 | Immutability trigger covers the payload but not all evidence metadata | Nonblocking hardening |

## Full records

### QW-01 — Public submission accepts a fabricated questionnaire snapshot

- **Prior ID:** F-01
- **Severity:** High
- **Status:** open
- **Classification:** Confirmed defect
- **Verification:** Runtime reproduced against the real validateDraft
- **Affected:** Questionnaire fidelity, reviewer evidence, held data
- **Launch gate:** 1, 4, 7
- **Launch impact:** Blocks launch

**Summary.** The public function checks answer shape and vocabulary but never checks the question against an approved bank.

**Observed.** The probe accepted MED-11 (held HIV) as approved, RES-05 (held visa/green-card number), INVENTED-99 with invented source text and 'Past 99 years', a zero-answer payload, an invented questionnaire version, and a client-invented not_applicable disposition that hides a row from the summary. It rejected duplicate IDs, more than 400 answers, marketing without a phone and non-self relationship.

**Evidence.** supabase/functions/_shared/case.ts:226-441; supabase/functions/submit-case/index.ts:115-155; .tmp/qwencloud/validate_probe.ts (21 cases)

**Consequence.** Fabricated questions, altered windows and held sensitive answers can enter the immutable case; a reviewer cannot tell the record was never approved.

**Smallest suitable remediation.** Ship a canonical server-side bank; rebuild source text, timeframe, status, reviewStatus and disposition from it; reject unknown IDs, mismatches, held rows and stale acknowledgements.

**Acceptance test.** Forged MED-11, INVENTED-99, changed-timeframe and zero-answer payloads return 422 and write no row.

### QW-02 — Consent evidence is client-asserted and not validated against server policy

- **Prior ID:** F-02
- **Severity:** High
- **Status:** open
- **Classification:** Confirmed defect; marketing part is a pre-enable gate
- **Verification:** Runtime reproduced against the real validateDraft
- **Affected:** Consent separation, TCPA evidence, privacy acknowledgement
- **Launch gate:** 5
- **Launch impact:** Blocks launch; independently blocks enabling marketing

**Summary.** The server requires intake and privacy consent objects with granted:true but trusts their IDs, wording, versions, timestamps and any extra records; it has no channel or seller policy.

**Observed.** The probe accepted marketing_call and marketing_text with no channel or seller configured, an unknown consent ID, a duplicate privacy acknowledgement, textVersion '1999-01-a' with different wording, a 2027 grantedAt with completedAt before startedAt, an arbitrary acknowledgement ID/version, and a marketing numberAuthorized that did not match the lead phone.

**Evidence.** supabase/functions/_shared/case.ts:283-330, 409-423; .tmp/qwencloud/validate_probe.ts (21 cases)

**Consequence.** The case can contain evidence the customer never saw the stated wording or consented to an unoperated channel; the privacy acknowledgement can be fabricated.

**Smallest suitable remediation.** Use server constants for consent IDs, versions and wording hashes; a server-owned channel/seller policy; reject duplicates, unknown IDs, mismatches and future timestamps; store client and server receipt times separately.

**Acceptance test.** Forged marketing while disabled, wrong version/text, duplicate/unknown ID and future timestamps return 422; a valid draft returns 201 with both times.

### QW-03 — The questionnaire replaces seven source windows and has no source-verified row

- **Prior ID:** F-14
- **Severity:** High
- **Status:** open
- **Classification:** Confirmed deviation plus missing named approval
- **Verification:** Recomputed from the audited bank and reconciliation data
- **Affected:** Questionnaire fidelity, legal/underwriting approval
- **Launch gate:** 1, 2
- **Launch impact:** Blocks launch; primary blocker

**Summary.** All 92 rows have sourceVerified false, yet 87 are reviewStatus approved and shown. Seven rows replace a source window, 11 change wording, 19 source items are partly collected and 9 are out of scope.

**Observed.** MED-10 current -> past 5 years; AVI-04 next 2 years -> next 12 months; AVO-01 past/next 2 years -> past 5 years; RES-02 source 5-year residence + 2-year travel -> past 5 years outside US; RES-03 next 2/24 months -> next 12 months; MIL-01 current active duty -> ever served; MIL-03 current/planned deployment -> past 12 months. 37 rows are listed for sign-off (34 with a non-matching verdict or flag, plus three compound splits that need confirmation); no row has a named sign-off.

**Evidence.** src/features/interview/questionBank.ts; src/features/interview/reconciliation.ts; docs/question-bank-reconciliation.md; .tmp/qwencloud/reconciliation-summary.json

**Consequence.** Customers are asked different questions from the controlled source, including narrower future-travel and wider past-avocation windows; there is no defensible approved questionnaire version.

**Smallest suitable remediation.** Obtain a named owner/counsel/underwriting decision for each of the 37 rows; restore the source window or record an approved deviation with name/date; set sourceVerified only then; bump the version and regenerate the report.

**Acceptance test.** A signed table covers all 37 rows; check:bank passes; branch tests cover restored rows; sourceVerified is true only with evidence.

### QW-04 — Client-supplied crisis flag and review flags are not re-derived server-side

- **Prior ID:** New in this audit
- **Severity:** High
- **Status:** open
- **Classification:** Confirmed defect
- **Verification:** Runtime reproduced against the real validateDraft; portal path statically traced
- **Affected:** Current-crisis triage, reviewer safety, queue prioritisation
- **Launch gate:** 3, 4, 8
- **Launch impact:** Blocks launch

**Summary.** The server accepts crisisDisclosure and flags from the client instead of deriving them from the submitted MH-05 answer. A forged payload can answer MH-05 Yes while setting crisisDisclosure false and flags empty.

**Observed.** The probe accepted an MH-05 Yes answer with crisisDisclosure:false and flags:[]; submit-case stores draft.crisisDisclosure in the crisis_disclosure column and the payload flags; PortalPage uses crisisDisclosure for the Safety disclosure badge and CaseReview uses the payload flags for Review flags.

**Evidence.** supabase/functions/submit-case/index.ts:136; supabase/functions/_shared/case.ts:409-423; src/pages/PortalPage.tsx:171,252; src/features/portal/CaseReview.tsx:267,412-417; .tmp/qwencloud/validate_probe.ts (21 cases)

**Consequence.** An attacker or buggy client can suppress the urgent queue badge and crisis panel for a customer who disclosed current self-harm thoughts, delaying human review.

**Smallest suitable remediation.** Derive crisisDisclosure from the canonical MH-05 answer on the server; derive flags from the answer set; ignore or reject client flags that contradict answers; test MH-05 Yes with false flags.

**Acceptance test.** A payload with MH-05 Yes and crisisDisclosure:false is either rejected or stored with crisis_disclosure true and an urgent server-derived flag; no client-supplied flag can remove it.

### QW-05 — Branch-closed details survive into the submitted record

- **Prior ID:** F-03
- **Severity:** Medium
- **Status:** open
- **Classification:** Confirmed defect
- **Verification:** Runtime reproduced with the real engine
- **Affected:** Answer integrity, branch behaviour, reviewer view
- **Launch gate:** 2, 3
- **Launch impact:** Blocks launch for the answer-integrity gate

**Summary.** Changing a parent answer does not clear child answers; toSubmittedAnswers emits fields for every row, including those whose disposition is not_asked.

**Observed.** With MH-01 Yes and four MH-02 fields, then MH-01 No, MH-02 became not_asked but still carried four fields; CaseReview renders fields and details regardless of disposition.

**Evidence.** src/features/interview/useInterview.ts:150-160; src/features/interview/engine.ts:251-278; src/features/portal/CaseReview.tsx:56-110; .tmp/qwencloud/engine_probe.ts

**Consequence.** A customer who withdraws an answer still sends the withdrawn health detail and the reviewer sees it under 'Not asked'.

**Smallest suitable remediation.** Delete hidden descendants when visibility changes; omit fields/details for not_asked; render no components for not-asked rows; test nested branches.

**Acceptance test.** Parent flip leaves no hidden child fields in state, payload or portal.

### QW-06 — No submission idempotency; ambiguous retries duplicate cases

- **Prior ID:** F-04
- **Severity:** Medium
- **Status:** open
- **Classification:** Confirmed defect (static)
- **Verification:** Statically demonstrated; no HTTP load test
- **Affected:** Submission reliability, duplicate cases
- **Launch gate:** 8
- **Launch impact:** Blocks launch for the delivery-reliability gate

**Summary.** Every POST inserts a new case; the only uniqueness is the server-generated reference. The client sends no idempotency key and has no abortable timeout.

**Observed.** A lost response after a successful insert, a retry or a rapid double submission creates a second case. A reference collision retries with a new reference, not the original request.

**Evidence.** supabase/functions/submit-case/index.ts:115-165; src/lib/api.ts:305-334; supabase/migrations/0001_pre_underwriting.sql (no idempotency column)

**Consequence.** Duplicate cases and reviewer work after timeouts or double clicks.

**Smallest suitable remediation.** Per-draft idempotency key, unique index, replay returns the original receipt, abortable client request reusing the key.

**Acceptance test.** Concurrent and timed-out submissions create exactly one case with one reference.

### QW-07 — Notification retry can duplicate sends and has no row claiming

- **Prior ID:** F-05
- **Severity:** Medium
- **Status:** open
- **Classification:** Confirmed defect (static)
- **Verification:** Statically demonstrated
- **Affected:** Notification reliability, duplicate email
- **Launch gate:** 8
- **Launch impact:** Blocks launch for the delivery-reliability gate

**Summary.** The submit function sends before updating status; the retry worker selects queued/failed rows without FOR UPDATE SKIP LOCKED, a lease or a claim state, and sends before updating.

**Observed.** A failed status write after provider acceptance leaves the row queued and the next retry sends again; overlapping cron invocations can both send; the customer response can say accepted when the database write failed.

**Evidence.** supabase/functions/submit-case/index.ts:166-190; supabase/functions/retry-case-notifications/index.ts:52-105

**Consequence.** Duplicate reviewer emails and conflicting status evidence.

**Smallest suitable remediation.** Provider idempotency key, row lease/SKIP LOCKED, sending state before call, message-ID reconciliation, persisted receipt.

**Acceptance test.** Crash-after-accept and overlapping-worker tests produce exactly one email.

### QW-08 — Delivery webhook accepts replay/out-of-order events and can regress status

- **Prior ID:** F-06
- **Severity:** Medium
- **Status:** open
- **Classification:** Confirmed defect; shared-secret authentication documented
- **Verification:** Statically demonstrated
- **Affected:** Notification evidence, delivery status
- **Launch gate:** 8
- **Launch impact:** Blocks launch for the delivery-evidence gate

**Summary.** email.sent/delivery_delayed map to accepted and email.delivered to delivered, with no event ID, timestamp tolerance or monotonic transition; a later email.sent overwrites delivered.

**Observed.** The endpoint compares a shared secret directly and has no raw-body signature, replay window or event dedupe. A replayed or delayed event is accepted.

**Evidence.** supabase/functions/email-events/index.ts:27-40, 102-120

**Consequence.** The portal can regress delivery evidence or show contradictory status.

**Smallest suitable remediation.** Verify provider signature over raw body, timestamp tolerance, event-ID dedupe, no downgrade from delivered, message-ID reconciliation.

**Acceptance test.** Forged, replayed and out-of-order events cannot create or regress delivery evidence.

### QW-09 — Deployment configuration and retry schedule are absent from the repository

- **Prior ID:** F-07
- **Severity:** Medium
- **Status:** open
- **Classification:** Operational evidence missing / configuration gap
- **Verification:** Repository inspection
- **Affected:** Deployability, public submission, scheduled retries
- **Launch gate:** Deployment prerequisite
- **Launch impact:** Blocks deployment and launch

**Summary.** README instructs verify_jwt=false and says to keep the flags in the repo, but no supabase/config.toml or cron/schedule definition exists.

**Observed.** A by-the-repo deployment hits the default JWT protection on the public endpoint, and the retry function has no scheduler evidence.

**Evidence.** README.md:222-234; LOVABLE.md; no supabase/config.toml; no cron definition

**Consequence.** Anonymous submissions can fail before reaching the handler, or notifications stay queued forever.

**Smallest suitable remediation.** Commit the three function JWT settings and a documented schedule; verify a deployed 401-to-201 transition and one cron tick.

**Acceptance test.** A clean deployment accepts an anonymous non-customer submission and the retry worker runs on schedule.

### QW-10 — No adult/self or jurisdiction verification

- **Prior ID:** F-08
- **Severity:** Medium
- **Status:** open
- **Classification:** Confirmed defect / operational gate
- **Verification:** Static; runtime probe accepted a ZZ state
- **Affected:** Eligibility, minor/third-party intake, lead validation
- **Launch gate:** 4
- **Launch impact:** Blocks launch unless the business accepts the risk in writing

**Summary.** The lead form collects no age/DOB; relationship is a constant self; the server accepts any 2-40 character state and treats relationship:self as proof.

**Observed.** A minor or third party can complete the interview; an invented state ZZ is stored. The DOB question arrives later and is not used for an age gate.

**Evidence.** src/features/intake/LeadForm.tsx; src/features/intake/validation.ts; supabase/functions/_shared/case.ts:228-260; .tmp/qwencloud/validate_probe.ts (21 cases)

**Consequence.** The specification's adult-self boundary is a UI assertion, not a control.

**Smallest suitable remediation.** Capture DOB/adult attestation before health questions; compute age server-side; validate state against the US list; reject non-self; test 17-year-old, ZZ and third-party payloads.

**Acceptance test.** A 17-year-old, ZZ state and non-self relationship are rejected.

### QW-11 — Held sensitive source questions are shown verbatim to customers

- **Prior ID:** F-09
- **Severity:** Medium
- **Status:** open
- **Classification:** Confirmed defect against stated intent
- **Verification:** Statically demonstrated in the review component
- **Affected:** Data minimisation, held-row presentation
- **Launch gate:** 1, 9
- **Launch impact:** Blocks launch for the sensitive-question gate

**Summary.** The review screen expands 'Questions held for human review' and renders each held row's sourceText, including HIV, suicide-attempt, immigration and visa-number wording.

**Observed.** The five held rows (ID-04, MED-11, MH-06, RES-04, RES-05) are excluded from the interview but their full source text is rendered in the customer review panel.

**Evidence.** src/features/intake/ReviewScreen.tsx:274-298; docs/LAUNCH-GATES.md sensitive-question register

**Consequence.** The product surfaces sensitive content it says it withholds and puts identity-document-adjacent wording in front of every visitor.

**Smallest suitable remediation.** Show a count and generic topics or internal references, not source text; keep the full list in the reviewer/coverage record; test the customer DOM.

**Acceptance test.** Held wording is absent from the customer DOM and public bundle under the chosen policy.

### QW-12 — Marketing revocation and suppression are promised but unimplemented

- **Prior ID:** New in this audit
- **Severity:** Medium
- **Status:** open
- **Classification:** Pre-enable gate / operational evidence missing
- **Verification:** Static; no outbound marketing channel is enabled
- **Affected:** Consent withdrawal, suppression enforcement, TCPA operations
- **Launch gate:** 5
- **Launch impact:** Pre-enable gate; blocks enabling marketing, not the current disabled-channel build

**Summary.** The messaging terms promise action within 10 business days and describe STOP/email withdrawal, but there is no revocation route or job; the contact_suppressions table is never read by application code.

**Observed.** The table exists with reviewer select only; no outbound code checks it. MessagingTermsPage makes the 10-business-day promise. Marketing is off by default, so no active outreach is occurring.

**Evidence.** src/pages/MessagingTermsPage.tsx:37-42; supabase/migrations/0001_pre_underwriting.sql:199-224; grep finds no application read of contact_suppressions

**Consequence.** Once a call/text channel is enabled, a STOP or revocation could fail to propagate and the published 10-day commitment would not be evidenced.

**Smallest suitable remediation.** Add a revocation path and operator procedure; check suppression before every outbound attempt; log receipt and action; test STOP, email withdrawal and a revoked number.

**Acceptance test.** A revocation creates a suppression record and an outbound attempt is blocked with auditable timing.

### QW-22 — Reviewer MFA is enrollment-only; no policy requires an AAL2 session

- **Prior ID:** New in this audit
- **Severity:** Medium
- **Status:** open
- **Classification:** Confirmed authorization gap
- **Verification:** Statically demonstrated; live session behaviour not tested
- **Affected:** Reviewer authentication, case confidentiality
- **Launch gate:** 7
- **Launch impact:** Blocks launch for real customer data

**Summary.** The portal accepts any Supabase session whose user is in reviewers; is_reviewer() checks membership only. Nothing in the client or the RLS policies requires auth.jwt()->>'aal' = 'aal2'.

**Observed.** useReviewerAuth reads session.user.email without checking authenticatorAssuranceLevel, the portal gate uses email !== null, and every reviewer policy calls is_reviewer() only. Supabase does not auto-enforce AAL2 at the API gateway; its documented enforcement is an RLS/gateway check. A password-only aal1 session for an MFA-enrolled reviewer therefore still selects cases.

**Evidence.** src/features/portal/useReviewerAuth.ts:28-36,65-70; supabase/migrations/0001_pre_underwriting.sql:60-72,135-148; docs/LAUNCH-GATES.md:17; Supabase MFA/RLS documentation (https://supabase.com/docs/guides/auth/auth-mfa)

**Consequence.** A stolen reviewer password bypasses the second factor and exposes every case, including current-crisis disclosures.

**Smallest suitable remediation.** Require aal2 in the reviewer RLS policies or a trusted gateway, and make the portal refuse an aal1 session with a clear step-up prompt; test with a password-only session.

**Acceptance test.** A password-only reviewer session sees zero cases and cannot call the review/correction RPCs; after TOTP step-up the same session succeeds.

### QW-23 — No retention, deletion, backup or incident-response control is implemented

- **Prior ID:** New in this audit
- **Severity:** Medium
- **Status:** open
- **Classification:** Documented limitation / operational evidence missing
- **Verification:** Repository inspection; no live project available
- **Affected:** Data lifecycle, deletion requests, breach readiness
- **Launch gate:** 9, launch checklist
- **Launch impact:** Blocks launch for real customer data

**Summary.** The README and launch checklist say retention/deletion and incident response are not implemented; cases have no delete policy and no expiry job, while the customer is told they can ask for deletion.

**Observed.** README line 29 says the retention/deletion job is not implemented. The cases table has no delete policy. PrivacyPage and PermissionStep promise correction or deletion on request, and CaseReview says retention follows the documented schedule, but no schedule, deletion procedure, backup expiry or incident runbook exists in the repository.

**Evidence.** README.md:28-29, docs/LAUNCH-GATES.md:53,58-61; src/pages/PrivacyPage.tsx:32-33; src/features/portal/CaseReview.tsx:620-625; supabase/migrations/0001_pre_underwriting.sql:158

**Consequence.** Real health data would be retained indefinitely, a deletion request could not be honored reproducibly, and a breach would have no documented response or backup boundary.

**Smallest suitable remediation.** Approve a retention schedule; add a controlled deletion/expiry procedure and audit entry; document backup expiry and incident response; test a labelled case deletion and restore path.

**Acceptance test.** A labelled case can be deleted under the approved procedure, the deletion is audited, backups expire on schedule and the incident runbook names an owner and contact path.

### QW-13 — Privacy acknowledgement records the wrong notice version

- **Prior ID:** F-10
- **Severity:** Low
- **Status:** open
- **Classification:** Confirmed defect
- **Verification:** Statically demonstrated
- **Affected:** Consent evidence, privacy notice traceability
- **Launch gate:** 5
- **Launch impact:** Nonblocking independently; fix with QW-02

**Summary.** The displayed privacy version is 2026-10-a, but buildConsentRecords stamps the privacy record with the shared consent version 2026-10-b.

**Observed.** The privacy record cannot prove which notice version the customer saw.

**Evidence.** src/features/consent/consentTexts.ts:18-21, 44-52; src/features/intake/PermissionStep.tsx:86-88; src/features/consent/marketingConsent.ts:140-160

**Consequence.** The case links the customer's acknowledgement to a different document version.

**Smallest suitable remediation.** Use a per-purpose noticeVersion and stamp the privacy record with PRIVACY_PRACTICES_VERSION.

**Acceptance test.** The stored privacy record carries the displayed privacy version.

### QW-14 — Body cap counts characters, not bytes

- **Prior ID:** F-11
- **Severity:** Low
- **Status:** open
- **Classification:** Confirmed defect
- **Verification:** Runtime reproduced with the real handler
- **Affected:** Abuse resistance, request handling
- **Launch gate:** 4
- **Launch impact:** Nonblocking hardening

**Summary.** MAX_BODY_BYTES is 512 KB, but the post-read check is raw.length > MAX_BODY_BYTES; a multibyte body can exceed 512 KiB while passing.

**Observed.** A 424,063-character / 824,063-byte body passed the character check and reached service configuration instead of returning 413.

**Evidence.** supabase/functions/submit-case/index.ts:70-91; .tmp/qwencloud/byte_probe_test.ts

**Consequence.** The stated byte cap is not enforced; the platform's own limits bound the damage.

**Smallest suitable remediation.** Measure TextEncoder byte length or stream with a byte counter; reject before full buffering where possible.

**Acceptance test.** A multibyte body above 512 KiB returns 413 before validation or service configuration.

### QW-15 — Rate limiting is per-instance and keyed by a spoofable header

- **Prior ID:** F-12
- **Severity:** Low
- **Status:** open
- **Classification:** Documented limitation
- **Verification:** Statically demonstrated
- **Affected:** Anonymous abuse, queue flooding
- **Launch gate:** 4
- **Launch impact:** Nonblocking at low volume with monitoring; relevant before public launch

**Summary.** The limiter is an in-process Map of 10 requests per 10 minutes keyed by the first X-Forwarded-For or cf-connecting-ip.

**Observed.** A caller can rotate the header or hit a fresh instance; the code already says a WAF or durable limiter belongs in front.

**Evidence.** supabase/functions/_shared/case.ts:506-535

**Consequence.** An attacker can fill the reviewer queue and cause operational load.

**Smallest suitable remediation.** Durable or WAF limiting keyed on trustworthy client identity; alert on submission volume.

**Acceptance test.** Header rotation and a second instance do not bypass the durable limit.

### QW-16 — not_sent cases are never retried

- **Prior ID:** F-13
- **Severity:** Low
- **Status:** open
- **Classification:** Confirmed operational gap
- **Verification:** Statically demonstrated
- **Affected:** Notification recovery
- **Launch gate:** 8
- **Launch impact:** Nonblocking only if no real case is submitted before provider configuration; otherwise operational blocker

**Summary.** The retry worker selects only queued and failed; a missing provider or portal origin yields not_sent and zero attempts, which is never selected again.

**Observed.** Cases submitted before provider setup remain visible in the portal but can never be notified by the worker.

**Evidence.** supabase/functions/retry-case-notifications/index.ts:56-60; supabase/functions/_shared/email.ts:100-120

**Consequence.** The reviewer may never be alerted.

**Smallest suitable remediation.** Add an operator re-notify action for not_sent, or include it once a provider is configured, with an audit entry.

**Acceptance test.** A not_sent case can be re-queued and produces exactly one notification.

### QW-17 — Confirmation says the case was queued when notification was not sent

- **Prior ID:** New in this audit
- **Severity:** Low
- **Status:** open
- **Classification:** Confirmed UI copy defect
- **Verification:** Statically traced in the not_sent path
- **Affected:** Accurate confirmation, reviewer expectation
- **Launch gate:** 8
- **Launch impact:** Nonblocking; fix before launch

**Summary.** The confirmation header always says 'Your answers are saved and queued for review', even when receipt.notification.state is not_sent; the timeline below correctly says no notification was attempted.

**Observed.** Preview and provider-unconfigured submissions return not_sent, so the header and timeline contradict each other.

**Evidence.** src/features/intake/ConfirmationScreen.tsx:37-39; src/features/intake/StatusTimeline.tsx:43-45; src/lib/api.ts:341-359

**Consequence.** A customer can believe the reviewer was notified when no message was sent.

**Smallest suitable remediation.** Make the header conditional on notification state; say saved but not sent and give the next step; test preview/not_sent.

**Acceptance test.** No 'queued' copy appears unless state is queued/accepted, and the header matches the timeline.

### QW-18 — Stale and misleading documentation and UI counts

- **Prior ID:** F-15
- **Severity:** Low
- **Status:** open
- **Classification:** Confirmed documentation defect
- **Verification:** Recomputed from the audited files
- **Affected:** Reviewer confidence, auditability, customer copy
- **Launch gate:** Documentation
- **Launch impact:** Nonblocking; fix before launch

**Summary.** Several counts and claims are stale: 56-row references, 76 'source questions', 31 unanswered items, and Not applicable listed as implemented though never rendered.

**Observed.** site.ts and reconciliation.ts say 56 rows while the bank has 92; the landing page labels 76 approved core rows as source questions though the inventory has 113 and 85 traced; README says no row collapses lookbacks while seven replace windows; the README walkthrough records 31 unanswered while fresh engine data has 73 visible/unanswered on an empty interview; NOT_APPLICABLE_OPTION is defined but not offered; LAUNCH-GATES marks gates 3, 4, 6 and 7 Implemented although the server still trusts the client snapshot/acknowledgement, injection was not tested and MFA is not enforced.

**Evidence.** src/config/site.ts:66-70; src/features/interview/reconciliation.ts:1-3; src/pages/LandingPage.tsx:52-96; README.md:24,345-349; src/features/interview/types.ts:57-61

**Consequence.** Reviewers and the owner can overstate coverage; customers see a misleading source-question count.

**Smallest suitable remediation.** Generate counts from one source; relabel 76 as approved core rows or show 113/85; remove 56; implement or remove Not applicable; replace inherited walkthrough numbers with a dated ledger.

**Acceptance test.** A generated count check passes and no stale count remains in customer or reviewer copy.

### QW-19 — Dependency and CI supply-chain exposure

- **Prior ID:** F-16
- **Severity:** Low
- **Status:** open
- **Classification:** Dependency exposure; no exploit demonstrated
- **Verification:** npm audit and workflow inspection
- **Affected:** Build/test toolchain, runtime exposure
- **Launch gate:** Build/supply chain
- **Launch impact:** Nonblocking

**Summary.** npm audit reports 4 advisories (3 moderate, 1 high): Vite 5.4.21 and react-router-dom 6.30.6. CI actions are tag-pinned and npm ci runs lifecycle scripts.

**Observed.** No app path was found that exposes the react-router advisories; the Vite high advisory primarily affects the dev/build toolchain. CI has contents: read only.

**Evidence.** npm audit --json; .github/workflows/ci.yml:7-40; package-lock.json

**Consequence.** Known toolchain advisories; a compromised action tag or install script is a supply-chain path.

**Smallest suitable remediation.** Update Vite/react-router to patched releases, pin actions to SHAs, consider npm ci --ignore-scripts, review install scripts.

**Acceptance test.** No high advisory remains and CI actions are SHA-pinned.

### QW-20 — Deno dependencies are unpinned and there is no lockfile

- **Prior ID:** F-17
- **Severity:** Low
- **Status:** open
- **Classification:** Confirmed configuration gap
- **Verification:** Repository inspection
- **Affected:** Reproducible function tests/deployment
- **Launch gate:** Build/reproducibility
- **Launch impact:** Nonblocking

**Summary.** deno.json maps @supabase/supabase-js to a major range; tests import jsr:@std/assert@1; the documented command uses --no-lock and no deno.lock is tracked.

**Observed.** A future CI run or deployment can resolve different versions without a repository change.

**Evidence.** supabase/functions/submit-case/deno.json; .github/workflows/ci.yml; no deno.lock

**Consequence.** An upstream break is invisible until it happens; builds are not reproducible.

**Smallest suitable remediation.** Pin exact versions, commit deno.lock and run tests with the lockfile in CI.

**Acceptance test.** A clean CI run uses the committed lockfile and pinned versions.

### QW-24 — Live portal never records an 'opened' access entry

- **Prior ID:** New in this audit
- **Severity:** Low
- **Status:** open
- **Classification:** Confirmed audit-trail gap
- **Verification:** Statically demonstrated
- **Affected:** Access accountability, review log completeness
- **Launch gate:** 7, 10
- **Launch impact:** Nonblocking; fix with access logging

**Summary.** case_review_log allows 'opened' and the preview sample includes it, but no live code path calls record_case_review('opened') when a reviewer loads a case.

**Observed.** getCase loads the case and its log without writing an opened entry; CaseReview only calls recordReview for marked_reviewed and requested_clarification. A reviewer can read a case without leaving access evidence.

**Evidence.** src/lib/api.ts:418-460, 505-530; src/features/portal/CaseReview.tsx:172-187; supabase/migrations/0001_pre_underwriting.sql:163-171

**Consequence.** The access record cannot show who opened a sensitive case, only who changed its status.

**Smallest suitable remediation.** Record one opened entry per reviewer/case load (idempotent per session) through the RPC, and show it in the review log; test deduplication and failure handling.

**Acceptance test.** Loading a case as a reviewer adds one opened entry with actor and time; reload does not spam duplicates.

### QW-21 — Immutability trigger covers the payload but not all evidence metadata

- **Prior ID:** F-18
- **Severity:** Informational
- **Status:** open
- **Classification:** Confirmed narrow scope; no reviewer exploit
- **Verification:** Isolated PostgreSQL replay
- **Affected:** Case integrity hardening
- **Launch gate:** 7
- **Launch impact:** Nonblocking hardening

**Summary.** The trigger protects payload, reference, submitted_at and questionnaire_version, but crisis_disclosure and residence_state are not protected and the service role can change them.

**Observed.** The PGlite replay changed crisis_disclosure as the service role without tripping the trigger; reviewer column grants blocked the same change.

**Evidence.** supabase/migrations/0001_pre_underwriting.sql:112-132; .tmp/qwencloud/pglite_probe.mjs

**Consequence.** A privileged operator or service-role bug could change queue triage metadata without detection.

**Smallest suitable remediation.** Include derived evidence columns in the immutable set, or document why they are mutable; test with the service role.

**Acceptance test.** A service-role change to crisis_disclosure or residence_state is rejected or explicitly audited.

## Questionnaire totals used above

| Measure | Count |
|---|---:|
| source items | 113 |
| bank rows | 92 |
| source verified | 0 |
| traced | 85 |
| partial | 19 |
| out of scope | 9 |
| timeframe changed | 7 |
| wording changed | 11 |
| held | 5 |
| rows requiring decision | 37 |
| timeframe rows | MED-10, AVI-04, AVO-01, RES-02, RES-03, MIL-01, MIL-03 |
| held rows | ID-04, MED-11, MH-06, RES-04, RES-05 |

Counts were recomputed from `src/features/interview/questionBank.ts`, `sourceInventory.ts` and `reconciliation.ts` at the audited commit. `sourceVerified` remains `0`; no approval was inferred from `reviewStatus: approved`.
