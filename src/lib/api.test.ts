import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { listLiveCases } from "./api";

const submittedAt = "2026-10-29T12:00:00.000Z";

function fakeClient(size: number, failCount = false) {
  const requests: Array<{ method: string; cursor: string | null }> = [];
  const rows = Array.from({ length: size }, (_, index) => ({
    reference: `CASE-${String(size - index).padStart(4, "0")}`,
    submitted_at: submittedAt,
    status: "submitted",
    notification_state: "queued",
    crisis_disclosure: false,
    first_name: "Test",
    last_name: "Case",
    residence_state: "TX",
    unanswered: 0,
  }));
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const cursor = url.searchParams.get("or");
    const method = init?.method ?? "GET";
    requests.push({ method, cursor });
    if (method === "HEAD") {
      if (failCount) return new Response(null, { status: 500 });
      return new Response(null, { status: 200, headers: { "content-range": `*/${size}` } });
    }
    const reference = cursor?.match(/reference\.lt\.([^,)]+)/)?.[1];
    const matching = reference ? rows.filter((row) => row.reference < reference) : rows;
    const page = matching.slice(0, 26);
    return new Response(JSON.stringify(page), {
      status: 200,
      headers: { "content-type": "application/json", "content-range": `0-${Math.max(0, page.length - 1)}/${matching.length}` },
    });
  };
  return { client: createClient("https://example.test", "test-key", { global: { fetch: fetcher } }), requests };
}

test("queue totals stay global across cursor pages, including tied timestamps", async () => {
  const { client, requests } = fakeClient(282);
  const first = await listLiveCases(client);
  assert.equal(first.items.length, 25);
  assert.equal(first.total, 282);
  assert.ok(first.nextCursor);
  const second = await listLiveCases(client, first.nextCursor);
  assert.equal(second.items.length, 25);
  assert.equal(second.total, 282);
  assert.equal(new Set([...first.items, ...second.items].map((item) => item.reference)).size, 50);
  assert.ok(second.nextCursor);
  assert.equal(requests.filter((request) => request.method === "HEAD").length, 1);
  assert.equal(requests.find((request) => request.method === "HEAD")?.cursor, null);
  assert.ok(requests.find((request) => request.method === "GET" && request.cursor));
});

test("empty and exactly full queues report their actual total without another page", async () => {
  for (const size of [0, 25]) {
    const { client } = fakeClient(size);
    const page = await listLiveCases(client);
    assert.equal(page.total, size);
    assert.equal(page.items.length, size);
    assert.equal(page.nextCursor, null);
  }
});

test("a failed queue-wide count is not reported as a smaller successful total", async () => {
  const { client } = fakeClient(50, true);
  const first = await listLiveCases(client);
  assert.ok(first.nextCursor);
  await assert.rejects(listLiveCases(client, first.nextCursor), /Cases could not be loaded/);
});
