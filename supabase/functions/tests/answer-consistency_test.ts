import { assert, assertEquals } from "jsr:@std/assert@1.0.6";
import { validateDraft } from "../_shared/case.ts";
import { buildAnswers, buildValidDraft, TEST_TIMES } from "./fixtures.ts";

const yes = (...details: Array<{ label: string; value: string }>) => ({
  disposition: "answered",
  answerState: "yes",
  answerText: "Yes",
  details,
});

function review(overrides: Record<string, Record<string, unknown>>) {
  const result = validateDraft(
    buildValidDraft({ answers: buildAnswers(overrides) }),
  );
  assert(result.ok, result.ok ? undefined : result.reason);
  return result.draft.flags.filter((flag) =>
    flag.id.startsWith("answer-consistency:")
  );
}

for (
  const [narrow, wide] of [
    ["NIC-01", "NIC-03"],
    ["DRG-03", "DRG-04"],
    ["CRM-05", "CRM-06"],
    ["CRM-07", "CRM-06"],
    ["DRV-03", "DRV-07"],
    ["MH-07", "MH-01"],
    ["MED-08", "MED-19"],
  ]
) {
  Deno.test(`flags ${narrow} Yes and ${wide} No for review without blocking the draft`, () => {
    const flags = review({ [narrow]: yes() });
    assert(
      flags.some((flag) =>
        flag.id === `answer-consistency:contained:${narrow}>${wide}` &&
        flag.severity === "attention"
      ),
    );
  });
}

Deno.test("an intermediate uncertain answer does not hide a direct nicotine discrepancy", () => {
  const flags = review({
    "NIC-01": yes(),
    "NIC-02": {
      disposition: "unknown",
      answerState: "unknown",
      answerText: "I'm not sure",
    },
  });
  assertEquals(flags.map((flag) => flag.id), [
    "answer-consistency:contained:NIC-01>NIC-03",
  ]);
});

Deno.test("uncertainty and missed work alone do not establish a contradiction", () => {
  const flags = review({
    "NIC-01": yes(),
    "NIC-02": yes(),
    "NIC-03": {
      disposition: "declined",
      answerState: "declined",
      answerText: "Prefer not to answer",
    },
    "MH-03": yes(),
  });
  assertEquals(flags, []);
});

Deno.test("licence and alcohol follow-ups use the exact recorded option", () => {
  const flags = review({
    "DRV-06": yes(),
    "DRV-02": yes({ label: "Is it reinstated?", value: "No, still suspended" }),
    "ALC-06": yes({ label: "Current status", value: "I drink less now" }),
    "ALC-05": yes({ label: "Current status", value: "I no longer drink" }),
  });
  assertEquals(flags.map((flag) => flag.id), [
    "answer-consistency:licence-status:DRV-02",
    "answer-consistency:drinking-now:ALC-06>ALC-01",
  ]);
  assert(flags[0]!.detail.includes("DRV-02, DRV-06"));
  assert(!flags[0]!.detail.includes("DRV-01"));
});

Deno.test("date and age checks use completed date and flag only clear boundaries", () => {
  const completed = new Date(TEST_TIMES.completedAt);
  const year = completed.getUTCFullYear();
  const month = completed.getUTCMonth() + 1;
  const flags = review({
    "NIC-02": yes(),
    "NIC-04": { disposition: "answered", answerText: `${month}/${year}` },
    "MED-02": yes({
      label: "Approximate month and year",
      value: `03/${year + 1}`,
    }),
    "DRV-07": yes({
      label: "Approximate year of the most recent",
      value: String(year - 6),
    }),
    "MED-25": yes({ label: "Approximate age at diagnosis", value: "60" }),
  });
  assertEquals(flags.map((flag) => flag.id), [
    "answer-consistency:last-use:NIC-04>NIC-01",
    "answer-consistency:last-use:NIC-04>NIC-03",
    "answer-consistency:future-year:MED-02.when",
    "answer-consistency:outside-window:DRV-07",
    "answer-consistency:family-age:MED-25",
  ]);

  const ambiguous = review({
    "NIC-02": yes(),
    "NIC-03": yes(),
    "NIC-04": { disposition: "answered", answerText: `${month}/${year - 1}` },
    "MED-02": yes({
      label: "Approximate month and year",
      value: `One visit; follow-up planned ${year + 1}`,
    }),
    "DRV-07": yes({
      label: "Approximate year of the most recent",
      value: String(year - 5),
    }),
    "MED-25": yes({ label: "Approximate age at diagnosis", value: "59 or 60" }),
  });
  assertEquals(ambiguous, []);
});
