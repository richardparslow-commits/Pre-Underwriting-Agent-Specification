# Heal repair — phone withdrawal evidence outlives recent history

Addresses Nov 1 finding `s8-phone-withdrawal-pushed-out-by-email-withdrawals-1`.
An old phone withdrawal fell outside the initial 20 events after newer email
withdrawals. Case review incorrectly treated that bounded list as current consent.
Local suppression was not removed, but the reviewer lost evidence and saw Given.

Forward migration 0020 preserves the existing audited case payload read and adds:

- A separate latest phone withdrawal selected across all case-linked evidence.
- Bounded pages of 20 events with a created_at/bigint-id keyset continuation.
- An allowlisted AAL2-only paging RPC that records an opened audit event before
  returning evidence. An audit failure aborts the read. Browser roles cannot call
  the helper or read the table directly. Contact addresses are not returned.
- Supporting case/channel and cursor indexes; applied migrations are unchanged.

The interface derives call/text Revoked badges from the independent latest phone
record and shows that evidence even when the history page contains only email.
Load older withdrawals reaches the complete retained history. Pages de-duplicate
exact string IDs, retain earlier rows on error and permit retry, prevent duplicate
requests and discard late responses after case refresh/unmount. The original
submitted consent snapshot is never changed.

An older backend lacks the summary/cursor metadata. Known phone evidence still
shows Revoked; an email-only response cannot establish current phone permission.
The UI shows Given at submission; withdrawal status unavailable and a visible
warning, plus an older-history warning. Null from the updated backend establishes
that no phone withdrawal is recorded on this case. No marketing capability is
introduced or enabled by this read-only evidence repair.

Regressions use an isolated database with a phone withdrawal and 64 newer email
withdrawals, tied timestamps and IDs beyond JavaScript's safe integer. They prove
summary visibility, all 65 events reachable, no cross-case/address leakage,
permissions, cursor validation and audit failure behavior. New interface/decoder
tests cover rendered badges, immutable consent, old-backend warnings, successful
and failed history reads, retry/overlap/refresh behavior and malformed responses.
Two new badge tests fail against the old Policy Compass implementation.

This branch prepares 0020 but does not apply it to hosted Supabase. Preview sync
alone deploys no external backend. A later authorized merge of source main may
trigger its existing Supabase integration; check hosted migration state afterward.
Keep public QUESTIONNAIRE_INTAKE_LOCKED=true, hosted QUESTIONNAIRE_APPROVED=false,
marketing disabled and reviewer MFA unchanged. Do not publish Lovable.
