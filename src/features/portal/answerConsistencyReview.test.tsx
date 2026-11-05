import assert from "node:assert/strict";
import test from "node:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { StaticRouter } from "react-router-dom";
import { buildDraftSummary, toSubmittedAnswers } from "@/features/interview/engine";
import type { CaseRecord } from "@/features/interview/types";
import { CaseReview } from "./CaseReview";

test("Needs attention includes answered questions named by a stored consistency flag", async () => {
  const at = "2026-01-01T00:00:00Z";
  const answers = toSubmittedAnswers({
    "NIC-01": { state: "yes", updatedAt: at },
    "NIC-02": { state: "yes", updatedAt: at },
    "NIC-03": { state: "no", updatedAt: at },
  }).filter(answer => ["NIC-01", "NIC-02", "NIC-03", "RES-01"].includes(answer.questionId));
  const record: CaseRecord = {
    reference: "LPP-2026-TEST01", questionnaireVersion: "test",
    startedAt: at, completedAt: at, submittedAt: at,
    lead: {
      firstName: "Synthetic", lastName: "Case", state: "TX",
      dateOfBirth: "1990-01-01", adultAttested: true,
      email: "synthetic@example.invalid", preferredContact: "email",
    },
    adultAttested: true, relationship: "self", answers, consents: [],
    acknowledgements: [], crisisDisclosure: false, status: "submitted",
    flags: [{
      id: "answer-consistency:contained:NIC-01>NIC-03",
      label: "Overlapping answers to clarify",
      detail: "NIC-01, NIC-03: Recent nicotine use overlaps the five-year question.",
      severity: "attention",
      questionIds: ["NIC-01", "NIC-03"],
    }, {
      id: "legacy-flag", label: "Older flag", detail: "Synthetic legacy detail", severity: "attention",
    }],
    notification: { state: "not_sent", attempts: 0, updatedAt: at },
    reviewLog: [], corrections: [], marketingRevocations: [],
    draftSummary: buildDraftSummary(answers),
  };
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(<StaticRouter location="/portal/LPP-2026-TEST01">
      <CaseReview record={record} onRefresh={() => {}} />
    </StaticRouter>);
  });
  try {
    assert.match(JSON.stringify(view.toJSON()), /Overlapping answers to clarify/);
    const attention = view.root.findAllByType("button")
      .find(button => button.children.join("") === "Needs attention 3");
    assert.ok(attention);
    await act(async () => attention.props.onClick());
    const displayed = view.root.findAllByType("li")
      .map(row => row.props.id as string | undefined)
      .filter(id => id?.startsWith("answer-"));
    assert.deepEqual(displayed.sort(), ["answer-NIC-01", "answer-NIC-03", "answer-RES-01"]);
  } finally {
    await act(async () => view.unmount());
  }
});
