# Prior-list preservation

The two lists from the earlier audit corpus are frozen under `audit/archive/2026-10-27-pre-qwencloud/`. They were copied before the Qwencloud audit and were not edited by it.

| Prior list | File | Lines | SHA-256 | Contents |
|---|---|---:|---|---|
| List 1 — findings | [`LIST-1-FINDINGS.md`](../archive/2026-10-27-pre-qwencloud/LIST-1-FINDINGS.md) | 559 | `87e9e5a1de45ad9fc0fa7bf675360dfe02c39a2be992079df27ce4bbf79031a2` | 18 findings, F-01–F-18: 0 Critical, 3 High, 7 Medium, 7 Low, 1 Informational. |
| List 2 — conditions | [`LIST-2-CONDITIONS.md`](../archive/2026-10-27-pre-qwencloud/LIST-2-CONDITIONS.md) | 20 | `f63ba19acc7eb1a4e937d861dbeab184166c59e9527bb640140e44870adc39d1` | 12 conditions before accepting real customer submissions. |

The archive also contains the source report, issue-register exports, questionnaire matrix, reconciliation decisions and a SHA-256 manifest. See [`PRESERVATION-INDEX.md`](../archive/2026-10-27-pre-qwencloud/PRESERVATION-INDEX.md).

The deduplicated cross-audit master is [`../MASTER-ISSUE-LIST.md`](../MASTER-ISSUE-LIST.md).

## What “two prior audits” means here

The archive contains two prior **lists**: the findings list and the conditions list. It does **not** contain a separate second independent audit report. The preservation index records that limitation; this audit does not invent a second report or silently relabel the conditions list as one.

## Mapping to the new list

- All 18 prior findings are reconfirmed at the same commit and retain their `F-*` IDs in the new register as `prior_id`.
- Six new findings are added: QW-04, QW-12, QW-17, QW-22, QW-23, QW-24.
- New counts: 24 findings — 4 High, 10 Medium, 9 Low, 1 Informational; 13 launch-blocking.
- The new list is **not** a replacement for the prior lists. It is a fresh reconciliation at the current baseline, with new evidence and new findings.

## Verify

```bash
cd audit/archive/2026-10-27-pre-qwencloud
shasum -a 256 -c MANIFEST.sha256
```

`LIST-1-FINDINGS.md` is byte-identical to `2026-10-27-issue-register.md` by design; their shared hash is expected.
