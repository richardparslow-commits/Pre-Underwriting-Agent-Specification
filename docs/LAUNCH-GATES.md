# Launch gates

The specification defines ten production acceptance tests. This document records
what the code implements, how it was checked, and what remains before real
customer submissions can be accepted.

Legend: **Implemented** · **Partly** · **Not started** · **Blocked**

| # | Gate | Status | Evidence / remaining work |
| --- | --- | --- | --- |
| 1 | **Question coverage** — every PDF question reconciled against the approved bank; sensitive restrictions documented | **Partly** | The PDF is in the repo (`source/`, 7 pages) and all 113 source questions are inventoried verbatim in `sourceInventory.ts`. Every bank row has a reconciliation record. Nicotine, criminal history, medical history, alcohol and drug use, aviation and driving were rebuilt as one question per source window (`NIC-01`–`NIC-04`, `CRM-01`–`CRM-07`, `MED-01`–`MED-19`, `ALC-01`–`ALC-06`, `DRG-01`–`DRG-07`, `AVI-01`–`AVI-04`, `DRV-01`–`DRV-05`): 55 rows match their source and 3 are confirmed compound splits. 29 rows still carry flags, 2 were misattributed as source questions (now supplemental), and 5 are held. 85 source questions are traced to a row; **28 recorded gaps remain (19 partly collected, 9 recorded out of scope with a written reason)**; none is waiting on a new question, and none is unacknowledged — `npm run check:bank` enforces that. **Remaining:** a named reviewer must close each row's decision in [question-bank-reconciliation.md](question-bank-reconciliation.md) and set `sourceVerified: true` (currently 0/92). |
| 2 | **Branch coverage** — applicable follow-ups asked, irrelevant ones skipped, distinct timeframes preserved | **Partly** | Declarative `askWhen` branches; validated by `npm run check:bank` (14 branches). Nicotine asks 3 windows, with the last-use date only after a No or unsure 12-month answer; criminal history asks all 7 source windows; medical history one per window (12 months, 2, 3, 5, 7 and 10 years); alcohol asks its 5 source windows, drug use its 7 source questions, aviation the separate 12-month and 24-month questions (the latter including contemplated flights and student pilots), driving its 24-month, 5-year and ever questions; the added gap-filling rows branch only where the source does. **Partly met:** 7 rows replace a single source window with a different one. The current-crisis question (MH-05) is asked of every customer, whatever the answer to MH-04. |
| 3 | **Answer integrity** — blanks/uncertainty/refusal never saved as No; no invented medical facts | **Implemented** | Distinct `yes/no/unknown/declined` states; `unresolved` disposition; review and portal display “Not answered”; deterministic summary only restates recorded answers. The server rebuilds every row from its canonical bank, strips detail from `not_asked`/held rows, and derives the current-crisis flag from MH-05. `not_applicable` is not offered and is rejected server-side. |
| 4 | **Review and submission** — corrections possible; edits invalidate review confirmation; no send without explicit action | **Implemented** | Any answer edit clears acknowledgements. Submission disabled until the acknowledgment is ticked, then requires “Submit for Richard’s Review”. The server requires exactly one acknowledgement with the current text/version and a timestamp inside the session; a stale or forged acknowledgement is rejected. |
| 5 | **Consent separation** — marketing off by default and independent of submission | **Partly** | Two required consent records with their own wording version/timestamp; marketing records exist only for channels enabled in config; marketing checkboxes are disabled without a phone. The privacy acknowledgement is enforced twice: the lead form blocks continuation without it, and `submit-case` rejects a draft whose consent records omit or decline either required permission. `supabase/functions/tests/submit-case_test.ts` drives the real handler and asserts HTTP 422 for a missing or declined intake permission and a missing or declined privacy acknowledgement; CI runs it with Deno 2. `src/features/consent/marketingConsent.test.ts` builds consent evidence from explicit config and asserts that a marketing record exists only for an enabled channel, that each enabled channel appears once, and that a blank or bracketed placeholder seller produces no marketing record or disclosure; CI runs it with Node's test runner. The TCPA disclosure and checkboxes are hidden unless `VITE_LEGAL_ENTITY` and at least one channel flag are set, so no placeholder seller is shown. The server now compares both required records with its own generated wording and versions, rejects any marketing record while no channel is enabled, and rejects duplicate, future-dated or unknown consent records. A reviewer can record a phone or email revocation through `record_marketing_revocation`, which writes an audited suppression and exposes `is_contact_suppressed` for any future outbound path. **Not started:** a customer-facing revocation flow after submission and propagation of STOP/withdrawal to a CRM, dialer or SMS vendor; those only become live risks once a channel is enabled. |
| 6 | **Recipient control** — prompt injection or client changes cannot alter the recipient | **Implemented** | Recipient and subject are server constants in `_shared/email.ts`; the browser sends no recipient. Client cannot read another case: RLS + reviewer allowlist. Injection testing belongs to the next security review. |
| 7 | **Secure access** — forwarded email grants nothing | **Implemented** | Portal requires a Supabase session, reviewer row and AAL2 session; preview mode is explicitly labelled and holds no real data. `is_reviewer()` and every reviewer policy require `aal2`, the portal refuses an aal1 session, and loading a case writes one deduplicated `opened` entry. Live MFA enrolment and step-up remain unverified (E-04). |
| 8 | **Delivery reliability** — store failure, notification failure, retries, duplicate prevention, honest wording | **Partly** | One idempotency key creates at most one case; a retry returns the original receipt. The row is claimed with a lease before sending, the provider idempotency key is the case reference, and `not_sent` is retried once a provider is configured. Delivery events are Svix-verified, deduplicated by event id and monotonic; a delivered case cannot regress. Confirmation copy distinguishes saved-but-not-sent from queued. **Not run against a live provider, scheduler or inbox.** |
| 9 | **Leak prevention** — no health data in analytics, logs, URLs, email bodies, error reports | **Partly** | No analytics/pixels/session replay; answers never in URL or browser storage; server logs exclude payloads; email is minimal. Held source wording is no longer rendered to customers. Audited deletion and an opt-in retention job exist, but the schedule is null pending counsel. **Remaining:** review hosting/provider logs, error reporting, provider retention settings, backups and the residual held wording in the public bank bundle. |
| 10 | **Human review** — consequential actions behind authorised human approval | **Implemented** | No eligibility, rate or carrier action exists. Portal records `marked_reviewed` / `requested_clarification` with actor and timestamp. A post-submission correction is append-only in `case_corrections`, stamped with the reviewer and time; the submitted snapshot is never edited. Carrier-facing actions are explicitly out of scope. |

## Sensitive-question register

These rows are in the bank but are never asked. Each carries a `reviewNote`.

| ID | Topic | Required review before asking |
| --- | --- | --- |
| `ID-04` | Sex / gender | Jurisdiction and carrier approval, authorised answer set, necessity |
| `MED-11` | HIV / AIDS | Legal, clinical and underwriting review; confidentiality; state restrictions |
| `MH-06` | Detail of suicide attempt | Clinical + legal review of wording, necessity and crisis support |
| `RES-04` | Immigration category | Legal review; static source categories may be out of date |
| `RES-05` | Visa / green-card number | Should not be collected in this intake; needs a separate approved workflow |

No question asks for SSN, payment data, passport numbers, identity-document scans
or unrelated family identifiers. Height/weight are not collected.

## Operational and legal dependencies

- [ ] Close the 92 reconciliation decisions in
      [question-bank-reconciliation.md](question-bank-reconciliation.md) and set
      `sourceVerified: true` per row. 0 of 92 are signed off. The 9 source questions recorded as out of scope
      need a named reviewer to accept each reason.
- [ ] Confirm the committed source file matches the version the business has
      approved (`source/Detialed-Life-insurance-Questions.pdf`, SHA-256
      `afe91d87…82cca2`). A replaced PDF invalidates the whole reconciliation.
- [ ] Confirm the actual legal operating entity and set `VITE_LEGAL_ENTITY`.
      While it is empty, no marketing consent is requested.
- [ ] Decide which marketing channels, if any, are actually operated, and set
      only those flags; do not enable a channel the business does not use.
- [ ] Counsel review of the intake acknowledgment, TCPA disclosure, e-signature
      flow, state rules and actual vendor configuration.
- [ ] Confirm licensed states and the approved questionnaire version.
- [ ] Approve the retention schedule and set `app_settings.retention_months`; document backup expiry and the incident-response procedure. The deletion/expiry functions exist, but no schedule is active and no execution is evidenced.
- [ ] Vendor review: hosting, database/backups, email provider, auth provider,
      any model provider (none currently), and any future SMS/CRM tools.
- [ ] Decide whether HIPAA or Texas insurance privacy law applies to the actual
      entity and relationships; do not advertise compliance before that analysis.
- [ ] Verify access to `richardparslow@lifepolicypilot.blog` without sharing the
      password; enable MFA.
- [ ] Configure and approve the email sender domain and provider.
- [ ] Complete an end-to-end test with **labelled non-customer data**, then delete
      the test case and the seeded `LPP-2026-SAMPLE` record before launch.
- [ ] Run a prompt-injection/recipient-tampering review and a cross-account access
      test against the deployed project.

## Manual end-to-end script (non-customer)

1. `/start` → submit an empty form once; confirm every required error appears and
   focus moves to the first invalid field.
2. Enter “Test Case”, a state, a date of birth at least 18 years ago and a test
   email; in the default build no marketing boxes appear and no marketing
   consent is requested. Try Continue without the privacy acknowledgement or the
   adult-self attestation and confirm both are blocked; then complete them and
   continue. Separately, try a date of birth under 18 and confirm it is rejected.
3. Read the permission screen; confirm the crisis notice is present; grant
   permission; begin.
4. Answer the medical screen Yes to a condition with detail; confirm the
   supplemental block appears and is labelled.
5. Answer diabetes Yes; confirm the supplemental branch appears and the counter
   increases.
6. Use “Review my answers”; confirm unanswered items are listed and that the
   submit button is disabled until the acknowledgment is ticked.
7. Change an answer from the review screen; confirm the acknowledgment clears.
8. Tick the acknowledgment; confirm **Submit for Richard’s Review** is enabled;
   submit.
9. Confirm the confirmation screen shows a case reference and separates
   saved / queued / accepted / delivered truthfully.
10. Open `/portal`, sign in as the reviewer with an AAL2 session, open the case;
    confirm the draft summary links to question ids, held rows appear only as a
    count/generic topic (never source wording), consent evidence shows the exact
    text and privacy version, an `opened` access entry is recorded, and
    notification state matches step 9. Repeat with a password-only session and
    confirm zero cases are visible.
11. Record a correction in the case; confirm it appears under “Recorded
    corrections” with the reviewer and time, and that the submitted answer it
    refers to is unchanged.
12. Sign in as a second, non-allowlisted account; confirm the case is not readable.
13. Forward the notification email to a third party; confirm the link requires
    sign-in and that the third party cannot read the case.
