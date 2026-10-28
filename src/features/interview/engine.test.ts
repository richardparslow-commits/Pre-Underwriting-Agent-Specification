import test from "node:test";
import assert from "node:assert/strict";
import {
  crisisDisclosed,
  dispositionFor,
  ORDERED_QUESTIONS,
  pruneBranchClosedAnswers,
  toSubmittedAnswers,
} from "./engine";
import { QUESTION_BY_ID } from "./questionBank";
import type { Answers } from "./types";

const AT = "2026-10-27T12:00:00.000Z";

function withAnswer(answers: Answers, id: string, patch: Partial<Answers[string]>): Answers {
  return { ...answers, [id]: { ...(answers[id] ?? {}), ...patch, updatedAt: AT } };
}

test("closing a parent branch removes the descendant answer and its details", () => {
  const parent = QUESTION_BY_ID["MH-01"];
  const child = QUESTION_BY_ID["MH-02"];
  assert(parent && child);

  let answers: Answers = {};
  answers = withAnswer(answers, "MH-01", { state: "yes" });
  answers = withAnswer(answers, "MH-02", {
    fields: { condition: "anxiety", diagnosisYear: "2020" },
  });

  assert.deepEqual(Object.keys(answers).sort(), ["MH-01", "MH-02"]);

  const after = withAnswer(answers, "MH-01", { state: "no" });
  const pruned = pruneBranchClosedAnswers(after);

  assert.equal(pruned["MH-02"], undefined);
  assert.equal(pruned["MH-01"]?.state, "no");
});

test("a branch-closed row never emits fields or supplemental detail", () => {
  const answers: Answers = {
    "MH-01": { state: "no", updatedAt: AT },
    "MH-02": {
      fields: { condition: "anxiety" },
      details: { treatment: "therapy" },
      updatedAt: AT,
    },
  };

  const row = toSubmittedAnswers(answers).find((answer) => answer.questionId === "MH-02");
  assert(row);
  assert.equal(row.disposition, "not_asked");
  assert.deepEqual(row.fields, []);
  assert.deepEqual(row.details, []);
  assert.equal(row.answerState, undefined);
});

test("a held row stays held and carries no answer content", () => {
  const held = ORDERED_QUESTIONS.filter(
    (question) => question.reviewStatus === "human_review_required",
  );
  assert(held.length > 0);

  const answers: Answers = {};
  for (const question of held) {
    answers[question.id] = {
      state: "yes",
      fields: { condition: "should not be stored" },
      updatedAt: AT,
    };
  }

  const submitted = toSubmittedAnswers(answers);
  for (const question of held) {
    const row = submitted.find((answer) => answer.questionId === question.id);
    assert(row);
    assert.equal(row.disposition, "held_for_review");
    assert.equal(row.answerState, undefined);
    assert.deepEqual(row.fields, []);
    assert.deepEqual(row.details, []);
  }
});

test("a blank answer is unresolved, never No", () => {
  const question = QUESTION_BY_ID["MED-01"];
  assert(question);

  const disposition = dispositionFor(question, undefined, {});
  assert.equal(disposition, "unresolved");
});

test("current crisis is disclosed even when the history answer is No, Unknown or declined", () => {
  for (const history of ["no", "unknown", "declined"] as const) {
    const answers: Answers = withAnswer(
      withAnswer({}, "MH-04", { state: history }),
      "MH-05",
      { state: "yes" },
    );
    assert.equal(crisisDisclosed(answers), true, `history=${history}`);
  }
});

test("crisis is not disclosed when the current-safety answer is not Yes", () => {
  for (const current of ["no", "unknown", "declined"] as const) {
    const answers: Answers = withAnswer({}, "MH-05", { state: current });
    assert.equal(crisisDisclosed(answers), false, `current=${current}`);
  }
});
