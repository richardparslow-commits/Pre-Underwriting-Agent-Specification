/**
 * Untracked audit probes for server validation gaps.
 * Fictitious non-customer data only.
 */
import { buildAnswers, buildConsents, buildValidDraft } from "../../supabase/functions/tests/fixtures.ts";
import { validateDraft } from "../../supabase/functions/_shared/case.ts";

type Probe = { name: string; body: Record<string, unknown> };

const probes: Probe[] = [
  {
    name: "phone contact with no phone number",
    body: buildValidDraft({
      lead: {
        firstName: "Test",
        lastName: "Non-customer",
        state: "TX",
        email: "test-case@example.com",
        preferredContact: "phone",
        dateOfBirth: "1980-01-01",
      },
    }),
  },
  {
    name: "text contact with a one-digit phone number",
    body: buildValidDraft({
      lead: {
        firstName: "Test",
        lastName: "Non-customer",
        state: "TX",
        email: "test-case@example.com",
        preferredContact: "text",
        phone: "5",
        dateOfBirth: "1980-01-01",
      },
    }),
  },
  {
    name: "lead DOB and ID-01 answer conflict",
    body: buildValidDraft({
      answers: buildAnswers({
        "ID-01": { disposition: "answered", answerText: "2010-01-01" },
      }),
    }),
  },
  {
    name: "lead state and ID-03 answer conflict",
    body: buildValidDraft({
      answers: buildAnswers({
        "ID-03": { disposition: "answered", answerText: "CA" },
      }),
    }),
  },
  {
    name: "marketing record left unchecked while a channel is enabled",
    body: buildValidDraft({
      consents: [
        ...buildConsents(),
        {
          id: "marketing_call",
          label: "I agree to receive marketing telephone calls as described below.",
          granted: false,
          grantedAt: null,
          textVersion: "2026-10-b",
          text: "Test disclosure",
        },
      ],
    }),
  },
];

for (const probe of probes) {
  const result = validateDraft(probe.body);
  if (result.ok) {
    console.log(`ACCEPTED: ${probe.name}`, {
      preferredContact: result.draft.lead.preferredContact,
      phone: result.draft.lead.phone ?? null,
      consentIds: result.draft.consents.map((consent) => consent.id),
      id01: result.draft.answers.find((answer) => answer.questionId === "ID-01")?.answerText,
      id03: result.draft.answers.find((answer) => answer.questionId === "ID-03")?.answerText,
    });
  } else {
    console.log(`REJECTED: ${probe.name} -> ${result.reason}`);
  }
}
