# SC-02 — revocation idempotency and sender policy

**Date:** 28 October 2026\
**Finding:** `SC-02` — Medium, conditional marketing-revocation gap (A6)\
**Cross-pass IDs:** `MI-09`, `A7-09`\
**Status:** **Partially remediated — local implementation only; `SC-02` remains open**\
**Repository baseline:** `main` @ `20e0eff`\
**Related plan:** [`2026-10-28-sc-01-sc-05-remediation-plan.md` §5](2026-10-28-sc-01-sc-05-remediation-plan.md#5-sc-02--customer-marketing-revocation-and-suppression-propagation)

> Marketing calls and texts remain disabled. This note records two engineering controls, not a channel approval, a legal opinion, a vendor integration or live evidence.

## 1. What changed

### Idempotent customer revocation

- [`src/pages/MarketingOptOutPage.tsx`](../src/pages/MarketingOptOutPage.tsx) keeps an idempotency key for the current form attempt. A retry after a network error reuses it; editing a field starts a new attempt.
- [`src/lib/marketing.ts`](../src/lib/marketing.ts) sends the key as `Idempotency-Key`.
- [`revoke-marketing/index.ts`](../supabase/functions/revoke-marketing/index.ts) hashes the key to a stable UUID, rejects a malformed key, and permits the header in the CORS preflight. A missing header falls back to a stable body-derived key for older cached clients.
- [`0008_marketing_revocation_idempotency.sql`](../supabase/migrations/0008_marketing_revocation_idempotency.sql) treats an existing request id, suppression and outbox row as a replay. It does not update the suppression, so the trigger cannot reset a synced outbox row to `pending`. A new request id can still re-queue propagation.

A related pre-existing header omission was fixed in [`submit-case/index.ts`](../supabase/functions/submit-case/index.ts): its preflight now allows `Idempotency-Key`, which the browser already sends. Without that header the live cross-origin intake request would fail before reaching the handler. It is an intake reliability fix, not a new SC-02 control.

### State and local-time sender policy

- [`marketing-policy.ts`](../supabase/functions/_shared/marketing-policy.ts) covers all 50 states and DC with IANA zones. It requires the stored case's state to be in `MARKETING_LICENSED_STATES` and, for phone, requires every time zone of that state to be inside `[MARKETING_CALLING_START_HOUR, MARKETING_CALLING_END_HOUR)`. The defaults are `08:00`–`21:00`; the licensed list is empty, so every send is refused.
- [`marketing-sender.ts`](../supabase/functions/_shared/marketing-sender.ts) is the only pre-send path. It evaluates the policy, then calls `assert_marketing_send_allowed`, and only then invokes the injected provider callback. A denied policy or guard never reaches `deliver`. The wrapper trusts the `state` argument; a caller must read it from the stored case, not from the browser.
- Email requires an approved state and the suppression guard but has no telephone calling window.
- Multi-zone states are conservative: a contact is refused if any zone in the state is outside the window. A future counsel-approved matrix can replace this state-level approximation with a contact-level source.

No channel flag was changed. No provider adapter, key or vendor endpoint was added.

## 2. Verification

| Check | Result |
| --- | --- |
| `npm run check:db` | **PASS** — 0 failures, including same-key replay retains one audit row and a synced outbox row; a new key re-queues propagation. |
| Deno function suite | **PASS** — 85/85, including 15 policy tests, 6 sender-order/denial tests, 14 revoke-endpoint tests and the intake idempotency preflight. |
| `npm run check:marketing` | **PASS** — 51 jurisdictions, valid zones, empty-list fail-closed default, 08:00/21:00 boundaries, multi-zone refusal, stable idempotency key, policy and DB guard before `deliver`. |
| `npm run typecheck` | **PASS**. |
| `npm run build` | **PASS** — production build. |
| `npm run check:bundle` | **PASS** — no held source wording in the public bundle. |
| `npm run check:docs` | **PASS** — 92 rows, 87 approved, 5 held, 0 signed off; 113 source items, 85 traced, 28 gaps. |
| `git diff --check` | **PASS**. |

Raw command output is held in the session transcript and was not copied into this note. The database test uses the isolated PGlite replay, not the hosted staging project.

## 3. What this does not prove

- Migrations `0007` and `0008` are **not applied** to staging or production. The hosted schema, grants and replay behaviour are therefore unverified.
- `MARKETING_LICENSED_STATES` has no approved value. The empty default correctly refuses every send, but no state matrix has been approved.
- No provider adapter, dialer, SMS sender or CRM endpoint exists. There is no live send to test.
- No STOP/email/voicemail withdrawal intake or vendor worker run has been tested.
- No counsel approval exists for the seller, disclosure, calling window, state matrix or revocation wording.
- The state-level time-zone approximation is conservative, not a legal determination.

`SC-02` remains **Open**. A dated “no channel operated” decision or the full pre-enable acceptance suite is still required; this note does not close the finding.
