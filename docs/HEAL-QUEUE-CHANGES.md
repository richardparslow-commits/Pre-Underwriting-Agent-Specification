# Heal repair — acknowledge cases arriving during queue paging

Addresses Nov 1 finding `s3-new-case-hidden-while-paging-queue-1`.
An older-page cursor cannot reach cases submitted above the first page. The count
refreshes queue-wide, but the old footer claimed every case was visible solely
because there was no older cursor.

Each load still makes two authenticated summary requests: one page of at most 26
rows, and an independent exact queue count with one minimal head row containing
only reference/submitted_at. This replaces the zero-row HEAD count; it adds no
request and reads no payload. The same view and reviewer/AAL2 protections apply.
A new head identifies changes even when an insertion and deletion cancel out in
the count. Failed or malformed metadata rejects the response rather than
establishing completeness.

The queue compares head/count metadata with the displayed snapshot and initial
load. A changed head, changed total or final count/list disagreement sets a
persistent warning. A first-page/metadata race is also warned about. The notice
offers Refresh latest cases. Paging preserves it even if a later response again
matches the baseline. Only a successful refresh replaces the old walk and clears
the warning if the new snapshot is consistent. Failure retains rows, cursor and
warning for retry. Existing single-flight and session generation guards remain.

The footer reports rows from this load and no longer claims all currently visible
cases are shown. An empty but stale response cannot claim No cases yet. Both
refresh actions also refresh the independent safety disclosure check. Cases do
not automatically jump into an older walk; reviewers control the refresh.

Synthetic tests cover the reported 50/51 mismatch, same-total replacement,
persistent warning, failed refresh, successful reconciliation, first-read race,
missing head metadata, session changes, and the actual PostgREST request shape.
No real case, credential or health data is used. Existing refresh/paging,
duplicate request and late-response regressions remain in place.

Frontend-only repair: no migration, function deployment or hosted setting change.
Keep public QUESTIONNAIRE_INTAKE_LOCKED=true, hosted QUESTIONNAIRE_APPROVED=false,
reviewer MFA and marketing-disabled state unchanged. Sync preview only; leave PRs
unmerged in this repair turn and do not publish Lovable.
