# SC-01 non-customer copy walkthrough

**Date:** 28 October 2026, 13:47 UTC  
**Finding:** `SC-01` / `MI-05` — the specification's AI assistant and AI-generated summary are not implemented  
**Baseline:** `main` @ `20e0eff79a42d71b8980a5a0489422aa7176892b`  
**Decision:** [SC-01 decision record](2026-10-28-sc-01-decision-record.md) — Path A approved  
**Issued amendment:** [Specification version 1.1](2026-10-28-sc-01-specification-v1.1.md)  
**Environment:** local Vite preview at `http://127.0.0.1:4173`, 1440 × 900 viewport  
**Data:** non-customer test data only. No real customer information was entered, submitted, stored or screenshotted.

> This is copy-review evidence, not a closure notice. It records what a browser actually rendered on the permission, review and portal surfaces. `SC-01` remains open until the remaining closure checks in the decision record §7 are complete.

## 1. Method

1. Opened `/start` in the local preview build.
2. Entered non-customer details: `Audit Walker`, Texas, date of birth `1984-06-15`, email `audit.walker@example.com`. The form was not submitted.
3. Continued to the permission step and captured the accessibility tree and rendered text.
4. Granted intake permission, began the interview, and used **Review my answers** without answering health questions. This intentionally produced a review screen with 71 unanswered items; it does not represent a completed case.
5. Opened `/portal`, used the labelled **Preview build** path, and opened the built-in `LPP-2026-SAMPLE` non-customer case.
6. Captured the signed-out case boundary, the portal queue, the draft-summary heading and descriptive copy, and the reviewer footer.
7. Searched the rendered portal page for `AI`, `AI-generated`, `artificial intelligence`, `language model`, `machine learning`, `assistant` and `agent`. The portal returned no matches.
8. Searched the customer source and documentation for the same terms. The results are recorded in §5.

## 2. Permission screen — rendered copy

**Route:** `/start`, step 2  
**Visible step label:** `STEP 2 OF 4 · PERMISSION`  
**Heading:** `Before the health questions`

> Please read this once. It explains what the assistant is, what it is not, and how your answers are handled.

### Who you are talking to

> A guided interview tool operated by Life Policy Pilot, working for Richard Parslow. Richard Parslow reviews your answers personally. A plain-language assistant is not active in this version.

### What this is

> Preliminary information collection for a life-insurance review. It is not a carrier application, a medical diagnosis, an offer of coverage, or an approval. No decision about you is made by the assistant.

### Where your answers go

> Your completed answers are stored in an access-controlled case record and shown to Richard Parslow through an authenticated portal. Health answers are kept out of marketing tools, advertising pixels, session replay and routine logs.

### What you control

> Ask one question at a time, skip anything, mark an answer uncertain, or decline. If something is sensitive and withheld, we offer a conversation with a person rather than coercion. You can ask for a correction or deletion.

### Crisis boundary

**Heading:** `If you need help right now`  
**Badge:** `NOT MONITORED`

> This site does not monitor emergencies and cannot dispatch help. If you are thinking about suicide or self-harm, call or text 988 (Suicide & Crisis Lifeline). If your life is in immediate danger, call 911.

### Permission checkbox

> This guided interview collects information for a preliminary life-insurance review by Richard Parslow at Life Policy Pilot. It does not diagnose medical conditions or decide insurance eligibility. Before submission, you can review and correct your answers. By selecting "Submit for Richard's Review," you ask Life Policy Pilot to securely provide your responses to Richard Parslow for this review. Submitting this questionnaire does not create insurance coverage or automatically authorize release of medical records or submission to an insurer.

**Version line:** `Consent text version 2026-10-b` · `Privacy practices version 2026-10-a` · `Questionnaire 2026.10-draft.9`  
**Draft notice:** `DRAFT WORDING — PENDING COUNSEL REVIEW`  
**Buttons:** `Back to your details` · `Begin the interview`  
**Disabled note:** `The interview cannot start until you have given this permission. Nothing has been saved.`

**Assessment:** the screen uses the word “assistant” only to describe the guided tool and to disclaim that a plain-language assistant is not active. It makes no claim that an AI is operating, and it states that no decision about the customer is made by the assistant. This matches the amended deterministic design.

## 3. Review screen — rendered copy

**Route:** `/start`, step 4  
**Visible step label:** `STEP 4 OF 4 · REVIEW AND SUBMIT`  
**Heading:** `Check your answers`

> This is exactly what will be sent to Richard Parslow. Corrections are welcome — change anything that is not right. Nothing is sent until you use the submit button at the bottom of this page.

### Contact and permission panels

**Contact details:** `Audit Walker` · `audit.walker@example.com` · `Texas · prefers email`  
**Coverage details (optional):** `Not provided`  
**Contact permissions:** `Not offered in this version`  
**Permission note:** `Your questionnaire is submitted without marketing consent. This does not affect your review.`

### Unanswered summary

**Heading:** `71 unanswered questions`

> You can submit now and these will be recorded as unanswered — never as “No”. Or answer them first. Richard Parslow may follow up on anything left open.

**Answer labels observed:** `ANSWERED` · `NOT ANSWERED` · `No answer recorded`  
**Actions observed:** `Change` · `Answer` · `Edit contact details`

### Held topics

**Heading:** `Questions held for human review`

> 5 source topics are not asked in this automated interview because they need legal and underwriting approval first. Their wording is kept in the internal coverage record, not shown to customers. If one applies to you, Richard Parslow will discuss it with you directly.

### Before submission

**Heading:** `Before you submit`

> A submitted case is an immutable record. If you need to correct it afterwards, contact Richard Parslow with your case reference. The correction is added to your case record as a separate note and the submitted answers stay exactly as they are.

**Acknowledgement text:**

> I have reviewed the answers shown on this page and they are complete and accurate to the best of my knowledge. I understand this is a preliminary review request, not a carrier application, an offer of insurance, or an approval, and that Richard Parslow may contact me to clarify anything I have marked uncertain or declined.

**Buttons:** `Back to the questions` · `Submit for Richard's Review`  
**Disabled note:** `Tick the confirmation above to enable submission.`

**Assessment:** the review screen presents the recorded answers and describes the submission as exactly what will be sent. It does not describe an AI-generated summary or an automated decision. The “unanswered” label is explicit and is never converted to “No.”

## 4. Portal — signed-out boundary

**Route:** `/portal/LPP-2026-SAMPLE` after navigation, before local preview unlock  
**Heading:** `This case requires sign-in`

> Possession of a reference or a forwarded email is not enough. Access requires an authorised reviewer account, and every case request is checked against that permission.

**Actions:** `Go to sign-in` · `Preview this case locally`

**Assessment:** the signed-out boundary is truthful. Local preview unlock is labelled as a local preview, not as real authentication.

## 5. Portal — preview gate and queue

**Route:** `/portal`  
**Badge:** `PREVIEW BUILD`  
**Heading:** `Reviewer portal`

> Sign-in is not configured in this build, so this is a local preview with no authentication. In production the portal requires an authorised Supabase session, MFA on the reviewer account, and row-level security on every case.

**Warning:**

> Do not enter or review real customer information in preview mode. Cases live in this browser tab only and disappear on refresh.

**Action:** `Open the portal preview`

After unlock:

**Eyebrow:** `REVIEWER PORTAL`  
**Heading:** `Case queue`  
**Signed-in line:** `Signed in as richardparslow@lifepolicypilot.blog · showing 1 of 1 case`

> Preview mode. Cases are held in this tab only and the email notification is not connected. The portal shows exactly what the reviewer would see.

**Sample card:** `LPP-2026-SAMPLE` · `SUBMITTED` · `SAMPLE TEST CASE` · `Sample Non-customer test case · TX` · `Submitted Oct 27, 2026, 6:45 AM · Notification not sent · 54 unanswered` · `Review`

**Assessment:** the queue is explicitly a preview with no authentication and no live notification. It does not claim production connectivity.

## 6. Portal — draft summary labels

**Route:** `/portal/LPP-2026-SAMPLE`  
**Case heading:** `Sample Non-customer test case`  
**Status badges:** `SUBMITTED` · `NOT SENT` · `SAMPLE TEST CASE`  
**Draft-summary heading:** `Draft summary`

> Generated automatically from the recorded answers. A navigation aid, not an underwriting decision or a medical opinion.

**Summary count line:** `33 ANSWERED · 0 UNCERTAIN · 0 DECLINED · 54 UNANSWERED · 5 HELD FOR REVIEW`

Each summary point is followed by a visible question-id link. Examples rendered in the sample:

- `1979-04-12` — `ID-01`
- `Austin, Texas` — `ID-02`
- `TX` — `ID-03`
- `Yes — Which of these applies?: Knee arthroscopy; Approximate month and year: 02/2026; Is anything still pending or awaiting results?: No, everything is complete` — `MED-01`

**Adjacent review labels:** `Question record` · `All 92` · `Needs attention 54` · `Held 5` · `Not asked 0`  
**Footer:** `AUTHORISED REVIEWER VIEW` — `Health information. Access is limited to Richard Parslow’s allowlisted account; do not forward or screenshot this page.`

**Rendered-page scan:** no `AI`, `AI-generated`, `artificial intelligence`, `language model`, `machine learning`, `assistant` or `agent` match on the portal page.

**Assessment:** the portal label is **“Draft summary”** and **“Generated automatically from the recorded answers,”** not “AI-generated.” It is source-linked by question id and explicitly bounded as a navigation aid, not an underwriting decision or medical opinion. This matches the issued amendment.

## 7. Customer-copy source scan

The rendered browser scan is the primary evidence. A supporting source scan found these deterministic-context references:

- [`PermissionStep.tsx`](../src/features/intake/PermissionStep.tsx#L25) — “A plain-language assistant is not active in this version.”
- [`PermissionStep.tsx`](../src/features/intake/PermissionStep.tsx#L29) — “No decision about you is made by the assistant.”
- [`consentTexts.ts`](../src/features/consent/consentTexts.ts#L34) — “This guided interview collects information.”
- [`LandingPage.tsx`](../src/pages/LandingPage.tsx#L26) — “What the assistant is, who reads your answers, where they are stored, and what you can decline.”
- [`README.md`](../README.md#L26) — “**Not wired.** The interview engine is deterministic. `FEATURES.aiExplainerEnabled = false`, so the customer copy does not claim an AI assistant is active.”
- [`README.md`](../README.md#L1) — the title still reads “Pre-Underwriting Agent.” This is a product-name residue, not an AI-active claim; aligning it with the issued specification title would be a docs-only editorial change.

The remaining matches are comments, a disabled conditional branch for a future AI explainer, the README title above, and the separate telephony disclosure about an “artificial or prerecorded voice, including an AI-generated voice.” That telephony wording is outside `SC-01` and remains governed by `SC-02`/`SC-05`.

**Assessment:** no source or rendered customer surface says an AI assistant is active or that the summary is AI-generated. The generic word “assistant” remains on the landing page and permission screen as a description of the guided tool; it is not an AI claim. A future editorial pass could replace it with “interview interface” for consistency, but that is not required to satisfy the amended Path A design.

## 8. SC-01 copy-review result

| Check | Result | Evidence |
| --- | --- | --- |
| Permission screen names the deterministic tool | **Pass** | §2 — “A guided interview tool” and “A plain-language assistant is not active in this version.” |
| Permission screen makes no AI-active claim | **Pass** | §2 and §7 |
| Review screen presents recorded answers, not an AI summary | **Pass** | §3 — answer labels, “No answer recorded,” and exact submission copy |
| Portal uses “Draft summary,” not “AI-generated summary” | **Pass** | §6 |
| Portal summary is source-linked and bounded | **Pass** | §6 — question-id links and “navigation aid, not an underwriting decision or a medical opinion” |
| Signed-out portal boundary is truthful | **Pass** | §4 |
| Preview mode is labelled and warns against real data | **Pass** | §5 |
| `FEATURES.aiExplainerEnabled` remains `false` | **Pass** | [`site.ts`](../src/config/site.ts#L69), source scan §7 |
| No customer page, README or portal label claims active AI | **Pass** | §6 and §7; the only literal AI references in customer copy are a conditional future branch, the separate telephony disclosure, and the generic “assistant”/“Agent” wording recorded above |

## 9. Limitations

- This walkthrough used the local **preview build**, not a production deployment or a live reviewer session.
- The permission and review screens were exercised with non-customer test data. The review screen intentionally contained 71 unanswered questions; it is not a completed case.
- The portal was unlocked through the labelled local preview path. Real Supabase sign-in, MFA, allowlist enforcement and live data were not exercised here.
- The sample case is the built-in `LPP-2026-SAMPLE` fixture, not a customer record.
- The walkthrough records rendered text from the accessibility tree and DOM. It does not include screenshots.
- This record does not prove that `typecheck`, `build`, `check:docs` or the full local suite still pass. Those remain separate closure checks.
- `SC-01` remains **open**. The copy review is complete; the typecheck/build check and the dated closure note are still outstanding.

## 10. Reproduction

```bash
npm run dev -- --host 127.0.0.1 --port 4173
```

Then open:

- `http://127.0.0.1:4173/start` — permission and review steps
- `http://127.0.0.1:4173/portal` — preview build gate and queue
- `http://127.0.0.1:4173/portal/LPP-2026-SAMPLE` — signed-out boundary and draft-summary labels

The local preview is intentionally in-memory. Refreshing discards local cases.
