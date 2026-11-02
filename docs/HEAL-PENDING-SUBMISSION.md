# Heal repair — Back and edits while a submission is pending

Addresses Nov 1 finding `s5-back-edit-dropped-behind-confirmation-1`.

## Behavior

Previously, Back could reopen the interview or contact step while the sender
held the original draft. The user could edit answers or reset the form, then the
receipt for the old snapshot replaced the edited screen. Those changes appeared
to have been submitted even though the server received the earlier draft.

The live intake session now guards every editing/navigation/reset action with
its synchronous single-flight flag, including handlers captured before React's
pending render. While sending, its exposed step and resume metadata remain on
review. The intake route shows an accessible waiting status instead of editable
forms, and review edit buttons also honor their existing submitting prop.
The notice does not claim a case has already been saved.

A successful receipt still belongs to the unchanged reviewed draft. A failed or
uncertain response restores review using the latest committed navigation, unlocks
editing and retains identical evidence/key for an unchanged retry. Editing after
a response still invalidates review; it does not rotate the operation key to hide
a possible saved-case conflict. The existing server payload comparison remains
the integrity boundary. Completed receipts cannot be submitted again; starting
over after completion creates a fresh local operation as before.

Policy pages remain readable while a request is pending. Receipt/error updates
stay in the shared route scope without forcing navigation away from policy.
Leaving the scope or refreshing still discards private in-memory state; a late
response cannot reopen the discarded session. No answers, evidence or operation
key are added to browser storage, history or URLs.

## Regression coverage

- Real source React Router and Policy Compass TanStack history Back while a
  deferred sender is pending, including pre-render stale edit/reset handlers.
- Contact/answer/adult/permission/review mutations, stale receipt, navigation,
  duplicate send and reset attempts cannot change the in-flight snapshot.
- Success retains the original snapshot/receipt; failure after Back restores
  editable review and preserves identical unchanged-retry evidence and key.
- Edits after failure invalidate review without changing the operation key.
- Waiting UI replaces all four history-selected forms; review edit paths are
  disabled. Four new cases fail against the old implementation.
- Existing policy navigation, single-flight, failed retry, unmount/late-response,
  permission-history and private synthetic questionnaire checks remain covered.

## Rollout

Frontend only. No migration, Supabase function, setting, question/consent wording
or sender API change is required. Carry the display/session repair into Lovable
preview while preserving its synthetic-only finish action, MFA and public intake
lock. Leave review PRs unmerged until authorized; do not publish Lovable.
