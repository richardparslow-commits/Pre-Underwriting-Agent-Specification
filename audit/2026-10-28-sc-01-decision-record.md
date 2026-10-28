# SC-01 decision record — amend the specification to the deterministic design

**Document ID:** `SC-01-DR-2026-10-28`\
**Version:** `1.0-approved`\
**Date:** 28 October 2026\
**Finding:** `SC-01` — High, specification conflict / product decision (A6 specification conformance)\
**Cross-pass IDs:** `MI-05`, `A7-05`\
**Decision status:** **APPROVED — Path A; specification version `1.1` issued 28 October 2026. Customer-copy review complete; `SC-01` remains open pending `typecheck`/`build` and the dated closure note.**\
**Accountable approver:** Richard Parslow, product/business owner\
**Prepared by:** Engineering agent for the product owner\
**Repository baseline:** `main` @ `20e0eff`\
**Preserved A6 baseline:** `79e8af4`\
**Controlling specification extraction:** [`owner-specification.txt`](2026-10-27-qwencloud/evidence/owner-specification.txt), SHA-256 `3a46ab09d5cc3831ddd7b100d115947d7377ec92780e525f3db103aac6eb547b`\
**Issued specification:** [`2026-10-28-sc-01-specification-v1.1.md`](2026-10-28-sc-01-specification-v1.1.md), SHA-256 `0b3d609931c8902e5e0c1996bd49ae16be113053d0ac5e758b1e471f4e79ebf3` (also recorded in [`2026-10-28-sc-01-issue.sha256`](2026-10-28-sc-01-issue.sha256))\
**Approval artifact:** the retained owner instruction and approval block in §8\
**A6 finding:** [`ISSUES.md#sc-01`](2026-10-28-spec-conformance/ISSUES.md#sc-01--the-ai-assistant-and-ai-generated-summary-are-not-implemented)\
**Remediation plan:** [`2026-10-28-sc-01-sc-05-remediation-plan.md` §4](2026-10-28-sc-01-sc-05-remediation-plan.md#4-sc-01--ai-assistant-and-ai-generated-summary)

> This is the owner-approved decision record and the approval artifact for the issued specification version `1.1`. It is still not a closure notice. No finding is closed. The customer-copy review is complete; the `typecheck`/`build` check and the dated closure note in §7 remain. The current customer and portal copy already describes the deterministic build truthfully; the issued amendment changes the controlling specification, not the running product.

## 1. Decision summary

| Field | Record |
| --- | --- |
| **Decision requested** | Approve **Path A**: amend the specification to version `1.1` so it describes the deterministic guided interview and the deterministic, source-linked draft summary that the build actually operates. |
| **Not requested** | No model provider, model key, AI layer, vendor contract or data-processing agreement is approved by this record. |
| **Scope of amendment** | The thirteen redlines in §4: title, purpose, introduction, agent review, controlled-questioning bank and interface rules, intake acknowledgment, marketing revocation, email recipient control, reviewer package, Texas AI-bulletin context, vendor security and launch dependencies. |
| **Out of scope** | Question wording, lookback windows, consent effect, privacy notice, TCPA wording, marketing channel approval, deployment, retention, vendor selection and any legal conclusion. Those remain governed by `SC-02`, `SC-03`, `SC-04`, `SC-05` and counsel. |
| **Why now** | `SC-01` is a literal-conformance blocker. The build cannot truthfully claim an AI assistant or an AI-generated summary, and adding a model without vendor/privacy approval would create a larger, unapproved data flow. |
| **Residual-risk owner** | Richard Parslow, with the mitigations and acceptances in §6. |
| **Approval basis** | Owner-directed electronic approval on 28 October 2026, retained in §8. It is not a handwritten, PDF or cryptographic signature, and engineering does not claim to have signed on the owner's behalf. |
| **Effective time** | 28 October 2026, on issue of specification version `1.1`. The owner approval and issued amendment are complete. |
| **Closure rule** | `SC-01` becomes **Resolved — specification amended** only after the verification and closure note in §7. The owner approval, issued amendment and customer-copy review are complete; closure is not. |

**Decision: Path A is approved.** No model layer is added merely to satisfy the old wording, and the existing deterministic summary is not relabelled as “AI-generated.” The options below remain recorded for audit.

## 2. Decision requested and options considered

The owner chose **Option A** on 28 October 2026 and recorded it in §8.

| Option | Description | Assessment |
| --- | --- | --- |
| **A — Amend the specification (recommended)** | Replace the AI-assistant and AI-generated-summary requirements with a deterministic guided interview and a deterministic, source-linked summary. Preserve the controlled questionnaire, consent, access, delivery and human-review requirements. | Matches the operating build; no new data flow, vendor, key or model risk; can be issued as a bounded specification change. |
| **B — Approve an AI layer** | Select a provider, complete privacy/vendor review, and implement a server-side, non-authoritative explainer and summary with deterministic fallback. | Not recommended for this release. Requires approvals and acceptance tests that do not exist; the model must be unable to alter questions, windows, answers, status or the notification recipient. |
| **C — Relabel the deterministic summary as AI-generated** | Leave the model out but change the label. | **Rejected.** It would be a false claim. The summary is extractive and does not call a model. |
| **D — Defer the decision** | Leave `SC-01` open and keep the current copy. | **Not recommended.** The specification would remain inconsistent with the product, and `SC-01` would continue to block specification conformance without reducing any live risk. |

**Path B is not approved by this record.** It would require the full AI acceptance suite in the remediation plan, including a privacy/vendor approval that does not exist. Deferral is also not recommended because it preserves the same conflict without a decision.

## 3. Why Path A is recommended

| Consideration | Evidence | Effect on the decision |
| --- | --- | --- |
| The shipped interview is deterministic | `FEATURES.aiExplainerEnabled` is `false` in [`site.ts`](../src/config/site.ts#L69). [`buildDraftSummary`](../src/features/interview/engine.ts#L390) only restates recorded answers and attaches question ids. | The build cannot truthfully claim an AI assistant or an AI-generated summary. |
| Customer copy is already truthful | The permission screen says “A plain-language assistant is not active in this version” in [`PermissionStep.tsx`](../src/features/intake/PermissionStep.tsx#L25). The consent intro uses “This guided interview” in [`consentTexts.ts`](../src/features/consent/consentTexts.ts#L34). | No customer-facing copy needs to be made less accurate; the specification is the outlier. |
| The review label is already accurate | The portal says “Draft summary” and “Generated automatically from the recorded answers,” not “AI-generated,” in [`CaseReview.tsx`](../src/features/portal/CaseReview.tsx#L335). | A label-only change would be a false claim and is prohibited. |
| The specification describes a proposed design | The document calls the requirement “Proposed product requirement” at [`owner-specification.txt:6`](2026-10-27-qwencloud/evidence/owner-specification.txt#L6) and says no integration has been deployed or verified at lines 20–22. | It is a design document, not a representation that a model is already running. |
| A model layer adds material obligations | A live model would need a selected provider, a server-side key, a privacy/vendor review, retention and logging limits, cross-case isolation, prompt-injection controls and a deterministic fallback. | None of those controls is approved or evidenced. They are not justified by the current product need. |
| The deterministic design is the safer default | There is no model to hallucinate, no health payload sent to a model provider and no cross-case retrieval surface. | The current design reduces risk while preserving the interview purpose. |
| Amendment remains reversible | A later product decision can approve a bounded model layer under Path B, with its own vendor review and acceptance suite. | Approving Path A does not permanently foreclose AI; it stops the build from claiming it now. |

## 4. Proposed amendment — exact replacement clauses

The signed specification PDF is not present in this workspace. This record uses the committed extraction at [`owner-specification.txt`](2026-10-27-qwencloud/evidence/owner-specification.txt), whose SHA-256 is recorded above. The extraction contains PDF artifacts such as “dra” for “draft” and “Aer” for “After”; quotations below normalize those artifacts without changing meaning. The approver must compare these redlines with the signed source before issuing version `1.1`.

**These are proposed redlines, not applied text.** This record does not edit the preserved extraction.

### 4.1 Title — lines 1–2

**Current:**

> Life Policy Pilot: Pre-Underwriting Agent Specification

**Replace with:**

> Life Policy Pilot: Pre-Underwriting Interview and Review Specification

**Why:** “Agent” is ambiguous between an insurance agent and the specification's “AI Customer Health Agent.” The replacement names the actual product: a guided interview followed by human review.

### 4.2 Purpose and status — lines 6–10

**Current:**

> Proposed product requirement: The AI Customer Health Agent conducts a guided pre-underwriting interview using the uploaded Detialed-Life-insurance-Questions.pdf as its controlled source questionnaire.

**Replace with:**

> Proposed product requirement: The Life Policy Pilot guided interview conducts a pre-underwriting interview using the uploaded Detialed-Life-insurance-Questions.pdf as its controlled source questionnaire. The interview is deterministic: it does not call a language model and does not generate answers on the customer's behalf.

**Why:** Removes the AI-agent identity and states the operating constraint that the rest of the amendment relies on.

### 4.3 Customer flow — Introduction — lines 45–47

**Current:**

> Identify the assistant as AI; identify Life Policy Pilot; explain that this is preliminary information collection, not a carrier application, diagnosis, offer, or approval.

**Replace with:**

> Identify the tool as a deterministic guided interview, not an AI assistant; identify Life Policy Pilot; explain that this is preliminary information collection, not a carrier application, diagnosis, offer, or approval.

**Why:** Keeps the required customer disclosure while making it accurate.

### 4.4 Reviewer access — lines 93–94

**Current:**

> Give Richard authenticated access to the complete answers, source references, and an AI-generated draft summary.

**Replace with:**

> Give Richard authenticated access to the complete answers, source references, and a deterministic draft summary generated from the recorded answers.

**Why:** Matches the actual `buildDraftSummary` output and removes the unsupported AI claim.

### 4.5 Controlled questioning rules — versioned bank — lines 292–294

**Current:**

> Use the PDF as a versioned question bank—not merely as a document the model searches from memory.

**Replace with:**

> Use the PDF as a versioned question bank—not merely as a document retrieved at runtime.

**Why:** The bank is versioned and server-canonical; there is no model retrieval layer.

### 4.6 Controlled questioning rules — interface behavior — lines 302–308

**Current:**

> The conversation layer may explain unfamiliar words, request clarification, and make the interview more approachable. It must not drop exclusions, change “ever” into “recently,” turn a five-year question into a seven-year question, or silently substitute a different question. Any proposed change should enter an approval queue before it affects customers.

**Replace with:**

> The interface may present pre-approved plain-language explanations and clarification prompts. It must not generate free text that adds, skips, reorders or rewords a question, changes a lookback window, or alters an answer. Any explanatory text must be versioned and reviewed like question text; any proposed change enters an approval queue before it affects customers.

**Why:** Preserves the explainability purpose without a generative conversation layer and makes the approval requirement apply to deterministic help text as well.

### 4.7 Sample intake acknowledgment — lines 389–391

**Current:**

> This AI assistant collects information for a preliminary life-insurance review by Richard Parslow at Life Policy Pilot.

**Replace with:**

> This guided interview collects information for a preliminary life-insurance review by Richard Parslow at Life Policy Pilot.

**Why:** Matches the current [`consentTexts.ts`](../src/features/consent/consentTexts.ts#L34) wording. Any change to the legal effect of the acknowledgment still requires counsel review under `SC-05`.

### 4.8 Marketing revocation — lines 419–421

**Current:**

> The product must enforce selected contact permissions, applicable suppression rules, local-time/state restrictions, and reasonable revocation requests outside the language model.

**Replace with:**

> The product must enforce selected contact permissions, applicable suppression rules, local-time/state restrictions, and reasonable revocation requests outside the interview engine.

**Why:** Keeps the control requirement and removes the implication that a language model handles revocation. The detailed marketing controls remain governed by `SC-02` and `SC-05`.

### 4.9 Email delivery design — lines 430–431

**Current:**

> The visitor and language model must not be able to replace it, add arbitrary recipients, or change mail routing through conversational instructions.

**Replace with:**

> The visitor and the interview interface must not be able to replace it, add arbitrary recipients, or change mail routing through conversational instructions.

**Why:** The recipient is a server constant; there is no language model or conversational routing path to constrain.

### 4.10 Richard's review package — lines 476–478

**Current:**

> Provide both the complete question-and-answer record and a clearly labeled AI-generated draft summary. The summary is a navigation aid, not a replacement for the source responses or an underwriting decision. Each summarized fact should link back to the customer's answer.

**Replace with:**

> Provide both the complete question-and-answer record and a clearly labeled deterministic, source-linked draft summary generated from the recorded answers. The summary is a navigation aid, not a replacement for the source responses or an underwriting decision. Each summarized fact must link back to the customer's answer.

**Why:** Names the actual summary, keeps the navigation-aid limitation and makes source linking mandatory rather than advisory.

### 4.11 Texas AI-bulletin context — line 541

**Current:**

> Texas's AI bulletin specifically expects human review and agreement before action on consequential AI decisions and also highlights licensing boundaries.

**Replace with:**

> Texas's AI bulletin describes expectations for consequential AI decisions; this intake makes no such decision and still requires human review before any carrier action, and the bulletin also highlights licensing boundaries.

**Why:** Preserves the legal context without implying that this deterministic intake makes an AI decision. The legal applicability analysis remains `SC-05`.

### 4.12 Vendor security — lines 570–572

**Current:**

> Security requirements must cover the model provider, hosting, database, backups, forms/chat service, email service, and every integration that receives the data—not only the chat widget.

**Replace with:**

> Security requirements must cover any model provider, hosting, database, backups, forms/chat service, email service, and every integration that receives the data—not only the chat widget.

**Why:** Makes the model-provider requirement conditional. It does not reduce the security requirements for the vendors actually in use.

### 4.13 Launch dependencies — lines 623–629

**Current:**

> Confirm the actual legal operating entity, licensed service states, approved questionnaire version, sensitive-question rules, privacy notice, authorization forms, TCPA disclosure, hosting/model vendors, secure intake store, authenticated review portal, retention schedule, and email-provider configuration.

**Replace with:**

> Confirm the actual legal operating entity, licensed service states, approved questionnaire version, sensitive-question rules, privacy notice, authorization forms, TCPA disclosure, hosting vendors and any model vendor, secure intake store, authenticated review portal, retention schedule, and email-provider configuration.

**Why:** Keeps the launch dependency accurate when no model vendor exists and preserves it if a model is later approved.

### 4.14 Proposed version 1.1 change log

| Change | Effect |
| --- | --- |
| Removes the AI-assistant identity and AI-generated-summary requirements | The specification now describes the deterministic build. |
| Adds the deterministic/no-language-model statement | Makes the operating constraint explicit. |
| Replaces model/conversation-layer references with the deterministic interview or interface | Removes implied model behavior. |
| Makes the model-provider security and vendor references conditional | Preserves future applicability without claiming a current provider. |
| Leaves question text, lookback windows, consent effect, access, delivery, retention and human-review requirements unchanged | The amendment is bounded; it does not weaken other controls. |
| Supersedes the working extraction at SHA-256 `3a46ab09…547b` | The issued version must record the signed source hash, its own hash and the superseded-version record. |

## 5. What the amendment does not change

- No application code, question-bank row, consent version, privacy page, migration or deployment is changed by this record.
- `FEATURES.aiExplainerEnabled` remains `false`; no model provider, key, vendor or data-processing agreement is approved.
- No customer is told that an AI is active; no summary is labelled AI-generated.
- The separate marketing disclosure about an “artificial or prerecorded voice, including an AI-generated voice” is **out of scope**. It describes a telephony technology, not the interview assistant, and remains governed by `SC-02` and `SC-05`.
- The amendment does not approve an AI feature by implication. A future model layer requires a new decision record, the Path B acceptance suite and the vendor/privacy approvals in `SC-05`.
- `SC-01` stays **Open** until the verification and closure note in §7 are complete. The owner approval, issued amendment and customer-copy review are complete; `SC-03`, `SC-04`, `SC-05` and every other launch blocker are unaffected.
- This record is not legal, clinical, underwriting or vendor approval.

## 6. Residual risk and consequences

| Risk | Assessment | Mitigation / acceptance |
| --- | --- | --- |
| **The amendment weakens a product differentiator** | The product will not claim an AI capability it does not operate. A future AI feature remains possible under Path B. | Record the decision; require a new decision record and acceptance suite before any model is added. The owner accepts the near-term market-position risk. |
| **The deterministic summary is mistaken for an interpretation** | It is extractive and source-linked but still depends on the recorded answers; it does not detect contradictions or infer missing facts. | Keep the “navigation aid, not an underwriting decision” label. `SC-08` remains open for inconsistency flags. The reviewer must use the source answers. |
| **The amended copy is less approachable** | Removing “AI assistant” may make the tool sound more clinical; deterministic help text is limited to pre-approved content. | Review the permission, review and portal copy with a non-customer walkthrough; keep the approved `helpText` and clarification prompts. |
| **Legal or regulatory characterization changes** | No AI means AI-specific disclosures and the Texas AI-bulletin analysis may apply differently, but counsel has not opined. | Counsel reviews the amended wording and the `SC-05` applicability analysis before the amendment is treated as effective outside engineering. |
| **A contract, filing or customer commitment still promises AI** | Not assessed here; an external document may repeat the old wording. | Counsel and the owner inventory external commitments before the amendment is relied on outside engineering; update them or record why they are unaffected. |
| **The signed source differs from the committed extraction** | The specification PDF is not in this workspace; the extraction contains formatting artifacts. | The approved amendment is bounded to the thirteen redlines and is not a full reprint. The owner confirms the signed source and records its hash before any full consolidated reprint or external reliance. |
| **The redline is incomplete** | An AI or model reference could remain in an unamended clause and keep the conflict alive. | The reference sweep is complete in the [issued amendment §4](2026-10-28-sc-01-specification-v1.1.md). Any residual clause is retained deliberately and recorded there; the closure note repeats the sweep result. |
| **The amendment is mistaken for closure** | A record alone is not an issued amendment or a copy review. | Apply the closure rule in §7; do not change the finding status before it is met. |
| **AI is reintroduced without the controls** | A later code change could enable an explainer without a decision record. | Keep `FEATURES.aiExplainerEnabled = false`; require a new decision record, vendor review and Path B tests before enabling it. |
| **Residual privacy/security risk remains** | Removing the model removes one data flow, but hosting, email, auth, backups and logs remain in scope. | Do not treat Path A as a security approval; `SC-03` and `SC-05` remain open. |

**Residual-risk decision:** Path A accepts the product consequence that no AI capability is claimed and that the reviewer summary remains extractive. It does **not** accept legal, privacy, security or vendor risk on counsel's behalf. If counsel concludes that the amended wording changes a legal disclosure or commitment, the owner must resolve that before the amendment is relied on outside engineering; if the product requirement cannot be amended, the owner must choose Path B or defer.

## 7. Implementation and closure rule

### Current issue status

| Step | Status | Evidence |
| --- | --- | --- |
| 1. Owner approval | **Complete** — owner-directed electronic approval | §8 |
| 2. Issue specification version `1.1` | **Complete** | [Issued amendment](2026-10-28-sc-01-specification-v1.1.md); hash in [`2026-10-28-sc-01-issue.sha256`](2026-10-28-sc-01-issue.sha256) |
| 3. Apply all redlines and sweep AI/model references | **Complete** — thirteen redlines plus two non-substantive normalisations | Issued amendment §§2–4 |
| 4. Customer-surface copy review | **Complete** — no AI-active claim or AI-generated summary label found | [Copy walkthrough](2026-10-28-sc-01-copy-walkthrough.md) |
| 5. `check:docs`, `typecheck`, `build` | **Partial** — `check:docs` passed 28 October 2026; `typecheck` and `build` pending | Command output in this session; re-run before closure |
| 6. Non-customer walkthrough | **Complete** — permission, review and portal labels captured from the rendered preview | [Copy walkthrough](2026-10-28-sc-01-copy-walkthrough.md) |
| 7. Dated closure note and register update | **Pending** | Required before closure |
| 8. Mark `SC-01` resolved | **Pending** | Only after steps 4–7 |

1. The product owner records **Approve Path A**, their name, the date and any conditions in §8.
2. Issue the amended specification as version `1.1`, with the amendment date, author, change log, its SHA-256 and the superseded text or hash.
3. Apply all redlines in §4 and search the issued specification for every AI/model reference listed in §6. Record any deliberate retention (for example, the conditional “any model provider” language).
4. Review every customer surface for an AI-assistant claim and every portal label for an “AI-generated summary” claim. Keep `FEATURES.aiExplainerEnabled = false`.
5. Run `npm run check:docs`, `npm run typecheck` and `npm run build`; record the commands and results.
6. Walk the permission screen, review screen and portal draft-summary label with a non-customer case. Record the visible text; a code inspection alone is not the copy review.
7. Write a dated closure note that links this record, the issued amendment and the copy-review evidence. Update [`AUDIT-INDEX.md`](AUDIT-INDEX.md) and the current finding register, but do not edit the preserved A6 package or its manifest.
8. Mark `SC-01` **Resolved — specification amended** only after steps 1–7. If any step fails, it stays open.

### Acceptance tests

- [x] The approved decision names Path A, the approver, the date and any conditions. The approval method is recorded in §8.
- [x] The issued specification has a version, date, SHA-256 and superseded-version record.
- [x] All §4 redlines are applied, plus two non-substantive editorial normalisations recorded in the issued amendment.
- [x] The issued specification contains no unqualified claim that the interview is AI-operated or that the summary is AI-generated.
- [x] No customer page, consent text, README claim or portal label says an AI assistant is active or that the summary is AI-generated. The rendered portal scan and the customer-copy source scan are in the [copy walkthrough](2026-10-28-sc-01-copy-walkthrough.md#7-customer-copy-source-scan).
- [x] `FEATURES.aiExplainerEnabled` is `false` and no model provider or key is configured.
- [x] `npm run check:docs` passes after the issuance.
- [ ] `npm run typecheck` and `npm run build` pass.
- [x] The non-customer walkthrough records the permission, review and portal-summary labels. See [copy walkthrough](2026-10-28-sc-01-copy-walkthrough.md).
- [ ] The closure note links the evidence and the A6 package remains hash-clean.

**Approval method note:** the owner approved Path A by explicit instruction in the project session. That instruction is retained in §8 and this record is the artifact. It is not a handwritten signature, a signed PDF or a cryptographic signature. If the owner requires one of those instruments, the approval block must be re-executed before the record is relied on outside engineering.

## 8. Approval block

The accountable owner completed this block by owner-directed electronic approval on 28 October 2026. The retained instruction is the approval artifact; engineering recorded it at the owner's direction and did not sign on the owner's behalf.

| Role | Name | Decision | Date | Evidence |
| --- | --- | --- | --- | --- |
| Product/business owner | Richard Parslow | [x] Approve Path A  [ ] Reject  [ ] Defer | 28 October 2026 | Owner instruction in the project session, retained below. |
| Counsel, if the amendment changes legal copy | Pending | [ ] Reviewed  [x] Not required for engineering issuance; required before external reliance | — | The amendment does not change customer-facing legal text; `SC-05` remains open. |
| Engineering copy review | Richard Parslow / engineering walkthrough | [x] Complete | 28 October 2026 | [Copy walkthrough](2026-10-28-sc-01-copy-walkthrough.md); no AI-active claim or AI-generated summary label found. |

**Residual-risk acceptance:** [x] I have read §6 and accept the product consequences of Path A, subject to the stated legal, privacy and vendor reviews. Accepted by Richard Parslow by the same owner instruction.

**Approval evidence:** On 28 October 2026 the product/business owner instructed: “Sign the SC-01 decision and issue specification version 1.1 with the thirteen redlines and hash record.” This record retains that instruction as the owner-directed approval artifact. Engineering recorded the approval at the owner's direction; it did not sign on the owner's behalf.

**Approval note:** a dated signature, a signed PDF, a dated owner-authored commit or a retained owner-directed approval artifact is acceptable evidence. A code flag, a chat message without a retained artifact, or an unsigned draft is not. This approval is electronic and owner-directed, not handwritten.

## 9. Evidence used

- A6 finding: [`SC-01`](2026-10-28-spec-conformance/ISSUES.md#sc-01--the-ai-assistant-and-ai-generated-summary-are-not-implemented).
- A7 finding: [`A7-05`](2026-10-28-freebuff-full/REPORT.md#a7-05--the-specifications-ai-assistant-and-ai-generated-summary-are-not-implemented).
- Remediation plan: [`SC-01` decision gate and acceptance tests](2026-10-28-sc-01-sc-05-remediation-plan.md#4-sc-01--ai-assistant-and-ai-generated-summary).
- Preserved specification text: [`owner-specification.txt`](2026-10-27-qwencloud/evidence/owner-specification.txt), lines 1–2, 6–10, 45–47, 93–94, 292–294, 302–308, 389–391, 419–421, 430–431, 476–478, 541, 570–572 and 623–629; SHA-256 `3a46ab09d5cc3831ddd7b100d115947d7377ec92780e525f3db103aac6eb547b`.
- Current build: [`site.ts`](../src/config/site.ts#L69), [`PermissionStep.tsx`](../src/features/intake/PermissionStep.tsx#L25), [`consentTexts.ts`](../src/features/consent/consentTexts.ts#L34), [`engine.ts`](../src/features/interview/engine.ts#L390), [`CaseReview.tsx`](../src/features/portal/CaseReview.tsx#L335), and the root [`README.md`](../README.md#L26).
- Rendered copy walkthrough: [`2026-10-28-sc-01-copy-walkthrough.md`](2026-10-28-sc-01-copy-walkthrough.md) — permission, review, signed-out portal, preview gate, case queue and draft-summary labels captured on 28 October 2026.
