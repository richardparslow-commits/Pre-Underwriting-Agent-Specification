import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import IntakePage from "@/pages/IntakePage";
import { IntakeSessionContext } from "@/features/interview/intakeSessionContext";
import { useInterview, type InterviewHook } from "@/features/interview/useInterview";

function text(node: ReactTestInstance | string): string {
  return typeof node === "string" ? node : node.children.map(text).join("");
}

function reviewButton(view: ReactTestRenderer) {
  const buttons = view.root.findAllByType("button").filter((node) => text(node) === "Review my answers");
  assert.equal(buttons.length, 1, "one direct review action must be available");
  const button = buttons[0]!;
  // The section sidebar is desktop-only. Returning from an edit must not
  // depend on that sidebar being visible. Real CSS/viewport checks supplement
  // this component regression; the original button fails this assertion.
  for (let parent = button.parent; parent; parent = parent.parent) {
    assert.notEqual(parent.type, "aside", "review must be reachable outside the desktop sidebar");
  }
  assert.equal(button.props.type, "button");
  return button;
}

async function fixture(run: (view: ReactTestRenderer, read: () => InterviewHook) => Promise<void>) {
  let interview!: InterviewHook;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  if (!originalWindow) Object.defineProperty(globalThis, "window", {
    configurable: true, value: { scrollTo() {} },
  });
  function Harness() {
    interview = useInterview();
    return (
      <IntakeSessionContext.Provider value={{
        interview,
        historyEntry: { session: "synthetic-review-navigation", step: interview.step },
        submitting: false, navigationBlocked: false, error: null,
        submit: async () => { throw new Error("Navigation must never submit a case"); },
      }}>
        {interview.step === "interview" || interview.step === "review" ? <IntakePage /> : null}
      </IntakeSessionContext.Provider>
    );
  }
  let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(<Harness />); });
    await act(async () => {
      for (const [field, value] of Object.entries({
        firstName: "Synthetic", lastName: "Review", state: "TX",
        dateOfBirth: "1980-01-01", email: "review@example.invalid",
      })) interview.setLeadField(field as Parameters<InterviewHook["setLeadField"]>[0], value);
      interview.setAdultAttested(true);
      interview.setConsent("privacyAcknowledged", true);
      interview.setConsent("intakePermission", true);
    });
    await act(async () => interview.givePermission());
    await act(async () => interview.goToQuestion("MH-03"));
    await run(view, () => interview);
  } finally {
    if (view) await act(async () => view.unmount());
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

test("review is available outside the desktop sidebar and preserves an unanswered question", async () => {
  await fixture(async (view, read) => {
    assert.equal(read().answers["MH-03"], undefined);
    await act(async () => reviewButton(view).props.onClick());
    assert.equal(read().step, "review");
    assert.equal(read().answers["MH-03"], undefined, "reviewing must not invent an answer");
    assert.ok(text(view.root).includes("Check your answers"));
    assert.equal(read().draft, null, "reviewing alone cannot acknowledge or submit the case");
  });
});

test("interview progress excludes restored military details without a Yes or No answer", async () => {
  await fixture(async (view, read) => {
    await act(async () => {
      read().setAnswer("MIL-01", { state: "yes" });
      read().setAnswer("MIL-02", { fields: { aircraft: "Synthetic retained aircraft" } });
      read().setAnswer("MIL-03", { state: "no" });
      read().goToQuestion("MIL-02");
    });
    assert.match(text(view.root), /2 of 3 in this section/);
    const current = view.root.findAllByType("div").find(node => node.props["aria-current"] === "step");
    assert.ok(current);
    assert.doesNotMatch(text(current), /✓/);
  });
});

test("review shows only the military details that the submitted answer will include", async () => {
  await fixture(async (view, read) => {
    await act(async () => {
      read().setAnswer("MIL-01", { state: "yes" });
      read().setAnswer("MIL-02", { fields: { aircraft: "Synthetic retained aircraft" } });
      read().finishInterview();
    });
    const aviation = () => view.root.findAllByType("li").find(node => text(node).includes("MIL-02"))!;
    assert.match(text(aviation()), /Not answered/);
    assert.doesNotMatch(text(aviation()), /Synthetic retained aircraft/);

    await act(async () => read().setAnswer("MIL-02", { state: "no" }));
    assert.doesNotMatch(text(aviation()), /Synthetic retained aircraft/);
    await act(async () => read().setAnswer("MIL-02", { state: "yes" }));
    assert.match(text(aviation()), /Synthetic retained aircraft/);
    await act(async () => read().confirmReview(true));
    const submitted = read().draft?.answers.find(answer => answer.questionId === "MIL-02");
    assert.equal(submitted?.fields?.[0]?.value, "Synthetic retained aircraft");
  });
});

test("editing MH-03 from review returns directly with the edit, other answers and permissions intact", async () => {
  await fixture(async (view, read) => {
    await act(async () => read().setAnswer("ID-02", { value: "Synthetic retained occupation" }));
    await act(async () => read().finishInterview());
    await act(async () => read().confirmReview(true));
    const otherAnswer = structuredClone(read().answers["ID-02"]);
    const lead = structuredClone(read().lead);
    const consent = structuredClone(read().consent);
    const row = view.root.findAllByType("li").find((node) => text(node).includes("MH-03"));
    assert.ok(row);
    await act(async () => row.findByType("button").props.onClick());
    assert.equal(read().currentQuestionId, "MH-03");
    const no = view.root.findAllByType("input").find((node) => node.props.name === "MH-03" && node.props.value === "no");
    assert.ok(no);
    await act(async () => no.props.onChange());
    await act(async () => reviewButton(view).props.onClick());
    assert.equal(read().step, "review");
    assert.equal(read().currentQuestionId, "MH-03", "returning must not page forward");
    assert.equal(read().answers["MH-03"]?.state, "no");
    assert.deepEqual(read().answers["ID-02"], otherAnswer);
    assert.deepEqual(read().lead, lead);
    assert.deepEqual(read().consent, consent);
    assert.deepEqual(read().acknowledgements, [], "the edited review needs a fresh confirmation");
    assert.equal(read().draft, null);
    const updated = view.root.findAllByType("li").find((node) => text(node).includes("MH-03"));
    assert.ok(updated && text(updated).includes("Answered") && text(updated).includes("No"));
  });
});
