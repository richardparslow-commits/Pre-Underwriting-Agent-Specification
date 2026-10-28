# Qwencloud re-audit package — 28 October 2026

**Baseline:** `main` @ `b51ebf9f50040e4a938912012040201a59557eb4`  
**Report:** [`REPORT.md`](REPORT.md)  
**Verdict:** **NOT READY** for real customer health information. Suitable only for a labelled, non-customer preview.

## Finding index

| ID | Severity | Finding | Status |
|---|---|---|---|
| `QW2-01` | Medium | All five held-row `reviewNote` strings are in the public bundle; `check:bundle` does not test them. Reopens M-11. | Open |
| `QW2-02` | Medium | The case queue selects full `payload` for 50 cases and records no `opened` access entry. | Open |
| `QW2-03` | Low | The portal claims retention/deletion follow a schedule while no period or job is approved. | Open |

The prior 30-finding master list is unchanged except that **M-11 is reopened by QW2-01**. The two new findings bring the unique total to **32**. No finding is marked resolved by this pass.

## What this package contains

- [`REPORT.md`](REPORT.md) — full re-audit, verification results, launch-gate assessment, blockers and remediation order.
- [`evidence/verification.log`](evidence/verification.log) — complete local suite output: typecheck, bank/docs/server checks, consent/engine/validation tests, 36 Deno tests, migration replay, build, bundle check, reconciliation and dependency audit.
- [`evidence/held-review-notes.log`](evidence/held-review-notes.log) — bundle probe showing all five held notes are present.
- [`evidence/check-bundle-coverage.log`](evidence/check-bundle-coverage.log) — proof that `check-bundle.ts` never probes `reviewNote`.
- [`evidence/queue-and-retention.log`](evidence/queue-and-retention.log) — queue select, detail `opened` call, retention footer and operations blocked state.
- [`evidence/hosted-anon-probe.log`](evidence/hosted-anon-probe.log) — read-only anonymous probe; DNS did not resolve, so no live RLS evidence.
- [`MANIFEST.sha256`](MANIFEST.sha256) — package integrity hashes.

## Verification summary

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run check:bank` | PASS — 92 rows, 87 approved, 5 held, 0 signed off, 28 gaps |
| `npm run check:docs` | PASS — but does not cover QW2-01/QW2-03 claims |
| `npm run check:server-bank` | PASS |
| `npm run check:server-policy` | PASS |
| `npm run test:consent` | PASS — 7/7 |
| `npm run test:engine` | PASS — 7/7 |
| `npm run test:validation` | PASS — 5/5 |
| Deno 2.9.6 function tests | PASS — 36/36 |
| `npm run check:db` | PASS — migrations 0001–0004 twice, 0 failures |
| `npm run build` | PASS — 616.80 kB JS, 171.21 kB gzip |
| `npm run check:bundle` | **PASS (false negative)** — held review notes present |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| Hosted anonymous probe | **BLOCKED** — `mndgqpoxfupiuqljopoe.supabase.co` did not resolve; no live RLS result |

The green suite is local evidence only. It does not prove hosted migration, MFA, RLS grants, provider delivery, webhook recovery, scheduler execution or retention.

## Credential handling

A Supabase database password was pasted into chat during the audit. It was **not** written to the repository, logs, environment files or command arguments. Treat it as exposed and **rotate it**. No migration was attempted against the supplied project because the screenshot shows it on `main` labelled **PRODUCTION**, not a non-production rehearsal target. A single read-only anonymous probe used the publishable key only; the API host did not resolve, so it produced no live RLS evidence.

The earlier [`../2026-10-28-deployment-rehearsal.md`](../2026-10-28-deployment-rehearsal.md) remains accurate: the hosted rehearsal is blocked before deployment. Use a separate staging project and provide access through a local secret file or terminal session, never chat.

## Preservation

This pass changed **no application code** and no existing audit report. It added this dated package and updated the audit index. The working tree also contains the earlier uncommitted deployment-rehearsal record; that is separate from this report.
