# QwenCode remediation pass — 27 October 2026

- **Contract:** [`../2026-10-27-master-issue-list.md`](../2026-10-27-master-issue-list.md) (30 deduplicated findings).
- **Repository baseline:** `main` @ `96446f9`, plus the working-tree changes listed below.
- **Scope:** implement every code-resolvable finding; keep legal, clinical, product, vendor and live-environment gates open.
- **Verdict:** **NOT READY for real customer health information.** A labelled, non-customer local preview remains appropriate.

## What this pass changed

| Finding | Change |
|---|---|
| M-11 | Removed verbatim source wording and reviewer reconciliation detail from the customer path. `sourceInventory.ts` and `reconciliation.ts` are now build/audit-only. Generated `sourceIndex.ts` and `questionSourceRefs.ts` carry ids, pages, timeframes and locators only. The server bank continues to attach `sourceText` from its canonical rows. Held customer labels are generic and do not name the withheld topic. |
| M-11 regression | Added `scripts/check-bundle.ts` / `npm run check:bundle`, which scans built JavaScript for the five withheld source items and the five held reconciliation records. CI runs it after the production build. |
| M-17 | `submit-case` now fails closed with 503 when the durable salted limiter is unavailable. The in-memory limiter is used only when `ENVIRONMENT=test`. Added a Deno regression that proves the fail-closed response. |
| M-27 | `.env.example`, README and the deployment checklist now state that a missing salt fails closed; the insecure production fallback is gone. |
| M-30 | The privacy page now claims TLS and access control only. At-rest encryption and key management are explicitly unverified provider controls; `check:docs` forbids the old assertion. |

No legal, clinical, vendor, retention-period or live-deployment gate was marked resolved. No customer data was created, sent, texted or deployed.

## Evidence

- [`LEDGER.md`](LEDGER.md) — every finding with classification, root cause, owner, status, verification and residual risk.
- [`logs/`](logs/) — raw command output for the full verification run.
- [`logs/ALL-CHECKS-PASSED.txt`](logs/ALL-CHECKS-PASSED.txt) — completion marker written only after every command succeeded.
- [`logs/check-bundle.log`](logs/check-bundle.log) — withheld-wording bundle scan.
- [`logs/bundle-phrase-scan.log`](logs/bundle-phrase-scan.log) — exact-phrase scan of the production assets.
- [`logs/deno-tests.log`](logs/deno-tests.log) — 36 server tests, including the fail-closed rate-limit case.

## Verification actually run

| Check | Result |
|---|---|
| `npm ci --ignore-scripts` | PASS — 135 packages, 0 vulnerabilities |
| `npm run typecheck` | PASS |
| `npm run check:bank` | PASS — 92 rows, 87 approved, 5 held, 0 signed off; 113 source items, 85 traced, 28 gaps |
| `npm run check:docs` | PASS |
| `npm run check:server-bank` | PASS — 92 rows |
| `npm run check:server-policy` | PASS |
| `npm run test:consent` | PASS — 7 tests |
| `npm run test:engine` | PASS — 7 tests |
| `npm run test:validation` | PASS — 5 tests |
| `npx deno test --allow-env --lock=deno.lock supabase/functions/tests/` | PASS — 36 tests |
| `npm run check:db` | PASS — 0 failures; migrations 0001–0004 replayed twice |
| `npm run build` | PASS — 616.80 kB JS, 171.21 kB gzip; chunk-size warning only |
| `npm run check:bundle` | PASS — 1 JS asset; 5 withheld source items and 5 held reconciliation records absent |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run report:reconciliation` (twice) | PASS — deterministic output; document updated for the generic held labels |
| `git diff --check` | PASS |

## Still blocked

- **M-03 / MC-01:** 0 of 92 bank rows are source-verified; seven source windows differ; 28 gaps need a named decision.
- **M-02 / MC-10:** counsel approval of the exact consent and disclosure wording.
- **M-14 / MC-08:** approved retention period, backup expiry and incident-response execution.
- **M-12:** customer STOP/withdrawal path and vendor suppression before any marketing channel is enabled.
- **M-09 / M-13 / M-17 / M-18:** hosted deployment, live MFA, provider receipt, signed webhook and cron tick.
- **E-05:** provider at-rest encryption and key-management evidence; the privacy page no longer asserts it.

## Limitations

- The PGlite replay is an isolated database, not the hosted Supabase project.
- No live Supabase, Resend, MFA, cron, custom domain or provider console was available.
- No screen-reader, keyboard-only, contrast, mobile-device, load or soak test was run.
- No independent legal research or compliance conclusion is made.
