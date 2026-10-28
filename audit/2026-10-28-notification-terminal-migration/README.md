# Delivered notification state — forward migration

**Date:** 28 October 2026\
**Target:** existing databases that already recorded migration `0003` as applied, including the staging project\
**Scope:** one migration and its database regression test. This is not a new audit or a production approval.

## Why a forward migration

The first remediation edited `0003_reliability_and_access.sql` to make `complete_case_notification` return early when the current state is `delivered`. That is correct on a fresh database, but the staging project recorded `0003` as applied before the edit. Migration tooling does not re-run an applied version, so the staging database would keep the original unconditional function.

`0006_notification_terminal_state.sql` is the forward fix:

1. it replaces `complete_case_notification` with the terminal-state guard;
2. it normalises any existing delivered row that still carries a retry time or a stale lease;
3. it adds the `cases_delivered_is_terminal` trigger, so a direct service-role update cannot move a delivered case back to another state or attach a retry time.

The trigger is the table-level counterpart to the RPC guard. The RPC cannot be the only protection because the service role can update the table directly.

## Regression coverage

`scripts/check-db.mjs` now loads `0001`–`0006` twice (proving every migration is re-runnable) and asserts:

- a late `accepted` completion leaves the delivered case delivered;
- the late call does not change attempts, detail or provider message id;
- a late `failed` completion leaves the state delivered and `notification_next_attempt_at` null;
- the retry worker cannot claim the delivered case;
- a direct service-role update to `accepted` is rejected with “terminal”;
- a direct service-role retry timestamp is rejected with “terminal”;
- the rejected writes leave the row unchanged;
- an `accepted` case can still become `delivered`, so the guard is not over-broad.

A genuine retry after `failed` still records `accepted`, preserving the legitimate retry path.

## Evidence

Full output: [`check-db.log`](check-db.log) — `SUMMARY failures=0`, exit 0.\
Related: [`../2026-10-28-master-remediation/LEDGER.md`](../2026-10-28-master-remediation/LEDGER.md) records the original finding.

## Remaining

- Apply `0006` to the staging project and repeat the late-completion probe there. The local PGlite replay is not hosted evidence.
- Production has no migrations applied; `0006` is part of the ordered set for a future deployment.
- No live provider, scheduler or inbox was exercised.
