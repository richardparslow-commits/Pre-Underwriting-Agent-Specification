# Master issue list — three audit passes

**Generated:** 27 October 2026  
**Baseline:** `main` @ `07fdbfe632d48ef363caac086e82b8c2f13277a2`  
**Verdict:** **NOT READY to accept real customer health information.**  
**Scope:** deduplicated union of every finding, condition and evidence gap preserved in this workspace.

This is a consolidation, not a fourth audit. It does not change any finding, close any item or imply a fix. The full evidence remains in the source registers.

> **Historical note:** this list covers A1–A3 only. The post-A4 master list, including the six new Freebuff findings and the current remediation status, is [`2026-10-27-master-issue-list.md`](2026-10-27-master-issue-list.md).

## 1. What the three audit passes actually contain

| Run | Artifact | Finding register | Conditions | Unique finding IDs | Note |
|---|---|---|---|---:|---|
| A1 — Baseline repository audit | [2026-10-27-pre-underwriting-audit.md](2026-10-27-pre-underwriting-audit.md) | F-01–F-18 (18) | C-01–C-12 (report section 12) (12) | 18 | Full report, 18-finding register and questionnaire matrix. |
| A2 — Freebuff Pre-Underwriting Audit Prompt pass | [LIST-2-CONDITIONS.md](archive/2026-10-27-pre-qwencloud/LIST-2-CONDITIONS.md) | No separate finding register preserved (0) | C-01–C-12 (same conditions list) (12) | 0 | The archive records that no separate second finding report was present. No unique IDs were available to merge; this pass is represented by the conditions list. |
| A3 — Qwencloud audit | [qwencloud-audit.md](2026-10-27-qwencloud/qwencloud-audit.md) | QW-01–QW-24 (24) | QC-01–QC-13 (report section 12) (13) | 24 | 18 prior findings reconfirmed at the same commit; 6 new findings. |

**Important provenance limit.** Only two distinct finding registers exist in the preserved corpus: `F-01`–`F-18` (A1) and `QW-01`–`QW-24` (A3). The A2 pass is preserved as the 12-condition list, not as a separate findings list. The archive explicitly records that no separate second finding report was present. This master list therefore unions what exists; it does not invent A2 findings.

## 2. Totals after deduplication

| Measure | Count |
|---|---:|
| Raw finding records preserved (18 F + 24 QW) | 42 |
| Unique findings in this master list | 24 |
| Duplicate records collapsed (F → QW) | 18 |
| High / Medium / Low / Informational | 4 / 10 / 9 / 1 |
| Launch-blocking now | 13 |
| Prior findings reconfirmed in Qwencloud | 18 |
| New findings first recorded in Qwencloud | 6 |
| Raw condition records (12 C + 13 QC) | 25 |
| Consolidated conditions | 13 |
| Preserved evidence gaps | 10 |

### Severity and launch-blocking delta

| Measure | A1 baseline | A3 Qwencloud | Change |
|---|---:|---:|---:|
| High | 3 | 4 | +1 (QW-04) |
| Medium | 7 | 10 | +3 (QW-12, QW-22, QW-23) |
| Low | 7 | 9 | +2 (QW-17, QW-24) |
| Informational | 1 | 1 | 0 |
| Launch-blocking | 10 | 13 | +3 |

A2 added no unique finding IDs; it is represented by the conditions list. The six Qwencloud additions are QW-04, QW-12, QW-17, QW-22, QW-23 and QW-24.

## 3. Canonical findings (24)

| Master | Severity | Finding | Prior | Qwencloud | Launch impact |
|---|---|---|---|---|---|
| M-01 | High | Public submission accepts a fabricated questionnaire snapshot | F-01 | QW-01 | Blocks launch |
| M-02 | High | Consent evidence is client-asserted and not validated against server policy | F-02 | QW-02 | Blocks launch; independently blocks enabling marketing |
| M-03 | High | The questionnaire replaces seven source windows and has no source-verified row | F-14 | QW-03 | Blocks launch; primary blocker |
| M-04 | High | Client-supplied crisis flag and review flags are not re-derived server-side | — | QW-04 | Blocks launch |
| M-05 | Medium | Branch-closed details survive into the submitted record | F-03 | QW-05 | Blocks launch for the answer-integrity gate |
| M-06 | Medium | No submission idempotency; ambiguous retries duplicate cases | F-04 | QW-06 | Blocks launch for the delivery-reliability gate |
| M-07 | Medium | Notification retry can duplicate sends and has no row claiming | F-05 | QW-07 | Blocks launch for the delivery-reliability gate |
| M-08 | Medium | Delivery webhook accepts replay/out-of-order events and can regress status | F-06 | QW-08 | Blocks launch for the delivery-evidence gate |
| M-09 | Medium | Deployment configuration and retry schedule are absent from the repository | F-07 | QW-09 | Blocks deployment and launch |
| M-10 | Medium | No adult/self or jurisdiction verification | F-08 | QW-10 | Blocks launch unless the business accepts the risk in writing |
| M-11 | Medium | Held sensitive source questions are shown verbatim to customers | F-09 | QW-11 | Blocks launch for the sensitive-question gate |
| M-12 | Medium | Marketing revocation and suppression are promised but unimplemented | — | QW-12 | Pre-enable gate; blocks enabling marketing, not the current disabled-channel build |
| M-13 | Medium | Reviewer MFA is enrollment-only; no policy requires an AAL2 session | — | QW-22 | Blocks launch for real customer data |
| M-14 | Medium | No retention, deletion, backup or incident-response control is implemented | — | QW-23 | Blocks launch for real customer data |
| M-15 | Low | Privacy acknowledgement records the wrong notice version | F-10 | QW-13 | Nonblocking independently; fix with QW-02 |
| M-16 | Low | Body cap counts characters, not bytes | F-11 | QW-14 | Nonblocking hardening |
| M-17 | Low | Rate limiting is per-instance and keyed by a spoofable header | F-12 | QW-15 | Nonblocking at low volume with monitoring; relevant before public launch |
| M-18 | Low | not_sent cases are never retried | F-13 | QW-16 | Nonblocking only if no real case is submitted before provider configuration; otherwise operational blocker |
| M-19 | Low | Confirmation says the case was queued when notification was not sent | — | QW-17 | Nonblocking; fix before launch |
| M-20 | Low | Stale and misleading documentation and UI counts | F-15 | QW-18 | Nonblocking; fix before launch |
| M-21 | Low | Dependency and CI supply-chain exposure | F-16 | QW-19 | Nonblocking |
| M-22 | Low | Deno dependencies are unpinned and there is no lockfile | F-17 | QW-20 | Nonblocking |
| M-23 | Low | Live portal never records an 'opened' access entry | — | QW-24 | Nonblocking; fix with access logging |
| M-24 | Informational | Immutability trigger covers the payload but not all evidence metadata | F-18 | QW-21 | Nonblocking hardening |

Full records, evidence links, observed behavior, remediation and acceptance tests are in [`audit/2026-10-27-qwencloud/qwencloud-issues.md`](2026-10-27-qwencloud/qwencloud-issues.md) and the JSON/CSV exports next to it.

## 4. Consolidated conditions (13)

Conditions are acceptance gates, not duplicate findings. `C-*` are the prior 12 conditions; `QC-*` are the Qwencloud 13. Overlaps are merged below.

| Master condition | Requirement | Source conditions | Linked findings | Status |
|---|---|---|---|---|
| MC-01 — Approve the questionnaire before customer use | Every bank row has a named owner/counsel/underwriting decision; the seven replaced windows are restored or explicitly approved; sourceVerified is true only with evidence; QUESTIONNAIRE_VERSION is bumped and the report regenerated. | C-01, QC-02 | M-03, M-20 | OPEN |
| MC-02 — Make the server authoritative for the snapshot and crisis state | The public endpoint rebuilds every answer from a canonical bank and rejects held, unknown, altered, incomplete and stale rows; crisis_disclosure and review flags are derived from the answer set, never trusted from the client. | C-02, QC-03, QC-05 | M-01, M-04 | OPEN |
| MC-03 — Make consent evidence server-owned | Consent IDs, versions, wording hashes, seller/channel policy and receipt time are server-owned; forged marketing/privacy evidence is rejected; the privacy version matches; revocation and suppression are enforced before any channel is enabled. | C-03, QC-04, QC-10 | M-02, M-12, M-15 | OPEN |
| MC-04 — Preserve answer integrity and the adult/self boundary | Branch-closed details are purged from state, payload, summary and portal; adult/self and US-state rules are server-enforced; not_applicable is approved or removed. | C-04, C-09, QC-06 | M-05, M-10 | OPEN |
| MC-05 — Protect review and submission integrity | A forged or stale acknowledgement is rejected server-side; edits invalidate the prior confirmation; one draft creates at most one case. | QC-07 | M-02, M-06 | OPEN |
| MC-06 — Make delivery reliable and evidence trustworthy | Idempotency, claimed/leased retries, provider idempotency, signature-verified/deduplicated/monotonic webhooks, committed JWT/schedule config and honest not_sent copy. | C-05, C-06, C-07, QC-08 | M-06, M-07, M-08, M-09, M-18, M-19 | OPEN |
| MC-07 — Verify secure reviewer access | Live RLS is verified with anonymous, authenticated non-reviewer and reviewer; AAL2 is required; opened access is logged; a forwarded reference alone is denied. | C-08, QC-09 | M-13, M-23 | OPEN |
| MC-08 — Implement data lifecycle and incident controls | Retention/deletion, backup expiry, incident response, revocation/suppression, mailbox ownership and provider settings are documented, implemented and tested. | C-12, QC-10, QC-13 | M-12, M-14 | OPEN |
| MC-09 — Close customer and provider exposure | Held source text is not shown to customers; privacy version is correct; customer/reviewer counts are accurate; bundle/logs/URLs/email/provider settings are re-checked for health data. | C-10, QC-11 | M-11, M-15, M-20 | OPEN |
| MC-10 — Obtain legal and clinical approvals | Counsel approves the entity, privacy notice, intake permission, TCPA disclosure (if any), sensitive-question handling and HIPAA/Texas position; clinical review approves the crisis script. | C-11, QC-12 | M-02, M-03, M-11, M-12 | OPEN |
| MC-11 — Complete operational readiness | Mailbox ownership, sender domain, provider settings, monitoring, on-call, deployment config and a labelled non-customer end-to-end test are confirmed. | C-07, C-12, QC-13 | M-09, M-18, M-19, M-23 | OPEN |
| MC-12 — Pin and reproduce the supply chain | Dependencies are updated, CI actions are SHA-pinned, install scripts reviewed, Deno dependencies pinned and deno.lock committed. | C-07 | M-21, M-22 | OPEN |
| MC-13 — Keep real data out until the blockers close | The environment remains in labelled preview mode; no real applicant data is accepted until all launch-blocking findings and MC-01..MC-12 are closed. | QC-01 | M-01, M-02, M-03, M-04, M-05, M-06, M-07, M-08, M-09, M-10, M-11, M-13, M-14 | OPEN |

## 5. Preserved evidence gaps (10)

These are not confirmed defects. They are areas where the audit could not establish a pass, and they must not be counted as closed.

| ID | Area | Gap | Qwencloud update | Status |
|---|---|---|---|---|
| E-01 | Live Supabase | Migrations, RLS, grants and RPCs verified only in PGlite; no hosted project, schema state, migration history or manual SQL changes inspected. | Qwencloud PGlite replay expanded to 25 checks; hosted project still unavailable. | OPEN |
| E-02 | Deployed functions | verify_jwt, environment variables, origin allowlist, cron schedule, timeouts, memory and observed rate limiting not tested. | Qwencloud confirmed no committed config/schedule; live functions still untested. | OPEN |
| E-03 | Email delivery | No Resend key or mailbox access; provider acceptance, delivery, bounce/complaint handling, webhook signature compatibility, sender-domain authentication and inbox receipt unverified. | Qwencloud probe confirmed recipient allowlist and minimal body; provider/mailbox still untested. | OPEN |
| E-04 | Authentication/MFA | No live auth; MFA is an operational instruction, not an enforced application control; session expiry and cache behavior untested. | Qwencloud found no AAL2 requirement; live sign-in still untested. Promoted: QW-22 / M-13 (enforcement gap); live session still unverified. | OPEN |
| E-05 | Retention/backups/logs | No evidence of configured retention, deletion execution, backup retention, provider log retention, incident response or access audit beyond application tables. | Qwencloud confirmed no retention/deletion/backup/incident control. Promoted: QW-23 / M-14 (control gap); execution still unverified. | OPEN |
| E-06 | Deployment headers | CSP, cache rules and security headers not inspected because no host configuration is in the repository. | — | OPEN |
| E-07 | Accessibility/mobile | Sampled DOM and focus behavior looked sound, but no screen-reader, keyboard-only full walkthrough, contrast measurement or mobile-device session. | Qwencloud did not run a browser/accessibility walkthrough. | OPEN |
| E-08 | Legal | No current primary-law research; TCPA article is secondary; no TCPA or HIPAA compliance conclusion is made. | — | OPEN |
| E-09 | Performance/load | No concurrency, soak or rate-limit evasion test against a deployed endpoint. | — | OPEN |
| E-10 | Question semantics | The 55 matches_source verdicts were not independently re-approved word-by-word; material deviations were sampled and the full matrix is provided. | Qwencloud generated the full 113-item matrix; semantic sign-off still required. | OPEN |

## 6. F → QW crosswalk

| Prior ID | Prior title | Qwencloud ID | Master ID | Severity |
|---|---|---|---|---|
| F-01 | Public submission accepts a fabricated questionnaire snapshot | QW-01 | M-01 | High |
| F-02 | Consent evidence is client-asserted and not validated server-side | QW-02 | M-02 | High |
| F-14 | The questionnaire does not preserve seven source windows and has no approved row | QW-03 | M-03 | High |
| F-03 | Branch-closed details survive into the submitted record | QW-05 | M-05 | Medium |
| F-04 | No submission idempotency; ambiguous retries duplicate cases | QW-06 | M-06 | Medium |
| F-05 | Notification retry can duplicate sends and has no row claiming | QW-07 | M-07 | Medium |
| F-06 | Delivery webhook accepts replay/out-of-order events and can regress status | QW-08 | M-08 | Medium |
| F-07 | Deployment configuration is absent from the repository | QW-09 | M-09 | Medium |
| F-08 | No adult/age or jurisdiction verification | QW-10 | M-10 | Medium |
| F-09 | Held sensitive source questions are shown verbatim to customers | QW-11 | M-11 | Medium |
| F-10 | Privacy acknowledgement records the wrong notice version | QW-13 | M-15 | Low |
| F-11 | Body cap counts characters, not bytes, and is applied after reading when Content-Length is absent | QW-14 | M-16 | Low |
| F-12 | Rate limiting is per-instance and keyed by a spoofable header | QW-15 | M-17 | Low |
| F-13 | not_sent cases are never retried | QW-16 | M-18 | Low |
| F-15 | Stale and misleading documentation and UI counts | QW-18 | M-20 | Low |
| F-16 | Dependency and CI supply-chain exposure | QW-19 | M-21 | Low |
| F-17 | Deno dependencies are unpinned and there is no lockfile | QW-20 | M-22 | Low |
| F-18 | Immutability trigger covers the payload but not all evidence metadata | QW-21 | M-24 | Informational |

## 7. New in Qwencloud

| Master ID | Qwencloud ID | Finding | Severity |
|---|---|---|---|
| M-04 | QW-04 | Client-supplied crisis flag and review flags are not re-derived server-side | High |
| M-12 | QW-12 | Marketing revocation and suppression are promised but unimplemented | Medium |
| M-13 | QW-22 | Reviewer MFA is enrollment-only; no policy requires an AAL2 session | Medium |
| M-14 | QW-23 | No retention, deletion, backup or incident-response control is implemented | Medium |
| M-19 | QW-17 | Confirmation says the case was queued when notification was not sent | Low |
| M-23 | QW-24 | Live portal never records an 'opened' access entry | Low |

## 8. Reading order

1. [`audit/2026-10-27-qwencloud/qwencloud-audit.md`](2026-10-27-qwencloud/qwencloud-audit.md) — current evidence and gate matrix.
2. [`audit/2026-10-27-qwencloud/qwencloud-issues.md`](2026-10-27-qwencloud/qwencloud-issues.md) — full current finding records.
3. [`audit/archive/2026-10-27-pre-qwencloud/LIST-1-FINDINGS.md`](archive/2026-10-27-pre-qwencloud/LIST-1-FINDINGS.md) — prior 18-finding list, untouched.
4. [`audit/archive/2026-10-27-pre-qwencloud/LIST-2-CONDITIONS.md`](archive/2026-10-27-pre-qwencloud/LIST-2-CONDITIONS.md) — prior 12 conditions, untouched.
5. [`audit/2026-10-27-qwencloud/qwencloud-questionnaire-matrix.md`](2026-10-27-qwencloud/qwencloud-questionnaire-matrix.md) — 113 source items / 92 rows.

