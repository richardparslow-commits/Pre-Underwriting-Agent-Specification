# Operations — retention, deletion, incidents and marketing suppression

This is an engineering runbook, not a legal opinion. Items marked **BLOCKED** require an owner, counsel or provider decision and have not been executed.

## Retention and deletion

| Control | State |
|---|---|
| Case deletion function | Implemented: `public.delete_case(reference, reason)` requires an AAL2 reviewer and writes `case_deletions` before deleting the case. |
| Automatic expiry | Implemented: `public.purge_expired_cases()` reads `app_settings.retention_months`. It returns 0 while the value is null. |
| Approved retention period | **BLOCKED — LEGAL.** `retention_months` is null. No period is implied by this document. |
| Scheduled execution | **BLOCKED — OPERATIONS.** No cron job is committed for deletion until counsel approves a period. |
| Backup expiry | **UNVERIFIED.** Confirm the Supabase project's backup/PITR window in the provider console and record the actual expiry here. |
| Deletion of backups | Provider-dependent. A deleted row is not immediately removed from an existing backup; the approved schedule must say how that is handled. |

When counsel approves a period:

```sql
update public.app_settings set value = '<months>' where key = 'retention_months';
```

Then schedule `select public.purge_expired_cases();` with `pg_cron`, monitor the return count, and verify `case_deletions` contains one audit row per removed case. Never enable the job before the period is approved in writing.

A deletion request handled manually:

1. Sign in with an AAL2 reviewer session.
2. Confirm the request against the case reference and the contact address on file.
3. Record the reason and call `select public.delete_case('LPP-YYYY-XXXXXX', 'Customer deletion request');`.
4. Confirm `case_deletions` has the entry and the case is gone.
5. Record the request date and the backup expiry date in the incident/request log.

## Incident response

**Owner:** Richard Parslow, `richardparslow@lifepolicypilot.blog` (ownership of this mailbox and MFA status are still unverified — E-03/E-04).

1. Contain: revoke the affected reviewer session, rotate `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_WEBHOOK_SECRET`, `CRON_SECRET` and `RATE_LIMIT_SALT` as applicable, and disable the public function with the `QUESTIONNAIRE_APPROVED=false` launch lock if intake must stop.
2. Assess: use `case_review_log`, `case_deletions`, `email_events` and provider logs. Do not copy health answers into the incident ticket.
3. Notify: involve counsel and the provider; follow the applicable breach-notification duties. This runbook does not set a legal deadline.
4. Recover: restore from the provider backup only into an isolated project, verify integrity, then re-enable intake deliberately.
5. Review: record the root cause, the affected case references, the notification decision and the regression test added.

**Not yet evidenced:** on-call coverage, provider contact path, backup restore drill, and whether the mailbox is monitored.

## Marketing revocation and suppression

Marketing calls and texts are **disabled** in the current build and `submit-case` rejects any marketing consent record. No outbound marketing is authorised.

The operator path exists:

```sql
select public.record_marketing_revocation(
  'LPP-YYYY-XXXXXX',
  'phone',                       -- or 'email'
  'Customer asked to stop'
);

select public.is_contact_suppressed('phone', '+15125550134');
```

The first call writes both `contact_suppressions` and an audited `marketing_revocations` row. Any future outbound path must call `is_contact_suppressed` immediately before sending and must log the result. Replying STOP to a text, a voicemail withdrawal or an email withdrawal has **no live intake** yet because no channel is operated; this is a pre-enable gate, not a completed control.

Before enabling a channel:

1. Obtain counsel approval for the seller, disclosure, channel and revocation wording.
2. Implement and test the inbound STOP/withdrawal path with the vendor.
3. Verify the suppression check is on the outbound path, not only in documentation.
4. Re-run the consent regression tests and add a live non-customer STOP test.

## Deployment checklist

- [ ] Apply migrations 0001–0005 and record the applied versions.
- [ ] Keep `QUESTIONNAIRE_APPROVED=false` until 0/92 rows become 92/92 signed off.
- [ ] Set `RATE_LIMIT_SALT` to a random value and confirm the durable limiter is active; without it production returns 503 (fail closed). Only `ENVIRONMENT=test` uses the in-memory guard.
- [ ] Store `project_url` and `cron_secret` in Vault, apply `supabase/ops/retry-schedule.sql`, and verify one scheduler tick.
- [ ] Configure `EMAIL_WEBHOOK_SECRET` with the provider's `whsec_…` secret and send one signed test event.
- [ ] Confirm reviewer MFA enrolment and an aal1 → aal2 step-up on a non-customer account.
- [ ] Decide and record `retention_months`, backup expiry and the incident contact path.
- [ ] Confirm database at-rest encryption, backup encryption and key management in the provider console; do not restore the privacy-page at-rest claim until that evidence is recorded.
