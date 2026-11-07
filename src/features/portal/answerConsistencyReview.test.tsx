import assert from "node:assert/strict";
import test from "node:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { StaticRouter } from "react-router-dom";
import { buildDraftSummary, toSubmittedAnswers } from "@/features/interview/engine";
import type { CaseRecord } from "@/features/interview/types";
import { CaseReview } from "./CaseReview";
import { ClarificationDraftProvider } from "./ClarificationDraft";

test("reviewers can reach flagged and summary answers from a filtered question record", async () => {
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
      <ClarificationDraftProvider>
        <CaseReview record={record} onRefresh={() => {}} />
      </ClarificationDraftProvider>
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

    const summaryLink = view.root.findAllByType("a").find(link => link.props.href === "#answer-NIC-02");
    assert.ok(summaryLink);
    assert.match(summaryLink.props.className, /(^|\s)text-accent-strong(?:\s|$)/);
    await act(async () => summaryLink.props.onClick?.({ button: 0 }));
    assert.ok(view.root.findAllByType("li").some(row => row.props.id === "answer-NIC-02"));

    const held = view.root.findAllByType("button").find(button => button.children.join("") === "Held 0");
    assert.ok(held);
    await act(async () => held.props.onClick());
    const flagItem = view.root.findAllByType("li").find(row =>
      row.findAllByType("p").some(p => p.children.join("") === "Overlapping answers to clarify"));
    assert.ok(flagItem);
    const flagLinks = flagItem.findAllByType("a");
    assert.deepEqual(flagLinks.map(link => link.props.href), ["#answer-NIC-01", "#answer-NIC-03"]);
    await act(async () => flagLinks[0]!.props.onClick({ button: 0 }));
    const target = view.root.findAllByType("li").find(row => row.props.id === "answer-NIC-01");
    assert.equal(target?.props.tabIndex, -1);
  } finally {
    await act(async () => view.unmount());
  }
});
