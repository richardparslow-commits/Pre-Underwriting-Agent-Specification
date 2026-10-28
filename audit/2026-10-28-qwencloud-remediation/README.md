# Qwencloud remediation package — 28 October 2026

**Audit basis:** [`../2026-10-28-qwencloud-reaudit/REPORT.md`](../2026-10-28-qwencloud-reaudit/REPORT.md)  
**Ledger:** [`LEDGER.md`](LEDGER.md)  
**Result:** **QW2-01, QW2-02 and QW2-03 resolved locally.** The full local suite passes. This is not a hosted deployment or a legal/compliance approval.

## What changed

| Finding | Change |
|---|---|
| QW2-01 — held review notes in the bundle | Notes moved to `src/features/interview/reviewNotes.server.ts`; removed from the public `Question` type, bank rows, `toSubmittedAnswers` and preview samples. The server-bank generator attaches them only to `bank.generated.ts`. `check:bank` rejects a missing/orphaned note; `check:bundle` probes every held note; `engine.test` asserts no public row carries one. |
| QW2-02 — full payloads in the queue | Added `supabase/migrations/0005_case_summary_view.sql`, a `security_invoker` view with no payload or answer columns. `listCases` now reads `case_summaries`; `getCase` remains the only full-payload path and still records `opened`. `check:db` covers AAL1/AAL2/anonymous behavior; `check:docs` rejects a queue source that references `payload`. |
| QW2-03 — retention overclaim | Portal now says retention is not active and deletion is manual until counsel approves a schedule. `check:docs` requires that copy and forbids the old sentence. |

## Verification

All commands in `LEDGER.md` passed. Key evidence:

- `npm run build` and `npm run check:bundle` — the bundle contains **5 reviewer notes absent** and all five held source/reconciliation items remain absent.
- A deliberate red test injected the ID-04 note into a built asset; `check:bundle` exited 1 with `contains reviewer-only review note for ID-04`. The asset was restored and the green check passed. See [`logs/bundle-red-test.log`](logs/bundle-red-test.log).
- `npm run check:db` replayed migrations 0001–0005 twice with 0 failures. AAL1 sees zero summaries, AAL2 sees the summary with `unanswered = 1`, anonymous is denied, and the view has no payload/answer column.
- `npm run test:engine` — 8/8; Deno — 36/36; consent — 7/7; validation — 5/5.
- `npm run check:docs`, `check:bank`, `check:server-bank`, `check:server-policy`, `report:reconciliation`, `npm audit` and `git diff --check` all pass.

The full raw log is [`logs/full-verification.log`](logs/full-verification.log).

## What is still blocked

- **M-02 / M-03 / M-14 / M-12** remain legal, product or operations blockers. No `sourceVerified` row was set, no held question was approved, no marketing channel was enabled and no retention schedule was created.
- **M-09 / M-13 / M-17 / M-18** still need hosted deployment, live MFA, provider, webhook and scheduler evidence.
- Migration 0005 is **applied on staging** (project `mndgqpoxfupiuqlojpoe`), and the hosted view, grants, `security_invoker` and AAL1/AAL2 RLS boundary are verified in [`../2026-10-28-migration-0005-staging/README.md`](../2026-10-28-migration-0005-staging/README.md). The hosted client build has **not been inspected**, but a live AAL2 HTTP queue response **was captured** with a labelled temporary reviewer: `200`, one row, the exact nine summary keys and no payload. See the staging package.

No secrets were added. The Supabase database password supplied in chat was not written to this package or used for a migration. Treat it as exposed and **rotate it now**; use a separate staging project and a local secret file for the rehearsal, never chat.
