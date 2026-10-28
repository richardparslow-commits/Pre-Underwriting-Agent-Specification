# Qwencloud re-audit — Life Policy Pilot Pre-Underwriting Agent

**Audit date:** 28 October 2026  
**Repository:** `richardparslow-commits`  
**Baseline:** `main` @ `b51ebf9f50040e4a938912012040201a59557eb4`  
**Working tree at audit:** two uncommitted audit documents (`audit/2026-10-28-deployment-rehearsal.md` and `audit/AUDIT-INDEX.md`); no application-code changes  
**Audit type:** static re-audit against the Qwencloud audit prompt, plus a fresh production build, bundle scan and full local verification suite  
**Verdict:** **NOT READY to accept real customer health information.**

This pass does not implement fixes. It identifies what the current repository actually proves, what it overclaims, and what remains blocked by human, legal, provider or hosted-environment action.

---

## 1. Executive summary

The local engineering suite is green, but the repository still has **two unresolved privacy/access findings and one unresolved documentation/UX finding**:

| ID | Severity | Finding | Status |
|---|---|---|---|
| **QW2-01** | Medium | All five held-row `reviewNote` strings are shipped in the public JavaScript bundle; `check:bundle` does not test them. This reopens the privacy control tracked as **M-11**. | **Open — reopened M-11** |
| **QW2-02** | Medium | The reviewer case queue downloads the full health payload for up to 50 cases (`select(... payload ...)`) and never records an `opened` access entry, bypassing the per-case access log. | **Open — new** |
| **QW2-03** | Low | The portal says “Retention and deletion follow the documented schedule,” while no retention period or schedule is approved or active. | **Open — new** |

The prior 30-finding ledger is otherwise unchanged: **21 resolved locally**, **4 fixed pending live verification**, **4 blocked** by legal/product/operations, and **1 reopened** by QW2-01. With the two new findings, the current unique count is **32** (30 prior + QW2-02 + QW2-03), because QW2-01 is the reopened M-11 rather than a separate root cause.

The most important verification result is a **false negative**, not a failure: `npm run check:bundle` passes while the bundle contains every held-row review note. A passing check cannot be used as evidence for M-11 until the check is extended.

The launch blockers remain:

1. **M-03 / MC-01** — 0/92 rows source-verified; seven source lookback windows replaced; 28 recorded gaps; live intake stays locked until `QUESTIONNAIRE_APPROVED=true`.
2. **M-02 / MC-10** — no counsel approval of the privacy notice, intake permission, TCPA disclosure, e-signature flow or sensitive-question handling.
3. **M-14 / MC-08** — no approved retention period, backup expiry statement or executed incident/retention procedure.
4. **M-12** — no customer STOP/withdrawal path or vendor suppression; marketing must stay disabled.
5. **M-09 / M-13 / M-17 / M-18** — no clean hosted deployment, live MFA step-up, provider acceptance, signed webhook delivery or scheduler tick.

---

## 2. Scope and method

### In scope

- Current `main` at `b51ebf9`.
- The product specification and the audit prompt supplied by the owner.
- `README.md`, `docs/LAUNCH-GATES.md`, `docs/OPERATIONS.md`, `docs/question-bank-reconciliation.md`, `LOVABLE.md`.
- `src/features/interview/*`, `src/features/consent/*`, `src/features/intake/*`, `src/features/portal/*`, `src/lib/api.ts`, `src/integrations/supabase/client.ts`.
- `supabase/migrations/*`, `supabase/functions/*`, `supabase/ops/*`, `scripts/*`.
- The production build output in `dist/assets/`.

### Method

1. Re-read every held row in the public bank and every review note.
2. Built the production bundle and searched the emitted JavaScript for withheld source wording, reconciliation flags and held-row review notes.
3. Inspected the reviewer queue and detail paths in `src/lib/api.ts`, including Supabase select lists and the `record_case_review` call.
4. Compared portal copy with the operations runbook and launch gates.
5. Re-ran the complete local verification suite, including two migration replays, 36 Deno tests, consent/engine/validation tests, bundle check, documentation check and dependency audit.
6. Recorded exact file/line evidence and raw command output in this package.

### Out of scope / not performed

- No hosted deployment.
- No migration against the supplied Supabase project.
- A read-only anonymous probe was attempted with the publishable key only; the project host did not resolve, so it produced no live RLS evidence. No database password was used.
- No live MFA enrolment or step-up.
- No email provider send, inbox check or signed webhook delivery.
- No scheduler tick or retention job execution.
- No legal, clinical, HIPAA, TCPA or Texas Insurance Code approval.
- No browser walkthrough this pass; the prior manual script remains unexecuted.

---

## 3. Verification results

All commands below were run in this workspace on 28 October 2026. Raw output is in [`evidence/verification.log`](evidence/verification.log).

| Command | Result | Notes |
|---|---|---|
| `npm run typecheck` | **PASS** | `tsc --noEmit` |
| `npm run check:bank` | **PASS** | 92 rows; 87 approved; 5 held; 14 branching; 0 signed off; 113 source questions; 85 traced; 28 gaps; 29 flagged reconciliation records |
| `npm run check:docs` | **PASS** | Recomputed counts match; the new QW2-01/QW2-03 claims are outside its coverage |
| `npm run check:server-bank` | **PASS** | Server bank matches the client bank, 92 rows |
| `npm run check:server-policy` | **PASS** | Server consent policy matches client wording |
| `npm run test:consent` | **PASS** | 7/7 |
| `npm run test:engine` | **PASS** | 7/7 |
| `npm run test:validation` | **PASS** | 5/5 |
| `npx --yes deno@2.9.6 test --allow-env --lock=deno.lock supabase/functions/tests/` | **PASS** | 36/36 |
| `npm run check:db` | **PASS** | Migrations 0001–0004 replayed twice with 0 failures; RLS/AAL2/immutability/lease/webhook/retention checks pass |
| `npm run build` | **PASS** | 1,655 modules; 616.80 kB JS (171.21 kB gzip); chunk-size warning only |
| `npm run check:bundle` | **PASS (false negative)** | Says 5 withheld source items and 5 held reconciliation records are absent; it never probes `reviewNote` |
| `npm run report:reconciliation` | **PASS** | Deterministic; `RECONCILIATION_STABLE` |
| `npm audit --audit-level=high` | **PASS** | 0 vulnerabilities |
| `git diff --check` | **PASS** | No whitespace errors |
| Hosted anon probe (`/auth/v1/health`, `/rest/v1/cases`, `/rest/v1/app_settings`) | **BLOCKED** | `curl: (6) Could not resolve host`; no live RLS evidence |

**Important:** the green suite does not prove launch readiness. It proves the checked code paths still behave as their tests expect; it does not cover the held-note bundle leak, the queue payload exposure or the retention copy.

The hosted probe is **not a pass**. DNS did not resolve for the project host, so the anonymous RLS check never ran. The project may be paused or still provisioning; resolve the API URL or resume the project before retrying. No database password was used.

---

## 4. Findings

### QW2-01 — Held-row review notes are in the public bundle; the bundle guard does not test them

**Severity:** Medium  
**Classification:** Privacy defect / question-bank integrity / build-tooling gap  
**Relationship:** Reopens **M-11**  
**Owner:** Engineering (with legal/clinical input on the held topics)  
**Status:** **Open — not resolved**

#### Evidence

All five held rows carry reviewer notes in the **public** question bank:

| Row | Evidence | Note exposure |
|---|---|---|
| `ID-04` | `src/features/interview/questionBank.ts:186-187` | “Collection of sex/gender needs jurisdiction and carrier review…” |
| `MED-11` | `src/features/interview/questionBank.ts:607-608` | “Requires documented legal, clinical and underwriting review…” |
| `MH-06` | `src/features/interview/questionBank.ts:764-765` | “Detail-level suicide questions need clinical and legal review…” |
| `RES-04` | `src/features/interview/questionBank.ts:1746-1747` | “Immigration-status detail is sensitive…” |
| `RES-05` | `src/features/interview/questionBank.ts:1759-1760` | “Identity-document numbers are not collected…” |

The production bundle contains every one of those strings. The probe reads `dist/assets/index-l3vRgGxf.js` and reports `reviewNote prefix in bundle: YES` for all five rows. Representative context:

```text
...customerText:`Held for review: a sensitive mental-health detail requiring clinical
approval.`,reviewNote:`Detail-level suicide questions need clinical and legal review
for wording, necessity and crisis support before automated collection. The approved
screening question and current-safety question cover the immediate need.`,sensitive:!0...
```

`src/features/interview/engine.ts:295` also copies `reviewNote: question.reviewNote` into `toSubmittedAnswers`, so the note is part of the client-side submission shape as well as the bank.

The guard only checks three things:

- held source wording (`sourceInventory.ts`),
- reconciliation flag detail,
- reconciliation action.

`scripts/check-bundle.ts:62-72` has no `reviewNote` probe; `grep -n 'reviewNote' scripts/check-bundle.ts` returns no match. The guard therefore prints:

```text
Bundle check passed: 1 JavaScript asset(s); 5 withheld source items and
5 held reconciliation records are absent.
```

That statement is true only for the categories it checks. It creates false assurance for the broader claim in `docs/LAUNCH-GATES.md:19` that “source wording and reviewer reconciliation detail are build/audit-only.”

#### Root cause

M-11 moved verbatim source text and reconciliation flags out of the client bank, but left the per-question `reviewNote` on the same public `Question` objects. The bundle guard was extended for the moved fields, not for `reviewNote`. The type comment at `src/features/interview/types.ts:119-120` requires the note for held rows but does not state that it must be server-only, so the invariant was not encoded.

#### Impact

Anyone who downloads the public JavaScript can read the reviewer rationale for the five held topics, including sex/gender, suicide-attempt detail, immigration status and identity-document handling. No customer health **answers** are exposed, and the notes do not contain a customer record. The exposure is still sensitive: it reveals which topics are held, why, and what legal/clinical review is pending. It also contradicts the product’s held-question and public-bank design.

#### Required remediation (not implemented in this audit pass)

1. Remove `reviewNote` from the client `Question` type and from every public bank row, **or** split it into a server-only type/module that is never imported by a browser entry point.
2. Remove `reviewNote` from `toSubmittedAnswers`; the server can attach it from its canonical bank when building the reviewer payload.
3. Update the server bank generator so the reviewer note lives only in the server-owned bank. Keep the client bank limited to the generic held label, locator and review status.
4. Extend `scripts/check-bundle.ts` to probe every held row’s `reviewNote` (and, defensively, every `reviewNote` in the public bank). The check must fail on the current tree before the fix and pass only after the note is absent.
5. Add a structural assertion that the public bank has no `reviewNote` field, so a future row cannot reintroduce one.
6. Correct `docs/LAUNCH-GATES.md` gate 9 and any README claim that reviewer detail is build/audit-only.

#### Verification required to close

- `npm run build && npm run check:bundle` fails with a specific held-row note failure **before** the fix.
- After the fix, the same commands pass and a direct `grep` of `dist/assets/*.js` finds none of the five note prefixes.
- `npm run check:bank`, `npm run check:server-bank`, the portal build and the reviewer detail view still work.
- Documentation check passes with the corrected claim.

#### Residual risk

Until the fix lands, the public bundle exposes reviewer rationale for held topics. No real customer data is in the bundle, so this is not a customer-record breach, but it is a privacy and question-bank-integrity defect.

---

### QW2-02 — The reviewer queue downloads full health payloads for 50 cases and bypasses the access log

**Severity:** Medium  
**Classification:** Privacy defect / least-privilege defect / access-audit gap  
**Relationship:** New; adjacent to M-23 (case-open audit) and gate 7  
**Owner:** Engineering  
**Status:** **Open — not resolved**

#### Evidence

`src/lib/api.ts:398-404` selects `payload` for the queue:

```ts
const { data, error } = await supabase
  .from("cases")
  .select(
    "id, reference, submitted_at, status, payload, notification_state, notification_attempts, notification_detail, notification_updated_at, crisis_disclosure",
  )
  .order("submitted_at", { ascending: false })
  .limit(50);
```

`src/lib/api.ts:408-420` immediately passes each row through `fromRow`, which parses `payload` into the full `CaseRecord`, including every answer and detail:

```ts
return (data as CaseRow[]).map((row) => {
  const record = fromRow(row);
  return {
    reference: record.reference,
    ...
    unanswered: record.answers.filter((answer) => answer.disposition === "unresolved").length,
  };
});
```

The queue therefore transfers all health answers for up to 50 cases to the reviewer’s browser even though the rendered list needs only reference, dates, status, notification state, crisis flag, name, state and an unanswered count.

`getCase` separately records the access event at `src/lib/api.ts:445-455`:

```ts
const { error: accessLogError } = await supabase.rpc("record_case_review", {
  p_reference: reference,
  p_action: "opened",
  p_note: null,
});
```

`listCases` has no equivalent. `docs/LAUNCH-GATES.md:17` says “loading a case writes one deduplicated `opened` entry.” Opening the queue is a load of every case payload but writes no entry, so the access log is incomplete for bulk review access.

#### Root cause

The queue reuses the same `CaseRow`/`fromRow` model as the detail view and computes `unanswered` in the browser. There is no summary projection or server-side count, so the full payload is fetched as a side effect of rendering a list.

#### Impact

- A reviewer with legitimate access receives all health answers in one request, not only the cases they open.
- Any script running in the portal origin, a malicious browser extension, or a future XSS defect can read the queue response and obtain up to 50 full case payloads at once.
- The `opened` audit is not a complete record of health-data access: bulk queue access is invisible.
- The behavior conflicts with data minimisation and with the portal’s own access-audit claim.

This is not a cross-account authorization break: RLS still limits the rows to an AAL2 reviewer. It is a least-privilege and audit defect.

#### Required remediation (not implemented in this audit pass)

1. Add a server-side summary view or RPC that returns only the fields the queue renders: `reference`, `submitted_at`, `status`, `notification_state`, `notification_attempts`, `crisis_disclosure`, lead first/last name, residence state and an `unanswered` count computed in SQL.
2. Change `listCases` to call that view/RPC and stop selecting `payload`.
3. Keep `getCase` as the only path that fetches the full payload, and keep its `opened` RPC.
4. If the queue itself is considered an access event, record a separate, non-per-case `queue_viewed` event; do not fabricate per-case `opened` entries for cases the reviewer did not open.
5. Add a database/structural test proving the queue projection contains no answer values and that the detail path still records `opened`.
6. Update the gate 7 wording so “loading a case” distinguishes list metadata from the full case detail.

#### Verification required to close

- Inspect the network response for `/rest/v1/...` (or the RPC) and confirm no `answers`, `answerValues`, `detail`, or health answer fields are present.
- Confirm the queue still renders name, state, status, notification state, crisis flag and unanswered count.
- Confirm `getCase` still records exactly one deduplicated `opened` entry.
- Add a regression that fails if `listCases` selects `payload` again.

#### Residual risk

Until fixed, the queue is a bulk health-data read without a corresponding access entry. The production deployment has not been tested; this finding is from the current source and is independent of hosting.

---

### QW2-03 — Portal claims a retention schedule that does not exist

**Severity:** Low  
**Classification:** Documentation/UX defect / operational honesty  
**Relationship:** New; adjacent to M-14 and gate 9  
**Owner:** Engineering + Operations  
**Status:** **Open — not resolved**

#### Evidence

`src/features/portal/CaseReview.tsx:623-625` renders:

```tsx
<span className="text-muted-foreground">
  Retention and deletion follow the documented schedule.
</span>
```

`docs/OPERATIONS.md:10-13` says the opposite:

- automatic expiry returns 0 while `app_settings.retention_months` is null;
- approved retention period is **BLOCKED — LEGAL**;
- scheduled execution is **BLOCKED — OPERATIONS**;
- no cron job is committed until counsel approves a period.

`docs/LAUNCH-GATES.md:19` also says the schedule is null pending counsel.

#### Root cause

The footer copy was written as a general assurance before the retention period existed. There is no check that portal copy matches `app_settings.retention_months`, and the copy is not conditional on an approved schedule.

#### Impact

A reviewer may believe cases are being deleted on a schedule when no deletion job is active. That is a misleading operational claim in a portal that handles health data. It does not by itself expose data, but it undermines the honesty of the retention control and could cause a reviewer to rely on a deletion that will not happen.

#### Required remediation (not implemented in this audit pass)

1. Replace the sentence with an explicit honest state, for example: “Retention schedule is not active. Deletion is manual until counsel approves a retention period.”
2. If the portal can read an approved `retention_months` value, render the schedule only when it is non-null and approved; otherwise render the blocked state.
3. Add a documentation/UI check that fails if the portal claims an active schedule while `retention_months` is null.
4. Keep `docs/OPERATIONS.md` as the source of truth and link reviewers to it.

#### Verification required to close

- Static text check shows the old unconditional sentence is gone.
- A test or check proves the blocked copy appears when no period is approved.
- When a period is approved in a test fixture, the approved copy appears and the old claim is not used.
- Manual portal check with the sample case shows the honest state.

#### Residual risk

This is a low-severity honesty defect. It becomes more significant if reviewers are told to rely on automatic deletion before the legal/operations gate closes.

---

## 5. Prior-finding status after this pass

The 30-finding master list and QwenCode ledger remain the source of truth for M-01–M-30. This pass changes one status and adds two findings.

| Status | Count | Findings |
|---|---:|---|
| Resolved locally | 21 | M-01, M-04–M-08, M-10, M-15, M-16, M-19–M-30 (M-11 removed) |
| Reopened by this audit | 1 | **M-11** (QW2-01) |
| Open — new | 2 | **QW2-02**, **QW2-03** |
| Fixed — pending live verification | 4 | M-09, M-13, M-17, M-18 |
| Blocked — legal/product/operations | 4 | M-02, M-03, M-12, M-14 |

**M-20 note:** M-20 remains resolved for stale counts, but its automated check does not cover the gate 9 overclaim in QW2-01 or the portal retention claim in QW2-03. Do not treat “M-20 resolved” as proof that all documentation claims are accurate.

### Hard blockers unchanged

| ID | Blocker | Evidence |
|---|---|---|
| M-02 | Counsel approval of exact consent, privacy and TCPA wording | Server policy matches its own wording, but no legal sign-off is in the repo |
| M-03 | 0/92 source-verified; 7 windows replaced; 28 gaps | `check:bank` output; 87 approved, 5 held, 0 signed |
| M-12 | No customer STOP/withdrawal and no vendor suppression | Marketing disabled; reviewer RPC only |
| M-14 | No approved retention period, backup expiry or incident execution | `retention_months` null; schedule blocked |
| M-09 / M-13 / M-17 / M-18 | No hosted deployment, MFA step-up, provider delivery or cron tick | No hosted evidence; rehearsal blocked |

### Live-evidence gaps unchanged

- No clean deployment of migrations 0001–0004 to a hosted project.
- No hosted RLS/grant inspection.
- No reviewer MFA enrolment or `aal1 → aal2` step-up.
- No Resend/provider acceptance, signed webhook delivery or inbox test.
- No scheduler tick or real `not_sent` recovery.
- No backup/PITR inspection, restore drill or incident execution.
- No prompt-injection/recipient-tampering review against the deployed project.
- No labelled non-customer end-to-end run with deletion of the test case.

---

## 6. Launch-gate assessment

| # | Gate | Assessment | Reason |
|---|---|---|---|
| 1 | Question coverage | **Partly** | All 113 source questions inventoried; 85 traced; 28 gaps (19 partial, 9 out of scope); 29 reconciliation flags; 0/92 signed off; 7 windows replaced |
| 2 | Branch coverage | **Partly** | 14 branches and nested pruning are tested; 7 rows replace a source window; MH-05 is asked of everyone |
| 3 | Answer integrity | **Implemented** | Distinct yes/no/unknown/declined; unresolved disposition; server rebuild; held/not-asked content stripped; no blank-as-No |
| 4 | Review and submission | **Implemented** | Corrections clear acknowledgements; server requires one current acknowledgement; no send without explicit action |
| 5 | Consent separation | **Partly** | Marketing off by default; server compares wording/versions; no customer revocation flow or vendor propagation; counsel approval absent |
| 6 | Recipient control | **Implemented** | Recipient and subject are server constants; browser sends no recipient |
| 7 | Secure access | **Partly** | AAL2 policy and RPC-only writes are locally proven; **QW2-02** shows bulk queue payload access without an `opened` entry; live MFA/grants unverified |
| 8 | Delivery reliability | **Partly** | Idempotency, lease, provider key, Svix dedupe and monotonic state are locally tested; no live provider, webhook or scheduler |
| 9 | Leak prevention | **Partly — regression** | Held source wording and reconciliation flags are absent, but **QW2-01** shows all held review notes in the bundle; the guard does not test them; provider logs/backups unreviewed |
| 10 | Human review | **Implemented** | No eligibility/rate/carrier action; review RPC records actor and time; corrections are append-only |

**Overall:** the local controls are substantially stronger than the launch gates imply, but the three findings above are exactly the kind of “green check, wrong claim” defects the audit prompt asks to catch. Gate 9 cannot be called implemented while held notes are public.

---

## 7. Specification coverage notes

### Implemented and locally proven

- Introduction, lead form, permission step, questionnaire, conditional follow-ups, review and correction, affirmative submission, secure storage, notification and human review exist.
- No fake login: the portal uses a real Supabase session and refuses an AAL1 reviewer.
- No persistent preview mode: preview mode is labelled and uses sample data.
- No blank-as-No: `unresolved` is distinct from `no`.
- No held question is asked: `ACTIVE_QUESTIONS` excludes held rows; the server rejects held rows presented as answered.
- No invented medical facts: the server rebuilds every row from the canonical bank and derives crisis from MH-05.
- No health data in URLs: the portal uses case references, not answer content.
- No customer email body with health data: email tests assert reference and portal link only.
- No marketing without an enabled channel and a configured legal entity: server and client tests cover this.

### Not proven

- The source questionnaire is not approved: 0/92 rows have `sourceVerified: true`; the 28 gaps need named decisions; seven windows need restoration or explicit approval.
- The exact legal entity, marketing channels, sender domain and recipient mailbox are not configured.
- The retention period, backup expiry and incident procedure are not approved.
- The hosted deployment, MFA, provider delivery, webhook recovery and scheduler have not been exercised.
- A real end-to-end test with labelled non-customer data has not been run and cleaned up.

---

## 8. Credential and hosted-project handling

A Supabase project name, database password and publishable API key were supplied in chat during this pass. Handling:

- **No database password was written to the repository, a log, a command argument or an environment file.** It should be treated as exposed and **rotated now**, because it was pasted into a chat transcript.
- **No migration was attempted against the supplied project.** A single read-only anonymous probe was attempted with the publishable key only. The API host `mndgqpoxfupiuqljopoe.supabase.co` did not resolve (`curl: (6) Could not resolve host`), so no live RLS result exists. The screenshot also shows the project on `main` labelled **PRODUCTION**, not a non-production rehearsal target.
- The publishable key is designed to be public and is not a service-role key. It was not used for writes and was not committed.
- The earlier rehearsal report remains accurate: the hosted rehearsal is **blocked before deployment** because no safe non-production target, Supabase access token, Docker runtime or Resend test key is available in this workspace.
- To unblock safely: create a separate staging Supabase project, keep the database password out of chat, provide a management token through a local secret file or the user’s terminal session, and run migrations/functions against staging only. Then verify MFA, rate limiting, provider delivery and webhook recovery with labelled test data, and delete the test case.

---

## 9. Recommended remediation order

1. **QW2-01 (before any public preview or customer exposure).** Remove held review notes from the client graph and extend the bundle guard. This is a small, high-confidence fix with a red/green test.
2. **QW2-02 (before a reviewer uses the portal with real cases).** Replace the queue’s full-payload select with a server-side summary projection; keep full payload access on the individual case path and its `opened` log.
3. **QW2-03 (before reviewer training).** Replace the retention claim with the actual blocked state.
4. **M-03 / MC-01.** Complete the 92-row reconciliation, restore or approve the seven windows, decide the 28 gaps, bump the questionnaire version, and only then enable live intake.
5. **M-02 / MC-10.** Obtain counsel approval of the entity, privacy notice, intake permission, TCPA disclosure and sensitive-question handling.
6. **M-14 / MC-08.** Approve a retention period, document backup expiry and execute an incident/retention drill.
7. **M-12.** Implement and test the customer STOP/withdrawal path and vendor suppression before enabling any marketing channel.
8. **M-09 / M-13 / M-17 / M-18.** Run the staging rehearsal and record hosted evidence; do not use production for the first migration or MFA test.

---

## 10. Evidence map

| Evidence | Path |
|---|---|
| This report | [`REPORT.md`](REPORT.md) |
| Package summary | [`README.md`](README.md) |
| Full local verification output | [`evidence/verification.log`](evidence/verification.log) |
| Held review-note bundle probe | [`evidence/held-review-notes.log`](evidence/held-review-notes.log) |
| Queue, access-log and retention evidence | [`evidence/queue-and-retention.log`](evidence/queue-and-retention.log) |
| Check-bundle coverage proof | [`evidence/check-bundle-coverage.log`](evidence/check-bundle-coverage.log) |
| Hosted anonymous probe (failed DNS) | [`evidence/hosted-anon-probe.log`](evidence/hosted-anon-probe.log) |
| Hash manifest | [`MANIFEST.sha256`](MANIFEST.sha256) |

### Key source references

- `src/features/interview/questionBank.ts:186-187, 607-608, 764-765, 1746-1747, 1759-1760` — held review notes.
- `src/features/interview/engine.ts:295` — review note copied into submitted answers.
- `scripts/check-bundle.ts:62-72` — probes source text, flags and action only; no `reviewNote`.
- `src/lib/api.ts:398-420` — queue selects `payload` and parses every case.
- `src/lib/api.ts:445-455` — detail path records `opened`.
- `src/features/portal/CaseReview.tsx:623-625` — retention claim.
- `docs/OPERATIONS.md:10-13` — retention and schedule blocked.
- `docs/LAUNCH-GATES.md:17` — “loading a case writes one `opened` entry.”
- `docs/LAUNCH-GATES.md:19` — “reviewer reconciliation detail … build/audit-only.”

---

## 11. Audit conclusion

**Local verdict:** the repository is suitable only for a labelled, non-customer preview. The core interview, consent separation, server rebuild, idempotency and delivery-state controls are well tested locally.

**Launch verdict:** **not ready.** Three findings must close before the relevant surface is trustworthy: the held-note bundle leak, the bulk queue payload exposure and the retention overclaim. The legal, clinical, retention and hosted-evidence gates remain open and cannot be closed by engineering alone.

**No finding in this report is marked resolved.** QW2-01 reopens M-11; QW2-02 and QW2-03 are new open findings.
