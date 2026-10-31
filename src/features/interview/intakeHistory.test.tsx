import test from "node:test";
import assert from "node:assert/strict";
import { useCallback, useState } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useInterview, type InterviewHook } from "./useInterview";
import { useIntakeHistory, type IntakeHistoryEntry } from "./useIntakeHistory";

async function fixture(run: (context: {
  read: () => InterviewHook;
  writes: { entry: IntakeHistoryEntry; replace: boolean }[];
  restore: (entry: unknown) => Promise<void>;
  remount: (entry: unknown) => Promise<void>;
}) => Promise<void>) {
  let interview!: InterviewHook;
  let restore!: (entry: unknown) => void;
  const writes: { entry: IntakeHistoryEntry; replace: boolean }[] = [];
  function Harness({ initial }: { initial: unknown }) {
    const [entry, setEntry] = useState(initial);
    restore = setEntry;
    const write = useCallback((entry: IntakeHistoryEntry, replace: boolean) => {
      writes.push({ entry, replace });
      setEntry(entry);
    }, []);
    const navigation = useIntakeHistory(entry, write);
    interview = useInterview(navigation);
    return null;
  }
  let view!: ReactTestRenderer;
  await act(async () => { view = create(<Harness initial={null} />); });
  try {
    await run({
      read: () => interview, writes,
      restore: async (entry) => { await act(async () => restore(entry)); },
      remount: async (entry) => {
        await act(async () => view.unmount());
        await act(async () => { view = create(<Harness initial={entry} />); });
      },
    });
  } finally { await act(async () => view.unmount()); }
}
async function seed(read: () => InterviewHook) {
  await act(async () => {
    read().setLeadField("firstName", "Synthetic");
    read().setLeadField("lastName", "History");
    read().setLeadField("email", "history@example.invalid");
    read().setLeadField("state", "TX");
    read().setLeadField("dateOfBirth", "1980-01-01");
    read().setAdultAttested(true);
    read().setConsent("privacyAcknowledged", true);
  });
  await act(async () => read().begin());
}
async function review(read: () => InterviewHook) {
  await seed(read);
  await act(async () => read().setConsent("intakePermission", true));
  await act(async () => read().givePermission());
  await act(async () => read().setAnswer("ID-02", { value: "Synthetic private answer" }));
  await act(async () => read().finishInterview());
  await act(async () => read().confirmReview(true));
  assert.ok(read().draft);
}

test("history contains only screen metadata; Back/Forward preserves details and consent evidence in memory", async () => {
  await fixture(async ({ read, writes, restore }) => {
    await seed(read);
    const permission = writes.at(-1)!.entry;
    const lead = structuredClone(read().lead);
    const consent = structuredClone(read().consent);
    const key = read().submissionKey;
    assert.deepEqual(Object.keys(permission).sort(), ["session", "step"]);
    assert.equal(permission.step, "permission");
    assert.notEqual(permission.session, key, "history must not persist the submission operation key");
    assert.ok(!JSON.stringify(writes).match(/Synthetic|1980|example.invalid|answers|timestamps|submissionKey/));
    await restore(null);
    assert.equal(read().step, "lead");
    await restore(permission);
    assert.equal(read().step, "permission");
    assert.deepEqual(read().lead, lead);
    assert.deepEqual(read().consent, consent);
    assert.equal(read().submissionKey, key);
  });
});

test("review Back/Forward preserves answers, question position and unchanged-retry evidence", async () => {
  await fixture(async ({ read, writes, restore }) => {
    await review(read);
    const saved = structuredClone(read().draft);
    const key = read().submissionKey;
    const position = read().currentQuestionId;
    const interview = writes.find(({ entry }) => entry.step === "interview")!.entry;
    const reviewEntry = writes.at(-1)!.entry;
    await restore(interview);
    assert.equal(read().step, "interview");
    assert.equal(read().currentQuestionId, position);
    await restore(reviewEntry);
    assert.equal(read().step, "review");
    assert.deepEqual(read().draft, saved);
    assert.equal(read().submissionKey, key);
  });
});

test("history cannot bypass withdrawn intake permission", async () => {
  await fixture(async ({ read, writes, restore }) => {
    await review(read);
    const reviewEntry = writes.at(-1)!.entry;
    await act(async () => read().setConsent("intakePermission", false));
    await restore(reviewEntry);
    assert.equal(read().step, "permission");
    assert.equal(read().draft, null);
    assert.equal(read().consent.intakePermission, false);
  });
});

test("reload discards private state and ignores the previous visit's permission entry", async () => {
  await fixture(async ({ read, writes, remount }) => {
    await seed(read);
    const permission = writes.at(-1)!.entry;
    await remount(permission);
    assert.equal(read().step, "lead");
    assert.equal(read().lead.firstName, undefined);
    assert.deepEqual(read().answers, {});
    assert.equal(read().consent.privacyAcknowledged, false);
  });
});

test("Start over clears the draft and makes all previous screen entries inert", async () => {
  await fixture(async ({ read, writes, restore }) => {
    await review(read);
    const oldEntries = writes.map(({ entry }) => entry);
    const oldKey = read().submissionKey;
    await act(async () => read().startOver());
    assert.equal(writes.at(-1)!.replace, true);
    assert.notEqual(read().submissionKey, oldKey);
    assert.equal(read().draft, null);
    assert.deepEqual(read().answers, {});
    assert.deepEqual(read().prefilledIds, []);
    assert.deepEqual(read().acknowledgements, []);
    for (const oldEntry of oldEntries) {
      await restore(oldEntry);
      assert.equal(read().step, "lead");
      assert.equal(read().lead.firstName, undefined);
    }
  });
});

test("receipt remains terminal when navigating back to an old review entry", async () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  // Node has no browser window; only the hook's existing scroll effect needs it.
  if (!originalWindow) Object.defineProperty(globalThis, "window", { configurable: true, value: { scrollTo() {} } });
  try {
    await fixture(async ({ read, writes, restore }) => {
      await review(read);
      const reviewEntry = writes.at(-1)!.entry;
      await act(async () => read().markSubmitted({
        reference: "LPP-2026-HIST01", submittedAt: "2026-01-01T00:00:00Z", status: "submitted",
        notification: { state: "queued", attempts: 0, updatedAt: "2026-01-01T00:00:00Z" },
      }));
      assert.equal(writes.at(-1)!.replace, true);
      await restore(reviewEntry);
      assert.equal(read().step, "submitted");
      assert.equal(read().receipt?.reference, "LPP-2026-HIST01");
    });
  } finally { if (!originalWindow) Reflect.deleteProperty(globalThis, "window"); }
});

test("invalid screen metadata falls back to contact details", async () => {
  await fixture(async ({ read, writes, restore }) => {
    await seed(read);
    await restore({ session: writes.at(-1)!.entry.session, step: "invalid-screen" });
    assert.equal(read().step, "lead");
    assert.equal(read().lead.firstName, "Synthetic");
  });
});


test("two Continue activations before rendering add only one permission history entry", async () => {
  await fixture(async ({ read, writes, restore }) => {
    await seed(read);
    await restore(null);
    const count = writes.length;
    await act(async () => { read().begin(); read().begin(); });
    assert.equal(writes.length, count + 1);
    assert.equal(read().step, "permission");
  });
});
