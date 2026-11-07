import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SIGN_IN_CONNECTION_LOST, sendSignInLink } from "./api";

// The function is browser-only; give it just enough origin to build its redirect.
(globalThis as { window?: { location: { origin: string } } }).window = {
  location: { origin: "https://example.test" },
};

function fakeClient(
  error: { code?: string; name?: string; message?: string } | null = null,
) {
  const calls: Array<Record<string, unknown>> = [];
  const client = {
    auth: {
      signInWithOtp: async (payload: Record<string, unknown>) => {
        calls.push(payload);
        return { data: { user: null, session: null }, error };
      },
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

function throwingClient(error: unknown) {
  return {
    auth: {
      signInWithOtp: async () => {
        throw error;
      },
    },
  } as unknown as SupabaseClient;
}

for (const code of ["otp_disabled", "user_not_found", "signup_disabled"]) {
  test(`an unknown address refusal (${code}) looks like a sent link`, async () => {
    const { client } = fakeClient({ code, message: "Synthetic refusal" });
    await assert.doesNotReject(sendSignInLink("unknown@example.test", client));
  });
}

test("a lost connection is named instead of a generic send failure", async () => {
  const { client } = fakeClient({
    name: "AuthRetryableFetchError",
    message: "Failed to fetch",
  });
  await assert.rejects(sendSignInLink("reviewer@example.test", client), (failure: Error) => {
    assert.equal(failure.message, SIGN_IN_CONNECTION_LOST);
    assert.match(failure.message, /connection was lost/i);
    assert.doesNotMatch(failure.message, /Failed to fetch|AuthRetryable/i);
    return true;
  });
});

test("a thrown lost connection is named instead of a generic send failure", async () => {
  await assert.rejects(
    sendSignInLink("reviewer@example.test", throwingClient(new TypeError("Failed to fetch"))),
    { message: SIGN_IN_CONNECTION_LOST },
  );
});

test("a successful request keeps the no-signup options and the portal redirect", async () => {
  const { client, calls } = fakeClient();
  await sendSignInLink("reviewer@example.test", client);
  assert.equal(calls.length, 1);
  const payload = calls[0];
  assert.ok(payload);
  assert.equal(payload.email, "reviewer@example.test");
  assert.deepEqual(payload.options, {
    shouldCreateUser: false,
    emailRedirectTo: "https://example.test/portal",
  });
});

for (const error of [
  { code: "over_email_send_rate_limit", message: "Synthetic private provider detail" },
  { message: "Synthetic transport failure" },
]) {
  test(`a real send failure still surfaces without provider detail (${error.code ?? "no code"})`, async () => {
    const { client } = fakeClient(error);
    await assert.rejects(sendSignInLink("reviewer@example.test", client), (failure: Error) => {
      assert.equal(failure.message, "The sign-in link could not be sent.");
      assert.doesNotMatch(failure.message, /Synthetic|rate|private/i);
      return true;
    });
  });
}

test("an unconfigured auth client still fails closed", async () => {
  await assert.rejects(sendSignInLink("reviewer@example.test", null), {
    message: "Sign-in is not configured.",
  });
});
