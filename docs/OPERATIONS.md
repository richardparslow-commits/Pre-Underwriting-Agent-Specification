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

### Customer path

The public page `/marketing-opt-out` calls the `revoke-marketing` function. A customer supplies their case reference plus the email or telephone number on that case. `request_marketing_revocation` matches both before writing anything, so a reference alone does not permit a third party to suppress someone else's marketing. The endpoint returns the same `202` whether or not a contact matched; it must not become a case-existence oracle.

A match writes:

- `contact_suppressions` — the authoritative do-not-contact row, effective immediately;
- `marketing_revocations` — an audit row with `source = 'customer_web'` and the request id;
- `marketing_suppression_sync` — a pending row for vendor/CRM propagation.

A phone suppression covers both marketing calls and texts to that number. The revocation does not edit the case payload, its consent evidence or the review. The reviewer case view loads the append-only revocation rows and marks the original marketing consent as revoked.

### Operator path

```sql
select public.record_marketing_revocation(
  'LPP-YYYY-XXXXXX',
  'phone',                       -- or 'email'
  'Customer asked to stop'
);

select public.is_contact_suppressed('phone', '+15125550134');
```

### Outbound send guard

Every future marketing sender must call this immediately before an outbound attempt:

```sql
select public.assert_marketing_send_allowed('phone', '+15125550134');
```

It raises `Contact is suppressed for marketing` when the contact is on the list. The service-role-only guard is the only authorised pre-send check; a sender that queries the suppression table itself can drift from the canonical normalisation.

### Vendor propagation

No vendor, dialer or CRM endpoint is configured here. Suppression is already effective, but propagation is incomplete until the worker is configured and run:

```bash
MARKETING_SUPPRESSION_WEBHOOK_URL=https://vendor.example/suppressions
MARKETING_SUPPRESSION_WEBHOOK_SECRET=<vendor-supplied secret>
CRON_SECRET=<scheduler secret>
```

Schedule `POST /functions/v1/sync-marketing-suppressions` with the `x-cron-secret` header. The worker reads `pending_marketing_suppressions(100)`, sends only the normalised channel and address, and marks each row synced on a 2xx response or failed after a bounded error. It is safe to re-run; the vendor request carries a deterministic idempotency key.

Manual recovery is still available:

```sql
select * from public.pending_marketing_suppressions(100);
select public.mark_marketing_suppression_synced('phone', '+15125550134', 'vendor-name');
select public.mark_marketing_suppression_failed('phone', '+15125550134', 'HTTP 500');
```

Rows stay `pending` or `failed` until the worker records success. Do not enable marketing while any required suppression is unsynced. A reply of STOP to a text, a voicemail withdrawal or an email withdrawal still needs a live vendor intake; the web form is the only customer path currently implemented.

### Before enabling a channel

1. Obtain counsel approval for the seller, disclosure, channel and revocation wording.
2. Connect the outbound sender to `assert_marketing_send_allowed` and test a blocked send.
3. Configure `MARKETING_SUPPRESSION_WEBHOOK_URL` and its secret, run the worker, and confirm every suppression leaves `pending`.
4. Implement local-time and licensed-state restrictions in the sender; this repository does not yet enforce them.
5. Implement and test the live STOP/withdrawal intake with the vendor.
6. Re-run the consent and revocation regression tests, then add a live non-customer STOP test.

## Deployment checklist

- [ ] Apply migrations 0001–0007 and record the applied versions. **Staging:** 0001–0005 applied and verified on 28 Oct 2026; 0006 (terminal notification state) and 0007 (marketing revocation) are pending. **Production:** not applied.
- [ ] Keep `QUESTIONNAIRE_APPROVED=false` until 0/92 rows become 92/92 signed off.
- [ ] Set `RATE_LIMIT_SALT` to a random value and confirm the durable limiter is active; without it production returns 503 (fail closed). Only `ENVIRONMENT=test` uses the in-memory guard.
- [ ] Store `project_url` and `cron_secret` in Vault, apply `supabase/ops/retry-schedule.sql`, and verify one scheduler tick.
- [ ] Deploy `revoke-marketing` and `sync-marketing-suppressions` with `verify_jwt = false`, then submit one labelled opt-out and confirm the suppression and outbox rows.
- [ ] Configure `EMAIL_WEBHOOK_SECRET` with the provider's `whsec_…` secret and send one signed test event.
- [ ] Configure `MARKETING_SUPPRESSION_WEBHOOK_URL` and its secret, then run one suppression-sync tick against a non-customer test address and confirm the row leaves `pending`.
- [ ] Confirm reviewer MFA enrolment and an aal1 → aal2 step-up on a non-customer account.
- [ ] Decide and record `retention_months`, backup expiry and the incident contact path.
- [ ] Confirm database at-rest encryption, backup encryption and key management in the provider console; do not restore the privacy-page at-rest claim until that evidence is recorded.
