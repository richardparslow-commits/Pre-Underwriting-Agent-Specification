import type { ServerAnswer, ServerFlag } from "./case.ts";

// These checks use explicit canonical answers and are for reviewer follow-up.
// In particular, missed work alone does not establish a diagnosis or treatment.
const OVERLAPPING_ANSWERS = [
  ["NIC-01", "NIC-03", "Recent nicotine use overlaps the five-year question."],
  [
    "DRG-03",
    "DRG-04",
    "Clarify how the recreational marijuana use relates to the lifetime question.",
  ],
  [
    "CRM-05",
    "CRM-06",
    "The recent incarceration or supervision window falls within ten years.",
  ],
  [
    "CRM-07",
    "CRM-06",
    "Clarify the current supervision order against the ten-year history.",
  ],
  [
    "DRV-03",
    "DRV-07",
    "Clarify whether the reported driving conviction is included in the moving-violation history.",
  ],
  [
    "MH-07",
    "MH-01",
    "Clarify whether the reported mental-health care included diagnosis or treatment.",
  ],
  [
    "MED-08",
    "MED-19",
    "The recent cancer history overlaps the ten-year question.",
  ],
] as const;

const NICOTINE_WINDOWS = [["NIC-01", 12], ["NIC-02", 36], [
  "NIC-03",
  60,
]] as const;

function reportedDate(value: string | undefined) {
  const match = value?.match(/^(?:(0?[1-9]|1[0-2])\/)?((?:19|20)\d{2})$/);
  if (!match) return undefined;
  return {
    year: Number(match[2]),
    month: match[1] ? Number(match[1]) : undefined,
  };
}

export function answerConsistencyFlags(
  answers: ServerAnswer[],
  completedAt: string,
): ServerFlag[] {
  const answered = new Map(
    answers.filter((answer) => answer.disposition === "answered").map(
      (answer) => [answer.questionId, answer],
    ),
  );
  const state = (id: string) => answered.get(id)?.answerState;
  const detail = (id: string, label: string) =>
    state(id) === "yes"
      ? answered.get(id)?.details?.find((entry) => entry.label === label)?.value
      : undefined;
  const flags: ServerFlag[] = [];
  const flag = (
    id: string,
    label: string,
    questionIds: string[],
    message: string,
  ) => {
    flags.push({
      id: `answer-consistency:${id}`,
      label,
      detail: `${questionIds.join(", ")}: ${message}`,
      severity: "attention",
      questionIds,
    });
  };

  for (const [narrow, wide, message] of OVERLAPPING_ANSWERS) {
    if (state(narrow) === "yes" && state(wide) === "no") {
      flag(
        `contained:${narrow}>${wide}`,
        "Overlapping answers to clarify",
        [narrow, wide],
        message,
      );
    }
  }

  if (state("DRV-06") === "yes") {
    for (
      const [id, label] of [["DRV-01", "Is the licence reinstated?"], [
        "DRV-02",
        "Is it reinstated?",
      ]] as const
    ) {
      if (detail(id, label) === "No, still suspended") {
        flag(
          `licence-status:${id}`,
          "Driver’s licence status to clarify",
          [id, "DRV-06"],
          "The licence was described as both currently valid and still suspended.",
        );
      }
    }
  }

  if (state("ALC-01") === "no") {
    for (const id of ["ALC-02", "ALC-04", "ALC-05", "ALC-06"]) {
      if (detail(id, "Current status") === "I drink less now") {
        flag(
          `drinking-now:${id}>ALC-01`,
          "Alcohol use timeframe to clarify",
          [id, "ALC-01"],
          "The reported current drinking status may conflict with the twelve-month answer.",
        );
      }
    }
  }

  const completed = new Date(completedAt);
  const year = completed.getUTCFullYear();
  const month = completed.getUTCMonth() + 1;
  const lastUse = reportedDate(answered.get("NIC-04")?.answerText);
  if (lastUse?.month !== undefined) {
    const monthsAgo = (year - lastUse.year) * 12 + month - lastUse.month;
    if (monthsAgo < 0) {
      flag(
        "future-date:NIC-04",
        "Nicotine last-use date to clarify",
        ["NIC-04"],
        "The reported last use is in a future month.",
      );
    } else {
      for (const [id, months] of NICOTINE_WINDOWS) {
        if (monthsAgo < months && state(id) === "no") {
          flag(
            `last-use:NIC-04>${id}`,
            "Nicotine use timeframe to clarify",
            ["NIC-04", id],
            "The reported last-use month falls inside a window answered No.",
          );
        }
      }
    }
  }

  const visit = reportedDate(detail("MED-02", "Approximate month and year"));
  if (
    visit &&
    (visit.year > year ||
      (visit.year === year && visit.month !== undefined && visit.month > month))
  ) {
    flag(
      "future-year:MED-02.when",
      "Medical event date to clarify",
      ["MED-02"],
      "The date given for a past medical event is in the future.",
    );
  }
  const violation = reportedDate(
    detail("DRV-07", "Approximate year of the most recent"),
  );
  if (violation && violation.year < year - 5) {
    flag(
      "outside-window:DRV-07",
      "Moving-violation date to clarify",
      ["DRV-07"],
      "The reported year of the most recent violation falls outside the five-year question.",
    );
  }
  const diagnosisAge = detail("MED-25", "Approximate age at diagnosis");
  if (
    diagnosisAge && /^\d{2,3}$/.test(diagnosisAge) && Number(diagnosisAge) >= 60
  ) {
    flag(
      "family-age:MED-25",
      "Family history age to clarify",
      ["MED-25"],
      "The age given is outside the question’s before-age-60 scope. Confirm who and what the answer refers to.",
    );
  }

  return flags;
}
