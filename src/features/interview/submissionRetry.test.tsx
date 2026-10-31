import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { type InterviewHook, useInterview } from "./useInterview";
import { sameSubmissionContent } from "../../../supabase/functions/_shared/submission-content";

async function interview(run: (read: () => InterviewHook) => Promise<void>) {
  let state!: InterviewHook;
  function Harness() {
    state = useInterview();
    return null;
  }
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(<Harness />);
  });
  try {
    await act(async () => {
      for (
        const [field, value] of Object.entries({
          firstName: "Synthetic",
          lastName: "Retry",
          state: "TX",
          dateOfBirth: "1980-01-01",
          email: "synthetic@example.invalid",
        })
      ) {
        state.setLeadField(field as "firstName", value);
      }
      state.setAdultAttested(true);
      state.setConsent("intakePermission", true);
      state.setConsent("privacyAcknowledged", true);
      state.setAnswer("ID-02", { value: "Texas" });
      state.finishInterview();
    });
    await act(async () => state.confirmReview(true));
    assert.ok(state.draft);
    await run(() => state);
  } finally {
    await act(async () => view.unmount());
  }
}

test("lost response: unchecking and rechecking preserves the payload required for original receipt replay", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  await interview(async (read) => {
    const saved = structuredClone(read().draft!);
    const key = read().submissionKey;
    for (let retry = 0; retry < 3; retry++) {
      t.mock.timers.tick(1000);
      await act(async () => read().confirmReview(false));
      assert.equal(read().draft, null, "unchecked review cannot be submitted");
      assert.equal(read().acknowledgements.length, 0);
      await act(async () => read().confirmReview(true));
      assert.equal(read().submissionKey, key);
      assert.equal(
        sameSubmissionContent(saved, read().draft),
        true,
        "the unchanged retry must satisfy the unchanged server replay comparison",
      );
    }
  });
});

test("repeated confirmation of an unchanged review does not restamp its evidence", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  await interview(async (read) => {
    const before = structuredClone(read().acknowledgements);
    t.mock.timers.tick(1000);
    await act(async () => read().confirmReview(true));
    assert.deepEqual(read().acknowledgements, before);
  });
});

for (
  const edit of ["contact", "answer", "adult", "privacy", "permission"] as const
) {
  test(`${edit} edit invalidates confirmation and cannot replay a saved unchanged case`, async (t) => {
    t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
    await interview(async (read) => {
      const saved = structuredClone(read().draft!);
      const key = read().submissionKey;
      t.mock.timers.tick(1000);
      await act(async () => {
        if (edit === "contact") {
          read().setLeadField("email", "corrected@example.invalid");
        }
        if (edit === "answer") {
          read().setAnswer("ID-02", { value: "New Mexico" });
        }
        if (edit === "adult") read().setAdultAttested(false);
        if (edit === "privacy") read().setConsent("privacyAcknowledged", false);
        if (edit === "permission") read().setConsent("intakePermission", false);
      });
      assert.equal(read().draft, null);
      assert.equal(read().acknowledgements.length, 0);
      await act(async () => {
        if (edit === "adult") read().setAdultAttested(true);
        if (edit === "privacy") read().setConsent("privacyAcknowledged", true);
        if (edit === "permission") read().setConsent("intakePermission", true);
      });
      t.mock.timers.tick(1000);
      await act(async () => read().confirmReview(true));
      assert.equal(
        read().submissionKey,
        key,
        "edits cannot escape saved-case conflict detection",
      );
      assert.ok(read().draft);
      assert.notEqual(
        read().acknowledgements[0]!.timestamp,
        saved.acknowledgements[0]!.timestamp,
      );
      assert.equal(sameSubmissionContent(saved, read().draft), false);
    });
  });
}

test("start over discards retained confirmation and creates a different operation", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  await interview(async (read) => {
    const key = read().submissionKey;
    const timestamp = read().acknowledgements[0]!.timestamp;
    t.mock.timers.tick(1000);
    await act(async () => read().startOver());
    assert.notEqual(read().submissionKey, key);
    assert.equal(read().draft, null);
    assert.equal(read().acknowledgements.length, 0);
    await act(async () => read().confirmReview(true));
    assert.notEqual(read().acknowledgements[0]!.timestamp, timestamp);
  });
});
