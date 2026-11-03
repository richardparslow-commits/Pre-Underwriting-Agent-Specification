import test from "node:test";
import assert from "node:assert/strict";
import { unenrollPendingFactor } from "./pendingFactorRecovery";
const token = (aal: string) =>
  `header.${btoa(JSON.stringify({ aal, sub: "synthetic-user" }))}.signature`;
const options = () => ({
  url: "https://synthetic.supabase.invalid",
  key: "synthetic-public-key",
  factorId: "owned-factor",
  getSession: async () => ({
    data: { session: { access_token: token("aal1") } },
    error: null,
  }),
});
test("removal pins the captured AAL1 token even when another tab upgrades the shared session", async () => {
  let shared = token("aal1");
  const captured = shared;
  let calls = 0;
  const result = await unenrollPendingFactor({
    ...options(),
    getSession: async () => {
      const snapshot = shared;
      shared = token("aal2");
      return { data: { session: { access_token: snapshot } }, error: null };
    },
    fetcher: async (url, init) => {
      calls++;
      assert.equal(
        url,
        "https://synthetic.supabase.invalid/auth/v1/factors/owned-factor",
      );
      assert.equal(init?.method, "DELETE");
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        `Bearer ${captured}`,
      );
      assert.equal(init?.credentials, "omit");
      assert.equal(init?.redirect, "error");
      assert.equal(init?.cache, "no-store");
      assert.equal(shared, token("aal2"));
      return new Response(JSON.stringify({ id: "owned-factor" }), {
        status: 200,
      });
    },
  });
  assert.equal(result.error, null);
  assert.equal(calls, 1);
});
test("AAL2, missing or malformed tokens and failed session reads never issue removal", async () => {
  for (const value of [
    token("aal2"),
    "invalid",
    "header.bad-json.signature",
    null,
  ]) {
    let calls = 0;
    const r = await unenrollPendingFactor({
      ...options(),
      getSession: async () => ({
        data: { session: value ? { access_token: value } : null },
        error: null,
      }),
      fetcher: async () => {
        calls++;
        throw new Error("must not run");
      },
    });
    assert.ok(r.error);
    assert.equal(calls, 0);
  }
  let calls = 0;
  assert.ok(
    (
      await unenrollPendingFactor({
        ...options(),
        getSession: async () => ({
          data: { session: { access_token: token("aal1") } },
          error: new Error("Synthetic expired"),
        }),
        fetcher: async () => {
          calls++;
          throw new Error();
        },
      })
    ).error,
  );
  assert.equal(calls, 0);
});
test("server denial of a now-verified factor is never retried with upgraded credentials", async () => {
  let calls = 0;
  let sessions = 0;
  const r = await unenrollPendingFactor({
    ...options(),
    getSession: async () => {
      sessions++;
      return {
        data: { session: { access_token: token("aal1") } },
        error: null,
      };
    },
    fetcher: async () => {
      calls++;
      return new Response(
        JSON.stringify({ message: "Synthetic private provider detail" }),
        { status: 403 },
      );
    },
  });
  assert.ok(r.error);
  assert.equal(calls, 1);
  assert.equal(sessions, 1);
  assert.ok(!String(r.error).includes("private provider"));
});
test("mismatched or malformed successful acknowledgements fail closed", async () => {
  for (const body of [
    JSON.stringify({ id: "foreign-factor" }),
    "{}",
    "not-json",
  ])
    assert.ok(
      (
        await unenrollPendingFactor({
          ...options(),
          fetcher: async () => new Response(body, { status: 200 }),
        })
      ).error,
    );
});
test("transport and redirect failures remain generic and never retry deletion", async () => {
  let calls = 0;
  const r = await unenrollPendingFactor({
    ...options(),
    fetcher: async () => {
      calls++;
      throw new Error("Synthetic private transport detail");
    },
  });
  assert.ok(r.error);
  assert.equal(calls, 1);
  assert.ok(!String(r.error).includes("private transport"));
});
