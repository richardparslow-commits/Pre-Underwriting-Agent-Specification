# Life Policy Pilot: Pre-Underwriting Interview and Review Specification

**Version:** `1.1`\
**Status:** **ISSUED** — supersedes version `1.0`\
**Issue date:** 28 October 2026\
**Approver:** Richard Parslow, product/business owner\
**Decision record:** [`SC-01-DR-2026-10-28`](2026-10-28-sc-01-decision-record.md)\
**Controlling version 1.0 extraction:** [`owner-specification.txt`](2026-10-27-qwencloud/evidence/owner-specification.txt), SHA-256 `3a46ab09d5cc3831ddd7b100d115947d7377ec92780e525f3db103aac6eb547b`\
**Document hash:** recorded in [`2026-10-28-sc-01-issue.sha256`](2026-10-28-sc-01-issue.sha256), created after this file was finalised.

## 1. Issue status and scope

This is the issued version `1.1` amendment approved under decision record `SC-01-DR-2026-10-28`. It applies the thirteen owner-approved redlines in §2 and two consequential editorial normalisations in §3. The approval evidence is the owner's instruction in the project session on 28 October 2026, recorded in the decision record's approval block. That is an owner-directed electronic approval record, not a handwritten or cryptographic signature.

This is a **bounded amendment**, not a reprint of the full specification. Clauses not listed in §2 or §3 remain exactly as version `1.0`, including the question text, question order, lookback windows, branching, validation, consent effect, authorization, privacy notice, marketing disclosures, access control, notification recipient, delivery evidence, retention and human-review requirements.

The signed specification PDF is not present in this workspace. The controlling text is the committed extraction identified above, which contains PDF artifacts such as “dra” for “draft” and “Aer” for “After”. Quotations of version `1.0` below normalise spacing and those extraction artifacts without changing meaning. A full consolidated reprint must be checked against the signed source before it is treated as the authoritative document. This issuance is an engineering and specification decision; it is not legal, clinical, privacy or vendor approval.

**Effective scope:** the thirteen replacement clauses in §2 take effect on issue. The two normalisations in §3 are editorial and do not change a requirement. Clause references below use the line numbers of the version `1.0` extraction.

## 2. Approved redlines

### 2.1 Title — lines 1–2

**Version 1.0:**

> Life Policy Pilot: Pre-Underwriting Agent Specification

**Version 1.1:**

> Life Policy Pilot: Pre-Underwriting Interview and Review Specification

**Effect:** Replaces the ambiguous “Agent” in the title. It names the actual product: a guided interview followed by human review.

### 2.2 Purpose and status — lines 6–10

**Version 1.0:**

> Proposed product requirement: The AI Customer Health Agent conducts a guided pre-underwriting interview using the uploaded Detialed-Life-insurance-Questions.pdf as its controlled source questionnaire.

**Version 1.1:**

> Proposed product requirement: The Life Policy Pilot guided interview conducts a pre-underwriting interview using the uploaded Detialed-Life-insurance-Questions.pdf as its controlled source questionnaire. The interview is deterministic: it does not call a language model and does not generate answers on the customer's behalf.

**Effect:** Removes the AI-agent identity and states the operating constraint on which the rest of this amendment relies.

### 2.3 Customer flow — Introduction — lines 45–47

**Version 1.0:**

> Identify the assistant as AI; identify Life Policy Pilot; explain that this is preliminary information collection, not a carrier application, diagnosis, offer, or approval.

**Version 1.1:**

> Identify the tool as a deterministic guided interview, not an AI assistant; identify Life Policy Pilot; explain that this is preliminary information collection, not a carrier application, diagnosis, offer, or approval.

**Effect:** Keeps the required customer disclosure while making it accurate.

### 2.4 Reviewer access — lines 93–94

**Version 1.0:**

> Give Richard authenticated access to the complete answers, source references, and an AI-generated draft summary.

**Version 1.1:**

> Give Richard authenticated access to the complete answers, source references, and a deterministic draft summary generated from the recorded answers.

**Effect:** Matches the actual `buildDraftSummary` output and removes the unsupported AI claim.

### 2.5 Controlled questioning rules — versioned bank — lines 292–294

**Version 1.0:**

> Use the PDF as a versioned question bank—not merely as a document the model searches from memory.

**Version 1.1:**

> Use the PDF as a versioned question bank—not merely as a document retrieved at runtime.

**Effect:** The bank is versioned and server-canonical; there is no model retrieval layer.

### 2.6 Controlled questioning rules — interface behaviour — lines 302–308

**Version 1.0:**

> The conversation layer may explain unfamiliar words, request clarification, and make the interview more approachable. It must not drop exclusions, change “ever” into “recently,” turn a five-year question into a seven-year question, or silently substitute a different question. Any proposed change should enter an approval queue before it affects customers.

**Version 1.1:**

> The interface may present pre-approved plain-language explanations and clarification prompts. It must not generate free text that adds, skips, reorders or rewords a question, changes a lookback window, or alters an answer. Any explanatory text must be versioned and reviewed like question text; any proposed change enters an approval queue before it affects customers.

**Effect:** Preserves the explainability purpose without a generative conversation layer and makes the approval requirement apply to deterministic help text as well.

### 2.7 Sample intake acknowledgment — lines 389–391

**Version 1.0:**

> This AI assistant collects information for a preliminary life-insurance review by Richard Parslow at Life Policy Pilot.

**Version 1.1:**

> This guided interview collects information for a preliminary life-insurance review by Richard Parslow at Life Policy Pilot.

**Effect:** Matches the current [`consentTexts.ts`](../src/features/consent/consentTexts.ts#L34) wording. Any change to the legal effect of the acknowledgment still requires counsel review under `SC-05`.

### 2.8 Marketing revocation — lines 419–421

**Version 1.0:**

> The product must enforce selected contact permissions, applicable suppression rules, local-time/state restrictions, and reasonable revocation requests outside the language model.

**Version 1.1:**

> The product must enforce selected contact permissions, applicable suppression rules, local-time/state restrictions, and reasonable revocation requests outside the interview engine.

**Effect:** Keeps the control requirement and removes the implication that a language model handles revocation. The detailed marketing controls remain governed by `SC-02` and `SC-05`.

### 2.9 Email delivery design — lines 430–433

**Version 1.0:**

> The visitor and language model must not be able to replace it, add arbitrary recipients, or change mail routing through conversational instructions.

**Version 1.1:**

> The visitor and the interview interface must not be able to replace it, add arbitrary recipients, or change mail routing through conversational instructions.

**Effect:** The recipient is a server constant; there is no language model or conversational routing path to constrain. “Conversational instructions” is retained only as a threat description, not as an implemented channel.

### 2.10 Richard's review package — lines 476–478

**Version 1.0:**

> Provide both the complete question-and-answer record and a clearly labeled AI-generated draft summary. The summary is a navigation aid, not a replacement for the source responses or an underwriting decision. Each summarized fact should link back to the customer's answer.

**Version 1.1:**

> Provide both the complete question-and-answer record and a clearly labeled deterministic, source-linked draft summary generated from the recorded answers. The summary is a navigation aid, not a replacement for the source responses or an underwriting decision. Each summarized fact must link back to the customer's answer.

**Effect:** Names the actual summary, keeps the navigation-aid limitation and makes source linking mandatory rather than advisory.

### 2.11 Texas AI-bulletin context — lines 541–543

**Version 1.0:**

> Texas's AI bulletin specifically expects human review and agreement before action on consequential AI decisions and also highlights licensing boundaries.

**Version 1.1:**

> Texas's AI bulletin describes expectations for consequential AI decisions; this intake makes no such decision and still requires human review before any carrier action, and the bulletin also highlights licensing boundaries.

**Effect:** Preserves the legal context without implying that this deterministic intake makes an AI decision. “Texas's AI bulletin” is retained as the name of the external source. The legal applicability analysis remains `SC-05`.

### 2.12 Vendor security — lines 570–574

**Version 1.0:**

> Security requirements must cover the model provider, hosting, database, backups, forms/chat service, email service, and every integration that receives the data—not only the chat widget.

**Version 1.1:**

> Security requirements must cover any model provider, hosting, database, backups, forms/chat service, email service, and every integration that receives the data—not only the chat widget.

**Effect:** Makes the model-provider requirement conditional. It does not reduce the security requirements for the vendors actually in use. “Chat widget” is retained as a generic integration example, not as a statement that one is deployed.

### 2.13 Launch dependencies — lines 623–629

**Version 1.0:**

> Confirm the actual legal operating entity, licensed service states, approved questionnaire version, sensitive-question rules, privacy notice, authorization forms, TCPA disclosure, hosting/model vendors, secure intake store, authenticated review portal, retention schedule, and email-provider configuration.

**Version 1.1:**

> Confirm the actual legal operating entity, licensed service states, approved questionnaire version, sensitive-question rules, privacy notice, authorization forms, TCPA disclosure, hosting vendors and any model vendor, secure intake store, authenticated review portal, retention schedule, and email-provider configuration.

**Effect:** Keeps the launch dependency accurate when no model vendor exists and preserves it if a model is later approved.

## 3. Consequential editorial normalisations

These two changes were not among the thirteen approved redlines. They remove the remaining ambiguous “agent” identity so version `1.1` does not retain the conflict the redlines were issued to resolve. Neither changes a requirement, permission or prohibition.

### 3.1 Heading “Agent review” — line 91

**Version 1.0:**

> Agent review

**Version 1.1:**

> Reviewer access

**Effect:** The following clause is Richard's authenticated human review. “Agent review” is ambiguous between an insurance agent and the former AI agent identity. “Reviewer access” describes the control without implying either.

### 3.2 Crisis-support sentence — lines 371–373

**Version 1.0:**

> The agent must not claim to provide emergency monitoring or to have dispatched help.

**Version 1.1:**

> The interview interface must not claim to provide emergency monitoring or to have dispatched help.

**Effect:** Removes the residual AI-agent identity. The prohibition on claiming emergency monitoring or dispatched help is unchanged.

## 4. Reference sweep

The version `1.0` extraction was searched for `AI`, `artificial intelligence`, `assistant`, `language model`, `model provider`, `model searches`, `conversation layer`, `conversational`, `chatbot`, `chat widget` and `agent`. Every match is accounted for below.

| Line | Version 1.0 reference | Disposition in version 1.1 |
| ---: | --- | --- |
| 1 | “Pre-Underwriting Agent” | Replaced — §2.1 |
| 6 | “AI Customer Health Agent” | Replaced — §2.2 |
| 45 | “Identify the assistant as AI” | Replaced — §2.3 |
| 91 | “Agent review” | Normalised — §3.1 |
| 93 | “AI-generated draft summary” | Replaced — §2.4 |
| 292 | “document the model searches from memory” | Replaced — §2.5 |
| 302 | “The conversation layer” | Replaced — §2.6 |
| 342 | “HIV/AIDS” | Retained — medical term, not an AI reference |
| 371 | “The agent must not claim” | Normalised — §3.2 |
| 389 | “This AI assistant collects” | Replaced — §2.7 |
| 407 | “insurance agents” | Retained — regulated persons, not the product |
| 421 | “outside the language model” | Replaced — §2.8 |
| 431 | “the visitor and language model” | Replaced — §2.9 |
| 433 | “conversational instructions” | Retained — threat description, not an implemented channel |
| 476 | “AI-generated draft summary” | Replaced — §2.10 |
| 541 | “Texas's AI bulletin” | Retained as the source name; clause rewritten — §2.11 |
| 543 | “consequential AI decisions” | Replaced with “such decision” — §2.11 |
| 553 | “include agents” | Retained — regulated persons, not the product |
| 571 | “the model provider” | Replaced with conditional “any model provider” — §2.12 |
| 574 | “the chat widget” | Retained — generic integration example; no deployment claim |

**Result:** no clause in the issued amendment identifies the interview as AI-operated, describes a conversation layer or model retrieval, or labels the reviewer summary as AI-generated. The remaining uses are a legal-source name, a conditional future vendor, a generic integration example, a threat description and domain references to insurance agents or a medical term.

## 5. Clauses not changed

- Question text, question order, sections, branching, conditional follow-ups, exclusions and lookback windows.
- The 92-row bank, the 113-source reconciliation, the held rows and every review status.
- Consent effect, intake permission, authorization forms, privacy notice, TCPA disclosure, call/text controls and the separate AI-voice telephony disclosure.
- Server authority, answer integrity, validation, case reference, notification recipient, delivery evidence and status wording.
- Authentication, reviewer access control, AAL2, audit logging, retention, deletion and backup requirements.
- Human review, underwriting judgment and the prohibition on treating the summary as a decision.
- Every vendor, security, legal and operational launch gate in `SC-02`–`SC-05`.

No customer-facing copy is changed by this document. The current permission screen already says that a plain-language assistant is not active, and the consent introduction already uses “This guided interview”.

## 6. Issuance checks

- [x] All thirteen owner-approved redlines in §2 are applied.
- [x] The two consequential editorial normalisations in §3 are recorded and scoped as non-substantive.
- [x] Every AI, assistant, model, conversation-layer and agent reference in the controlling extraction is accounted for in §4.
- [x] The issued text contains no unqualified claim that the interview is AI-operated or that the reviewer summary is AI-generated.
- [x] The title and purpose identify the deterministic guided interview.
- [ ] The non-customer copy walkthrough of the permission, review and portal-summary labels is complete.
- [x] `npm run check:docs` passes after this issuance.
- [ ] `npm run typecheck` and `npm run build` have been re-run after this issuance.
- [ ] `SC-01` has been marked resolved in a separate dated closure note.

The unchecked items are closure evidence, not conditions of issuance. `SC-01` remains open until they are complete.

## 7. Supersession and hash record

| Item | Record |
| --- | --- |
| Superseded version | Version `1.0`, represented by the committed extraction `audit/2026-10-27-qwencloud/evidence/owner-specification.txt` |
| Superseded SHA-256 | `3a46ab09d5cc3831ddd7b100d115947d7377ec92780e525f3db103aac6eb547b` |
| Issued version | Version `1.1`, this document |
| Issued SHA-256 | Recorded in [`2026-10-28-sc-01-issue.sha256`](2026-10-28-sc-01-issue.sha256) |
| Decision record SHA-256 | Recorded in the same hash file |
| Signed source | Not present in this workspace; the bounded amendment relies on the controlling extraction and must be checked against the signed PDF before a full reprint |
| Preserved A6 package | Not edited; its manifest remains intact |

The hash file is a record of the issued artefacts, not a digital signature. It must be regenerated if either document is intentionally changed, with the change recorded in a new dated note.
