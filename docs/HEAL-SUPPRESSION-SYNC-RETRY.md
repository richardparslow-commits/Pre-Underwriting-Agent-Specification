# Heal repair — a failed suppression sync is retried after recovery

Addresses Heal finding `s3-opt-out-dropped-after-five-failures-1`.

## Behavior

`pending_marketing_suppressions` used to exclude every row with `attempts >= 5`.
Nothing re-queued or surfaced an exhausted row, so a vendor outage longer than
five scheduled syncs permanently dropped the do-not-contact propagation while
the suppression itself stayed effective in `contact_suppressions`. A later
manual `mark_marketing_suppression_synced` call could still succeed, but the
worker and the documented recovery query could no longer see the row.

Migration `0015_marketing_suppression_retry.sql` replaces only the work-list
function. A row in `pending` or `failed` remains eligible until a worker records
a vendor acknowledgement. `attempts` keeps counting failures for diagnosis; it
is no longer a permanent cap. The worker's deterministic
`suppress:<channel>:<address>` idempotency key makes a replay after an ambiguous
vendor response safe to deduplicate.

This does not enable marketing, change the sender policy or touch the
suppression itself. Marketing remains disabled and the licensed-state list is
still empty.

## Regression coverage

`npm run check:db` now:

- fails the old behavior by requiring an exhausted legacy key to still be
  returned by `pending_marketing_suppressions`;
- acknowledges that row after five failures and requires it to become `synced`
  with no remaining work;
- keeps the canonical twin of the legacy key untouched throughout.

## Rollout

Apply `0015` with the `sync-marketing-suppressions` worker. No hosted database
was changed by this repair. Confirm the worker is scheduled before enabling any
marketing channel, and record the deployed commit and a labelled non-customer
sync run before closing the Heal finding.
