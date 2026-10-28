# Freebuff independent audit — 27 October 2026

- **Repository:** `richardparslow-commits/Pre-Underwriting-Agent-Specification`
- **Branch:** `main`
- **Audited commit:** `173b0a0da8c72c7c3ff859a5a441da79e3fed234`
- **Audit date:** 27 October 2026
- **Method:** single agent, read-only review; no application, source, test, migration, workflow or configuration file was changed. No deployment, provider call, email, text or production action was performed.
- **Verdict:** **CONDITIONALLY READY FOR A LABELLED, NON-CUSTOMER PREVIEW. NOT READY TO ACCEPT REAL CUSTOMER HEALTH INFORMATION.**

The full report is [`REPORT.md`](REPORT.md). This README preserves the finding index, evidence map and preservation record; it does not replace the report.

## Why this package exists

The report was originally written to the disposable `.tmp/freebuff-audit/final/` workspace. It has been copied into the tracked `audit/` tree so the results survive cleanup and are available to the next reviewer. The report text is unchanged except for two relative links corrected for the new directory depth.

The report's baseline table records the working tree as clean except `.tmp/`. That was true during the audit. This preservation package was added after the audit; it does not change the audited commit or any finding.

The three earlier audit passes are already tracked and were not modified. See [`../AUDIT-INDEX.md`](../AUDIT-INDEX.md).

## Findings

| ID | Severity | Area | Finding | Status |
|---|---|---|---|---|
| F-01 | High | Questionnaire fidelity / legal gate | 0 of 92 bank rows are source-verified; seven source windows were changed; 28 source questions remain partly collected or out of scope. The public function correctly returns 503 until `QUESTIONNAIRE_APPROVED=true`. | **Blocked — Legal/Product** |
| F-02 | Medium | Privacy / sensitive-question handling | Held source wording is not rendered by the customer UI, but it is still present in the public JavaScript bundle because the customer bank and the reconciliation data share one module. | **Blocked — Legal/Product** |
| F-03 | Medium | Supabase RLS / review integrity | An AAL2 reviewer can directly update `cases.status` and directly insert into `case_review_log`, bypassing the atomic `record_case_review` RPC. A local PGlite probe reproduced both writes. | **Open — confirmed by probe; regression not committed** |
| F-04 | Medium | Interview integrity / branch pruning | Closing a parent removes its direct child, but a nested descendant survives in state and reappears with the old answer when the path reopens. `MIL-01 → MIL-02 → MIL-04` reproduces the revival. | **Open — confirmed by probe** |
| F-05 | Low | Server validation / contactability | The public function accepts `phone` or `text` contact preference with no phone, and accepts `abc` as `+`; only the client enforces a usable number. | **Open — confirmed by probe** |
| F-06 | Medium | Consent / TCPA pre-enable | `record_marketing_revocation` and `is_contact_suppressed` exist, but there is no customer-facing withdrawal route, no vendor propagation and no outbound path that checks suppression. Marketing remains disabled. | **Blocked — Product/Operations** |
| F-07 | Medium | Data lifecycle / operations | `retention_months` is null, so `purge_expired_cases()` is a no-op; backup expiry, deletion-from-backup and incident response are runbook text, not executed evidence. | **Blocked — Legal/Operations** |
| F-08 | Low | Operational evidence | Committed function config, lease/claim logic, Svix verification and AAL2 policies are locally tested, but no hosted project, live MFA step-up, Resend receipt, webhook delivery or cron tick was available. | **Fixed locally — pending live verification** |
| F-09 | Low | Configuration / abuse resistance | `README.md` documents `RATE_LIMIT_SALT`, but `.env.example` omits it. Without the salt the durable limiter is skipped and the in-memory fallback is used. | **Open — configuration gap** |
| F-10 | Low | Delivery evidence / reliability | `apply_email_event` records the Svix event before correlating the case. An event that arrives before `provider_message_id` is stored as unmatched; a retry then hits the unique ID as duplicate and never applies the later match. | **Open — static/SQL analysis** |
| F-11 | Low | Documentation / audit honesty | The remediation ledger marks M-02 resolved although counsel approval is open, marks M-11 fixed although held wording remains in the bundle, and says “37 rows” where the data says 92 rows / 0 signed off. | **Open — documentation defect** |
| F-12 | Informational | Privacy copy / evidence gap | The privacy page claims encryption at rest. The repository can prove TLS and access control, but it does not contain hosted-provider evidence for at-rest encryption or key management. | **Documented limitation** |

**Counts:** 12 findings — 1 High, 5 Medium, 5 Low, 1 Informational. F-03, F-05, F-09, F-10, F-11 and F-12 are new records; F-04 reopens the nested case under M-05. The other findings map to the existing master list.

## Master crosswalk

The report's crosswalk covers all 24 master findings: **14 resolved-local, 4 fixed-pending, 5 blocked by legal/product, and 1 open** (M-05 / F-04). “Resolved-local” means the code and local tests prove the control; it does **not** mean the live deployment was verified. F-03, F-05, F-09, F-10, F-11 and F-12 are additional findings outside that 24-row count.

The five blocked rows are M-02 (consent wording approval), M-03 (questionnaire sign-off), M-11 (held-wording bundle policy), M-12 (marketing withdrawal execution) and M-14 (retention/backup/incident execution). The legal/clinical/product gates remain open even where the engineering control is complete.

## Verification actually run

| Check | Result |
|---|---|
| `npm run typecheck` | PASS — no type errors |
| `npm run build` | PASS — only the 671 kB chunk-size warning |
| `npm run check:bank` | PASS — 92 rows, 87 approved, 5 held, 0 signed off; 113 source items, 85 traced, 28 gaps |
| `npm run check:docs` | PASS — documentation counts and stale-claim checks |
| `npm run check:server-bank` | PASS — 92 rows match |
| `npm run check:server-policy` | PASS |
| `npm run test:consent` | PASS — 7 tests |
| `npm run test:engine` | PASS — 6 tests |
| `deno test --allow-env --lock=deno.lock supabase/functions/tests/` | PASS — 32 tests |
| Isolated PGlite replay of migrations 0001–0003 | PASS — idempotent; 0 failures |
| Targeted security/RPC probes | 42 PASS, 0 FAIL; three probes deliberately record direct-write gaps (F-03) |
| `validateDraft` phone probe | Five scenarios accepted, including missing and junk phones (F-05) |
| Nested branch probe | Stale `MIL-04` revived after reopening (F-04) |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| Browser `/start`, `/portal`, direct case route | PASS — required-field focus, honest preview labels, sign-in required; no application console errors |
| Full 92-question browser walkthrough | **NOT RUN** |
| Live Supabase / Resend / MFA / cron / webhook | **NOT RUN** |
| Screen-reader, contrast, keyboard-only, mobile | **NOT RUN** |

The structural checks prove consistency, not legal or clinical approval. The PGlite replay is an isolated database, not the hosted project.

## Evidence map

| Path | Contents |
|---|---|
| [`REPORT.md`](REPORT.md) | Full report: verdict, architecture, findings, questionnaire matrix, gate matrix, test ledger, remediation sequence, owner/counsel questions and conditions. |
| [`evidence/`](evidence/) | Raw typecheck, build, bank, docs, server-bank, policy, consent, engine, Deno, audit and probe logs. |
| [`evidence/sql_probe_security.out`](evidence/sql_probe_security.out) | 42-check PGlite replay and targeted RLS/authorization probes. |
| [`evidence/phone_probe.out`](evidence/phone_probe.out) | Five server phone-validation scenarios. |
| [`evidence/nested-branch-reopen-probe.log`](evidence/nested-branch-reopen-probe.log) | Nested `MIL-04` revival output. |
| [`evidence/probes/`](evidence/probes/) | Reproducible PGlite, branch and phone probe sources. |
| [`INPUT-audit-prompt.txt`](INPUT-audit-prompt.txt) | Prompt used for this pass. |

The probes are preserved as audit evidence, not as committed regression tests. F-03, F-04 and F-05 need repository tests before they can be called fixed.

## Limitations carried forward

No hosted Supabase project, deployed function, Resend key, mailbox, MFA enrolment, webhook delivery, cron tick, custom domain or provider console was available. The audit did not perform legal research, a HIPAA/Texas Insurance Code analysis, a load/soak test, a screen-reader pass or a full 92-question browser walkthrough. Those gaps are recorded in the report and must not be counted as passes.

## Integrity

[`MANIFEST.sha256`](MANIFEST.sha256) records the SHA-256 of every file in this package. The report and raw logs should be treated as immutable audit evidence; add later findings in a new dated package rather than rewriting this one.
