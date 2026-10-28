# Consolidated master list — all pre-underwriting audit findings

**Date:** 28 October 2026

**Verdict:** **NOT READY** to accept real customer health information on the available evidence.

**Purpose:** one durable index of every issue in the saved audit groups, including historical findings, later specification/security reviews, attached-snapshot findings and the separate notification risk. This is a consolidation, not a new audit or a legal, clinical or deployment approval.

## How to read this register

- **M-01–M-30** are the 30 root-cause records from the three early substantive audits (A1 baseline, A3 Qwencloud and A4 Freebuff); A2 is a conditions-only archive. `A1 F-xx` and `A4 F-xx` are different namespaces despite sharing the same prefix.
- **MI-01–MI-21** consolidate A5, A6 and A7. Some describe the same underlying issue as an `M` or `AS` record; others are distinct. **AS-01–AS-09** come from the attached-snapshot audit. AS-07 is a composite of several existing operational and approval findings, not a new count of four unrelated defects. The later Freebuff DOCX-prompt audit reexamines the same ZIP and reuses the AS IDs; it is not a separate set of newly numbered findings.
- This document lists **60 numbered register entries** (30 M + 21 MI + 9 AS) **plus one separately identified suspected risk**. That is an index count, **not** a deduplicated count of current defects. It also covers 86 original numbered finding records: A1 18, A3 24, A4 12, A5 3, A6 12 and A7 17. AS contributes nine more records, including the composite. Do not add source counts together as independent bugs.
- Baselines: A1/A3 at `07fdbfe632d48ef363caac086e82b8c2f13277a2`; A4 at `173b0a0da8c72c7c3ff859a5a441da79e3fed234`; A5 at `b51ebf9f50040e4a938912012040201a59557eb4`; A6/A7 at `79e8af4f58ad74914241ef4660f765da105949c9`; attached ZIP at `20e0eff79a42d71b8980a5a0489422aa7176892b`. AS-08 and AS-09 concern a **later uncommitted working-tree decision record**, not the ZIP. The checkout contains additional uncommitted work and is not equivalent to any clean audited snapshot.
- **Status is evidence-scoped:** “historical local fix” cites a recorded local remediation, not proof of production behavior. “Pending” means an approval, deployment or verification is still required; a defect reproduced in a snapshot is not automatically reproduced in the current working tree. The existing remediation ledgers describe local work; this index does not rerun tests, close issues, approve questionnaire rows, or establish the current hosted state.
- Detailed reproduction, severity, original observations, action and regression evidence remain in the linked original reports and ledgers. In a conflict, the dated source artifact is authoritative for **its own** baseline; use the later evidence for subsequent changes.

## Priority: before real customer submissions

| Source IDs | Issue and necessary next evidence |
|---|---|
| AS-01 | Cross-origin submission preflight failed on the ZIP. A later uncommitted header change and local test are recorded; independently validate the exact release build and a non-customer hosted browser submission. |
| AS-03; M-23; MI-19 | Audited access: the ZIP allowed an AAL2 reviewer to fetch a sensitive payload without an `opened` event. The old payload-free queue fix is narrower and does not close this bypass. Validate the later local audited-read change and direct REST/RPC denial against the actual release and staging. |
| AS-04; MI-03 | Draft privacy notice contradicted collection of family medical history. Later draft wording exists; obtain counsel/clinical approval of the notice and actual collection before use. |
| AS-07; MI-01–03; M-02–03, M-14 | Named questionnaire decisions, legal entity/jurisdictions, consent and vendor review, reviewer MFA, retention, backup, incident response and hosted end-to-end evidence remain open or unverified. Snapshot bank check reported 0/92 signed off and 28 documented gaps. |
| MI-10 / A7-17 | Confirm rotation and non-reuse of the staging credential previously exposed in chat; no rotation was independently verified. Do not publish the credential. |
| AS-06; M-28; MI-01; RISK-01 | Demonstrate durable correlation of early provider events, safe retry handling after ambiguous acceptance, a working scheduler and real delivery evidence with synthetic data. A later local handler change is recorded, not hosted proof. |
| MI-05 / SC-01 / AS-08–09 | Resolve and preserve an attributable decision on deterministic behavior versus the original AI specification, including the integrity and participation-evidence questions around the later working-tree record. Do not treat a hash mismatch as proof of tampering. |
| M-12; MI-09; AS-02, AS-05 | **Before enabling marketing only:** approve withdrawal scope and wording; validate replay idempotency, suppression, STOP, vendor propagation, state/time restrictions and consent policy. No active outreach was demonstrated. |

## A. Early-audit consolidated issues (M-01–M-30)

The descriptions and local status below follow the [30-issue master list](2026-10-27-master-issue-list.md) and subsequent [Qwencloud remediation ledger](2026-10-28-qwencloud-remediation/LEDGER.md). Status is a historical checkpoint, **not** a new verification of the current checkout or hosted environment. Original severities and detailed acceptance tests are retained in the source registers.

| ID | Issue | Original audit IDs | Recorded later evidence / remaining limitation |
|---|---|---|---|
| M-01 | Public endpoint accepted fabricated questions, versions and held answers | A1 F-01; A3 QW-01 | Historical local canonical-bank fix and negative tests; full deployed behavior still needs verification. |
| M-02 | Client-asserted consent wording, versions and extra consent evidence | A1 F-02; A3 QW-02 | Server checks recorded locally; counsel approval remains pending. Related MI-03. |
| M-03 | Changed source windows and no signed-off questionnaire rows | A1 F-14; A3 QW-03; A4 F-01 | Approval remains open; related MI-02 / AS-07. |
| M-04 | Client-supplied crisis and review flags were trusted | A3 QW-04 | Historical local server-derived flags and tests; no deployed proof. |
| M-05 | Hidden branch details persisted; nested descendants could revive | A1 F-03; A3 QW-05; A4 F-04 | Historical local fixed-point pruning and engine tests; full UI-to-storage path not verified in the latest audit. |
| M-06 | Missing per-draft submission idempotency allowed duplicate cases | A1 F-04; A3 QW-06 | Historical local idempotency key and database uniqueness; real HTTP timeout/concurrency not proved end-to-end. |
| M-07 | Notification sends lacked leasing/claiming and could duplicate | A1 F-05; A3 QW-07 | Historical local lease/provider key checks; ambiguous acceptance and provider-window risk remain RISK-01. |
| M-08 | Webhook replay/out-of-order events could regress delivery state | A1 F-06; A3 QW-08 | Historical local signature, dedupe and event monotonicity; later completion-path regression tracked separately as MI-06. |
| M-09 | Function deployment settings and retry schedule absent | A1 F-07; A3 QW-09; A4 F-08 | Config/schedule recorded locally; a clean hosted deployment and scheduler tick remain unverified. |
| M-10 | Adult/self and jurisdiction checks missing | A1 F-08; A3 QW-10 | Historical local DOB/adult/self and state-code validation; licensed-state approval is separate. |
| M-11 | Held source wording and later reviewer notes exposed in public bundle | A1 F-09; A3 QW-11; A4 F-02; A5 QW2-01 | Reopened by A5, then historical local redaction/bundle guard; hosted bundle and clinical decision remain separate. Related MI-18. |
| M-12 | Marketing withdrawal and suppression execution absent | A3 QW-12; A4 F-06 | Snapshot later adds a customer route/outbox; vendor, STOP, sender checks and scope remain a pre-enable gate. Related MI-09 / AS-02 / AS-05. |
| M-13 | Reviewer MFA enrollment was not enforced as AAL2 by policy | A3 QW-22; A4 F-08 (composite) | Historical local AAL2 policy and staging boundary evidence; real staff MFA through app still unverified. Related MI-04. |
| M-14 | Retention, deletion, backup and incident-response execution absent | A3 QW-23; A4 F-07 | Deletion and opt-in expiry recorded locally; approved retention, backups and execution remain open. |
| M-15 | Privacy acknowledgment stored the wrong notice version | A1 F-10; A3 QW-13 | Historical local version separation and test; counsel approval separate. |
| M-16 | Body size cap counted characters rather than bytes | A1 F-11; A3 QW-14 | Historical local streaming byte cap; latest Deno suite tests multibyte rejection. |
| M-17 | Rate limiting was per-instance and based on spoofable headers | A1 F-12; A3 QW-15; A4 F-08 (composite) | Durable/fail-closed local limiter recorded; trusted edge identity and hosted abuse controls unverified. |
| M-18 | `not_sent` cases were excluded from retry | A1 F-13; A3 QW-16; A4 F-08 (composite) | Historical local retry path; provider and scheduled recovery remain unverified. |
| M-19 | Confirmation falsely said queued when notification was not sent | A3 QW-17 | Historical local conditional copy; actual provider status still unverified. |
| M-20 | Stale documentation, counts and unsupported answer-state claims | A1 F-15; A3 QW-18 | Historical local docs guard; current snapshot still has specific wording issues in AS-04 and the report's timeframe caveat. |
| M-21 | Dependency advisories and CI supply-chain exposure | A1 F-16; A3 QW-19 | Historical dependency upgrades, SHA-pinned actions and lifecycle-disabled installs; no fresh advisory analysis in this consolidation. |
| M-22 | Deno dependencies lacked exact pins/lockfile | A1 F-17; A3 QW-20 | Historical lockfile and locked tests; registry and deployed resolution remain outside local proof. |
| M-23 | Live portal did not record case-open access events | A3 QW-24 | Historical client RPC recorded; later direct-read bypass is independently reproduced as AS-03. |
| M-24 | Case immutability omitted derived evidence metadata | A1 F-18; A3 QW-21 | Historical local trigger coverage and service-role denial tests. |
| M-25 | Reviewer could directly write status and review logs outside atomic RPC | A4 F-03 | Historical migration 0004 local denial/RPC tests; hosted grants need independent verification. |
| M-26 | Server accepted missing or unusable phone for phone/text contact | A4 F-05 | Historical local server/client validation tests. |
| M-27 | Environment example omitted rate-limit salt and questionnaire lock | A4 F-09 | Historical local configuration/docs guard; actual deployment configuration unverified. |
| M-28 | An unmatched webhook consumed its event ID and prevented later correlation | A4 F-10 | Historical local RPC re-correlation fix; AS-06 separately identifies lack of guaranteed retry after HTTP 200. |
| M-29 | Remediation ledger overstated closures and misstated questionnaire count | A4 F-11 | Historical ledger correction; preserve original evidence rather than rewriting its past status. |
| M-30 | Privacy copy asserted at-rest encryption without hosted evidence | A4 F-12 | Historical local copy correction; provider encryption/key management still needs verification. |

## B. A5–A7 consolidated issues (MI-01–MI-21)

This section retains every ID from the [A5–A7 master register](2026-10-28-master-issue-list.md), with later local status drawn from the dated [remediation ledger](2026-10-28-master-remediation/LEDGER.md) and the [attached snapshot audit](2026-10-28-attached-snapshot-audit/REPORT.md). A recorded fix is **not** a hosted or legal closure.

| ID | Issue | Source findings | Evidence-scoped status / next action |
|---|---|---|---|
| MI-01 | Production/reviewer/provider/scheduler/retention evidence missing | SC-03; A7-01 | **Open — operations.** Historical staging proof only; verify deployment and full synthetic end-to-end. Also AS-07. |
| MI-02 | Questionnaire not signed off: 0/92, 28 source gaps at audited snapshot | SC-04; A7-02 | **Open — clinical/product.** Named reviewer must decide all rows and gaps. M-03 / AS-07. |
| MI-03 | Entity, counsel wording, states, retention and vendor approvals missing | SC-05; A7-03 | **Open — legal/operations.** Dated approvals and configuration/evidence required; also AS-04 / AS-07. |
| MI-04 | In-app TOTP enrollment/challenge missing at A6/A7 baseline | SC-09; A7-04 | **Locally implemented; live browser/reviewer pending.** Snapshot portal guard found the flow; verify real staff enrollment and AAL2 without weakening RLS. |
| MI-05 | AI assistant/AI summary required by older specification but implementation deterministic | SC-01; A7-05 | **Product decision / closure evidence pending.** Later uncommitted Path A amendment exists; verify authority/provenance and closure; AS-08/09 are distinct concerns. |
| MI-06 | Delivered notification could regress and trigger retry | A7-06 | **Historical local fix** tested by snapshot `check:db` including late completion and zero re-claim. Live provider evidence pending; RISK-01 is distinct. |
| MI-07 | Contradictory lead identity and structured/prose answers accepted | SC-10; A7-07 | **Historical local fix** for DOB, state and tested choice mismatch in snapshot Deno suite; no hosted proof. Original SC-10 also discusses field-option validation; see source record for exact scope. |
| MI-08 | Magic-link flow could create accounts if signups enabled | SC-11; A7-08 | **Local config/guard recorded; hosted settings pending.** Confirm signup disabled and generic behavior. |
| MI-09 | Missing customer marketing withdrawal and propagation | SC-02; A7-09 | **Conditional pre-enable gate.** Snapshot has customer path/outbox but withdrawal scope, replay, sender and vendor controls remain AS-02/05. |
| MI-10 | Staging password exposed in chat, rotation not evidenced | A7-17 | **Open — operations.** Confirm rotation and no reuse; never expose the value. |
| MI-11 | Reviewer queue truncated after 50 entries | SC-12; A7-10 | **Local pagination implementation recorded; hosted multi-page verification pending.** |
| MI-12 | Yes answer without optional detail looked complete | A7-11 | **Historical local mitigation** flags missing supplemental detail; detail remains optional by design. Review adequacy with product. |
| MI-13 | Submission acknowledgment could predate required consents | A7-12 | **Historical local fix** and snapshot Deno regression; client timestamps do not by themselves prove the customer saw a screen. |
| MI-14 | No automated cross-answer inconsistency flags | SC-08; A7-13 | **Historical partial local mitigation:** specific timeframe contradictions flagged; approximate dates and broader clinical/occupation consistency remain human/product decisions. |
| MI-15 | README misstated whether backend had run in staging | SC-06; A7-14 | **Historical documentation resolution** recorded in [SC-06 note](2026-10-28-sc-06-resolution.md); distinguish staging from production. |
| MI-16 | Documentation claimed delivered state could not regress | A7-15 | **Historical local code/docs correction** with terminal-state checks; live event ordering remains unverified. |
| MI-17 | Gate wording obscured the absence of the in-app MFA step-up | A7-16 | **Historical local docs/flow correction**; real reviewer enrollment remains pending. |
| MI-18 | Held reviewer notes shipped in public JS | QW2-01 | **Historical local fix** and selected bundle guard; related M-11; deployed bundle not verified. |
| MI-19 | Queue fetched full case payloads without per-case open logs | QW2-02 | **Historical local queue projection fix**, not closure of AS-03 direct individual case read. |
| MI-20 | Portal claimed retention/deletion followed an inactive schedule | QW2-03 | **Historical local copy fix**; retention itself remains unapproved/unexecuted (M-14). |
| MI-21 | A6's first pass did not run edge-function tests | SC-07 | **Verification gap closed for that pass:** 36 tests rerun; later snapshot ran 60. Neither run proves hosted behavior. |

## C. Attached-snapshot and working-tree findings (AS-01–AS-09)

**Snapshot:** attached ZIP byte-matched commit `20e0eff79a42d71b8980a5a0489422aa7176892b`; the focused probes reproduced AS-01, AS-02, AS-03 and AS-05 locally. See [snapshot report](2026-10-28-attached-snapshot-audit/REPORT.md), [probe output](2026-10-28-attached-snapshot-audit/evidence/focused-probes.log), and [later DOCX-prompt audit](../.tmp/freebuff-audit-20261028-v2/final/REPORT.md) (the latter is in ignored temporary storage). The later audit's probe exit code 0 means a defect was reproduced, not that product behavior passed.

| ID | Severity / scope | Finding | Current evidence and next action |
|---|---|---|---|
| AS-01 | High; ZIP; reproduced | `Idempotency-Key` absent from CORS allow-headers blocks cross-origin browser submission. | Later uncommitted fix and local test recorded; verify independently and in authorized hosted browser. |
| AS-02 | High; ZIP; conditional; reproduced | Email-only withdrawal leaves the case phone unsuppressed despite call/text context. | Later UI clarifies scope; product/counsel must decide intended withdrawal and verify all channels/vendor before enabling marketing. |
| AS-03 | High; ZIP; reproduced | An authorized AAL2 direct payload read produces no `opened` event. | Later uncommitted migration and local tests recorded; validate direct-read denial, atomic logging and hosted RLS. |
| AS-04 | High; ZIP; static | Privacy notice denies family-member information while questions collect family medical history. | Later draft copy recorded; clinical/counsel approval still required. |
| AS-05 | Medium; ZIP; conditional; reproduced | Replaying a revocation can requeue a synced suppression despite same request ID. | Later uncommitted guard and local coverage recorded; independently test concurrent replay and vendor sync before enabling marketing. |
| AS-06 | Medium; ZIP; static risk | Handler acknowledges an unmatched provider event with 200, so a provider may not retry correlation. | Later local 503 change and handler test recorded; verify actual provider event ordering/recovery. |
| AS-07 | High; ZIP; composite | Questionnaire, legal, retention, vendor, credential and hosted operations evidence missing. | Related MI-01–03, MI-10, M-02–03/M-14. Do not count it as four additional defects. |
| AS-08 | Medium; working tree only | Issued SC-01 decision-record hash no longer matches edited record. | Historical mismatch observed, not independently rechecked in this consolidation; preserve issuance and add attributable integrity evidence without replacing old hash. |
| AS-09 | Medium; working tree only | Available copy-walkthrough evidence did not establish owner participation. | Clarify agent versus owner review and obtain confirmation if required; absence of evidence does not prove absence of participation or negate the separate owner instruction. |

### RISK-01 — Delayed retry outside provider idempotency window

**Suspected / not reproduced; delivery gate.** The snapshot documents a 24-hour provider deduplication window while the retry worker permits cases up to seven days old. An uncertain acceptance followed by a late retry could produce duplicate notification emails. No duplicate or provider-specific terms were independently verified in the audit. **Owner:** engineering/operations. **Acceptance:** verify the provider's current contract and simulate acceptance timeout plus delayed retries with controlled data; document the recovery/escalation strategy. See [snapshot workflow assessment](2026-10-28-attached-snapshot-audit/REPORT.md#4-workflow-and-controls-assessment).

## Source and preservation index

- Early finding evidence and complete A4 crosswalk: [A1–A4 master](2026-10-27-master-issue-list.md), [A1 report](2026-10-27-pre-underwriting-audit.md), [A3 issue register](2026-10-27-qwencloud/qwencloud-issues.md), [A4 report](2026-10-27-freebuff/REPORT.md).
- Later source registers: [A5 Qwencloud re-audit](2026-10-28-qwencloud-reaudit/REPORT.md), [A6 specification issues](2026-10-28-spec-conformance/ISSUES.md), [A7 Freebuff full findings](2026-10-28-freebuff-full/FINDINGS.csv), [A7 report](2026-10-28-freebuff-full/REPORT.md).
- Subsequent local work: [A5 remediation](2026-10-28-qwencloud-remediation/LEDGER.md), [A5–A7 remediation ledger](2026-10-28-master-remediation/LEDGER.md), [attached-snapshot crosswalk and later working-tree notes](2026-10-28-master-issue-list.md#8-attached-snapshot-audit--additive-findings-crosswalk).
- Latest ZIP audit artifacts are [report](../.tmp/freebuff-audit-20261028-v2/final/REPORT.md), [all-source-question matrix](../.tmp/freebuff-audit-20261028-v2/final/QUESTIONNAIRE-MATRIX.md), [launch gates](../.tmp/freebuff-audit-20261028-v2/final/LAUNCH-GATES.md) and [test ledger](../.tmp/freebuff-audit-20261028-v2/final/TEST-LEDGER.md). **These are temporary and ignored; they may be cleaned up.** The separately saved attached-snapshot report and evidence above remain available outside `.tmp`.
- Existing source packages and their manifests are left untouched; the historical [audit index](AUDIT-INDEX.md) documents their provenance. The workspace has pre-existing modifications, including some audit files; this register does not authorize overwriting or committing them.

**Launch condition:** keep real intake locked and marketing off until the relevant engineering fixes are independently verified in the exact deployed build, required human approvals are documented, and synthetic hosted access, delivery, recovery, retention and operational tests pass. This register does not authorize a deployment or certify regulatory compliance.
