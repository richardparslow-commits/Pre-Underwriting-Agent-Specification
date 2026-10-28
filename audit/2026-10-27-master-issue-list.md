# Master issue list — all audit passes

**Generated:** 27 October 2026
**Audited baseline:** `main` @ `173b0a0da8c72c7c3ff859a5a441da79e3fed234`
**Remediation checkpoint:** working tree based on `main` @ `96446f9` (see [`2026-10-27-qwencode-remediation/`](2026-10-27-qwencode-remediation/))
**Scope:** deduplicated union of the three finding registers: the baseline audit, the Qwencloud audit and the Freebuff independent audit.
**Verdict:** **NOT READY to accept real customer health information.** The local preview remains suitable only for labelled, non-customer demonstration.

This is a consolidation, not a new audit. It does not close a finding, override a source register or turn a local test into live evidence. “Resolved locally” means the code and a local regression pass exist; it does not mean the hosted deployment, provider, MFA, cron, retention or legal gate was verified.

## 1. Provenance

| Pass | Artifact | Finding register | Raw records | New IDs | Note |
|---|---|---|---:|---:|---|
| A1 — baseline repository audit | [`2026-10-27-pre-underwriting-audit.md`](2026-10-27-pre-underwriting-audit.md) | `F-01`–`F-18` | 18 | 18 | Baseline at `07fdbfe`; full report and issue register. |
| A2 — Freebuff pre-underwriting prompt pass | [`archive/2026-10-27-pre-qwencloud/`](archive/2026-10-27-pre-qwencloud/) | No separate register | 0 | 0 | Conditions-only archive; no finding IDs were invented. |
| A3 — Qwencloud audit | [`2026-10-27-qwencloud/qwencloud-audit.md`](2026-10-27-qwencloud/qwencloud-audit.md) | `QW-01`–`QW-24` | 24 | 6 | 18 prior findings reconfirmed at the same baseline; 6 new. |
| A4 — Freebuff independent audit | [`2026-10-27-freebuff/REPORT.md`](2026-10-27-freebuff/REPORT.md) | `F-01`–`F-12` | 12 | 6 | Post-remediation audit at `173b0a0`; 6 new root causes and 6 reconfirmations/composites. |
| **Total** | | | **54** | **30 unique** | 24 raw records were deduplicated into existing IDs or composite evidence. |

A4 F-08 is an operational-evidence finding, not a new root cause: it maps to M-09, M-13, M-17 and M-18. The six new master IDs from A4 are M-25 through M-30.

### Severity distribution

| Severity | Count |
|---|---:|
| High | 4 |
| Medium | 11 |
| Low | 13 |
| Informational | 2 |
| **Total** | **30** |

### Current blocker summary

| Measure | Count | IDs |
|---|---:|---|
| Hard legal/product/privacy blockers | 3 | M-02, M-03, M-14 |
| Fixed locally, pending live evidence | 4 | M-09, M-13, M-17, M-18 |
| Pre-enable product/operations gate | 1 | M-12 |
| Resolved locally | 22 | all remaining IDs |

“Resolved locally” is not a launch approval. It means the repository has code plus a local regression or structural check; the live environment remains unverified.

## 2. Master findings

### High

| ID | Finding | Raw IDs | Audit status | Current local status | Launch impact |
|---|---|---|---|---|---|
| M-01 | The public endpoint accepted a fabricated questionnaire snapshot, including invented rows and held questions. | A1 F-01; A3 QW-01 | Open at A1/A3 | **Resolved locally** — canonical server bank rebuilds every row; Deno tests reject held, invented, zero-answer and forged-version payloads. | Closed locally; questionnaire sign-off still blocks launch (M-03). |
| M-02 | Consent evidence was client-asserted and not compared with server-owned wording and versions. | A1 F-02; A3 QW-02 | Open at A1/A3 | **Blocked — Legal** — engineering controls complete; server policy and consent tests pass. | Counsel approval of the exact wording remains outstanding. |
| M-03 | The bank replaces seven source windows and has no source-verified row. | A1 F-14; A3 QW-03; A4 F-01 | Open at all three | **Blocked — Legal/Product** — 0/92 signed off; 7 timeframe changes; 28 gaps; live intake returns 503 until `QUESTIONNAIRE_APPROVED=true`. | Primary launch blocker. |
| M-04 | Client-supplied crisis and review flags were trusted instead of derived server-side. | A3 QW-04 | Open at A3 | **Resolved locally** — MH-05 Yes derives the crisis flag and urgent review flag; forged client flags are ignored. | Closed locally. |

### Medium

| ID | Finding | Raw IDs | Audit status | Current local status | Launch impact |
|---|---|---|---|---|---|
| M-05 | Branch-closed detail survived into the submitted record; later review found a nested descendant could revive after the parent reopened. | A1 F-03; A3 QW-05; A4 F-04 | Reopened at A4 | **Resolved locally** — recursive fixed-point pruning; `MIL-01 → MIL-02 → MIL-04` regression; server strips closed-row content. | Closed locally. |
| M-06 | No submission idempotency; ambiguous retries could create duplicate cases. | A1 F-04; A3 QW-06 | Open at A1/A3 | **Resolved locally** — unique idempotency key; replay returns the original receipt; SQL check rejects a duplicate. | Live timeout/concurrency still unverified (E-02). |
| M-07 | Notification retry could duplicate sends and had no row claiming. | A1 F-05; A3 QW-07 | Open at A1/A3 | **Resolved locally** — lease claim; one winner; provider idempotency key; SQL check covers the claim race. | Live provider dedupe still unverified (E-03). |
| M-08 | Delivery webhook accepted replay/out-of-order events and could regress status. | A1 F-06; A3 QW-08 | Open at A1/A3 | **Resolved locally** — Svix signature, event dedupe and monotonic state; delivered is terminal. | Residual unmatched-event race is M-28; live webhook still unverified. |
| M-09 | Deployment configuration and retry schedule were absent from the repository. | A1 F-07; A3 QW-09; A4 F-08 | Open at A1/A3 | **Fixed — Pending Verification** — `config.toml` and Vault-backed schedule are committed. | No clean deploy or cron tick yet. |
| M-10 | No adult/self or jurisdiction verification. | A1 F-08; A3 QW-10 | Open at A1/A3 | **Resolved locally** — DOB age 18+, 51 state codes, adult-self attestation; Deno tests reject minors/non-self. | Licensed-state availability remains a separate product/counsel gate. |
| M-11 | Held sensitive source wording was shown to customers; the UI fix left the wording in the public bundle. | A1 F-09; A3 QW-11; A4 F-02 | Blocked at A4 | **Resolved locally** — customer UI shows only a count/topic; held answers are rejected server-side; public bank carries text-free locators and generic held labels; `check:bundle` proves withheld source wording and held reconciliation detail are absent from production JavaScript, and `check:bank` rejects a held label that names the topic. | Closed locally; whether to ask the held questions remains the questionnaire gate (M-03). |
| M-12 | Marketing revocation and suppression were promised but unimplemented. | A3 QW-12; A4 F-06 | Blocked at A3/A4 | **Blocked — Product/Operations** — reviewer RPC and suppression table exist; marketing stays disabled; no customer STOP path or vendor propagation. | Pre-enable gate; do not enable a channel. |
| M-13 | Reviewer MFA was enrollment-only; no policy required an AAL2 session. | A3 QW-22 | Open at A3 | **Fixed — Pending Verification** — `is_reviewer()` requires AAL2; portal refuses aal1; PGlite proves the denial. | Live MFA enrolment/step-up not exercised. |
| M-14 | No retention, deletion, backup or incident-response control was implemented. | A3 QW-23; A4 F-07 | Blocked at A3/A4 | **Blocked — Legal/Operations** — audited deletion and opt-in expiry exist; `retention_months` stays null. | Retention period, backup expiry and incident execution required. |
| M-25 | An AAL2 reviewer could directly update `cases.status` and insert `case_review_log` rows, bypassing the atomic review RPC. | A4 F-03 | Open at A4 | **Resolved locally** — migration 0004 revokes direct writes and drops the policies; `check:db` proves both denials and the RPC path. | Closed locally; hosted grants still need verification. |

### Low

| ID | Finding | Raw IDs | Audit status | Current local status | Launch impact |
|---|---|---|---|---|---|
| M-15 | Privacy acknowledgement recorded the wrong notice version. | A1 F-10; A3 QW-13 | Open at A1/A3 | **Resolved locally** — separate `privacyVersion`; consent test and server comparison. | Closed locally. |
| M-16 | Body cap counted characters, not bytes, and was checked after reading. | A1 F-11; A3 QW-14 | Open at A1/A3 | **Resolved locally** — streaming byte reader; 300k two-byte test returns 413. | Platform body limit still applies first. |
| M-17 | Rate limiting was per-instance and keyed by a spoofable header. | A1 F-12; A3 QW-15; A4 F-08 | Open at A1/A3 | **Fixed — Pending Verification** — durable salted RPC; production fails closed (503) when it is unavailable; the in-memory guard is test-only. | Trusted client identity still depends on the proxy/WAF; live RPC not exercised. |
| M-18 | `not_sent` cases were never retried. | A1 F-13; A3 QW-16; A4 F-08 | Open at A1/A3 | **Fixed — Pending Verification** — retry includes `not_sent` when configured; lease and backoff. | One real recovery not executed. |
| M-19 | Confirmation said the case was queued when notification was not sent. | A3 QW-17 | Open at A3 | **Resolved locally** — header branches on sent/failed/not_sent; docs check. | Closed locally. |
| M-20 | Stale and misleading documentation and UI counts. | A1 F-15; A3 QW-18 | Open at A1/A3 | **Resolved locally** — `check:docs` recomputes counts and forbids stale claims. | Audit ledger statuses were separately corrected by M-29. |
| M-21 | Dependency and CI supply-chain exposure. | A1 F-16; A3 QW-19 | Open at A1/A3 | **Resolved locally** — Vite/react-router updates; `npm audit` clean; actions SHA-pinned; `npm ci --ignore-scripts`. | Registry availability remains external. |
| M-22 | Deno dependencies were unpinned and there was no lockfile. | A1 F-17; A3 QW-20 | Open at A1/A3 | **Resolved locally** — exact versions and committed `deno.lock`; tests use `--lock`. | Registry availability remains external. |
| M-23 | The live portal never recorded an `opened` access entry. | A3 QW-24 | Open at A3 | **Resolved locally** — `getCase` calls the review RPC; PGlite shows one deduplicated entry. | Live access log not inspected. |
| M-26 | The server accepted phone/text contact preferences without a usable phone and stored `abc` as `+`. | A4 F-05 | Open at A4 | **Resolved locally** — server and lead form require a valid 10/11-digit US number; 5 lead tests and 3 Deno tests. | Closed locally. |
| M-27 | `.env.example` omitted the rate-limit salt and questionnaire launch lock documented elsewhere. | A4 F-09 | Open at A4 | **Resolved locally** — both variables are in `.env.example`; `check:docs` fails if removed; deployment checklist requires the salt, and production fails closed without the durable limiter. | Closed locally. |
| M-28 | An unmatched delivery event consumed its Svix ID before the case was correlated, so a retry could never apply the later match. | A4 F-10 | Open at A4 | **Resolved locally** — migration 0004 retains the unmatched event and re-correlates on retry; `check:db` covers the race. | Live webhook still unverified. |
| M-29 | The remediation ledger overstated M-02 and M-11 and understated M-03's sign-off count (37 vs 92). | A4 F-11 | Open at A4 | **Resolved locally** — ledger now marks M-02 Blocked—Legal, M-11 Blocked—Legal/Product, and M-03 as 92 rows. | Documentation only. |

### Informational

| ID | Finding | Raw IDs | Audit status | Current local status | Launch impact |
|---|---|---|---|---|---|
| M-24 | Case immutability trigger did not cover every evidence column. | A1 F-18; A3 QW-21 | Open at A1/A3 | **Resolved locally** — trigger covers payload, reference, timestamps, version, idempotency key, crisis and residence. | Service role remains powerful by design. |
| M-30 | The privacy page claims encryption at rest without provider evidence in the repository. | A4 F-12 | Documented limitation | **Resolved locally** — copy now claims TLS and access control only; `check:docs` forbids the old at-rest assertion; provider verification remains evidence gap E-05. | Closed locally; confirm provider controls before any at-rest claim is restored. |

## 3. A4 crosswalk

Every A4 finding is accounted for:

| A4 ID | Master | Relationship |
|---|---|---|
| F-01 | M-03 | Reconfirms the open questionnaire gate. |
| F-02 | M-11 | Reconfirms the held-wording/bundle gap. |
| F-03 | M-25 | New — reviewer RLS direct-write gap. |
| F-04 | M-05 | Reopens the nested branch-pruning case. |
| F-05 | M-26 | New — server phone validation gap. |
| F-06 | M-12 | Reconfirms the marketing revocation gate. |
| F-07 | M-14 | Reconfirms the retention/backup/incident gate. |
| F-08 | M-09, M-13, M-17, M-18 | Composite operational-evidence finding; no new root cause. |
| F-09 | M-27 | New — missing rate-limit salt guidance. |
| F-10 | M-28 | New — unmatched delivery-event race. |
| F-11 | M-29 | New — ledger status/count defect. |
| F-12 | M-30 | New informational — at-rest encryption evidence gap. |

## 4. Consolidated launch conditions

| Condition | Requirement | Linked findings | Status |
|---|---|---|---|
| MC-01 | All 92 rows signed off; seven windows restored or approved; 28 gaps decided; version bumped; `QUESTIONNAIRE_APPROVED=true` only then. | M-03 | **OPEN** |
| MC-02 | Server owns the snapshot and derives crisis/review flags. | M-01, M-04 | **CLOSED LOCALLY** |
| MC-03 | Consent wording, versions and seller/channel policy are server-owned; marketing stays off until revocation works. | M-02, M-12, M-15 | **PARTIAL — LEGAL/PRODUCT** |
| MC-04 | Branch-closed detail cannot revive; adult/self and state rules enforced. | M-05, M-10 | **CLOSED LOCALLY** |
| MC-05 | Fresh acknowledgement required; edit invalidates it; one draft creates at most one case. | M-02, M-06 | **CLOSED LOCALLY** |
| MC-06 | Idempotent delivery, leases, provider idempotency, signed/deduped/monotonic webhook, honest copy. | M-06–M-09, M-18, M-19, M-28 | **PARTIAL — LIVE** |
| MC-07 | AAL2 reviewer access; RPC-only status/log writes; forwarded email grants nothing. | M-13, M-23, M-25 | **PARTIAL — LIVE** |
| MC-08 | Approved retention, deletion, backup expiry, incident response, revocation execution. | M-12, M-14 | **BLOCKED** |
| MC-09 | Held wording not exposed to customers, including the bundle; privacy copy accurate. | M-11, M-30 | **CLOSED LOCALLY** |
| MC-10 | Counsel approves entity, notice, intake permission, TCPA, sensitive questions and crisis script. | M-02, M-03, M-11, M-12 | **BLOCKED** |
| MC-11 | Mailbox ownership, sender domain, provider settings, monitoring, on-call and labelled end-to-end test. | M-09, M-18, M-19, M-23 | **OPEN** |
| MC-12 | Pinned dependencies, SHA-pinned CI actions, Deno lockfile and reviewed install scripts. | M-21, M-22 | **CLOSED LOCALLY** |
| MC-13 | Keep the environment labelled preview; accept no real applicant data until the blockers close. | All launch blockers | **IN FORCE** |

## 5. What is actually fixed locally

The following findings have code plus a local regression or structural check. They are not live-verified:

- M-01, M-04, M-05, M-06, M-07, M-08, M-10, M-11, M-15, M-16, M-19, M-20, M-21, M-22, M-23, M-24, M-25, M-26, M-27, M-28, M-29 and M-30.
- M-09, M-13, M-17 and M-18 have code/config and need live evidence.

M-17 now fails closed in production instead of using the per-instance limiter; M-11's locator-only bundle and M-30's softened privacy copy are enforced by `check:bundle` and `check:docs`.

## 6. What remains hard-blocked

1. **M-03 / MC-01:** questionnaire sign-off, seven windows, 28 gaps and `sourceVerified`.
2. **M-02 / MC-10:** counsel approval of consent and disclosure wording.
3. **M-14 / MC-08:** retention period, backup expiry and incident-response execution.
4. **M-12:** customer STOP/withdrawal and vendor suppression before any channel is enabled.
5. **M-09 / M-13 / M-17 / M-18:** hosted deployment, MFA, provider, webhook and cron evidence.

## 7. Source registers and evidence

- A1: [`2026-10-27-pre-underwriting-audit.md`](2026-10-27-pre-underwriting-audit.md), [`2026-10-27-issue-register.md`](2026-10-27-issue-register.md)
- A3: [`2026-10-27-qwencloud/qwencloud-audit.md`](2026-10-27-qwencloud/qwencloud-audit.md), [`qwencloud-issues.md`](2026-10-27-qwencloud/qwencloud-issues.md)
- A4: [`2026-10-27-freebuff/REPORT.md`](2026-10-27-freebuff/REPORT.md), [`README.md`](2026-10-27-freebuff/README.md)
- Remediation evidence: [`2026-10-27-spec-remediation/`](2026-10-27-spec-remediation/)
- Current 30-finding remediation ledger and logs: [`2026-10-27-qwencode-remediation/`](2026-10-27-qwencode-remediation/)
- Earlier ledger (pre-A4, covers M-01–M-24): [`2026-10-27-remediation-ledger.md`](2026-10-27-remediation-ledger.md)

The earlier 24-finding A1–A3 consolidation remains at [`MASTER-ISSUE-LIST.md`](MASTER-ISSUE-LIST.md) as historical evidence. This document supersedes it for the post-A4 status.
