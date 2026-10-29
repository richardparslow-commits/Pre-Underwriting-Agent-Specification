# Heal repairs — review history and queue-wide safety disclosures

This separate repair batch starts from main at `5eb0241`. It addresses:

- `s1-clarification-note-pushed-out-of-review-log-1`
- `s2-safety-callout-misses-older-crisis-cases-1`

## Behavior

The audited case-open RPC still records an opening before returning sensitive
case content. Its first history page now includes lossless text IDs and a
continuation cursor. **Load older review history** retrieves further 20-event
pages through a reviewer-authorized RPC. Ordering uses `(created_at, id)` so
equal timestamps cannot skip or duplicate rows. Loading an older page is itself
audited; its new opening sorts ahead of the cursor and cannot make the older
pages feed themselves. Neither path returns data if its audit insert fails.
The private page reader is not executable by public, anon or authenticated.

The safety callout uses a separate database query across **all flagged cases**,
including reviewed and clarification-requested cases. It reports the full count
and up to 25 reference/status/time entries per page. No names, contact details,
notes, health answers or case payloads are downloaded for this callout. Count is
computed without either the ordinary queue cursor or the safety-page cursor.
References link directly to case review; additional flagged cases remain
reachable through their own pagination. Refresh checks safety again regardless
of ordinary queue pagination. The callout describes recorded disclosures and
does not claim emergency monitoring or a live safety assessment.

Both views preserve loaded entries and retry controls after an older-page
failure. Initial safety failure is visibly unknown, never an empty/all-clear
result. A refresh replaces stale pages and ignores any earlier response that
finishes later. Missing history metadata from an older server warns that older
history could not be checked, rather than presenting 20 events as complete.

## Regression coverage

`npm run check:reviewer-visibility` runs an isolated PGlite database, applying all
available migrations twice. It checks a clarification behind 65 subsequent
opens; equal timestamps; IDs larger than JavaScript's safe integer range; complete
pagination without cross-case leakage; audit failure; invalid cursors; AAL1,
non-reviewer and anonymous denial; and a 35-case disclosure set behind an
unflagged first queue page. The test verifies reference-only result fields,
full-queue totals on every safety page and the private helper's permissions.

`npm run test:reviewer-visibility` exercises the actual React views and RPC
adapters: notes on older pages, retry after failure, duplicate activation,
refresh/unmount races, direct case links, independent safety pagination,
unknown versus checked-zero states, stale responses, and cursor precision. These
are React interaction tests, not browser rendering measurements or a rerun of
Heal's hosted suite. Both commands are wired into CI.

The existing database, server, consent, validation, engine, typecheck, build and
repository checks remain required. Test data and transports are synthetic; no
hosted case is read or changed by local verification.

## Rollout

Migration `0011` is reserved by the separate permissions/submission PR #15.
This PR supplies `0012_reviewer_visibility.sql`, which is compatible with the
0010 baseline and with 0011. It does not include, replace or close the queue-view
write-permission repair. Apply pending migrations in order, including 0011 when
releasing both PRs. Do not restore direct reads of review logs to make pagination
work.

Apply 0012 before deploying the matching portal. The changed case-open response
is backward compatible with the old portal; the new portal requires the new
RPCs and continuation metadata. Roll back the browser build if needed, rather
than partially dropping helpers still used by the audited case-open function.

Run `supabase/ops/reviewer-visibility-checks.sql` to check catalog grants and
indexes without reading case data. On labelled synthetic staging cases, verify
an old clarification remains reachable, old flagged cases appear immediately,
both pagination paths work, a failed query is clearly reported, and authorized
and unauthorized JWTs enforce the expected boundaries. Record the deployed
commit and results before closing either Heal defect.

No hosted database migration or production rollout is performed here. GitHub
integrations may create an application preview automatically; that preview alone
does not demonstrate migration application. The application remains in testing,
marketing remains disabled and the other Heal and launch-gate work stays open.
