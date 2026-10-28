# SC-01–SC-05 remediation plan

**Date:** 28 October 2026\
**Scope:** the five current specification-conformance blockers in A6: `SC-01`–`SC-05`.\
**Inputs:** [A6 issue register](2026-10-28-spec-conformance/ISSUES.md), [A5/A6/A7 master list](2026-10-28-master-issue-list.md), [master remediation ledger](2026-10-28-master-remediation/LEDGER.md), and the current repository.\
**Status:** planning only. This document does not close a finding, change a launch gate, authorise a deployment, or approve marketing, legal wording or questionnaire content.

> **Rule:** an engineering check can prove a control exists. It cannot prove a legal entity, a clinical decision, a licensed-state list or a production deployment. Those require a dated, named approval.

## 1. Current position

| Finding | Severity / trigger | What is true now | What is still missing | Plan outcome |
| --- | --- | --- | --- | --- |
| `SC-01` | High — product decision | The interview is deterministic. `FEATURES.aiExplainerEnabled` is `false`; customer copy says no AI assistant is active; the summary is extractive and source-linked by question id. | A signed decision to amend the specification, or an approved, tested model layer. | A dated product decision plus either a signed amendment or the AI acceptance suite below. |
| `SC-02` | Medium — conditional; becomes a launch blocker if a call/text channel is enabled | The working tree has a customer `/marketing-opt-out` route, a `revoke-marketing` function, a reference-plus-contact match, append-only revocation evidence, a vendor-sync outbox, a replay guard and a service-role send guard. A server-only sender gate enforces the approved-state allowlist and the 08:00–21:00 local window before the suppression guard and provider callback. Marketing flags still default to off. | The migration is not applied to staging or production. The licensed-state list is empty, no approved matrix exists, no provider adapter is built, and no live STOP/email intake or vendor endpoint is verified. The changes are uncommitted. | Either a dated “no channel operated” closure, or the full pre-enable acceptance suite. A web form alone does not close it. |
| `SC-03` | High — launch blocker | Staging has migrations `0001`–`0005`, the payload-free `case_summaries` view, the AAL1/AAL2 boundary and one live AAL2 queue response. | No production deployment, applied `0006`–`0008`, real staff TOTP, live provider/inbox test, scheduler tick or retention execution. | A production acceptance package with raw, redacted logs. |
| `SC-04` | High — launch blocker | 92 bank rows: 87 approved for interview, 5 held. 113 source questions, 85 traced, 28 gaps (19 partly collected, 9 out of scope). Zero rows are signed off. | A named clinical/underwriting reviewer’s decision on every row, gap and held item; an approved questionnaire version. | 92/92 row decisions, 28/28 gap decisions and a recorded approved version. |
| `SC-05` | High — legal/operations blocker | `SITE.legalEntity` is unset, `legalReviewPending` is `true`, retention is null, and no vendor or mailbox/MFA evidence exists. | Entity, licensed states, counsel-approved wording, HIPAA/Texas applicability analysis, retention/backup/incident decisions, vendor review and mailbox control. | A dated approval matrix, not a code change. |

`SC-02` is the only finding with substantial code already present in the working tree. None of the five is closed. The local SC-02 work must be committed and applied before its evidence can count.

## 2. Owners and decision rights

One person is accountable for each finding. “Contributor” work can be delegated; the accountable decision cannot be inferred from a passing suite.

| Finding | Accountable owner | Contributors | Approval needed |
| --- | --- | --- | --- |
| `SC-01` | **Richard Parslow**, business/product owner | Engineering; external counsel if the amendment changes legal copy; privacy/model reviewer only if the AI path is selected | Product owner’s dated decision; counsel review for any changed consent or privacy wording |
| `SC-02` | **Richard Parslow** for the channel decision; **Engineering lead** for the control | Operations and the selected marketing vendor | Product owner decides whether any channel operates; counsel approves the seller/disclosure/revocation wording |
| `SC-03` | **Operations/release lead — to be named** (Richard Parslow interim) | Engineering; the real staff reviewer; email/provider administrator | Owner authorises the production test; engineering records the evidence |
| `SC-04` | **Named clinical/underwriting reviewer — UNASSIGNED** | Engineering for generation and checks; Richard Parslow as source/version custodian | The named reviewer only. Engineering must not set `sourceVerified` |
| `SC-05` | **Richard Parslow**, business owner | External counsel; operations for mailbox/MFA; engineering for configuration evidence | Counsel and the business owner, item by item |

**Vacancies that block the plan:** the `SC-04` reviewer, `SC-05` counsel, and the `SC-03` release lead. Naming them is the first action, not a later administrative step.

## 3. Dependency order

| Order | Gate | Depends on | What it unlocks |
| ---: | --- | --- | --- |
| 0 | Governance and credentials | Nothing | A named reviewer, engaged counsel, a release lead, and rotation of the chat-exposed staging database password |
| 1 | `SC-05` legal foundation | Gate 0 | Entity, licensed states, retention period, vendor approvals and counsel wording |
| 2 | `SC-04` questionnaire sign-off | Gate 0; source version and sensitive-question rules from `SC-05` | A truthful `QUESTIONNAIRE_APPROVED=true` and a frozen questionnaire version |
| 3 | `SC-01` product decision | Gate 0; counsel only if wording changes | Frozen customer/specification copy and the scope of any model work |
| 4 | `SC-02` channel decision and control | Gate 0; `SC-05` marketing wording; a vendor only if a channel is enabled | Marketing can remain off, or the pre-enable suite can run |
| 5 | `SC-03` production acceptance | Gates 1–4; `SC-02` only if a channel is enabled; adjacent `SC-09`/`MI-10` prerequisites | Permission to accept a labelled non-customer case in production and, later, the launch decision |

```text
SC-05 ──> SC-04 ──┐
  │                ├──> SC-03 production acceptance
  └──> SC-02 ──────┤
SC-01 ─────────────┘
```

`SC-03` environment preparation can start after Gate 0. Production acceptance cannot start until `SC-04` and `SC-05` are closed, because deploying earlier would either accept unapproved content or require a second deployment immediately afterwards.

Adjacent prerequisites, not re-planned here: the in-app TOTP flow (`SC-09`/`MI-04`) must be exercised by the real reviewer during `SC-03`, and the exposed staging credential (`MI-10`) must be rotated before any production credential is issued.

## 4. `SC-01` — AI assistant and AI-generated summary

**Finding:** the specification asks for an AI-identified assistant and a clearly labelled AI-generated summary. The build is deterministic and says so.

**Accountable:** Richard Parslow.\
**Contributors:** engineering; counsel if the decision changes legal copy; a privacy/model reviewer only for the AI path.

**Dependencies:** none to make the decision. The AI path additionally depends on `SC-05` vendor review and an approved data-processing basis.

### Decision gate

Record one of these before changing copy or code:

- **A — Amend the specification.** Describe the deterministic guided interview and deterministic, source-linked summary. This is the lowest-risk path and matches the current build.
- **B — Approve an AI layer.** Select a provider, complete privacy/vendor review, and implement a server-side, non-authoritative explainer and summary.

The decision record must name the option, the approver, the date, the scope, and the residual risk. It should be committed under `audit/` and linked from the audit index. A verbal decision or a code flag is not a decision record.

Decision and issue: [`2026-10-28-sc-01-decision-record.md`](2026-10-28-sc-01-decision-record.md) records the owner's **approved** Path A decision, and [`2026-10-28-sc-01-specification-v1.1.md`](2026-10-28-sc-01-specification-v1.1.md) is the **issued** version `1.1` amendment with its SHA-256 record. [`2026-10-28-sc-01-copy-walkthrough.md`](2026-10-28-sc-01-copy-walkthrough.md) records the non-customer permission, review and portal label walkthrough; no AI-active claim or AI-generated summary label was found. `SC-01` remains open until `typecheck`/`build` and the dated closure note pass; the owner approval, specification issue and copy review are complete.

### Work items

| # | Action | Owner | Output |
| --- | --- | --- | --- |
| A1 | Draft the decision record with the two options and the customer-copy consequences | Richard | Dated decision memo |
| A2 | If A: issue the amended specification; record its SHA-256 and the superseded version | Richard | Signed amendment |
| A3 | If A: verify every customer surface describes a deterministic interview and no AI claim is made | Engineering | `check:docs`, build and a copy review |
| A4 | If B: complete privacy/vendor review, including retention, logging and subprocessors | Richard + privacy reviewer | Approved vendor record |
| A5 | If B: implement the explainer and summary server-side, with no authority to alter questions, windows, answers, status or recipient | Engineering | Code plus prompt/response contract |
| A6 | If B: label the feature as AI before any call, provide a deterministic fallback, and prohibit emergency-monitoring claims | Engineering | Consent/copy diff and failure-path test |
| A7 | If B: add source grounding, cross-case isolation, redaction and adversarial tests | Engineering | Acceptance suite and provider-log review |

### Acceptance tests

**Path A (amendment):**

1. A signed amendment names the deterministic design and is recorded with its date, approver and file hash.
2. `FEATURES.aiExplainerEnabled` remains `false`; no customer page, consent text, README claim or portal label says an AI is active or that the summary is AI-generated.
3. `npm run check:docs` and `npm run build` pass after the copy change.
4. A fresh non-customer walkthrough shows the permission screen, summary and portal labels all match the amended specification.

**Path B (AI layer):**

1. A non-customer scripted session proves the model cannot add, skip, reorder or reword a question, and cannot change an answer, timeframe, status or notification recipient. The engine state before and after the model call is identical.
2. Every sentence in the generated summary resolves to an answered question id; unsupported facts are rejected or omitted, and the deterministic summary remains available as fallback.
3. A cross-case prompt cannot retrieve another case, reference or answer. The test uses two labelled cases and records the refusal.
4. Provider request/response capture contains only the approved minimum and no unrelated health payload. Provider logging and retention settings are recorded.
5. A timeout, refusal, malformed response or rate limit produces the deterministic summary and a truthful UI state; no blank summary or false AI claim is shown.
6. The AI disclosure is displayed before the first model call, and the customer can continue without the AI layer if the approved design allows it.
7. `npm run check:server-bank`, `npm run check:bundle`, `npm run test:engine`, `npm run typecheck` and `npm run build` pass with the new tests.

**Closure rule:** Path A closes only with the signed amendment and copy review. Path B closes only with the vendor approval, implementation and every test above. Renaming the deterministic summary “AI-generated” without a model is prohibited.

## 5. `SC-02` — customer marketing revocation and suppression propagation

**Finding:** the specification requires selected contact permissions, local-time/state restrictions, and revocation requests to propagate. The repository now has a partial local implementation, but the finding remains open.

**Accountable:** Richard Parslow for whether any channel operates; engineering lead for the control.\
**Contributors:** operations and the marketing vendor.

**Dependencies:** `SC-05` for the seller, disclosure, channel and revocation wording; a vendor and sender only if a channel is enabled. The `SC-03` production test is required for live evidence.

### Current sub-controls

| Control | Current state |
| --- | --- |
| Customer page and endpoint | Implemented in the working tree at `/marketing-opt-out` and `revoke-marketing`; not committed or deployed |
| Reference-plus-contact match | Implemented in `0007_marketing_revocation.sql`; wrong contact returns the same non-enumerating response |
| Suppression and revocation evidence | Implemented; append-only rows and `source`/`request_id` evidence |
| Vendor propagation outbox | Implemented; no vendor URL or secret configured |
| Pre-send suppression guard | Implemented as `assert_marketing_send_allowed`; no outbound sender calls it |
| Replay/idempotence | **Implemented locally in `0008`.** The browser sends an `Idempotency-Key`; the edge function hashes it to the RPC request id; the RPC treats an existing request/suppression/outbox triple as a replay and does not re-open a synced row. A new request id can still re-queue propagation. `check:db` covers both paths; the hosted migration is not applied. |
| Local-time and licensed-state enforcement | **Implemented locally as a fail-closed server policy.** `marketing-policy.ts` requires a licensed-state match and a phone window of 08:00–21:00 in every time zone of the state; `marketing-sender.ts` checks the policy, then the database suppression guard, before the provider callback. The licensed list is empty by default and no provider adapter exists. No approved state matrix or live send is claimed. |
| STOP/email/vendor intake | Missing |
| Live non-customer test | Missing |

### Decision gate

**A — Do not operate any marketing channel in this release.** This is the recommended launch posture. The customer page may remain available, but the build must not offer marketing consent or deploy an outbound sender.

**B — Enable a channel.** Complete every work item and acceptance test below before setting a channel flag.

### Work items

| # | Action | Owner | Output |
| --- | --- | --- | --- |
| B1 | Obtain counsel approval for the seller, channel, disclosure, calling window and revocation wording | Richard + counsel | Dated approval |
| B2 | Commit and apply `0007` and `0008`; record the schema, grants and replay behaviour in staging | Engineering | Migration log |
| B3 | Configure the vendor suppression endpoint and secret; run one outbox drain | Operations | Synced test row and redacted request log |
| B4 | Build the provider adapter behind the existing `sendMarketingMessage` wrapper, so every attempt checks policy and `assert_marketing_send_allowed` before sending | Engineering | Adapter plus bypass test |
| B5 | Approve the state matrix and calling window, then load them through `MARKETING_LICENSED_STATES`; the fail-closed policy is already implemented locally | Engineering + counsel | Approved matrix and boundary tests |
| B6 | Implement STOP/email/withdrawal intake with `source = 'stop_reply'` or `'email'`; keep the web form | Engineering + vendor | Intake handler and audit evidence |
| B7 | Reconcile every suppression to `synced`; no `pending` row may remain before a flag is enabled | Operations | Outbox report |
| B8 | **Done locally.** Replay accepts a caller idempotency key and does not re-queue a suppression that is already synced with the same request | Engineering | `0008`, `check:db` and endpoint tests |
| B9 | Run a labelled live opt-out against the vendor and delete the test contact | Operations + engineering | Dated acceptance log |

### Acceptance tests

**Path A (no channel):**

1. The production build has every marketing channel flag `false`; `MARKETING_ENABLED` evaluates false.
2. `submit-case` rejects any marketing consent record while no channel is enabled; `npm run test:consent` and `npm run check:db` pass.
3. No outbound marketing sender is deployed and no vendor suppression credentials are required.
4. If the public opt-out page is exposed, `0007` is applied and a non-customer suppression is recorded without claiming a live marketing program. If it is not exposed, the route and its links are absent from the production build.
5. `README.md`, `docs/LAUNCH-GATES.md` and `docs/OPERATIONS.md` record the dated no-channel decision. This is a **closed — channel not operated** decision, not a claim that the full control was implemented.

**Path B (channel enabled):**

1. An unchecked marketing box creates no enrollment, no marketing consent record and no disclosure.
2. A wrong reference/contact pair returns the same `202` as a match and writes zero suppression, revocation or outbox rows. A correct phone or email match writes the suppression, the append-only revocation and one pending outbox row.
3. Repeating the same request with the same idempotency key does not duplicate the audit evidence or re-open a synced row. `0008` and `check:db` cover the replay; the hosted migration still needs to be applied.
4. `assert_marketing_send_allowed` raises for the suppressed phone and email, and a test sender aborts before calling the provider. `npm run check:marketing` confirms the wrapper is the only checked path and that the policy and guard precede `deliver`.
5. A mock-clock send outside the approved local window is refused; a send inside the window and in a licensed state is permitted. At least one non-licensed state is refused. Both boundaries and a multi-zone state are tested; an approved matrix is still required before a live send.
6. A STOP reply or email withdrawal is recorded with `source = 'stop_reply'`/`'email'`, suppresses immediately, and creates or re-queues the outbox row. The reviewer case view shows the original consent as withdrawn.
7. The outbox worker marks `2xx` as `synced`, records bounded failures on non-`2xx`, and retries a failed row without duplicating a successful vendor request.
8. Before any flag is enabled, a report shows zero `pending` and zero `failed` rows for the test contacts; a live non-customer opt-out and vendor acknowledgement are captured.
9. `npm run test:consent`, `npm run check:db`, `npm run check:marketing`, the sender/policy tests, `npm run check:docs` and `npm run build` pass.

**Closure rule:** Path A needs the dated no-channel decision and the config assertions. Path B needs every test above and a live vendor acknowledgement. A deployed web form with unsynced outbox rows does not close `SC-02`.

## 6. `SC-03` — production deployment and live verification

**Finding:** the repository has staging evidence but no production deployment, real staff MFA, live provider/inbox test, scheduler tick or retention execution.

**Accountable:** operations/release lead (to be named; Richard Parslow interim).\
**Contributors:** engineering, the real staff reviewer, and the email/auth/provider administrators.

**Dependencies:** `SC-04` sign-off and `SC-05` approvals before production acceptance. `SC-01` must be decided before the customer copy is frozen. `SC-02` matters only if a marketing channel is enabled. The real reviewer flow depends on the locally implemented `SC-09` TOTP gate. Rotate the exposed staging password (`MI-10`) before issuing production credentials.

### Entry criteria

- [ ] `SC-04` has 92/92 row decisions, 28/28 gap decisions and an approved questionnaire version.
- [ ] `SC-05` has the entity, licensed states, retention period, vendor approvals, counsel wording and mailbox/MFA evidence.
- [ ] `SC-01` has a dated decision and any resulting copy is frozen.
- [ ] `SC-02` is either closed as “no channel” or fully accepted for a channel.
- [ ] Access to a production project is authorised, and the sender domain, provider key, webhook secret, cron secret and `RATE_LIMIT_SALT` exist outside the repository.
- [ ] A real staff reviewer and a second non-allowlisted test account are available.
- [ ] The chat-exposed staging credential has been rotated and the date/operator recorded.

### Work items

| # | Action | Owner | Output |
| --- | --- | --- | --- |
| C1 | Create/confirm the production project; record ref, region and owner; confirm no real data is present | Operations | Environment record |
| C2 | Commit `0006`–`0008` if still untracked, then apply `0001`–`0008` in order; verify `supabase_migrations.schema_migrations`, RLS, the payload-free view, grants and the revocation replay guard | Engineering | Migration log |
| C3 | From the same committed revision, deploy `submit-case`, `email-events` and `retry-case-notifications`; deploy `revoke-marketing` if the public page is exposed; deploy `sync-marketing-suppressions` only for `SC-02` Path B | Engineering | Deployment receipt and `verify_jwt` settings |
| C4 | Configure the approved sender domain, `CASE_NOTIFY_FROM`, provider key, webhook secret and `APP_ORIGIN`; keep `QUESTIONNAIRE_APPROVED=false` until the `SC-04` sign-off is recorded | Operations | Secret names only; no values in logs |
| C5 | Disable hosted sign-ups and anonymous sign-ins; enable TOTP; enrol the real reviewer and complete an aal1 → aal2 challenge in the app | Operations + reviewer | Screen recording or redacted log |
| C6 | Apply the retry schedule, store `project_url` and `cron_secret` in Vault, and observe one real scheduler tick | Operations | `cron.job_run_details` row |
| C7 | Submit one labelled non-customer case through the production client | Operations + engineering | Case reference and queue evidence |
| C8 | Exercise provider acceptance, inbox receipt, signed webhook, duplicate event, late event, unmatched event and retry | Engineering | Redacted provider/webhook logs |
| C9 | Run the retention test under the approved period and record backup expiry and incident procedure | Operations + counsel | Retention execution log and provider settings |
| C10 | Delete the labelled case and test auth users; confirm zero residual rows | Operations | Cleanup log |

### Acceptance tests

1. **Migrations:** all seven versions are present in production; a second apply is a no-op; RLS is enabled on the case, review, event, deletion, revocation, rate-limit and settings tables; `case_summaries` has no payload columns and denies `anon`.
2. **Functions:** the deployed functions use the committed `verify_jwt` settings; a foreign `Origin` returns `403`; an allowed origin reaches validation; the public functions still enforce their byte cap and durable rate limit.
3. **Reviewer access:** the real staff reviewer enrols TOTP and reaches the queue only at AAL2; an AAL1 token sees zero summaries and cannot call the review/correction RPCs; a wrong code is rejected; sign-out clears the session.
4. **Case path:** one labelled non-customer submission is stored once, returns one reference, is visible only to the AAL2 reviewer, and records exactly one `opened` entry.
5. **Forwarded/second-account denial:** a forwarded email link requires sign-in and grants no case access; a second non-allowlisted account sees no case.
6. **Delivery:** the provider accepts the message and a real inbox receives it; a signed `email.delivered` event moves the case to `delivered`; a duplicate event is ignored; a late `accepted`/`failed` event cannot regress `delivered` or re-queue a send; an unmatched event is retained and re-correlated on retry.
7. **Scheduler:** one production cron tick invokes the retry worker with the secret, returns a count-only response, and sends no duplicate.
8. **Retention:** an approved expired labelled case is purged by the scheduled job; `case_deletions` has one audit row; backup expiry and deletion-from-backup handling are recorded.
9. **Leak review:** no health payload appears in URLs, client storage, analytics, email bodies, function logs or the provider/error-reporting configuration reviewed for this test.
10. **Cleanup:** the labelled case, auth users, reviewer row and test suppression rows are deleted; the final counts are zero.

**Evidence package:** a dated directory under `audit/` containing `README.md`, the environment/commit, every command, raw redacted logs, provider/webhook receipts and the cleanup output. A screenshot of a success screen without the corresponding log is not sufficient.

**Closure rule:** `SC-03` closes only with production evidence. Staging `0005`, a local `check:db` pass, or a successful function deployment without inbox, webhook, scheduler and retention evidence does not close it.

## 7. `SC-04` — questionnaire sign-off

**Finding:** 92 bank rows exist, but zero have a named reviewer’s sign-off. 28 source gaps and 5 held rows also need decisions.

**Accountable:** named clinical/underwriting reviewer — **vacant**.\
**Contributors:** Richard Parslow as source/version custodian; engineering for generation and checks.

**Dependencies:** the committed source PDF and its hash; `SC-05` licensed-state and sensitive-question rules; counsel input on held rows where required.

### Work items

| # | Action | Owner | Output |
| --- | --- | --- | --- |
| D1 | Name the reviewer, record their scope and independence/confidentiality terms | Richard | Appointment record |
| D2 | Freeze the source PDF version and SHA-256; confirm it is the version the business approved | Richard | Hash and version record |
| D3 | Review all 92 rows: accept, amend, keep held or reject; set `sourceVerified: true` only with evidence | Reviewer | Signed row matrix |
| D4 | Decide all 28 gaps: 19 partly collected and 9 out of scope; record a reason per gap | Reviewer | Signed gap matrix |
| D5 | Decide the 5 held rows (`ID-04`, `MED-11`, `MH-06`, `RES-04`, `RES-05`) and the sensitive-question restrictions | Reviewer + counsel where needed | Held-row decision |
| D6 | Update the reconciliation record; bump `QUESTIONNAIRE_VERSION` for any wording change; regenerate the server bank, source index and references | Engineering, without changing decisions | Regenerated files |
| D7 | Update `scripts/check-docs.ts` expected sign-off count and the README/launch-gate strings once sign-off is recorded | Engineering | Documentation diff |
| D8 | Set `QUESTIONNAIRE_APPROVED=true` only after D3–D7 are evidenced | Richard/operations | Recorded launch-lock change |

`check:bank` prints the sign-off count but does not fail solely because rows are unsigned. `check:docs` currently hard-codes `signedOff: 0`, so it must be updated with the approved count when sign-off lands; otherwise the documentation check will correctly fail.

### Acceptance tests

1. `npm run check:bank` reports **92 of 92** rows signed off, all **28** recorded gaps (19 partly collected, 9 out of scope), zero collected nowhere and 5 held rows dispositioned.
2. The signed gap matrix records **28 of 28** reviewer decisions. `check:bank` proves coverage, not approval; the matrix is the approval evidence.
3. `npm run check:server-bank` and `npm run check:docs` pass after the generated files and expected counts are updated.
4. The signed matrix names the reviewer, date, source hash and questionnaire version. A spot-check of the matrix against the reconciliation file finds no unsigned or contradictory row.
5. The approved questionnaire version is recorded, and a newly submitted case is stamped with it.
6. `QUESTIONNAIRE_APPROVED` remains `false` until the signed record exists; the setting and the evidence are reviewed together.
7. Held rows remain unasked unless separately approved; their review notes remain server-only and the public bundle check passes.

**Closure rule:** engineering may prepare the matrix and run the checks, but it cannot set `sourceVerified` or approve content. A bulk flag flip without a named reviewer is not acceptance.

## 8. `SC-05` — legal and operational approvals

**Finding:** the actual legal entity, licensed states, counsel-approved wording, retention schedule, vendor review and mailbox/MFA control are absent.

**Accountable:** Richard Parslow, business owner.\
**Approver:** external counsel for legal items; the business owner for operational choices.\
**Contributors:** operations for mailbox/MFA and provider evidence; engineering for configuration proof.

**Dependencies:** none to begin; this work feeds `SC-04` and `SC-03`. Delaying it delays both.

### Approval matrix

| Gate | Required decision | Evidence | Blocks |
| --- | --- | --- | --- |
| Entity | Legal operating entity and authorised seller | Dated counsel/business record; `VITE_LEGAL_ENTITY` value (not a placeholder) | Marketing disclosure, `SC-03` |
| Licensed states | States where the business may solicit and the state-specific rules | Dated list; sender/state matrix | `SC-04`, `SC-02` Path B, `SC-03` |
| Intake acknowledgment | Approved wording and version | Counsel-approved text and hash | `SC-03`, launch |
| Privacy notice | Approved notice, retention description and processor list | Counsel-approved text and hash | `SC-03`, launch |
| TCPA / e-signature | Approved consent flow, disclosure and signature basis | Counsel opinion scoped to the actual channels | `SC-02`, launch |
| HIPAA/Texas applicability | Written applicability analysis; no compliance claim unless supported | Counsel memo | All real health data |
| Retention | Approved period, backup expiry and deletion-from-backup handling | `retention_months` value and dated schedule | `SC-03` |
| Incident response | Owner, contact path, escalation and notification duties | Runbook approval | `SC-03` |
| Vendors | Hosting, database/backup, email, auth, any model/SMS/CRM provider | DPAs, retention settings, subprocessor list, security review | `SC-01` Path B, `SC-02` Path B, `SC-03` |
| Mailbox/MFA | Controlled access to the reviewer mailbox and MFA | Access record without credentials | `SC-03` |
| Source/version | Approved questionnaire source and version | Hash and business approval | `SC-04` |

### Acceptance tests

1. Every row of the matrix has a dated, named approval, a scope and a document reference. No row is marked approved because a test passed.
2. The configuration values match the approvals: legal entity set, licensed states recorded, `retention_months` set, vendor list current, mailbox/MFA evidenced.
3. `docs/LAUNCH-GATES.md` is updated from “blocked/pending” to the actual approved state, and `npm run check:docs` passes.
4. `README.md` and the privacy page make no HIPAA, Texas, encryption-at-rest or “approved” claim beyond the recorded evidence.
5. A second reader can trace each approval to its document, date and approver without asking engineering.
6. No real customer health information is accepted until every launch-blocking row is checked.

**Closure rule:** `SC-05` is a legal/operational record, not a code change. A green build, a privacy-page edit or an engineering opinion does not close any row.

## 9. Cross-finding controls

| Control | Requirement |
| --- | --- |
| Real data | No real customer health information until `SC-03` acceptance is complete and `SC-04`/`SC-05` are signed |
| Marketing | Every channel remains off until `SC-02` Path B is fully accepted; a pending outbox row blocks enablement |
| Questionnaire lock | `QUESTIONNAIRE_APPROVED` stays `false` until `SC-04` records 92/92 |
| AI claim | No AI claim until `SC-01` Path B is implemented and tested; no “AI-generated” label on the deterministic summary |
| Production evidence | Staging, PGlite, a local build or a deployment receipt is not production acceptance |
| Approvals | Legal, clinical and product approvals cannot be inferred from a test suite or delegated to engineering |
| Historical packages | Do not rewrite A6 or its manifest. Record closure in a new dated note and link it from `AUDIT-INDEX.md` |

### Evidence record for every closure

Each closure note should record:

```text
Finding:        SC-0x
Status:         closed | closed — not applicable | still open | blocked
Owner:          named accountable person
Approver:       named approver and role
Date:           YYYY-MM-DD
Commit:         full SHA
Environment:    local | staging | production | provider console
Test/command:   exact command or review procedure
Result:         pass/fail with counts
Evidence:       workspace-relative path to raw redacted log or signed document
Residual risk:  what this evidence does not prove
```

A closure note without an environment, commit and raw evidence is not sufficient. If a later code or copy change touches the same surface, re-run the affected acceptance test.

## 10. Execution summary

| Finding | First action | Owner | Acceptance in one line |
| --- | --- | --- | --- |
| `SC-01` | Decide amendment vs AI; record it | Richard | Signed amendment, or a tested model layer that cannot alter questions or answers and leaks no cross-case data |
| `SC-02` | Decide no channel vs enable | Richard | No-channel decision, or a live revocation + suppression + time/state + vendor test |
| `SC-03` | Name the release lead and production project | Operations/Richard | A labelled production case saved, delivered, reviewed, retried, retained and deleted with raw logs |
| `SC-04` | Appoint the clinical/underwriting reviewer | Richard | 92/92 rows, 28/28 gaps, 5 held decisions and an approved version |
| `SC-05` | Engage counsel and open the approval matrix | Richard | Every legal/operational row has a dated, named approval |

The recommended launch sequence is: keep marketing off, amend the AI specification rather than build a model layer, complete `SC-05` and `SC-04` in parallel, then run `SC-03` once. That sequence removes the largest scope and legal risks before production acceptance. It is a recommendation, not an approval; the accountable owners must record their decisions.
