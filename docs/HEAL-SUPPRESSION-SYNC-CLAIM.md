# Heal repair — overlapping suppression syncs claim one row each

Addresses Heal finding `s2-overlapping-sync-double-counts-attempts-1`.

## Behavior

`sync-marketing-suppressions` read `pending_marketing_suppressions` and then
processed every returned row. Two scheduled runs that overlapped both saw the
same row, sent the same suppression twice and recorded two failures for one
vendor outage — spending an opt-out's retry budget twice as fast (before `0015`
removed the permanent cap).

Migration `0016_marketing_suppression_claim.sql` adds `claimed_at`/`claimed_by`
and a `claim_marketing_suppressions(p_limit, p_worker, p_lease_seconds)`
function. It selects due rows with `for update skip locked`, marks the batch in
the same statement, and returns the claimed rows. A second worker therefore sees
nothing for a row already claimed. The lease defaults to ten minutes; a row whose
claim is older than the lease is eligible again, so a crashed worker does not
strand it. Both acknowledgement functions clear the claim.

`pending_marketing_suppressions` stays read-only for operators: it shows the
work list without claiming, so a manual review cannot temporarily hide rows from
the worker.

## Regression coverage

`npm run check:db` now requires:

- the first claim to return the row and record its worker;
- an overlapping second claim to return nothing for that row;
- a claim older than the lease to be reclaimed by the next worker;
- a failed acknowledgement to clear the claim and increment `attempts` once;
- a recovered vendor to claim, sync and clear the row.

Without `0016`, `claim_marketing_suppressions` does not exist, so the replay fails.

## Rollout

Apply `0016` and deploy the matching `sync-marketing-suppressions` worker
together; the deployed worker calls the claim function. No hosted database was
changed by this repair. Marketing remains disabled.
