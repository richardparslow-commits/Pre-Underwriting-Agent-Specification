# A7 — Freebuff full audit, 28 October 2026

**Baseline:** `main` @ `79e8af4f58ad74914241ef4660f765da105949c9`  
**Prompt:** *Life Policy Pilot — Freebuff Repository Audit Prompt* (owner `.docx`)  
**Report:** [`REPORT.md`](REPORT.md)  
**Verdict:** **NOT READY for real customer health information.** **CONDITIONALLY READY for a labelled, non-customer local preview/demo.**  
**Code changes:** none. This package is additive; the working tree contains no application edit from this pass.

## What this package is

A7 is the six-pass Freebuff audit run against the current checkout. It re-derives the questionnaire totals, re-runs the local checks, exercises the customer flow in a browser, probes server authority and delivery state, and reviews the security and lifecycle controls. It is a **single-agent** audit: no subagent, parallel workspace or independent browser runner participated. It uses inherited staging evidence where labelled, and never presents it as production proof.

It does not replace A5 (security) or A6 (specification conformance). It adds one reproduced delivery defect (`A7-06`), re-confirms the server-authority and reviewer-MFA gaps, and records seventeen findings with fresh evidence.

## Findings

| ID | Severity | Finding | Status | Crosswalk |
| --- | --- | --- | --- | --- |
| [`A7-01`](REPORT.md#a7-01--no-production-deployment-live-provider-retention-execution-or-real-reviewer-evidence) | High | No production deployment, live provider, retention execution or real reviewer evidence | Open — operational | SC-03 |
| [`A7-02`](REPORT.md#a7-02--the-questionnaire-is-not-signed-off-28-gaps-and-092-approvals) | High | Questionnaire not signed off: 0/92, 28 gaps | Open — business | SC-04 |
| [`A7-03`](REPORT.md#a7-03--legal-entity-counsel-wording-licensed-states-retention-and-vendor-review-are-absent) | High | Legal entity, counsel wording, licensed states, retention, vendor review absent | Open — legal | SC-05 |
| [`A7-04`](REPORT.md#a7-04--the-portal-requires-aal2-but-has-no-totp-enrolment-or-challenge) | High | Portal requires AAL2 but has no TOTP enrolment or challenge | Open — engineering | SC-09 |
| [`A7-05`](REPORT.md#a7-05--the-specifications-ai-assistant-and-ai-generated-summary-are-not-implemented) | High | Specification's AI assistant and AI summary not implemented | Open — product decision | SC-01 |
| [`A7-06`](REPORT.md#a7-06--a-delivered-notification-can-regress-and-a-late-failure-can-trigger-a-duplicate-send) | Medium | Delivered notification can regress; late failure can trigger a duplicate send | **Reproduced** — engineering | New |
| [`A7-07`](REPORT.md#a7-07--the-server-accepts-contradictory-identity-values-and-structuredprose-mismatches) | Medium | Server accepts contradictory identity values and value/prose mismatches | **Reproduced** — engineering | SC-10 |
| [`A7-08`](REPORT.md#a7-08--magic-link-sign-in-can-create-accounts-for-any-address) | Medium | Magic-link sign-in can create accounts for any address | Open — config | SC-11 |
| [`A7-09`](REPORT.md#a7-09--no-customer-facing-marketing-revocation-path) | Medium | No customer-facing marketing revocation | Open — pre-enable gate | SC-02 |
| [`A7-17`](REPORT.md#a7-17--the-staging-database-password-was-pasted-into-chat-and-no-rotation-is-recorded) | Medium | Chat-exposed staging database password; no rotation recorded | Open — operations | New |
| [`A7-10`](REPORT.md#a7-10--the-reviewer-queue-silently-stops-at-50-cases) | Low | Reviewer queue silently stops at 50 cases | Open — engineering | SC-12 |
| [`A7-11`](REPORT.md#a7-11--a-yes-answer-with-no-supplemental-detail-is-accepted-where-the-bank-defines-detail-prompts) | Low | “Yes” with no supplemental detail accepted | **Reproduced** — engineering | New |
| [`A7-12`](REPORT.md#a7-12--the-submission-acknowledgement-can-precede-the-consents-it-acknowledges) | Low | Acknowledgement can precede the consents it acknowledges | **Reproduced** — engineering | New |
| [`A7-13`](REPORT.md#a7-13--no-automated-cross-answer-inconsistency-flags) | Low | No automated cross-answer inconsistency flags | Open — review package | SC-08 |
| [`A7-14`](REPORT.md#a7-14--readme-says-the-backend-has-never-been-run-against-a-project) | Low | README says the backend was never run against a project | Open — docs | SC-06 |
| [`A7-15`](REPORT.md#a7-15--a-delivered-case-cannot-regress-is-false) | Low | “A delivered case cannot regress” is false | Open — docs | New |
| [`A7-16`](REPORT.md#a7-16--gate-7-calls-staff-mfa-unverified-when-the-in-app-step-up-does-not-exist) | Low | Gate 7 calls staff MFA “unverified” when the step-up does not exist | Open — docs | New |

**Totals:** 17 findings — 5 High, 5 Medium, 7 Low. Four are reproduced defects (`A7-06`, `A7-07`, `A7-11`, `A7-12`).

## Verification in this pass

| Check | Result |
| --- | --- |
| Typecheck, build | PASS (615.65 kB JS / 170.87 kB gzip) |
| `check:bank`, `check:docs`, `check:bundle`, `check:server-bank`, `check:server-policy` | PASS |
| `check:db` | 57 assertions, 0 failures |
| Node suites | 20/20 (7 consent, 8 engine, 5 validation) |
| Deno edge suite | 36/36 |
| `npm audit --audit-level=high` | 0 vulnerabilities |
| Reconciliation regeneration in a disposable copy | No diff |
| PDF ↔ text ↔ inventory fidelity | 113/113, no invented text |
| Secret scan, tree and all commits | No secret-like literal; only `.env.example` ever tracked |
| Browser walk, steps 1–4 | Validation, no marketing box, `1 / 73` progress |
| Notification race probe | **FAIL** — delivered regressed; duplicate send claimable (`A7-06`) |
| Server-authority probes | **FAIL as expected** — four contradictions accepted (`A7-07`, `A7-11`, `A7-12`) |

Screenshots were not captured: the desktop window was not drawn, so `preview_screenshot` refused. DOM/accessibility snapshots were used instead.

## Package contents

| File | Purpose |
| --- | --- |
| [`REPORT.md`](REPORT.md) | Full report: verdict, baseline, architecture, 17 finding records, documentation contradictions, remediation sequence, owner questions, unverified areas, launch conditions |
| [`LAUNCH-GATE-MATRIX.md`](LAUNCH-GATE-MATRIX.md) | Independent ten-gate assessment and sensitive-question register |
| [`TEST-LEDGER.md`](TEST-LEDGER.md) | 25 command/scenario rows, inherited-evidence table and the 14 adversarial scenarios |
| [`QUESTIONNAIRE-MATRIX.md`](QUESTIONNAIRE-MATRIX.md) / [`.csv`](QUESTIONNAIRE-MATRIX.csv) | Every source question, mapping, verdict, flag and gap; 121 rows, no truncation |
| [`questionnaire-summary.json`](questionnaire-summary.json) | Machine-readable totals |
| [`FINDINGS.csv`](FINDINGS.csv) | Finding register for cross-pass tooling |
| [`MANIFEST.sha256`](MANIFEST.sha256) | Integrity manifest for this package |
| [`evidence/`](evidence/) | Raw logs for every fresh check and probe |

## Preservation

This package is dated and additive. Do not rewrite it to make a later finding disappear; add a later package and link it from [`../AUDIT-INDEX.md`](../AUDIT-INDEX.md). The probe sources live in the untracked `.tmp/audit-2026-10-28/probes/`; their outputs are preserved here because `.tmp/` is disposable.

**Raw evidence index**

- `baseline.log` — commit, tree, diff from preparation commit, runtimes, source hashes
- `typecheck.log`, `build.log` — compile and bundle
- `check-bank.log`, `check-docs.log`, `check-bundle.log`, `check-server-bank.log`, `check-server-policy.log` — project checks
- `check-db.log` — PGlite migrations, RLS/AAL2, RPCs, queue view, retries, events, deletion
- `test-consent.log`, `test-engine.log`, `test-validation.log`, `deno-tests.log` — suites
- `npm-audit.log` — dependency audit
- `report-reconciliation.log` — disposable regeneration and diff
- `pdf-extraction.log`, `source-fidelity.log` — source verification
- `bank-kinds.log` — question kinds, branches and detail counts
- `secrets-and-config.log`, `history-secrets.log` — secret scan and configuration
- `server-authority-probes.log` — ten forged/edge drafts
- `marketing-enabled-probe.log` — forged marketing record rejected
- `db-notification-race.log`, `db-terminal-regression.log` — delivery-state race
- `browser-walkthrough.log` — local preview walk, steps 1–4
- `controls-spotcheck.log` — recipient, byte cap, limiter, webhook, session
