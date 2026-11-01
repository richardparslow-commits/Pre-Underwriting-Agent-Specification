# Heal repair — a provider bounce survives the in-flight send result

Addresses Heal finding `s3-bounce-during-submit-send-overwritten-1`.

## Behavior

`complete_case_notification` returned early only when the case was already
`delivered`. A signed `email.bounced` event that arrived while `submit-case` or
the retry worker was still awaiting the provider therefore set `failed`, and
the send's later completion wrote `accepted` over it. The event was already
correlated, so a redelivery answered `duplicate` and the case could not heal.

Migration `0017_notification_provider_failure.sql` adds
`notification_provider_state` and records the provider's own state whenever
`apply_email_event` applies an event. The completion path now ignores an
`accepted`/`delivered` send result when the provider has recorded `failed`, just
as it already ignored results after `delivered`. The row trigger rejects direct
writes that overwrite provider delivery or provider failure evidence.

A local failure with no provider event (for example a provider timeout recorded
by the sender) can still be replaced by a later accepted retry; only provider
evidence is sticky. Retry, claim and intake behaviour are otherwise unchanged.

## Regression coverage

`npm run check:db` now requires:

- a signed bounce applied to a queued case to set `failed` and the provider state;
- a late `complete_case_notification('accepted')` to leave the case `failed`;
- a direct `update … set notification_state='accepted'` to raise;
- an unrelated local failure to still recover to `accepted` when a retry succeeds.

Without `0017`, the first assertion fails because no provider state is recorded
and the completion overwrites the bounce.

## Rollout

Apply `0017` with the matching `email-events`, `submit-case` and
`retry-case-notifications` builds. No hosted database was changed by this
repair. Intake remains locked and marketing remains disabled.
