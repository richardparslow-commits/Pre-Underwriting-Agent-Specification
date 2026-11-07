import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useInterview, type InterviewHook } from "./useInterview";

const DAY_MS = 24 * 60 * 60 * 1000;
const START = Date.parse("2026-11-01T12:00:00.000Z");

async function mount() {
  let state!: InterviewHook;
  function Harness() {
    state = useInterview();
    return null;
  }
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(<Harness />);
  });
  return {
    read: () => state,
    unmount: async () => act(async () => view.unmount()),
  };
}

async function enterLead(read: () => InterviewHook) {
  await act(async () => {
    read().setLeadField("firstName", "Synthetic");
    read().setLeadField("lastName", "Start");
    read().setLeadField("email", "start@example.invalid");
    read().setLeadField("state", "TX");
    read().setLeadField("dateOfBirth", "1980-01-01");
    read().setAdultAttested(true);
    read().setConsent("privacyAcknowledged", true);
  });
}

async function finishDraft(read: () => InterviewHook) {
  await act(async () => {
    read().setAnswer("ID-02", { value: "Texas" });
    read().finishInterview();
  });
  await act(async () => read().confirmReview(true));
  assert.ok(read().draft);
  return read().draft!;
}

test("an old intake tab uses the time the interview begins, not page load", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: START });
  const fixture = await mount();
  try {
    await enterLead(fixture.read);
    t.mock.timers.tick(8 * DAY_MS);
    await act(async () => fixture.read().begin());
    await act(async () => fixture.read().setConsent("intakePermission", true));
    await act(async () => fixture.read().givePermission());

    const draft = await finishDraft(fixture.read);
    assert.equal(Date.parse(draft.startedAt), START + 8 * DAY_MS);
    assert.ok(Date.parse(draft.completedAt) - Date.parse(draft.startedAt) < 7 * DAY_MS);
  } finally {
    await fixture.unmount();
  }
});

test("returning through Continue to an already-permitted interview refreshes the start time", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: START });
  const fixture = await mount();
  try {
    await enterLead(fixture.read);
    await act(async () => fixture.read().setConsent("intakePermission", true));
    t.mock.timers.tick(8 * DAY_MS);
    await act(async () => fixture.read().begin());

    const draft = await finishDraft(fixture.read);
    assert.equal(Date.parse(draft.startedAt), START + 8 * DAY_MS);
    assert.ok(Date.parse(draft.completedAt) - Date.parse(draft.startedAt) < 7 * DAY_MS);
  } finally {
    await fixture.unmount();
  }
});

test("Start a new test interview clears the previous interview start time", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: START });
  const fixture = await mount();
  try {
    await enterLead(fixture.read);
    await act(async () => fixture.read().begin());
    await act(async () => fixture.read().setConsent("intakePermission", true));
    await act(async () => fixture.read().givePermission());
    const first = await finishDraft(fixture.read);

    t.mock.timers.tick(2 * 60 * 1000);
    await act(async () => fixture.read().startOver());
    await enterLead(fixture.read);
    await act(async () => fixture.read().begin());
    await act(async () => fixture.read().setConsent("intakePermission", true));
    await act(async () => fixture.read().givePermission());
    const second = await finishDraft(fixture.read);

    assert.notEqual(second.startedAt, first.startedAt);
    assert.ok(Date.parse(second.startedAt) >= Date.parse(first.startedAt) + 2 * 60 * 1000);
  } finally {
    await fixture.unmount();
  }
});
