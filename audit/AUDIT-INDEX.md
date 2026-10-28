# Audit record index

This file is the entry point for the preserved audit corpus. It records what was audited, at which commit, where the report lives and how the packages relate. It is an index, not an audit.

## Passes

| Pass | Date | Baseline | Report | Finding register | Verdict |
|---|---|---|---|---|---|
| A1 — baseline repository audit | 27 Oct 2026 | `07fdbfe632d48ef363caac086e82b8c2f13277a2` | [`2026-10-27-pre-underwriting-audit.md`](2026-10-27-pre-underwriting-audit.md) | `F-01`–`F-18` (18), also in [`2026-10-27-issue-register.md`](2026-10-27-issue-register.md) | **NOT READY** for real customer health information |
| A2 — Freebuff pre-underwriting prompt pass | 27 Oct 2026 | `07fdbfe632d48ef363caac086e82b8c2f13277a2` | [`archive/2026-10-27-pre-qwencloud/`](archive/2026-10-27-pre-qwencloud/) | No separate register; conditions list preserved | Conditions only |
| A3 — Qwencloud audit | 27 Oct 2026 | `07fdbfe632d48ef363caac086e82b8c2f13277a2` | [`2026-10-27-qwencloud/qwencloud-audit.md`](2026-10-27-qwencloud/qwencloud-audit.md) | `QW-01`–`QW-24` (24) | **NOT READY** for real customer health information |
| A4 — Freebuff independent remediation audit | 27 Oct 2026 | `173b0a0da8c72c7c3ff859a5a441da79e3fed234` | [`2026-10-27-freebuff/REPORT.md`](2026-10-27-freebuff/REPORT.md) | `F-01`–`F-12` (12), plus 24-row master crosswalk | **CONDITIONALLY READY** for a labelled, non-customer preview; **NOT READY** for real customer health information |
| A5 — Qwencloud re-audit | 28 Oct 2026 | `b51ebf9f50040e4a938912012040201a59557eb4` | [`2026-10-28-qwencloud-reaudit/REPORT.md`](2026-10-28-qwencloud-reaudit/REPORT.md) | `QW2-01`–`QW2-03` (3; M-11 reopened) | **NOT READY** for real customer health information |
| A6 — specification conformance review | 28 Oct 2026 | `79e8af4f58ad74914241ef4660f765da105949c9` | [`2026-10-28-spec-conformance/README.md`](2026-10-28-spec-conformance/README.md) | `SC-01`–`SC-12` (12; `SC-07` resolved in-pass) | **SPEC-CONFORMANT for the deterministic customer questionnaire**; **NOT READY** for production or real customer health information |
| A7 — Freebuff full audit | 28 Oct 2026 | `79e8af4f58ad74914241ef4660f765da105949c9` | [`2026-10-28-freebuff-full/REPORT.md`](2026-10-28-freebuff-full/REPORT.md) | `A7-01`–`A7-17` (17; four reproduced) | **NOT READY** for real customer health information; **CONDITIONALLY READY** for a labelled local preview |

The current **full security and delivery** assessment is **A7** at `79e8af4`. **A6** remains the **specification-conformance** assessment at the same commit, and **A5** the three-finding security re-audit at `b51ebf9`. A1–A4 are historical evidence at earlier baselines and must not be read as current status. The consolidated register for A5–A7 is [`2026-10-28-master-issue-list.md`](2026-10-28-master-issue-list.md); the A5/A6 cross-pass register remains [`2026-10-28-spec-conformance/CURRENT-FINDING-REGISTER.md`](2026-10-28-spec-conformance/CURRENT-FINDING-REGISTER.md). The carryover 30-finding A1–A4 list is [`2026-10-27-master-issue-list.md`](2026-10-27-master-issue-list.md), which includes A4's new findings M-25–M-30 and the reopened nested case under M-05. [`MASTER-ISSUE-LIST.md`](MASTER-ISSUE-LIST.md) is the earlier 24-finding A1–A3 consolidation, retained as historical evidence.

A5 re-ran the full audit prompt at `b51ebf9`. The local suite is green, but the re-audit found three open issues: all five held-row review notes remain in the public bundle while `check:bundle` does not probe them (**QW2-01**, reopening **M-11**); the case queue selects full health payloads for 50 cases without an `opened` access entry (**QW2-02**); and the portal claims an active retention schedule that does not exist (**QW2-03**). A5 changes no application code. Its verdict is **NOT READY**; the prior 30-finding ledger is unchanged except M-11 is reopened, and the two new findings make 32 unique findings.

The consolidated register for the three current passes is [`2026-10-28-master-issue-list.md`](2026-10-28-master-issue-list.md) (machine-readable: [`2026-10-28-master-issue-list.csv`](2026-10-28-master-issue-list.csv)). It deduplicates 32 source records into **21 unique issues** — 17 open (5 High, 5 Medium, 7 Low) and 4 resolved — and crosswalks every A5, A6 and A7 ID so none is lost.

A7 is the six-pass Freebuff audit run at `79e8af4`. It re-derives the questionnaire totals, re-runs the local checks, walks the first four customer screens in a browser, probes server authority and delivery state, and reviews the security and lifecycle controls. It records seventeen findings: five High (no production evidence, 0/92 sign-off, absent legal approvals, no in-app TOTP step-up, AI scope conflict), five Medium (a reproduced notification terminal-state regression that can duplicate a send, reproduced contradictory identity acceptance, magic-link account creation, conditional marketing revocation, and an unrotated chat-exposed staging credential) and seven Low. Four findings are reproduced defects (`A7-06`, `A7-07`, `A7-11`, `A7-12`). It changes no application code. Its verdict is **NOT READY** for real customer health information and **CONDITIONALLY READY** for a labelled preview. A7 crosswalks every A6 and carryover ID in its own [finding register](2026-10-28-freebuff-full/README.md#findings) and [`FINDINGS.csv`](2026-10-28-freebuff-full/FINDINGS.csv); it does not rewrite A5 or A6. The A5/A6 cross-pass register remains [`2026-10-28-spec-conformance/CURRENT-FINDING-REGISTER.md`](2026-10-28-spec-conformance/CURRENT-FINDING-REGISTER.md).

A6 compares the attached *Life Policy Pilot — Pre-Underwriting Agent Specification* with the build at `79e8af4`. It finds the deterministic customer flow, consent separation, answer integrity and notification controls implemented, but the secure reviewer path only partly operable. It records twelve issues: the specification's missing AI assistant/AI-generated summary (`SC-01`), the conditional customer-facing marketing-revocation gap (`SC-02`), incomplete production/live verification (`SC-03`), the 0/92 questionnaire sign-off and 28 documented source gaps (`SC-04`), the legal/operational launch gates (`SC-05`), a stale README status line (`SC-06`), the initial Deno test gap (`SC-07`, resolved by a 36/36 re-run), the absence of automated inconsistency flags (`SC-08`), the missing in-app TOTP enrolment/challenge (`SC-09`), accepted contradictory identity answers and out-of-bank field values (`SC-10`), conditional magic-link account creation (`SC-11`), and the 50-case queue truncation (`SC-12`). A6 changes no application code and is not a legal or production approval.

[`2026-10-27-spec-remediation/`](2026-10-27-spec-remediation/) is not another audit. It records the code changes and verification logs produced after A4 while following the product specification. It links the fixed local controls and the gates that remain blocked.

[`2026-10-27-qwencode-remediation/`](2026-10-27-qwencode-remediation/) is the later 30-finding remediation pass. Its [ledger](2026-10-27-qwencode-remediation/LEDGER.md) covers every finding in the current master list, records the three remaining engineering changes (M-11 bundle redaction, M-17 fail-closed rate limiting, M-30 privacy copy) and preserves the full verification logs. It is not another audit.

[`2026-10-28-qwencloud-remediation/`](2026-10-28-qwencloud-remediation/) is the remediation pass for A5. It resolves QW2-01, QW2-02 and QW2-03 locally, including a payload-free `case_summaries` view and a server-only review-note map. Its full suite passes; the hosted deployment, live gates and legal/product blockers remain open. It is not a new audit or a legal approval. Its historical manifest has two stale hashes (`README.md`, `LEDGER.md`); the files are committed and clean, and the mismatch is recorded in the [cross-pass register](2026-10-28-spec-conformance/CURRENT-FINDING-REGISTER.md#manifest-integrity-checked-on-28-october-2026) rather than hidden by regenerating the old manifest. The additive [integrity receipt](2026-10-28-qwencloud-remediation/INTEGRITY-RECEIPT-2026-10-28.md) records the current README and ledger hashes while leaving the historical manifest unchanged.

[`2026-10-28-migration-0005-staging/`](2026-10-28-migration-0005-staging/) records the hosted staging verification of migration 0005. The remote history is at `0005`; the deployed view has no payload or answer columns, `anon` is denied, AAL1 sees zero summaries and AAL2 sees one in a rolled-back test. A live AAL2 HTTP queue response was captured with a labelled temporary reviewer: `200`, one row and the exact nine summary keys. A real staff reviewer still needs enrolment. This is staging evidence only, not a production migration or launch approval.

[`2026-10-28-master-remediation/`](2026-10-28-master-remediation/) is the remediation pass for every finding in the A5–A7 master list. Its [ledger](2026-10-28-master-remediation/LEDGER.md) records 12 locally resolved findings, 3 fixed with a hosted/browser step outstanding and 6 still blocked on named legal, clinical, product or operations decisions. It is not a new audit and does not close a blocked gate. The verification log is preserved with the ledger.

[`2026-10-28-deployment-rehearsal.md`](2026-10-28-deployment-rehearsal.md) records the attempted hosted rehearsal. It is **blocked before deployment**: no Supabase token, linked project, Docker runtime or Resend key was available. It produces no live evidence and does not close any gate.

## What each package contains

- **A1:** full 18-finding report, issue register in Markdown/JSON/CSV, questionnaire matrix and reconciliation decisions.
- **A2:** frozen archive of the two prior lists and their supporting evidence, plus `MANIFEST.sha256`. It is explicitly marked “do not edit”.
- **A3:** full 24-finding report, issue register in Markdown/JSON/CSV, gate matrix, questionnaire matrix, prior-list preservation and raw evidence.
- **A4:** full 12-finding report, master crosswalk, raw command logs, targeted SQL/branch/phone probe outputs, probe sources and `MANIFEST.sha256`.
- **Combined master list:** [`2026-10-27-master-issue-list.md`](2026-10-27-master-issue-list.md) — 30 deduplicated findings across A1, A3 and A4, the A4 crosswalk, consolidated launch conditions and the current local-versus-live status.
- **QwenCode remediation:** [`2026-10-27-qwencode-remediation/`](2026-10-27-qwencode-remediation/) — the 30-finding ledger, code changes and full verification logs produced after the master list.
- **A5 Qwencloud re-audit:** [`2026-10-28-qwencloud-reaudit/`](2026-10-28-qwencloud-reaudit/) — the three-finding re-audit, full local verification log, held-note bundle probe, queue/retention evidence and hash manifest.
- **A5 remediation:** [`2026-10-28-qwencloud-remediation/`](2026-10-28-qwencloud-remediation/) — QW2-01/02/03 fixes, red/green bundle evidence, AAL1/AAL2 queue-view checks and the final remediation ledger.
- **Migration 0005 staging verification:** [`2026-10-28-migration-0005-staging/`](2026-10-28-migration-0005-staging/) — hosted migration history, deployed view/grants, rolled-back AAL1/AAL2 proof, live AAL2 HTTP queue capture and cleanup evidence.
- **A6 specification conformance:** [`2026-10-28-spec-conformance/`](2026-10-28-spec-conformance/) — the PDF-to-build conformance matrix, the twelve-issue register, the exact build/check/test logs, the Deno 36/36 re-run and the source/snapshot hashes. It records what is implemented, the AI requirement conflict, the conditional revocation gap, the missing reviewer MFA step-up, the server-authority residuals and the remaining launch blockers. The [cross-pass register](2026-10-28-spec-conformance/CURRENT-FINDING-REGISTER.md) preserves both A5 and A6 findings and the carryover `M-01`–`M-30` status without rewriting either package.
- **A7 Freebuff full audit:** [`2026-10-28-freebuff-full/`](2026-10-28-freebuff-full/) — the six-pass report, seventeen finding records, independent ten-gate matrix, 25-row test ledger, 14 adversarial scenarios, every fresh command log, the 113-row questionnaire matrix and the reproduced delivery-state probe. It is a single-agent audit and says so.
- **Consolidated master list (A5 + A6 + A7):** [`2026-10-28-master-issue-list.md`](2026-10-28-master-issue-list.md) — 21 unique issues, 17 open and 4 resolved, with severity, type, owner action, launch impact and a full source-ID crosswalk. It is a register, not a new audit.
- **Master remediation:** [`2026-10-28-master-remediation/`](2026-10-28-master-remediation/) — the ledger and full command log for the fixes applied to the 21-finding register: monotonic delivery completion, server identity/prose/chronology checks, in-app TOTP, signup closure, cursor-paginated queue, and corrected launch documentation. Blocked findings keep their exact human action.

## Preservation rules

1. **Do not rewrite a dated package to make a later finding disappear.** Add a new dated package or a clearly labelled consolidation instead.
2. **Do not edit `audit/archive/`.** It is the frozen pre-Qwencloud snapshot.
3. **Keep raw logs with the report.** A summary without its command output is not reproducible evidence.
4. **Record the baseline commit.** A finding is only interpretable against the commit that was audited.
5. **Do not mark a legal, clinical or product gate resolved in an engineering report.** The engineering control and the human approval are separate evidence.
6. **Treat `Resolved — local` as local evidence only.** Live deployment, provider, MFA, cron, backup and browser walkthroughs remain unverified until separately recorded.

## Integrity

Each package carries its own hash manifest:

- [`archive/2026-10-27-pre-qwencloud/MANIFEST.sha256`](archive/2026-10-27-pre-qwencloud/MANIFEST.sha256)
- [`2026-10-27-freebuff/MANIFEST.sha256`](2026-10-27-freebuff/MANIFEST.sha256)
- [`2026-10-27-qwencode-remediation/MANIFEST.sha256`](2026-10-27-qwencode-remediation/MANIFEST.sha256)
- [`2026-10-28-qwencloud-reaudit/MANIFEST.sha256`](2026-10-28-qwencloud-reaudit/MANIFEST.sha256)
- [`2026-10-28-qwencloud-remediation/MANIFEST.sha256`](2026-10-28-qwencloud-remediation/MANIFEST.sha256)
- [`2026-10-28-migration-0005-staging/MANIFEST.sha256`](2026-10-28-migration-0005-staging/MANIFEST.sha256)
- [`2026-10-28-spec-conformance/MANIFEST.sha256`](2026-10-28-spec-conformance/MANIFEST.sha256)
- [`2026-10-28-freebuff-full/MANIFEST.sha256`](2026-10-28-freebuff-full/MANIFEST.sha256)
- [`2026-10-28-master-remediation/MANIFEST.sha256`](2026-10-28-master-remediation/MANIFEST.sha256)

A3 does not currently have a package-level manifest; its raw evidence is preserved under [`2026-10-27-qwencloud/evidence/`](2026-10-27-qwencloud/evidence/).

## Reading order

1. **Consolidated master list** — the 21 unique issues from A5, A6 and A7, their status and the full ID crosswalk.
   - **Master remediation ledger** — what was fixed, what still needs a hosted or browser check, and what remains blocked.
2. **A7 Freebuff full audit** — the current six-pass assessment at `79e8af4`, the seventeen findings, the independent gate matrix and the reproduced delivery-state defect.
3. **A6 specification conformance** — how the attached PDF maps to the build at `79e8af4`, the twelve saved issues, the exact local evidence and the cross-pass A5/A6 register.
4. **A5 Qwencloud security re-audit** — the three-finding security assessment at `b51ebf9`, verification and evidence.
5. **A5 remediation** — the fixes and full local verification for QW2-01, QW2-02 and QW2-03.
6. **Carryover master list (A1–A4)** — 30 historical findings, A4 crosswalk and current local status.
7. **QwenCode remediation ledger** — status and evidence for every prior finding after the latest remediation pass.
8. **A4 report** — post-remediation assessment at `173b0a0` and the conditions that remain open.
9. **A4 README** — finding index, verification table and evidence map.
10. **A3 issue register** — historical detail for the 24 master findings.
11. **A1 report and register** — original baseline findings.
12. **A2 archive** — frozen prior lists and conditions.
