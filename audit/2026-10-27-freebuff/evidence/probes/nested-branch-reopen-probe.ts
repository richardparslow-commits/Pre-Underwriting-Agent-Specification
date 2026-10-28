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

let answers: Answers = {
  "MIL-01": answer({ state: "yes" }),
  "MIL-02": answer({ state: "yes" }),
  "MIL-04": answer({ values: ["proficiency"] }),
};

answers = { ...answers, "MIL-01": answer({ state: "no" }) };
const pruned = pruneBranchClosedAnswers(answers);

// Re-open the same path. The customer has not re-answered MIL-04.
const reopened = pruneBranchClosedAnswers({
  ...pruned,
  "MIL-01": answer({ state: "yes" }),
  "MIL-02": answer({ state: "yes" }),
});

const submitted = toSubmittedAnswers(reopened).filter((row) => row.questionId.startsWith("MIL-"));

console.log({
  retainedWhileClosed: Object.keys(pruned).filter((id) => id.startsWith("MIL-")).sort(),
  visibleWhenReopened: visibleQuestions(reopened)
    .filter((q) => q.id.startsWith("MIL-"))
    .map((q) => q.id),
  submitted: submitted.map((row) => ({
    id: row.questionId,
    disposition: row.disposition,
    answerValues: row.answerValues,
    answerState: row.answerState,
  })),
  staleNestedAnswerRevived: submitted.some(
    (row) => row.questionId === "MIL-04" && row.disposition === "answered",
  ),
});
