# Qwencloud audit package — 27 October 2026

**Repository:** `richardparslow-commits/Pre-Underwriting-Agent-Specification`  
**Baseline:** `main` @ `07fdbfe632d48ef363caac086e82b8c2f13277a2`  
**Verdict:** **NOT READY to accept real customer health information.** Labelled, fictitious local preview only.

This directory is a read-only audit package. No application, source, test, migration, workflow or configuration file was changed; `git diff` is empty. The only untracked paths are this audit package and the disposable `.tmp/qwencloud/` workspace.

**Master consolidation:** [`../MASTER-ISSUE-LIST.md`](../MASTER-ISSUE-LIST.md) — all 24 unique findings, 13 consolidated conditions and 10 evidence gaps across the three audit passes.

## Read in this order

1. **[`qwencloud-audit.md`](qwencloud-audit.md)** — the report: verdict, baseline, architecture, 13 blocking findings, gate matrix, questionnaire fidelity, test ledger, contradictions, remediation sequence, owner/counsel questions, unverified areas and launch conditions.
2. **[`qwencloud-issues.md`](qwencloud-issues.md)** — all 24 findings with full records. Use this for remediation and regression-test acceptance.
3. **[`qwencloud-questionnaire-matrix.md`](qwencloud-questionnaire-matrix.md)** — all 113 source items and all 92 bank rows, with mapping, verdicts, flags, delivery status and required decisions.
4. **[`PRIOR-LISTS.md`](PRIOR-LISTS.md)** — frozen prior lists and hashes, so the two earlier lists are not lost or silently rewritten.
5. **[`evidence/`](evidence/)** — raw outputs from the fresh checks.

## Quick facts

| Measure | Value |
|---|---:|
| Findings | 24 (4 High, 10 Medium, 9 Low, 1 Informational) |
| Launch-blocking now | 13 |
| Nonblocking / conditional / pre-enable | 11 |
| Prior findings reconfirmed | 18 of 18 |
| New findings | 6 |
| Source items / bank rows | 113 / 92 |
| `sourceVerified` rows | 0 |
| Rows listed for sign-off | 37 |
| Fresh checks | 22 logged in the report's test ledger; unrun scenarios are marked NOT RUN |
| Live environment | None available |

## The four findings to read first

- **QW-01** — the public endpoint accepts a fabricated questionnaire snapshot, including held HIV/visa rows, invented questions, an empty answer set and a client-invented `not_applicable` row.
- **QW-03** — seven source windows were replaced and zero rows have a named source approval; `reviewStatus: approved` is not sign-off.
- **QW-04** — the client controls `crisisDisclosure` and review flags; a forged MH-05 Yes can suppress the urgent path.
- **QW-22/QW-23** — MFA enrollment is not enforcement, and there is no retention/deletion/backup/incident control.

## Prompt limitation

The supplied Qwencloud file is 53 lines / 2,296 bytes and ends at `→ human review` with an unclosed code fence. It specifies the stack and workflow but not the detailed questionnaire, severity, test-command or output requirements. The audit used the owner specification, developer handoff, source PDF and repository launch gates; it did not invent the missing portion. See §1.3 of the report.

## Machine-readable artifacts

| File | Use |
|---|---|
| [`qwencloud-issues.json`](qwencloud-issues.json) | Source of truth for finding IDs/counts. |
| [`qwencloud-issues.csv`](qwencloud-issues.csv) | Spreadsheet export of all finding records. |
| [`qwencloud-findings-index.csv`](qwencloud-findings-index.csv) | Compact severity/gate index. |
| [`qwencloud-gate-matrix.csv`](qwencloud-gate-matrix.csv) | Ten-gate status and reason. |
| [`qwencloud-questionnaire-matrix.csv`](qwencloud-questionnaire-matrix.csv) | 113 source items. |
| [`qwencloud-questionnaire-bank.csv`](qwencloud-questionnaire-bank.csv) | 92 bank rows. |
| [`evidence/questionnaire-summary.json`](evidence/questionnaire-summary.json) | Recomputed counts, verdicts, flags, gaps and decision IDs. |

## Integrity note

The audit package is deliberately untracked. Do not treat it as a committed source of truth until the owner chooses to commit it. The prior lists in `audit/archive/2026-10-27-pre-qwencloud/` are frozen and must not be edited by later audits; write new results outside that directory.
