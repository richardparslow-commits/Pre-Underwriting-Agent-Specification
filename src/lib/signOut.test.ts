import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SIGN_OUT_FAILURE, signOut } from "./api";

function client(signOutResult: { error: Error | null }) {
  let calls = 0;
  const fake = {
    auth: {
      async signOut() {
        calls++;
        return signOutResult;
      },
    },
  } as unknown as SupabaseClient;
  return { client: fake, calls: () => calls };
}

test("signOut rejects when Supabase reports a failure", async () => {
  const fake = client({ error: new Error("Synthetic private provider detail") });

  await assert.rejects(() => signOut(fake.client), {
    message: SIGN_OUT_FAILURE,
  });
  assert.equal(fake.calls(), 1);
});

test("signOut resolves only after Supabase confirms the session was revoked", async () => {
  const fake = client({ error: null });

  await signOut(fake.client);
  assert.equal(fake.calls(), 1);
});

test("signOut is a no-op when sign-in is not configured", async () => {
  await assert.doesNotReject(() => signOut(null));
});
