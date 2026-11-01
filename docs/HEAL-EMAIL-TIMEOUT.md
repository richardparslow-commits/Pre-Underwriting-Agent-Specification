# Bounded notification wait after saving a case

Heal report: `s1-submit-held-by-stalled-email-1`.

`sendCaseNotification` limits the complete Resend request, including response-body
reading, to eight seconds. At the deadline it aborts the request and returns
`failed` with a fixed operational note: delivery is unconfirmed and queued for
retry. A late response cannot change that returned result. Fast sends clear the
timer. Neither a timeout nor provider acceptance claims inbox delivery.

The submit handler still saves the case first, then claims the notification lease.
After a timeout it records the failed attempt through the existing completion RPC
and returns HTTP 201 with the saved case reference. The existing retry worker
shares this bounded sender, backoff, claim and provider-idempotency window; retries
reuse the case reference. An unchanged submission retry returns the same case
without another insert or send. A provider timeout is uncertain: it is not proof
that Resend rejected the message. Signed provider events remain authoritative.

The eight-second bound covers the provider operation, not database latency or the
entire HTTP request. The existing notification attempt cap and recovery procedures
are unchanged. A retry batch can still spend up to eight seconds per stalled row.

## Regression evidence

- A provider that stalls before response headers is aborted and returns `failed`;
  the next successful attempt retains the same provider idempotency key.
- Response headers followed by a stalled body have the same deadline. A caught
  body-read abort cannot be mistaken for provider acceptance.
- The real submit handler saves one synthetic case before sending, returns its
  reference after the timeout, records the retryable failure, and replays an
  unchanged submission without duplicating the case or notification.

All three cases fail against the former unbounded sender. Fixtures contain only
synthetic values and make no network requests. The existing CI server-test step
discovers these tests; no new dependency or launch setting is needed.

## Rollout

This is backend-only. Deploy both `submit-case` and `retry-case-notifications`
from the reviewed source commit in a separately authorized backend rollout. No
migration, credential or authentication changes are required. Merely syncing
Policy Compass's Lovable preview does not deploy these external Supabase functions.
Keep `QUESTIONNAIRE_APPROVED=false` and the Policy Compass intake lock enabled;
Lovable publication is not part of this repair.
