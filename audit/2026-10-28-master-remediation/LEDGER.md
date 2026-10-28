# Remediation ledger — A5/A6/A7 master list

**Started:** 28 October 2026  
**Baseline:** `main` @ `79e8af4f58ad74914241ef4660f765da105949c9`  
**Input register:** [`../2026-10-28-master-issue-list.md`](../2026-10-28-master-issue-list.md) (21 unique issues)  
**Verification log:** [`evidence/verification.log`](evidence/verification.log) — every command below exited 0 on 28 October 2026.  
**Rule:** `Resolved` requires the root cause fixed in the repository, a regression test or structural check that fails without the fix, matching documentation, and the full local suite green. `Fixed — Pending Verification` means the code and local checks are complete but a hosted, browser or provider behaviour cannot be exercised here. Legal, clinical, product and external-credential items stay blocked.

## Status summary

| Status | Count | IDs |
| --- | ---: | --- |
| Resolved | 12 | MI-06, MI-07, MI-12, MI-13, MI-14, MI-15, MI-16, MI-17, MI-18, MI-19, MI-20, MI-21 |
| Fixed — Pending Verification | 3 | MI-04, MI-08, MI-11 |
| Blocked — Legal | 1 | MI-03 |
| Blocked — Clinical/Product | 1 | MI-02 |
| Blocked — Product | 2 | MI-05, MI-09 |
| Blocked — Operations | 2 | MI-01, MI-10 |

Counts: 21 findings; 12 resolved locally, 3 fixed with a hosted/browser step outstanding, 6 blocked on a named human decision or credential. No blocked item is counted as fixed.

## Ledger

| ID | Sev. | Area | Root cause | Owner | Status | Verification | Remaining risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MI-01 | High | Deployment / provider / retention evidence | No production environment, sender domain, scheduler or retention run exists | Operations | Blocked — Operations | Staging package only | Production RLS, delivery, scheduler and retention remain unproven |
| MI-02 | High | Questionnaire approval | 92 rows and 9 out-of-scope decisions have no named reviewer sign-off | Clinical/Product | Blocked — Clinical | `check:bank` reports 0/92 | Live intake remains locked; a reviewer must sign each row |
| MI-03 | High | Legal / vendor approvals | No counsel opinion, entity confirmation, licensed-state list, retention period or DPAs | Legal | Blocked — Legal | Launch-gate checklist | Cannot lawfully solicit real health data |
| MI-04 | High | Reviewer authentication | Portal checked AAL2 but never enrolled or challenged a factor, so a real reviewer could not reach a case | Engineering | **Fixed — Pending Verification** | `src/features/portal/MfaGate.tsx` enrols/listFactors/challenge/verify/unenroll, renders before `listCases()`; `check:portal` fails without the flow; `check:db` still proves 0 summaries at AAL1 and 1 at AAL2; staging previously verified the hosted AAL boundary | A real staff reviewer has not completed the in-app TOTP flow in a browser; the hosted alpha/beta enrolment UI and factor-removal procedure are untested |
| MI-05 | High | Product / specification | Spec asks for an AI assistant and AI summary; build is deterministic | Product | Blocked — Product | Specification text vs `FEATURES.aiExplainerEnabled` | Owner must amend the spec or approve a model layer |
| MI-06 | Medium | Delivery state | `complete_case_notification` updated unconditionally, so a late completion overwrote `delivered` and could re-queue a duplicate send | Engineering | **Resolved** | `0003` returns early when the current state is `delivered`; `check:db` adds late `accepted`, late `failed`, retained `delivered`, `next_attempt_at is null`, zero-row re-claim and a genuine retry-after-failure case — all pass | None locally; a live provider late-webhook replay remains part of MI-01 |
| MI-07 | Medium | Server authority | Lead and answers were validated in isolation; no identity cross-check or value/prose check | Engineering | **Resolved** | `validateDraft` now rejects a lead DOB/state that contradicts an answered `ID-01`/`ID-03` and a single-choice label/value mismatch; Deno tests cover both identities, the full-name state form, an unanswered row, the mismatch and an invented label (46/46) | Legacy cases may still contain contradictions; they are reviewer-visible, not silently rewritten |
| MI-08 | Medium | Auth abuse | `signInWithOtp` omitted `shouldCreateUser: false`; no `[auth]` block disabled sign-ups | Engineering/Operations | **Fixed — Pending Verification** | `src/lib/api.ts` passes `shouldCreateUser: false`; `supabase/config.toml` sets `enable_signup = false` and `enable_anonymous_sign_ins = false`; `check:portal` fails if either disappears | The hosted project's “allow new users” switch must be confirmed off; local config does not change a linked project |
| MI-09 | Medium | Marketing revocation | Only an operator RPC exists; no customer-facing route | Product/Operations | Blocked — Product | Suppression RPC and table | Blocking only if a channel is enabled |
| MI-10 | Medium | Credential exposure | Chat-pasted staging password; no rotation record | Operations | Blocked — Operations | Staging record §4 | Credential may remain valid |
| MI-11 | Low | Queue usability | Hard `.limit(50)` with no cursor or count | Engineering | **Fixed — Pending Verification** | `listCases` uses a `(submitted_at, reference)` keyset cursor, fetches 26 for a 25-row page, requests `count: "exact"` and returns `nextCursor`/`total`; PortalPage renders “showing N of M” and “Load more cases”; `check:portal` guards each marker | The Supabase/PostgREST keyset query and a >25-row queue have not been exercised against a hosted project |
| MI-12 | Low | Answer completeness | A yes answer with no supplemental detail was indistinguishable from one with detail | Engineering | **Resolved** | `derivedFlags` adds `supplemental-detail-missing` naming the question ids; Deno test asserts the flag for a yes `MED-01` with no detail | Detail remains optional by design; the flag makes absence explicit rather than forcing an answer |
| MI-13 | Low | Consent chronology | Acknowledgement was not required to follow the consents | Engineering | **Resolved** | `validateDraft` rejects an acknowledgement earlier than the latest consent timestamp; Deno test asserts the exact reason | None |
| MI-14 | Low | Review flags | No automated cross-answer inconsistency flags; detection was manual | Engineering | **Resolved** | Deterministic `timeframe-contradiction` flag for `NIC-01→NIC-02→NIC-03`, `DRV-01→DRV-02`, `AVI-01→AVI-02`; two Deno tests (fires on contradiction, silent when consistent). README records that clinical/occupation contradictions stay reviewer-owned and that no income question exists | Clinical and occupation judgement is still human work; the flag is a prompt, not a decision |
| MI-15 | Low | README status | Status row said migrations/functions had never run against a project | Engineering | **Resolved** | README now records the 28 Oct 2026 non-production staging run and the remaining production gaps; `check:docs` requires the new sentence and forbids the old one | Staging evidence is not production evidence |
| MI-16 | Low | Launch-gate claim | “Delivered cannot regress” was false before MI-06 | Engineering | **Resolved** | Gate 8 now names `complete_case_notification` monotonicity and the `check:db` scenarios; `check:docs` requires that name | The claim is locally proven; live delivery is still MI-01 |
| MI-17 | Low | Launch-gate wording | “MFA unverified” implied a feature that did not exist | Engineering | **Resolved** | Gate 7 now describes the in-app TOTP flow, the `check:portal` guard and the precise remaining step (a real staff reviewer); the old sentence is forbidden by `check:docs` | Hosted step-up with a real reviewer remains MI-01/MI-04 residual |
| MI-18 | Medium | Bundle privacy | Held notes were in the public bundle | Engineering | Resolved (carried) | `check:bundle`, engine test | Hosted bundle must be rebuilt on deploy |
| MI-19 | Medium | Queue privacy | Queue selected full payloads | Engineering | Resolved (carried) | `check:db`, `api.ts` view | Hosted client build not inspected |
| MI-20 | Low | Retention copy | Portal claimed a schedule that did not exist | Engineering | Resolved (carried) | `check:docs` | Retention still unapproved |
| MI-21 | Info | Test gap | Deno suite not run in the A6 first pass | Engineering | Resolved (carried) | 46/46 | None |

## Blocked findings — exact human action

### MI-01 — production and live evidence
Required: a dedicated non-production project, sender domain and provider key, cron scheduler, an approved retention run, and a real reviewer. Engineering can deploy only after the owner supplies the project and provider access. Acceptance: hosted migrations, real delivery webhook (including a late completion after `delivered`), a scheduled retry tick, a retention execution log and a real AAL2 queue response.

### MI-02 — questionnaire sign-off
Required: a named underwriting/clinical reviewer accepts each of the 92 rows and each of the 9 out-of-scope reasons, and sets `sourceVerified: true`. Acceptance: `npm run check:bank` reports 92/92 and zero unacknowledged gaps. Engineering must not change these flags.

### MI-03 — legal, entity and vendors
Required: counsel-approved intake/TCPA wording, confirmed legal entity, licensed-state list, retention period, backup expiry, incident procedure and vendor DPAs. Acceptance: a dated approval document referenced from `docs/LAUNCH-GATES.md`. No compliance claim may be made before it exists.

### MI-05 — AI scope
Required: an owner decision. Either amend the specification to describe the deterministic tool, or approve a model layer with a privacy review, provider retention settings, source grounding and cross-case isolation. Engineering must not silently add or remove the requirement.

### MI-09 — marketing revocation
Required: a product decision on whether any call/text channel will operate, and counsel-approved revocation wording. The suppression table and reviewer RPC already exist; a customer-facing route must be added before a channel is enabled.

### MI-10 — staging credential
Required: rotate the Supabase database password exposed in chat, confirm no environment or CI secret reuses it, and record the date and operator. This workspace has no access to the provider console.

## What changed in this pass

- `supabase/migrations/0003_reliability_and_access.sql` — `complete_case_notification` treats `delivered` as terminal.
- `scripts/check-db.mjs` — four late-completion/re-claim assertions.
- `supabase/functions/_shared/case.ts` — identity cross-checks, single-choice prose/value agreement, acknowledgement-ordering guard, supplemental-detail flag, deterministic timeframe-contradiction flag.
- `supabase/functions/tests/fixtures.ts`, `validate-draft_test.ts` — identity-valid fixture defaults plus ten new server-authority tests (46 total, up from 36).
- `src/features/portal/MfaGate.tsx` (new), `useReviewerAuth.ts`, `PortalPage.tsx` — in-app TOTP enrolment/challenge and queue pagination.
- `src/lib/api.ts` — `shouldCreateUser: false`, keyset `listCases` with exact count.
- `supabase/config.toml` — sign-ups and anonymous sign-ins disabled.
- `scripts/check-portal-auth.ts` (new) and `npm run check:portal`, wired into CI.
- `README.md`, `docs/LAUNCH-GATES.md` — status, MFA, delivery and queue claims corrected; `scripts/check-docs.ts` freezes them.

## Verification commands

Run after the fixes, in this order (all passed; see the log for exact output):

```bash
pwd
ls -la
git status
git diff --stat
npm run typecheck
npm run check:bank
npm run check:docs
npm run check:portal
npm run check:server-bank
npm run check:server-policy
npm run test:consent
npm run test:engine
npm run test:validation
npm run check:db
npx --yes deno@2.9.6 test --allow-env --lock=deno.lock supabase/functions/tests/
npm run build
npm run check:bundle
npm audit --audit-level=high
```

## Not closed by this pass

- No production deployment, provider delivery, scheduler tick, retention execution or real reviewer session. MI-01 remains open.
- No browser walkthrough of the new MFA gate or the paginated queue. MI-04 and MI-11 are `Fixed — Pending Verification` for that reason.
- No hosted confirmation that sign-ups are off. MI-08 remains pending that operator check.
- No legal, clinical, product, AI-scope or credential-rotation decision. MI-02, MI-03, MI-05, MI-09 and MI-10 remain blocked on named humans.
- `QUESTIONNAIRE_APPROVED` stays `false`; `check:bank` still reports 0/92 sign-off.
