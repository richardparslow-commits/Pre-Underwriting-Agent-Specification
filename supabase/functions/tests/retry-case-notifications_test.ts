import { assert, assertEquals } from "jsr:@std/assert@1.0.6";

type Handler = (request: Request) => Response | Promise<Response>;
let handler!: Handler;
const originalServe = Deno.serve;
(Deno as unknown as { serve: unknown }).serve = (candidate: Handler) => {
  handler = candidate;
  return {} as Deno.HttpServer;
};
try {
  await import("../retry-case-notifications/index.ts");
} finally {
  (Deno as unknown as { serve: unknown }).serve = originalServe;
}

type Row = {
  reference: string;
  submitted_at: string;
  notification_state: string;
  notification_attempts: number;
  notification_next_attempt_at: string | null;
  notification_claimed_at: string | null;
  notification_first_attempted_at: string | null;
};
const iso = (time: number) => new Date(time).toISOString();
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { "content-type": "application/json" },
});

async function withFixture(run: (data: {
  rows: Row[];
  requests: URL[];
  claims: string[];
  sends: string[];
  invoke: (body?: object) => Promise<Response>;
  race: Set<string>;
}) => Promise<void>) {
  const values = {
    SUPABASE_URL: "http://database.test",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key",
    RESEND_API_KEY: "synthetic-provider-key",
    APP_ORIGIN: "http://localhost:5173",
    CRON_SECRET: "synthetic-cron-secret",
  };
  const saved = new Map(Object.keys(values).map((key) => [key, Deno.env.get(key)]));
  for (const [key, value] of Object.entries(values)) Deno.env.set(key, value);
  const originalFetch = globalThis.fetch;
  const rows: Row[] = [];
  const requests: URL[] = [];
  const claims: string[] = [];
  const sends: string[] = [];
  const race = new Set<string>();
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    requests.push(url);
    if (url.pathname === "/rest/v1/cases") {
      const ors = url.searchParams.getAll("or");
      // Apply each independent PostgREST OR clause before the requested limit.
      const matches = rows.filter((row) => {
        if (!(["queued", "failed", "not_sent"].includes(row.notification_state))) return false;
        if (row.notification_attempts >= 5) return false;
        if (row.submitted_at <= url.searchParams.get("submitted_at")!.slice(3)) return false;
        const ages = url.searchParams.getAll("submitted_at");
        const upper = ages.find((value) => value.startsWith("lt."));
        if (upper && row.submitted_at >= upper.slice(3)) return false;
        const ref = url.searchParams.get("reference");
        if (ref && row.reference !== ref.slice(3)) return false;
        for (const clause of ors) {
          const match = clause.match(/^\((notification_[a-z_]+)\.is\.null,\1\.(lt|lte|gt)\.(.+)\)$/);
          assert(match, `Unexpected OR filter: ${clause}`);
          const value = row[match[1] as keyof Row];
          if (value === null) continue;
          const time = Date.parse(String(value));
          const bound = Date.parse(match[3]);
          if (match[2] === "lt" && !(time < bound)) return false;
          if (match[2] === "lte" && !(time <= bound)) return false;
          if (match[2] === "gt" && !(time > bound)) return false;
        }
        return true;
      });
      matches.sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));
      return json(matches.slice(0, Number(url.searchParams.get("limit"))));
    }
    if (url.pathname === "/rest/v1/rpc/claim_case_notification") {
      const { p_reference } = await request.json();
      claims.push(p_reference);
      const row = rows.find((item) => item.reference === p_reference)!;
      const now = Date.now();
      const due = !row.notification_next_attempt_at || Date.parse(row.notification_next_attempt_at) <= now;
      const free = !row.notification_claimed_at || Date.parse(row.notification_claimed_at) < now - 600_000;
      return json(due && free && !race.has(p_reference) ? [row] : []);
    }
    if (url.pathname === "/rest/v1/rpc/complete_case_notification") return json(null);
    if (url.hostname === "api.resend.com") {
      sends.push(request.headers.get("idempotency-key") ?? "");
      return json({ id: "synthetic-message" });
    }
    throw new Error(`Unexpected synthetic request: ${url.pathname}`);
  }) as typeof fetch;
  try {
    await run({ rows, requests, claims, sends, race, invoke: (body) => Promise.resolve(handler(
      new Request("http://localhost/retry", {
        method: "POST", headers: { "x-cron-secret": values.CRON_SECRET },
        body: body ? JSON.stringify(body) : undefined,
      }),
    )) });
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of saved) value === undefined ? Deno.env.delete(key) : Deno.env.set(key, value);
  }
}

Deno.test("due notifications are not starved by older backoff and active leases", () => withFixture(async ({ rows, requests, claims, sends, invoke }) => {
  const now = Date.now();
  const row = (number: number, patch: Partial<Row> = {}): Row => ({
    reference: `LPP-2026-${String(number).padStart(6, "0")}`,
    submitted_at: iso(now - 3_600_000 + number * 1000),
    notification_state: "failed", notification_attempts: 1,
    notification_next_attempt_at: null, notification_claimed_at: null,
    notification_first_attempted_at: iso(now - 3_600_000), ...patch,
  });
  for (let i = 0; i < 20; i++) rows.push(row(i, { notification_next_attempt_at: iso(now + 600_000) }));
  for (let i = 20; i < 40; i++) rows.push(row(i, { notification_claimed_at: iso(now - 60_000) }));
  rows.push(row(40, { notification_next_attempt_at: iso(now - 1000), notification_claimed_at: iso(now - 601_000) }));
  rows.push(row(41));
  rows.push(row(42, { notification_first_attempted_at: iso(now - 25 * 3_600_000) }));
  rows.push(row(43, { notification_attempts: 5 }));
  const response = await invoke();
  assertEquals(response.status, 200);
  assertEquals(await response.json(), { inspected: 2, sent: 2, failed: 0, skipped: 0 });
  assertEquals(claims, [rows[40].reference, rows[41].reference]);
  assertEquals(sends, claims);
  const query = requests.find((url) => url.pathname === "/rest/v1/cases")!;
  assertEquals(query.searchParams.get("limit"), "20");
  assertEquals(query.searchParams.getAll("or").length, 3);
}));

Deno.test("targeted retries also respect backoff and active leases", () => withFixture(async ({ rows, claims, sends, invoke }) => {
  const now = Date.now();
  const reference = "LPP-2026-000001";
  const row: Row = { reference, submitted_at: iso(now - 60_000), notification_state: "failed", notification_attempts: 1,
    notification_next_attempt_at: iso(now + 60_000), notification_claimed_at: null, notification_first_attempted_at: iso(now - 60_000) };
  rows.push(row);
  assertEquals(await (await invoke({ reference })).json(), { inspected: 0, sent: 0, failed: 0, skipped: 0 });
  row.notification_next_attempt_at = null;
  row.notification_claimed_at = iso(now - 60_000);
  assertEquals(await (await invoke({ reference })).json(), { inspected: 0, sent: 0, failed: 0, skipped: 0 });
  row.notification_claimed_at = iso(now - 601_000);
  assertEquals(await (await invoke({ reference })).json(), { inspected: 1, sent: 1, failed: 0, skipped: 0 });
  assertEquals(claims, [reference]);
  assertEquals(sends, [reference]);
}));

Deno.test("a concurrent claim is still checked by the authoritative RPC", () => withFixture(async ({ rows, race, claims, sends, invoke }) => {
  const now = Date.now();
  const reference = "LPP-2026-000001";
  rows.push({ reference, submitted_at: iso(now - 300_000), notification_state: "queued", notification_attempts: 0,
    notification_next_attempt_at: null, notification_claimed_at: null, notification_first_attempted_at: null });
  race.add(reference);
  const response = await invoke();
  assertEquals(await response.json(), { inspected: 1, sent: 0, failed: 0, skipped: 1 });
  assertEquals(claims, [reference]);
  assertEquals(sends, []);
}));
