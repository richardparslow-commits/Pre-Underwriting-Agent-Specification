import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import type { CaseRecord } from "@/features/interview/types";
import { CaseReview } from "./CaseReview";
import { ClarificationDraftProvider } from "./ClarificationDraft";

const at = "2026-01-01T00:00:00Z";

function fixture(): CaseRecord {
  return {
    reference: "LPP-2026-TEST01",
    questionnaireVersion: "test",
    startedAt: at,
    completedAt: at,
    submittedAt: at,
    lead: {
      firstName: "Synthetic",
      lastName: "Case",
      state: "TX",
      dateOfBirth: "1990-01-01",
      adultAttested: true,
      email: "synthetic@example.invalid",
      preferredContact: "email",
    },
    adultAttested: true,
    relationship: "self",
    answers: [],
    consents: [],
    acknowledgements: [],
    flags: [],
    crisisDisclosure: false,
    status: "submitted",
    notification: { state: "not_sent", attempts: 0, updatedAt: at },
    reviewLog: [],
    corrections: [],
    marketingRevocations: [],
    draftSummary: {
      generatedAt: at,
      line: "Synthetic",
      sections: [],
      flags: [],
    },
  };
}

function QueuePage() {
  const navigate = useNavigate();
  return (
    <>
      <h1>Case queue</h1>
      <button id="back-to-case" type="button" onClick={() => navigate(-1)}>
        Back to case
      </button>
    </>
  );
}

function button(view: ReactTestRenderer, label: string) {
  const found = view.root
    .findAllByType("button")
    .find((node) => node.children.join("").includes(label));
  assert.ok(found, `missing button ${label}`);
  return found;
}

test("an unsent clarification note survives leaving for the case queue", async () => {
  const record = fixture();
  const note = "Please confirm the date of the 2024 surgery.";
  let view!: ReactTestRenderer;

  await act(async () => {
    view = create(
      <MemoryRouter initialEntries={[`/portal/${record.reference}`]}>
        <ClarificationDraftProvider>
          <Routes>
            <Route
              path="/portal/:reference"
              element={<CaseReview record={record} onRefresh={() => {}} />}
            />
            <Route path="/portal" element={<QueuePage />} />
          </Routes>
        </ClarificationDraftProvider>
      </MemoryRouter>,
    );
  });

  try {
    await act(async () => {
      button(view, "Request clarification").props.onClick();
    });
    const editor = view.root.findByType("textarea");
    await act(async () => {
      editor.props.onChange({ target: { value: note } });
    });

    const queueLink = view.root
      .findAllByType("a")
      .find((link) => link.props.href === "/portal");
    assert.ok(queueLink, "missing Case queue link");
    await act(async () => {
      queueLink.props.onClick({ button: 0, preventDefault() {} });
    });
    assert.ok(
      view.root
        .findAllByType("h1")
        .some((heading) => heading.children.join("") === "Case queue"),
    );

    await act(async () => {
      view.root.findByProps({ id: "back-to-case" }).props.onClick();
    });
    await act(async () => {
      button(view, "Request clarification").props.onClick();
    });
    assert.equal(view.root.findByType("textarea").props.value, note);
  } finally {
    await act(async () => view.unmount());
  }
});
