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

## Notification retries

For integrations such as Policy Compass, set `REVIEWER_PORTAL_URL` to the full
HTTPS reviewer page (`/reviewer` in Lovable). Both notification send paths use
this setting; they do not append `/portal` to it. Keep credentials, query strings
and fragments out of this URL. Invalid explicit settings prevent sending and
claiming retry work. Without the setting, the standalone app continues using the
first APP_ORIGIN plus `/portal`. Do not alter APP_ORIGIN's request allowlist merely
to change the email destination. The reviewer membership and MFA checks still
apply when following any notification link.

The notification worker claims a case with a lease, sends with the case
reference as the provider idempotency key, and records the result. The provider
deduplicates that key for 24 hours, so migration `0010` records
`notification_first_attempted_at` and refuses to claim a case more than 24 hours
after it. Backoff is unchanged: `failed` retries after 15 minutes and `not_sent`
after one hour, up to five attempts, inside the seven-day submission window.

A case that reaches the window boundary is not silently dropped. It appears in:

```sql
select * from public.notification_retry_backlog order by submitted_at;
```

Review each row against the provider dashboard:

- If the provider shows an accepted or delivered message for the case, the
  notification was sent. Do not retry it; reconcile the case state instead.
- If the provider shows no message for the case, the send did not happen. The
  operator may reopen it once:

```sql
update public.cases
set notification_first_attempted_at = null,
    notification_next_attempt_at = now(),
    notification_state = 'queued'
where reference = 'LPP-YYYY-XXXXXX'
  and notification_state in ('failed', 'not_sent');
```

Never clear the timestamp without that provider check: it re-arms a retry whose
idempotency key may have expired. Record the case reference and the provider
evidence in the operations log.

The 24-hour figure is the provider's documented window, not a local guarantee.
If the provider changes it, update `FIRST_ATTEMPT_WINDOW_HOURS`,
`claim_case_notification` and this section together. A shorter real window would
still allow a duplicate after an ambiguous acceptance; the only complete fix is
provider confirmation, which this repository cannot supply.

## Marketing revocation and suppression

Marketing calls and texts are **disabled** in the current build and `submit-case` rejects any marketing consent record. No outbound marketing is authorised.

### Customer path

The public page `/marketing-opt-out` calls the `revoke-marketing` function. A customer supplies their case reference plus the email or telephone number on that case. `request_marketing_revocation` matches both before writing anything, so a reference alone does not permit a third party to suppress someone else's marketing. The endpoint returns the same `202` whether or not a contact matched; it must not become a case-existence oracle.

A match writes:

- `contact_suppressions` — the authoritative do-not-contact row, effective immediately;
- `marketing_revocations` — an audit row with `source = 'customer_web'` and the request id;
- `marketing_suppression_sync` — a pending row for vendor/CRM propagation.

Only the matching contact details supplied in the request are suppressed: an email-only request does not suppress a phone number, and the form now states that limitation. A matching phone suppression covers both marketing calls and texts to that number. Product and counsel must approve the intended withdrawal scope, and vendor propagation must be verified before marketing is enabled. The revocation does not edit the case payload, its consent evidence or the review. The reviewer case view loads the append-only revocation rows and marks the original marketing consent as revoked.

A repeated request with the same `Idempotency-Key` (or a body-derived key from an older client) hashes to the same request id. Migration `0008` treats an existing request id plus suppression and outbox row as a replay: it returns the recorded channel without updating the suppression, so a synced outbox row cannot be reset to pending. A genuinely new request id is still allowed to re-queue propagation.

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

Every future marketing sender must call `sendMarketingMessage` in `supabase/functions/_shared/marketing-sender.ts`. It is the only approved path to a provider callback and checks, in order:

1. `MARKETING_LICENSED_STATES` contains the stored case's state. The list is empty by default, so every send is refused.
2. For `phone`, every time zone in that state is inside `MARKETING_CALLING_START_HOUR` (default `8`) and before `MARKETING_CALLING_END_HOUR` (default `21`). A multi-zone state must be inside the window in every zone. Email has no calling-hours restriction, but still requires an approved state.
3. The database `assert_marketing_send_allowed` guard. It raises `Contact is suppressed for marketing` when the contact is on the list.

Only after all three pass does the wrapper invoke the injected provider adapter. There is no provider adapter in this repository, and no channel is enabled.

The SQL guard remains the canonical suppression check; a sender must not query the suppression table itself and drift from its normalisation. The state/time policy is server-side TypeScript, not a database rule, so a sender that bypasses `sendMarketingMessage` bypasses it. `npm run check:marketing` fails if the wrapper stops checking policy and suppression before `deliver`.

The state comes from the stored case, never the browser's `timeZone` field. The wrapper trusts the `state` argument, so its caller must read it from the stored case row; passing a browser-supplied value defeats the policy. For a state that spans zones, the conservative all-zones rule can refuse a contact who is inside the window in their own zone. That is deliberate until counsel approves a contact-level time-zone source. Do not set `MARKETING_LICENSED_STATES` merely to make a test pass; record the approved state matrix and calling window first.

```bash
MARKETING_LICENSED_STATES=TX
MARKETING_CALLING_START_HOUR=8
MARKETING_CALLING_END_HOUR=21
```

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

1. Obtain counsel approval for the seller, disclosure, channel, state matrix, calling window and revocation wording.
2. Connect the outbound sender through `sendMarketingMessage`; do not call the provider directly. Test a blocked suppression and a send outside the window.
3. Configure `MARKETING_SUPPRESSION_WEBHOOK_URL` and its secret, run the worker, and confirm every suppression leaves `pending`.
4. Set and record the approved `MARKETING_LICENSED_STATES` and calling window. Leave the list empty until each state is approved; the default refuses every send.
5. Implement and test the live STOP/withdrawal intake with the vendor.
6. Re-run the consent, revocation, policy and sender regression tests, then add a live non-customer STOP test.

## Deployment checklist

The detailed, window-by-window procedure for migrations `0006`–`0010`, including the audited case read and marketing withdrawal exercises, is in the [staging deployment runbook](STAGING-RUNBOOK.md). The list below is the summary version.

- [ ] Apply migrations 0001–0014 in order and record the applied versions. **Staging:** 0001–0005 were verified on 28 Oct 2026; verify the current status and evidence for 0006–0014 before proceeding. **Production:** not verified. Deploy the matching portal code and migrations together; verify AAL1/AAL2, non-reviewer and direct REST denial, and logging failure with labelled data.
- [ ] Keep `QUESTIONNAIRE_APPROVED=false` until 0/92 rows become 92/92 signed off.
- [ ] Set `RATE_LIMIT_SALT` to a random value and confirm the durable limiter is active; without it production returns 503 (fail closed). Only `ENVIRONMENT=test` uses the in-memory guard.
- [ ] Store `project_url` and `cron_secret` in Vault, apply `supabase/ops/retry-schedule.sql`, and verify one scheduler tick.
- [ ] Deploy `revoke-marketing` and `sync-marketing-suppressions` with `verify_jwt = false`, then submit one labelled opt-out twice with the same `Idempotency-Key` and confirm one audit row and one outbox state; use a new key to confirm propagation re-queues.
- [ ] Configure `EMAIL_WEBHOOK_SECRET` with the provider's `whsec_…` secret and test a signed unmatched event arriving before message-id correlation: verify the 503 triggers provider retry and eventual correlation.
- [ ] Confirm the provider's idempotency-key window is still 24 hours. Migration `0010` refuses an automatic retry after that window; exercise one `notification_retry_backlog` review with labelled data and record the provider evidence.
- [ ] Configure `MARKETING_SUPPRESSION_WEBHOOK_URL` and its secret, then run one suppression-sync tick against a non-customer test address and confirm the row leaves `pending`.
- [ ] Confirm reviewer MFA enrolment and an aal1 → aal2 step-up on a non-customer account.
- [ ] Decide and record `retention_months`, backup expiry and the incident contact path.
- [ ] Confirm database at-rest encryption, backup encryption and key management in the provider console; do not restore the privacy-page at-rest claim until that evidence is recorded.
