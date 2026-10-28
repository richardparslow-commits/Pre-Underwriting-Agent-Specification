# Life Policy Pilot — attached snapshot audit

**Date:** 28 October 2026, 14:27 UTC  
**Verdict:** **NOT READY for real customer health information or production launch.**  
**Audited target:** attached `Pre-Underwriting-Agent-Specification-main.zip`, SHA-256 `d4d38d5fdfaae6c6b26553440da4a94ef1d33e37f7b6464ae6a44767a4decbad`  
**Baseline:** `main` at `20e0eff79a42d71b8980a5a0489422aa7176892b`; all 330 ZIP files match the tracked files at that commit byte-for-byte. The ZIP contains no Git history; history was reviewed in the associated local checkout.  
**Questionnaire PDF SHA-256:** `afe91d876f2c9e932302267ad10d0c46b774b4161efea8d0d2ffe71e3c82cca2`  
**Prompt SHA-256:** `41ddd529ccf28926ad76dc48bac81f3a3ca40b467e576138b5a1731e9c490588`

This is an engineering, privacy and product-readiness assessment, not a legal opinion or certification. No fixes, configuration changes, hosted tests or deployments were performed. The findings concern the ZIP/committed snapshot unless explicitly marked **working tree**. Source links below open the corresponding workspace files; where those files have uncommitted edits, line numbers and claims refer to **HEAD**, not necessarily what the link currently displays. Use `git show 20e0eff:<path>` to inspect the exact committed version.

## 1. Scope and evidence quality

The provided audit prompt ends abruptly after “human review” in an unclosed workflow block. It specifies no branch, commit range or output format beyond its placeholders. This audit therefore uses the attached snapshot, the corresponding local `main` history and the requirements visible in the prompt. The preserved product specification extraction and existing audit/launch documents were used as supporting context, not as a substitute for an independently supplied signed specification. The current uncommitted workspace includes later work absent from the ZIP. In particular, its SC-01 amendment and SC-02 changes are **not part of the attached snapshot**.

The snapshot was extracted into an isolated temporary directory; dependencies were installed there from the lockfile using `npm ci --ignore-scripts`. Tests used synthetic data, local mocks and in-memory PGlite. The recorded staging evidence is historical project evidence, not a new hosted verification. No real users or provider inboxes were accessed. Browser interactions were not part of this audit.

## 2. Executive findings

| ID | Severity / status | Finding | Reproduction or evidence |
| --- | --- | --- | --- |
| AS-01 | **High — reproduced** | Cross-origin live intake preflight omits the required idempotency header, so browsers block submission. | [Preflight probe](evidence/focused-probes.log) |
| AS-02 | **High — conditional; reproduced** | An opt-out authenticated by email leaves the same case's phone unsuppressed despite the call/text withdrawal context. | [Email-only probe](evidence/focused-probes.log) |
| AS-03 | **High — reproduced** | An AAL2 reviewer can read case payload directly without generating an `opened` event. | [Direct-read probe](evidence/focused-probes.log) |
| AS-04 | **High — confirmed by inspection** | The privacy notice says no family-member information is collected, while the questionnaire asks and stores family medical history. | [Privacy page](../../src/pages/PrivacyPage.tsx#L6-L10), [question bank](../../src/features/interview/questionBank.ts#L517-L559) |
| AS-05 | **Medium — conditional; reproduced** | Retried marketing revocations are not idempotent: even the same request ID can requeue a previously synced suppression. | [Replay probe](evidence/focused-probes.log) |
| AS-06 | **Medium — confirmed by inspection** | A valid unmatched provider event receives HTTP 200, so the provider need not retry the correlation race. | [Webhook handler](../../supabase/functions/email-events/index.ts#L115-L145), [correlation RPC](../../supabase/migrations/0004_reviewer_write_paths.sql#L65-L114) |
| AS-07 | **High — launch approval gap** | 0/92 questionnaire rows are signed off; legal, retention and vendor approvals and end-to-end production evidence remain outstanding. | [Bank/check logs](evidence/local-checks.log); [launch gates](../../docs/LAUNCH-GATES.md) |
| AS-08 | **Medium — current working tree only** | The SC-01 issued decision's recorded SHA-256 no longer matches the edited decision record. | [Provenance log](evidence/provenance.log); [hash record](../2026-10-28-sc-01-issue.sha256) |
| AS-09 | **Medium — current working tree only** | The decision record names the owner in the engineering copy-review row, but the available walkthrough evidence does not establish the owner's participation. | [Decision approval block](../2026-10-28-sc-01-decision-record.md#8-approval-block); [walkthrough](../2026-10-28-sc-01-copy-walkthrough.md) |

The local tests passing do not resolve these findings. AS-01, AS-03, AS-04 and AS-07 block a live intake release; AS-02 and AS-05 block the conditional marketing path. Existing launch gates also remain independently applicable.

## 3. Detailed findings

### AS-01 — Cross-origin live submission is blocked by CORS

**Evidence.** The browser's `submitLive` sends `Idempotency-Key` with its JSON POST ([api.ts](../../src/lib/api.ts#L338-L351)); the committed `submit-case` OPTIONS response allows `authorization, x-client-info, apikey, content-type` but not `idempotency-key` ([handler](../../supabase/functions/submit-case/index.ts#L112-L129)). The real handler was invoked locally with an approved synthetic Origin and the browser's requested headers. It returned 204 with `idempotencyAllowed: false` ([probe source](evidence/audit-probe-preflight.ts), [output](evidence/focused-probes.log)).

**Impact.** For a cross-origin frontend-to-function deployment, the browser rejects the preflight before the POST. Same-origin requests do not have that cross-origin preflight; no hosted browser request was tested here. Direct handler tests do not simulate browser CORS.

**Action / acceptance.** Permit the precise required header on the deployed preflight and add a handler test asserting requested headers, then verify an actual non-customer browser-to-hosted-function submission. The current working tree already has an uncommitted change to this header; it is not in the ZIP and was not tested as the audited snapshot.

### AS-02 — Email-only withdrawal does not suppress the phone on file

**Evidence.** The opt-out page accepts either email or phone and frames the action as stopping marketing calls/texts ([page](../../src/pages/MarketingOptOutPage.tsx#L133-L137)). The RPC separately suppresses the supplied matching channel only ([migration 0007](../../supabase/migrations/0007_marketing_revocation.sql#L290-L340)). In an isolated database, a case with both contacts received a valid email-only withdrawal: the result recorded `email`, email was suppressed, phone remained unsuppressed, and `assert_marketing_send_allowed('phone', ...)` returned true ([probe source](evidence/audit-probe-marketing.mjs), [output](evidence/focused-probes.log)).

**Impact.** If phone marketing is enabled, a customer who uses their email to identify the case can reasonably believe they have stopped calls/texts while the phone guard still permits them. Marketing is disabled by default and there is no outbound sender in this snapshot; no real contact was made. The non-enumerating 202 response is deliberate, but must not be interpreted as proof that a match or suppression occurred.

**Action / acceptance.** Product and counsel should define the intended withdrawal scope and truthful acknowledgement. If case-level withdrawal is intended, authenticate the request and suppress the case's relevant telephone channels; otherwise require/clearly identify the phone scope. Exercise email-only, phone-only, mismatch and vendor propagation with labelled data before enabling marketing.

### AS-03 — Case access audit is client-driven and bypassable

**Evidence.** The AAL2 policy permits an authorized reviewer to select `cases` ([initial grants](../../supabase/migrations/0001_pre_underwriting.sql#L133-L157), [AAL2 function](../../supabase/migrations/0003_reliability_and_access.sql#L63-L85)). `getCase` reads the payload first and then calls `record_case_review`; if logging fails it warns and continues ([api.ts](../../src/lib/api.ts#L493-L526)). In PGlite, an allowlisted AAL2 reviewer selected a synthetic payload directly while the count of `opened` records remained zero ([probe source](evidence/audit-probe-access-log.mjs), [output](evidence/focused-probes.log)).

**Impact.** Authorized access still requires the reviewer/AAL2 boundary, so this is not a demonstrated anonymous or cross-account disclosure. It is a material accountability gap: a direct API query or failed RPC can retrieve sensitive data without an application access record. The existing eight-hour deduplication also deliberately limits granularity.

**Action / acceptance.** Move sensitive reads behind a server-enforced, audited access path, prevent direct payload SELECT on the exposed API, and decide/document the intended audit granularity. Verify direct REST/RPC bypasses and logging failure handling with AAL1, AAL2 and nonmember accounts in staging.

### AS-04 — Privacy notice contradicts family-history questions

**Evidence.** The draft notice says “We do not collect … information about family members” ([PrivacyPage.tsx](../../src/pages/PrivacyPage.tsx#L6-L10)), but `MED-25` asks about a parent's or sibling's diagnoses, relative, condition and age and `MED-26` asks about family deaths, conditions and ages ([questionBank.ts](../../src/features/interview/questionBank.ts#L517-L559)). Both are active interview rows, although unsigned. This is not merely collection of named relatives' identifiers: the unqualified notice denies collecting family-member information at all.

**Impact.** People can be told the opposite of what the interview asks, undermining informed notice. Whether the content is appropriate and how to describe it require the named clinical reviewer and counsel; no legal conclusion is asserted.

**Action / acceptance.** Align the notice and questionnaire scope with the approved collection and obtain counsel review. Add a regression check for the approved wording; do not delete source questions without an explicit product/clinical decision.

### AS-05 — Revocation replay requeues already-synced suppression

**Evidence.** The committed edge function creates a fresh random request ID for every POST ([handler](../../supabase/functions/revoke-marketing/index.ts#L202-L210)). In migration 0007, the same ID prevents a duplicate audit row, but suppression upsert occurs first and its trigger unconditionally resets the outbox to `pending` ([migration](../../supabase/migrations/0007_marketing_revocation.sql#L188-L225)). A local test replayed the *same* RPC ID after marking it synced: one audit row remained but the outbox returned to `pending` ([probe source](evidence/audit-probe-revocation-replay.mjs), [output](evidence/focused-probes.log)). A normal HTTP retry additionally gets a new request ID and can create another audit row.

**Impact.** Retries can duplicate propagation and create misleading pending state, complicating pre-enable operational checks. No vendor was contacted; the worker's deterministic vendor key is only useful if the eventual provider honors it.

**Action / acceptance.** Use a stable per-intent request key end to end and make replay atomic and side-effect-free, including after sync; validate concurrent retries, request mismatch and genuine new withdrawals. The working tree includes uncommitted SC-02 idempotency work; this audit does not assert that it passes or resolves AS-02/AS-05.

### AS-06 — An early webhook can be acknowledged before correlation

**Evidence.** `apply_email_event` saves an unmatched event and returns `unmatched` for a later invocation ([migration 0004](../../supabase/migrations/0004_reviewer_write_paths.sql#L65-L114)). The webhook returns HTTP 200 for that result ([email-events](../../supabase/functions/email-events/index.ts#L127-L145)). The local database check demonstrates that *explicitly invoking the RPC again* can correlate it; it does not show that a provider retries a successful 200 or that an independent reconciliation worker exists.

**Impact.** If an event arrives before the message ID is persisted and carries no usable case-reference tag, the provider may stop retrying and the delivered state may remain stale until an independent replay. This is a code-path analysis, not a reproduced hosted-provider event; tag availability and provider behavior must be checked in the actual deployment.

**Action / acceptance.** Provide a durable re-correlation mechanism or an appropriate retry response, and test the real signed event ordering and success/error acknowledgements against the chosen provider without exposing health data.

### AS-07 — Questionnaire, legal and operational gates remain open

**Evidence.** `check:bank` reports 92 rows, 0 reviewer sign-offs, 5 held rows, 113 source questions and 28 recorded gaps: 19 partially collected and 9 out of scope ([local checks](evidence/local-checks.log)). A structural pass means gaps have decisions recorded, not that a qualified reviewer approved those decisions. The server requires `QUESTIONNAIRE_APPROVED=true` ([case.ts](../../supabase/functions/_shared/case.ts#L123-L126)); the toggle alone is not sign-off. The launch documents list pending counsel, entity, licensed-state, retention, backup, vendor and operational decisions ([launch gates](../../docs/LAUNCH-GATES.md), [operations](../../docs/OPERATIONS.md)).

The saved staging package reports migrations 0001–0005 and a temporary GoTrue/AAL2 queue proof, but explicitly says the real reviewer, production and provider steps remain ([staging record](../2026-10-28-migration-0005-staging/README.md)). The snapshot's operations checklist records 0006 and 0007 pending there; no current hosted state was queried. The staging record also requires rotation of a password previously exposed in chat; no rotation was independently verified.

**Impact.** Neither local green checks nor historical staging evidence establish permission to collect real health information or legal compliance. The signed source PDF for the product specification is not available for independent comparison in this audit.

**Action / acceptance.** Keep the intake launch lock and marketing disabled. Obtain dated reviewer sign-off for the bank and source gaps, and counsel/business approvals for notice, entity, jurisdiction, retention, backups and vendors; verify rotation and perform a controlled, authorized non-customer hosted end-to-end test including AAL1/AAL2, cross-account isolation, actual provider/webhook/scheduler and deletion/retention.

### AS-08 — Working-tree SC-01 decision hash no longer verifies

**Scope:** the current checkout, **not the attached ZIP**. The uncommitted [SC-01 hash record](../2026-10-28-sc-01-issue.sha256) expects decision-record SHA-256 `d257fea889269438cdfcfc5900fdbf6bbaf7d08c3677b11e29829047d5b3f0aa`; the file presently hashes to `3ba842e23ddf383746a708775fbd77900fd5848c7b3f04e133301947ba0b275a`. The specification v1.1 hash still matches. `shasum -a 256 -c` returns 1 ([provenance log](evidence/provenance.log)). The decision record was edited after issue to record the later copy walkthrough; a mismatch alone does not establish unauthorized tampering or invalidate the owner's instruction.

**Impact / action.** The issue manifest cannot authenticate the current decision-record bytes, so it must not be presented as a matching hash record. Preserve the original issued record if available; otherwise add a clearly dated, attributable amendment or additive integrity receipt that distinguishes original issuance from later edits and obtain any required owner confirmation. Do not silently rewrite the historical hash or claim a cryptographic signature. SC-01 remains subject to its separate closure checks and external-source/counsel limitations.

### AS-09 — Copy-review attribution is not supported by the walkthrough record

**Scope:** the current uncommitted working tree, **not the attached ZIP**. The decision's approval block names “Richard Parslow / engineering walkthrough” for the completed engineering copy review ([decision record](../2026-10-28-sc-01-decision-record.md#8-approval-block)). The available [walkthrough record](../2026-10-28-sc-01-copy-walkthrough.md) describes the local browser actions and results but does not establish that Richard personally performed or reviewed the walkthrough. The visible session records engineering-agent activity; it does not provide evidence of the owner's review. This does not negate the separately recorded owner instruction approving Path A, and does not establish that he did not participate outside the visible evidence.

**Impact / action.** Distinguish the engineering agent's completed walkthrough from any owner review; obtain and record explicit owner confirmation if owner sign-off is required. Preserve the existing approval history and address the hash mismatch through an attributable integrity record rather than silently rewriting the issue hash.

## 4. Workflow and controls assessment

| Workflow step | Snapshot assessment | Limits |
| --- | --- | --- |
| Introduction, lead and permission | Guided intake and separate privacy/intake consent are implemented; server checks canonical consent wording and the launch lock. | Draft legal notice has AS-04; no legal approval demonstrated. |
| Questionnaire and conditional follow-ups | Declarative bank/branching and answer pruning exist; 8 engine tests pass; unanswered stays distinct from “No.” | Sign-off and 28 documented gaps remain; passing structure does not prove clinical completeness. |
| Review, correction and affirmative submission | Review acknowledgement and append-only corrections exist. | The cross-origin POST is blocked by AS-01; tests did not exercise a live browser path. |
| Secure storage | RLS/AAL2, immutable payload controls and a payload-free queue are tested in disposable PostgreSQL; limited historical staging evidence exists. | Case payload access logging is bypassable (AS-03); no new hosted cross-account test or deployed configuration review. |
| Email notification | Fixed server-side recipient, minimal message, signed webhook validation, leasing and monotonic terminal state exist. | No live provider verification; AS-06 leaves an unmatched-event recovery gap. The code notes a 24-hour provider idempotency window while the retry worker accepts cases up to seven days old: duplicate-send risk after delayed uncertain acceptance merits a controlled provider-specific test, not an exactly-once claim. |
| Human review | Reviewer portal and TOTP gate exist; PGlite confirms AAL1 denial/AAL2 access. | Real staff enrollment, hosted MFA settings and end-to-end portal review remain unverified. |
| Marketing | Default client flags are off and committed server validation rejects marketing consent records. Local suppression/outbox controls exist. | AS-02 and AS-05; no live vendor, STOP intake, licensed-state/local-time sender gate, or end-to-end propagation proof. Keep channels off. |

**Specification conflict:** the committed snapshot has a deterministic interview with `aiExplainerEnabled=false` and a non-AI summary. The older specification extraction and A6 identify an AI requirement ([SC-01](../2026-10-28-spec-conformance/ISSUES.md#sc-01--the-ai-assistant-and-ai-generated-summary-are-not-implemented)). The later owner-directed v1.1 amendment exists only in the uncommitted working tree, not in the attached ZIP; its specification hash matches but AS-08 limits the associated decision hash. This audit does not independently verify the absent signed source or grant legal approval.

## 5. Verification ledger

All commands below ran against the isolated ZIP snapshot, not the edited checkout. Logs preserve exit status and synthetic-only probe outputs.

| Check | Result |
| --- | --- |
| `npm ci --ignore-scripts --no-audit --no-fund` | Passed; snapshot-local install |
| `npm run build` | Passed; includes `tsc --noEmit`; Vite warned that the 632.39 kB minified JS chunk exceeds 500 kB. This is a size warning, not a benchmark. |
| `check:bank`, `check:docs`, `check:portal`, `check:server-bank`, `check:server-policy` | Passed; `check:portal` is a source/config guard, not hosted MFA execution. |
| `test:consent`, `test:engine`, `test:validation` | Passed: 7 + 8 + 5 tests. |
| `check:db` | Passed: 86 local assertions/migration executions, 0 failures; migrations 0001–0007 in disposable PGlite. |
| `check:bundle` | Passed for the locally built asset; it probes selected held source/notes and is not a comprehensive privacy scan. |
| Deno 2.9.6 edge-function suite | Passed: 60 tests, 0 failures. |
| `npm audit --audit-level=high` | Passed at audit time: 0 reported vulnerabilities; registry data is time-sensitive and not a supply-chain guarantee. |
| Four focused probes | Completed and reproduced AS-01, AS-02, AS-03 and AS-05; exit 0 means each reproduced its expected finding, **not** that the product behavior passed. |
| Selected local Git-history token-pattern scan | No matches for the three selected patterns in 22 available revisions; `.env`-family files and lockfiles were excluded. This is not an exhaustive secret scan, and does not negate the known staging-password exposure. |
| Working-tree SC-01 issue hash | **Failed** on decision record; specification file OK (AS-08). |

[Local checks](evidence/local-checks.log) · [Deno checks](evidence/deno-checks.log) · [Focused probes](evidence/focused-probes.log) · [Dependency audit](evidence/dependency-audit.log) · [History scan](evidence/history-secret-scan.log) · [Input provenance](evidence/provenance.log). Probe source files are alongside these logs; copy them to the snapshot root before reproducing because their imports and migration paths are snapshot-relative.

**Not performed:** production or staging deployment, live sign-in, real reviewer MFA, cross-account hosted access, live delivery, STOP processing, vendor suppression, scheduler, backup/restore, retention execution or a complete browser walkthrough. This audit did not re-run the prior SC-01 walkthrough or test the unrelated uncommitted fixes. Node `v24.16.0` was used locally; CI specifies Node 22. No claim of independent multi-reviewer audit or comprehensive penetration/secret testing is made.

## 6. Prioritized path to readiness

1. Preserve the launch lock. Correct and test the snapshot's cross-origin submission flow (AS-01) and secure server-side case-access logging (AS-03), then verify both against a non-production environment.
2. Resolve the privacy-notice discrepancy (AS-04) and obtain the questionnaire, counsel, entity, vendor and retention decisions in AS-07; verify the staging credential rotation. Do not infer approval from code or the audit.
3. Fix/validate webhook recovery (AS-06), provider idempotency and operational delivery/retention evidence with authorized non-customer data.
4. Before enabling marketing, define and test withdrawal scope and replay behavior (AS-02/AS-05), implement/verify state and local-time restrictions and provider propagation, and obtain the relevant business/counsel approvals. The working-tree changes require their own independent review.
5. Reconcile the separate SC-01 hash and review-attribution issues (AS-08/AS-09) with an attributable integrity record and finish its documented closure checks; compare any amendment with the actual signed source before external reliance.
