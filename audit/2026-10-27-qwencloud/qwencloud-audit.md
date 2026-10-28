# Life Policy Pilot — Qwencloud pre-underwriting audit

**Audit date:** 27 October 2026  
**Repository:** `richardparslow-commits/Pre-Underwriting-Agent-Specification`  
**Branch:** `main`  
**Commit:** `07fdbfe632d48ef363caac086e82b8c2f13277a2`  
**Commit date:** 2026-10-27 12:39:09 −05:00  
**Prompt:** [`INPUT-QwencloudPre-Underwriting-Agent.md`](INPUT-QwencloudPre-Underwriting-Agent.md)  
**Verdict:** **NOT READY to accept real customer health information.** The local preview is usable for labelled, fictitious demonstration only.

This is a read-only audit. No application, source, test, migration, workflow or configuration file was changed. The only new files are under `audit/2026-10-27-qwencloud/` and the disposable `.tmp/qwencloud/` workspace. Nothing was deployed, pushed, committed, emailed, texted or run against a production project.

---

## 1. Verdict and scope

### 1.1 The honest description

The repository is a well-organised, unusually candid prototype of the guided interview described in the owner specification. It builds, typechecks, renders a coherent preview, implements a deterministic question engine, records distinct answer states, has a reviewer portal, a minimal notification template and a serious first pass at RLS. It is suitable for a labelled local demonstration with clearly fictitious data.

It is **not** ready to accept a real applicant's health information. The public server accepts a client-authored questionnaire snapshot as if it were authoritative; the questionnaire does not preserve seven source windows and has no source-verified row; client-supplied crisis and review flags can suppress the urgent-review signal; branch-closed details remain in the record; there is no submission idempotency, retry claiming or replay-safe delivery evidence; reviewer MFA is not enforced; and there is no retention, deletion, backup or incident-response control.

### 1.2 Scope of this verdict

| Scope | Verdict | Meaning |
|---|---|---|
| Source review and repository inspection | Complete | Current HEAD, all traced files, migrations, functions, tests, scripts, CI, docs and available history. |
| Local build, typecheck, unit tests and isolated probes | Complete | Fresh commands run in this audit; results in section 7. |
| Isolated PostgreSQL migration/RLS replay | Complete in PGlite | 25 checks passed; not a substitute for a live Supabase project. |
| Browser, keyboard and screen-reader walkthrough | Not run | No browser automation was used in this audit. |
| Live Supabase, Resend, mailbox, MFA and backup configuration | Not available | Deployed RLS, provider delivery, mailbox ownership and retention execution remain unverified. |
| Legal/regulatory certification | Out of scope | This is an engineering audit, not a HIPAA, TCPA, Texas-insurance or counsel opinion. |

### 1.3 The Qwencloud prompt is incomplete

The supplied Qwencloud file is **53 lines / 2,296 bytes** and ends at the workflow line `→ human review` with an unclosed code fence. It contains a title, repository/stack inputs, a short product summary and the workflow, but **no detailed questionnaire requirements, severity definitions, test commands, output format or completion criteria** after that point.

The audit therefore did not invent requirements from the missing portion. It used:

1. the owner-supplied specification PDF, extracted to [`evidence/owner-specification.txt`](evidence/owner-specification.txt);
2. the developer handoff PDF, extracted to [`evidence/developer-handoff.txt`](evidence/developer-handoff.txt);
3. the controlled source questionnaire and its committed extraction;
4. the repository's README, launch gates and reconciliation documents;
5. the audit framework and evidence standards in the request that supplied this file.

This limitation is recorded as an evidence gap. If the missing Qwencloud portion contains additional mandatory requirements, this report does not claim to have tested them.

### 1.4 What changed since the prior audit

The prior audit baseline was the same commit. The prior 18 findings all reproduce. This audit adds six findings that were previously only implied or treated as operational notes:

- **QW-04** — client-supplied crisis and review flags are not re-derived.
- **QW-12** — revocation and suppression are promised but unimplemented.
- **QW-17** — confirmation copy says "queued" when nothing was sent.
- **QW-22** — MFA enrollment is not MFA enforcement.
- **QW-23** — no retention, deletion, backup or incident-response control.
- **QW-24** — live portal never records an "opened" access entry.

The two prior lists remain frozen in `audit/archive/2026-10-27-pre-qwencloud/`; see [`PRIOR-LISTS.md`](PRIOR-LISTS.md).

---

## 2. Audit baseline

### 2.1 Repository state

| Item | Value |
|---|---|
| Repository | `richardparslow-commits/Pre-Underwriting-Agent-Specification` |
| Branch | `main` |
| Commit | `07fdbfe632d48ef363caac086e82b8c2f13277a2` |
| Commit subject | `Guard marketing consent evidence behind enabled channels` |
| Working tree | No tracked changes; only untracked `.tmp/` and `audit/` audit artifacts |
| History available | 5 commits |
| Node / npm | v24.16.0 / 11.13.0 |
| Git | 2.54.0 (Apple Git-157) |
| Deno | 2.9.6 (stable, aarch64-apple-darwin) |
| TypeScript | 6.0.3 (Deno built-in) |
| OS | macOS 27.0.1 |
| Source PDF | 7 pages, 228,101 bytes, SHA-256 `afe91d876f2c9e932302267ad10d0c46b774b4161efea8d0d2ffe71e3c82cca2` |
| Inventory hash | Same SHA-256 recorded in `sourceInventory.ts` |

Baseline evidence: [`evidence/baseline.txt`](evidence/baseline.txt). The tracked tree was not modified at any point; `git diff --stat` was empty.

### 2.2 Inputs inspected

| Input | Status | Use |
|---|---|---|
| `Life Policy Pilot  Pre-Underwriting Agent Specification.pdf` | Read as extracted text | Primary owner requirements and production acceptance tests. |
| `preunderwriting-handoff.pdf` | Read as freshly extracted text | Developer handoff, question-bank rules, secure submission, launch gates. |
| `source/Detialed-Life-insurance-Questions.pdf` | Read, hashed and independently re-extracted | Controlled questionnaire; 113 bullets; hash matches inventory. |
| `source/Detialed-Life-insurance-Questions.txt` | Read and normalized-compared | Committed extraction; 113 bullets, 2,568 words. |
| `TCPA Explained_ Stay Compliant and Avoid Penalties.pdf` | Available as background | Not treated as controlling legal authority; not re-read line-by-line in this run. |
| `For a life insurance website, what should an AI Bo.pdf` | Available as background | Not treated as controlling; the build contains no AI model. |
| `Life Policy Pilot  Pre-Underwriting Agent Specification copy.pdf` | Available | Apparent duplicate; not counted as independent corroboration. |
| `QwencloudPre-Underwriting Agent.md` | Read | Incomplete as described in 1.3. |

The source PDF and its committed extraction are not byte-identical because the PDF text layer puts one Bankruptcy bullet in a different reading order. The normalized text is otherwise identical:

- 113 bullets in the PDF, 113 in the committed extraction, 113 in `sourceInventory.ts`.
- 2,568 normalized words in both extractions.
- One transposition: the fresh extraction places `If Chapter 7, was this personal or business?` before the general bankruptcy question; the committed extraction places it after. The inventory's semantic order is the more natural reading.
- Evidence: [`evidence/source-normalization.txt`](evidence/source-normalization.txt).

This proves hash and word-level fidelity, not semantic or legal approval of the inventory or the bank.

### 2.3 Commands actually run

| Command / scenario | Result |
|---|---|
| `git rev-parse HEAD`, `git status --porcelain`, `git diff --stat` | `main` at the baseline commit; no tracked changes. |
| `shasum -a 256 source/Detialed-Life-insurance-Questions.pdf` | Matches inventory. |
| PDF text extraction and normalized comparison | 113 bullets / 2,568 words; one reading-order transposition. |
| `npm ci --ignore-scripts` in a disposable copy | Exit 0; 131 packages; 4 advisories reported. |
| `npm run typecheck` | Pass. |
| `npm run build` | Pass; 1,668 modules; 432.75 kB JS. |
| `npm run check:bank` | Pass structurally; 92 rows, 113 source items, 29 flagged, 0 signed. |
| `npm run test:consent` | 6/6 pass. |
| `deno test --allow-env --no-lock supabase/functions/tests/` | 5/5 pass. |
| `npm run report:reconciliation` in a disposable copy, then `diff` | No drift; regenerated document byte-identical. |
| Isolated validator probe (21 cases) | 14 forged/invalid cases accepted (15 accepted including the valid baseline); 6 required rejections worked. |
| Isolated engine probe | Orphan branch fields confirmed; current-crisis question works after history No/Unknown/Declined. |
| Isolated branch probe (21 checks / 14 branches) | All visibility checks pass. |
| Isolated email probe | Recipient allowlist enforced; no health/name/DOB content. |
| Isolated byte probe | 824,063-byte body passed the 512 KiB character check. |
| Isolated PostgreSQL replay (PGlite) | 25/25 expectations pass; service-role crisis metadata change not blocked by trigger. |
| `npm audit --json` | 4 advisories: 1 high, 3 moderate. |
| `npm ls vite react-router-dom @supabase/supabase-js` | vite 5.4.21, react-router-dom 6.30.6, supabase-js 2.118.0. |
| History secret-pattern scan (5 commits, 20,947-line patch) | No real key found; `.env.example` placeholders only. |
| Bundle secret-pattern scan | No service-role key, Resend key or JWT-like secret. |
| Browser / screen-reader / mobile walkthrough | **Not run.** |
| Live Supabase / Resend / mailbox / MFA / backup test | **Not available.** |

---

## 3. Architecture and trust boundaries

### 3.1 Intended flow

```text
Browser (React/Vite, answers in memory)
  → POST /functions/v1/submit-case          [public, JWT verification off]
  → validateDraft()                         [shape/vocabulary only]
  → service-role insert into public.cases   [immutable payload snapshot]
  → Resend minimal email                    [reference, time, portal URL]
  → public.cases.notification_state         [queued / accepted / delivered / failed / not_sent]
  → /portal magic-link sign-in              [Supabase Auth]
  → authenticated reviewer + is_reviewer()  [RLS]
  → case view / review log / correction RPC
  → email-events webhook                    [shared secret, status update]
```

Preview mode replaces the live path with an in-memory `Map` and an explicit `not_sent` state. It does not write browser storage or call email.

### 3.2 Trust boundaries

| Boundary | What is trusted | What is not | Audit result |
|---|---|---|---|
| Browser → `submit-case` | Nothing should be authoritative | Names, answers, consent records, acknowledgement, flags, crisis state | The server validates shape but trusts the client's question identity, source text, timeframe, review status, disposition, consent wording/version, acknowledgement, crisis flag and flags. **QW-01/02/04.** |
| `submit-case` → database | Service role | Browser | The service role can write the case and notification columns; RLS blocks anon and non-reviewers on reads. **QW-21** for trigger scope. |
| Reviewer → portal | A Supabase session plus `reviewers` membership | Everyone else | RLS and reviewer allowlist work in PGlite; no AAL2 requirement. **QW-22.** |
| Notification → provider | Recipient constant and allowlist | Browser or answer text | Recipient cannot be redirected; email content is minimal. **Pass, static.** |
| Provider webhook → database | Shared secret holder | Arbitrary callers | No signature, timestamp, replay or monotonic-state control. **QW-08.** |
| Portal → correction/review RPC | Reviewer role | Anonymous/non-reviewer | Both RPCs check `is_reviewer()`; append-only corrections pass. |
| Browser → analytics/logs | No analytics installed | N/A | No pixels, session replay, URL answers or browser storage found. Live provider logs unverified. |

### 3.3 Sensitive data destinations

| Data | Destination | Evidence |
|---|---|---|
| Health answers, DOB, contact fields | Supabase `cases.payload` (service role), reviewer browser | `supabase/functions/submit-case/index.ts`; `src/lib/api.ts` |
| Case reference, submitted time | Notification email | `_shared/email.ts` — no name, DOB or health content |
| Consent wording/version/timestamp | `cases.payload` | Client-authored; **QW-02** |
| Crisis flag | `cases.crisis_disclosure` | Client-authored; **QW-04** |
| Review actions/corrections | `case_review_log`, `case_corrections` | Append-only; no "opened" entry; **QW-24** |
| Auth session | Supabase browser session storage (token only) | `src/integrations/supabase/client.ts`; no health answers in localStorage/sessionStorage |
| Analytics/session replay | None found | Negative result; no analytics package or pixel |
| AI/model provider | None | No model call; deterministic summary only |

### 3.4 What is genuinely absent

- No carrier application, quote, rate class, eligibility decision or automatic decline.
- No AI model. The "draft summary" is deterministic and extractive; customer copy correctly avoids claiming an AI assistant is active when `FEATURES.aiExplainerEnabled` is false. This is a **documentation conflict with the owner spec's "identify the assistant as AI" and "AI-generated draft summary"**, not a hallucination finding.
- No analytics, pixels, session replay or tag manager.
- No production deployment in this checkout.

---

## 4. Prioritized findings

The complete record for every finding — classification, verification status, observed behaviour, evidence, consequence, smallest remediation and acceptance test — is in [`qwencloud-issues.md`](qwencloud-issues.md), with machine-readable copies in [`qwencloud-issues.json`](qwencloud-issues.json) and [`qwencloud-issues.csv`](qwencloud-issues.csv).

**Totals:** 24 findings — 0 Critical, 4 High, 10 Medium, 9 Low, 1 Informational. **13 block launch now**; 11 are nonblocking, conditional or pre-enable gates.

### 4.1 Blocking findings (13)

| ID | Severity | Finding | Why it blocks |
|---|---|---|---|
| QW-01 | High | Public submission accepts a fabricated questionnaire snapshot | Held, invented and altered rows can enter the immutable case. |
| QW-02 | High | Consent evidence is client-asserted | The record can claim wording, version, channel and time the customer never saw. |
| QW-03 | High | Seven source windows replaced; zero rows source-verified | The bank is not the approved questionnaire it claims to be. |
| QW-04 | High | Crisis and review flags are client-authored | A forged payload can suppress urgent review. |
| QW-05 | Medium | Branch-closed details survive submission | Withdrawn health detail remains in the payload and portal. |
| QW-06 | Medium | No submission idempotency | Timeouts and double submits create duplicate cases. |
| QW-07 | Medium | Retry can duplicate sends; no row claiming | Overlapping workers and crash windows can duplicate email. |
| QW-08 | Medium | Delivery webhook accepts replay/out-of-order events | Delivery status can be forged or regressed. |
| QW-09 | Medium | Deployment/JWT/retry schedule absent from repo | A by-the-repo deployment can reject submissions or never retry. |
| QW-10 | Medium | No adult/self or jurisdiction verification | A minor, third party or invented state can submit. |
| QW-11 | Medium | Held sensitive source text is shown to customers | The product exposes the HIV/suicide/immigration wording it says it withholds. |
| QW-22 | Medium | MFA enrollment is not enforcement | A password-only session can read every case. |
| QW-23 | Medium | No retention, deletion, backup or incident control | Real health data cannot be lawfully or safely lifecycle-managed. |

#### QW-01 — The public endpoint trusts the client's questionnaire snapshot

`validateDraft` checks that answer records have fields, known section names, known disposition vocabulary, `status` of `core`/`supplemental`, and `reviewStatus` of `approved`/`human_review_required`. It does not check the question ID against an approved bank, does not check source text, timeframe, review status or disposition against the bank, and never requires the answer set to be complete. [`case.ts:226-441`](supabase/functions/_shared/case.ts#L226-L441); [`submit-case/index.ts:101-155`](supabase/functions/submit-case/index.ts#L101-L155).

The fresh probe accepted **14 forged/invalid cases** (plus the one valid baseline, for 15 accepted of 21), including a held HIV row marked `approved`, a held visa/green-card-number row, `INVENTED-99` with invented source text and "Past 99 years", an empty answer set, an invented questionnaire version, and a client-invented `not_applicable` disposition that hides a row from the summary. It rejected only missing intake/privacy permission, marketing without a phone, duplicate question IDs, 401 answers and non-self relationship.

Consequence: a reviewer cannot distinguish an authentic submission from a fabricated one, and held sensitive data can enter the store through the public endpoint. Remediation is a canonical server-side bank, strict re-derivation of every field, rejection of held/unknown/stale rows and a required complete inventory. Acceptance: forged held/invented/timeframe/zero-answer payloads return 422 and write nothing.

#### QW-02 — Consent evidence is not server policy

The server requires consent objects with `granted: true` for `intake_permission` and `privacy_acknowledgement`, but trusts client-provided IDs, labels, wording, versions and timestamps. [`case.ts:271-330`](supabase/functions/_shared/case.ts#L271-L330), [`case.ts:409-423`](supabase/functions/_shared/case.ts#L409-L423). It accepted marketing records while no channel or seller was configured, an unknown consent ID, a duplicate privacy acknowledgement, a substituted text/version, a future consent timestamp with reversed chronology, an arbitrary acknowledgement ID/version, and a marketing `numberAuthorized` that did not match the lead phone.

The displayed privacy version is `2026-10-a`, but the privacy record is stamped with the shared `2026-10-b` consent version. [`consentTexts.ts:18-21`](src/features/consent/consentTexts.ts#L18-L21), [`marketingConsent.ts:152-159`](src/features/consent/marketingConsent.ts#L152-L159). That is **QW-13**, but it is a symptom of the same root cause: the client owns the evidence.

The marketing portion is currently a **pre-enable gate**, because marketing is off by default and no channel is active. It becomes a live consent defect the moment a channel flag and legal seller are configured. Acceptance: forged marketing while disabled, wrong version/text, unknown/duplicate IDs and future timestamps return 422; a valid draft stores separate client and server receipt times.

#### QW-03 — The bank is not the source questionnaire

All 92 bank rows have `sourceVerified: false`; 87 are nonetheless `reviewStatus: approved` and shown. The reconciliation records 55 exact matches, 3 compound splits, 11 wording changes, 7 timeframe changes, 9 LPP additions, 2 misattributions and 5 held rows. 29 rows carry flags; 37 are listed for sign-off once the three compound splits are included.

| ID | Source window / item | Customer-facing window | Effect |
|---|---|---|---|
| MED-10 | Current disability/confinement + past 5 years unable to work (`SRC-021`, `SRC-022`, `SRC-037`) | Past 5 years unable to work | Current confinement and 30-hour/benefit wording are not collected. |
| AVI-04 | Next 2 years (`SRC-050`) | Next 12 months | Narrows the future-flying window. |
| AVO-01 | Past 2 years / next 2 years intended (`SRC-055`) | Past 5 years | Narrows past and drops intended participation and the full activity list. |
| RES-02 | Lived consistently in USA for past 5 years + travel/residence details for past 2 years (`SRC-101`, `SRC-103`) | Lived outside USA for a month or more in past 5 years | Replaces two source questions with a different one. |
| RES-03 | Next 2 years + 30/180-day thresholds (`SRC-099`, `SRC-100`) | Next 12 months | Narrows the future-travel window and drops thresholds. |
| MIL-01 | Current active duty (`SRC-109`) | Ever served | Widens the question and changes its meaning. |
| MIL-03 | Current/planned deployment and country list (`SRC-110`) | Past 12 months active duty/deployed | Changes the window and drops the planned-deployment branch. |

This is not a semantic quibble. The owner handoff says: "Do not silently omit or merge overlapping questions with different lookback windows." The repository's own README says "no row collapses lookbacks" while these seven replace windows. `sourceVerified: false` is honest; `reviewStatus: approved` is not an approval of the source deviation. A named owner/counsel/underwriting decision is required for every one of the 37 rows, including the 7 windows, the 11 wording changes, the 9 LPP additions, the 2 misattributions and the 5 held rows.

#### QW-04 — A forged payload can suppress the crisis signal

`submit-case` stores `draft.crisisDisclosure` in the `crisis_disclosure` column and stores client-provided `flags` in the payload. [`submit-case/index.ts:131-142`](supabase/functions/submit-case/index.ts#L131-L142), [`case.ts:425-460`](supabase/functions/_shared/case.ts#L425-L460). The client computes both from the answer set, but the server never re-derives them. The probe accepted `MH-05 = Yes` with `crisisDisclosure: false` and `flags: []`.

The portal uses `crisis_disclosure` for the "Current safety disclosure" banner and queue badge, and the payload flags for the "Review flags" panel. [`PortalPage.tsx:171`](src/pages/PortalPage.tsx#L171), [`PortalPage.tsx:252`](src/pages/PortalPage.tsx#L252), [`CaseReview.tsx:267`](src/features/portal/CaseReview.tsx#L267), [`CaseReview.tsx:412-417`](src/features/portal/CaseReview.tsx#L412-L417). A client bug or attacker can therefore hide the urgent path for a customer who disclosed current self-harm thoughts.

Remediation: derive both from the canonical MH-05 answer server-side; reject client flags that contradict answers; test `MH-05 Yes + crisisDisclosure:false`. This is a new High finding in this audit.

#### QW-05 — Branch-closed details remain

`setAnswer` merges a patch into the existing answer and does not delete descendants when a parent becomes invisible. [`useInterview.ts:145-156`](src/features/interview/useInterview.ts#L145-L156). `toSubmittedAnswers` emits `fields` and `details` for every row, including `not_asked`. [`engine.ts:251-279`](src/features/interview/engine.ts#L251-L279). The portal renders fields/details regardless of disposition. [`CaseReview.tsx:83-106`](src/features/portal/CaseReview.tsx#L83-L106).

The fresh probe set MH-01 Yes, entered four MH-02 fields, then changed MH-01 to No: MH-02 became `not_asked` but still carried four fields. A customer who withdraws an answer still sends the withdrawn health detail. Remediation: delete hidden descendants on parent change, omit fields/details for `not_asked`, render no components for that disposition, and test nested branches.

#### QW-06/QW-07 — Submission and retry are not idempotent

Every POST inserts a new case; the only uniqueness is the server-generated reference. [`submit-case/index.ts:115-165`](supabase/functions/submit-case/index.ts#L115-L165). The client sends no idempotency key and has no abortable timeout. [`api.ts:305-334`](src/lib/api.ts#L305-L334). The retry worker selects `queued`/`failed` without `FOR UPDATE SKIP LOCKED`, a lease or a claim state, sends, then updates. [`retry-case-notifications/index.ts:55-105`](supabase/functions/retry-case-notifications/index.ts#L55-L105). A lost response, double click, overlapping cron or crash after provider acceptance can duplicate the case or the email.

#### QW-08 — Webhook evidence is not trustworthy

`email-events` accepts a shared-secret header, parses JSON, maps `email.sent`/`delivery_delayed` to `accepted` and writes that state without an event ID, timestamp tolerance, signature, replay check or monotonic transition. [`email-events.ts:27-40`](supabase/functions/email-events/index.ts#L27-L40), [`email-events.ts:48-54`](supabase/functions/email-events/index.ts#L48-L54), [`email-events.ts:102-115`](supabase/functions/email-events/index.ts#L102-L115). A replayed `email.sent` can regress `delivered` to `accepted`; a delayed event can contradict the current state. The code itself notes the shared secret is not provider signature verification. [`email.ts:79-81`](supabase/functions/_shared/email.ts#L79-L81).

#### QW-09 — The deployment contract is not in the repository

README tells the operator to deploy `submit-case`, `email-events` and `retry-case-notifications` with `verify_jwt = false` and says to keep the flags in the repository. [`README.md:222-233`](README.md#L222-L233). No `supabase/config.toml` or cron/schedule definition exists. A clean deployment using the repository defaults will hit the platform JWT check on the public endpoint; a deployment without the schedule leaves queued notifications unretried. This blocks deployment, not just documentation.

#### QW-10 — The adult/self boundary is a UI assertion

The lead form uses a state `<select>` and no age/DOB field. [`LeadForm.tsx:118-137`](src/features/intake/LeadForm.tsx#L118-L137). The server accepts any 2–40-character state string and normalizes it, with no US allowlist. [`case.ts:253-258`](supabase/functions/_shared/case.ts#L253-L258). `relationship` is a constant `self`; the server rejects `other`, but that does not prove adulthood or authority. The probe accepted `ZZ`. A minor or third party can complete the interview; the DOB question arrives later and is not used for an age gate. This is a business decision with a technical enforcement gap, not merely a copy issue.

#### QW-11 — Held source text is exposed to customers

The review screen's "Questions held for human review" panel renders each held row's `sourceText` when expanded. [`ReviewScreen.tsx:274-298`](src/features/intake/ReviewScreen.tsx#L274-L298). That includes HIV/AIDS, suicide-attempt detail, immigration category and visa/green-card-number wording. The five held rows are `ID-04`, `MED-11`, `MH-06`, `RES-04`, `RES-05`. The product says these are not asked; showing the full wording to every visitor is still collection-adjacent exposure and contradicts the sensitive-question intent. Show a count and generic topics, or keep the full list in the reviewer/coverage record only.

#### QW-22 — MFA enrollment is not enforcement

The portal's auth hook reads `session.user.email` and gates on `email !== null`; it never checks `authenticatorAssuranceLevel`. [`useReviewerAuth.ts:28-36`](src/features/portal/useReviewerAuth.ts#L28-L36), [`useReviewerAuth.ts:65-70`](src/features/portal/useReviewerAuth.ts#L65-L70). `is_reviewer()` checks only membership; every reviewer policy uses it without an `aal2` condition. [`0001_pre_underwriting.sql:60-72`](supabase/migrations/0001_pre_underwriting.sql#L60-L72), [`0001_pre_underwriting.sql:135-148`](supabase/migrations/0001_pre_underwriting.sql#L135-L148). Supabase does not auto-enforce AAL2 at the API gateway; its documented enforcement is an RLS/gateway check.

A password-only `aal1` session for an MFA-enrolled reviewer can therefore read cases. `docs/LAUNCH-GATES.md` says MFA is an "operational task"; the code does not require it. This is a new Medium finding. Acceptance: password-only session sees zero cases and cannot call the review/correction RPCs; after TOTP step-up the same session succeeds.

#### QW-23 — No retention, deletion, backup or incident control

README says the retention/deletion job is not implemented. [`README.md:28-29`](README.md#L28-L29). The `cases` table has no delete policy and the migration says retention follows a schedule that is not in the repository. [`0001_pre_underwriting.sql:158`](supabase/migrations/0001_pre_underwriting.sql#L158). The privacy page and permission screen tell customers they can ask for correction or deletion. [`PrivacyPage.tsx:32-33`](src/pages/PrivacyPage.tsx#L32-L33), [`PermissionStep.tsx:37`](src/features/intake/PermissionStep.tsx#L37). The reviewer footer says retention follows the documented schedule. [`CaseReview.tsx:624`](src/features/portal/CaseReview.tsx#L624). No schedule, deletion procedure, backup expiry or incident runbook exists. This is a confirmed operational gap, not merely an unavailable live setting.

### 4.2 Nonblocking, conditional and pre-enable findings (11)

| ID | Severity | Finding | Impact |
|---|---|---|---|
| QW-12 | Medium | Revocation/suppression promised but unimplemented | Blocks enabling marketing, not the current disabled-channel build. |
| QW-13 | Low | Privacy acknowledgement records the wrong notice version | Fix with QW-02. |
| QW-14 | Low | Body cap counts characters, not bytes | 824,063-byte body passed the 512 KiB check. |
| QW-15 | Low | Rate limiter is per-instance and header-spoofable | Abuse hardening before public volume. |
| QW-16 | Low | `not_sent` cases are never retried | Operational blocker only if real cases arrive before provider setup. |
| QW-17 | Low | Confirmation says "queued" when nothing was sent | Copy contradicts the timeline in preview/not_sent. |
| QW-18 | Low | Stale/misleading docs and UI counts | Reviewers and customers can overstate coverage. |
| QW-19 | Low | Dependency/CI supply-chain exposure | 1 high + 3 moderate advisories; tag-pinned actions. |
| QW-20 | Low | Deno dependencies unpinned; no lockfile | Non-reproducible function tests/deploy. |
| QW-24 | Low | No "opened" access entry in live portal | Access accountability gap; nonblocking. |
| QW-21 | Informational | Immutability trigger omits crisis/state metadata | Service role can change triage metadata. |

#### QW-12 — Revocation is a promise, not a control

`MessagingTermsPage` promises action no later than 10 business days and describes STOP/email withdrawal. [`MessagingTermsPage.tsx:35-42`](src/pages/MessagingTermsPage.tsx#L35-L42). The `contact_suppressions` table exists, but no application code reads it, no revocation route or job writes it, and the table has no insert policy for the portal. [`0001_pre_underwriting.sql:199-224`](supabase/migrations/0001_pre_underwriting.sql#L199-L224). Marketing is currently off, so this is a **pre-enable gate**: it does not create active unlawful outreach, but the published commitment cannot be honored if a channel is switched on. Acceptance: STOP/email withdrawal creates a suppression, and every outbound attempt checks it with auditable timing.

#### QW-17 — The confirmation can claim a notification that never happened

The confirmation header always says "Your answers are saved and queued for review." [`ConfirmationScreen.tsx:37-40`](src/features/intake/ConfirmationScreen.tsx#L37-L40). In preview and when no provider is configured, the receipt is `not_sent`; the timeline below correctly says "No notification was attempted." [`StatusTimeline.tsx:38-45`](src/features/intake/StatusTimeline.tsx#L38-L45), [`api.ts:344-349`](src/lib/api.ts#L344-L349). The two statements contradict each other. Make the header conditional on notification state and give the next step when nothing was sent.

#### QW-24 — The live portal never records "opened"

`case_review_log` allows `opened` and the preview sample includes it, but `getCase` loads the case and its log without writing an opened entry, and `CaseReview` only calls `recordReview` for `marked_reviewed` and `requested_clarification`. [`api.ts:418-460`](src/lib/api.ts#L418-L460), [`CaseReview.tsx:172-187`](src/features/portal/CaseReview.tsx#L172-L187), [`0001_pre_underwriting.sql:163-171`](supabase/migrations/0001_pre_underwriting.sql#L163-L171). A reviewer can read a case without leaving access evidence. Record one idempotent opened entry per reviewer/case load.

#### QW-21 — The immutability trigger is narrower than the evidence

The trigger protects `payload`, `reference`, `submitted_at` and `questionnaire_version`. [`0001_pre_underwriting.sql:112-132`](supabase/migrations/0001_pre_underwriting.sql#L112-L132). It does not protect `crisis_disclosure` or `residence_state`. The PGlite replay changed `crisis_disclosure` as the service role without tripping the trigger; reviewer column grants blocked the same change. This is Informational, not a reviewer exploit, because the service role is trusted; include these columns or document why they are mutable.

---

## 5. Requirements and launch-gate matrix

The owner specification defines ten production acceptance tests. The repository's own status claims were checked independently.

| Gate | Audit status | Evidence | Remaining before PASS | Responsible approver |
|---|---|---|---|---|
| 1. Question coverage | **FAIL** | 113 source items, 92 rows, 85 traced, 19 partial, 9 out of scope, 0 source-verified, 7 timeframe changes, 11 wording changes, 29 flagged. | Close all 37 decisions; restore or approve the 7 windows; set `sourceVerified` only with named evidence. | Owner + counsel/underwriting |
| 2. Branch coverage | **PARTIAL** | 14 declarative branches; 21/21 isolated visibility checks pass; MH-05 unconditional. | Fix 7 replaced windows; test nested branch data removal; approve each branch rule. | Owner + underwriting |
| 3. Answer integrity | **PARTIAL** | Yes/No/Unknown/Declined distinct; blank becomes unresolved; no fabricated No in probe. | Orphan purge; server-derived crisis/flags; `not_applicable` is defined but never offered; forged disposition accepted. | Engineering |
| 4. Review and submission | **PARTIAL** | Client edit clears acknowledgement; submit disabled until checked; server requires an acknowledgement object. | Server accepts arbitrary acknowledgement; no idempotency; forged snapshot accepted. | Engineering |
| 5. Consent separation | **PARTIAL** | Marketing off by default; two required permissions; 6 consent tests + 5 Deno tests pass. | Consent evidence is client-asserted; privacy version mismatch; no revocation/suppression control. | Engineering + counsel |
| 6. Recipient control | **PASS (static)** | Server constant + allowlist; probe confirmed injected recipient falls back; email has no health/name/DOB. | No live provider test; no prompt-injection layer exists. | Engineering + provider |
| 7. Secure access | **PARTIAL** | PGlite: 25/25 isolated expectations pass (including the recorded service-role trigger gap); forwarded reference alone is denied. | No live Supabase RLS test; no AAL2 requirement; no MFA enforcement; no opened-access log. | Engineering + owner |
| 8. Delivery reliability | **FAIL** | Case-first ordering; separate states; retry updates existing rows. | No idempotency, no row claiming, no provider test, replayable webhook, no config/schedule, misleading not_sent copy. | Engineering + provider |
| 9. Leak prevention | **PARTIAL** | No analytics/pixels/session replay; no health answers in URL/storage; minimal email; bundle has no secret. | Held source text shown to customers; no retention/deletion; live logs/provider retention unverified. | Engineering + privacy counsel |
| 10. Human review | **PASS (static)** | No automated eligibility/rate/carrier action; reviewed/clarification actions logged; corrections append-only. | Live reviewer flow and "opened" access logging unverified; QW-24. | Owner |

**Independent status vs repository claims.** `docs/LAUNCH-GATES.md` marks gates 3, 4, 6, 7 and 10 "Implemented". This audit marks 3, 4 and 7 PARTIAL and 6/10 PASS only statically. The difference is not a disagreement about whether code exists; it is a disagreement about whether the code establishes the control against a hostile client and a live deployment. Gate 6's recipient control is real; its injection testing was not performed because there is no model, and the live provider path was unavailable. Gate 10's human-review boundary is real; access logging is incomplete.

---

## 6. Questionnaire fidelity

### 6.1 Recomputed totals

| Measure | Count |
|---|---:|
| Source bullets inventoried (`SRC-001`–`SRC-113`) | 113 |
| Bank rows | 92 |
| Core / supplemental | 81 / 11 |
| Approved for interview / held | 87 / 5 |
| `sourceVerified: true` | **0** |
| Source items traced to at least one row | 85 |
| Source items partly collected | 19 |
| Source items out of scope | 9 |
| Source items with no mapping | 0 |
| Reconciliation verdicts: match / split / wording / timeframe / LPP addition / misattributed / held | 55 / 3 / 11 / 7 / 9 / 2 / 5 |
| Rows with flags | 29 |
| Rows listed for sign-off (34 nonmatching/flagged + 3 compound splits) | 37 |
| `allowNotApplicable` rows | 0 |

Evidence: [`evidence/questionnaire-summary.json`](evidence/questionnaire-summary.json), [`qwencloud-questionnaire-matrix.md`](qwencloud-questionnaire-matrix.md).

### 6.2 The seven replaced windows

This is the core fidelity defect. The source IDs and exact source wording are in the appendix; the table below is the decision record.

| Bank row | Source anchor | Source window / meaning | Bank window / meaning | Required decision |
|---|---|---|---|---|
| MED-10 | SRC-021, SRC-022, SRC-037 | Current unemployment/confinement/ADL needs + past-5-year inability to work | Past-5-year inability to work only | Split current from 5-year, restore 30-hour/benefit wording, or record approved revision. |
| AVI-04 | SRC-050 | Next 2 years | Next 12 months | Restore 2 years or record approved reason. |
| AVO-01 | SRC-055 | Past 2 years / next 2 years intended, full activity list | Past 5 years, reduced list | Restore both windows and full list; each activity needs its branch. |
| RES-02 | SRC-101, SRC-103 | Consistent US residence 5 years + travel/residence details 2 years | Lived outside US ≥1 month in past 5 years | Rewrite to source questions or record as LPP addition with rationale. |
| RES-03 | SRC-099, SRC-100 | Next 2 years, 30/180-day thresholds | Next 12 months, no thresholds | Restore 2 years and thresholds; review country list. |
| MIL-01 | SRC-109 | Current active duty | Ever served | Separate current active duty from ever-served, or record LPP addition. |
| MIL-03 | SRC-110 | Current/planned deployment + country list | Past 12 months active duty/deployed | Align with source or record approved revision. |

No row may be marked source-verified merely because it has a reconciliation record. `reviewStatus: approved` is the bank's display flag, not evidence of named source or legal sign-off. The audit did not set `sourceVerified` or approve any exclusion.

### 6.3 Held rows

| ID | Topic | Current treatment | Finding |
|---|---|---|---|
| ID-04 | Sex/gender | Held; not asked | Correctly excluded from interview; source text exposed in review panel (QW-11). |
| MED-11 | HIV/AIDS | Held; not asked | Server accepts a forged approved answer (QW-01); source text exposed (QW-11). |
| MH-06 | Suicide-attempt detail | Held; not asked | Source text exposed (QW-11); current-safety MH-05 remains unconditional. |
| RES-04 | Immigration category | Held; not asked | Source text exposed; static categories need legal review. |
| RES-05 | Visa/green-card number | Held; not asked | Server accepts a forged answer with an identifier (QW-01); source text exposed. |

### 6.4 What the source check proves and does not prove

**Proves:** the PDF hash matches the inventory, the inventory has all 113 bullets, and the committed extraction has the same 2,568 normalized words except one reading-order transposition. It also proves the bank has 92 rows with a reconciliation record for each.

**Does not prove:** that every row preserves source meaning, that the 55 "matches" are semantically correct, that the 37 decisions are approved, that the 19 partial items are adequately collected, or that the 9 out-of-scope items are legitimately excluded. Those require a named human reviewer and, for legal/clinical items, counsel. A bullet count and a text match are not semantic fidelity.

### 6.5 Full appendix

The appendix contains:

- all 113 source items with page, area, source timeframe, exact text, mapped bank row(s), coverage, verdicts, flags and gap reason;
- all 92 bank rows with section, status, review status, `sourceVerified`, timeframe, source/customer wording, verdict, flags and required decision;
- CSV versions for review tooling.

Files: [`qwencloud-questionnaire-matrix.md`](qwencloud-questionnaire-matrix.md), [`qwencloud-questionnaire-matrix.csv`](qwencloud-questionnaire-matrix.csv), [`qwencloud-questionnaire-bank.csv`](qwencloud-questionnaire-bank.csv).

---

## 7. Test ledger

### 7.1 Fresh checks

| # | Check | Command / scenario | Environment | Expected | Actual | Status |
|---:|---|---|---|---|---|---|
| 1 | Baseline | `git rev-parse HEAD`, `git status`, `git diff` | Local checkout | `main` at stated commit; no tracked changes | Match | PASS |
| 2 | Source hash | `shasum -a 256 source/...pdf` | Local | Matches inventory | Match | PASS |
| 3 | Source extraction | Fresh PDF text vs committed text | Local | Same bullets/words | 113/113, 2,568/2,568; one reading-order transposition | PASS with caveat |
| 4 | Clean install | `npm ci --ignore-scripts` in disposable copy | Temp copy | Exit 0 | Exit 0; 131 packages | PASS |
| 5 | Typecheck | `npm run typecheck` | Local | Exit 0 | Exit 0 | PASS |
| 6 | Build | `npm run build` | Local | Exit 0 | 1,668 modules; 432.75 kB JS | PASS |
| 7 | Bank structure | `npm run check:bank` | Local | Exit 0; no missing reconciliation | 92 rows; 113 source; 29 flags; 0 signed | PASS structurally |
| 8 | Consent unit tests | `npm run test:consent` | Local | 6 pass | 6 pass | PASS |
| 9 | Handler consent tests | `deno test --allow-env --no-lock supabase/functions/tests/` | Local Deno | 5 pass | 5 pass | PASS |
| 10 | Report drift | Regenerate in disposable copy; `diff` | Temp copy | No diff | No diff | PASS |
| 11 | Forged validator cases | 21-case probe | Isolated Deno | Invalid cases rejected | 14 forged accepted + 1 valid baseline; 6 rejected as expected | **FAIL** |
| 12 | Branch/orphan engine | Parent flip + crisis history states | Isolated tsx | Orphans removed; crisis independent of history | 4 orphan fields retained; crisis visible/disclosed after No/Unknown/Declined | **FAIL** (orphan); PASS (crisis visibility) |
| 13 | All branches | 21 visibility checks across 14 branches | Isolated tsx | All match | 21/21 | PASS |
| 14 | Email recipient/content | Allowlist injection + forbidden-content scan | Isolated Deno | Fallback; no health/name/DOB | Match | PASS |
| 15 | Byte cap | 424,063-char / 824,063-byte body | Isolated Deno | 413 before service config | Reached service config | **FAIL** |
| 16 | Migrations/RLS | Apply 0001+0002 twice; anon/non-reviewer/reviewer checks | PGlite | Apply cleanly; deny/allow as designed | 25/25 expectations pass, including the known trigger gap | PASS with caveat |
| 17 | Trigger scope | Service-role metadata change | PGlite | Should reject or be explicitly mutable | Change accepted | **FAIL** (informational) |
| 18 | Dependency audit | `npm audit --json` | Local | No high advisories | 1 high, 3 moderate | FAIL (hardening) |
| 19 | Installed versions | `npm ls ...` | Local | Record versions | vite 5.4.21; react-router 6.30.6; supabase-js 2.118.0 | Informational |
| 20 | Secret scan | Tracked files, bundle, history | Local | No secrets | No real secret; placeholders only | PASS |
| 21 | MFA check | Search for `aal2` / assurance level | Source | Enforcement exists | None found | **FAIL** (QW-22) |
| 22 | Retention check | Search for retention/deletion jobs/policies | Source + docs | Control exists | None found | **FAIL** (QW-23) |

### 7.2 Minimum adversarial scenarios

The request supplied a floor of 14 scenarios. The table records what this audit could establish; "NOT RUN" is not a pass.

| # | Scenario | Status | What was established |
|---:|---|---|---|
| 1 | Intake completes with optional marketing disabled; no enrollment | PARTIAL | Consent builder tests prove no marketing record when channels off; full browser submit not run. |
| 2 | Missing/declined required permissions rejected through direct API | PASS | 5 Deno tests drive the real handler; 422 observed. |
| 3 | Forged disabled-marketing consent / altered versions | **FAIL** | Validator accepts both; QW-02. |
| 4 | Parent changes after detail entry; orphaned answers disappear | **FAIL** | Engine probe retains 4 fields under `not_asked`; QW-05. |
| 5 | Unknown/declined/blank/not asked/held remain distinct | PARTIAL | Unknown/declined/not_asked/held distinct; `not_applicable` not offered; forged not_applicable accepted. |
| 6 | Review acknowledgement invalidated by edits; stale/forged ack server-evaluated | PARTIAL | Client clears ack; server accepts arbitrary ack; QW-02. |
| 7 | Held/unknown IDs/changed timeframes/client source wording submitted directly | **FAIL** | All accepted by validator; QW-01. |
| 8 | Unauthenticated/non-reviewer case, correction and RPC access | PASS (isolated) | PGlite: anon denied; non-reviewer sees zero; RPC `Not authorised`. Live not run. |
| 9 | Copied notification/guessed reference does not grant access | PASS (isolated) | Case read requires reviewer session; forwarded reference alone has no session. Live not run. |
| 10 | Recipient/routing fields/instruction-like answers cannot redirect | PASS (static) | Server constant + allowlist; email probe; no model. |
| 11 | Duplicate submissions, ambiguous timeouts, overlapping retries | **NOT RUN** / static fail | No idempotency or claim; QW-06/07. |
| 12 | Forged/replayed/malformed/out-of-order delivery events | **FAIL** (static) | No signature/replay/monotonic check; QW-08. |
| 13 | Current-crisis handling with history No/Unknown/Declined | PASS | Engine probe: MH-05 visible and disclosed in all three. |
| 14 | Fictitious sensitive-data canaries across browser/network/log/email | **NOT RUN** | No browser/network harness; static scan found no analytics/storage/bundle secret. |

### 7.3 Prior claims vs fresh results

Inherited claims were not counted as fresh evidence. In particular:

- README's 31 unanswered items is stale; fresh data has 73 visible/unanswered on an empty interview.
- README's "no row collapses lookbacks" is false for the seven rows above.
- `src/config/site.ts` says 56 rows; the bank has 92.
- The landing page labels 76 approved core rows as "Source questions"; the source inventory has 113, 85 traced.
- The prior audit's 18 findings are reconfirmed, not copied; the six new findings are listed in 1.4.

---

## 8. Documentation contradictions

| Claim | Actual | Consequence |
|---|---|---|
| `site.ts` comment: 56 rows | 92 rows | Stale reviewer mental model. |
| README: 31 unanswered in walkthrough | 73 visible/unanswered on empty interview | Misstates completeness. |
| README: "no row collapses lookbacks" | 7 rows replace windows | Contradicts the primary fidelity defect. |
| Landing page: "Source questions 76" | 113 source items, 85 traced | Customer-facing overstatement. |
| README/LAUNCH-GATES: 92 rows reconciled | 29 flagged, 37 decisions, 0 source-verified | "Reconciled" is not "approved". |
| `bankReconciled: true` | Records exist; no sign-off | The flag can be read as approval; it is not. |
| LAUNCH-GATES: gates 3, 4, 6, 7 Implemented | 3/4/7 partial; 6 static only | Overstates controls against a hostile client/live deploy. |
| Spec: "identify the assistant as AI"; "AI-generated summary" | Deterministic engine; truthful non-AI copy | Requirement conflict; owner must amend spec or add an approved AI layer. |
| LAUNCH-GATES: gate 5 "Not started" revocation | Consistent with code; but MessagingTerms promises 10-day action | A published promise without a control; QW-12. |
| `NOT_APPLICABLE_OPTION` exists | Never rendered; 0 rows allow it | Required answer state is not actually reachable. |
| Confirmation: "saved and queued" | `not_sent` in preview/provider-missing | Customer can believe reviewer was notified; QW-17. |

No contradiction was resolved by changing code or documentation. They are reported for owner decision.

---

## 9. Remediation sequence

Do the work in this order. Earlier phases establish authority that later tests depend on. Do not deploy a live intake while any blocking phase is open.

### Phase 0 — Freeze real data

- Keep `VITE_APP_MODE=preview`; do not set `VITE_APP_MODE=live`.
- Do not enable marketing channels.
- Keep the sample case labelled; delete it before any real launch.
- If a real provider/project was configured outside this checkout, rotate keys if they were exposed and confirm no real case exists.

**Exit:** written confirmation that the environment accepts fictitious data only.

### Phase 1 — Make the server authoritative (QW-01, QW-02, QW-04)

1. Move the canonical question bank into a server-importable module (or generate a server copy at build time) with ID, source text, timeframe, status, review status, disposition rules, components and held flag.
2. `validateDraft` rebuilds every answer from the canonical row; reject unknown IDs, held rows, changed source text/timeframes, incomplete inventories, invalid `not_applicable`, and client flags that contradict answers.
3. Derive `crisisDisclosure` from MH-05 and derive flags from the answer set; ignore client flags.
4. Replace client-authored consent evidence with server constants for IDs, versions and wording hashes; enforce channel/seller policy; reject duplicates, unknown IDs, mismatches and future timestamps; store server receipt time separately.
5. Require the current questionnaire version and the exact submission acknowledgement; reject stale acknowledgement IDs.

**Exit:** all 21 validator cases either reject forged input or store server-derived values; no held/test row writes; acceptance test `MH-05 Yes + false flag` fails closed.

### Phase 2 — Approve the questionnaire (QW-03, QW-11, QW-13, QW-18)

1. Produce a signed decision table for all 37 rows; restore the seven windows or record named approval with rationale/date.
2. Obtain legal/clinical review for the five held topics; keep their source text out of the customer panel.
3. Fix the privacy version stamp; bump `QUESTIONNAIRE_VERSION`; regenerate the report.
4. Correct the counts and claims in `site.ts`, landing page, README and LAUNCH-GATES; make counts generated.
5. Set `sourceVerified: true` only with named evidence, per row.

**Exit:** `check:bank` still passes; every row has a named decision; 0 held rows are offered; customer DOM contains no held source text; all counts match generated data.

### Phase 3 — Answer integrity and eligibility boundary (QW-05, QW-10)

1. Delete hidden descendants on parent change; omit fields/details for `not_asked`; render no components for them.
2. Add an adult/self attestation before health questions; capture DOB and compute age server-side; validate state against the US list; reject non-self and under-18 payloads.
3. Implement or remove `not_applicable`; if kept, require an approved rule ID.
4. Test nested branches, parent flips after detail entry, forged not-applicable, 17-year-old, `ZZ` and third-party payloads.

**Exit:** parent flip leaves no hidden data anywhere; adult/state forgery returns 422; every branch test passes.

### Phase 4 — Submission and delivery reliability (QW-06, QW-07, QW-08, QW-09, QW-16, QW-17)

1. Add an idempotency key per draft with a unique index; replay returns the original receipt.
2. Add row claiming/lease (`FOR UPDATE SKIP LOCKED` or equivalent), a `sending` state, attempt limits and provider idempotency keys.
3. Verify provider webhook signatures over the raw body; add timestamp tolerance, event-ID dedupe and monotonic state transitions; never regress `delivered`.
4. Commit `supabase/config.toml` with the three `verify_jwt = false` settings and a documented retry schedule.
5. Add a re-notify path for `not_sent`; make confirmation copy conditional.
6. Test rapid double submit, ambiguous timeout, crash-after-accept, overlapping workers, replayed/out-of-order events, provider rejection/timeout and mailbox receipt.

**Exit:** concurrent/timeout submissions create one case; crash/overlap sends one email; webhook replay cannot change state; confirmation matches state.

### Phase 5 — Access and data lifecycle (QW-22, QW-23, QW-24, QW-21, QW-12)

1. Require `aal2` in reviewer RLS or a trusted gateway; portal refuses `aal1` with a step-up prompt.
2. Record an idempotent `opened` access entry; show it in the review log.
3. Approve and implement retention/deletion, backup expiry and incident response; audit deletions; test a labelled deletion.
4. Include `crisis_disclosure`/`residence_state` in immutability or document why they are mutable.
5. Implement revocation/suppression before enabling any marketing channel; check suppression on every outbound attempt.

**Exit:** password-only session sees no case; opened entry exists; labelled deletion works; incident runbook names owner/contact; STOP blocks outbound.

### Phase 6 — Hardening (QW-14, QW-15, QW-19, QW-20)

1. Measure body bytes, not characters; reject before full buffering where possible.
2. Put a durable/WAF limiter in front; do not trust a spoofable header.
3. Upgrade Vite/react-router to patched releases; pin CI actions to SHAs; review `npm ci` scripts.
4. Pin Deno dependencies and commit `deno.lock`; run CI with the lockfile.

**Exit:** multibyte >512 KiB returns 413; header rotation/second instance cannot bypass limit; no high advisory; clean CI uses lockfile.

### Parallel — Legal and business approvals

Counsel must approve the legal entity, privacy notice, intake permission, TCPA disclosure (if marketing), sensitive-question handling, HIPAA/Texas applicability and vendor roles. These are not engineering acceptance tests and cannot be closed by code.

---

## 10. Owner and counsel questions

Only questions that materially affect launch or remediation:

1. **Legal entity:** What is the actual legal operating entity? `VITE_LEGAL_ENTITY` is empty, so marketing is disabled. Is that the intended launch state?
2. **Questionnaire approval:** Who is the named reviewer for the 37 decisions? Are the seven changed windows approved, or must they be restored? What is the approval date/version?
3. **Held questions:** Are the five held topics permanently out of scope, or awaiting a separate approval? Should customers see only a count/topics, or nothing at all?
4. **AI:** Is an AI assistant required for launch? If yes, the current deterministic build does not meet the spec's AI wording and needs a separate model/privacy review. If no, will the owner amend the spec's "identify as AI" and "AI-generated summary" requirements?
5. **Crisis path:** Must the interview hard-pause on a current-crisis Yes, or is the current non-modal panel plus manual "pause and review" acceptable? Who approves the crisis script?
6. **Adult/self:** What age and authority evidence is required? Is a DOB + self-attestation sufficient, or is a separate third-party/minor process needed?
7. **MFA:** Is MFA mandatory for the reviewer? If yes, enforce AAL2 in RLS; enrollment alone is not enforcement.
8. **Retention:** What retention period, deletion method, backup retention and legal-hold rule apply? Who owns deletion requests?
9. **Marketing:** Will calls/texts ever be enabled? If yes, who is the authorized seller, what numbers/channels, and who owns STOP/revocation and the suppression list?
10. **HIPAA/Texas:** Does the actual entity/vendor arrangement trigger HIPAA, Texas Insurance Code Chapter 602, or another regime? Are BAAs required? This is a counsel decision, not a website badge.
11. **Source version:** Is the committed PDF the final approved source? Its hash matches the inventory; a replacement invalidates the reconciliation.
12. **Mailbox/provider:** Who owns `richardparslow@lifepolicypilot.blog`, how is it secured, and which Resend domain/sender is approved?
13. **Not applicable:** Is an approved "Not applicable" state required? If yes, which rules authorize it? If no, remove the option and the claim.

---

## 11. Explicitly unverified areas

These are not passes:

- Live Supabase RLS, grants, policies and RPC behavior. PGlite is a useful simulation, not the deployed project.
- Live reviewer sign-in, magic-link redirect, session expiry, logout, MFA enrollment and AAL2 enforcement.
- Resend account, sender-domain verification, provider acceptance, inbox delivery, bounce/complaint handling and mailbox ownership.
- Webhook interoperability with the provider's actual payload/signature format.
- Concurrent HTTP submissions, double-click behavior, ambiguous timeouts and retry races. Static analysis says they fail; no live load test.
- Crash-after-save/before-send and crash-after-provider-accept/before-status-write.
- Retention/deletion execution, backup retention, restore and incident response.
- Hosting/provider logs, error reporting, CDN cache headers, CSP and deployment headers.
- Browser keyboard navigation, focus order, screen-reader announcements, contrast, mobile layout and zoom.
- Rate-limit behavior under load and across instances.
- Legal/clinical approval of the questionnaire, crisis script, privacy notice and TCPA wording.
- Semantic correctness of the 55 "matches_source" rows; only structural/text evidence was checked.
- Any AI/model behavior: none exists in this build.

---

## 12. Conditions before accepting real customer submissions

1. **Keep real data out** until every blocking finding is closed and the live environment is tested with labelled non-customer data.
2. **Questionnaire authority:** all 37 decisions have a named owner/counsel/underwriting sign-off; the seven windows are restored or approved; `sourceVerified` is true only with evidence; the version is bumped.
3. **Server authority:** the public endpoint rebuilds every answer from a canonical bank and rejects held, unknown, altered, incomplete and stale rows.
4. **Consent authority:** server-owned IDs, versions, wording hashes, seller/channel policy and receipt time; forged marketing/privacy evidence is rejected; the privacy version matches.
5. **Crisis integrity:** `crisis_disclosure` and review flags are derived from answers, not accepted from the client; MH-05 Yes always produces the urgent path.
6. **Answer integrity:** branch-closed details are purged from state, payload, summary and portal; adult/self and US-state rules are server-enforced; `not_applicable` is approved or removed.
7. **Review integrity:** a forged/stale acknowledgement is rejected server-side; edits invalidate the prior confirmation; one draft creates at most one case.
8. **Delivery integrity:** claimed/idempotent retries, provider idempotency, signature-verified/deduplicated/monotonic webhook, committed JWT/schedule config, honest `not_sent` copy.
9. **Access integrity:** live RLS verified with anonymous, authenticated non-reviewer and reviewer; AAL2 required; opened access logged; forwarded reference denied.
10. **Lifecycle:** retention/deletion, backup expiry, incident response and revocation/suppression are documented, implemented and tested.
11. **Exposure:** held source text is not shown to customers; bundle/logs/URLs/email/provider settings are re-checked for health data.
12. **Legal:** counsel approves the entity, privacy notice, intake permission, TCPA disclosure (if any), sensitive-question handling and HIPAA/Texas position.
13. **Operations:** mailbox ownership, sender domain, provider settings, monitoring, on-call and a labelled end-to-end test are confirmed.

Until those are satisfied, the honest description remains: **a well-built, candid local prototype that must not be used for real applicants.**

---

## Appendix A — Evidence index

| Artifact | Contents |
|---|---|
| [`qwencloud-issues.md`](qwencloud-issues.md) | Full 24-finding register with classification, verification, evidence, consequence, remediation, acceptance. |
| [`qwencloud-issues.json`](qwencloud-issues.json) | Machine-readable register. |
| [`qwencloud-issues.csv`](qwencloud-issues.csv) | Spreadsheet register. |
| [`qwencloud-questionnaire-matrix.md`](qwencloud-questionnaire-matrix.md) | All 113 source items + all 92 bank rows + decisions. |
| [`qwencloud-questionnaire-matrix.csv`](qwencloud-questionnaire-matrix.csv) | Source-item matrix. |
| [`qwencloud-questionnaire-bank.csv`](qwencloud-questionnaire-bank.csv) | Bank-row matrix. |
| [`evidence/baseline.txt`](evidence/baseline.txt) | Commit, tree, runtimes, prompt length. |
| [`evidence/source-normalization.txt`](evidence/source-normalization.txt) | PDF hash, bullet/word counts, extraction caveat. |
| [`evidence/validate-probe.out`](evidence/validate-probe.out) | 21-case forged-input probe. |
| [`evidence/engine-probe.out`](evidence/engine-probe.out) | Orphan and crisis-history probe. |
| [`evidence/branch-probe.out`](evidence/branch-probe.out) | 21 branch visibility checks. |
| [`evidence/email-probe.out`](evidence/email-probe.out) | Recipient/content probe. |
| [`evidence/byte-probe.out`](evidence/byte-probe.out) | Byte-cap failure. |
| [`evidence/pglite-probe.out`](evidence/pglite-probe.out) | 22 migration/RLS/RPC checks. |
| [`evidence/check-bank.log`](evidence/check-bank.log) | Fresh bank check. |
| [`evidence/consent-tests.log`](evidence/consent-tests.log) | 6 consent tests. |
| [`evidence/deno-tests.log`](evidence/deno-tests.log) | 5 handler tests. |
| [`evidence/build.log`](evidence/build.log) | Production build. |
| [`evidence/npm-audit.json`](evidence/npm-audit.json) | Dependency advisories. |
| [`INPUT-QwencloudPre-Underwriting-Agent.md`](INPUT-QwencloudPre-Underwriting-Agent.md) | Prompt as supplied (incomplete). |

## Appendix B — Prior-list preservation

The two prior lists are frozen, with hashes, in `audit/archive/2026-10-27-pre-qwencloud/`:

- `LIST-1-FINDINGS.md` — 18 findings, F-01–F-18.
- `LIST-2-CONDITIONS.md` — 12 conditions.

They were not edited or replaced by this audit. The archive index records that no separate second independent audit report was present in this checkout. See [`PRIOR-LISTS.md`](PRIOR-LISTS.md) for the manifest.

The deduplicated cross-audit consolidation is [`../MASTER-ISSUE-LIST.md`](../MASTER-ISSUE-LIST.md): 24 unique findings, 13 consolidated conditions and 10 evidence gaps across the three audit passes.
