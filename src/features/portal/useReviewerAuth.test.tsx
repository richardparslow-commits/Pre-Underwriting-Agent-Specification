import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { SITE } from "@/config/site";
import { SIGN_OUT_FAILURE } from "@/lib/api";
import {
  SESSION_CHECK_FAILURE,
  useReviewerAuth,
} from "./useReviewerAuth";

type AuthState = ReturnType<typeof useReviewerAuth>;
type AuthClient = SupabaseClient["auth"];
interface FixtureOptions {
  signOut?: () => Promise<void>;
  auth?: AuthClient | null;
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function fixture(
  options: FixtureOptions,
  run: (read: () => AuthState) => Promise<void>,
) {
  let state!: AuthState;
  function Harness() {
    state = useReviewerAuth(options);
    return null;
  }

  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(<Harness />);
  });
  await settle();
  try {
    await run(() => state);
  } finally {
    await act(async () => view.unmount());
  }
}

function fakeAuth(
  getSession: () => Promise<{
    data: { session: { user: { email?: string | null } } | null };
    error: unknown;
  }>,
  assurance: {
    currentLevel: string | null;
    error: unknown;
  } = { currentLevel: "aal2", error: null },
  emitInitialNull = false,
): AuthClient {
  return {
    getSession,
    onAuthStateChange: (callback: (event: string, session: null) => void) => {
      if (emitInitialNull) {
        queueMicrotask(() => callback("INITIAL_SESSION", null));
      }
      return {
        data: { subscription: { unsubscribe() {} } },
      };
    },
    mfa: {
      getAuthenticatorAssuranceLevel: async () => ({
        data: assurance.error ? null : { currentLevel: assurance.currentLevel },
        error: assurance.error,
      }),
    },
  } as unknown as AuthClient;
}

test("a failed session check keeps the reviewer out of the signed-out state", async () => {
  const auth = fakeAuth(async () => ({
    data: { session: null },
    error: new Error("Synthetic private provider detail"),
  }));

  await fixture({ auth }, async (read) => {
    assert.equal(read().loading, false);
    assert.equal(read().sessionError, SESSION_CHECK_FAILURE);
    assert.ok(!read().sessionError?.includes("private provider"));
  });
});

test("an initial null auth event cannot erase a failed session check", async () => {
  const auth = fakeAuth(
    async () => ({
      data: { session: null },
      error: new Error("Synthetic sign-in service failure"),
    }),
    { currentLevel: "aal2", error: null },
    true,
  );

  await fixture({ auth }, async (read) => {
    assert.equal(read().sessionError, SESSION_CHECK_FAILURE);
  });
});

test("an unreadable assurance level is reported instead of demanding MFA", async () => {
  const auth = fakeAuth(
    async () => ({
      data: { session: { user: { email: SITE.reviewerEmail } } },
      error: null,
    }),
    {
      currentLevel: null,
      error: new Error("Synthetic private provider detail"),
    },
  );

  await fixture({ auth }, async (read) => {
    assert.equal(read().sessionError, SESSION_CHECK_FAILURE);
    assert.equal(read().needsMfa, false);
    assert.ok(!read().sessionError?.includes("private provider"));
  });
});

test("retrying a failed session check clears the error when the session is readable", async () => {
  let calls = 0;
  const auth = fakeAuth(async () => {
    calls++;
    if (calls === 1) {
      return {
        data: { session: null },
        error: new Error("Synthetic sign-in service failure"),
      };
    }
    return {
      data: { session: { user: { email: SITE.reviewerEmail } } },
      error: null,
    };
  });

  await fixture({ auth }, async (read) => {
    assert.equal(read().sessionError, SESSION_CHECK_FAILURE);

    await act(async () => read().retrySession());
    await settle();

    assert.equal(read().sessionError, null);
    assert.equal(read().needsMfa, false);
    assert.equal(calls, 2);
  });
});

test("a failed sign-out keeps the reviewer signed in and reports a safe error", async () => {
  await fixture(
    {
      signOut: async () => {
        throw new Error("Synthetic private provider detail");
      },
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
    {
      signOut: async () => {
        attempts++;
        if (attempts === 1) throw new Error("Synthetic sign-out failure");
      },
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
