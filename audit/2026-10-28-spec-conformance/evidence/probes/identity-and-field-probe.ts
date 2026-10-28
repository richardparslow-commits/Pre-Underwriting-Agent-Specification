/**
 * Untracked audit probe. Fictitious non-customer data only.
 * Run: npx --yes deno@2.9.6 run --allow-env audit/2026-10-28-spec-conformance/evidence/probes/identity-and-field-probe.ts
 */
import { validateDraft } from "../../../../supabase/functions/_shared/case.ts";
import { SERVER_BANK } from "../../../../supabase/functions/_shared/bank.generated.ts";
import { buildAnswers, buildValidDraft } from "../../../../supabase/functions/tests/fixtures.ts";

function report(name: string, body: Record<string, unknown>, pick: (draft: any) => unknown) {
  const result = validateDraft(body);
  if (!result.ok) {
    console.log(`REJECTED | ${name} | ${result.reason}`);
    return;
  }
  console.log(`ACCEPTED | ${name} | ${JSON.stringify(pick(result.draft))}`);
}

report(
  "lead DOB and ID-01 answer conflict",
  buildValidDraft({
    answers: buildAnswers({
      "ID-01": { disposition: "answered", answerText: "2010-01-01" },
    }),
  }),
  (draft) => ({
    lead: draft.lead.dateOfBirth,
    answer: draft.answers.find((row: any) => row.questionId === "ID-01")?.answerText,
  }),
);

report(
  "lead state and ID-03 answer conflict",
  buildValidDraft({
    answers: buildAnswers({
      "ID-03": { disposition: "answered", answerText: "CA" },
    }),
  }),
  (draft) => ({
    lead: draft.lead.state,
    answer: draft.answers.find((row: any) => row.questionId === "ID-03")?.answerText,
  }),
);

const choiceFieldQuestion = SERVER_BANK.find((question) =>
  question.fields.some((field) => field.kind === "single_choice" && field.options.length > 0),
);
if (!choiceFieldQuestion) {
  console.log("SKIP | no single-choice field in the bank");
} else {
  const field = choiceFieldQuestion.fields.find(
    (candidate) => candidate.kind === "single_choice" && candidate.options.length > 0,
  )!;
  report(
    `single-choice field accepts an invented option on ${choiceFieldQuestion.id}`,
    buildValidDraft({
      answers: buildAnswers({
        [choiceFieldQuestion.askWhen?.questionId ?? choiceFieldQuestion.id]: {
          disposition: "answered",
          answerState: "yes",
          answerText: "Yes",
        },
        [choiceFieldQuestion.id]: {
          disposition: "answered",
          answerText: "Details provided",
          fields: [{ id: field.id, label: field.label, value: "invented-option-not-in-bank" }],
        },
      }),
    }),
    (draft) => ({
      id: choiceFieldQuestion.id,
      fields: draft.answers.find((row: any) => row.questionId === choiceFieldQuestion.id)?.fields,
    }),
  );
}

const dateFieldQuestion = SERVER_BANK.find((question) =>
  question.fields.some((field) => field.kind === "date"),
);
if (!dateFieldQuestion) {
  console.log("SKIP | no date field in the bank");
} else {
  const field = dateFieldQuestion.fields.find((candidate) => candidate.kind === "date")!;
  report(
    `date field accepts arbitrary text on ${dateFieldQuestion.id}`,
    buildValidDraft({
      answers: buildAnswers({
        [dateFieldQuestion.id]: {
          disposition: "answered",
          answerText: "Details provided",
          fields: [{ id: field.id, label: field.label, value: "not-a-date" }],
        },
      }),
    }),
    (draft) => ({
      id: dateFieldQuestion.id,
      fields: draft.answers.find((row: any) => row.questionId === dateFieldQuestion.id)?.fields,
    }),
  );
}
