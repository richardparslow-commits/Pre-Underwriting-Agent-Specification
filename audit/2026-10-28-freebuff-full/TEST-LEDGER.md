# Test ledger — A7 Freebuff full audit

**Baseline:** `main` @ `79e8af4f58ad74914241ef4660f765da105949c9`  
**Environment:** macOS local checkout; Node `v24.16.0`; npm `11.13.0`; `tsx v4.23.15`; Deno not installed globally, run as `npx --yes deno@2.9.6`; Chromium via the Freebuff preview panel against the local Vite dev server.  
**Rule applied:** every row below was run **in this pass** unless the Environment/Status column says “inherited”. Inherited evidence is linked, never counted as fresh.

## Commands actually run

| # | Command / scenario | Environment | Expected | Actual | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `git rev-parse HEAD`; `git status --short --branch`; diff against preparation commit `07fdbfe` | local | Record exact SHA, branch and tree state | `79e8af4…`; `main...origin/main`; only untracked audit dirs and `.tmp/`; 224 files changed since `07fdbfe` | PASS | [`evidence/baseline.log`](evidence/baseline.log) |
| 2 | `node -v`; `npm -v`; `npx tsx --version`; `deno --version` | local | Runtimes recorded | Node 24.16.0, npm 11.13.0, tsx 4.23.15, `deno: command not found` | PASS (Deno via npx) | [`evidence/baseline.log`](evidence/baseline.log) |
| 3 | `npm ls --depth=0`; `git status package-lock.json package.json` | local | Lockfile-consistent, no drift | 22 top-level packages resolved; lockfile and manifest unmodified | PASS — install **not** re-run; tree was already installed from the committed lockfile | [`evidence/controls-spotcheck.log`](evidence/controls-spotcheck.log) |
| 4 | `npm run typecheck` | local | Exit 0 | Exit 0 | PASS | [`evidence/typecheck.log`](evidence/typecheck.log) |
| 5 | `npm run build` | local | Typecheck + production build | Exit 0; `index-CRsCW4k3.js` 615.65 kB / 170.87 kB gzip; CSS 23.10 kB / 5.60 kB | PASS | [`evidence/build.log`](evidence/build.log) |
| 6 | `npm run check:bank` | local | 92 rows, 0 unacknowledged gaps | 92 rows; 87 approved, 5 held, 0 signed off; 113 source questions, 85 traced, 28 gaps (19 partial, 9 out of scope); 14 branches | PASS (structural) | [`evidence/check-bank.log`](evidence/check-bank.log) |
| 7 | `npm run check:docs` | local | Docs match data | Exit 0; counts match | PASS | [`evidence/check-docs.log`](evidence/check-docs.log) |
| 8 | `npm run check:bundle` | local | No withheld wording or notes in public JS | 1 JS asset; 5 withheld items, 5 reviewer notes, 5 held records absent | PASS | [`evidence/check-bundle.log`](evidence/check-bundle.log) |
| 9 | `npm run check:server-bank` | local | Server bank identical to browser bank | Exit 0 | PASS | [`evidence/check-server-bank.log`](evidence/check-server-bank.log) |
| 10 | `npm run check:server-policy` | local | Consent wording/version match | Exit 0 | PASS | [`evidence/check-server-policy.log`](evidence/check-server-policy.log) |
| 11 | `npm run check:db` | local PGlite | Migrations apply twice; RLS, AAL2, RPCs, queue view, retries, events, revocation, deletion | 57 PASS, `SUMMARY failures=0` | PASS (scoped) | [`evidence/check-db.log`](evidence/check-db.log) |
| 12 | `npm run test:consent` | local Node test | 7/7 | 7 pass, 0 fail | PASS | [`evidence/test-consent.log`](evidence/test-consent.log) |
| 13 | `npm run test:engine` | local Node test | 8/8 | 8 pass, 0 fail | PASS | [`evidence/test-engine.log`](evidence/test-engine.log) |
| 14 | `npm run test:validation` | local Node test | 5/5 | 5 pass, 0 fail | PASS | [`evidence/test-validation.log`](evidence/test-validation.log) |
| 15 | `npx --yes deno@2.9.6 test --allow-env --lock=deno.lock supabase/functions/tests/` | local Deno | All pass | **36 passed, 0 failed** (252 ms) | PASS | [`evidence/deno-tests.log`](evidence/deno-tests.log) |
| 16 | `npm audit --audit-level=high` | local | No high/critical | `found 0 vulnerabilities` | PASS | [`evidence/npm-audit.log`](evidence/npm-audit.log) |
| 17 | `npm run report:reconciliation` in a disposable cwd; `diff -u` committed doc | disposable `.tmp/recon-copy` | Generated doc identical to committed doc | Wrote 92 rows, 92 records, 28 gaps; **NO DIFF** | PASS — no generated-report drift | [`evidence/report-reconciliation.log`](evidence/report-reconciliation.log) |
| 18 | Source fidelity: re-extract PDF, compare hash, compare `sourceInventory.ts` and committed `.txt` | local Python + Node | 113 bullets, no invented text | 113 inventory entries, 113 PDF bullets, 0 absent from PDF, 0 absent from txt, PDF content = txt content, no duplicates, ids sequential | PASS | [`evidence/pdf-extraction.log`](evidence/pdf-extraction.log), [`evidence/source-fidelity.log`](evidence/source-fidelity.log) |
| 19 | Questionnaire matrix regeneration (113 source rows + 28 gap rows) | local tsx | Totals match `check:bank` | 121 matrix rows, 113 unique source ids, 28 gap rows | PASS | [`QUESTIONNAIRE-MATRIX.md`](QUESTIONNAIRE-MATRIX.md), [`questionnaire-summary.json`](questionnaire-summary.json) |
| 20 | Secret scan: tracked tree and **all** commits for secret-like literals; `.env` blob history; bundle JWT literal | local git + grep | No secret values | Only `.env.example` ever added; no `.env` blob; no secret-like literal; no JWT literal in bundle | PASS (locations only; values redacted) | [`evidence/history-secrets.log`](evidence/history-secrets.log), [`evidence/secrets-and-config.log`](evidence/secrets-and-config.log) |
| 21 | Browser walk: `/start` empty submit → fictitious lead → permission → first question | Chromium, local Vite `:8080` | Validation blocks; no marketing box; progress accurate | 5 field alerts + focus; adult attestation alert; permission requires checkbox; no marketing box; `1 / 73` progressbar; DOB prefilled and labelled | PASS — steps 1–4 only | [`evidence/browser-walkthrough.log`](evidence/browser-walkthrough.log) |
| 22 | Server-authority probes: contradictory DOB/state, value-vs-prose, yes-without-detail, forged marketing, `not_applicable`, crisis, chronology, flags | local tsx against the real `validateDraft` | Reject each invalid draft | 4 accepted (DOB/state/value/detail), 1 forge rejected, `not_applicable` rejected, blank text rejected, crisis accepted with derived flags, **acknowledgement preceding consents accepted** | **FAIL as expected** — recorded as `A7-07`, `A7-11`, `A7-12` | [`evidence/server-authority-probes.log`](evidence/server-authority-probes.log) |
| 23 | Marketing-enabled probe: channels on, every box unchecked | local tsx | No marketing record; server rejects an invented one | `marketing_call:false`; server rejects a supplied marketing record | PASS | [`evidence/marketing-enabled-probe.log`](evidence/marketing-enabled-probe.log) |
| 24 | Notification terminal-state probe: delivery event, then late completion (`accepted` and `failed`), then re-claim | local PGlite | Delivered stays terminal; failed does not re-send | `delivered → accepted` (regressed); `delivered → failed` (requeued) and the retry worker **claimed it again**; a repeat delivered event returns `duplicate` | **FAIL** — recorded as `A7-06` | [`evidence/db-terminal-regression.log`](evidence/db-terminal-regression.log) |
| 25 | Control spot-check: recipient/from/subject, body fields, byte cap, durable limiter, retry secret, Svix raw body, session persistence | static | Controls present | Fixed recipient + allowlist; no health data in body; 512 KiB streaming cap; fail-closed durable limiter; `x-cron-secret`; Svix over raw body; `persistSession: true` | PASS (static) | [`evidence/controls-spotcheck.log`](evidence/controls-spotcheck.log) |

## Inherited evidence — not re-run in this pass

| Item | Source | Why it is not fresh | Use in this report |
| --- | --- | --- | --- |
| Hosted migration `0005`, payload-free view, AAL1/AAL2 role proof | [`../2026-10-28-migration-0005-staging/README.md`](../2026-10-28-migration-0005-staging/README.md) | Requires database credentials and a hosted project; no credential was supplied for this pass | Cited only as staging evidence, never as production proof |
| Live AAL2 HTTP queue response | same | same | Cited as staging only |
| Hosted deployment rehearsal | [`../2026-10-28-deployment-rehearsal.md`](../2026-10-28-deployment-rehearsal.md) | Blocked: no Supabase token, linked project, Docker or Resend key | Confirms the deployment gap, not the deployment |
| Prior local suites at earlier commits | A5/A6 packages | Baseline differs | Used only for cross-pass continuity |

## Minimum adversarial scenarios

| # | Scenario | Status | What was actually exercised / limitation |
| --- | --- | --- | --- |
| 1 | Intake completes with marketing disabled/unchecked; no enrolment | **PASS — local** | 7/7 consent tests; browser shows no marketing box; probe with channels on and boxes unchecked produces no marketing record |
| 2 | Missing/declined required permissions rejected through direct API | **PASS — local** | 36/36 Deno tests against the real `submit-case` handler; 422 paths asserted |
| 3 | Forged payload tries disabled marketing consent or altered versions | **PASS — local** | Marketing probe rejected; Deno tests reject wrong consent/privacy versions and duplicate/unknown records |
| 4 | Parent changes after detail entry; orphans disappear downstream | **PASS — local** | 8/8 engine tests, including nested `MIL-01 → MIL-02 → MIL-04`; branch-closed rows rejected server-side if they carry content |
| 5 | Unknown, declined, blank, not asked and held stay distinct; no fabricated No | **PASS — local** | Engine + server canonical rebuild + `check:db` held-row assertions |
| 6 | Review acknowledgment invalidated by edits; forged/stale acknowledgment evaluated server-side | **PARTIAL** | Server stale/forged version assertions pass; UI invalidation inspected statically; browser review path **not** exercised |
| 7 | Held rows, unknown ids, changed timeframes, invented source wording submitted directly | **PASS — local** | Deno validation tests reject held/unknown rows and restore canonical source text |
| 8 | Unauthenticated and authenticated non-reviewer case/correction/RPC access | **PARTIAL** | PGlite denies anon and aal1; staging package records the same on the host; **no real non-allowlisted account** was driven in this pass |
| 9 | Copied notification or guessed reference grants nothing | **PARTIAL** | RLS/AAL2 and reference lookup are checked locally; no live forwarded-email test |
| 10 | Recipient/routing fields and instruction-like answers cannot redirect | **PASS — static; live not run** | Recipient is a server constant; no recipient field is read; no live provider call |
| 11 | Duplicate submissions, ambiguous timeouts, overlapping retries evaluated separately | **PARTIAL** | Idempotency and lease tests pass; **the late-completion race fails** (`A7-06`); no live timeout/concurrency test |
| 12 | Forged, replayed, malformed, out-of-order events cannot create false status | **PARTIAL** | Svix + `apply_email_event` dedupe/monotonicity pass; **the completion path regresses a delivered case** (`A7-06`) |
| 13 | Current-crisis handling when history is No, Unknown or declined | **PASS — local** | 8/8 engine tests and the server probe derive the crisis flag from MH-05 alone |
| 14 | Fictitious sensitive-data canaries across browser/network/log/email | **PARTIAL** | Bundle, docs, secret and email-body checks pass; no live network capture, provider log review or browser canary |

Scenarios 6, 8, 9, 11, 12 and 14 are reported as **PARTIAL**, not passed. Scenario 11 and the event half of 12 contain the reproduced `A7-06` failure.

## Test-quality observations

- **Real handlers, not mirrors.** `submit-case_test.ts` imports and invokes the deployed handler with a stubbed Supabase client; `validate-draft_test.ts` calls the same `validateDraft` that production uses; `check-db.mjs` applies the actual migration SQL to PGlite and asserts RLS/RPC behaviour, not a re-implementation.
- **The gap that matters.** `check-db.mjs` proves monotonicity only through `apply_email_event` (`delivered` cannot be regressed by a later event). It never calls `complete_case_notification` after a delivery, which is why the reproduced regression passed CI.
- **UI coverage is thin.** No component or DOM tests exist for `LeadForm`, `ReviewScreen`, `CaseReview` or the portal MFA gate; the browser walk in this pass covered only the first four screens.
- **Security tests are strong where they exist.** Svix (5 tests), consent (7), engine (8), validation (5), handler (16) and the PGlite suite (57 assertions) are behaviour tests with explicit negative cases.
- **No production test exists at all.** There is no staging end-to-end job, no Playwright suite and no provider sandbox test in CI.
