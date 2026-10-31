import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { readCaseQueue } from "./queuePaging";

// The real PostgREST client calls this disposable HTTP fixture. No hosted rows,
// credentials or reviewer sessions are used.
function fixture(size = 282) {
  const row = (number: number) => ({
    reference: `LPP-2026-Q${String(number).padStart(5, "0")}`,
    submitted_at: "2026-01-01T00:00:00+00:00",
    status: "submitted",
    notification_state: "queued",
    crisis_disclosure: false,
    first_name: "Synthetic",
    last_name: "Case",
    residence_state: "TX",
    unanswered: 0,
  });
  const state = {
    rows: Array.from({ length: size }, (_, i) => row(size - i)),
    calls: [] as { url: URL; method: string }[],
    countFails: false,
    pageFails: false,
    missingCount: false,
  };
  const client = createClient("https://queue.example.invalid", "synthetic-public-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        state.calls.push({ url, method });
        assert.equal(url.pathname, "/rest/v1/case_summaries");
        assert.ok(!url.searchParams.get("select")?.match(/payload|answers/));
        const isCount = method === "HEAD";
        if ((isCount && state.countFails) || (!isCount && state.pageFails)) {
          return new Response(JSON.stringify({ message: "Synthetic request failure" }), {
            status: 500,
          });
        }
        const before = url.searchParams.get("or")?.match(/reference\.lt\.([^)]*)/)?.[1];
        const matching = state.rows.filter((item) => !before || item.reference < before);
        const limit = Number(url.searchParams.get("limit") ?? matching.length);
        const items = matching.slice(0, limit);
        const wantsCount = new Headers(init?.headers).get("prefer")?.includes("count=exact");
        const count = state.missingCount ? "*" : String(matching.length);
        return new Response(isCount ? null : JSON.stringify(items), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...(wantsCount
              ? { "Content-Range": `0-${Math.max(0, items.length - 1)}/${count}` }
              : {}),
          },
        });
      },
    },
  });
  return { state, client, row };
}

test("282-case queue keeps its total across every page, including the final partial page", async () => {
  const { state, client } = fixture();
  const references: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await readCaseQueue(client, cursor);
    assert.equal(page.total, 282);
    assert.ok(page.items.length <= 25);
    references.push(...page.items.map((item) => item.reference));
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  assert.equal(references.length, 282);
  assert.equal(new Set(references).size, 282);
  assert.deepEqual(
    references,
    state.rows.map((item) => item.reference),
  );
  const counts = state.calls.filter((call) => call.method === "HEAD");
  assert.equal(counts.length, 12);
  for (const { url } of counts) {
    assert.equal(url.searchParams.get("select"), "reference");
    assert.equal(url.searchParams.has("or"), false);
    assert.equal(url.searchParams.has("limit"), false);
  }
  for (const { url } of state.calls.filter((call) => call.method === "GET")) {
    assert.equal(url.searchParams.get("limit"), "26");
    assert.equal(url.searchParams.get("order"), "submitted_at.desc,reference.desc");
  }
});

test("later pages refresh the total after insertions and deletions without repeating the head page", async () => {
  const { state, client, row } = fixture();
  const first = await readCaseQueue(client);
  state.rows.unshift(row(283));
  const second = await readCaseQueue(client, first.nextCursor!);
  assert.equal(second.total, 283);
  assert.equal(second.items[0]?.reference, row(257).reference);
  state.rows.pop();
  const third = await readCaseQueue(client, second.nextCursor!);
  assert.equal(third.total, 282);
  assert.equal(third.items[0]?.reference, row(232).reference);
});

test("empty queues have a real zero total and no continuation", async () => {
  const { client } = fixture(0);
  assert.deepEqual(await readCaseQueue(client), { items: [], total: 0, nextCursor: null });
});

for (const failure of ["countFails", "pageFails", "missingCount"] as const) {
  test(`${failure} rejects the page instead of displaying a fabricated total`, async () => {
    const { state, client } = fixture();
    state[failure] = true;
    await assert.rejects(readCaseQueue(client), /Cases could not be loaded/);
  });
}

test("malformed continuation fails before issuing any query", async () => {
  const { state, client } = fixture();
  await assert.rejects(readCaseQueue(client, "invalid"), /cursor is not valid/);
  assert.equal(state.calls.length, 0);
});
