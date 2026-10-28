# Prior audit list 2 — conditions before accepting real customer submissions

Preserved verbatim from `2026-10-27-pre-underwriting-audit.md` section 12. This is the second prior launch-readiness list. It is **not** a remediation confirmation; none of these conditions was marked satisfied by the audit.

## 12. Conditions before accepting real customer submissions

1. Every one of the 92 bank rows has a named reviewer decision; the seven changed windows are restored or explicitly approved; `sourceVerified: true` is set for every row; `QUESTIONNAIRE_VERSION` is bumped and the report regenerated.
2. `submit-case` validates the snapshot against a server-side approved bank and rejects held rows, unknown IDs, changed source wording/timeframes and stale acknowledgements.
3. Consent requirements, versions, wording hashes, seller and enabled channels are server policy; forged marketing or privacy evidence is rejected; server receipt time is stored separately.
4. Orphaned branch details are purged on parent change and never submitted or displayed as `not_asked`.
5. Submission is idempotent (one case per draft) and the notification path is claimed, idempotent and reconciled; duplicate-case and duplicate-email tests pass.
6. Delivery webhooks are signature-verified, deduplicated and monotonic; `delivered` cannot regress; provider acceptance is never presented as delivery.
7. The deployment includes the JWT-off configuration for the three functions, a retry schedule, pinned dependencies and a successful non-customer end-to-end run with a real provider and a real reviewer sign-in.
8. Live RLS is verified with an anonymous user, an authenticated non-reviewer and the reviewer; MFA is enforced; a forwarded reference alone is denied.
9. Adult/self and state rules are enforced server-side; a 17-year-old and a third-party payload are rejected.
10. Held sensitive questions are not presented to customers; the privacy version is correct and the customer-facing counts are accurate.
11. Counsel has approved the entity, notice, acknowledgement, TCPA wording and sensitive-question handling; HIPAA/Texas applicability and vendor roles are documented.
12. Retention/deletion, backup, incident response, mailbox ownership and provider settings are documented, configured and verified; logs and the browser bundle have been re-checked for health data.

Until those are satisfied, the honest description is: **a well-built, unusually candid local prototype that must not be used for real applicants.**
