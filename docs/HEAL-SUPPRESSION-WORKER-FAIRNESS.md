# Heal repair — suppression fairness, ownership and phone normalization

Addresses the Nov 1 run's High `s5-refused-opt-outs-block-newer-ones-1`,
`s6-long-sync-run-opt-out-sent-twice-1` and `s5-legacy-phone-sent-without-country-code-1`.

## Result

Migration `0018_suppression_worker_fairness.sql` orders eligible work by next
attempt time before limiting. Refusals remain locally suppressed and retryable,
with exponential backoff from one minute to one hour and no permanent attempt
cap. Even due-again older failures yield to untouched work with an earlier due
time. No failed opt-out is dropped to make the queue look healthy.

The worker claims one row immediately before each send, up to 100 per invocation,
and stops claiming after 25 seconds. Each vendor fetch is aborted after eight
seconds. This bounds new work rather than promising a hard total request duration:
database latency and the current request can extend the invocation.

Each ten-minute lease gets a fresh UUID token. Completion requires the exact stored
key, owner, token and unexpired lease; stale success/failure, duplicate completion
and wrong-owner results change nothing. A new revocation invalidates an in-flight
claim. Only a current acknowledged 2xx counts as synced; lost ownership counts as
skipped. Legacy unfenced worker RPCs lose service-role access.

Vendor payloads and deterministic idempotency keys use `normalize_contact`, so
legacy ten-digit US phones include country code 1. Completion uses the original
stored key, preserving independently stored legacy/canonical rows. Invalid stored
phones are retained as failed without contacting the vendor. Vendor deduplication
still depends on honoring the idempotency key; fencing cannot undo a request.

## Regression evidence

- `npm run check:db` includes a disposable PostgreSQL replay of all migrations
  twice and six worker subtests (seven Node test results including the parent).
- Tests cover 100 refusals followed by a new opt-out, due-again scheduling, bounded
  backoff/recovery beyond five failures, overlap, expiry/reclaim, same-owner token
  rotation, stale/wrong/duplicate results, requeue invalidation, exact legacy keys,
  canonical vendor identity and service-only permissions.
- Deno tests drive the real worker with a synthetic database/vendor transport:
  one-at-a-time claims, canonical payload/key, exact-key fenced completion,
  422/503 recovery, actual vendor abort, bounded new work, stale-result counts,
  invalid phone, missing migration/token, acknowledgement errors and existing
  method/auth/no-vendor guards. They send no real contacts or vendor requests.
- The new database tests failed before the migration because its RPCs did not
  exist, then passed after the forward migration.

## Rollout and limits

This repair prepares source changes only. Apply `0018` and deploy the matching
`sync-marketing-suppressions` function together after explicit hosted rollout
authorization. Migration-first causes an old worker to fail closed at its claim;
worker-first fails closed before sending until the new RPC exists. Schedule the
pair together and verify against synthetic vendor data before enabling marketing.
Persistent vendor refusals require investigation; they remain visible and retryable.

No hosted migration, function, vendor credentials or launch settings are changed
by a Lovable preview sync. Public intake stays locked, marketing stays disabled,
and Lovable is not published. See [operations](OPERATIONS.md#vendor-propagation).
