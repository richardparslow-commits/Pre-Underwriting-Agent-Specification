import {
  pruneBranchClosedAnswers,
  toSubmittedAnswers,
  visibleQuestions,
} from "../../src/features/interview/engine";
import type { Answers } from "../../src/features/interview/types";

const AT = "2026-10-27T12:00:00.000Z";

function answer(patch: Partial<Answers[string]>): Answers[string] {
  return { ...patch, updatedAt: AT };
}

// MIL-01 (ever served) -> MIL-02 (flying/aircraft) -> MIL-04 (mission type).
let answers: Answers = {
  "MIL-01": answer({ state: "yes" }),
  "MIL-02": answer({ state: "yes" }),
  "MIL-04": answer({ values: ["proficiency"] }),
};

console.log("before parent closes:", {
  visible: visibleQuestions(answers).filter((q) => q.id.startsWith("MIL-")).map((q) => q.id),
});

// Customer changes their mind: they have never served. MIL-02 should close, and
// the nested MIL-04 question must close with it.
answers = { ...answers, "MIL-01": answer({ state: "no" }) };
const pruned = pruneBranchClosedAnswers(answers);
const submitted = toSubmittedAnswers(pruned);
const milRows = submitted.filter((row) => row.questionId.startsWith("MIL-"));

console.log("after parent closes:", {
  answerKeys: Object.keys(pruned).filter((id) => id.startsWith("MIL-")).sort(),
  visible: visibleQuestions(pruned).filter((q) => q.id.startsWith("MIL-")).map((q) => q.id),
  submitted: milRows.map((row) => ({
    id: row.questionId,
    disposition: row.disposition,
    answerState: row.answerState,
    answerValues: row.answerValues,
    fields: row.fields,
  })),
  nestedOrphanStillVisible: visibleQuestions(pruned).some((q) => q.id === "MIL-04"),
  nestedOrphanStillAnswered: milRows.some(
    (row) => row.questionId === "MIL-04" && row.disposition === "answered",
  ),
});
