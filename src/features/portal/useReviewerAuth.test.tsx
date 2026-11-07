import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { SITE } from "@/config/site";
import { SIGN_OUT_FAILURE } from "@/lib/api";
import { useReviewerAuth } from "./useReviewerAuth";

type AuthState = ReturnType<typeof useReviewerAuth>;

async function fixture(
  leaveSignOut: () => Promise<void>,
  run: (read: () => AuthState) => Promise<void>,
) {
  let state!: AuthState;
  function Harness() {
    state = useReviewerAuth({ signOut: leaveSignOut });
    return null;
  }

  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(<Harness />);
  });
  try {
    await run(() => state);
  } finally {
    await act(async () => view.unmount());
  }
}

test("a failed sign-out keeps the reviewer signed in and reports a safe error", async () => {
  await fixture(
    async () => {
      throw new Error("Synthetic private provider detail");
    },
    async (read) => {
      await act(async () => read().unlockPreview());
      assert.equal(read().signedIn, true);

      await act(async () => {
        await read().leave();
      });

      assert.equal(read().signedIn, true);
      assert.equal(read().email, SITE.reviewerEmail);
      assert.equal(read().leaveError, SIGN_OUT_FAILURE);
      assert.ok(!read().leaveError?.includes("private provider"));
    },
  );
});

test("a successful sign-out retry clears the error and ends the session", async () => {
  let attempts = 0;
  await fixture(
    async () => {
      attempts++;
      if (attempts === 1) throw new Error("Synthetic sign-out failure");
    },
    async (read) => {
      await act(async () => read().unlockPreview());
      await act(async () => {
        await read().leave();
      });
      assert.equal(read().signedIn, true);
      assert.equal(read().leaveError, SIGN_OUT_FAILURE);

      await act(async () => {
        await read().leave();
      });

      assert.equal(read().signedIn, false);
      assert.equal(read().email, null);
      assert.equal(read().leaveError, null);
    },
  );
});
