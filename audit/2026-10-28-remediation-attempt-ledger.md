# Remediation ledger — all audit findings (paused)

**Baseline:** `main` at `20e0eff79a42d71b8980a5a0489422aa7176892b` plus pre-existing uncommitted changes. **Date:** 28 October 2026. This is triage, not a new verification or production approval.

**Stop condition:** the supplied prompt explicitly says to stop if a high finding cannot be fixed without changing product or legal behavior. AS-02 requires a product/counsel decision about phone withdrawal; MI-02/AS-07 require clinical sign-off and AS-04/MI-03 require counsel approval. The documented safe posture is to keep intake locked and marketing disabled. No application code, approval flags, legal copy, hosted resources or credentials were changed in this attempt.

**Status semantics:** No finding is newly marked Resolved. `Fixed — Pending Verification` means an earlier report records local remediation; it is not fresh proof. `Open` means this attempt did not verify or resolve it. Rows link to the [consolidated audit register](2026-10-28-consolidated-master-issues.md), whose source links contain original commits, evidence and reproduction. Duplicated IDs and composite findings are preserved, not counted as separate defects. AS-08/09 concern the later working tree, not the ZIP.

**Commands:** `pwd`, `ls -la`, `git status --short --branch`, `git diff --stat` completed. No full suite or application tests were run after the stop condition; historical logs do not prove this attempt. The attachment ends immediately after `git diff --stat` inside an unclosed code block, so further exact required commands are unavailable. An optional nested-instruction search failed because `rg` is unavailable. The first ledger-generation attempt also failed with an index error and created no file; this successful attempt avoids the duplicate summary row.

## Findings

### M-01 — Public endpoint accepted fabricated questions, versions and held answers

- **Severity / classification:** High / Security defect
- **Root cause:** Historical issue mechanism: Public endpoint accepted fabricated questions, versions and held answers.
- **Owner type:** security
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L37); Historical local canonical-bank fix and negative tests; full deployed behavior still needs verification. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-02 — Client-asserted consent wording, versions and extra consent evidence

- **Severity / classification:** High / Consent defect
- **Root cause:** Historical issue mechanism: Client-asserted consent wording, versions and extra consent evidence.
- **Owner type:** legal
- **Status:** Blocked — Legal
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L38); Server checks recorded locally; counsel approval remains pending. Related MI-03. No fresh regression was run in this attempt.
- **Remaining risk / action:** Counsel approval of intake and privacy consent is missing.

### M-03 — Changed source windows and no signed-off questionnaire rows

- **Severity / classification:** High / Question-bank/reconciliation defect
- **Root cause:** Historical issue mechanism: Changed source windows and no signed-off questionnaire rows.
- **Owner type:** clinical
- **Status:** Blocked — Clinical
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L39); Approval remains open; related MI-02 / AS-07. No fresh regression was run in this attempt.
- **Remaining risk / action:** A named clinical/underwriting reviewer must approve the source version, all rows, gaps, windows and held items.

### M-04 — Client-supplied crisis and review flags were trusted

- **Severity / classification:** High / Edge-function defect
- **Root cause:** Historical issue mechanism: Client-supplied crisis and review flags were trusted.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L40); Historical local server-derived flags and tests; no deployed proof. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-05 — Hidden branch details persisted; nested descendants could revive

- **Severity / classification:** Medium / Interview-flow defect
- **Root cause:** Historical issue mechanism: Hidden branch details persisted; nested descendants could revive.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L41); Historical local fixed-point pruning and engine tests; full UI-to-storage path not verified in the latest audit. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-06 — Missing per-draft submission idempotency allowed duplicate cases

- **Severity / classification:** Medium / Code defect
- **Root cause:** Historical issue mechanism: Missing per-draft submission idempotency allowed duplicate cases.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L42); Historical local idempotency key and database uniqueness; real HTTP timeout/concurrency not proved end-to-end. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-07 — Notification sends lacked leasing/claiming and could duplicate

- **Severity / classification:** Medium / Edge-function defect
- **Root cause:** Historical issue mechanism: Notification sends lacked leasing/claiming and could duplicate.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L43); Historical local lease/provider key checks; ambiguous acceptance and provider-window risk remain RISK-01. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-08 — Webhook replay/out-of-order events could regress delivery state

- **Severity / classification:** Medium / Edge-function defect
- **Root cause:** Historical issue mechanism: Webhook replay/out-of-order events could regress delivery state.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L44); Historical local signature, dedupe and event monotonicity; later completion-path regression tracked separately as MI-06. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-09 — Function deployment settings and retry schedule absent

- **Severity / classification:** Medium / Operational gap
- **Root cause:** Historical issue mechanism: Function deployment settings and retry schedule absent.
- **Owner type:** operations
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L45); Config/schedule recorded locally; a clean hosted deployment and scheduler tick remain unverified. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-10 — Adult/self and jurisdiction checks missing

- **Severity / classification:** Medium / Consent defect
- **Root cause:** Historical issue mechanism: Adult/self and jurisdiction checks missing.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L46); Historical local DOB/adult/self and state-code validation; licensed-state approval is separate. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-11 — Held source wording and later reviewer notes exposed in public bundle

- **Severity / classification:** Medium / Privacy defect
- **Root cause:** Historical issue mechanism: Held source wording and later reviewer notes exposed in public bundle.
- **Owner type:** privacy
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L47); Reopened by A5, then historical local redaction/bundle guard; hosted bundle and clinical decision remain separate. Related MI-18. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-12 — Marketing withdrawal and suppression execution absent

- **Severity / classification:** Medium / Consent defect
- **Root cause:** Historical issue mechanism: Marketing withdrawal and suppression execution absent.
- **Owner type:** product
- **Status:** Blocked — Product
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L48); Snapshot later adds a customer route/outbox; vendor, STOP, sender checks and scope remain a pre-enable gate. Related MI-09 / AS-02 / AS-05. No fresh regression was run in this attempt.
- **Remaining risk / action:** The owner and counsel must decide and approve withdrawal scope before enabling marketing.

### M-13 — Reviewer MFA enrollment was not enforced as AAL2 by policy

- **Severity / classification:** Medium / Supabase schema/RLS defect
- **Root cause:** Historical issue mechanism: Reviewer MFA enrollment was not enforced as AAL2 by policy.
- **Owner type:** security
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L49); Historical local AAL2 policy and staging boundary evidence; real staff MFA through app still unverified. Related MI-04. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-14 — Retention, deletion, backup and incident-response execution absent

- **Severity / classification:** Medium / Operational gap
- **Root cause:** Historical issue mechanism: Retention, deletion, backup and incident-response execution absent.
- **Owner type:** operations
- **Status:** Blocked — Legal
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L50); Deletion and opt-in expiry recorded locally; approved retention, backups and execution remain open. No fresh regression was run in this attempt.
- **Remaining risk / action:** Owner/counsel must approve retention and backup expiry; operations must execute and document them.

### M-15 — Privacy acknowledgment stored the wrong notice version

- **Severity / classification:** Low / Consent defect
- **Root cause:** Historical issue mechanism: Privacy acknowledgment stored the wrong notice version.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L51); Historical local version separation and test; counsel approval separate. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-16 — Body size cap counted characters rather than bytes

- **Severity / classification:** Low / Edge-function defect
- **Root cause:** Historical issue mechanism: Body size cap counted characters rather than bytes.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L52); Historical local streaming byte cap; latest Deno suite tests multibyte rejection. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-17 — Rate limiting was per-instance and based on spoofable headers

- **Severity / classification:** Low / Security defect
- **Root cause:** Historical issue mechanism: Rate limiting was per-instance and based on spoofable headers.
- **Owner type:** security
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L53); Durable/fail-closed local limiter recorded; trusted edge identity and hosted abuse controls unverified. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-18 — `not_sent` cases were excluded from retry

- **Severity / classification:** Low / Edge-function defect
- **Root cause:** Historical issue mechanism: `not_sent` cases were excluded from retry.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L54); Historical local retry path; provider and scheduled recovery remain unverified. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-19 — Confirmation falsely said queued when notification was not sent

- **Severity / classification:** Low / Documentation defect
- **Root cause:** Historical issue mechanism: Confirmation falsely said queued when notification was not sent.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L55); Historical local conditional copy; actual provider status still unverified. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-20 — Stale documentation, counts and unsupported answer-state claims

- **Severity / classification:** Low / Documentation defect
- **Root cause:** Historical issue mechanism: Stale documentation, counts and unsupported answer-state claims.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L56); Historical local docs guard; current snapshot still has specific wording issues in AS-04 and the report's timeframe caveat. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-21 — Dependency advisories and CI supply-chain exposure

- **Severity / classification:** Low / Build/tooling defect
- **Root cause:** Historical issue mechanism: Dependency advisories and CI supply-chain exposure.
- **Owner type:** engineering
- **Status:** Open
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L57); Historical dependency upgrades, SHA-pinned actions and lifecycle-disabled installs; no fresh advisory analysis in this consolidation. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-22 — Deno dependencies lacked exact pins/lockfile

- **Severity / classification:** Low / Build/tooling defect
- **Root cause:** Historical issue mechanism: Deno dependencies lacked exact pins/lockfile.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L58); Historical lockfile and locked tests; registry and deployed resolution remain outside local proof. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-23 — Live portal did not record case-open access events

- **Severity / classification:** Low / Security defect
- **Root cause:** Historical issue mechanism: Live portal did not record case-open access events.
- **Owner type:** security
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L59); Historical client RPC recorded; later direct-read bypass is independently reproduced as AS-03. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-24 — Case immutability omitted derived evidence metadata

- **Severity / classification:** Informational / Supabase schema/RLS defect
- **Root cause:** Historical issue mechanism: Case immutability omitted derived evidence metadata.
- **Owner type:** security
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L60); Historical local trigger coverage and service-role denial tests. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-25 — Reviewer could directly write status and review logs outside atomic RPC

- **Severity / classification:** Medium / Supabase schema/RLS defect
- **Root cause:** Historical issue mechanism: Reviewer could directly write status and review logs outside atomic RPC.
- **Owner type:** security
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L61); Historical migration 0004 local denial/RPC tests; hosted grants need independent verification. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-26 — Server accepted missing or unusable phone for phone/text contact

- **Severity / classification:** Low / Edge-function defect
- **Root cause:** Historical issue mechanism: Server accepted missing or unusable phone for phone/text contact.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L62); Historical local server/client validation tests. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-27 — Environment example omitted rate-limit salt and questionnaire lock

- **Severity / classification:** Low / Documentation defect
- **Root cause:** Historical issue mechanism: Environment example omitted rate-limit salt and questionnaire lock.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L63); Historical local configuration/docs guard; actual deployment configuration unverified. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-28 — An unmatched webhook consumed its event ID and prevented later correlation

- **Severity / classification:** Low / Edge-function defect
- **Root cause:** Historical issue mechanism: An unmatched webhook consumed its event ID and prevented later correlation.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L64); Historical local RPC re-correlation fix; AS-06 separately identifies lack of guaranteed retry after HTTP 200. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-29 — Remediation ledger overstated closures and misstated questionnaire count

- **Severity / classification:** Low / Documentation defect
- **Root cause:** Historical issue mechanism: Remediation ledger overstated closures and misstated questionnaire count.
- **Owner type:** engineering
- **Status:** Open
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L65); Historical ledger correction; preserve original evidence rather than rewriting its past status. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### M-30 — Privacy copy asserted at-rest encryption without hosted evidence

- **Severity / classification:** Informational / Privacy defect
- **Root cause:** Historical issue mechanism: Privacy copy asserted at-rest encryption without hosted evidence.
- **Owner type:** privacy
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L66); Historical local copy correction; provider encryption/key management still needs verification. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-01 — Production/reviewer/provider/scheduler/retention evidence missing

- **Severity / classification:** High / Operational gap
- **Root cause:** Historical issue mechanism: Production/reviewer/provider/scheduler/retention evidence missing.
- **Owner type:** operations
- **Status:** Blocked — External Vendor
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L74); **Open — operations.** Historical staging proof only; verify deployment and full synthetic end-to-end. Also AS-07. No fresh regression was run in this attempt.
- **Remaining risk / action:** Production-like access, reviewer, provider and operational evidence are not available.

### MI-02 — Questionnaire not signed off: 0/92, 28 source gaps at audited snapshot

- **Severity / classification:** High / Clinical/product gate
- **Root cause:** Questionnaire row and gap decisions lack named clinical sign-off.
- **Owner type:** clinical
- **Status:** Blocked — Clinical
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L75); **Open — clinical/product.** Named reviewer must decide all rows and gaps. M-03 / AS-07. No fresh regression was run in this attempt.
- **Remaining risk / action:** Named reviewer must sign off questionnaire rows and gaps.

### MI-03 — Entity, counsel wording, states, retention and vendor approvals missing

- **Severity / classification:** High / Legal/compliance gate
- **Root cause:** Business, counsel and operational approvals lack evidence.
- **Owner type:** legal
- **Status:** Blocked — Legal
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L76); **Open — legal/operations.** Dated approvals and configuration/evidence required; also AS-04 / AS-07. No fresh regression was run in this attempt.
- **Remaining risk / action:** Owner and counsel must approve entity, state scope, consent, privacy, retention and vendors.

### MI-04 — In-app TOTP enrollment/challenge missing at A6/A7 baseline

- **Severity / classification:** High / Security defect
- **Root cause:** Historical issue mechanism: In-app TOTP enrollment/challenge missing at A6/A7 baseline.
- **Owner type:** security
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L77); **Locally implemented; live browser/reviewer pending.** Snapshot portal guard found the flow; verify real staff enrollment and AAL2 without weakening RLS. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-05 — AI assistant/AI summary required by older specification but implementation deterministic

- **Severity / classification:** High / Clinical/product gate
- **Root cause:** The earlier specification requests AI while the implementation is deterministic.
- **Owner type:** product
- **Status:** Needs Clarification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L78); **Product decision / closure evidence pending.** Later uncommitted Path A amendment exists; verify authority/provenance and closure; AS-08/09 are distinct concerns. No fresh regression was run in this attempt.
- **Remaining risk / action:** Owner-directed Path A exists; preserve it while resolving its recorded integrity and review attribution concerns.

### MI-06 — Delivered notification could regress and trigger retry

- **Severity / classification:** Medium / Edge-function defect
- **Root cause:** Historical issue mechanism: Delivered notification could regress and trigger retry.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L79); **Historical local fix** tested by snapshot `check:db` including late completion and zero re-claim. Live provider evidence pending; RISK-01 is distinct. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-07 — Contradictory lead identity and structured/prose answers accepted

- **Severity / classification:** Medium / Edge-function defect
- **Root cause:** Historical issue mechanism: Contradictory lead identity and structured/prose answers accepted.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L80); **Historical local fix** for DOB, state and tested choice mismatch in snapshot Deno suite; no hosted proof. Original SC-10 also discusses field-option validation; see source record for exact scope. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-08 — Magic-link flow could create accounts if signups enabled

- **Severity / classification:** Medium / Security defect
- **Root cause:** Historical issue mechanism: Magic-link flow could create accounts if signups enabled.
- **Owner type:** security
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L81); **Local config/guard recorded; hosted settings pending.** Confirm signup disabled and generic behavior. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-09 — Missing customer marketing withdrawal and propagation

- **Severity / classification:** Medium / Consent defect
- **Root cause:** Historical issue mechanism: Missing customer marketing withdrawal and propagation.
- **Owner type:** product
- **Status:** Blocked — Product
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L82); **Conditional pre-enable gate.** Snapshot has customer path/outbox but withdrawal scope, replay, sender and vendor controls remain AS-02/05. No fresh regression was run in this attempt.
- **Remaining risk / action:** Owner/counsel must define withdrawal scope and vendor propagation before marketing enablement.

### MI-10 — Staging password exposed in chat, rotation not evidenced

- **Severity / classification:** Medium / Operational gap
- **Root cause:** Historical issue mechanism: Staging password exposed in chat, rotation not evidenced.
- **Owner type:** operations
- **Status:** Blocked — External Vendor
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L83); **Open — operations.** Confirm rotation and no reuse; never expose the value. No fresh regression was run in this attempt.
- **Remaining risk / action:** An authorized operator must rotate the exposed staging credential and record evidence without disclosing it.

### MI-11 — Reviewer queue truncated after 50 entries

- **Severity / classification:** Low / Code defect
- **Root cause:** Historical issue mechanism: Reviewer queue truncated after 50 entries.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L84); **Local pagination implementation recorded; hosted multi-page verification pending.** No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-12 — Yes answer without optional detail looked complete

- **Severity / classification:** Low / Interview-flow defect
- **Root cause:** Historical issue mechanism: Yes answer without optional detail looked complete.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L85); **Historical local mitigation** flags missing supplemental detail; detail remains optional by design. Review adequacy with product. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-13 — Submission acknowledgment could predate required consents

- **Severity / classification:** Low / Consent defect
- **Root cause:** Historical issue mechanism: Submission acknowledgment could predate required consents.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L86); **Historical local fix** and snapshot Deno regression; client timestamps do not by themselves prove the customer saw a screen. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-14 — No automated cross-answer inconsistency flags

- **Severity / classification:** Low / Question-bank/reconciliation defect
- **Root cause:** Historical issue mechanism: No automated cross-answer inconsistency flags.
- **Owner type:** clinical
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L87); **Historical partial local mitigation:** specific timeframe contradictions flagged; approximate dates and broader clinical/occupation consistency remain human/product decisions. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-15 — README misstated whether backend had run in staging

- **Severity / classification:** Low / Documentation defect
- **Root cause:** Historical issue mechanism: README misstated whether backend had run in staging.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L88); **Historical documentation resolution** recorded in [SC-06 note](2026-10-28-sc-06-resolution.md); distinguish staging from production. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-16 — Documentation claimed delivered state could not regress

- **Severity / classification:** Low / Documentation defect
- **Root cause:** Historical issue mechanism: Documentation claimed delivered state could not regress.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L89); **Historical local code/docs correction** with terminal-state checks; live event ordering remains unverified. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-17 — Gate wording obscured the absence of the in-app MFA step-up

- **Severity / classification:** Low / Documentation defect
- **Root cause:** Historical issue mechanism: Gate wording obscured the absence of the in-app MFA step-up.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L90); **Historical local docs/flow correction**; real reviewer enrollment remains pending. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-18 — Held reviewer notes shipped in public JS

- **Severity / classification:** Medium / Privacy defect
- **Root cause:** Historical issue mechanism: Held reviewer notes shipped in public JS.
- **Owner type:** privacy
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L91); **Historical local fix** and selected bundle guard; related M-11; deployed bundle not verified. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-19 — Queue fetched full case payloads without per-case open logs

- **Severity / classification:** Medium / Privacy defect
- **Root cause:** Historical issue mechanism: Queue fetched full case payloads without per-case open logs.
- **Owner type:** privacy
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L92); **Historical local queue projection fix**, not closure of AS-03 direct individual case read. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-20 — Portal claimed retention/deletion followed an inactive schedule

- **Severity / classification:** Low / Documentation defect
- **Root cause:** Historical issue mechanism: Portal claimed retention/deletion followed an inactive schedule.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L93); **Historical local copy fix**; retention itself remains unapproved/unexecuted (M-14). No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### MI-21 — A6's first pass did not run edge-function tests

- **Severity / classification:** Info / Test gap
- **Root cause:** Historical issue mechanism: A6's first pass did not run edge-function tests.
- **Owner type:** engineering
- **Status:** Open
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L94); **Verification gap closed for that pass:** 36 tests rerun; later snapshot ran 60. Neither run proves hosted behavior. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### AS-01 — `Idempotency-Key` absent from CORS allow-headers blocks cross-origin browser submission.

- **Severity / classification:** High / Edge-function defect
- **Root cause:** The audited CORS preflight did not allow the client idempotency header.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L102); Later uncommitted fix and local test recorded; verify independently and in authorized hosted browser. No fresh regression was run in this attempt.
- **Remaining risk / action:** Earlier records describe uncommitted local work; independently verify it and the authorized hosted path before closure.

### AS-02 — Email-only withdrawal leaves the case phone unsuppressed despite call/text context.

- **Severity / classification:** High / Consent defect
- **Root cause:** The audited withdrawal RPC suppressed only the supplied channel while the UI described stopping calls and texts.
- **Owner type:** product
- **Status:** Blocked — Product
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L103); Later UI clarifies scope; product/counsel must decide intended withdrawal and verify all channels/vendor before enabling marketing. No fresh regression was run in this attempt.
- **Remaining risk / action:** Owner and counsel must decide whether email-identified withdrawal includes the case phone and approve truthful wording.

### AS-03 — An authorized AAL2 direct payload read produces no `opened` event.

- **Severity / classification:** High / Supabase schema/RLS defect
- **Root cause:** The audited RLS allowed direct payload SELECT; the application logged opens only after reading.
- **Owner type:** security
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L104); Later uncommitted migration and local tests recorded; validate direct-read denial, atomic logging and hosted RLS. No fresh regression was run in this attempt.
- **Remaining risk / action:** Earlier records describe uncommitted local work; independently verify it and the authorized hosted path before closure.

### AS-04 — Privacy notice denies family-member information while questions collect family medical history.

- **Severity / classification:** High / Privacy defect
- **Root cause:** The audited privacy notice denied family-member collection while bank rows collected family medical history.
- **Owner type:** legal
- **Status:** Blocked — Legal
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L105); Later draft copy recorded; clinical/counsel approval still required. No fresh regression was run in this attempt.
- **Remaining risk / action:** Clinical and legal reviewers must approve notice wording and family-history collection scope.

### AS-05 — Replaying a revocation can requeue a synced suppression despite same request ID.

- **Severity / classification:** Medium / Consent defect
- **Root cause:** The audited suppression upsert reset an already-synced outbox row on request replay.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L106); Later uncommitted guard and local coverage recorded; independently test concurrent replay and vendor sync before enabling marketing. No fresh regression was run in this attempt.
- **Remaining risk / action:** Earlier records describe uncommitted local work; independently verify it and the authorized hosted path before closure.

### AS-06 — Handler acknowledges an unmatched provider event with 200, so a provider may not retry correlation.

- **Severity / classification:** Medium / Edge-function defect
- **Root cause:** The audited webhook returned HTTP 200 for an event before correlation was guaranteed.
- **Owner type:** engineering
- **Status:** Fixed — Pending Verification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L107); Later local 503 change and handler test recorded; verify actual provider event ordering/recovery. No fresh regression was run in this attempt.
- **Remaining risk / action:** Earlier records describe uncommitted local work; independently verify it and the authorized hosted path before closure.

### AS-07 — Questionnaire, legal, retention, vendor, credential and hosted operations evidence missing.

- **Severity / classification:** High / Clinical/product gate
- **Root cause:** Named clinical, legal and operational approvals and complete hosted evidence were absent.
- **Owner type:** clinical
- **Status:** Blocked — Clinical
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L108); Related MI-01–03, MI-10, M-02–03/M-14. Do not count it as four additional defects. No fresh regression was run in this attempt.
- **Remaining risk / action:** Named clinical, legal and operations approvals are needed; see MI-01–03 and MI-10.

### AS-08 — Issued SC-01 decision-record hash no longer matches edited record.

- **Severity / classification:** Medium / Documentation defect
- **Root cause:** The decision record was edited after its issue hash was recorded.
- **Owner type:** engineering
- **Status:** Open
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L109); Historical mismatch observed, not independently rechecked in this consolidation; preserve issuance and add attributable integrity evidence without replacing old hash. No fresh regression was run in this attempt.
- **Remaining risk / action:** Re-examine the exact working tree and source evidence, reproduce or confirm the issue, and run the applicable regression plus the full suite before any closure.

### AS-09 — Available copy-walkthrough evidence did not establish owner participation.

- **Severity / classification:** Medium / Clinical/product gate
- **Root cause:** The preserved walkthrough did not establish owner participation.
- **Owner type:** product
- **Status:** Needs Clarification
- **Evidence / verification:** [historical finding and evidence references](2026-10-28-consolidated-master-issues.md#L110); Clarify agent versus owner review and obtain confirmation if required; absence of evidence does not prove absence of participation or negate the separate owner instruction. No fresh regression was run in this attempt.
- **Remaining risk / action:** Obtain owner confirmation if owner participation in the copy review is required; do not invalidate the separate owner instruction.

### RISK-01 — Delayed retry outside provider idempotency window

- **Severity / classification:** Medium, suspected and not reproduced / Operational gap
- **Root cause:** The snapshot described provider idempotency for 24 hours while allowing retries for seven days; ambiguous acceptance could lead to a duplicate after expiry.
- **Owner type:** operations / engineering
- **Status:** Blocked — External Vendor
- **Evidence / verification:** [original risk record](2026-10-28-consolidated-master-issues.md#risk-01--delayed-retry-outside-provider-idempotency-window); provider behavior was not tested in this attempt.
- **Remaining risk / action:** Verify the provider's actual contract and simulate a controlled delayed retry after uncertain acceptance before adopting an operational recovery policy.

## Decisions needed to resume

1. Product owner and counsel: decide whether an email-identified withdrawal covers the phone on file and approve the wording and policy (AS-02); keep marketing disabled meanwhile.
2. Appoint a named clinical/underwriting reviewer to decide the 92 questionnaire rows, 28 gaps, changed windows and held topics (MI-02 / AS-07). Counsel must approve privacy and consent, entity, jurisdictions, retention and vendor arrangements (MI-03 / AS-04).
3. Authorized operations: confirm rotation and non-reuse of the exposed staging password, without sharing its value; arrange reviewer and vendor evidence for later authorized testing (MI-01 / MI-10 / RISK-01).
4. Preserve the existing SC-01 owner-directed decision while separately addressing the integrity and attribution observations (AS-08/09).

Once the required decisions are available, independently verify the uncommitted fixes and the full suite before marking anything resolved. No deployment or real customer submissions are authorized by this ledger.
