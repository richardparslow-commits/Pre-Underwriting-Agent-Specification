# Prior audit preservation index

**Snapshot created:** 27 October 2026, before the Qwencloud audit
**Baseline commit:** `07fdbfe632d48ef363caac086e82b8c2f13277a2` (`main`)
**Status:** frozen archive — do not edit these files or replace them with later results.

This directory preserves the complete audit corpus that existed before the Qwencloud audit, including both prior lists and every supporting appendix. New audit artifacts must be written outside `audit/archive/`.

## The two prior lists

### List 1 — Audit findings (18 items)

**File:** [`LIST-1-FINDINGS.md`](LIST-1-FINDINGS.md) (identical copy of [`2026-10-27-issue-register.md`](2026-10-27-issue-register.md))

Stable IDs `F-01`–`F-18`: 0 Critical, 3 High, 7 Medium, 7 Low, 1 Informational. Ten blocked launch for real customer data at the baseline. The list includes each finding's classification, verification status, evidence, consequence, smallest remediation and acceptance test.

Machine-readable copies:

- [`2026-10-27-issue-register.json`](2026-10-27-issue-register.json)
- [`2026-10-27-issue-register.csv`](2026-10-27-issue-register.csv)

The source report is [`2026-10-27-pre-underwriting-audit.md`](2026-10-27-pre-underwriting-audit.md); its section 4 contains the prose finding records.

### List 2 — Conditions before accepting real customer submissions (12 items)

**File:** [`LIST-2-CONDITIONS.md`](LIST-2-CONDITIONS.md)

Preserved verbatim from section 12 of the source report. It covers questionnaire approval, server-side snapshot and consent validation, orphan-answer removal, idempotency, webhook ordering, deployment configuration, live RLS/MFA, adult/self and state enforcement, held-question exposure, counsel approval, and retention/backup/incident readiness.

## Supporting lists and evidence

| Artifact | Contents |
| --- | --- |
| [`2026-10-27-questionnaire-matrix.md`](2026-10-27-questionnaire-matrix.md) | All 113 source items, 92 bank rows, mappings, verdicts, flags and required decisions |
| [`2026-10-27-reconciliation-decisions.md`](2026-10-27-reconciliation-decisions.md) | 37 rows requiring a named owner/counsel/underwriting decision |
| [`2026-10-27-pre-underwriting-audit.md`](2026-10-27-pre-underwriting-audit.md) | Full report: verdict, architecture, findings, 10-gate matrix, test ledger, contradictions, remediation sequence, 10 evidence gaps, conditions |

The issue register records 10 launch-gate statuses and 10 evidence gaps. Those are part of the same audit corpus and are preserved in `LIST-1-FINDINGS.md` and the source report.

## Integrity

[`MANIFEST.sha256`](MANIFEST.sha256) lists the SHA-256 of every file in this directory except itself. Verify with:

```bash
cd audit/archive/2026-10-27-pre-qwencloud
shasum -a 256 -c MANIFEST.sha256
```

`LIST-1-FINDINGS.md` and `2026-10-27-issue-register.md` are byte-identical by design; their duplicate hash is expected.

## Scope note on the Qwencloud prompt

The supplied prompt is preserved verbatim as [`INPUT-QwencloudPre-Underwriting-Agent.md`](INPUT-QwencloudPre-Underwriting-Agent.md). It is **53 lines / 2,296 bytes** and ends at the workflow line `→ human review` with an unclosed code fence. It contains no detailed questionnaire requirements, test commands, severity definitions, output format or completion criteria after that point. The Qwencloud audit therefore records that missing specification as a limitation and does not invent requirements from it.

## What was not available

No separate second independent audit report was present in this workspace. The two preserved lists above are the findings list and the conditions list from the prior audit corpus. If a different second audit list exists outside this checkout, it was not accessible and has not been recreated or guessed.
