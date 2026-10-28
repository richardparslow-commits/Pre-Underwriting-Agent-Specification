# Master issue list — A5, A6 and A7

**Generated:** 28 October 2026  
**Latest baseline:** `main` @ `79e8af4f58ad74914241ef4660f765da105949c9`  
**Scope:** deduplicated union of the three current finding registers — **A5** Qwencloud re-audit, **A6** specification conformance, **A7** Freebuff full audit.  
**Verdict:** **NOT READY to accept real customer health information.** Suitable only for a labelled, non-customer preview or staging demonstration.

This is a consolidated register, not a new audit. It does not close a finding, override a source report or turn local evidence into live evidence. Severity and status are taken from the most recent register that assessed the issue (A7 for every A6 item it re-tested). The dated source packages remain authoritative for detail.

## 1. Counts

| Measure | Count | Note |
| --- | ---: | --- |
| Source finding records | 32 | A5: 3, A6: 12, A7: 17 |
| Duplicates merged | 11 | Every A7 duplicate maps to an A6 finding (A7 re-confirmed them with fresh evidence) |
| Unique issues | **21** | 17 open + 4 resolved |
| Open | **17** | 5 High, 5 Medium, 7 Low |
| Resolved | 4 | 3 local fixes from A5 remediation; 1 verification gap closed during A6 |
| Reproduced defects still open | 4 | `MI-06`, `MI-07`, `MI-12`, `MI-13` |

A1–A4 are historical. Their 30-finding consolidation remains at [`2026-10-27-master-issue-list.md`](2026-10-27-master-issue-list.md); every substantive blocker it records is carried into `MI-01` (live and retention evidence), `MI-02` (questionnaire), `MI-03` (legal and retention approval) and `MI-09` (marketing revocation). QW2-01 reopened and resolved M-11; that closure is retained as `MI-18`.

## 2. Open findings

### High

| MI | Issue | Source IDs | Type | Next action / owner | Evidence |
| --- | --- | --- | --- | --- | --- |
| **MI-01** | No production deployment, live provider delivery, scheduler, retention execution or real reviewer evidence | `SC-03`, `A7-01` | Operational evidence missing | Deploy to a non-production project with labelled data; run the 13-step script; capture provider and queue evidence. Engineering + owner | [A7-01](2026-10-28-freebuff-full/REPORT.md#a7-01--no-production-deployment-live-provider-retention-execution-or-real-reviewer-evidence) |
| **MI-02** | Questionnaire not signed off: 0/92 rows, 28 recorded gaps (19 partial, 9 out of scope) | `SC-04`, `A7-02` | Business/clinical approval missing | Named reviewer closes every row and out-of-scope reason; `check:bank` must report 92/92. Owner | [A7-02](2026-10-28-freebuff-full/REPORT.md#a7-02--the-questionnaire-is-not-signed-off-28-gaps-and-092-approvals) |
| **MI-03** | Legal entity, counsel-approved wording, licensed states, retention period and vendor review absent | `SC-05`, `A7-03` | Legal/counsel decision | Counsel sign-off as a dated document; configure entity and states; approve retention; review vendors. Owner + counsel | [A7-03](2026-10-28-freebuff-full/REPORT.md#a7-03--legal-entity-counsel-wording-licensed-states-retention-and-vendor-review-are-absent) |
| **MI-04** | Portal requires AAL2 but has no TOTP enrolment or challenge; a real reviewer cannot reach a case in-app | `SC-09`, `A7-04` | Confirmed defect | Add enrol/challenge/verify before `listCases()`; two-session regression test. Engineering | [A7-04](2026-10-28-freebuff-full/REPORT.md#a7-04--the-portal-requires-aal2-but-has-no-totp-enrolment-or-challenge) |
| **MI-05** | Specification's AI assistant, AI identity disclosure and AI-generated draft summary are not implemented | `SC-01`, `A7-05` | Specification conflict / product decision | Amend the specification, or approve a model layer with privacy review. Owner | [A7-05](2026-10-28-freebuff-full/REPORT.md#a7-05--the-specifications-ai-assistant-and-ai-generated-summary-are-not-implemented) |

### Medium

| MI | Issue | Source IDs | Type | Next action / owner | Evidence |
| --- | --- | --- | --- | --- | --- |
| **MI-06** | A delivered notification can regress to `accepted`/`failed`; a late failure re-queues the case and the retry worker can send it again. Repeat delivered events return `duplicate`, so it cannot self-heal | `A7-06` | Confirmed defect — reproduced | Make `complete_case_notification` monotonic; add late-completion `check:db` cases and a no-re-claim assertion. Engineering | [A7-06](2026-10-28-freebuff-full/REPORT.md#a7-06--a-delivered-notification-can-regress-and-a-late-failure-can-trigger-a-duplicate-send), [probe](2026-10-28-freebuff-full/evidence/db-terminal-regression.log) |
| **MI-07** | Server accepts a lead DOB/state that contradicts `ID-01`/`ID-03`, and a choice `answerValues` that contradicts its prose | `SC-10`, `A7-07` | Confirmed defect — reproduced | Cross-field checks in `validateDraft`; three negative handler tests. Engineering | [A7-07](2026-10-28-freebuff-full/REPORT.md#a7-07--the-server-accepts-contradictory-identity-values-and-structuredprose-mismatches) |
| **MI-08** | Magic-link sign-in omits `shouldCreateUser: false`; no `[auth]` block disables sign-ups, while the UI claims allowlist-only | `SC-11`, `A7-08` | Confirmed defect / configuration | Set `shouldCreateUser: false`; disable hosted sign-ups; add a config note. Engineering + operations | [A7-08](2026-10-28-freebuff-full/REPORT.md#a7-08--magic-link-sign-in-can-create-accounts-for-any-address) |
| **MI-09** | No customer-facing marketing revocation; only an operator RPC exists. Channels are currently disabled | `SC-02`, `A7-09` | Future-feature pre-enable gate | Before enabling any channel: customer revocation route plus vendor propagation. Product + operations | [A7-09](2026-10-28-freebuff-full/REPORT.md#a7-09--no-customer-facing-marketing-revocation-path) |
| **MI-10** | Staging database password was pasted into chat and no rotation is recorded | `A7-17` | Operational evidence missing | Rotate, confirm no production reuse, record date and operator. Owner | [A7-17](2026-10-28-freebuff-full/REPORT.md#a7-17--the-staging-database-password-was-pasted-into-chat-and-no-rotation-is-recorded) |

### Low

| MI | Issue | Source IDs | Type | Next action / owner | Evidence |
| --- | --- | --- | --- | --- | --- |
| **MI-11** | Reviewer queue silently stops at 50 cases, with no pagination or count | `SC-12`, `A7-10` | Confirmed defect | Keyset pagination or date filter with an explicit “showing N of M”. Engineering | [A7-10](2026-10-28-freebuff-full/REPORT.md#a7-10--the-reviewer-queue-silently-stops-at-50-cases) |
| **MI-12** | A “Yes” answer with no supplemental detail is accepted where the bank defines detail prompts | `A7-11` | Confirmed defect — reproduced | Require declared details on `yes`, or record an explicit no-detail state. Engineering | [A7-11](2026-10-28-freebuff-full/REPORT.md#a7-11--a-yes-answer-with-no-supplemental-detail-is-accepted-where-the-bank-defines-detail-prompts) |
| **MI-13** | Submission acknowledgement can predate the consents it acknowledges | `A7-12` | Confirmed defect — reproduced | Require acknowledgement ≥ latest consent time and ≤ completion. Engineering | [A7-12](2026-10-28-freebuff-full/REPORT.md#a7-12--the-submission-acknowledgement-can-precede-the-consents-it-acknowledges) |
| **MI-14** | No automated cross-answer inconsistency flags; detection is manual | `SC-08`, `A7-13` | Review-package gap | Add flags for identity, timeframe and occupation/income contradictions. Engineering | [A7-13](2026-10-28-freebuff-full/REPORT.md#a7-13--no-automated-cross-answer-inconsistency-flags) |
| **MI-15** | `README.md` says migrations/functions were never run against a project; staging evidence shows they were | `SC-06`, `A7-14` | Documentation contradiction | Replace with precise staging/production status. Engineering | [A7-14](2026-10-28-freebuff-full/REPORT.md#a7-14--readme-says-the-backend-has-never-been-run-against-a-project) |
| **MI-16** | “A delivered case cannot regress” is false | `A7-15` | Documentation contradiction | Fix `MI-06` first, then keep the claim with a regression test. Engineering | [A7-15](2026-10-28-freebuff-full/REPORT.md#a7-15--a-delivered-case-cannot-regress-is-false) |
| **MI-17** | Launch gate 7 calls staff MFA “unverified” when the in-app step-up does not exist | `A7-16` | Documentation contradiction | Say “not implemented in the portal” until `MI-04` closes. Engineering | [A7-16](2026-10-28-freebuff-full/REPORT.md#a7-16--gate-7-calls-staff-mfa-unverified-when-the-in-app-step-up-does-not-exist) |

## 3. Resolved findings

| MI | Issue | Source | Severity | Resolution | Verified at `79e8af4` |
| --- | --- | --- | --- | --- | --- |
| **MI-18** | All five held-row review notes were in the public bundle; the bundle guard did not probe them (reopened M-11) | `QW2-01` | Medium | Notes moved to `reviewNotes.server.ts`; public `Question` no longer carries them; `check:bundle` probes every note; a red test proved the guard fails on injection | Yes — `check:bundle` passes with 5 notes and 5 held records absent; engine test asserts no public `reviewNote` |
| **MI-19** | Reviewer queue selected full `payload` for 50 cases without an `opened` access entry | `QW2-02` | Medium | Payload-free `case_summaries` view (migration `0005`); `listCases` selects nine metadata fields; full payload only on the individual path, which records `opened` | Yes — `check:db` denies anon, shows 0 summaries at AAL1 and 1 at AAL2; `api.ts` uses the view |
| **MI-20** | Portal claimed retention and deletion follow a schedule that did not exist | `QW2-03` | Low | Footer now says retention is not active and deletion is manual; `check:docs` guards the copy and forbids the old sentence | Yes — copy present; guard present; no retention period approved |
| **MI-21** | Edge-function tests were not run in the A6 first pass | `SC-07` | Informational | Deno 2.9.6 installed via `npx` and the suite run | Yes — 36/36, re-run in A7 |

Resolved means **local engineering evidence only**. It does not verify a hosted deployment, a real reviewer, provider delivery, a scheduler tick or a retention run.

## 4. Crosswalk — every source ID is retained

**A5 (`2026-10-28-qwencloud-reaudit`)**  
`QW2-01` → MI-18 · `QW2-02` → MI-19 · `QW2-03` → MI-20

**A6 (`2026-10-28-spec-conformance`)**  
`SC-01` → MI-05 · `SC-02` → MI-09 · `SC-03` → MI-01 · `SC-04` → MI-02 · `SC-05` → MI-03 · `SC-06` → MI-15 · `SC-07` → MI-21 · `SC-08` → MI-14 · `SC-09` → MI-04 · `SC-10` → MI-07 · `SC-11` → MI-08 · `SC-12` → MI-11

**A7 (`2026-10-28-freebuff-full`)**  
`A7-01` → MI-01 · `A7-02` → MI-02 · `A7-03` → MI-03 · `A7-04` → MI-04 · `A7-05` → MI-05 · `A7-06` → MI-06 · `A7-07` → MI-07 · `A7-08` → MI-08 · `A7-09` → MI-09 · `A7-10` → MI-11 · `A7-11` → MI-12 · `A7-12` → MI-13 · `A7-13` → MI-14 · `A7-14` → MI-15 · `A7-15` → MI-16 · `A7-16` → MI-17 · `A7-17` → MI-10

## 5. Launch roll-up

| Category | Count | IDs |
| --- | ---: | --- |
| Launch conditions — close before any real submission | 11 | MI-01, MI-02, MI-03, MI-04, MI-05, MI-06, MI-07, MI-08, MI-10, MI-12, MI-13 |
| Conditional / pre-enable gate | 1 | MI-09 (only if a marketing channel is enabled) |
| Non-blocking engineering or documentation | 5 | MI-11, MI-14, MI-15, MI-16, MI-17 |
| Closed | 4 | MI-18, MI-19, MI-20, MI-21 |

**Already verified and not to be re-litigated as open:** local build and typecheck; 20 Node tests; 36 Deno tests; 57 database assertions; consent separation with marketing disabled; fixed notification recipient; 512 KiB byte cap; fail-closed durable rate limiting; Svix raw-body verification; RLS and AAL2 enforcement; payload-free queue; append-only corrections; bundle and secret scans; no live provider or production evidence. See the [A7 test ledger](2026-10-28-freebuff-full/TEST-LEDGER.md).

## 6. Minimum set before real customer submissions

1. `MI-06` fixed and regression-tested.
2. `MI-07`, `MI-12`, `MI-13` fixed.
3. `MI-04` delivered and exercised with a real reviewer.
4. `MI-02` closed: 92/92 approvals.
5. `MI-03` closed: entity, counsel wording, states, retention, vendor review.
6. `MI-01` closed: production, provider, scheduler and retention evidence.
7. `MI-08` and `MI-10` closed.
8. `MI-05` decided; `MI-09` closed before any channel is enabled.
9. `MI-15`, `MI-16`, `MI-17` corrected so the recorded status matches the code.

This list does not add a requirement beyond the source registers. It exists so no finding is lost between passes and so the launch decision can be made from one page.

## 7. Preservation

- Source reports: [A5](2026-10-28-qwencloud-reaudit/REPORT.md), [A6](2026-10-28-spec-conformance/README.md), [A7](2026-10-28-freebuff-full/REPORT.md).
- Source issue registers: [A5 README](2026-10-28-qwencloud-reaudit/README.md), [A6 ISSUES](2026-10-28-spec-conformance/ISSUES.md), [A7 FINDINGS](2026-10-28-freebuff-full/FINDINGS.csv).
- Do not rewrite a dated package to make a finding disappear. Add a later package and link it from [`AUDIT-INDEX.md`](AUDIT-INDEX.md).
