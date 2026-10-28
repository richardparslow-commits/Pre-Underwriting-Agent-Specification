# Life Policy Pilot — Preserved issue register

> **Preserved audit record — not a remediation confirmation.** This is the canonical list of every issue established in the 27 October 2026 audit. All 18 issues are **open** at the baseline commit. Do not renumber or delete an issue; add a new audit result beside it.

| Item | Value |
| --- | --- |
| Audit date | 2026-10-27 |
| Repository | `richardparslow-commits/Pre-Underwriting-Agent-Specification` |
| Baseline | `07fdbfe632d48ef363caac086e82b8c2f13277a2` (`main`) |
| Verdict | **NOT READY to accept real customer health information** |
| Narrower supported scope | Ready for a labelled, non-customer preview/demo only, with preview-only warnings kept on. |
| Full report | [`audit/2026-10-27-pre-underwriting-audit.md`](2026-10-27-pre-underwriting-audit.md) |

**Scope.** Source code and an isolated local environment at the baseline commit. No live Supabase project, deployed function, Resend account, mailbox, MFA session, backup or retention configuration was available.

## Summary

No **Critical** issue was established. The 18 issues are:

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 3 |
| Medium | 7 |
| Low | 7 |
| Informational | 1 |
| **Total** | **18** |

**10 of 18 block launch** for real customer data. The other eight are lower-severity hardening, documentation or operational items; F-10 and F-13 still need action before launch, and F-13 becomes an operational blocker if real cases are submitted before the provider is configured. Launch gate 1 (questionnaire coverage) and gate 8 (delivery reliability) are **FAIL**; gates 2, 3, 4, 5, 7 and 9 are **PARTIAL**; gates 6 and 10 are **PASS (static only)**.

## Issue index

| ID | Issue | Severity | Verification | Launch impact |
| --- | --- | --- | --- | --- |
| [F-01](#f-01) | Public submission accepts a fabricated questionnaire snapshot | High | Runtime reproduced against the real validateDraft; storage path statically demonstrated | Blocks launch: fabricated evidence and held data can enter the immutable case record |
| [F-02](#f-02) | Consent evidence is client-asserted and not validated server-side | High | Runtime reproduced against validateDraft; client builder tests pass | Blocks launch; independently blocks enabling marketing |
| [F-14](#f-14) | The questionnaire does not preserve seven source windows and has no approved row | High | Data and code at the audited commit; reconciliation records state the differences | Blocks launch; primary launch blocker |
| [F-03](#f-03) | Branch-closed details survive into the submitted record | Medium | Runtime reproduced with the real engine; portal rendering statically confirmed | Blocks launch for the answer-integrity gate |
| [F-04](#f-04) | No submission idempotency; ambiguous retries duplicate cases | Medium | Statically demonstrated; no HTTP load test run | Blocks launch for the delivery-reliability gate |
| [F-05](#f-05) | Notification retry can duplicate sends and has no row claiming | Medium | Statically demonstrated | Blocks launch for the delivery-reliability gate |
| [F-06](#f-06) | Delivery webhook accepts replay/out-of-order events and can regress status | Medium | Statically demonstrated | Blocks launch for the delivery-evidence gate |
| [F-07](#f-07) | Deployment configuration is absent from the repository | Medium | Statically demonstrated; no supabase/config.toml tracked or present | Blocks deployment and launch |
| [F-08](#f-08) | No adult/age or jurisdiction verification | Medium | Static and browser; the lead form has no age field | Blocks launch unless the business accepts the risk in writing |
| [F-09](#f-09) | Held sensitive source questions are shown verbatim to customers | Medium | Runtime reproduced in the browser | Blocks launch for the sensitive-question gate; small fix |
| [F-10](#f-10) | Privacy acknowledgement records the wrong notice version | Low | Statically demonstrated | Nonblocking independently; fix with F-02 |
| [F-11](#f-11) | Body cap counts characters, not bytes, and is applied after reading when Content-Length is absent | Low | Statically demonstrated | Nonblocking hardening |
| [F-12](#f-12) | Rate limiting is per-instance and keyed by a spoofable header | Low | Statically demonstrated | Nonblocking at low volume with monitoring; relevant before public launch |
| [F-13](#f-13) | not_sent cases are never retried | Low | Statically demonstrated | Nonblocking only if no real case is submitted before provider configuration; otherwise an operational blocker |
| [F-15](#f-15) | Stale and misleading documentation and UI counts | Low | Recomputed from the audited files | Nonblocking; fix before launch |
| [F-16](#f-16) | Dependency and CI supply-chain exposure | Low | npm audit and workflow inspection | Nonblocking |
| [F-17](#f-17) | Deno dependencies are unpinned and there is no lockfile | Low | Repository inspection | Nonblocking |
| [F-18](#f-18) | Immutability trigger covers the payload but not all evidence metadata | Informational | Isolated database test | Nonblocking hardening |

## Detailed findings

### High

#### F-01

**Public submission accepts a fabricated questionnaire snapshot**

- **Severity / status:** High / open
- **Classification:** Confirmed defect
- **Verification:** Runtime reproduced against the real validateDraft; storage path statically demonstrated
- **Affected:** Questionnaire fidelity, reviewer evidence, held/sensitive data
- **Launch gate:** 1, 4, 7
- **Launch impact:** Blocks launch: fabricated evidence and held data can enter the immutable case record

**Issue.** submit-case validates answer shape, section membership, disposition vocabulary and timestamps, but never checks the submitted question against an approved bank.

**Observed.** Accepted MED-11 (held HIV) as approved, RES-05 (held visa/green-card number), INVENTED-99 with invented source wording and 'Past 99 years', and a zero-answer snapshot without a partial-submission marker. Rejected duplicate IDs, more than 400 answers, marketing consent without a phone, and non-self relationship.

**Evidence.** `supabase/functions/_shared/case.ts:226-441; supabase/functions/submit-case/index.ts:115-155` — commit `07fdbfe632d4`.

**Consequence.** Anyone can place fabricated source questions, altered timeframes or held sensitive answers into the immutable case. A reviewer cannot tell the record was never approved, and the promise that held items are never collected is false at the API.

**Smallest remediation.** Ship a server-side canonical bank (or compiled allowlist) with the function; rebuild sourceText, timeframe, status and reviewStatus from it; reject unknown IDs, mismatches, held rows and stale acknowledgements.

**Acceptance test.** Forged MED-11, INVENTED-99, changed-timeframe and zero-answer payloads return 422 and write no row.

#### F-02

**Consent evidence is client-asserted and not validated server-side**

- **Severity / status:** High / open
- **Classification:** Confirmed defect; marketing part is also a pre-enable gate
- **Verification:** Runtime reproduced against validateDraft; client builder tests pass
- **Affected:** Consent separation, TCPA evidence, privacy acknowledgement
- **Launch gate:** 5
- **Launch impact:** Blocks launch; independently blocks enabling marketing

**Issue.** The server requires intake and privacy consent objects with granted:true but trusts their label, text, version, timestamps and any extra records, with no enabled-channel or seller policy.

**Observed.** Accepted marketing_call and marketing_text with a phone while no channel or seller is configured; textVersion '1999-01-a' with different wording; duplicate privacy_acknowledgement plus unknown unexpected_consent; grantedAt in 2027 with completedAt before startedAt; arbitrary acknowledgement id, version '0' and future timestamp. Rejected only marketing consent without a phone.

**Evidence.** `supabase/functions/_shared/case.ts:283-330, 409-423` — commit `07fdbfe632d4`.

**Consequence.** The case can contain evidence the customer never saw the disclosed wording or consented to a channel the business does not operate. That is a false evidentiary record and, once a channel is enabled, TCPA exposure.

**Smallest remediation.** Server constants for consent IDs, versions and wording hashes; server-owned channel and seller configuration; reject unknown or duplicate IDs and any version/wording mismatch; require the current submission acknowledgement; store client-asserted and server receipt times separately.

**Acceptance test.** Forged marketing consent while channels are off, wrong version/text, duplicate/unknown ID and future timestamps return 422; a valid draft returns 201 with both times.

#### F-14

**The questionnaire does not preserve seven source windows and has no approved row**

- **Severity / status:** High / open
- **Classification:** Confirmed deviation plus missing legal/counsel decision
- **Verification:** Data and code at the audited commit; reconciliation records state the differences
- **Affected:** Requirements fidelity, questionnaire approval
- **Launch gate:** 1, 2
- **Launch impact:** Blocks launch; primary launch blocker

**Issue.** All 92 rows have sourceVerified false, yet 87 are reviewStatus approved and shown to customers. Seven rows replace a source window, 11 change wording, 19 source items are partly collected and 9 are out of scope, with no named reviewer acceptance.

**Observed.** AVO-01 asks past 5 years instead of past/next 2 years and omits four activities plus the future-intention limb; RES-03 asks next 12 months instead of 24 with no thresholds/countries; MIL-01 asks ever served instead of current active duty; MED-10 asks past 5 years instead of current and merges limbs; AVI-04 is 12 months instead of 2 years; RES-02 replaces the 5-year residence and 2-year travel detail; MIL-03 asks past 12 months instead of current deployment/orders. Out-of-scope items include SRC-010, SRC-032, SRC-033, SRC-059, SRC-062, SRC-064, SRC-067, SRC-068 and SRC-070. Each has a reason but no named acceptance.

**Evidence.** `src/features/interview/questionBank.ts:603, 1080, 1108, 1773, 1799, 1920, 1960; src/features/interview/types.ts:127-140; audit/2026-10-27-reconciliation-decisions.md` — commit `07fdbfe632d4`.

**Consequence.** Customers are asked different questions from the controlled source, including narrower future-travel and wider past-avocation windows. The reviewer package labels them source questions; the specification forbids silently changing a window or dropping a compound limb. There is no defensible questionnaire version.

**Smallest remediation.** Owner/counsel/underwriting decision per flagged row; restore the source window or record an approved deviation with name and date; set sourceVerified true only then; bump questionnaire version and regenerate.

**Acceptance test.** A signed table covers all 37 non-matching/flagged rows, check:bank passes, and branch tests cover restored rows.

### Medium

#### F-03

**Branch-closed details survive into the submitted record**

- **Severity / status:** Medium / open
- **Classification:** Confirmed defect
- **Verification:** Runtime reproduced with the real engine; portal rendering statically confirmed
- **Affected:** Answer integrity, branch behaviour, reviewer view
- **Launch gate:** 2, 3
- **Launch impact:** Blocks launch for the answer-integrity gate

**Issue.** Changing a parent answer clears acknowledgements but not child answers, and serialisation/rendering include fields for rows whose disposition is not_asked.

**Observed.** MH-01 = yes, four MH-02 details entered, then MH-01 changed to no: MH-02 becomes not_asked, but its depression, 2018, therapy and ongoing details remain in the payload and render under 'Not asked'. No attacker is needed.

**Evidence.** `src/features/interview/useInterview.ts:150-160; src/features/interview/engine.ts:251-278; src/features/portal/CaseReview.tsx:56-110` — commit `07fdbfe632d4`.

**Consequence.** A customer who withdraws an answer still sends the withdrawn health detail; the reviewer sees it under a label saying it was not asked. This defeats the orphan-answer requirement.

**Smallest remediation.** When visibility changes, delete records for newly hidden descendants recursively; do not serialise fields/details for not_asked; render no components for those rows.

**Acceptance test.** Parent flip test shows no hidden child fields in state, payload or portal, including nested branches.

#### F-04

**No submission idempotency; ambiguous retries duplicate cases**

- **Severity / status:** Medium / open
- **Classification:** Confirmed defect (static)
- **Verification:** Statically demonstrated; no HTTP load test run
- **Affected:** Submission reliability, duplicate cases
- **Launch gate:** 8
- **Launch impact:** Blocks launch for the delivery-reliability gate

**Issue.** Every POST inserts a new case; the only uniqueness is the server-generated reference, and a collision retries with a new reference. The client sends no idempotency token and has no abortable timeout.

**Observed.** A lost response after a successful insert, a client retry or two rapid submissions creates two cases. Reference uniqueness prevents collisions, not duplicate submissions.

**Evidence.** `supabase/functions/submit-case/index.ts:115-165; src/lib/api.ts:305-334` — commit `07fdbfe632d4`.

**Consequence.** The customer sees an error and retries after a timeout or tab close, producing duplicate cases and duplicate reviewer work.

**Smallest remediation.** Per-draft idempotency key created at review acknowledgement; unique index on cases(idempotency_key); replay returns the original receipt; abortable request with retry reusing the key.

**Acceptance test.** Concurrent and timed-out submissions create exactly one case and return the same reference.

#### F-05

**Notification retry can duplicate sends and has no row claiming**

- **Severity / status:** Medium / open
- **Classification:** Confirmed defect (static)
- **Verification:** Statically demonstrated
- **Affected:** Notification reliability, duplicate emails
- **Launch gate:** 8
- **Launch impact:** Blocks launch for the delivery-reliability gate

**Issue.** The function sends before updating notification status; the retry worker selects queued/failed rows without FOR UPDATE SKIP LOCKED, a lease or a claim state, and sends before updating.

**Observed.** A failed status update after provider acceptance leaves the row queued; the next retry sends again. Two overlapping cron invocations can both send the same row. The customer can be told 'accepted' even if the database write failed.

**Evidence.** `supabase/functions/submit-case/index.ts:166-190; supabase/functions/retry-case-notifications/index.ts:52-105` — commit `07fdbfe632d4`.

**Consequence.** Duplicate reviewer emails and disagreement between the confirmation, the database and the portal.

**Smallest remediation.** Provider idempotency key per case; claim rows with a lease/SKIP LOCKED; write 'sending' before the call; reconcile by provider message ID; make confirmation read the persisted row.

**Acceptance test.** Crash-after-accept and overlapping-worker scenarios produce exactly one email.

#### F-06

**Delivery webhook accepts replay/out-of-order events and can regress status**

- **Severity / status:** Medium / open
- **Classification:** Confirmed defect; shared-secret authentication is a documented limitation
- **Verification:** Statically demonstrated
- **Affected:** Notification evidence, delivery status
- **Launch gate:** 8
- **Launch impact:** Blocks launch for the delivery-evidence gate

**Issue.** email.sent and email.delivery_delayed map to accepted and email.delivered maps to delivered, with no event ID, timestamp tolerance or monotonic transition; a later email.sent can overwrite delivered.

**Observed.** Authentication is a directly compared shared secret, not provider signature verification over the raw body. A delayed duplicate can turn 'delivery confirmed' back into 'provider accepted'; a replayed event is accepted indefinitely.

**Evidence.** `supabase/functions/email-events/index.ts:27-40, 102-120` — commit `07fdbfe632d4`.

**Consequence.** The portal can display weaker or contradictory delivery evidence, and delivery claims are not trustworthy.

**Smallest remediation.** Verify the provider signature over the raw body with a timestamp tolerance; persist event IDs for dedupe; enforce state precedence with no downgrade from delivered; reconcile by message ID and case reference.

**Acceptance test.** Forged, replayed and out-of-order events cannot create or regress delivery evidence.

#### F-07

**Deployment configuration is absent from the repository**

- **Severity / status:** Medium / open
- **Classification:** Operational evidence missing / configuration gap
- **Verification:** Statically demonstrated; no supabase/config.toml tracked or present
- **Affected:** Deployability, public submission, scheduled retries
- **Launch gate:** Deployment prerequisite
- **Launch impact:** Blocks deployment and launch

**Issue.** README instructs verify_jwt = false for three machine-facing functions and says the flags stay in the repo, but no config.toml or retry schedule exists.

**Observed.** With the platform/CLI default, the public endpoint is JWT-protected, so anonymous submissions fail until the flag is set. The retry worker has no scheduler evidence.

**Evidence.** `README.md:222-234; LOVABLE.md; no supabase/config.toml` — commit `07fdbfe632d4`.

**Consequence.** A by-the-repo deployment fails at the first customer submission or leaves notifications permanently queued; 'not run live' cannot mean 'works live'.

**Smallest remediation.** Commit function configuration (JWT off only for the three machine-facing functions, on otherwise) and a documented retry schedule; verify a deployed 401 to 201 transition and one cron tick.

**Acceptance test.** A clean deployment accepts an anonymous non-customer submission and the retry worker runs on schedule.

#### F-08

**No adult/age or jurisdiction verification**

- **Severity / status:** Medium / open
- **Classification:** Confirmed defect / operational gate
- **Verification:** Static and browser; the lead form has no age field
- **Affected:** Eligibility, minor/third-party intake, lead validation
- **Launch gate:** 4
- **Launch impact:** Blocks launch unless the business accepts the risk in writing

**Issue.** Relationship is a constant 'self' with no age check at the lead step; the server accepts any 2-40 character state and treats relationship:self as proof of authority.

**Observed.** A minor or someone answering for another person can complete and submit; a fabricated state such as ZZ is stored. The date-of-birth question arrives inside the interview and is not used for an age gate.

**Evidence.** `supabase/functions/_shared/case.ts:228-260; src/features/intake/LeadForm.tsx` — commit `07fdbfe632d4`.

**Consequence.** The specification's initial-release boundary of an adult answering for themselves is a UI assertion, not a control.

**Smallest remediation.** Capture DOB or adult attestation plus DOB before health questions; compute age server-side; reject under-18 and non-self; validate state against the US list server-side.

**Acceptance test.** A 17-year-old fixture, a ZZ state and a third-party relationship payload are rejected.

#### F-09

**Held sensitive source questions are shown verbatim to customers**

- **Severity / status:** Medium / open
- **Classification:** Confirmed defect against stated intent
- **Verification:** Runtime reproduced in the browser
- **Affected:** Data minimisation, held-row presentation
- **Launch gate:** 1
- **Launch impact:** Blocks launch for the sensitive-question gate; small fix

**Issue.** The review screen expands 'Questions held for human review' and renders each held row's full source text, including HIV, suicide-attempt, immigration and visa-number wording.

**Observed.** A customer who had answered nothing saw the HIV, suicide-attempt, immigration and visa-number wording. The engine correctly excludes these from the interview, but they are presented.

**Evidence.** `src/features/intake/ReviewScreen.tsx:274-298; held rows ID-04, MED-11, MH-06, RES-04, RES-05` — commit `07fdbfe632d4`.

**Consequence.** The product surfaces sensitive content it says it withholds, and customers may believe those questions are part of the request.

**Smallest remediation.** Show a count and an internal reference or generic topics, not source text; keep the full list in the reviewer/coverage record.

**Acceptance test.** Held wording is absent from the customer DOM and from the public bundle under the chosen policy.

### Low

#### F-10

**Privacy acknowledgement records the wrong notice version**

- **Severity / status:** Low / open
- **Classification:** Confirmed defect
- **Verification:** Statically demonstrated
- **Affected:** Consent evidence, privacy notice traceability
- **Launch gate:** 5
- **Launch impact:** Nonblocking independently; fix with F-02

**Issue.** The privacy version displayed is 2026-10-a, but buildConsentRecords stamps both required records with CONSENT_VERSION 2026-10-b.

**Observed.** The stored privacy acknowledgement cannot prove which notice version was displayed.

**Evidence.** `src/features/consent/consentTexts.ts:18-21; src/features/intake/PermissionStep.tsx:86-88; src/features/consent/marketingConsent.ts:140-160` — commit `07fdbfe632d4`.

**Consequence.** The case record links the customer's acknowledgement to the wrong document version.

**Smallest remediation.** Add a per-purpose noticeVersion and stamp the privacy record with PRIVACY_PRACTICES_VERSION.

**Acceptance test.** The stored privacy record carries the displayed notice version.

#### F-11

**Body cap counts characters, not bytes, and is applied after reading when Content-Length is absent**

- **Severity / status:** Low / open
- **Classification:** Confirmed defect
- **Verification:** Statically demonstrated
- **Affected:** Abuse resistance, request handling
- **Launch gate:** 4
- **Launch impact:** Nonblocking hardening

**Issue.** MAX_BODY_BYTES is 512 KB, but after reading the whole body the check is raw.length > MAX_BODY_BYTES; Content-Length is checked first but can be absent or false.

**Observed.** A multibyte or chunked body can exceed 512 KiB while passing the character check; a large body without a header is fully read before rejection.

**Evidence.** `supabase/functions/submit-case/index.ts:70-91` — commit `07fdbfe632d4`.

**Consequence.** The stated limit is not what it says; platform limits bound the damage.

**Smallest remediation.** Measure TextEncoder byteLength or stream with a byte counter, and reject before full buffering where possible.

**Acceptance test.** A multibyte body above 512 KiB returns 413.

#### F-12

**Rate limiting is per-instance and keyed by a spoofable header**

- **Severity / status:** Low / open
- **Classification:** Documented limitation
- **Verification:** Statically demonstrated
- **Affected:** Anonymous abuse, spam
- **Launch gate:** 4
- **Launch impact:** Nonblocking at low volume with monitoring; relevant before public launch

**Issue.** The limiter is an in-process Map of 10 requests per 10 minutes, keyed by the first X-Forwarded-For value or cf-connecting-ip.

**Observed.** A caller can rotate the header or hit a fresh instance; the repository already says a durable limiter or WAF belongs in front.

**Evidence.** `supabase/functions/_shared/case.ts:506-535` — commit `07fdbfe632d4`.

**Consequence.** An attacker can fill the reviewer queue and cause operational load.

**Smallest remediation.** Durable or WAF rate limiting at the edge, keyed on trustworthy client identity; alert on submission volume.

**Acceptance test.** Header rotation and a second instance do not bypass the durable limit.

#### F-13

**not_sent cases are never retried**

- **Severity / status:** Low / open
- **Classification:** Confirmed defect / operational gap
- **Verification:** Statically demonstrated
- **Affected:** Notification recovery, operational completeness
- **Launch gate:** 8
- **Launch impact:** Nonblocking only if no real case is submitted before provider configuration; otherwise an operational blocker

**Issue.** The retry worker selects only queued and failed rows; sendCaseNotification returns not_sent when the provider or portal origin is missing, and those cases stay at attempts 0.

**Observed.** Cases submitted before provider configuration can never be notified by the worker. They remain visible in the portal, so data is not lost, but the reviewer may never be alerted.

**Evidence.** `supabase/functions/retry-case-notifications/index.ts:56-60; supabase/functions/_shared/email.ts:100-120` — commit `07fdbfe632d4`.

**Consequence.** Silent missed reviewer notifications.

**Smallest remediation.** Allow an operator re-notify action for not_sent, or include it in retry once a provider is configured, with an audit entry.

**Acceptance test.** A not_sent case can be re-queued and results in exactly one notification.

#### F-15

**Stale and misleading documentation and UI counts**

- **Severity / status:** Low / open
- **Classification:** Confirmed documentation defect
- **Verification:** Recomputed from the audited files
- **Affected:** Reviewer confidence, auditability, customer copy
- **Launch gate:** Documentation
- **Launch impact:** Nonblocking; fix before launch

**Issue.** Several counts and claims do not match the audited code: 56-row references, 76 'source questions', 31 unanswered items, and Not applicable listed as implemented though never rendered.

**Observed.** site.ts and reconciliation.ts say 56 rows while the bank has 92; the landing page labels 76 approved core rows as source questions while the inventory has 113 and 85 traced; README says no row collapses lookbacks although seven replace windows; README records 31 unanswered while fresh runs gave 72 empty and 54 sample; NOT_APPLICABLE_OPTION is defined but never rendered; privacy version mismatch; LOVABLE.md claims a config.toml that does not exist.

**Evidence.** `src/config/site.ts:66-70; src/features/interview/reconciliation.ts:1-3; src/pages/LandingPage.tsx:52-96; README.md:24, 345-349; src/features/interview/types.ts:57-61` — commit `07fdbfe632d4`.

**Consequence.** Reviewers and the owner can overstate coverage; customers see a misleading source-question count.

**Smallest remediation.** Generate counts from one source of truth; relabel the landing count as approved bank questions or show 113/85; remove 56; implement or remove the Not applicable claim; replace inherited walkthrough numbers with a dated test ledger.

**Acceptance test.** A generated count check passes and no stale count remains in customer or reviewer copy.

#### F-16

**Dependency and CI supply-chain exposure**

- **Severity / status:** Low / open
- **Classification:** Dependency exposure; no exploit demonstrated
- **Verification:** npm audit and workflow inspection
- **Affected:** Build/test toolchain, runtime exposure
- **Launch gate:** Build/supply chain
- **Launch impact:** Nonblocking

**Issue.** npm audit reports 4 advisories (3 moderate, 1 high): Vite 5.4.21 and react-router-dom 6.30.6. CI actions are pinned to tags and npm ci runs with lifecycle scripts enabled.

**Observed.** No app path was found that exposes the react-router advisories; Vite advisories primarily affect dev servers. CI grants only contents: read.

**Evidence.** `npm audit; .github/workflows/ci.yml:7-40` — commit `07fdbfe632d4`.

**Consequence.** Known advisories in the toolchain; a compromised action tag or install script is a supply-chain path.

**Smallest remediation.** Update Vite/react-router to patched releases, pin actions to commit SHAs, and consider npm ci --ignore-scripts if no dependency needs scripts.

**Acceptance test.** npm audit has no high advisory and CI actions are SHA-pinned.

#### F-17

**Deno dependencies are unpinned and there is no lockfile**

- **Severity / status:** Low / open
- **Classification:** Confirmed configuration gap
- **Verification:** Repository inspection
- **Affected:** Reproducible function tests/deployment
- **Launch gate:** Build/reproducibility
- **Launch impact:** Nonblocking

**Issue.** deno.json maps @supabase/supabase-js to npm:@supabase/supabase-js@2 (major range); tests import jsr:@std/assert@1; the documented command uses --no-lock and no deno.lock is tracked.

**Observed.** A future CI run or deployment can resolve different versions without a repository change.

**Evidence.** `supabase/functions/submit-case/deno.json; no tracked deno.lock` — commit `07fdbfe632d4`.

**Consequence.** An upstream break is invisible until it happens; builds are not reproducible.

**Smallest remediation.** Pin exact versions, commit deno.lock and run tests with the lockfile in CI.

**Acceptance test.** A clean CI run uses the committed lockfile and resolves the pinned versions.

### Informational

#### F-18

**Immutability trigger covers the payload but not all evidence metadata**

- **Severity / status:** Informational / open
- **Classification:** Confirmed narrow scope; no reviewer exploit
- **Verification:** Isolated database test
- **Affected:** Case integrity hardening
- **Launch gate:** 7
- **Launch impact:** Nonblocking hardening

**Issue.** The trigger protects payload, reference, submitted_at and questionnaire_version, but crisis_disclosure and residence_state are not protected and the service role can change them.

**Observed.** A privileged operator or a service-role bug could change the queue's crisis/residence flags without tripping the trigger. Reviewers cannot, because column grants block it.

**Evidence.** `supabase/migrations/0001_pre_underwriting.sql:112-132` — commit `07fdbfe632d4`.

**Consequence.** Derived evidence flags can diverge from the immutable snapshot without detection.

**Smallest remediation.** Include the derived evidence columns in the immutable set, or document why they are mutable; test with the service role.

**Acceptance test.** A service-role update to crisis_disclosure or residence_state is rejected or explicitly audited.

## Launch-gate snapshot

| # | Gate | Status | Approver | Evidence / remaining gap |
| ---: | --- | --- | --- | --- |
| 1 | Question coverage and sensitive restrictions | **FAIL** | Owner + counsel/underwriting | 113 source items inventoried and 113/113 match the PDF; 85 traced, 19 partial, 9 out of scope; 92 rows, 0 sourceVerified; 7 windows replaced, 11 wording changes. |
| 2 | Branch coverage and distinct timeframes | **PARTIAL** | Engineering + underwriting | 14 declarative branches and an unconditional crisis question work, but seven timeframe substitutions break fidelity and orphaned details persist. |
| 3 | Answer integrity (never invent No) | **PARTIAL** | Engineering | Yes/No/Unknown/Declined/Not asked/held/unresolved are distinct and blank becomes unresolved, but orphaned details survive and held rows can be submitted. |
| 4 | Review and explicit submission | **PARTIAL** | Engineering | Client invalidation and required acknowledgement work; server does not verify acknowledgement identity/version/freshness and submission is not idempotent. |
| 5 | Consent separation | **PARTIAL** | Engineering + counsel | Marketing is off by default and required permissions are enforced, but forged marketing/version evidence is accepted and the privacy version is wrong. |
| 6 | Recipient control | **PASS** | Engineering | Recipient is a server constant with an allowlist; notification contains only reference, UTC time and portal URL. Not exercised with a live provider. |
| 7 | Secure access | **PARTIAL** | Engineering/ops | 19/19 isolated PostgreSQL access checks pass; live Supabase RLS and enforced MFA are unverified. |
| 8 | Delivery reliability | **FAIL** | Engineering/ops | Store-before-send is correct, but no submission idempotency, no retry claiming, a duplicate-send window, and a webhook that can regress delivery state. |
| 9 | Leak prevention | **PARTIAL** | Engineering/ops | No analytics, storage, URL answers or answer content in email; held sensitive question text is shown to customers; live host logs and retention settings unreviewed. |
| 10 | Human review of consequential actions | **PASS** | Owner | No automated eligibility, rate or carrier action; reviewer actions logged; corrections append-only and attributed. Live reviewer access not tested. |

`PASS` means verified at this commit in the isolated environment, not live. Gate 6 and gate 10 are static passes; neither closes the live-evidence gaps below.

## Questionnaire status

- Source inventory: **113** items from the PDF (hash and extraction verified).
- Bank: **92** rows; **0** source-verified.
- Traced directly: **85**; partly collected: **19**; out of scope: **9**.
- Timeframe changed: **7** (AVO-01, RES-02, RES-03, MIL-01, MIL-03, MED-10, AVI-04); wording changed: **11**; split compounds: **3**; added by LPP: **9**; not in source: **2**.
- Held rows: **5** (ID-04, MED-11, MH-06, RES-04, RES-05). They are excluded from the interview but shown verbatim to customers (F-09) and accepted by a forged API payload (F-01).
- Rows requiring a named owner/counsel/underwriting decision: **37**; records carrying explicit flags: **29**.

**Never treat “all source questions acknowledged” as “all source questions collected”, or `reviewStatus: approved` as legal sign-off.** The full 113-item matrix is [`2026-10-27-questionnaire-matrix.md`](2026-10-27-questionnaire-matrix.md); the decision list is [`2026-10-27-reconciliation-decisions.md`](2026-10-27-reconciliation-decisions.md).

## Evidence gaps (not confirmed defects)

These do not increase the finding count. They are the checks the audit could not perform; absence of evidence is not proof of safety or breakage.

| ID | Area | Gap |
| --- | --- | --- |
| E-01 | Live Supabase | Migrations, RLS, grants and RPCs verified only in PGlite; no hosted project, schema state, migration history or manual SQL changes inspected. |
| E-02 | Deployed functions | verify_jwt, environment variables, origin allowlist, cron schedule, timeouts, memory and observed rate limiting not tested. |
| E-03 | Email delivery | No Resend key or mailbox access; provider acceptance, delivery, bounce/complaint handling, webhook signature compatibility, sender-domain authentication and inbox receipt unverified. |
| E-04 | Authentication/MFA | No live auth; MFA is an operational instruction, not an enforced application control; session expiry and cache behavior untested. |
| E-05 | Retention/backups/logs | No evidence of configured retention, deletion execution, backup retention, provider log retention, incident response or access audit beyond application tables. |
| E-06 | Deployment headers | CSP, cache rules and security headers not inspected because no host configuration is in the repository. |
| E-07 | Accessibility/mobile | Sampled DOM and focus behavior looked sound, but no screen-reader, keyboard-only full walkthrough, contrast measurement or mobile-device session. |
| E-08 | Legal | No current primary-law research; TCPA article is secondary; no TCPA or HIPAA compliance conclusion is made. |
| E-09 | Performance/load | No concurrency, soak or rate-limit evasion test against a deployed endpoint. |
| E-10 | Question semantics | The 55 matches_source verdicts were not independently re-approved word-by-word; material deviations were sampled and the full matrix is provided. |

## Verified controls that must not regress

- Required intake and privacy permissions are rejected when missing or declined; the real handler test passes 5/5.
- Anonymous and authenticated non-reviewer access is denied; 19/19 isolated PostgreSQL checks pass, and the snapshot/correction rules hold.
- The crisis question is visible and the crisis state is true after a history of No, Unknown or Declined.
- The notification recipient is a server constant; the email contains only reference, UTC time and portal URL — no answers, names or DOB.
- Preview mode is labelled and does not fake sign-in, sending or delivery; no analytics or browser storage of answers was found; no service-role key is in the bundle.

## Re-audit procedure

Revalidate every issue against the then-current commit; do not mark an issue fixed without a reproducing test or inspected configuration. Record fixed, still-open or regressed and preserve the original ID.

At the start of the next audit, resolve the current commit and compare it with the baseline above. For each issue, record one of: **fixed** (with the test or configuration inspected), **still open**, **regressed**, or **not re-tested** (with the reason). A code comment, README claim, build pass or dependency scan does not close an issue.

Minimum re-run set:

- git rev-parse HEAD; git status; compare with any supplied archive
- fresh PDF extraction vs sourceInventory; verify SHA-256 and all 113 items
- npm ci --ignore-scripts; typecheck; build; check:bank; test:consent
- Deno function tests with no production secrets
- adversarial validateDraft harness: held, invented ID, changed timeframe, consent, duplicate, chronology
- isolated PostgreSQL replay of both migrations plus anon/non-reviewer/reviewer RLS
- parent-flip orphan-answer scenario and submitted payload inspection
- submission idempotency, retry crash/overlap and webhook replay/out-of-order scenarios
- browser walkthrough for held text, preview labels, crisis after No/Unknown/Declined and a11y sampling

## Artifacts

| File | Role |
| --- | --- |
| [`2026-10-27-pre-underwriting-audit.md`](2026-10-27-pre-underwriting-audit.md) | Full audit report, traceability, test ledger and conditions |
| [`2026-10-27-questionnaire-matrix.md`](2026-10-27-questionnaire-matrix.md) | All 113 source items and 92 bank rows with verdicts and flags |
| [`2026-10-27-reconciliation-decisions.md`](2026-10-27-reconciliation-decisions.md) | 37 rows requiring a named owner/counsel/underwriting decision |
| [`2026-10-27-issue-register.md`](2026-10-27-issue-register.md) | Human-readable canonical issue list |
| [`2026-10-27-issue-register.csv`](2026-10-27-issue-register.csv) | Spreadsheet/tracker import |

Machine-readable copies: [`2026-10-27-issue-register.json`](2026-10-27-issue-register.json) and [`2026-10-27-issue-register.csv`](2026-10-27-issue-register.csv). The JSON is the source for the counts and tables in this file.
