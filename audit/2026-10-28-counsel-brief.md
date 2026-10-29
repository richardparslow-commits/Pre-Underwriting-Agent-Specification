# Counsel brief — four decisions before intake opens

**Prepared for:** counsel for Life Policy Pilot · **Prepared by:** engineering
**Date:** 28 October 2026 · **Baseline:** `main` @ `09149fc5be824443c3eba349424e26e1f59e77f6`
**Status:** request for legal advice. This is a factual brief and a question list, not legal advice, and it does not create an attorney-client relationship.

**Source of the gates:** [owner and counsel sign-off pack](2026-10-28-owner-signoff-pack.md), rows `L-1`–`L-8`; [launch gates](../docs/LAUNCH-GATES.md); [consolidated register](2026-10-28-consolidated-master-issues.md) (`MI-03`, `AS-04`).

---

## 1. What we are asking for

Four decisions, answerable in one review, that currently keep the customer intake closed. Each is a question of law or approval that engineering cannot answer, and each already has a drafted artifact waiting for an answer.

| # | Decision | Pack rows | What stays closed until answered |
|---|---|---|---|
| **Q1** | Who is the legal seller, in what role, and in which states may the interview be offered — and which privacy/health regimes apply? | `L-1`, `L-6` | Entity configuration, the intake state restriction, all consent copy |
| **Q2** | May the intake, privacy-acknowledgement and submission texts be used as drafted, on a checkbox-plus-timestamp signature? | `L-2` | Consent wording version `2026-10-b`; every real submission |
| **Q3** | May the draft privacy notice be published as drafted, or what must replace it? | `L-3` | The privacy page and its acknowledgement |
| **Q4** | What retention period, backup-expiry position and deletion-request rule apply? | `L-5` | `retention_months`, the expiry job, the notice's retention section |

`L-1` and `L-6` are one decision here because both turn on the same facts: the entity, its role and its state footprint. `Q2` covers the `L-2` consent wording and the e-signature basis. `Q3` covers `L-3`. `Q4` covers `L-5`.

**Deliberately not in this review**

- `L-4` marketing withdrawal scope: no call or text channel is operated, all channel flags compile to false, the licensed-state list is empty, and no TCPA disclosure is rendered. It becomes blocking only if a channel is ever proposed.
- `L-7` vendor review: a fifth gate that must close before any real health data is processed, but it cannot proceed until the owner supplies the inventory, agreements and region listed in section 4. It is scheduled after this review, not omitted.
- `L-8` reliance on specification `1.1`: an internal engineering-issuance question, not an intake blocker.

## 2. Facts about the product

Everything below is current at the baseline commit and is stated without legal characterisation.

- **What it is.** A guided, deterministic interview that collects information for a preliminary life-insurance review by Richard Parslow at Life Policy Pilot. It makes no eligibility, rate, quote or coverage decision, and it does not submit anything to a carrier.
- **What it collects.** Name, state, email, a telephone number only if the customer chooses a call or text, date of birth, the interview answers, optional coverage details, the consent choices and their exact wording/version, the submission acknowledgement, a crisis-disclosure flag derived from the answer to one question, and an access log entry each time a reviewer opens the case.
- **Health content.** The bank asks about medical history, including family medical history (a parent's or sibling's condition and age).
- **What it does not collect.** No Social Security number, payment card, passport, visa or green-card number, identity-document scan, or unrelated family identifier. Height and weight are not collected.
- **Held questions.** Five sensitive rows exist in the bank but are never asked: sex/gender (`ID-04`), HIV/AIDS (`MED-11`), detail of a suicide attempt (`MH-06`), immigration category (`RES-04`) and visa/green-card number (`RES-05`). See Annex D.
- **Who reads a case.** A named individual reviewer through an authenticated portal that requires an allowlisted account and a TOTP second factor (`AAL2`). Every open is logged before the case is returned. A forwarded email grants no access.
- **Where it runs.** Supabase/Lovable Cloud for database, auth and functions; Resend for notification email if configured. No analytics, advertising pixels, session replay or model provider is integrated. No AI model is called.
- **Marketing.** Compiled off. Every channel flag defaults to false, no vendor endpoint or adapter exists, and the sender gate refuses every send because the licensed-state list is empty.
- **Current gate state.** Intake is closed by a launch lock: the server admits a submission only when `QUESTIONNAIRE_APPROVED` is exactly `true`, the value is unset here, and the submit function returns `503` without writing. Clinical sign-off is 0 of 92 rows. Retention is unset. No production deployment exists.
- **State coverage.** The picker offers all 50 states and the District of Columbia; the server accepts exactly that set of codes and no other. There is no licensed-state restriction on intake.

## 3. The four decisions

### Q1 — Seller, role, states and regime (`L-1`, `L-6`)

**Decision required.** Confirm the legal entity that operates the interview and holds the data, its role, the states in which the interview may be offered, and which privacy and health-information regimes apply.

**Current state.** `VITE_LEGAL_ENTITY` is empty, so the product names “Richard Parslow at Life Policy Pilot” and describes Texas as the initial regulatory baseline. The intake state picker offers all 50 states and the District of Columbia, and the server rejects any other code; there is **no licensed-state restriction on intake**. Only the marketing sender is state-gated, and its allowlist is empty. Whether the business is an agent, broker or referral service is not recorded anywhere in the repository.

**Questions.**

1. **Q1.1** What is the legal name of the entity that should be named as the seller and data controller — an individual, a corporation, or an entity trading as “Life Policy Pilot”? Should the consent text name the entity, the individual, or both?
2. **Q1.2** In what capacity does the business act — licensed life-insurance agent or broker for named carriers, or an independent intake/referral service? Does the answer change who must be named, who owns the applicant data, or what notices are required?
3. **Q1.3** May the interview be offered in every state shown, or only in states where the business is licensed? If a restriction is required, should the product refuse the interview, refuse the submission, or accept and refer? (Today it accepts all states.)
4. **Q1.4** Does HIPAA apply — is the business a covered entity, or a business associate of a carrier or agency — given that it collects health information for underwriting review but makes no coverage decision?
5. **Q1.5** Does the Texas Data Privacy and Security Act apply to this business, and if so, what notice, rights-handling, contracting and opt-out obligations follow? Do Texas Insurance Code recordkeeping or notice rules apply to agent-held applicant health information?
6. **Q1.6** If a regime applies, may the product continue to say “this is not a claim of HIPAA compliance” and “initial regulatory baseline: Texas” as drafted, or must either statement change?

**A usable answer looks like:** entity legal name and trade name; capacity; a state list or a rule for deriving one; a yes/no on HIPAA and TDPSA applicability with the reasoning; and any required change to the two statements above.

### Q2 — Intake wording, e-signature and follow-up contact (`L-2`)

**Decision required.** Approve, redline or reject the three texts below, and confirm the electronic-signature and authorization basis for collecting health information and providing it to the reviewer.

**Current drafts** (all version `2026-10-b`, quoted in full in Annex A):

- intake permission, shown on the permission screen and recorded with the submission;
- privacy acknowledgement, stored separately with the privacy version;
- submission acknowledgement, required at review.

The server requires both permissions — intake and privacy — to be granted, to match the current text and version exactly, and to carry a timestamp inside the session. It also requires exactly one submission acknowledgement whose text and version are current and whose timestamp is not earlier than either permission. Editing any answer clears the acknowledgement. Consent records store the exact text, version and timestamp; only marketing records would carry the authorized number, and none exist in this build.

**Questions.**

1. **Q2.1** Is the intake permission text adequate as an authorization to collect health information, including family medical history, and provide it to the named reviewer for a preliminary review? Does it need to state purposes, recipients, an expiry, or the right to revoke?
2. **Q2.2** Is a checked box with a recorded timestamp and the exact text/version an enforceable electronic signature under UETA/E-SIGN for this authorization? If not, what additional act or record is required?
3. **Q2.3** The submission acknowledgement says the reviewer “may contact me to clarify” uncertain or declined answers. If that contact is by telephone or text, is separate consent required, and must the channel be named?
4. **Q2.4** Does family medical history need a distinct authorization or state-specific form, or is the privacy acknowledgement sufficient?
5. **Q2.5** If any held question is later approved, does the current intake text cover it, or is a separate authorization required — particularly for HIV/AIDS and suicide-attempt detail?
6. **Q2.6** Should the intake text state that submitting does not authorize release of medical records (it currently does), and is that statement accurate for the intended workflow?

**A usable answer looks like:** approval of each text, or exact replacement wording; a yes/no on checkbox-plus-timestamp as the signature basis; and any channel-specific consent requirement for follow-up contact.

### Q3 — Privacy notice (`L-3`)

**Decision required.** Approve the draft notice at version `2026-10-b`, or specify the replacement text and any additional disclosures.

**Current draft.** The [privacy page](../src/pages/PrivacyPage.tsx) is plain-language product copy, marked “Draft — pending counsel review”, and explicitly says it is not a complete privacy notice. It describes what is collected (including family medical history), why, the marketing position, who reads a case, storage and TLS, what is kept out of other systems, that retention is not yet documented, the customer's choices during the interview, security limits, and regulatory status. It does **not** assert at-rest encryption or HIPAA compliance.

**Questions.**

1. **Q3.1** Is the draft adequate as a notice at collection, or is a fuller notice required — legal entity and address, categories and sources, purposes, recipients and subprocessors, retention period, rights, effective date?
2. **Q3.2** Does the notice need a sale/share statement or an opt-out link even though there are no analytics, pixels or marketing sends?
3. **Q3.3** Is the family-medical-history description sufficient and accurate? Does asking about family history trigger any additional notice, restriction or unfair-discrimination concern that the current page does not address?
4. **Q3.4** Is an email-only route for access, correction and deletion adequate, or is a form with identity verification and a stated response deadline required?
5. **Q3.5** The page deliberately omits an at-rest encryption claim until the provider controls are verified. Is that omission acceptable, or must the notice describe safeguards at a specified level?
6. **Q3.6** May the notice be presented inside the interview with a separate acknowledgement, or must it also be a standalone page accepted before any collection?

**A usable answer looks like:** approval or exact replacement text; the required disclosures list; the rights-handling route and deadline; and whether the in-interview acknowledgement is sufficient.

### Q4 — Retention, deletion and backups (`L-5`)

**Decision required.** Set the retention period or periods, the backup-expiry position, and the rule for a customer deletion request received before the period ends.

**Current state.** `app_settings.retention_months` is null, so the expiry function returns zero rows and deletes nothing. Manual deletion exists and is audited: an `AAL2` reviewer can delete a case, and the deletion is recorded. Submitted cases are retained indefinitely until a period is approved. Incomplete interviews are not stored server-side. The provider backup/PITR window has not been confirmed. No restore drill has been run.

**Questions.**

1. **Q4.1** What retention period applies to submitted cases? Does it differ for declined, withdrawn or unreviewed submissions?
2. **Q4.2** Do Texas insurance recordkeeping rules or carrier agreements require a minimum period longer than the privacy-driven one? If so, which record classes?
3. **Q4.3** If a customer requests deletion before the period ends, must the business delete, or may it retain on a legal or contractual basis? What must the notice say about that?
4. **Q4.4** For backups: is deletion from provider backups required, or is a documented expiry window — with no restore of deleted data into the live system — sufficient? What window is acceptable?
5. **Q4.5** Who may suspend deletion for a litigation hold or incident investigation, and what record must be kept?
6. **Q4.6** Sequencing: the notice must state a period. Please answer Q4.1 together with Q3.1 so the two can issue in one version.

**A usable answer looks like:** a number of months (or a rule per case class); a written backup position with a window; the deletion-request rule; and the hold authority.

## 4. Facts we still owe counsel

These do not block the four answers, but counsel should know they are unverified or owner-supplied. Engineering cannot confirm them from the repository.

| Fact | Current state | Owner |
|---|---|---|
| Complete vendor inventory (hosting, email, auth, any future SMS/CRM) | Supabase/Lovable Cloud and Resend are integrated; no others known | Owner |
| Data hosting region and subprocessor list | Not recorded in the repository | Operations |
| Executed DPAs or terms for Supabase/Lovable Cloud and Resend | Not in the repository; existence unknown | Owner |
| Business postal address and registered agent | Not recorded | Owner |
| Carrier or agency agreements that may impose retention or notice terms | Unknown | Owner |
| Named reviewers and their employment/contractor status | Reviewer allowlist is created per project; no roster | Owner |
| Incident contact and notification decision-maker | Not named | Operations |

## 5. What engineering will do with each answer

| Answer | Change | Verification |
|---|---|---|
| Q1 entity and capacity | Set `VITE_LEGAL_ENTITY`; update the consent and notice text to name the seller | `npm run check:docs`, `npm run check:marketing`, consent tests |
| Q1 state restriction | If required, add a server-side licensed-state gate to submission (none exists today) and a neutral refusal message | Deno handler tests for a permitted and a refused state; no marketing flag change |
| Q1 regime | Correct any compliance statement the product makes; no claim is added without evidence | `check:docs`; copy review |
| Q2 wording | New consent version (for example `2026-10-c`), regenerate the server policy, update tests and stored-text comparison | Deno submit-case tests; `check:db` for consent records |
| Q2 signature basis | If more than a checkbox is required, add the record the advice specifies | Handler and schema tests |
| Q3 notice | New `PRIVACY_PRACTICES_VERSION`; replace page text; update the acknowledgement if it changes | `check:docs`, build, and a rendered-copy review |
| Q4 period | Set `app_settings.retention_months`; enable the expiry job; update the notice's retention section | `check:db` for purge behaviour, manual deletion and audit |
| Q4 backup position | Record the window and the restore rule in the operations runbook | Runbook review; no code change |

No answer here authorises a production deployment, a provider send, or a marketing channel. Those remain separate gates.

## 6. Response sheet

| # | Decision | Required changes (quote exact replacement wording) | Conditions | Name, role, date |
|---|---|---|---|---|
| Q1 | Approve / Approve with changes / Reject / Need facts | | | |
| Q2 | Approve / Approve with changes / Reject / Need facts | | | |
| Q3 | Approve / Approve with changes / Reject / Need facts | | | |
| Q4 | Approve / Approve with changes / Reject / Need facts | | | |

A dated, attributed memo is sufficient; no cryptographic signature is required. If an answer is “need facts”, name the fact and we will supply it before the next review.

## 7. Limits

- This brief records product facts and asks questions. It contains no legal conclusion and must not be quoted as one.
- It reflects the repository at `09149fc`; uncommitted work is not included.
- No customer data was used to prepare it.
- Approving a text does not approve a deployment. The operational gates in the [sign-off pack](2026-10-28-owner-signoff-pack.md) remain open.

---

## Annex A — exact texts in force

**Intake permission** (`CONSENT_VERSION` `2026-10-b`, shown when the optional explainer is off):

> This guided interview collects information for a preliminary life-insurance review by Richard Parslow at Life Policy Pilot. It does not diagnose medical conditions or decide insurance eligibility. Before submission, you can review and correct your answers. By selecting "Submit for Richard's Review," you ask Life Policy Pilot to securely provide your responses to Richard Parslow for this review. Submitting this questionnaire does not create insurance coverage or automatically authorize release of medical records or submission to an insurer.

**Privacy acknowledgement** (`PRIVACY_PRACTICES_VERSION` `2026-10-b`):

> I have read the privacy practices explained in this interview. I understand what is collected, who reads it, how it is stored, and how to ask for correction or deletion.

**Submission acknowledgement** (required before submission):

> I have reviewed the answers shown on this page and they are complete and accurate to the best of my knowledge. I understand this is a preliminary review request, not a carrier application, an offer of insurance, or an approval, and that Richard Parslow may contact me to clarify anything I have marked uncertain or declined.

**Marketing disclosure:** empty. No call or text channel is enabled, so no TCPA disclosure or marketing consent record exists in this build.

## Annex B — data inventory

| Category | Examples | Purpose | Where it lives |
|---|---|---|---|
| Identity and contact | Name, state, email, optional phone, date of birth | Identify the applicant, confirm adult self-application, reply | Case payload, access-controlled |
| Health answers | Conditions, medications, timeframes, family history | Preliminary underwriting review by a human | Case payload, access-controlled |
| Coverage preferences | Amount, term, purpose | Context for the review | Case payload |
| Consent evidence | Exact text, version, timestamp, channel, number authorized | Prove what was agreed and when | Case payload and consent records |
| Access and review log | Reviewer, action, timestamp | Audit who read or changed a case | Append-only table |
| Notification state | Provider status, attempt times, message id | Delivery reliability | Case row, no health content |

Not collected: SSN, payment card, passport/visa/green-card number, identity-document scans, unrelated family identifiers, height/weight.

## Annex C — configuration facts

| Setting | Value |
|---|---|
| `VITE_LEGAL_ENTITY` | empty |
| `VITE_MARKETING_CALLS`, `VITE_MARKETING_TEXTS` | false |
| `MARKETING_LICENSED_STATES` | empty (every send refused) |
| `QUESTIONNAIRE_APPROVED` | false (intake returns 503) |
| `app_settings.retention_months` | null (expiry deletes nothing) |
| Consent, disclosure and privacy versions | `2026-10-b` |
| Intake state coverage | all U.S. states offered; no licensed-state gate |
| Clinical sign-off | 0 of 92 rows |

## Annex D — held questions never asked

| ID | Topic | Why it is held |
|---|---|---|
| `ID-04` | Sex / gender | Jurisdiction and carrier approval, answer set, necessity |
| `MED-11` | HIV / AIDS | Legal, clinical and underwriting review; confidentiality; state restrictions |
| `MH-06` | Detail of suicide attempt | Clinical and legal review of wording, necessity and crisis support |
| `RES-04` | Immigration category | Legal review; source categories may be outdated |
| `RES-05` | Visa / green-card number | Should not be collected in this intake; needs a separate workflow |
