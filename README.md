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
| Source questionnaire (`Detialed-Life-insurance-Questions.pdf`) | **In the repo** at `source/Detialed-Life-insurance-Questions.pdf` (7 pages, 113 questions) with a verbatim text extraction. All 92 bank rows are reconciled against it. Nicotine, criminal history, medical history, alcohol and drug use, aviation and driving are rebuilt as one question per source window (58 rows now follow their source wording and window); 29 rows still carry flags, 7 replace a single source window, no row merges two windows, and every remaining source gap has a recorded decision (19 partly collected, 9 out of scope, 0 waiting on a new question). 0 of 92 rows are signed off (`sourceVerified: false`) — a named reviewer must accept each decision before launch. See [docs/question-bank-reconciliation.md](docs/question-bank-reconciliation.md). |
| Legal wording (intake acknowledgment, TCPA disclosure) | Draft, pending counsel. `SITE.legalEntity` is supplied by `VITE_LEGAL_ENTITY`; marketing consent and the TCPA disclosure appear only when a seller and at least one channel are configured. `SITE.legalReviewPending` is `true`. |
| Language-model explainer | **Not wired.** The interview engine is deterministic. `FEATURES.aiExplainerEnabled = false`, so the customer copy does not claim an AI assistant is active. |
| Email notification | Implemented against Resend in a Supabase edge function; no provider key is configured here, so the UI reports `not_sent` honestly. |
| Marketing revocation | A customer form at `/marketing-opt-out` matches the case reference plus the email or phone on file, writes the suppression and audit rows immediately, and queues a vendor-sync row. The form sends an idempotency key; migration `0008` makes a retry a no-op, so it cannot duplicate evidence or re-open a synced outbox row. A server-only sender gate refuses unlicensed states and phone sends outside 08:00–21:00 local time, conservatively in every time zone of the state. The licensed-state list is empty by default, no provider adapter exists and no vendor endpoint is configured, so every channel remains disabled. |
| Supabase deployment | Applied and exercised on a non-production staging project on 28 Oct 2026: migrations 0001–0005 are applied; the 0005 `case_summaries` view, its grants and the AAL1/AAL2 boundary were verified; and a live AAL2 queue response was captured with a labelled temporary reviewer. No edge-function or production deployment is recorded, and no live provider delivery, scheduler run or retention execution exists. Forward migrations 0006 (terminal notification state), 0007 (marketing revocation), 0008 (revocation replay safety), 0009 (audited case reads) and 0010 (notification retry window) are not applied there. |
| Retention / deletion job | Deletion and expiry functions are implemented in `0003_reliability_and_access.sql`; the schedule stays unset (`retention_months = null`) until counsel approves it. |
| Carrier screening, quoting, rate classes | Intentionally absent. |

**Heal priority repair batch (29 Oct 2026):** [deployment and regression notes](docs/HEAL-PRIORITY-REPAIRS.md)
cover read-only queue permissions, edited-payload replay conflicts and explicit
lead-field limits. Deploy forward migration `0011` with the updated intake
function/browser build; these changes have not been applied to a hosted project.
Other Heal defects and the existing launch gates remain open.

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
| `/marketing-opt-out` | Customer withdrawal of marketing calls/texts; matches reference plus contact on file |
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
  migrations/0003_reliability_and_access.sql
  migrations/0004_reviewer_write_paths.sql
  migrations/0005_case_summary_view.sql
  migrations/0006_notification_terminal_state.sql
  migrations/0007_marketing_revocation.sql
  migrations/0008_marketing_revocation_idempotency.sql
  migrations/0009_audited_case_access.sql
  migrations/0010_notification_retry_window.sql
  migrations/0011_queue_read_only.sql
  ops/retry-schedule.sql         operator-applied pg_cron schedule
  functions/submit-case/         public intake, server-generated reference
  functions/revoke-marketing/    public opt-out, reference plus contact match
  functions/_shared/case.ts      validation, byte cap, rate limit, service client
  functions/_shared/bank.generated.ts    canonical server question bank
  functions/_shared/policy.generated.ts  canonical consent wording/versions
  functions/_shared/marketing-policy.ts  licensed-state and local-time policy
  functions/_shared/marketing-sender.ts  only pre-send gate for a provider
  functions/_shared/svix.ts      provider signature verification
  functions/_shared/email.ts     minimal notification, fixed recipient, Resend
  functions/email-events/        delivery webhook → notification state
  functions/sync-marketing-suppressions/  vendor suppression webhook worker
  functions/retry-case-notifications/
source/Detialed-Life-insurance-Questions.pdf   controlled source questionnaire
source/Detialed-Life-insurance-Questions.txt   verbatim text extraction
scripts/check-bank.ts            launch-gate bank + reconciliation check
scripts/check-server-bank.ts     fails if the server bank drifts
scripts/check-server-policy.ts   fails if consent wording drifts
scripts/check-docs.ts            fails on stale counts/claims
scripts/check-db.mjs             isolated PGlite RLS and delivery-event checks
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
- Answer states: **Yes, No, Unknown (I’m not sure), Prefer not to answer**.
  `Not applicable` exists in the type only for legacy records; no approved rule
  offers it, the UI never renders it, and the server rejects it. A blank is
  stored as `unresolved`, never as `No`.
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
- The server rejects a lead date of birth or state that contradicts `ID-01`/
  `ID-03`, and a structured choice that contradicts its prose. It also derives
  two reviewer flags: a Yes answer with no optional supplemental detail, and a
  deterministic timeframe contradiction (a shorter window answered Yes while
  the longer window that contains it is answered No, for `NIC-01`→`NIC-02`→
  `NIC-03`, `DRV-01`→`DRV-02` and `AVI-01`→`AVI-02`). Clinical, occupation and
  income contradictions are not guessed at by code; the reviewer resolves them,
  and this intake asks no income question.
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

Marketing withdrawal is independent of the case. [`/marketing-opt-out`](src/pages/MarketingOptOutPage.tsx)
matches the case reference plus the email or phone on file, then writes an
audited suppression. It does not edit the submitted case, its consent evidence or
the review. A phone suppression covers both calls and texts to that number. The
vendor-sync outbox and replay guard are in
[`0007_marketing_revocation.sql`](supabase/migrations/0007_marketing_revocation.sql)
and [`0008_marketing_revocation_idempotency.sql`](supabase/migrations/0008_marketing_revocation_idempotency.sql);
the only permitted pre-send path is
[`marketing-sender.ts`](supabase/functions/_shared/marketing-sender.ts).

## Security decisions

- The customer-facing app never holds a service-role key. Submission goes through
  `submit-case`; the recipient is a server constant and cannot be influenced by
  the browser or a model.
- One draft has one server-side idempotency key. A retried or double-clicked
  request returns the original case; a unique index makes a second row impossible.
- The case is written **before** any email attempt. A row must be claimed with a
  lease before sending, and the provider idempotency key is the case reference,
  so overlapping workers or a crash after acceptance cannot duplicate an email.
  Notification states are distinct: `not_sent`, `queued`, `accepted`, `failed`,
  `delivered` (signed webhook only). Retries update a case, never create one.
- The submitted payload and derived triage evidence (crisis disclosure,
  residence state, server receipt time, questionnaire version, idempotency key)
  are immutable at the database level, including against the service role. A
  post-submission correction is an append-only row in `case_corrections`, tied
  to the case and stamped with the reviewer and time; it never edits the snapshot.
- `cases` has RLS enabled with `anon` fully revoked; reviewers authenticate with
  Supabase Auth, must exist in `public.reviewers`, and must have an AAL2 (MFA)
  session. The portal also refuses an aal1 session, so a stolen password alone
  cannot read cases. Every read is checked. Workflow status and review-log
  writes are RPC-only after `0004_reviewer_write_paths.sql`; an AAL2 reviewer
  cannot update `cases.status` or insert audit evidence directly. The queue reads
  the payload-free `case_summaries` view; the full case payload is loaded only
  on the individual case path, where an `opened` entry is recorded.
- Health answers are kept out of URLs, analytics, logs, error echoes and the
  notification email. The email contains only a reference, timestamp and portal
  link.
- Preview mode deliberately refuses to fake a login, a send, or a delivery.

---

## Connecting the real backend

### 1. Create the case store

In Supabase (or Lovable Cloud) run the migrations in order:
[`0001_pre_underwriting.sql`](supabase/migrations/0001_pre_underwriting.sql),
[`0002_case_corrections.sql`](supabase/migrations/0002_case_corrections.sql),
[`0003_reliability_and_access.sql`](supabase/migrations/0003_reliability_and_access.sql),
[`0004_reviewer_write_paths.sql`](supabase/migrations/0004_reviewer_write_paths.sql),
[`0005_case_summary_view.sql`](supabase/migrations/0005_case_summary_view.sql),
[`0006_notification_terminal_state.sql`](supabase/migrations/0006_notification_terminal_state.sql),
[`0007_marketing_revocation.sql`](supabase/migrations/0007_marketing_revocation.sql),
[`0008_marketing_revocation_idempotency.sql`](supabase/migrations/0008_marketing_revocation_idempotency.sql),
[`0009_audited_case_access.sql`](supabase/migrations/0009_audited_case_access.sql) and
[`0010_notification_retry_window.sql`](supabase/migrations/0010_notification_retry_window.sql).
They create the reviewer allowlist, immutable cases, review log, corrections,
suppressions, idempotency, notification leases, delivery-event dedupe, durable
rate limiting, AAL2 reviewer policies, RPC-only reviewer writes, a payload-free
queue summary view, audited deletion, the opt-in retention job, a terminal
delivery state enforced by both the completion RPC and a table trigger, and a
customer marketing-revocation path with a vendor-sync outbox, replay-safe
idempotency and an outbound send guard, audited reviewer reads, and a
notification retry window that cannot outlive the provider's idempotency key.
Do not stop after 0001: the portal's correction
action needs 0002, the reliability controls need 0003 and 0004, a database
that already ran 0003 still needs 0006 because editing an applied migration
does not change it, the customer opt-out needs 0007 plus the replay guard
in 0008, audited case reads need 0009, and the retry-window guard needs 0010.

### 2. Create the reviewer

Create the reviewer in Authentication → Users, then:

```sql
insert into public.reviewers (user_id, email, display_name)
select id, email, 'Richard Parslow'
from auth.users
where email = 'richardparslow@lifepolicypilot.blog'
on conflict (user_id) do nothing;
```

Create the account as an operator: `sendSignInLink` passes
`shouldCreateUser: false` and `supabase/config.toml` sets `enable_signup = false`,
so a magic link can never create an account. Mirror that in the hosted project
(Authentication → Sign In / Providers → allow new users = off).

Reviewing requires an AAL2 session. After the email link, `/portal` enrols a TOTP
authenticator in-app when the account has none (QR code plus setup key), then
challenges and verifies the six-digit code before it calls `listCases()`.
`supabase/config.toml` explicitly enables TOTP enrolment and verification
(`[auth.mfa.totp]`), because the local defaults are off; the hosted project must
also have TOTP enabled under Authentication → Providers → Multi-Factor
Authentication. The portal refuses a password-only session, and every reviewer
RLS policy independently requires `aal2`. Add the site origin and its `/portal`
callback to the hosted Auth redirect allowlist (`http://localhost:8080/portal`
for local live mode, or `https://<site>/portal` in production); otherwise the
magic link falls back to the project site URL. A forwarded notification email grants nothing
without that session. If a reviewer loses the authenticator, an operator must
remove the factor before a replacement can be enrolled.

A second tab preserves an existing unverified TOTP setup instead of deleting it.
It can finish with a code from the already-scanned authenticator, or recheck after
the original tab completes setup. It never copies the original tab's QR/secret
or grants access just because a factor is listed as verified. With the one-factor
limit, a setup whose QR was lost before scanning needs operator recovery: confirm
which reviewer and setup are affected and arrange removal of that pending factor
through the normal account administration process. The portal never performs
that removal automatically. No MFA factor limit or assurance policy is relaxed.


### 3. Deploy the functions

Set secrets (never in this repository):

```
APP_ORIGIN=https://your-site.example
REVIEWER_PORTAL_URL=https://your-reviewer-site.example/reviewer # optional full reviewer URL for integrations
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...                                   # optional until email is approved
CASE_NOTIFY_FROM=Life Policy Pilot <notifications@lifepolicypilot.blog>
CASE_NOTIFY_TO=richardparslow@lifepolicypilot.blog   # must match the allowlist
EMAIL_WEBHOOK_SECRET=whsec_...                        # provider signing secret, not a shared password
CRON_SECRET=...                                      # random, at least 32 chars
RATE_LIMIT_SALT=...                                  # random; salts the hashed client key
QUESTIONNAIRE_APPROVED=false                          # stays false until every row is signed off
ENVIRONMENT=production
```

`APP_ORIGIN` remains the public request-origin allowlist. Set the independent
`REVIEWER_PORTAL_URL` to the complete reviewer page when that page uses a different
route or origin. Policy Compass's current unpublished preview uses
`https://id-preview--357c0422-4982-4f24-9e20-31891a8661ca.lovable.app/reviewer`.
Use HTTPS without credentials, query strings or fragments. An invalid explicit
URL blocks notification attempts before a lease is claimed. With no override,
the standalone app retains its existing first-APP_ORIGIN `/portal` link. Both
submit-case and retry-case-notifications use the same destination resolver.
This setting does not change authentication redirects, MFA, origin allowlisting
or the questionnaire approval lock.

`QUESTIONNAIRE_APPROVED=true` is a deliberate launch lock: until it is set, the
public function returns 503 and writes nothing. Do not set it while
`sourceVerified` is false on any row.

The five function JWT settings are committed in
[`supabase/config.toml`](supabase/config.toml); a clean deployment no longer
relies on an operator remembering them. Apply
[`supabase/ops/retry-schedule.sql`](supabase/ops/retry-schedule.sql) after
storing `project_url` and `cron_secret` in Vault to run the notification worker
every five minutes.

The worker sends with the case reference as the provider idempotency key. The
provider honours that key for 24 hours, so `0010` stamps the first send attempt
and refuses any later automatic claim once that window has passed. A case that
falls out is listed in `public.notification_retry_backlog` for a human decision
instead of being retried into a possible duplicate. Cases that never had a send
attempted — for example, submitted while no provider was configured — keep the
seven-day recovery window. The 24-hour figure is the provider's documented
contract, not something this repository can verify; see
[docs/OPERATIONS.md](docs/OPERATIONS.md#notification-retries).

`submit-case` enforces an Origin allowlist, a streaming 512 KiB byte cap, a
92-row completeness check, server-side canonical validation, and a durable
salted rate limit (ten submissions per ten minutes per hashed client key). If
the durable limiter is unavailable in production, the function refuses
submissions with 503 rather than trusting the per-instance fallback;
`ENVIRONMENT=test` is the only mode that uses the in-memory guard. A WAF in
front of the function is still recommended before public launch.

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

Point the provider’s delivery events at `/functions/v1/email-events` and set
`EMAIL_WEBHOOK_SECRET` to the provider’s `whsec_…` signing secret. The function
verifies the Svix signature over the raw body, rejects timestamps outside five
minutes, deduplicates by `svix-id`, and applies a monotonic state transition.
Only a verified `delivered` event moves the case to `delivered`; a late “sent”
or a bounce cannot move it backwards.

### 6. Suppression propagation (optional until a vendor is configured)

Set `MARKETING_SUPPRESSION_WEBHOOK_URL` and
`MARKETING_SUPPRESSION_WEBHOOK_SECRET`, then schedule
`POST /functions/v1/sync-marketing-suppressions` with the `x-cron-secret`
header. The worker sends only the normalised channel and address, uses an
idempotency key, marks each row synced on a 2xx response, and records a bounded
failure otherwise. Without both values it reports `not_configured` and changes
nothing. A vendor endpoint and a live non-customer suppression test are still
required before any marketing channel is enabled.

---

## Question-bank reconciliation

The source PDF is committed at `source/Detialed-Life-insurance-Questions.pdf`
(SHA-256 `afe91d87…82cca2`). It has been reconciled against the bank once:

- `src/features/interview/sourceInventory.ts` — all 113 source questions,
  verbatim, with page numbers and the window each one states. Build/audit-only:
  it is not imported by the customer application.
- `src/features/interview/reconciliation.ts` — one record per bank row: source
  ids, verdict, every mismatch as a flag, and the decision a reviewer must make;
  plus the 28 source questions no row fully covers (19 partly collected, 9 out
  of scope). Reviewer/build-only; its flags can quote withheld wording.
- `src/features/interview/sourceIndex.ts` and
  `src/features/interview/questionSourceRefs.ts` — generated, text-free
  projections. `questionSourceRefs.ts` is the browser locator map;
  `sourceIndex.ts` is the build-side metadata. `npm run check:bank` fails if
  either drifts.
- `src/features/interview/questionBank.ts` — `sourceRef` comes from the
  generated locator map; the canonical server bank attaches `sourceText` after
  submission. Held wording and reviewer reconciliation detail are therefore
  absent from the public bundle (`npm run check:bundle`).
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
2. Decide each of the 28 recorded gaps: 19 are partly collected and 9 are out of
   scope. No gap is currently marked `add_question`. Do not mark a gap covered
   without a row that asks it.
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
- `deno test --allow-env --lock=deno.lock supabase/functions/tests/` — 60 tests:
  handler-level launch lock, required consent, fail-closed rate limiting and
  byte-cap checks; canonical snapshot/consent/crisis/age/branch rejection tests;
  identity cross-checks (lead date of birth and state versus `ID-01`/`ID-03`),
  structured-value/prose agreement, acknowledgement ordering, detail and
  timeframe flags, phone/text contact rules; marketing opt-out validation,
  origin, body-cap and fail-closed limiter tests; suppression-worker
  authentication and not-configured tests; and Svix signature tests for valid,
  replayed, tampered and rotating-key events. This runs in CI with Deno 2.
- `npm run test:consent` — 7 tests over the pure consent builder: only enabled
  marketing channels produce a record, each enabled channel appears once, an
  unchecked box is stored as `granted: false` with no timestamp, and a blank or
  bracketed placeholder seller produces no marketing record or disclosure. CI
  runs it with Node's test runner through `tsx`.
- `npm run test:engine` — 8 tests over recursive branch pruning, payload
  integrity, blank answers, current-crisis behaviour and the public-bank
  invariant that reviewer notes are server-only.
- `npm run test:validation` — 5 tests over the lead form's contact rules,
  including phone/text requirements and normalisation.
- `npm run check:server-bank` and `npm run check:server-policy` — fail if the
  server’s canonical bank or consent wording drifts from the client source.
- `npm run check:portal` — fails if the portal loses in-app TOTP
  enrolment/challenge/verify, if a magic link can create an account, if
  self-service sign-up is re-enabled in config, if the reviewer queue stops
  paginating with an exact count, or if marketing withdrawal evidence disappears
  from the case view.
- `npm run report:reconciliation` — regenerates the review document from the
  data (92 rows, 28 gaps).
- `npm run check:db` — isolated PostgreSQL (PGlite) replay of migrations
  0001–0010, including AAL2 denial, the payload-free queue summary, RPC-only
  reviewer writes, opened-log dedupe, immutable triage columns, duplicate
  idempotency key rejection, notification claim races, monotonic delivery
  events, terminal delivery through both the RPC and a direct-write trigger,
  unmatched-event retry, the 24-hour first-attempt retry cap and its operator
  backlog, durable rate limits, customer marketing revocation, revocation
  replay safety, outbound suppression denial, vendor-sync queueing, retention
  and audited deletion — 0 failures.
- `npm run check:marketing` — fails if a state or IANA zone is missing, the
  licensed-state list stops defaulting to empty, the idempotency key stops being
  hashed, or the sender drops the policy or database guard before `deliver`.
- **Not run during this remediation:** a fresh browser walkthrough of the
  changed screens. The manual script is in [docs/LAUNCH-GATES.md](docs/LAUNCH-GATES.md);
  earlier preview-mode observations are not treated as evidence for these edits.
- **Not run:** the functions against a live Supabase project, real email
  delivery or inbox receipt, in-app TOTP enrolment/step-up with a real staff
  account, provider signature
  compatibility, cron execution, backups, retention execution or a production
  accessibility/load pass. The isolated PGlite replay is not a hosted-database
  verification. A separate hosted check of migration 0005's view and AAL1/AAL2
  RLS boundary is recorded in
  [audit/2026-10-28-migration-0005-staging/README.md](audit/2026-10-28-migration-0005-staging/README.md);
  it exercised a live AAL2 HTTP session with a labelled temporary reviewer, but
  did not exercise the edge functions or a real staff reviewer account.

## Regulatory note

Nothing here is a compliance certification. Whether HIPAA, the Texas Insurance
Code (including Chapter 602) or another regime applies depends on the legal
entity, its role and its vendors. The specification’s launch gates — counsel
review of the sensitive questions, authorized wording, TCPA disclosure, state and
carrier restrictions, retention schedule and vendor arrangements — remain
outstanding and are tracked in [docs/LAUNCH-GATES.md](docs/LAUNCH-GATES.md).


## Heal reviewer visibility repairs

[Review-history pagination and queue-wide safety disclosures](docs/HEAL-REVIEWER-VISIBILITY.md)
require forward migration `0012` and the matching portal build. These fixes are
separate from the `0011` queue-permissions/submission-integrity repair. The
application remains in testing; deployment evidence and other Heal defects
remain outstanding.

## Heal suppression-sync recovery

[A failed vendor sync no longer drops an opt-out](docs/HEAL-SUPPRESSION-SYNC-RETRY.md):
forward migration `0015` keeps an unacknowledged suppression in the outbox for
the next scheduled run. [Overlapping workers now claim separate rows](docs/HEAL-SUPPRESSION-SYNC-CLAIM.md)
through `0016`. [A provider bounce stays authoritative](docs/HEAL-NOTIFICATION-PROVIDER-FAILURE.md)
over a late send result through `0017`. Marketing stays disabled and intake stays locked.

### Public endpoint rate-limit identity

The public submission and marketing-withdrawal functions use `Deno.serve` connection metadata (`info.remoteAddr`) to select their salted durable quota. They never trust `X-Forwarded-For`, `Forwarded`, `X-Real-IP` or `CF-Connecting-IP`; source TCP ports and request content cannot create fresh quotas. If the runtime supplies no usable TCP peer, requests share the conservative `shared:unverified-peer` quota. Submission retains 10 requests per 600 seconds; withdrawal retains its separate 5 per 600 seconds. Missing durable configuration still fails closed in production.

A transport peer can be a hosting gateway, so several visitors can share a quota. This deliberately favors bounded anonymous writes over guessing a visitor IP. Verify hosted capacity/fairness before enabling intake. A future per-visitor proxy policy must authenticate its metadata; choosing a header name is insufficient. No forwarded-header trust setting is provided. See [Deno connection metadata](https://docs.deno.com/api/deno/http-server/) and [Supabase gateway architecture](https://supabase.com/docs/guides/functions). No launch lock is relaxed by this repair.
