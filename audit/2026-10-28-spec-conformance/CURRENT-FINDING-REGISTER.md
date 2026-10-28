# Current finding register — A5 and A6 preserved

**Created:** 28 October 2026  
**Audit baseline:** `main` @ `79e8af4f58ad74914241ef4660f765da105949c9`  
**Purpose:** keep every issue from the current specification-conformance audit (**A6**) and the preceding Qwencloud security re-audit (**A5**) in one discoverable record.  
**Rule:** this is a preservation index, not a new audit. The original reports remain authoritative for their own pass. No finding is removed, merged away or marked resolved without evidence.

**Overall verdict:** **NOT READY to accept real customer health information.** A6 finds the deterministic customer questionnaire substantially conformant, but the live reviewer path is incomplete. A5's local remediation is green; hosted, provider, MFA and legal evidence remain incomplete.

---

## A6 — current specification-conformance audit

**Source register:** [`ISSUES.md`](ISSUES.md)  
**Report:** [`README.md`](README.md)  
**Package:** [`MANIFEST.sha256`](MANIFEST.sha256)  
**Baseline:** `79e8af4`  
**Counts:** 12 findings — High 5, Medium 3, Low 3, Info 1. `SC-07` was a verification gap closed by a 36/36 Deno re-run in this pass.

| ID | Severity | Finding | Current status |
| --- | --- | --- | --- |
| `SC-01` | High — product decision | The specification's AI assistant and AI-generated summary are not implemented; the build is deterministic and labels itself honestly. | Open — amend the specification or approve a model layer |
| `SC-02` | Medium — conditional | No customer-facing marketing revocation, STOP/withdrawal intake, local-time/state enforcement or vendor suppression path. | Open — pre-enable gate; keep marketing off |
| `SC-03` | High — launch blocker | No production migration/function deployment, real staff AAL2 step-up through the app, live provider/inbox test or retention execution. | Open |
| `SC-04` | High — launch blocker | 0 of 92 questionnaire rows are signed off; 28 source gaps and 5 held rows remain. | Open — named reviewer required |
| `SC-05` | High — legal/ops blocker | Legal entity, counsel-approved wording, licensed states, retention, vendor review and mailbox/MFA are unconfirmed. | Open |
| `SC-06` | Low — documentation | Root `README.md` still says the backend has not been run, while staging migration 0005 and an AAL2 queue response are recorded. | Open |
| `SC-07` | Info — verification gap | The first pass could not run Deno. The re-run passed 36/36. | **Closed in this pass** — evidence retained |
| `SC-08` | Low — review-package gap | No automated cross-answer inconsistency or approximate-date flags. | Open — decide whether manual review is the control |
| `SC-09` | **High — launch blocker** | AAL2 is enforced, but the portal has no TOTP enrolment, challenge or verification. A reviewer is routed to an instruction screen with only sign-out; the staging AAL2 proof used direct GoTrue calls. | Open — engineering |
| `SC-10` | Medium — data integrity | The server accepts a questionnaire DOB/state that conflicts with the lead and accepts single-choice field values outside the bank. The probe is [`evidence/identity-and-field-probe.log`](evidence/identity-and-field-probe.log). | Open — engineering |
| `SC-11` | Medium — conditional abuse/config | `signInWithOtp` omits `shouldCreateUser: false`; if hosted signups are enabled, any address can create an Auth user and receive mail, although RLS still blocks case access. | Open — engineering/operations |
| `SC-12` | Low — operational | The reviewer queue silently stops at 50 cases with no pagination or older-case path. | Open — engineering |

A6 did not change application code, questionnaire text, consent wording, migrations or deployments.

---

## A5 — preceding Qwencloud security re-audit

**Original report:** [`../2026-10-28-qwencloud-reaudit/REPORT.md`](../2026-10-28-qwencloud-reaudit/REPORT.md)  
**Original finding index:** [`../2026-10-28-qwencloud-reaudit/README.md`](../2026-10-28-qwencloud-reaudit/README.md)  
**Remediation ledger:** [`../2026-10-28-qwencloud-remediation/LEDGER.md`](../2026-10-28-qwencloud-remediation/LEDGER.md)  
**Baseline:** `b51ebf9`  
**Original count:** 3 findings — Medium 2, Low 1. `QW2-01` reopened carryover `M-11`.

| ID | Severity | Finding | Status after A5 remediation |
| --- | --- | --- | --- |
| `QW2-01` | Medium | All five held-row `reviewNote` strings were in the public bundle, and `check:bundle` did not probe them; reopened `M-11`. | **Resolved — local**; bundle guard and red test recorded. Hosted bundle was not rebuilt in this pass. |
| `QW2-02` | Medium | The reviewer queue selected the full health payload for 50 cases and bypassed the per-case `opened` access entry. | **Resolved — local**; payload-free `case_summaries` view. Migration 0005 and AAL1/AAL2 RLS are verified on staging; hosted client build not inspected. |
| `QW2-03` | Low | The portal claimed retention and deletion followed a schedule while no period or job was approved. | **Resolved — local**; copy now says retention is inactive. No retention period or schedule exists. |

The A5 remediation ledger records the full verification: typecheck, bank/docs/server checks, 7/7 consent, 8/8 engine, 5/5 validation, 36/36 Deno, migrations 0001–0005, build, bundle, reconciliation, `npm audit` and `git diff --check`. The hosted deployment, real staff MFA, provider delivery, webhook recovery, scheduler and retention remain unverified.

---

## Carryover ledger — `M-01`–`M-30`

The earlier 30-finding master list and the A5 remediation ledger remain the authoritative records. They are not reproduced here.

| Status after A5 remediation | Count | Findings |
| --- | ---: | --- |
| Resolved locally | 22 | `M-01`, `M-04`–`M-08`, `M-10`, `M-11`, `M-15`, `M-16`, `M-19`–`M-30` |
| Fixed — pending live verification | 4 | `M-09`, `M-13`, `M-17`, `M-18` |
| Blocked — legal/product/operations | 4 | `M-02`, `M-03`, `M-12`, `M-14` |

- Master list: [`../2026-10-27-master-issue-list.md`](../2026-10-27-master-issue-list.md)
- A5 remediation ledger: [`../2026-10-28-qwencloud-remediation/LEDGER.md`](../2026-10-28-qwencloud-remediation/LEDGER.md)
- `M-11` is the one carryover finding reopened by A5 (`QW2-01`) and re-closed locally by the A5 remediation.
- `M-13` covers the AAL2 policy, but not the missing in-app TOTP challenge; that is the new `SC-09`.

---

## Current launch blockers

The following are not cleared by any green local test:

1. **`SC-09`** — the portal cannot take a real reviewer from AAL1 to AAL2 in the app, so human review is not operable.
2. **`SC-04` / `M-03`** — 0/92 questionnaire rows signed off; seven source windows replaced; 28 gaps.
3. **`SC-05` / `M-02`** — legal entity, notice, intake permission, TCPA, e-signature, sensitive-question and vendor approvals.
4. **`SC-03` / `M-09` / `M-13` / `M-17` / `M-18`** — production deployment, real staff MFA, provider acceptance, signed webhook, scheduler and recovery evidence.
5. **`M-14`** — approved retention period, backup expiry and incident execution.
6. **`M-12` / `SC-02`** — customer revocation and suppression before any marketing channel is enabled.
7. **`SC-10`** — server-side identity and structured-field consistency; should close before live intake.
8. **`SC-11`** — conditional account creation/email abuse if hosted signups are enabled; should close before public launch.
9. **`SC-01`** — product decision on the specification's AI requirement.

`SC-06` is documentation-only. `SC-08` is a review-package gap. `SC-12` is operational and becomes material as volume grows.

---

## Preservation record

- A6 is preserved as a dated package with its own [hash manifest](MANIFEST.sha256).
- A5 is preserved at [`../2026-10-28-qwencloud-reaudit/`](../2026-10-28-qwencloud-reaudit/) and its remediation at [`../2026-10-28-qwencloud-remediation/`](../2026-10-28-qwencloud-remediation/).
- The carryover ledger is preserved at [`../2026-10-27-master-issue-list.md`](../2026-10-27-master-issue-list.md).
- No historical report was rewritten to absorb a later finding. This register adds cross-references only.
- No application code, questionnaire row, consent text, migration or deployment was changed by A6.

### Manifest integrity checked on 28 October 2026

- **A6:** `shasum -a 256 -c MANIFEST.sha256` — all files OK.
- **A5 re-audit:** `shasum -a 256 -c MANIFEST.sha256` — all files OK.
- **A5 remediation:** the historical manifest does **not** match two tracked files. Both files are clean in the working tree; this is stale-manifest drift, not an uncommitted edit.

| File | Historical manifest hash | Current committed hash |
| --- | --- | --- |
| `README.md` | `5c016e97e00040651c3f1fc8c045ce458a7c4b392571fed07e516f0ba2c6d02e` | `77f0a91bd6519eb01135efba97e54ccc1a3a04c7f59d2fa6510698929f5101ed` |
| `LEDGER.md` | `0a8c06696ce6e596704d105fefeb511e699352cad3c1a8ccc47c8a4ef9cb2b6f` | `f053d29035d0dd375dfb98f89b11f93aa4bd24abd619bfb3f123c5ec7f82535a` |

The old A5 remediation manifest is retained unchanged as historical evidence. Do not regenerate it and call the drift fixed; treat the current committed files as the reviewed content and record the mismatch explicitly. The two log files in that package still verify.

This register is not a legal, clinical or compliance approval, and it does not turn any local result into production evidence.
