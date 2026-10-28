# SC-06 resolution — README status table

**Date:** 28 October 2026\
**Finding:** `SC-06` — Low, documentation inconsistency (A6 specification conformance)\
**Cross-pass IDs:** `MI-15`, `A7-14`\
**Status:** **Resolved — documentation only**\
**Repository state:** `main` @ `f23974b`, plus the README edit and this note\
**Preserved package:** [`2026-10-28-spec-conformance/`](2026-10-28-spec-conformance/) is unchanged; its `MANIFEST.sha256` still verifies.

## Why this note exists

A6 observed that the root README status table said migrations and functions had never been run against a project, while the same README and the staging package recorded hosted migration `0005` and a live AAL2 queue response. The table was stale in the cautious direction.

The first replacement, in `2afafd4`, overcorrected: it said the migrations **and the edge functions** were “deployed and probed with labelled data.” The staging package records migration history, the `case_summaries` view, grants and RLS, and Auth/REST HTTP checks. It records no edge-function deployment or invocation. The corrected row therefore states only the evidence that exists and makes no deployment claim it cannot support.

## Resolution

[`README.md:28`](../README.md#L28) now says:

> Applied and exercised on a non-production staging project on 28 Oct 2026: migrations 0001–0005 are applied; the 0005 `case_summaries` view, its grants and the AAL1/AAL2 boundary were verified; and a live AAL2 queue response was captured with a labelled temporary reviewer. No edge-function or production deployment is recorded, and no live provider delivery, scheduler run or retention execution exists. Forward migration 0006 (terminal notification state) is not applied there.

This is staging evidence only. It does not claim production deployment, edge-function deployment, a real staff reviewer's in-app step-up, live provider delivery, scheduler execution, retention or legal approval.

## Evidence used

All paths are under [`2026-10-28-migration-0005-staging/`](2026-10-28-migration-0005-staging/).

| Statement in the README row | Evidence | Result |
| --- | --- | --- |
| Migrations `0001`–`0005` are applied | [`verification.log`](2026-10-28-migration-0005-staging/verification.log), migration history | Local and remote both list `0001` through `0005`. |
| The `0005` view exists and has no answer or payload columns | Same log, view-column check | Twelve summary columns; `payload`, `answers`, `answer_text`, `answer_values`, `fields`, `details` and `review_note` are absent. |
| The view inherits case RLS and is not anonymously readable | Same log, reloptions and grants | `security_invoker=true`; `anon` select is `false`; `authenticated` select is `true`; anonymous query is denied with `42501`. |
| The AAL1/AAL2 boundary was verified | Same log, rolled-back temporary reviewer | AAL1 sees `0` summaries; AAL2 sees `1`; cleanup returns all counts to zero. |
| A live AAL2 queue response was captured | [`http-queue-verification.log`](2026-10-28-migration-0005-staging/http-queue-verification.log) | AAL2 `GET /rest/v1/case_summaries` returned `200` with one row and the exact nine client keys; AAL1 returned `200` with zero rows; `payload` returned `400`/`42703`; anonymous returned `401`. |
| Forward migration `0006` is not applied | [`verification.log`](2026-10-28-migration-0005-staging/verification.log), migration history | The remote history stops at `0005`. |
| No edge-function deployment is recorded | Staging package scope and both logs | The HTTP proof calls `/auth/v1` and `/rest/v1` only. No function URL, deployment command or invocation appears in the package. |
| No production or live-provider evidence exists | Staging [README §5](2026-10-28-migration-0005-staging/README.md) | The package says it is staging only and lists production, a real reviewer, a client rebuild and credential rotation as remaining work. |

The live HTTP proof used direct GoTrue and REST calls, not the portal. That limitation is already recorded in the staging package and is not changed by this note.

## Consistency check

| Check | Result |
| --- | --- |
| README table matches the staging package | **Yes** — the row now names the same migrations, view checks, boundary proof, queue response and `0006` gap. |
| [`docs/LAUNCH-GATES.md`](../docs/LAUNCH-GATES.md) agrees | **Yes** — gate 7 records the hosted view/grants, AAL1/AAL2 boundary and live queue response, and keeps a real staff reviewer as remaining work. It makes no edge-function claim. |
| `npm run check:docs` | **PASS** — “Documentation matches the data: 92 rows, 87 approved, 5 held, 0 signed off; 113 source items, 85 traced, 28 gaps (19 partial, 9 out of scope).” |
| A6 package manifest | **PASS** — `shasum -a 256 -c MANIFEST.sha256` reports `OK` for every preserved file. |

## What this does not resolve

- It does not deploy migrations or edge functions to production.
- It does not exercise the portal's in-app TOTP flow; that remains `SC-09`.
- It does not turn the staging check into a real staff reviewer's AAL2 session.
- It does not test live provider delivery, webhooks, the scheduler or retention.
- It does not clear any legal, clinical or product gate.

## Preservation

The A6 report, issue register, cross-pass register and evidence remain untouched so their historical hashes stay valid. This note is additive and is linked from [`AUDIT-INDEX.md`](AUDIT-INDEX.md). A later change to the README status must be recorded in a new dated note rather than by editing this one.
