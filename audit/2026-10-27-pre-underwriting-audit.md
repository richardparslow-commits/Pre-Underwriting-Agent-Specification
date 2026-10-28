# Life Policy Pilot — Pre-Underwriting Repository Audit

**Audit date:** 27 October 2026
**Repository:** `richardparslow-commits/Pre-Underwriting-Agent-Specification`
**Baseline commit:** `07fdbfe632d48ef363caac086e82b8c2f13277a2` (`main`, 27 Oct 2026 12:39 −05:00)
**Auditor:** one coding agent (Buffy), performing the requirements, application-security, QA/test and intake-workflow passes sequentially. No separate agents or external reviewers participated; nothing here is a legal certification.

**Preserved issue register:** [2026-10-27-issue-register.md](2026-10-27-issue-register.md) — 18 stable IDs, all `open` at this commit, with JSON and CSV copies for the next audit.

---

## 1. Verdict

**NOT READY to accept real customer health information.**

The local preview is a functional, unusually honest prototype: the workflow runs end to end, required permissions are enforced, RLS and case immutability hold in an isolated PostgreSQL replay, the crisis path is unconditional, the notification is minimal and the recipient is fixed server-side. Those are real, verified controls.

It is not ready for production for four independent reasons:

1. **The questionnaire is not approved and does not faithfully preserve several source questions.** Every one of the 92 bank rows is `sourceVerified: false`, yet 87 are already marked `reviewStatus: "approved"` and shown to customers. Seven rows replace a source window with a different one (for example *next 2 years* → *next 12 months*, *current active duty* → *ever served*, *current disability/confinement* → *past 5 years*), 19 source items are only partly collected and 9 are out of scope, with no named reviewer acceptance.
2. **The public submission endpoint trusts the client's questionnaire snapshot.** A forged request can submit invented question IDs and source wording, and can submit the deliberately held HIV and visa/green-card questions. The reviewer would see fabricated evidence in the case record.
3. **Consent evidence is client-asserted and unvalidated.** The endpoint accepts marketing consent for channels the product does not operate, substituted consent wording and versions, duplicate/unknown consent IDs, future-dated consents and an arbitrary acknowledgement ID. The browser tests prove the *builder* is correct, not that the server can be trusted.
4. **Submission and notification are not idempotent.** There is no submission key, no row claiming in the retry worker, and no reconciliation between provider acceptance and a failed status write, so duplicate cases and duplicate emails are possible. The delivery webhook can regress `delivered` back to `accepted` on an out-of-order event.

**Scope of this verdict:** the code and an isolated local environment. A live Supabase project, deployed functions, Resend delivery, MFA enforcement, mailbox ownership, backups and retention were not available and are explicitly unverified (§11). Absence of live evidence is not proof of safety or breakage.

**A narrower statement is supportable:** the repository is ready for a **labelled, non-customer preview/demo**, with the preview-only warnings kept on. It is not ready for real applicants.

---

## 2. Audit baseline

| Item | Value |
| --- | --- |
| Branch / commit | `main` at `07fdbfe632d48ef363caac086e82b8c2f13277a2` |
| Working tree | Clean at start; only an untracked audit harness (`.tmp/`) and the new `audit/` reports were added. No application or test file was modified. |
| Supplied repository archive | `Pre-Underwriting-Agent-Specification-main.zip`; archive comment is the same commit; `diff -r` against the working tree is empty. |
| Source questionnaire | `source/Detialed-Life-insurance-Questions.pdf`, 7 pages, SHA-256 `afe91d876f2c9e932302267ad10d0c46b774b4161efea8d0d2ffe71e3c82cca2` — matches `SOURCE_DOCUMENT` and the launch-gate document. |
| Owner specification | 9-page PDF, 22,600 extracted characters. |
| Duplicate specification | Second PDF has different file bytes but **identical extracted text** (same SHA-256 for the extracted text). It is a duplicate, not independent corroboration. |
| Developer handoff | 4-page PDF, 7,982 extracted characters. |
| TCPA background | 9-page PDF, 9,905 extracted characters. Used as secondary background only; current law was not re-researched or certified. |
| AI background | 28-page PDF, 74,890 extracted characters. Background requirements/rationale only. |
| Build tools | Node `v24.16.0`, npm `11.13.0`; Deno `2.9.6` fetched through `npx` for the committed function tests; PGlite for an isolated PostgreSQL replay. No Supabase CLI or project credentials. |
| Live environment | None in this workspace: no project ref, access token, `.env`, CLI login, deployed function or provider key. No live migration, email, SMS, call or customer record was touched. |
| Out of scope | Carrier quoting, rate classes, legal applicability decisions, deployed infrastructure, provider account configuration, mailbox access. |

**Sources inspected:** the five owner PDFs, `README.md`, `LOVABLE.md`, `.env.example`, `.gitignore`, `package.json`/lockfile, `vite.config.ts`, CI workflow, both migrations, all three edge functions and shared helpers, the committed function tests, `src/config/*`, consent modules, `src/lib/api.ts`, types, engine, state machine, question bank, source inventory, reconciliation and validation, intake/review/confirmation/permission/question components, crisis panel, status timeline, portal auth, queue and case view, and the launch-gate and reconciliation documents.

The owner specification describes a **proposed** implementation, not an operating service, and the handoff states "Requirements only. No live website, email sender, secure storage, or mailbox integration has been configured or tested." No legal or clinical approval exists in the repository. `writer` comments and documentation are evidence, not instructions; no embedded text in the PDFs or repository changed the audit method.

---

## 3. Architecture and trust boundaries

**Intended flow:** introduction → lead form (privacy acknowledgement) → intake permission → source-based interview with conditional follow-ups → review/correction → explicit `Submit for Richard's Review` → `submit-case` → immutable `cases` row → Resend notification → authenticated reviewer portal → append-only review log and corrections.

**Trust boundaries:**

| Boundary | Client-authored | Server-authoritative |
| --- | --- | --- |
| Lead and answers | All names, contact data, answer states, question IDs, source text, timeframes, `reviewStatus`, flags, crisis boolean, consent records, acknowledgement text and timestamps | Nothing is re-derived from an approved bank. `submit-case` validates shapes, lengths and a few cross-field rules, then stores the draft essentially as sent ([case.ts:226-441](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/_shared/case.ts#L226-L441)). |
| Case reference and submission time | — | Generated in the function (`generateReference`, `submittedAt`). |
| Notification recipient, subject, portal URL | — | Constants/allowlist and `APP_ORIGIN` in `_shared/email.ts` and `submit-case` ([email.ts:25-90](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/_shared/email.ts#L25-L90)). |
| Case workflow status | — | Reviewer RPC; only `status` is column-granted, and the immutability trigger blocks snapshot edits ([0001:112-156](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/migrations/0001_pre_underwriting.sql#L112-L156)). |
| Corrections | — | Append-only `case_corrections`, insert only through a reviewer-checked RPC ([0002:36-81](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/migrations/0002_case_corrections.sql#L36-L81)). |
| Reviewer identity | — | Supabase session plus `public.reviewers` allowlist; `is_reviewer()` is `SECURITY DEFINER` with a fixed search path. |

**Sensitive-data destinations:** browser memory only (no storage/analytics); `submit-case` request body; PostgreSQL `cases.payload` and `case_corrections.detail`; reviewer portal responses; Resend metadata (reference tag, timestamps, portal URL — no answers); function logs (status codes only). Preview mode keeps cases in an in-memory `Map` in the tab and does not persist.

**Preview vs live:** preview is the default whenever `VITE_APP_MODE !== "live"` **or** either Supabase value is missing ([site.ts:78-85](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/config/site.ts#L78-L85)). The UI labels this consistently: landing badge, portal warning, confirmation "Preview build" panel and an honest `not_sent` timeline. There is no silent fake login or fake delivery.

---

## 4. Prioritized findings

No **Critical** finding was established. The High findings are production blockers for real health data.

### F-01 — Public submission accepts a fabricated questionnaire snapshot (High)

- **Affected:** questionnaire fidelity, reviewer evidence, held/sensitive data, gate 1/4/7.
- **Classification:** confirmed defect. **Verification:** runtime reproduced against the real `validateDraft` ([case.ts:226-441](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/_shared/case.ts#L226-L441)); storage path statically demonstrated (the handler inserts the validated draft unchanged, [submit-case:115-155](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/submit-case/index.ts#L115-L155)).
- **Prerequisite:** a direct HTTP POST to the public function with an allowed `Origin` (the origin is a CORS check, not authentication). No account or reviewer access is needed.
- **Description:** the endpoint checks answer shape, section membership, disposition vocabulary, timestamps and duplicate IDs, but never checks the question against the approved bank. It accepts any `questionId`, any `sourceRef`/`sourceText`/`customerText`/`timeframe`, and both `reviewStatus` values.
- **Observed:** an isolated harness submitted, with fictitious data:
  - `MED-11` (HIV/AIDS, held) with `reviewStatus: "approved"` — **accepted**;
  - `RES-05` (visa/green-card number, held) with `reviewStatus: "human_review_required"` and an answer — **accepted**;
  - `INVENTED-99` with invented source wording and `Past 99 years` — **accepted**;
  - a zero-answer submission — **accepted**, with no partial-submission marker in the payload.
  Rejections that did hold: duplicate question ID, 401 answers, marketing consent without a phone, `relationship !== "self"`.
- **Consequence:** anyone can place fabricated “source” questions, altered timeframes or held sensitive answers into the immutable case record. A reviewer reading “source text” cannot tell it was never approved, and the product’s promise that held items are never collected is false at the API.
- **Smallest remediation:** ship a server-side canonical bank (or a compiled allowlist) with the function; rebuild `sourceText`, `timeframe`, `status` and `reviewStatus` from it; reject unknown IDs, mismatches, held rows and acknowledgements that are not the current submission acknowledgement. Regression test: crafted `MED-11`/`INVENTED-99`/changed-timeframe payloads → 422 and no row.
- **Blocks launch:** **yes** — reviewer evidence cannot be trusted and held data can be collected.

### F-02 — Consent evidence is client-asserted and not validated server-side (High)

- **Affected:** consent separation, TCPA evidence, privacy acknowledgement, gate 5.
- **Classification:** confirmed defect; marketing-specific part is also a pre-enable gate. **Verification:** runtime reproduced against `validateDraft`; client-side builder tests pass.
- **Prerequisite:** the same anonymous POST; a phone value is needed only for a marketing grant.
- **Description:** the server requires an `intake_permission` and a `privacy_acknowledgement` consent object with `granted: true`, but trusts their `label`, `text`, `textVersion`, `grantedAt` and any additional records. It has no notion of enabled channels or a configured seller, and does not tie the acknowledgement to a known ID/version. See [case.ts:283-330](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/_shared/case.ts#L283-L330) and [case.ts:409-423](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/_shared/case.ts#L409-L423).
- **Observed:** the endpoint **accepted**:
  - `marketing_call` and `marketing_text` granted with a phone, while this build has no marketing channel or seller configured;
  - `textVersion: "1999-01-a"` with entirely different wording;
  - a duplicate `privacy_acknowledgement` and an unknown `unexpected_consent`;
  - `grantedAt` in 2027 while `completedAt` is before `startedAt`;
  - acknowledgement id `not_the_submission_acknowledgement`, version `"0"`, future timestamp.
  It **rejected** marketing consent without a phone — the one cross-field rule that exists.
- **Consequence:** the case can contain evidence that the customer never saw the disclosed wording, or that they consented to a channel the business does not operate. That is a false evidentiary record and, once a channel is enabled, a TCPA exposure. Even with channels off, the required privacy acknowledgement can be fabricated with arbitrary text.
- **Smallest remediation:** server constants for consent IDs, versions and wording hashes; a server-owned channel/seller configuration; reject unknown or duplicate IDs and any version/wording mismatch; require the current submission-acknowledgement ID/version; store both the client-asserted time and the server receipt time. Regression tests for each forged case above.
- **Blocks launch:** **yes** for real data; independently **yes** for enabling marketing.

### F-03 — Branch-closed details survive into the submitted record (Medium)

- **Affected:** answer integrity, branch behaviour, reviewer view, gate 2/3.
- **Classification:** confirmed defect. **Verification:** runtime reproduced with the real engine; portal rendering statically confirmed.
- **Prerequisite:** a customer answers a parent Yes, enters child details, then changes the parent to a non-trigger answer (normal navigation, no attacker needed).
- **Description:** `setAnswer` clears acknowledgements but does not clear child answers when a parent changes ([useInterview.ts:150-160](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/interview/useInterview.ts#L150-L160)). `toSubmittedAnswers` emits `fields` and `details` for every question, including rows whose disposition is `not_asked` ([engine.ts:251-278](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/interview/engine.ts#L251-L278)). The portal renders those components regardless of disposition ([CaseReview.tsx:56-110](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/portal/CaseReview.tsx#L56-L110)).
- **Observed:** with `MH-01 = yes` and four `MH-02` fields (depression, 2018, therapy, ongoing), then changing `MH-01` to `no`, `MH-02` becomes `disposition: not_asked` / “Not asked — branch not applicable” but its four health details remain attached and are rendered under the not-asked row.
- **Consequence:** a customer who withdraws an answer still sends the withdrawn health detail; the reviewer sees it under a label saying it was not asked. This defeats the specification’s orphan-answer test and is a privacy/staleness defect.
- **Smallest remediation:** when visibility changes, delete records for newly hidden descendants (recursively); do not serialise `fields`/`details` for `not_asked`; test parent flip, nested branches and a submission payload.
- **Blocks launch:** **yes** for the answer-integrity gate; at minimum fix before real data.

### F-04 — No submission idempotency; ambiguous retries duplicate cases (Medium)

- **Affected:** submission reliability, duplicate cases, gate 8.
- **Classification:** confirmed defect (static). **Verification:** statically demonstrated; no HTTP load test was run.
- **Prerequisite:** a lost response after a successful insert, a client retry, or two rapid submissions.
- **Description:** every POST inserts a new case; the only uniqueness is the server-generated reference, and a `23505` retries a *new* reference ([submit-case:115-165](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/submit-case/index.ts#L115-L165)). The client sends no idempotency token and has no request timeout/abort ([api.ts:305-334](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/lib/api.ts#L305-L334)).
- **Consequence:** if the case is written but the response is lost (tab closed, network timeout, proxy error), the customer sees an error and retries: two cases. The same happens on rapid duplicate requests. Reference uniqueness only prevents reference collisions, not duplicate submissions.
- **Smallest remediation:** per-draft idempotency key (created once when the review is acknowledged), unique index on `cases(idempotency_key)`, return the existing receipt on replay; add an abortable request and a retry that reuses the key. Test simultaneous and timed-out submissions.
- **Blocks launch:** **yes** for the delivery-reliability gate.

### F-05 — Notification retry can duplicate sends and has no row claiming (Medium)

- **Affected:** notification reliability, duplicate emails, gate 8.
- **Classification:** confirmed defect (static). **Verification:** statically demonstrated.
- **Prerequisite:** a failed status update after a successful provider call, or two overlapping retry invocations.
- **Description:** after insertion the function sends, then updates the row by reference; if that update fails, the row remains `queued` and the retry worker will send again ([submit-case:166-190](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/submit-case/index.ts#L166-L190)). The worker selects `queued|failed` rows without `FOR UPDATE SKIP LOCKED`, a lease or a claim state, and sends before updating ([retry:52-105](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/retry-case-notifications/index.ts#L52-L105)).
- **Consequence:** a crash after provider acceptance but before the status write produces a second email two minutes later; two overlapping cron invocations can both send the same row. Conversely, the response to the customer reports `accepted` even if the database write failed, so the confirmation and the portal can disagree.
- **Smallest remediation:** provider idempotency key per case; claim rows with a lease/`SKIP LOCKED`; write `sending` before the call; reconcile by provider message ID; make the confirmation read from the persisted row. Test crash-after-accept and overlapping workers.
- **Blocks launch:** **yes** for the delivery-reliability gate.

### F-06 — Delivery webhook accepts replay/out-of-order events and can regress status (Medium)

- **Affected:** notification evidence, gate 8.
- **Classification:** confirmed defect; shared-secret authentication is a documented limitation. **Verification:** statically demonstrated.
- **Description:** `email.sent` and `email.delivery_delayed` map to `accepted`, `email.delivered` to `delivered`, with no event ID, timestamp tolerance or monotonic transition; any later `email.sent` overwrites `delivered` ([email-events.ts:27-40](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/email-events/index.ts#L27-L40), [102-120](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/email-events/index.ts#L102-L120)). Authentication is a shared secret compared directly, not a provider signature; there is no raw-body verification or replay window.
- **Consequence:** a delayed duplicate can turn “delivery confirmed” back into “provider accepted”, and a replayed event is accepted indefinitely. The portal can display weaker or contradictory delivery evidence.
- **Smallest remediation:** verify the provider signature over the raw body with a timestamp tolerance; persist event IDs for dedupe; enforce state precedence (never downgrade `delivered`); reconcile by message ID and case reference; test forged/replayed/out-of-order events.
- **Blocks launch:** **yes** for the delivery-evidence gate.

### F-07 — Deployment configuration is absent from the repository (Medium)

- **Affected:** deployability, public submission, scheduled retries.
- **Classification:** operational evidence missing / configuration gap. **Verification:** statically demonstrated (no `supabase/config.toml` tracked or present).
- **Description:** the README instructs the operator to set `verify_jwt = false` for `submit-case`, `email-events` and `retry-case-notifications` ([README:222-234](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/README.md#L222-L234)), and `LOVABLE.md` says to keep those flags in the repo, but there is no `supabase/config.toml` and no cron/schedule definition. With the platform/CLI default, the public endpoint is JWT-protected, so anonymous submissions fail until the flag is set. The retry function has no scheduler evidence at all.
- **Consequence:** a by-the-repo deployment fails at the first customer submission or leaves notifications permanently queued. This is why “not run live” cannot be treated as “works live”.
- **Smallest remediation:** commit the function configuration (JWT off for the three machine-facing functions, on for anything else) and a documented schedule for the retry worker; verify a deployed 401→201 transition and one cron tick. Do not enable JWT-off without the origin/rate controls.
- **Blocks launch:** **yes** for deployment.

### F-08 — No adult/age or jurisdiction verification (Medium)

- **Affected:** eligibility, minor/third-party intake, lead validation, gate 4.
- **Classification:** confirmed defect / operational gate. **Verification:** static and browser (the lead form has no age field).
- **Description:** the lead form collects names, state, email and contact preference; `relationship` is a constant `"self"` and no date of birth is checked there. The server accepts `relationship: "self"` as proof and accepts any 2–40-character state value ([case.ts:228-260](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/_shared/case.ts#L228-L260)). The DOB question arrives inside the interview and is not used for an age gate.
- **Consequence:** a minor, or someone answering for another person, can complete the interview and submit; a fabricated `ZZ` state is stored. The specification’s initial-release boundary (“an adult answering for themselves”) is a UI assertion, not a control.
- **Smallest remediation:** capture DOB (or an adult attestation plus DOB) before health questions, compute age server-side, reject under-18 and non-self relationships; validate state against the US list server-side; test a forged request and a 17-year-old fixture.
- **Blocks launch:** **yes** until the business accepts the risk in writing; otherwise a code gate.

### F-09 — Held sensitive source questions are shown verbatim to customers (Medium)

- **Affected:** data minimisation, held-row presentation, gate 1.
- **Classification:** confirmed defect against the stated intent. **Verification:** runtime reproduced in the browser.
- **Description:** the review screen expands “Questions held for human review” and renders each held row's full `sourceText` ([ReviewScreen.tsx:274-298](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/intake/ReviewScreen.tsx#L274-L298)). The held rows include `ID-04` (sex/gender), `MED-11` (HIV/AIDS), `MH-06` (suicide-attempt details), `RES-04` (immigration status) and `RES-05` (visa/green-card number).
- **Observed:** the browser showed the HIV, suicide-attempt, immigration and visa-number wording to a customer who had answered nothing. They are not *asked*, and the engine correctly excludes them from the interview, but they are presented.
- **Consequence:** the product surfaces the sensitive content it says it withholds, and a customer may believe these questions are part of the request. It also puts identity-document-adjacent wording in front of every visitor.
- **Smallest remediation:** show the count and an internal-only reference, or generic topic labels, not the source text; keep the full list in the reviewer/coverage record. Test that held text is absent from customer DOM and from the public bundle if that is the chosen policy.
- **Blocks launch:** **yes** for the sensitive-question gate; it is a small fix.

### F-10 — Privacy acknowledgement records the wrong notice version (Low)

- **Affected:** consent evidence, privacy notice traceability, gate 5.
- **Classification:** confirmed defect. **Verification:** statically demonstrated.
- **Description:** `PRIVACY_PRACTICES_VERSION` is `2026-10-a` and is displayed as the privacy version ([consentTexts.ts:18-21](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/consent/consentTexts.ts#L18-L21), [PermissionStep:86-88](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/intake/PermissionStep.tsx#L86-L88)), but `buildConsentRecords` stamps both required records with `CONSENT_VERSION` (`2026-10-b`) ([marketingConsent.ts:140-160](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/consent/marketingConsent.ts#L140-L160)).
- **Consequence:** the case cannot prove which privacy notice version the customer acknowledged; the stored version is a different document's version.
- **Smallest remediation:** add a per-purpose version (or `noticeVersion`) and stamp the privacy record with `PRIVACY_PRACTICES_VERSION`; test the stored record.
- **Blocks launch:** no independently, but should be fixed with F-02.

### F-11 — Body cap counts characters, not bytes, and is applied after reading when Content-Length is absent (Low)

- **Affected:** abuse resistance, request handling, gate 4.
- **Classification:** confirmed defect. **Verification:** statically demonstrated.
- **Description:** `MAX_BODY_BYTES` is 512 KB, but after reading the whole body the check is `raw.length > MAX_BODY_BYTES` ([submit-case:70-91](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/submit-case/index.ts#L70-L91)). `Content-Length` is checked first, but can be absent or false; `req.text()` allocates the full body before the fallback check.
- **Consequence:** a multi-byte/chunked body can exceed 512 KiB of memory/transmission while passing the character check; a large body without a header is fully read first. The platform's own limits bound the damage, but the stated control is not what it says.
- **Smallest remediation:** measure `new TextEncoder().encode(raw).byteLength` (or stream with a byte counter), and reject before full buffering where possible; test multibyte and chunked bodies.
- **Blocks launch:** no; hardening.

### F-12 — Rate limiting is per-instance and keyed by a spoofable header (Low)

- **Affected:** anonymous abuse, spam, gate 4.
- **Classification:** documented limitation. **Verification:** statically demonstrated.
- **Description:** the limiter is an in-process `Map`, 10 requests per 10 minutes, keyed by the first `X-Forwarded-For` value or `cf-connecting-ip` ([case.ts:506-535](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/_shared/case.ts#L506-L535)). A caller can rotate the header or hit a fresh instance.
- **Consequence:** an attacker can create many cases, fill the reviewer queue and cause operational load. The code comments and README already say a durable limiter/WAF belongs in front; this is not a hidden defect.
- **Smallest remediation:** durable/WAF rate limiting at the edge, keyed on a trustworthy client identity; alert on submission volume. Test across instances.
- **Blocks launch:** no, provided volume is low and monitored; relevant before public launch.

### F-13 — `not_sent` cases are never retried (Low)

- **Affected:** notification recovery, operational completeness.
- **Classification:** confirmed defect/operational gap. **Verification:** statically demonstrated.
- **Description:** the retry worker only selects `queued` and `failed` ([retry:56-60](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/retry-case-notifications/index.ts#L56-L60)). `sendCaseNotification` returns `not_sent` when the provider or portal origin is missing ([email.ts:100-120](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/_shared/email.ts#L100-L120)); the case is stored with `notification_state = not_sent` and attempts 0.
- **Consequence:** cases submitted before the provider is configured can never be notified by the worker. They remain visible in the portal, so the case is not lost, but the reviewer may never be alerted.
- **Smallest remediation:** allow an operator re-notify action for `not_sent` (or include it in retry once a provider is configured), with an audit entry; test.
- **Blocks launch:** no if no real submissions occur before provider setup; otherwise yes operationally.

### F-14 — The questionnaire does not preserve seven source windows and has no approved row (High)

- **Affected:** requirements fidelity, gate 1/2, legal/underwriting approval.
- **Classification:** confirmed deviation plus legal/counsel decision missing. **Verification:** data and code at the audited commit; the reconciliation records themselves state the differences.
- **Description:** `reviewStatus: "approved"` only means “ask this row”; `sourceVerified` is the real approval and is `false` on all 92 rows ([types.ts:127-140](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/interview/types.ts#L127-L140)). Seven rows are `timeframe_changed`, 11 `wording_changed`, 19 source items only partly collected and 9 out of scope. Material examples, all with reproduced citations in the appendix:
  - **AVO-01** — source `SRC-055` asks past **2 years** *or next 2 years intended*, including parachuting, hang gliding, rodeo and professional sport; the bank asks past **5 years**, omits those four activities and the future-intention limb ([questionBank.ts:1108](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/interview/questionBank.ts#L1108)).
  - **RES-03** — source asks next **2 years / 24 months**, with 30-day trip and 180-day residence thresholds and named countries; the bank asks next **12 months** with no thresholds/countries ([questionBank.ts:1799](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/interview/questionBank.ts#L1799)).
  - **MIL-01** — source asks about **current active duty**; the bank asks **ever served**, changing the population and every downstream branch ([questionBank.ts:1920](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/interview/questionBank.ts#L1920)).
  - **MED-10** — source asks about **current** medical unemployment, hospitalization, nursing facility, hospice, home health and ADLs; the bank asks about the **past 5 years** and merges the limbs ([questionBank.ts:603](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/interview/questionBank.ts#L603)).
  - **AVI-04** — next **2 years** → next **12 months**; **RES-02** — “lived consistently in the USA for 5 years” plus 2-year travel detail replaced by “lived outside the USA for a month or more in 5 years”; **MIL-03** — current deployment/orders and countries → past 12 months ([questionBank.ts:1080](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/interview/questionBank.ts#L1080), [1773](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/interview/questionBank.ts#L1773), [1960](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/interview/questionBank.ts#L1960)).
  The 9 out-of-scope items include the 5-year check-up/lab question (`SRC-010`), mental-health treatment details (`SRC-032`, `SRC-033`), climbing bolt protection (`SRC-059`), racing track (`SRC-062`), last race date (`SRC-064`), diving equipment/locations (`SRC-067`, `SRC-068`) and club membership (`SRC-070`). Each has a written reason, but no named reviewer accepted it.
- **Consequence:** customers are asked different questions from the controlled source, including narrower future-travel and wider past-avocation windows. The reviewer package labels these as source questions; the specification explicitly forbids silently changing a window or dropping a compound limb. Without a named approval, there is no defensible questionnaire version.
- **Smallest remediation:** owner/counsel/underwriting decision per flagged row; restore the source window or record an approved deviation with name/date; set `sourceVerified: true` only then; bump the questionnaire version and regenerate the report. Acceptance: `check:bank` plus a signed table, and branch tests for the restored rows.
- **Blocks launch:** **yes** — this is the primary launch blocker.

### F-15 — Stale and misleading documentation/UI counts (Low)

- **Affected:** reviewer confidence, auditability, customer copy.
- **Classification:** confirmed documentation defect. **Verification:** recomputed from the audited files.
- **Contradictions:**
  - `site.ts` says “sourceVerified is false on all **56** rows” ([site.ts:66-70](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/config/site.ts#L66-L70)); `reconciliation.ts` calls it the “**56-row** question bank” ([reconciliation.ts:1-3](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/interview/reconciliation.ts#L1-L3)); the bank has **92** rows.
  - The landing page labels a count of **76** as “Source questions” ([LandingPage.tsx:52-96](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/pages/LandingPage.tsx#L52-L96)); it is actually approved *core* bank rows, while the source inventory has **113** items and 85 are traced. “Source questions” overstates coverage and confuses rows with source items.
  - README says “no row collapses lookbacks” ([README:24](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/README.md#L24)); true only in the narrow “no merge” sense — seven rows **replace** a window, which the launch gates admit.
  - README's inherited browser walkthrough records “31 unanswered items” ([README:345-349](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/README.md#L345-L349)); a fresh empty interview now has 72 unanswered and the sample case 54, so the number is time/branch-dependent and should not be presented as evidence.
  - `NOT_APPLICABLE_OPTION` is defined ([types.ts:57-61](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/src/features/interview/types.ts#L57-L61)) but never rendered; the README lists “Not applicable” among implemented answer states.
  - The privacy notice version mismatch in F-10.
  - `LOVABLE.md` says the `config.toml` flags stay in the repo; none exists (F-07).
- **Consequence:** reviewers and the owner can overstate coverage, and a customer sees a misleading “source questions” count. The gate document is more honest than the surrounding copy but still inherits point-in-time numbers.
- **Smallest remediation:** generate counts from one source of truth; relabel the landing count as “approved bank questions (core)” or show 113/85; remove stale “56”; correct the N/A claim or implement the option; replace inherited walkthrough numbers with a dated test ledger.

### F-16 — Dependency and CI supply-chain exposure (Low)

- **Affected:** build/test toolchain, runtime exposure.
- **Classification:** dependency exposure; no exploit demonstrated. **Verification:** `npm audit` and workflow inspection.
- **Evidence:** `npm audit` reports 4 advisories: 3 moderate, 1 high. The high is **Vite 5.4.21** (dev/build tool; path traversal and other dev-server advisories); direct runtime **react-router-dom 6.30.6** has moderate open-redirect/constructor-injection advisories via `react-router`. `npm ci` completes. CI pins `actions/checkout@v4`, `actions/setup-node@v4`, `denoland/setup-deno@v2` to tags, runs `npm ci` **with lifecycle scripts enabled**, and grants only `contents: read` ([ci.yml:7-40](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/.github/workflows/ci.yml#L7-L40)).
- **Consequence:** known advisories in the toolchain; a compromised action tag or dependency install script is a supply-chain path. No app path was found that exposes the react-router advisories (navigation targets are internal constants/server references), and the Vite advisories primarily affect dev servers.
- **Smallest remediation:** update Vite/react-router to patched releases (verify build and routing), pin actions to commit SHAs, and consider `npm ci --ignore-scripts` in CI if no dependency needs scripts. Do not run `npm audit fix --force` blindly.
- **Blocks launch:** no.

### F-17 — Deno dependencies are unpinned and there is no lockfile (Low)

- **Affected:** reproducible function tests/deployment.
- **Classification:** confirmed configuration gap. **Verification:** repository inspection.
- **Evidence:** `supabase/functions/submit-case/deno.json` maps `@supabase/supabase-js` to `npm:@supabase/supabase-js@2` (major range); tests import `jsr:@std/assert@1`; the documented command uses `--no-lock`; no `deno.lock` is tracked ([deno.json](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/functions/submit-case/deno.json)).
- **Consequence:** a future CI run or deployment can resolve different dependency versions without any repository change; an upstream break is invisible until it happens.
- **Smallest remediation:** pin exact versions, commit `deno.lock`, and run tests with the lockfile in CI; document any exception.

### F-18 — Immutability trigger covers the payload but not all evidence metadata (Informational)

- **Affected:** case integrity hardening.
- **Classification:** confirmed narrow scope; no reviewer exploit. **Verification:** isolated database test.
- **Evidence:** the trigger protects `payload`, `reference`, `submitted_at` and `questionnaire_version` ([0001:112-132](https://github.com/richardparslow-commits/Pre-Underwriting-Agent-Specification/blob/07fdbfe632d48ef363caac086e82b8c2f13277a2/supabase/migrations/0001_pre_underwriting.sql#L112-L132)). `crisis_disclosure` and `residence_state` are not protected, and the service role can change them (the service role bypasses RLS; the trigger does not compare them).
- **Consequence:** a privileged operator or a bug in service-role code could change the queue's crisis/residence flags without tripping the trigger. Reviewers cannot (column grants block it). This is a hardening gap, not an external vulnerability.
- **Smallest remediation:** include the derived evidence columns in the trigger's immutable set, or document why they are mutable; test with the service role.

---

## 5. Requirements and launch-gate matrix

Status definitions: **PASS** = verified at this commit in the isolated environment; **PARTIAL** = implemented with a material gap or missing evidence; **FAIL** = the required control is not met; **NOT VERIFIED** = no available environment.

| # | Gate | Status | Evidence and remaining gap | Approver |
| --- | --- | --- | --- | --- |
| 1 | Question coverage and sensitive restrictions | **FAIL** | 113 source items inventoried and 113/113 match the PDF after typographic normalisation; 85 traced, 19 partial, 9 out of scope with reasons; 92 rows, 0 `sourceVerified`; 7 windows replaced, 11 wording changes. Customers are asked rows that are not approved. | Owner + counsel/underwriting |
| 2 | Branch coverage and distinct timeframes | **PARTIAL** | 14 declarative branches; engine check: parent flip closes the child and crisis question is unconditional. But the seven timeframe substitutions break distinct-window fidelity, no automated branch tests exist in the repo, and orphaned details persist (F-03). | Engineering + underwriting |
| 3 | Answer integrity (never invent “No”) | **PARTIAL** | Yes/No/Unknown/Declined/Not asked/held/unresolved are distinct in engine and payload; blank → `unresolved`; no fabricated “No” observed. Failed by retained orphan details and held-question acceptance. | Engineering |
| 4 | Review and explicit submission | **PARTIAL** | Client invalidates the acknowledgement on edits, disables submit until ticked, and requires an explicit action; the server rejects a draft without an acknowledgement. But it does not verify the acknowledgement ID/version/freshness, and there is no submission idempotency. | Engineering |
| 5 | Consent separation | **PARTIAL** | Marketing is off in the default build; builder tests prove no record for disabled channels/placeholder seller; intake and privacy permissions are required by the server; 5 handler tests pass. Failed by forged marketing consent and substituted versions (F-02), and the privacy version mismatch (F-10). | Engineering + counsel |
| 6 | Recipient control | **PASS** (static) | Recipient is a server constant with an allowlist; browser and model cannot set it; notification contains only reference, UTC time and portal URL; no answer text. Not exercised with a live provider. | Engineering |
| 7 | Secure access (forwarded mail grants nothing) | **PARTIAL** | Isolated PostgreSQL: 19/19 checks — anon denied, non-reviewer sees zero rows and cannot call RPCs, reviewer sees the case, correction attributed, immutability holds. Live Supabase RLS/MFA not tested; MFA is an operational instruction, not enforced in code. | Engineering/ops |
| 8 | Delivery reliability | **FAIL** | Store-before-send is correct and states are separated, but no idempotency, no row claiming, duplicate window after provider acceptance, webhook replay/regression, no live provider test. | Engineering/ops |
| 9 | Leak prevention | **PARTIAL** | No analytics, storage, URL answers, console payloads or answer content in email; bundle has no service-role key; repository has no tracked secrets. Held sensitive *question text* is shown to customers (F-09); live host/provider logs and retention settings unreviewed. | Engineering/ops |
| 10 | Human review of consequential actions | **PASS** (static) | No eligibility/rate/carrier action exists; reviewer actions are logged; corrections are append-only and reviewer-attributed; no automated decision. Live reviewer access not tested. | Owner |

The repository’s own `docs/LAUNCH-GATES.md` is broadly honest, but “Partly” for gate 1 understates that customers are currently asked non-approved wording. Gate 5’s “Partly” is accurate; gate 8’s “Not run against a live provider” is accurate and remains a blocker.

---

## 6. Questionnaire fidelity

**Recomputed totals (not inherited):**

- Source PDF: 7 pages, SHA-256 matches the committed inventory, 113 bullets. A fresh extraction produced 113 bullets; every one of the 113 inventory entries matches the PDF after normalising the reader's bullet glyphs, a line-break hyphen in “lighter-than-air”, section headings and whitespace. No missing or extra source question was found.
- Bank: **92 rows** — 87 approved-for-interview, 5 held, 14 branching, 11 supplemental, **0 sourceVerified**.
- Coverage: **85** source items traced directly; **28** recorded gaps — 19 partly collected (`merge_into`) and 9 out of scope; 0 “collected nowhere”.
- Reconciliation: 92 records, **29 with flags**. Verdicts: 55 `matches_source`, 3 `split_source_compound`, 11 `wording_changed`, 7 `timeframe_changed`, 9 `added_by_lpp`, 2 `not_in_source`, 5 `held_for_review`.
- Distinctions that must not be collapsed:
  - **Inventoried:** all 113.
  - **Mapped to a row:** 85 directly; 19 partly via a target row.
  - **Fully and accurately collected:** only the 55 `matches_source` rows plus the 3 split rows are claimed to follow the source; 58 of 92.
  - **Actually approved for customer collection:** **0** — `sourceVerified` is false everywhere, regardless of `reviewStatus: "approved"`.

The full per-source matrix (all 113, no truncation) is in [2026-10-27-questionnaire-matrix.md](2026-10-27-questionnaire-matrix.md), including each mapped row, verdict, bank wording/timeframe, flags and required decision. The reviewer-action detail is in [2026-10-27-reconciliation-decisions.md](2026-10-27-reconciliation-decisions.md).

**Sensitive/held rows:** `ID-04`, `MED-11`, `MH-06`, `RES-04`, `RES-05` are excluded from the interview by `isVisible`; verified by an engine check (held IDs absent from the visible set). They remain in the coverage record. They are presented to the customer in the review panel (F-09), and a forged API payload can submit them (F-01). No SSN, payment data, passport scans or unrelated family identifiers are collected; the visa/green-card number question is held.

**Exclusions, duplicates and compounds:** the inventory has no duplicate source wording, and the bank has no duplicate customer wording. Eight bank rows are compound and 61 carry detail prompts. The optional `exclusions` array is unused (0 rows); exclusions are instead written into customer wording or help text, and spot checks found the material ones present — HIV/AIDS testing exclusions in `MED-01`/`MED-02`, occasional cigar/pipe use in `NIC-01`–`NIC-03`, and prescribed-drug use in `DRG-04`. That is defensible for display but makes exclusion preservation harder to validate automatically and should be normalised.

**Compound splitting:** the three `split_source_compound` rows and the supplemental-labelled source content need reviewer confirmation. The reconciliation document itself flags source questions presented as LPP additions (e.g. `SRC-051`–`SRC-054` under AVI, `SRC-111`–`SRC-113` under MIL). That is an attribution decision, not a developer call.

---

## 7. Test ledger

All fresh results below were produced during this audit at commit `07fdbfe` on the stated dates. “Inherited” means a claim in README/docs that was not re-run.

| # | Command / scenario | Environment | Expected | Actual | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | `git rev-parse HEAD`, `git status`, `diff -r` against supplied zip | Local checkout | Baseline commit, clean tree, archive equal | `07fdbfe…`, clean except untracked audit harness; archive diff empty | PASS (fresh) |
| 2 | Fresh PDF extraction vs committed `.txt` vs `sourceInventory.ts` | Node + pdf-parse | 113 bullets; all inventory entries present | 113/113; 0 missing, 0 extra after typographic normalisation; hash matches | PASS (fresh) |
| 3 | `npm ci --ignore-scripts` | Node 24 / npm 11 | Lockfile install completes | Completed; 4 advisories reported | PASS (fresh) |
| 4 | `npm run test:consent` | Node test runner via tsx | 6 builder tests pass | 6 pass, 0 fail | PASS (fresh) |
| 5 | `npx deno@2 test --allow-env --no-lock supabase/functions/tests/` | Deno 2.9.6, no secrets | Real handler rejects missing/declined required consents | 5/5 pass, HTTP 422 paths | PASS (fresh) |
| 6 | Adversarial `validateDraft` harness (8 forged classes + a zero-answer payload) | Deno, fictitious data, no DB | Forged/held/disabled-channel payloads rejected | 8 forged classes **accepted** (marketing with channels off, held HIV, held visa, invented ID/source, substituted/duplicate consents, future chronology, arbitrary acknowledgement, `ZZ` state) and a zero-answer payload accepted unlabelled; 4 invalid classes rejected (duplicate answers, >400 answers, marketing without phone, non-self); valid baseline accepted | **FAIL** (fresh) |
| 7 | Replay both migrations twice + 19 RLS/RPC assertions | PGlite (PostgreSQL WASM) | Idempotent migrations; reviewer-only access; immutable snapshot | 19/19 checks pass | PASS (fresh) |
| 8 | Engine scenario: parent `MH-01` yes → details → no | tsx | Child hidden; orphan details absent downstream | Child hidden, but details retained and rendered under `not_asked` | **FAIL** (fresh) |
| 9 | Engine scenario: crisis question after history No / Unknown / Declined | tsx | MH-05 visible and crisis true in all three | Visible and true in all three | PASS (fresh) |
| 10 | Held rows absent from visible question set | tsx | 0 held IDs visible | 0 | PASS (fresh) |
| 11 | Answer-state distinctness (`yes/no/unknown/declined/unresolved`) | tsx | Distinct dispositions, no fabricated No | Distinct; `not_applicable` is not offered anywhere in the UI | PARTIAL (fresh) |
| 12 | `npm run check:bank` | tsx | 92 rows, coverage complete, no structural issue | 92 rows; 87 approved, 5 held, 14 branches, 0 signed; 113 source, 85 traced, 28 gaps; 29 flagged; pass | PASS (fresh) |
| 13 | `npm run typecheck` | TypeScript 5.9 | Clean | Clean | PASS (fresh) |
| 14 | `npm run build` | Vite 5.4.21 | Production build | 1668 modules; 432.75 kB JS (120.59 kB gzip); no source maps; no service-role string | PASS (fresh) |
| 15 | `npm run report:reconciliation` in disposable copy, then diff | tsx in isolated copy | Regenerated report matches committed | 92 rows / 92 records / 28 gaps; no diff | PASS (fresh) |
| 16 | Browser preview: lead validation, privacy gate, permission, first question, review, preview submit, portal sample | Chromium, localhost:8080 | Honest preview; required gates; no marketing UI | Validation errors announced/focused; privacy gate blocked; permission honest; review allowed with 72 unanswered; held panel showed HIV/suicide/immigration/visa text; preview submission reported `not_sent`; portal sample showed consent evidence and corrections; no console errors beyond React Router future warnings | PASS with F-09 observation (fresh) |
| 17 | `npm audit --json` | npm | Known advisories | 4 (3 moderate, 1 high: vite dev tool; react-router moderate direct) | Informational (fresh) |
| 18 | Secret/leak scan: `git grep` for service-role keys, JWTs, provider keys; bundle scan; `.env` tracking; storage/analytics grep | Local | No secrets, no health persistence | No secrets; `.env.example` only; no `localStorage`/`sessionStorage`/analytics; reviewer email intended in bundle | PASS (fresh) |
| 19 | Sensitive-data canary scan (fictitious fixture): DOM, URL, browser storage, network, built bundle | Chromium preview, production build | No answer in URL/storage/analytics; no service-role key in bundle | No `localStorage`/`sessionStorage`/analytics use; answers stayed in React state; bundle contained the intended reviewer address and held question text, no secret; live email host and provider logs unavailable | PARTIAL (fresh) |
| 20 | Live Supabase migration, deployed functions, Resend delivery, MFA, mailbox, backups, retention, CSP/headers | — | — | No project/provider/access in workspace | **NOT RUN** |
| 21 | Screen-reader, mobile, keyboard-only full walkthrough, contrast audit | — | — | Only DOM/accessibility-tree checks on sampled screens; no assistive-technology session | **NOT VERIFIED** |
| 22 | Current TCPA/Texas/HIPAA primary-law verification | — | — | Attached TCPA deck is secondary background; no legal research performed this audit | **NOT VERIFIED / counsel** |

**Test quality assessment:** the two committed test files exercise real code: the Deno test captures and calls the real `submit-case` handler (not a mirror), and the consent test drives the pure builder across channel/seller combinations. They do **not** cover the server's marketing/seller policy (because none exists), the acknowledgement identity, idempotency, notification retries, webhook events, RLS (no database in CI), or orphaned answers. CI runs the tests, bank check, report drift check, typecheck and build; none of those can close gates 1, 7 or 8.

---

## 8. Documentation contradictions and drift

1. **56 vs 92 rows** in `src/config/site.ts` and the `reconciliation.ts` header (F-15). The generated report and `check:bank` are correct at 92; two comments are stale.
2. **“Source questions” = 76** on the landing page. It is approved core bank rows; the source inventory has 113 and 85 are traced. The public page therefore implies broader source coverage than the matrix supports.
3. **“No row collapses lookbacks”** (README) is literally true (no `timeframe_merged`), but seven rows replace windows with different ones; the sentence reads as if windows are preserved.
4. **`reviewStatus: "approved"` vs approval.** The type comment only defines `sourceVerified` as “Reconciled is not the same as approved”, but `reviewStatus` has no such comment. A reader can easily mistake 87 “approved” rows for approved questionnaires. The application does not label the interview as using unapproved wording; only the footer says sign-off is pending.
5. **`NOT_APPLICABLE_OPTION`** is exported but never rendered; README lists Not applicable as an implemented answer state. The engine supports the state and the server accepts it, but a customer cannot choose it.
6. **Privacy notice version** displayed (`2026-10-a`) differs from the version stamped on the acknowledgement (`2026-10-b`) (F-10).
7. **`config.toml`** is said to hold the JWT flags and live in the repo; no such file exists (F-07).
8. **Inherited walkthrough numbers** (“31 unanswered”, “37 → 38 questions”) are branch/time-dependent; fresh runs gave 72 unanswered on an empty interview and 54 on the sample case. They should be dated or generated, not repeated as current evidence.
9. **README’s “All 92 bank rows are reconciled”** is accurate in the sense that every row has a record, but “reconciled” is not “approved”; the next sentence does say `sourceVerified: false`, so this is a presentation risk rather than a false statement.
10. **No stale-artifact drift:** regenerating `docs/question-bank-reconciliation.md` in a disposable copy produced no diff, so the CI drift check would pass at this commit.

---

## 9. Remediation sequence

Ordered by dependency; smallest safe fixes first. Each item names an acceptance test.

### Code

1. **Make the server the questionnaire authority** (F-01). Compile/import the approved bank into `submit-case`; reject unknown IDs, source/timeframe/wording mismatches, any `human_review_required` row, and acknowledgements that are not the current ID/version. Acceptance: forged `MED-11`, `INVENTED-99`, changed timeframe and zero-answer payloads → 422; no row written.
2. **Make consent evidence server-policy** (F-02, F-10). Server-owned channel/seller configuration; required IDs/versions/wording hashes; reject duplicates, unknown IDs, substituted text/version, future timestamps; separate client-asserted and server-received times; stamp the privacy record with the privacy notice version. Acceptance: forged marketing consent while channels are off → 422; wrong version/text → 422; valid draft → 201 with both times.
3. **Purge orphaned branch details** (F-03). Remove hidden descendants on parent change; omit fields/details for `not_asked`; render no components for not-asked rows. Acceptance: parent flip test shows empty fields, and the portal shows no orphan health detail.
4. **Add submission idempotency** (F-04). Per-draft key + unique constraint + replay returns the original receipt; client timeout/abort retry reuses the key. Acceptance: concurrent and timed-out submissions create exactly one case.
5. **Add a claimed notification outbox** (F-05, F-13). Lease/`SKIP LOCKED`, `sending` state, provider idempotency key, reconciliation by message ID, explicit `not_sent` re-notify. Acceptance: crash-after-accept and overlapping-worker tests produce one email; a `not_sent` case can be re-queued.
6. **Verify and order delivery events** (F-06). Provider signature over the raw body, timestamp tolerance, event-ID dedupe, monotonic state transitions, no downgrade from `delivered`. Acceptance: replayed, forged, delayed `email.sent` events cannot regress or create evidence.
7. **Gate adult/self and jurisdiction** (F-08). DOB/age check server-side, state allowlist, reject non-self; tests for 17-year-old, `ZZ`, and third-party payloads.
8. **Reduce held-question exposure** (F-09). Replace customer-facing source text with generic topics/counts, or remove the panel; test that held wording is not in the customer DOM.
9. **Byte-accurate body cap** (F-11) and a trustworthy limiter/WAF (F-12). Acceptance: multibyte body above 512 KiB → 413; header-rotation/instance test documents the durable limit.

### Configuration/deployment

10. Commit `supabase/config.toml` with `verify_jwt = false` only for the three machine-facing functions, plus the retry schedule; verify deployed 401/201 behavior and one cron tick (F-07).
11. Pin Deno dependencies and commit `deno.lock`; run CI with the lockfile (F-17).
12. Update Vite/react-router; pin GitHub Actions to SHAs; review install-script exposure (F-16).
13. Configure the real provider, sender domain, webhook signature secret, MFA on the reviewer account, backups/retention and logging review. Live RLS and a full sign-in/callback/session/sign-out test with a non-reviewer account are required before production.

### Business/legal

14. Close the 92 reconciliation decisions with a **named** reviewer; restore or approve each of the seven timeframe substitutions; decide the 19 partial and 9 out-of-scope items; set `sourceVerified: true` only after evidence; bump `QUESTIONNAIRE_VERSION` and regenerate (F-14).
15. Approve the legal entity/seller, marketing channels, intake acknowledgment, privacy notice and TCPA wording; decide HIPAA/Texas applicability and vendor roles (counsel, not this audit).
16. Approve the retention/deletion schedule, incident procedure, mailbox ownership, licensed states and the non-customer end-to-end test plan.

---

## 10. Owner/counsel questions that change the remediation

1. Which legal entity is the authorized seller, and will calls, texts, both or neither actually be operated at launch? (No marketing record should exist otherwise.)
2. For `AVO-01`, `RES-02`, `RES-03`, `MIL-01`, `MIL-03`, `MED-10` and `AVI-04`: restore the source window, or approve the changed window in writing with a named reviewer and date?
3. Are the 19 partly collected items and 9 out-of-scope items acceptable, and who accepts each one?
4. What is the approved adult/self-attestation and state-availability rule? (Currently no age gate and no server state allowlist.)
5. Should held sensitive questions be visible to customers at all, or only to the reviewer/coverage record?
6. Which privacy notice version is authoritative, and what is the approval/versioning process for it?
7. Do HIPAA, Texas Insurance Code Chapter 602, or another regime apply to the actual entity, vendor roles and data flow? (No compliance claim is made here.)
8. What are the approved retention, deletion, backup and incident-response rules, and where will they be executed?
9. Is Resend the approved provider, with what sender domain, webhook signature support and data-retention terms?
10. Who owns and can verify `richardparslow@lifepolicypilot.blog`, and is MFA enforced on that account and the Supabase project?

---

## 11. Explicitly unverified areas

- **Live Supabase:** no project ref/access token/CLI. Migrations, RLS, grants and RPCs were verified only in PGlite, not against the hosted database. Deployed RLS, schema state, `supabase_migrations` history and any manual SQL edits are unknown.
- **Deployed functions:** `verify_jwt`, environment variables, origin allowlist, cron schedule, timeouts, memory and observed rate limiting were not tested.
- **Email:** no Resend key or mailbox access. Provider acceptance, delivery, bounce/complaint handling, webhook payload/signature compatibility, sender-domain authentication and actual inbox receipt are unverified. “Accepted” was never observed in this audit.
- **Authentication/MFA:** no live auth. The code requires a session and a reviewer row; MFA is an operational instruction, not an enforced application control. Session expiry/cache behavior is untested.
- **Retention/backups/logs:** no evidence of configured retention, deletion execution, backup retention, provider log retention, incident response or access audit beyond the app tables.
- **Deployment headers/CSP/cache rules:** not inspected because no host configuration is in the repository.
- **Accessibility/mobile:** sampled DOM and visible focus behavior looked sound (labels, radiogroup, alert role, focus on error, question heading focus), but no screen-reader, keyboard-only full walkthrough, contrast measurement or mobile-device session was performed. The disclosure panel and native date control were not exhaustively tested.
- **Legal:** no current primary-law research was performed. The attached TCPA article is secondary and was not used to assert compliance; no “TCPA compliant” or “HIPAA compliant” conclusion is made.
- **Performance/load:** no concurrency, soak or rate-limit evasion test against a deployed endpoint.
- **Question semantics:** the 55 `matches_source` verdicts were not independently re-approved word-by-word; the reconciliation records were read and the material deviations were sampled. The full matrix is provided so a named reviewer can decide each one.

---

## 12. Conditions before accepting real customer submissions

1. Every one of the 92 bank rows has a named reviewer decision; the seven changed windows are restored or explicitly approved; `sourceVerified: true` is set for every row; `QUESTIONNAIRE_VERSION` is bumped and the report regenerated.
2. `submit-case` validates the snapshot against a server-side approved bank and rejects held rows, unknown IDs, changed source wording/timeframes and stale acknowledgements.
3. Consent requirements, versions, wording hashes, seller and enabled channels are server policy; forged marketing or privacy evidence is rejected; server receipt time is stored separately.
4. Orphaned branch details are purged on parent change and never submitted or displayed as `not_asked`.
5. Submission is idempotent (one case per draft) and the notification path is claimed, idempotent and reconciled; duplicate-case and duplicate-email tests pass.
6. Delivery webhooks are signature-verified, deduplicated and monotonic; `delivered` cannot regress; provider acceptance is never presented as delivery.
7. The deployment includes the JWT-off configuration for the three functions, a retry schedule, pinned dependencies and a successful non-customer end-to-end run with a real provider and a real reviewer sign-in.
8. Live RLS is verified with an anonymous user, an authenticated non-reviewer and the reviewer; MFA is enforced; a forwarded reference alone is denied.
9. Adult/self and state rules are enforced server-side; a 17-year-old and a third-party payload are rejected.
10. Held sensitive questions are not presented to customers; the privacy version is correct and the customer-facing counts are accurate.
11. Counsel has approved the entity, notice, acknowledgement, TCPA wording and sensitive-question handling; HIPAA/Texas applicability and vendor roles are documented.
12. Retention/deletion, backup, incident response, mailbox ownership and provider settings are documented, configured and verified; logs and the browser bundle have been re-checked for health data.

Until those are satisfied, the honest description is: **a well-built, unusually candid local prototype that must not be used for real applicants.**

---

### Appendix files

- [Preserved issue register (18 findings, gate snapshot, evidence gaps)](2026-10-27-issue-register.md)
- [Machine-readable issue register (JSON)](2026-10-27-issue-register.json)
- [Spreadsheet issue register (CSV)](2026-10-27-issue-register.csv)
- [Full questionnaire matrix (113 source items, 92 rows, all mappings and flags)](2026-10-27-questionnaire-matrix.md)
- [Every reconciliation decision requiring sign-off, with source text and bank wording](2026-10-27-reconciliation-decisions.md)
