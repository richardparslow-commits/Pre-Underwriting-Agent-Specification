# Launch gates

The specification defines ten production acceptance tests. This document records
what the code implements, how it was checked, and what remains before real
customer submissions can be accepted.

Legend: **Implemented** · **Partly** · **Not started** · **Blocked**

| # | Gate | Status | Evidence / remaining work |
| --- | --- | --- | --- |
| 1 | **Question coverage** — every PDF question reconciled against the approved bank; sensitive restrictions documented | **Partly** | The PDF is in the repo (`source/`, 7 pages) and all 113 source questions are inventoried verbatim in `sourceInventory.ts`. Every bank row has a reconciliation record. Nicotine, criminal history, medical history, alcohol and drug use, aviation and driving were rebuilt as one question per source window (`NIC-01`–`NIC-04`, `CRM-01`–`CRM-07`, `MED-01`–`MED-19`, `ALC-01`–`ALC-06`, `DRG-01`–`DRG-07`, `AVI-01`–`AVI-04`, `DRV-01`–`DRV-05`): 55 rows match their source and 3 are confirmed compound splits. 29 rows still carry flags, 2 were misattributed as source questions (now supplemental), and 5 are held. 85 source questions are traced to a row, 19 are partly collected and **9 are recorded out of scope with a written reason**; none is waiting on a new question, and none is unacknowledged — `npm run check:bank` enforces that. **Remaining:** a named reviewer must close each row's decision in [question-bank-reconciliation.md](question-bank-reconciliation.md) and set `sourceVerified: true` (currently 0/92). |
| 2 | **Branch coverage** — applicable follow-ups asked, irrelevant ones skipped, distinct timeframes preserved | **Partly** | Declarative `askWhen` branches; validated by `npm run check:bank` (14 branches). Nicotine asks 3 windows, with the last-use date only after a No or unsure 12-month answer; criminal history asks all 7 source windows; medical history one per window (12 months, 2, 3, 5, 7 and 10 years); alcohol asks its 5 source windows, drug use its 7 source questions, aviation the separate 12-month and 24-month questions (the latter including contemplated flights and student pilots), driving its 24-month, 5-year and ever questions; the added gap-filling rows branch only where the source does. **Partly met:** 7 rows replace a single source window with a different one. The current-crisis question (MH-05) is asked of every customer, whatever the answer to MH-04. |
| 3 | **Answer integrity** — blanks/uncertainty/refusal never saved as No; no invented medical facts | **Implemented** | Distinct `yes/no/unknown/declined/not_applicable` states; `unresolved` disposition; review and portal display “Not answered”; deterministic summary only restates recorded answers. |
| 4 | **Review and submission** — corrections possible; edits invalidate review confirmation; no send without explicit action | **Implemented** | Any answer edit clears acknowledgements. Submission disabled until the acknowledgment is ticked, then requires “Submit for Richard’s Review”. Server rejects a draft without an acknowledgement. |
| 5 | **Consent separation** — marketing off by default and independent of submission | **Partly** | Four consent records with own wording version/timestamp; marketing checkboxes disabled without a phone; TCPA disclosure retained verbatim. **Not started:** a customer-facing revocation flow after submission, and propagation of STOP/withdrawal to a CRM, dialer or SMS vendor. `public.contact_suppressions` exists and every future outbound attempt must be checked against it before sending. |
| 6 | **Recipient control** — prompt injection or client changes cannot alter the recipient | **Implemented** | Recipient and subject are server constants in `_shared/email.ts`; the browser sends no recipient. Client cannot read another case: RLS + reviewer allowlist. Injection testing belongs to the next security review. |
| 7 | **Secure access** — forwarded email grants nothing | **Implemented** | Portal requires a Supabase session and reviewer row; preview mode is explicitly labelled and holds no real data. MFA must be enabled on the account (operational task). |
| 8 | **Delivery reliability** — store failure, notification failure, retries, duplicate prevention, honest wording | **Partly** | Case is written before sending; states are separate; retry function updates existing rows only; case reference uniqueness prevents collisions. **Not run against a live provider.** Delivery webhook uses a shared secret, not provider signature verification. |
| 9 | **Leak prevention** — no health data in analytics, logs, URLs, email bodies, error reports | **Partly** | No analytics/pixels/session replay; answers never in URL or browser storage; server logs exclude payloads; email is minimal. **Remaining:** review hosting/provider logs, error reporting, and the email provider’s data-retention settings. |
| 10 | **Human review** — consequential actions behind authorised human approval | **Implemented** | No eligibility, rate or carrier action exists. Portal records `marked_reviewed` / `requested_clarification` with actor and timestamp. Carrier-facing actions are explicitly out of scope. |

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
- [ ] Confirm the actual legal operating entity; replace `SITE.legalEntity`.
- [ ] Counsel review of the intake acknowledgment, TCPA disclosure, e-signature
      flow, state rules and actual vendor configuration.
- [ ] Confirm licensed states and the approved questionnaire version.
- [ ] Document retention/deletion schedules and the incident-response procedure.
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
2. Enter “Test Case”, a state, a test email; leave both marketing boxes off;
   acknowledge privacy; continue.
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
10. Open `/portal`, sign in as the reviewer, open the case; confirm the draft
    summary links to question ids, the held rows are present, consent evidence
    shows the exact text, and notification state matches step 9.
11. Sign in as a second, non-allowlisted account; confirm the case is not readable.
12. Forward the notification email to a third party; confirm the link requires
    sign-in and that the third party cannot read the case.
