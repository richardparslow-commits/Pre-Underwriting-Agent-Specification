# Heal repair — bounced email after a timed-out send

Addresses Nov 1 findings `s8-bounce-after-timed-out-send-lost-on-retry-1` and
`s7-slow-accepted-email-shown-as-rejected-1`.

## Result

Migration `0019_notification_provider_evidence.sql` separates provider evidence
from local notification state. A signed bounce is authoritative even if a local
timeout already labelled the case failed. Event application locks the stored
event and case, compares provider evidence independently, and preserves the
strongest evidence (delivery, then failure, then acceptance). Local errors never
invent provider acceptance or delivery. A late local completion cannot replace
a recorded bounce or schedule another send.

Already-correlated events remain bound to their original case and recorded
state/message. Replaying a previously ignored bounce can repair missing evidence;
ordinary duplicates remain idempotent. The forward migration reconciles one
strongest existing correlated event per case, repairing historical ignored
bounces without sending email or changing case payloads or consent.

The claim RPC rejects confirmed provider failures. The retry worker excludes
them before its batch limit, so old bounces cannot fill the batch ahead of local
failures that can recover. Existing due-time, lease, five-attempt and 24-hour
provider-idempotency limits remain in force. A real provider delivery event can
still supersede a bounce; a local send result cannot.

Customer confirmation says an errored notification could not be confirmed while
the case is saved. The timeline no longer invents provider rejection from a
request error or timeout. Acceptance and delivery remain separate; only a provider
delivery event confirms delivery. Safe operational notes remain visible.

## Regression evidence

- New database tests failed before the repair, then passed: equal-rank timeout /
  bounce, late local states, no automatic bounce claim, local-failure recovery,
  independently retained acceptance, historical replay/backfill, immutable
  duplicate binding, out-of-order events, unmatched correlation and permissions.
- All migrations replay twice in isolated PostgreSQL; historical correlated
  events are seeded before 0019 to exercise the actual forward repair.
- Real retry-handler regressions cover 20 old bounces ahead of newer due work and
  targeted bounce refusal; both failed before the query repair.
- Three display regressions cover timeout/network uncertainty, saved receipt
  confirmation, acceptance versus delivery and no-send behavior. The first two
  fail against the previous display code. Policy Compass carries equivalent tests.
- No real submission, email, provider event or hosted fixture is needed.

## Rollout

This change is prepared on review branches only. Public intake stays locked and
Lovable is not published. Preview sync carries the display repair and source
provenance; it does not deploy external Supabase functions or apply migration
0019. Main is connected to Supabase's automatic integration, so a later authorized
source main merge may apply migrations and deploy functions automatically. Inspect
hosted state after that merge before attempting a separate rollout.

When authorized, apply 0019 and deploy the matching retry-case-notifications
worker together, then verify synthetic state transitions. No secret, reviewer
MFA, origin, launch flag or question/consent wording change is required.
