# Remediation ledger — Qwencloud re-audit

**Started:** 28 October 2026  
**Audit basis:** [`../2026-10-28-qwencloud-reaudit/REPORT.md`](../2026-10-28-qwencloud-reaudit/REPORT.md)  
**Baseline:** `main` @ `b51ebf9f50040e4a938912012040201a59557eb4` plus the A5 audit package  
**Rule:** `Resolved` means the root cause is fixed, a regression or structural check proves it, the documentation matches, the full local suite passes, and no new issue was introduced. It does not mean a hosted deployment, live MFA, provider delivery, legal approval or retention schedule was verified.

## Scope

This pass remediates the three open findings from A5:

| ID | Severity | Area | Owner | Status |
|---|---|---|---|---|
| QW2-01 | Medium | Privacy / question-bank integrity / build tooling | Engineering | **Resolved** (local evidence) |
| QW2-02 | Medium | Privacy / least privilege / access audit | Engineering | **Resolved** (local evidence) |
| QW2-03 | Low | Documentation / operational honesty | Engineering + Operations | **Resolved** (local evidence) |

QW2-01 reopens and resolves **M-11**; QW2-02 and QW2-03 are new. The prior 30-finding ledger is otherwise carried forward unchanged.

## Finding detail

### QW2-01 — held review notes in the public bundle

- **Evidence:** `src/features/interview/questionBank.ts:186-187, 607-608, 764-765, 1746-1747, 1759-1760`; `dist/assets/index-l3vRgGxf.js`; `scripts/check-bundle.ts:62-72`; `docs/LAUNCH-GATES.md:19`.
- **Description:** every held row’s reviewer note is in the public JavaScript bundle. The bundle guard probes source text and reconciliation flags, but not `reviewNote`.
- **Root cause:** `reviewNote` remained on the client `Question` object and was copied by `toSubmittedAnswers`; the guard never probed it.
- **Classification:** Privacy defect; question-bank integrity; build/tooling defect.
- **Status:** **Resolved** (local engineering evidence).
- **Fix:** moved the five notes to `reviewNotes.server.ts`; removed `reviewNote` from the public `Question` type and rows; stopped copying it in `toSubmittedAnswers`; generator attaches notes to `bank.generated.ts`; `check:bank` requires notes only on the server map; `check:bundle` probes every held note; `engine.test` asserts no public row has the property.
- **Verification:** injected the ID-04 note into a built asset and `check:bundle` exited 1 with “contains reviewer-only review note for ID-04”; restored the asset and the same check passed. Full suite: 8/8 engine tests, 36/36 Deno tests, all structural checks.
- **Remaining risk:** the hosted deployment has not rebuilt the bundle; deploy the source change before any hosted review. The public source and local production build are clean.

### QW2-02 — full payloads in the reviewer queue

- **Evidence:** `src/lib/api.ts:398-420`; `src/lib/api.ts:445-455`; `docs/LAUNCH-GATES.md:17`.
- **Description:** the queue selects `payload` for 50 cases and parses every answer, while only the detail path records `opened`.
- **Root cause:** the queue reuses `CaseRow`/`fromRow` and computes `unanswered` in the browser; there is no summary projection.
- **Classification:** Privacy defect; least-privilege defect; access-audit gap.
- **Status:** **Resolved** (local engineering evidence).
- **Fix:** added `0005_case_summary_view.sql`, a `security_invoker` view exposing only reference, workflow/notification metadata, lead name/state and an unanswered count. `listCases` now reads that view and selects no payload. `getCase` remains the only full-payload path and still records `opened`.
- **Verification:** PGlite replays 0001–0005 twice; AAL1 sees zero summaries, AAL2 sees the summary with `unanswered = 1`, anonymous is denied, the view has no payload/answer columns, and `check:docs` rejects a `listCases` source that references `payload`.
- **Remaining risk:** migration 0005 is applied on staging and the hosted view/grants/AAL1/AAL2 boundary are verified; the hosted client build has not been inspected; a labelled temporary reviewer completed a live AAL2 HTTP queue check (`200`, one row, nine summary keys), but a real staff reviewer still needs enrolment. See [`../2026-10-28-migration-0005-staging/README.md`](../2026-10-28-migration-0005-staging/README.md).

### QW2-03 — retention claim without a schedule

- **Evidence:** `src/features/portal/CaseReview.tsx:623-625`; `docs/OPERATIONS.md:10-13`.
- **Description:** the portal says retention and deletion follow a documented schedule while `retention_months` is null and no job is active.
- **Root cause:** unconditional footer copy written before the retention gate was approved; no check compares the copy with the blocked state.
- **Classification:** Documentation defect; operational honesty.
- **Status:** **Resolved** (local engineering evidence).
- **Fix:** replaced the unconditional footer sentence with “Retention is not active yet: no retention period has been approved. Deletion is manual until counsel approves a schedule.” `check:docs` requires that state and forbids the old sentence.
- **Verification:** `check:docs` passes; the copy matches `docs/OPERATIONS.md:10-13`, where the period and schedule are still blocked.
- **Remaining risk:** no retention period is approved. This fix makes the UI honest; it does not create a deletion schedule or close M-14.

## Carryover status (M-01–M-30)

No prior finding is re-opened except M-11, which QW2-01 tracks. No blocked finding is being marked resolved by this engine.

| Status | Findings |
|---|---|
| Resolved locally (22) | M-01, M-04–M-08, M-10, M-11, M-15, M-16, M-19–M-30 |
| Fixed — pending live verification (4) | M-09, M-13, M-17, M-18 |
| Blocked — legal/product/operations (4) | M-02, M-03, M-12, M-14 |

QW2-02 and QW2-03 are additional resolved local findings. The legal, clinical, retention and hosted-environment gates remain open; this ledger does not change them.

## Verification

All commands were run on 28 October 2026. Raw output is in [`logs/full-verification.log`](logs/full-verification.log); the bundle red test is [`logs/bundle-red-test.log`](logs/bundle-red-test.log).

| Command | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run check:bank` | PASS — 92 rows; 87 approved; 5 held; 0 signed off; 28 gaps; server notes complete |
| `npm run check:docs` | PASS — includes the retention-copy and payload-free-queue guards |
| `npm run check:server-bank` | PASS — 92 rows; notes present only in the server bank |
| `npm run check:server-policy` | PASS |
| `npm run test:consent` | PASS — 7/7 |
| `npm run test:engine` | PASS — 8/8, including no public `reviewNote` |
| `npm run test:validation` | PASS — 5/5 |
| `npx --yes deno@2.9.6 test --allow-env --lock=deno.lock supabase/functions/tests/` | PASS — 36/36 |
| `npm run check:db` | PASS — migrations 0001–0005 replayed twice, 0 failures; AAL1 zero summaries, AAL2 summary, anonymous denied |
| `npm run build` | PASS — 615.65 kB JS, 170.87 kB gzip |
| `npm run check:bundle` | PASS — 5 withheld source items, 5 reviewer notes and 5 held reconciliation records absent |
| Bundle red test | PASS AS A CONTROL — injected ID-04 note makes `check:bundle` exit 1 with the expected failure |
| `npm run report:reconciliation` | PASS — stable |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `git diff --check` | PASS |

### What is not verified

- The hosted 0005 migration, grant inspection, AAL1/AAL2 RLS boundary and live AAL2 PostgREST queue response are recorded in the staging package. The HTTP test used a labelled temporary reviewer.
- No rebuilt hosted bundle; the local production build is clean, but the deployed artifact was not inspected.
- No live MFA enrolment/step-up on a real staff account; the temporary reviewer did complete TOTP enrolment and an AAL1 → AAL2 step-up. No provider send, signed webhook or scheduler tick.
- No approved retention period or schedule; M-14 remains blocked.
- No legal, clinical or compliance approval; M-02 and M-03 remain blocked.
- No customer-facing marketing withdrawal/vendor propagation; M-12 remains blocked.

### Deploy note

Migrations 0001–0005 are applied on the staging project and the AAL1/AAL2/anonymous behavior is verified there. Do not treat that as production evidence; apply them to production only after separate approval and capture a live AAL2 HTTP queue response with a real reviewer.
