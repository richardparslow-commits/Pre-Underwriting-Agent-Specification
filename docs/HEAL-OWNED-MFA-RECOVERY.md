# Recover a lost enrollment response from the current tab

[Heal Nov 1 report](https://app.heal.dev/fa38cc97-45dd-4b98-8550-5fde5c59913c/runs/fae088ee-8575-4656-8440-c5cbc58b432e/defects/s8-lost-enrol-answer-strands-setup-1) describes a factor created remotely whose one-time enrollment response never reaches the reviewer. The one-factor limit then prevents a new setup while the browser has no QR/key to show.

Before enrollment, the mounted gate now assigns a random attempt marker as the factor's friendly name. Only a listed unverified factor matching this in-memory marker can offer **Restart this tab’s setup**. The UI explains replacement, requires a second explicit confirmation, and supports cancellation without any removal. No removal occurs on enrollment failure, recheck, verification failure or opening another tab.

Recovery re-lists factors before removal, preserves any verified factor, and refuses a target whose ID/type/status/marker no longer matches. After removing only the attributable pending target it re-lists through normal setup before enrolling again, so a competing tab's factor is retained. Failed rechecks/removals remain retryable; a lost removal acknowledgement is reconciled by checking absence before another operation. Unmounted gates stop before further mutations. Recovery never reports reviewer access: a fresh challenge and successful verification are still required.

Supabase additionally [requires AAL2 to unenroll a verified factor](https://supabase.com/docs/reference/javascript/auth-mfa-unenroll), protecting a verification race after the fresh read from this AAL1 gate. No admin key or backend permission change is introduced.

The marker, QR/key and codes are kept only in mounted memory. **Unknown legacy factors, another tab's enrollment, or a setup whose original tab was closed/reloaded remain operator recovery cases.** The repair does not claim ownership after reload or persist reusable authentication secrets. Existing verified authenticator flows, reviewer allowlist and MFA requirements remain intact.

Nine new state regressions cover returned/thrown lost responses, explicit owned recovery, foreign/verified/replaced factors, recheck failures, lost removal acknowledgements, duplicate clicks, unmount, and server-side verification race rejection. New tests fail against the previous hook. Two rendered Policy Compass tests cover confirmation/cancellation and verification before confirmation. All 32 source MFA state tests, 102 source reviewer tests and 48 targeted Policy Compass tests pass; build/typecheck/lint and the access guard pass. The access guard now allows only the explicitly scoped recovery callback rather than prohibiting every unenroll call.

Frontend only: no migrations, Edge Function deployments, credentials, hosted MFA settings or real factor removals. Public intake remains locked; marketing remains disabled. Sync preview only, leave repair PRs unmerged for review, and do not publish Lovable.
