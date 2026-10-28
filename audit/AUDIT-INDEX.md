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

The current state of the repository is described by **A5**. A1–A4 are historical evidence at earlier baselines and must not be read as current status. The current 30-finding combined list is [`2026-10-27-master-issue-list.md`](2026-10-27-master-issue-list.md), which includes A4's new findings M-25–M-30 and the reopened nested case under M-05. [`MASTER-ISSUE-LIST.md`](MASTER-ISSUE-LIST.md) is the earlier 24-finding A1–A3 consolidation, retained as historical evidence.

A5 re-ran the full audit prompt at `b51ebf9`. The local suite is green, but the re-audit found three open issues: all five held-row review notes remain in the public bundle while `check:bundle` does not probe them (**QW2-01**, reopening **M-11**); the case queue selects full health payloads for 50 cases without an `opened` access entry (**QW2-02**); and the portal claims an active retention schedule that does not exist (**QW2-03**). A5 changes no application code. Its verdict is **NOT READY**; the prior 30-finding ledger is unchanged except M-11 is reopened, and the two new findings make 32 unique findings.

[`2026-10-27-spec-remediation/`](2026-10-27-spec-remediation/) is not another audit. It records the code changes and verification logs produced after A4 while following the product specification. It links the fixed local controls and the gates that remain blocked.

[`2026-10-27-qwencode-remediation/`](2026-10-27-qwencode-remediation/) is the later 30-finding remediation pass. Its [ledger](2026-10-27-qwencode-remediation/LEDGER.md) covers every finding in the current master list, records the three remaining engineering changes (M-11 bundle redaction, M-17 fail-closed rate limiting, M-30 privacy copy) and preserves the full verification logs. It is not another audit.

[`2026-10-28-qwencloud-remediation/`](2026-10-28-qwencloud-remediation/) is the remediation pass for A5. It resolves QW2-01, QW2-02 and QW2-03 locally, including a payload-free `case_summaries` view and a server-only review-note map. Its full suite passes; the hosted deployment, live gates and legal/product blockers remain open. It is not a new audit or a legal approval.

[`2026-10-28-migration-0005-staging/`](2026-10-28-migration-0005-staging/) records the hosted staging verification of migration 0005. The remote history is at `0005`; the deployed view has no payload or answer columns, `anon` is denied, AAL1 sees zero summaries and AAL2 sees one in a rolled-back test. A live AAL2 HTTP queue response is still unverified because the project has no reviewer identity. This is staging evidence only, not a production migration or launch approval.

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
- **Migration 0005 staging verification:** [`2026-10-28-migration-0005-staging/`](2026-10-28-migration-0005-staging/) — hosted migration history, deployed view/grants, rolled-back AAL1/AAL2 proof and cleanup evidence.

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

A3 does not currently have a package-level manifest; its raw evidence is preserved under [`2026-10-27-qwencloud/evidence/`](2026-10-27-qwencloud/evidence/).

## Reading order

1. **A5 Qwencloud re-audit** — current three-finding assessment at `b51ebf9`, verification and evidence.
2. **A5 remediation** — the fixes and full local verification for QW2-01, QW2-02 and QW2-03.
3. **Current combined master list** — 30 prior findings, A4 crosswalk, consolidated conditions and current local status.
4. **QwenCode remediation ledger** — status and evidence for every prior finding after the latest remediation pass.
5. **A4 report** — post-remediation assessment at `173b0a0` and the conditions that remain open.
6. **A4 README** — finding index, verification table and evidence map.
7. **A3 issue register** — historical detail for the 24 master findings.
8. **A1 report and register** — original baseline findings.
9. **A2 archive** — frozen prior lists and conditions.
