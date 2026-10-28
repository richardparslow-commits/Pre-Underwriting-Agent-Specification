# Audit record index

This file is the entry point for the preserved audit corpus. It records what was audited, at which commit, where the report lives and how the packages relate. It is an index, not an audit.

## Passes

| Pass | Date | Baseline | Report | Finding register | Verdict |
|---|---|---|---|---|---|
| A1 — baseline repository audit | 27 Oct 2026 | `07fdbfe632d48ef363caac086e82b8c2f13277a2` | [`2026-10-27-pre-underwriting-audit.md`](2026-10-27-pre-underwriting-audit.md) | `F-01`–`F-18` (18), also in [`2026-10-27-issue-register.md`](2026-10-27-issue-register.md) | **NOT READY** for real customer health information |
| A2 — Freebuff pre-underwriting prompt pass | 27 Oct 2026 | `07fdbfe632d48ef363caac086e82b8c2f13277a2` | [`archive/2026-10-27-pre-qwencloud/`](archive/2026-10-27-pre-qwencloud/) | No separate register; conditions list preserved | Conditions only |
| A3 — Qwencloud audit | 27 Oct 2026 | `07fdbfe632d48ef363caac086e82b8c2f13277a2` | [`2026-10-27-qwencloud/qwencloud-audit.md`](2026-10-27-qwencloud/qwencloud-audit.md) | `QW-01`–`QW-24` (24) | **NOT READY** for real customer health information |
| A4 — Freebuff independent remediation audit | 27 Oct 2026 | `173b0a0da8c72c7c3ff859a5a441da79e3fed234` | [`2026-10-27-freebuff/REPORT.md`](2026-10-27-freebuff/REPORT.md) | `F-01`–`F-12` (12), plus 24-row master crosswalk | **CONDITIONALLY READY** for a labelled, non-customer preview; **NOT READY** for real customer health information |

The current state of the repository is described by **A4**. A1–A3 are historical evidence at the earlier baseline and must not be read as current status. [`MASTER-ISSUE-LIST.md`](MASTER-ISSUE-LIST.md) is a 24-finding consolidation at the earlier baseline; it does not include A4's new findings F-03, F-05, F-09, F-10, F-11 or F-12, or the reopened nested case under M-05.

## What each package contains

- **A1:** full 18-finding report, issue register in Markdown/JSON/CSV, questionnaire matrix and reconciliation decisions.
- **A2:** frozen archive of the two prior lists and their supporting evidence, plus `MANIFEST.sha256`. It is explicitly marked “do not edit”.
- **A3:** full 24-finding report, issue register in Markdown/JSON/CSV, gate matrix, questionnaire matrix, prior-list preservation and raw evidence.
- **A4:** full 12-finding report, master crosswalk, raw command logs, targeted SQL/branch/phone probe outputs, probe sources and `MANIFEST.sha256`.

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

A3 does not currently have a package-level manifest; its raw evidence is preserved under [`2026-10-27-qwencloud/evidence/`](2026-10-27-qwencloud/evidence/).

## Reading order

1. **A4 report** — current post-remediation assessment and the conditions that remain open.
2. **A4 README** — finding index, verification table and evidence map.
3. **A3 issue register** — historical detail for the 24 master findings.
4. **A1 report and register** — original baseline findings.
5. **A2 archive** — frozen prior lists and conditions.
