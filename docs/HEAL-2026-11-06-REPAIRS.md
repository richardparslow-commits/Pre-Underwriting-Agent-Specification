# Heal 6 November 2026 repair batch

[Heal run 6ea79c42](https://app.heal.dev/fa38cc97-45dd-4b98-8550-5fde5c59913c/runs/6ea79c42-0a99-4cdd-b92c-496e15b2137b?tab=defects)
reported twenty open defects (8 medium, 12 low). All twenty have a code change
in this batch. One forward migration, `0023_review_and_session_integrity.sql`,
is prepared but not applied or hosted. Nothing here deploys, pushes or unlocks
intake, marketing or MFA.

## Submission and receipt

- **s7-header-link-loses-submitted-reference** and
  **s9-bounce-during-send-receipt-says-accepted**: while a submission is in
  flight, a capture-phase document listener refuses link navigation (including
  the header home link) and shows a stay-on-this-page warning. The provider
  stays mounted, so the 201 receipt with the case reference cannot be dropped.
- **s7-retry-of-saved-case-spends-submit-limit**: the submission limiter is
  consumed only after the idempotency-key replay lookup. A retry of an already
  saved case returns its stored receipt without spending another allowance.
  Missing durable limiter configuration still fails closed before any database
  client is created.
- **s7-unanswered-submit-stuck-pending**: `submitLive` aborts after 15 seconds
  and distinguishes a lost connection ("the case may not be saved; check before
  retrying") from a request whose outcome is unconfirmed ("retry the unchanged
  submission to check the same request").
- **s3-offline-submit-raw-error**: a browser offline/fetch failure now maps to
  the connection-lost message instead of a raw transport error.
- **s8-copy-reference-fails-silently**: a denied clipboard now shows an alert
  and selects the reference so it can be copied manually.
- **s7-receipt-jumps-privacy-page-to-top**: marking a case submitted no longer
  scrolls the page; the receipt keeps the header/footer context in view.
- **s9-deleted-case-correction-invites-retry**: a "case not found" reply is a
  terminal explanation ("This case no longer exists. The correction was not
  saved."), not an invitation to retry the same correction forever.
- **s10-offline-correction-reads-as-server-error**: network failures and
  unavailable responses map to connection-lost or unconfirmed correction
  messages, while missing authorisation remains a sign-in instruction.

## Intake correctness

- **s10-eve-of-18th-birthday-accepted**: `ageOn` compares the visitor's local
  calendar dates, and the date input maximum is the local latest adult date.
  This removes the UTC-day gap where the eve of an 18th birthday counted as 18.
- **s1-changed-state-not-carried-to-interview**: when a prefilled `ID-03`
  (state) or `ID-01` (date of birth) answer still equals the previous contact
  value, a valid contact edit updates that answer instead of leaving the review
  to fail against the old value. Invalid edits and user-overridden answers are
  left untouched.
- **s7-corrected-review-keeps-old-refusal**: editing contact details, consent,
  an answer or starting over clears the previous submission error, so a stale
  "Submission needs attention" cannot sit on a corrected review.
- **s8-marketing-help-asks-for-shown-phone**: the permission help now tells the
  prospect to choose Phone call or Text message; it no longer asks them to
  confirm a number that the screen does not show.
- **s5-long-reference-not-marked-on-field**: the stop-request reference pattern
  is exactly six suffix characters, matching `revoke-marketing`. An overlong
  reference is marked invalid on the field before any request is sent.

## Reviewer queue and MFA

- **s6-signed-out-session-still-reads-queue**: when a token carries a
  `session_id`, `is_reviewer()` now requires that `auth.sessions` row to still
  exist. A signed-out browser token stops reading the queue immediately.
- **s12-stale-page-review-overrides-clarification**: `record_case_review` takes
  an optional expected status and locks the case row. A decision taken on a page
  still showing `submitted` is refused after another reviewer requests
  clarification; the portal passes the displayed status and refreshes on
  conflict. Three-argument calls keep working through the default.
- **s5-load-more-failure-out-of-view**: an append-page failure is rendered at
  the pager with `role="alert"`, where the reviewer clicked, instead of above
  the fold.
- **s5-failed-queue-load-reads-zero-cases**: a failed initial load reports an
  unknown total ("case count unavailable") and an error alert instead of
  claiming there are zero cases.
- **s11-simultaneous-setups-two-keys**: enrollment is serialized with the Web
  Locks API, so two tabs cannot both create an unverified factor. The second tab
  observes the first tab's factor rather than minting another key.
- **s10-offline-authenticator-setup-indistinct**: an offline setup now reports
  a connection error and keeps the existing retry path, distinct from a provider
  or verification failure.

## Verification

Run from the repository root:

- `npm run typecheck` and `npm run build`.
- `node --test scripts/check-db.mjs` — applies every migration including `0023`
  and now asserts that a stale review decision is refused, that the current
  status still allows it, and that a deleted `auth.sessions` row stops
  `is_reviewer()` and the queue read.
- `npm run test:validation` (16), `npm run test:submission-ui` (64),
  `npm run test:reviewer-visibility` (107), `npm run test:consent`,
  `npm run test:engine`.
- `npm run check:portal`, `check:docs`, `check:bank`, `check:server-bank`,
  `check:server-policy`, `check:marketing`, `check:bundle`.
- `npx deno test --allow-env --lock=deno.lock supabase/functions/tests/`
  (173 passed), covering the submit replay and notification receipt read-back.

The browser end-to-end and hosted UI regression suites were not run in this
workspace, and no change was deployed. `0023` must be applied before deploying
the matching portal build. Legacy tokens without a `session_id` claim, and
harnesses without an `auth.sessions` table, retain the previous reviewer check;
browsers without Web Locks fall back to unserialized enrollment. The server
still checks age using UTC dates because it cannot know the visitor's zone; the
local-calendar client check is the one that fixes the reported birthday case.
