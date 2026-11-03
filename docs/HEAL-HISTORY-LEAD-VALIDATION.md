# Heal repair — Browser Forward must revalidate contact details

Addresses Nov 1 finding `s7-history-forward-skips-lead-checks-1`.
History previously rechecked intake permission only. Back, clearing an email and
Forward could expose later steps with an invalid lead, because validation lived
only in LeadForm's submit handler.

The interview controller now runs the same validateLead rules and requires the
existing privacy acknowledgement before showing permission, interview or review.
It synchronously renders contact details for a rejected step, replaces that
history entry with lead and requests field validation. Replacing the entry avoids
navigation loops and prevents editing the last invalid field from unexpectedly
jumping forward. Continue remains an explicit action after correction.

LeadForm shows the existing field and privacy errors on return and focuses the
first invalid control. No new validation or legal wording is invented. Direct
Continue/permission callbacks also recheck eligibility. Draft construction uses
the same checks plus intake permission, so a nonempty malformed email cannot
materialize a draft merely by invoking review confirmation.

Answers, question position, the submission operation key and unchanged consent
timestamps remain in memory; edits still invalidate review confirmation. Completed
receipts remain terminal, pending submission edits remain guarded, and reload,
Start over and leaving the intake scope still discard private state. History
continues to contain only an opaque visit ID and screen name, not answers,
contact values, validation errors, consent evidence or the submission key.

Regressions cover invalid email/name/date/phone across permission, interview and
review entries, revoked privacy acknowledgement, direct callback/draft attempts,
state preservation and explicit continuation after correction. A real React Router
Back/Forward regression checks replacement and query/hash preservation. Policy
Compass's TanStack form tests verify visible errors, focus, metadata, no health
screen/submit and successful recovery. Old navigation fixtures now seed a complete
valid lead so they exercise the real workflow rather than bypassing LeadForm.

Frontend only: no migration, function deployment or hosted settings change. Public
QUESTIONNAIRE_INTAKE_LOCKED=true, hosted QUESTIONNAIRE_APPROVED=false, marketing
disabled and reviewer MFA stay unchanged. Server validation remains independent.
Sync preview only; leave PRs unmerged in this repair turn and do not publish.
