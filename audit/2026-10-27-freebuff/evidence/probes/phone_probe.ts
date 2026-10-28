import { validateDraft } from "../../supabase/functions/_shared/case.ts";
import { buildValidDraft } from "../../supabase/functions/tests/fixtures.ts";

const baseLead = {
  firstName: "Test",
  lastName: "Non-customer",
  state: "TX",
  email: "test-case@example.com",
  dateOfBirth: "1980-01-01",
};

for (const scenario of [
  { name: "phone preference, no phone", preferredContact: "phone" },
  { name: "text preference, no phone", preferredContact: "text" },
  { name: "phone preference, junk phone", preferredContact: "phone", phone: "abc" },
  { name: "phone preference, 3 digits", preferredContact: "phone", phone: "512" },
  { name: "phone preference, valid 10 digits", preferredContact: "phone", phone: "(512) 555-0134" },
]) {
  const body = buildValidDraft({
    lead: {
      ...baseLead,
      preferredContact: scenario.preferredContact,
      ...(scenario.phone ? { phone: scenario.phone } : {}),
    },
  });
  const result = validateDraft(body);
  console.log(
    JSON.stringify({
      scenario: scenario.name,
      ok: result.ok,
      reason: result.ok ? null : result.reason,
      storedPhone: result.ok ? result.draft.lead.phone ?? null : null,
    }),
  );
}
