# Heal repair — a malformed targeted retry is refused, not broadcast

Addresses Heal finding `s2-malformed-retry-reference-runs-batch-1`.

## Behavior

`retry-case-notifications` read an optional `reference` from its body. A body
with a mistyped reference (or one that did not parse, or exceeded 4 KiB) made
`requestedReference` return `null` — the same value as a scheduler call with no
body. The handler then ran the due batch over up to twenty cases, so a targeted
retry for one case resent other waiting cases and never retried the intended one.

The parser now returns an explicit result: batch, single reference, or invalid.
A non-empty body whose `reference` is present but not `LPP-YYYY-XXXXXX`, a body
that does not parse, and an oversized body all return HTTP 400
`{"error":"Invalid case reference"}` before any database query, claim or send.
An empty body, or a body without a `reference` field, remains the scheduled
batch call.

## Regression coverage

`supabase/functions/tests/retry-case-notifications_test.ts` adds:

- a malformed `LPP-2026-NOPE` reference with a due case present returns 400 and
  makes no REST, claim or provider request;
- an oversized reference body is refused the same way;
- an empty-object scheduler call still processes the due batch.

Against the previous handler the first case returned 200 and retried the due
case (`inspected: 1`, one claim, one send).

## Rollout

Deploy the matching `retry-case-notifications` function. No migration is
involved and no hosted function was changed by this repair. Intake remains
locked and marketing remains disabled.
