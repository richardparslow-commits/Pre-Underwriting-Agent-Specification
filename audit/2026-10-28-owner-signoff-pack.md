# Owner and counsel sign-off pack

**Date:** 28 October 2026\
**Baseline:** `main` @ `09149fc5be824443c3eba349424e26e1f59e77f6`\
**Purpose:** one request list for every open legal, clinical and operational gate. It is **not** an approval, a legal opinion or a compliance finding.

## How to use this pack

- Each row is an **approval**, a **decision** or an **evidence item**. Nothing here can be closed by engineering alone.
- Record the outcome by adding a dated, attributed file under `audit/` (for example `audit/2026-10-28-signoff-counsel.md`) or by linking a retained signed memo. Do not put credentials, customer data or health answers in the repository.
- State one of **Approve**, **Reject**, **Defer** or **Not applicable**, with the reason. A deferred item stays open and keeps its gate closed.
- Until the relevant rows are recorded, `QUESTIONNAIRE_APPROVED` stays `false`, marketing stays disabled and no production deployment is claimed.

Status legend: **Open** — no artifact yet. **Recorded** — artifact linked in the [consolidated register](2026-10-28-consolidated-master-issues.md).

---

## 1. Counsel — legal decisions

| # | Gate | Decision needed | Evidence that closes it | Status |
|---|---|---|---|---|
| L-1 | Entity and jurisdiction (`MI-03`, `SC-05`) | Name the operating entity, its role (agent/broker), the states it may solicit in, and the carrier relationships. | Dated counsel memo plus the configured `VITE_LEGAL_ENTITY`; the licensed-state list stays empty until this exists. | **Open** |
| L-2 | Consent wording (`M-02`, `MI-03`) | Approve the intake acknowledgment, privacy acknowledgement, TCPA disclosure and e-signature flow. | Counsel-approved final text with version IDs matching `consentTexts.ts` (`2026-10-b` at this baseline), dated and attributed. | **Open** |
| L-3 | Privacy notice (`AS-04`, `MI-03`) | Approve the draft notice now that it discloses family medical history, or direct a different collection scope. | Approved text; if it differs, a new `privacyVersion` and a matching client/server policy update. | **Open** |
| L-4 | Marketing withdrawal scope (`AS-02`, `AS-05`, `MI-09`, `M-12`) | Decide whether an email-only opt-out must also suppress the telephone number, and approve the opt-out wording and STOP handling. | Dated decision plus the approved wording; the form currently states that email-only does not suppress the phone. | **Open** |
| L-5 | Retention and backups (`M-14`, `MI-03`) | Set the retention period, backup expiry handling and deletion-from-backup position. | Approved number of months, written backup position, and permission to set `app_settings.retention_months`. | **Open** |
| L-6 | Regulatory applicability (`SC-05`) | Confirm whether HIPAA, the Texas Insurance Code or another regime applies to the entity and its vendors. | Written analysis. Until then, no compliance claim may appear on any surface. | **Open** |
| L-7 | Vendor review (`MI-03`) | Approve hosting/database (Supabase or Lovable Cloud), email (Resend), auth and any future SMS/CRM vendor, including data location and subprocessors. | Dated vendor list with agreements or DPAs and approved data flows; at-rest encryption and key management confirmed in the provider console. | **Open** |
| L-8 | Specification `1.1` external reliance | Confirm the amendment may be relied on outside engineering. The decision record marks counsel review as not required for engineering issuance. | A short counsel note referencing `2026-10-28-sc-01-specification-v1.1.md` and its hash. | **Open** |

## 2. Clinical/product — questionnaire owner

| # | Gate | Decision needed | Evidence that closes it | Status |
|---|---|---|---|---|
| C-1 | Row-by-row sign-off (`MI-02`, `M-03`, `SC-04`) | Decide all **92** bank rows and set `sourceVerified: true` where approved. Currently 0/92. | The updated reconciliation records plus a dated sign-off naming the reviewer; `npm run check:bank` must report 92/92. | **Open** |
| C-2 | Source version (`MI-02`) | Confirm the committed source PDF is the version the business approved. | Written confirmation citing SHA-256 `afe91d87…82cca2`; a replaced PDF invalidates the reconciliation. | **Open** |
| C-3 | Recorded gaps (`MI-02`, `SC-04`) | Accept or reject each of the **28** gaps (19 partly collected, 9 out of scope). | One decision per gap with the reason; `check:bank` reports 0 unacknowledged. | **Open** |
| C-4 | Held rows (`M-11`, `MI-02`) | Decide `ID-04`, `MED-11`, `MH-06`, `RES-04`, `RES-05`: keep withheld, approve wording, or remove. | Per-row decision, plus jurisdiction and carrier basis for any row approved for asking. | **Open** |
| C-5 | Flag adequacy (`MI-12`, `MI-14`) | Confirm that optional supplemental detail plus the deterministic timeframe-contradiction flags are sufficient, or specify more. | Short decision note; no engineering change is implied unless one is requested. | **Open** |

## 3. Product owner — attribution and scope

| # | Gate | Decision needed | Evidence that closes it | Status |
|---|---|---|---|---|
| O-1 | SC-01 approval artifact (`AS-08`, `AS-09`) | Confirm the revision made after issue and your participation in the copy review. | A dated confirmation recorded additively ([attestation](2026-10-28-sc-01-owner-attestation.md)); this is what allows `SC-01` step 8. | **Recorded** |
| O-2 | Channels actually operated (`MI-09`, `M-12`) | State whether any marketing call, text or email channel is operated. If none, record a dated “no channel operated” decision. | Written decision; `MARKETING_LICENSED_STATES` stays empty unless channels are approved. | **Open** |
| O-3 | Staging credential (`MI-10`) | Confirm the previously exposed staging password was rotated and is not reused. | Dated rotation record without the value, plus confirmation of no reuse. | **Open** |

## 4. Operations — hosted evidence

| # | Gate | Evidence needed | Status |
|---|---|---|---|
| P-1 | Migrations and functions (`MI-01`, `SC-03`, `AS-07`) | Apply `0006`–`0010` to a non-production project, deploy the functions, and record the applied list, function configs and commit. Staging currently has `0001`–`0005` only. | **Open** |
| P-2 | Reviewer access (`AS-03`, `MI-04`, `MI-17`) | A real staff account enrols TOTP, steps up to AAL2, opens a labelled case, and leaves an `opened` event. Capture AAL1 denial, direct REST denial and a logging-failure test. | **Open** |
| P-3 | Auth settings (`MI-08`) | Confirm the hosted project has sign-up disabled, anonymous sign-in off, and a generic magic-link response. | **Open** |
| P-4 | Notification delivery (`RISK-01`, `AS-06`) | One synthetic send with a signed unmatched event returning 503 and later correlating; confirm the provider still documents a 24-hour idempotency window; exercise one backlog review. | **Open** |
| P-5 | Scheduler (`M-09`) | Apply `supabase/ops/retry-schedule.sql` and capture one cron tick and its result. | **Open** |
| P-6 | Retention and backups (`M-14`) | Run deletion and `purge_expired_cases()` against labelled data, and complete one restore drill into an isolated project. | **Open** |
| P-7 | Mailbox and sender (`SC-05`) | Confirm ownership and MFA on `richardparslow@lifepolicypilot.blog`, and approve the Resend sender domain and DNS. | **Open** |
| P-8 | Incident response (`M-14`) | Name the on-call contact path, provider escalation route and notification decision-maker. | **Open** |

## 5. Sign-off block

Complete one row per gate. A signature is not required where a dated, attributed artifact is retained; do not claim a cryptographic signature.

| Gate | Decision (Approve / Reject / Defer / N/A) | Name and role | Date | Artifact path or reference |
|---|---|---|---|---|
| L-1 |  |  |  |  |
| L-2 |  |  |  |  |
| L-3 |  |  |  |  |
| L-4 |  |  |  |  |
| L-5 |  |  |  |  |
| L-6 |  |  |  |  |
| L-7 |  |  |  |  |
| L-8 |  |  |  |  |
| C-1 … C-5 |  |  |  |  |
| O-1 … O-3 | O-1 Approve (A1 + B3); O-2 and O-3 open | Richard Parslow, product/business owner | 2026-10-29 | O-1: [attestation](2026-10-28-sc-01-owner-attestation.md), [closure note](2026-10-28-sc-01-closure-note.md) |
| P-1 … P-8 |  |  |  |  |

## 6. What stays closed until then

- Public intake returns 503 and writes nothing (`QUESTIONNAIRE_APPROVED=false`; 0/92 signed off).
- No marketing call, text or email is sent: channels are disabled and `MARKETING_LICENSED_STATES` is empty.
- `retention_months` is null, so no automatic deletion runs.
- No production deployment, provider delivery, vendor propagation or scheduler tick is claimed.
- The verdict remains **NOT READY** to accept real customer health information.

## 7. Where the evidence lives

- [Counsel brief](2026-10-28-counsel-brief.md) — the four intake-blocking decisions (`L-1` with `L-6`, `L-2`, `L-3`, `L-5`) consolidated for one review, with the exact drafts, the open questions and a response sheet.
- [Consolidated register](2026-10-28-consolidated-master-issues.md) — every finding and the local engineering status.
- [Launch gates](../docs/LAUNCH-GATES.md) — the ten specification acceptance tests and the manual script.
- [Operations runbook](../docs/OPERATIONS.md) — retention, incidents, retries and marketing suppression.
- [Question-bank reconciliation](../docs/question-bank-reconciliation.md) — each row’s flags and required decision.
- [SC-01 decision record](2026-10-28-sc-01-decision-record.md), [integrity receipt](2026-10-28-sc-01-decision-record-integrity.md) and [verification record](2026-10-28-sc-01-verification.md).
