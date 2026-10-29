# Heal priority repairs — permissions and submission integrity

This first repair batch addresses three findings from the Heal run against
`5eb0241251d30e6b4e68b23134814272219410ec`:

| Heal finding | Result | Regression evidence |
| --- | --- | --- |
| `s5-reviewer-writes-queue-view-directly-1` | Forward migration `0011_queue_read_only.sql` revokes retained table and column ACLs from public, anon and authenticated, then grants authenticated SELECT only. Existing reviewer/AAL2 checks and audited RPCs remain in force. | `npm run check:db` seeds historical table and column write grants before migration 0009, replays all migrations twice, denies view INSERT/UPDATE/DELETE, and checks that reviewed/deleted actions still work through audited RPCs. |
| `s3-corrected-lead-dropped-on-resubmit-1` | Both replay paths compare the saved canonical content before returning a receipt. Changed content returns HTTP 409 with the existing case reference and explicit correction guidance. No second case is created and no saved payload is overwritten. | Real-handler tests cover unchanged retries after a lost response, changed contact/answer/consent/acknowledgement, concurrent insert collisions with matching and different content, edits before save, JSONB object ordering and consent ordering, and legacy missing payloads. |
| `s2-long-lead-text-lost-1` | A pure shared validator rejects oversized or non-text supplied lead fields before optional values can disappear. Browser validation uses the same rules; text controls show limits and form errors. | Real-handler tests cover limit+1 rejection before writes and exact-limit storage/replay for all optional text fields. Client boundary tests and rendered control tests cover browser constraints. |

The replay comparison includes questionnaire version, session start, normalized
lead fields, canonical answers, consent evidence, submission acknowledgement,
adult attestation and relationship. Object key order is irrelevant; consent
records are compared in ID order. Rebuilt `completedAt` and server/workflow
metadata are excluded. Consent and acknowledgement timestamps are deliberately
compared because they are evidence. A missing or malformed legacy payload does
not qualify for a successful replay.

Keep the original intake operation key after an uncertain request, including if
the user edits. Rotating it automatically could create a duplicate case. A 409
means the earlier case exists but the edited content was **not** saved; the user
must contact Richard to append a correction. The review error heading no longer
claims “Nothing was sent” for a saved or uncertain submission. This batch does
not rewrite immutable case snapshots or add an unauthenticated correction API.

## Verification

```sh
npm ci --ignore-scripts
npm run check:db
npm run test:validation
npm run test:submission-ui
deno test --allow-env --lock=deno.lock supabase/functions/tests/
npm run typecheck
npm run build
npm run check:bundle
```

The database harness is a disposable PGlite database. Handler tests replace the
database transport and never contact a hosted database or email provider. CI
runs these checks, including the new rendered UI regression tests. They are not
evidence of deployment or of independently re-running Heal's hosted/browser run.

## Deployment follow-up

Apply migrations in order through `0011`. Do not edit an already-applied 0009 or
restore direct reads of sensitive tables. The previous staging runbook ends at
0010; this migration is an additional required step before exposing the queue.
On an environment already running 0009/0010, apply 0011 as a forward ACL repair.
Deploy the matching `submit-case` function and browser build. The shared
lead-validation module is pure TypeScript inside the function bundle; the browser
imports only this module, with no server client, keys or health-question source.

Run `supabase/ops/staging-runbook-checks.sql`; its new 0011 checks inspect
effective table **and column** privileges without reading case data. Then use
synthetic staging cases to verify reviewer REST PATCH/DELETE/INSERT denial and
successful audited review/correction/deletion paths. Check inherited role grants
if the catalog query still reports write access; do not waive the check.

Reproduce a committed submission whose response is lost, then an unchanged retry
and an edited retry. Verify one stored case, a replayed original receipt for the
unchanged request, a 409 for the edit and visible correction guidance. Exercise
the exact/over-limit contact and coverage values through the browser and direct
function request. Record the deployed commit and evidence before closing Heal
findings.

No deployment is performed by this repair batch. The application remains in
testing. Clarification-history access, queue-wide safety disclosure visibility,
hosted forwarded-header verification, notification/suppression processing,
navigation and the other Heal reports remain outstanding. Existing questionnaire,
legal and operational launch gates remain unchanged; marketing remains disabled.
