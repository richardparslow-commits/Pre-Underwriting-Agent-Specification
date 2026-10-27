# Life Policy Pilot — Pre-Underwriting Agent

A guided pre-underwriting interview for life-insurance prospects, built for
**Lovable** (React + Vite + TypeScript + Tailwind + shadcn-style components) with
a Supabase / Lovable Cloud backend for the case store, reviewer portal and
notification queue.

The workflow matches the owner specification:

> introduction → lead form → intake permission → questionnaire → conditional
> follow-ups → review and correction → affirmative submission → secure storage
> → email notification → human review

---

## Status: design-complete, not production-ready

This repository is a working implementation of the **product and technical
requirements** in the specification. It is not a deployed or legally cleared
service. The following are deliberate, visible gaps:

| Item | State |
| --- | --- |
| Source questionnaire (`Detialed-Life-insurance-Questions.pdf`) | **In the repo** at `source/Detialed-Life-insurance-Questions.pdf` (7 pages, 113 questions) with a verbatim text extraction. All 92 bank rows are reconciled against it. Nicotine, criminal history, medical history, alcohol and drug use, aviation and driving are rebuilt as one question per source window (58 rows now follow their source wording and window); 29 rows still carry flags, no row collapses lookbacks, and every remaining source gap has a recorded decision (19 partly collected, 9 out of scope, 0 waiting on a new question). Every row is `sourceVerified: false` — a named reviewer must accept each decision before launch. See [docs/question-bank-reconciliation.md](docs/question-bank-reconciliation.md). |
| Legal wording (intake acknowledgment, TCPA disclosure) | Draft, pending counsel. `SITE.legalEntity` is supplied by `VITE_LEGAL_ENTITY`; marketing consent and the TCPA disclosure appear only when a seller and at least one channel are configured. `SITE.legalReviewPending` is `true`. |
| Language-model explainer | **Not wired.** The interview engine is deterministic. `FEATURES.aiExplainerEnabled = false`, so the customer copy does not claim an AI assistant is active. |
| Email notification | Implemented against Resend in a Supabase edge function; no provider key is configured here, so the UI reports `not_sent` honestly. |
| Supabase deployment | Migration and functions are written but have not been run against a project from this workspace. |
| Retention / deletion job | Not implemented; schedule must be documented and approved. |
| Carrier screening, quoting, rate classes | Intentionally absent. |

Preview mode (the default) is fully local: no backend, no email, no data leaves
the browser tab.

---

## Run it

```bash
npm install
npm run dev          # http://localhost:8080
npm run build        # typecheck + production build
npm run check:bank   # structural validation of the question bank
```

No environment variables are required in preview mode.

Routes:

| Route | Purpose |
| --- | --- |
| `/` | Product introduction and honest scope boundaries |
| `/start` | Lead form → permission → interview → review → confirmation |
| `/privacy` | Privacy practices (draft pending counsel) |
| `/messaging-terms` | Optional marketing call/text program and its current channels |
| `/portal` | Reviewer sign-in and case queue |
| `/portal/:reference` | Complete case record, draft summary, consents, review actions, recorded corrections |

In preview mode, `/portal` has an explicit **“Open the portal preview”** button
instead of a fake login, and ships one clearly-labelled non-customer sample case
(`LPP-2026-SAMPLE`) so the review package can be inspected.

### Preview-mode limitations (intentional)

- Answers live in React state only. Nothing is written to `localStorage`,
  `sessionStorage`, analytics or the URL.
- A submitted case exists only until the tab reloads. Use the sample case to
  re-inspect the portal after a refresh.
- No email is sent. The confirmation screen says so and reports
  `notification.state = "not_sent"`.

---

## Architecture

```
src/
  App.tsx                        routes
  config/site.ts                 brand, legal entity, marketing channels, feature flags
  integrations/supabase/client.ts Lovable Cloud client (null when unconfigured)
  features/
    interview/
      types.ts                   domain contract (answers, consents, case record)
      sections.ts                14 interview sections
      questionBank.ts            versioned source question bank (92 rows)
      validateQuestionBank.ts    structural checks (ids, branches, held rows)
      engine.ts                  applicability, dispositions, flags, draft summary
      useInterview.ts            in-memory state machine + consent evidence
    consent/consentTexts.ts      versioned consent and TCPA wording
    intake/                      lead form, permission, question card, review,
                                 confirmation, crisis panel, status timeline
    portal/                      reviewer auth hook + case review UI
  components/ui/                 button, form, surface primitives
  lib/api.ts                     submit / list / get / record review + correction (live + preview)
supabase/
  migrations/0001_pre_underwriting.sql
  migrations/0002_case_corrections.sql
  functions/submit-case/         public intake, server-generated reference
  functions/_shared/case.ts      validation, CORS, rate limit, service client
  functions/_shared/email.ts     minimal notification, fixed recipient, Resend
  functions/email-events/        delivery webhook → notification state
  functions/retry-case-notifications/
source/Detialed-Life-insurance-Questions.pdf   controlled source questionnaire
source/Detialed-Life-insurance-Questions.txt   verbatim text extraction
scripts/check-bank.ts            launch-gate bank + reconciliation check
scripts/report-reconciliation.ts regenerates the reconciliation report
docs/question-bank-reconciliation.md  every row's flags and required decision
docs/LAUNCH-GATES.md             acceptance-test mapping and remaining work
LOVABLE.md                       import and wiring instructions for Lovable
```

---

## Interview integrity rules (implemented)

- One question at a time, section progress. Nicotine, criminal history, medical
  history, alcohol and drug use, aviation and driving keep a separate question for
  every source window, so no row collapses two lookbacks into one answer.
- Answer states: **Yes, No, Unknown (I’m not sure), Prefer not to answer,
  Not applicable (approved rule only)**. A blank is stored as `unresolved`,
  never as `No`.
- Compound questions collect components separately, then appear as one record.
- Conditional branches are declared in the bank (`askWhen`) and disappear when
  the parent answer changes; orphaned detail is cleared.
- Supplemental questions are labelled in the UI and separated in the case record.
- Held-for-review rows are never asked. They remain in the coverage audit with
  their review reason, and the customer can see that they were withheld.
- The review screen invalidates its confirmation on any edit; submission requires
  a fresh acknowledgment and the explicit **“Submit for Richard’s Review”** action.
- Completeness is reported honestly: “All applicable questions answered” and
  “N unanswered questions” are different states.
- A current-crisis answer pauses the sales context, shows 988 / 911 support, and
  states plainly that the site does not monitor emergencies. The current-crisis
  question is asked of every customer, so declining or being unsure about the
  history question above it does not skip it.

## Consent separation (implemented)

Two required records, each with its own wording version and timestamp:

1. preliminary intake and submission permission (required),
2. privacy-practices acknowledgement (required).

Optional marketing records are written only for channels the product actually
operates. Every channel defaults to off in `src/config/site.ts`; with no channel
enabled, the interview shows no marketing checkboxes and no TCPA disclosure,
and a submitted case contains only the two required consents. Enabling a channel
additionally requires `VITE_LEGAL_ENTITY`, so a disclosure can never name a
placeholder seller.

The two required permissions are enforced at both layers: the lead form will not
advance without the privacy acknowledgement, and `submit-case` rejects a draft
whose consent records omit or decline either the intake permission or that
acknowledgement. A phone number, chat session or questionnaire submission never
sets marketing consent. When a channel is enabled, the exact displayed TCPA text
is stored as evidence. Medical-record release is **not** collected in this intake.

## Security decisions

- The customer-facing app never holds a service-role key. Submission goes through
  `submit-case`; the recipient is a server constant and cannot be influenced by
  the browser or a model.
- The case is written **before** any email attempt. Notification states are
  distinct: `not_sent`, `queued`, `accepted`, `failed`, `delivered` (webhook only).
  Retries update a case, never create one.
- The submitted payload is immutable at the database level (trigger), and the
  case reference is generated server-side. A post-submission correction is an
  append-only row in `case_corrections`, tied to the case and stamped with the
  reviewer and time; it never edits the snapshot.
- `cases` has RLS enabled with `anon` fully revoked; reviewers authenticate with
  Supabase Auth and must exist in `public.reviewers`. Every read is checked.
- Health answers are kept out of URLs, analytics, logs, error echoes and the
  notification email. The email contains only a reference, timestamp and portal
  link.
- Preview mode deliberately refuses to fake a login, a send, or a delivery.

---

## Connecting the real backend

### 1. Create the case store

In Supabase (or Lovable Cloud) run the migrations in order:
[`0001_pre_underwriting.sql`](supabase/migrations/0001_pre_underwriting.sql), then
[`0002_case_corrections.sql`](supabase/migrations/0002_case_corrections.sql). They
create `reviewers`, `cases`, `case_review_log`, `case_corrections`,
`contact_suppressions`, the reviewer RLS policies, the immutability trigger and
the `record_case_review` and `record_case_correction` RPCs. Do not stop after
0001: the portal's correction action needs the second migration.

### 2. Create the reviewer

Create the reviewer in Authentication → Users, then:

```sql
insert into public.reviewers (user_id, email, display_name)
select id, email, 'Richard Parslow'
from auth.users
where email = 'richardparslow@lifepolicypilot.blog'
on conflict (user_id) do nothing;
```

Enable MFA on that account. A forwarded notification email must not grant access
— it does not, because the portal requires a session.

### 3. Deploy the functions

Set secrets (never in this repository):

```
APP_ORIGIN=https://your-site.example
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...                                   # optional until email is approved
CASE_NOTIFY_FROM=Life Policy Pilot <notifications@lifepolicypilot.blog>
CASE_NOTIFY_TO=richardparslow@lifepolicypilot.blog   # must match the allowlist
EMAIL_WEBHOOK_SECRET=...                             # random, at least 32 chars
CRON_SECRET=...                                      # random, at least 32 chars
ENVIRONMENT=production
```

Deploy with JWT verification disabled for the machine-facing functions:

```toml
[functions.submit-case]
verify_jwt = false

[functions.email-events]
verify_jwt = false

[functions.retry-case-notifications]
verify_jwt = false
```

`submit-case` also enforces an Origin allowlist, a 512 KB body cap, a 400-answer
cap, server-side validation and an in-memory rate limit. For production volume,
put a WAF or durable limiter in front of it.

### 4. Point the front end at it

```bash
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
VITE_APP_MODE=live
```

Build, then submit a **non-customer test case** and verify:

- the case row exists with a server-generated `LPP-YYYY-XXXXXX` reference,
- the notification state is `accepted` only after the provider responds,
- the portal requires sign-in and shows the case for the allowlisted user only,
- a different account cannot read it.

### 5. Delivery webhook (optional until email is approved)

Point the provider’s delivery events at `/functions/v1/email-events` with the
`x-webhook-secret` header. Only a `delivered` event moves the case to
`delivered`. Replace the shared secret with provider signature verification
before relying on it.

---

## Question-bank reconciliation

The source PDF is committed at `source/Detialed-Life-insurance-Questions.pdf`
(SHA-256 `afe91d87…82cca2`). It has been reconciled against the bank once:

- `src/features/interview/sourceInventory.ts` — all 113 source questions,
  verbatim, with page numbers and the window each one states.
- `src/features/interview/reconciliation.ts` — one record per bank row: source
  ids, verdict, every mismatch as a flag, and the decision a reviewer must make;
  plus the 45 source questions no row fully covers.
- `src/features/interview/questionBank.ts` — `sourceRef` and `sourceText` are
  derived from those records, so the locator and wording cannot drift from the
  source.
- `docs/question-bank-reconciliation.md` — generated review document with the
  full row-by-row record (`npm run report:reconciliation`).

Nicotine, criminal history, medical history, alcohol and drug use, aviation and
driving have been split into one question per source window (`NIC-01`–`NIC-04`,
`CRM-01`–`CRM-07`, `MED-01`–`MED-19`, `ALC-01`–`ALC-06`, `DRG-01`–`DRG-07`,
`AVI-01`–`AVI-04`, `DRV-01`–`DRV-05`), so 58 rows now follow their source wording
and window. Fifteen more source questions that were collected nowhere now have
rows of their own (`MED-20`–`MED-26`, `MH-07`, `AVO-06`–`AVO-07`, `DRV-06`–`DRV-07`,
`FIN-03`, `RES-06`, `MIL-04`). No row collapses several windows into one, 7 change a
single window, 9 are LPP additions, 2 were misattributed as source questions (now
marked supplemental), and 5 are held. Of the 28 remaining gaps, 19 are partly
collected and 9 are recorded out of scope with a written reason. None of this is
silently resolved: each row's and each gap's decision is written down.

To close gate 1:

1. Work through [docs/question-bank-reconciliation.md](docs/question-bank-reconciliation.md)
   row by row. The nicotine and criminal rows show the intended shape: one row per
   source question and window. For each remaining row, either change the bank to
   match the source or record the revision as approved.
2. Add the missing source questions (the 26 marked `add_question`) or record why
   each is out of scope. Do not mark a gap covered without a row that asks it.
3. Set `sourceVerified: true` on a row only when its decision is closed, and
   record the reviewer and date in the sign-off table.
4. Update the five held rows (`ID-04`, `MED-11`, `MH-06`, `RES-04`, `RES-05`)
   only after documented legal/clinical approval, then set
   `reviewStatus: "approved"` with the approval reference in a comment.
5. Regenerate the report, then run `npm run check:bank` and `npm run typecheck`.
6. Bump `QUESTIONNAIRE_VERSION` in `src/features/interview/types.ts` and the
   consent versions in `src/features/consent/consentTexts.ts` whenever wording
   changes.

`npm run check:bank` proves ids, branch targets, section references, held-row
notes and source coverage are consistent, and fails if any source question
stops being acknowledged. It cannot decide whether a wording is approved — that
is the reviewer's signature in the report.

---

## Verification performed

- `npx tsc --noEmit` — clean.
- `npm run build` — production build succeeds.
- `npm run check:bank` — 92 rows, 87 approved, 5 held, 14 branches; 113 source
  questions all acknowledged (85 traced, 28 recorded gaps: 19 partly collected,
  9 out of scope, 0 waiting on a question); 92 reconciliation records, 29 with
  flags; no structural or reconciliation issues.
- Source extraction verified programmatically: all 113 inventory entries appear
  verbatim in the PDF text, and the PDF's 113 bullets all map to an entry.
- Branch check on the split rows: the nicotine section asks 3 questions after a
  Yes to `NIC-01`, and 4 after a No or unsure answer (the last-use follow-up).
  Criminal history asks all 7 windows, medical history one question per window
  (12 months, 2, 3, 5, 7 and 10 years), alcohol all 5 source windows, drug use
  all 7 source questions, aviation the source's separate 12-month and 24-month
  questions, driving its separate 24-month, 5-year and ever questions, and the
  newly added rows branched only where the source branches (solo climbing,
  salvage diving, bankruptcy discharge date, military mission type).
- `deno test --allow-env --no-lock supabase/functions/tests/` — 5 consent-gate
  tests that drive the real `submit-case` handler and require HTTP 422 for a
  draft with no consent records, a missing or declined intake permission, or a
  missing or declined privacy acknowledgement. This runs in CI with Deno 2.
- `npm run test:consent` — 6 tests over the pure consent builder: only enabled
  marketing channels produce a record, each enabled channel appears once, an
  unchecked box is stored as `granted: false` with no timestamp, and a blank or
  bracketed placeholder seller produces no marketing record or disclosure. CI
  runs it with Node's test runner through `tsx`.
- `npm run report:reconciliation` — regenerates the review document from the
  data (92 rows, 28 gaps).
- Browser walkthrough (preview mode): lead form with validation errors, consent
  capture, permission gate, prefilled residence with “please check” label,
  Yes + compound fields, branch appearing when diabetes = Yes (37 → 38
  questions), supplemental labelling, review with 31 unanswered items, review
  confirmation enabling submission, explicit “Submit for Richard’s Review”,
  case reference, honest `not_sent` timeline, reviewer sign-in gate, case review
  with draft summary/flags/consent evidence, “mark as reviewed” logging,
  recording a post-submission correction and confirming it appears separately
  while the original answer is unchanged, and the current-crisis panel with
  988/911 links.
- **Not run:** the Deno edge functions against a live Supabase project, real
  email delivery, RLS enforcement against a live database, and MFA. The
  `submit-case` handler's consent gate is covered by the Deno test above.

## Regulatory note

Nothing here is a compliance certification. Whether HIPAA, the Texas Insurance
Code (including Chapter 602) or another regime applies depends on the legal
entity, its role and its vendors. The specification’s launch gates — counsel
review of the sensitive questions, authorized wording, TCPA disclosure, state and
carrier restrictions, retention schedule and vendor arrangements — remain
outstanding and are tracked in [docs/LAUNCH-GATES.md](docs/LAUNCH-GATES.md).
