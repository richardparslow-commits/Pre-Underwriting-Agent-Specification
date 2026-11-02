/**
 * Regression guards for the suppression propagation worker.
 *
 * The worker must refuse an unsigned scheduler call and must not claim or
 * advance a row when no vendor webhook is configured.
 */

import { assert, assertEquals } from "jsr:@std/assert@1.0.6";

type Handler = (request: Request) => Response | Promise<Response>;

let handler: Handler | undefined;

const originalServe = Deno.serve;
(Deno as unknown as { serve: unknown }).serve = (candidate: Handler) => {
  handler = candidate;
  return {} as unknown as Deno.HttpServer;
};

Deno.env.set("CRON_SECRET", "test-cron-secret");
Deno.env.delete("MARKETING_SUPPRESSION_WEBHOOK_URL");
Deno.env.delete("MARKETING_SUPPRESSION_WEBHOOK_SECRET");

await import("../sync-marketing-suppressions/index.ts");

(Deno as unknown as { serve: unknown }).serve = originalServe;

async function sync(
  options: {
    method?: string;
    secret?: string | null;
  } = {},
): Promise<Response> {
  if (!handler) {
    throw new Error("sync-marketing-suppressions handler was not captured");
  }
  const headers: Record<string, string> = {};
  if (options.secret !== null) {
    headers["x-cron-secret"] = options.secret ?? "test-cron-secret";
  }

  return await handler(
    new Request("http://localhost/sync-marketing-suppressions", {
      method: options.method ?? "POST",
      headers,
    }),
  );
}

Deno.test("rejects a method other than POST", async () => {
  const response = await sync({ method: "GET" });
  assertEquals(response.status, 405);
});

Deno.test("rejects a missing or wrong cron secret", async () => {
  const missing = await sync({ secret: null });
  assertEquals(missing.status, 401);

  const wrong = await sync({ secret: "wrong" });
  assertEquals(wrong.status, 401);
});

Deno.test("reports not configured without claiming pending rows", async () => {
  const response = await sync();
  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    inspected: 0,
    synced: 0,
    failed: 0,
    provider: "not_configured",
  });
});

type Claimed = {
  channel: "phone" | "email";
  address_normalized: string;
  vendor_address: string;
  claim_token: string;
};
function phone(address: string, token: number): Claimed {
  return {
    channel: "phone",
    address_normalized: address,
    vendor_address: "15125550101",
    claim_token: `00000000-0000-4000-8000-${String(token).padStart(12, "0")}`,
  };
}
async function configured(
  run: (fixture: {
    rows: Claimed[];
    statuses: Array<number | "stall">;
    marks: Array<boolean | "error">;
    claims: Record<string, unknown>[];
    completions: Record<string, unknown>[];
    sends: Array<{ key: string | null; body: Record<string, unknown> }>;
    sequence: string[];
    advance: (milliseconds: number) => void;
    breakClaim: () => void;
    invoke: () => Promise<Response>;
  }) => Promise<void>,
) {
  const values = {
    CRON_SECRET: "test-cron-secret",
    SUPABASE_URL: "http://database.test",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key",
    MARKETING_SUPPRESSION_WEBHOOK_URL:
      "https://vendor.example.invalid/suppress",
    MARKETING_SUPPRESSION_WEBHOOK_SECRET: "synthetic-vendor-key",
  };
  const saved = new Map(
    Object.keys(values).map((key) => [key, Deno.env.get(key)]),
  );
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  let now = originalNow();
  let perSend = 0;
  let claimError = false;
  const rows: Claimed[] = [],
    statuses: Array<number | "stall"> = [],
    marks: Array<boolean | "error"> = [];
  const claims: Record<string, unknown>[] = [],
    completions: Record<string, unknown>[] = [];
  const sends: Array<{ key: string | null; body: Record<string, unknown> }> =
    [];
  const sequence: string[] = [];
  Date.now = () => now;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.pathname.endsWith("/claim_next_marketing_suppression")) {
      sequence.push("claim");
      claims.push(await request.json());
      if (claimError) {
        return Response.json({
          code: "PGRST202",
          message: "Synthetic missing migration",
        }, { status: 404 });
      }
      const row = rows.shift();
      return Response.json(row ? [row] : []);
    }
    if (url.pathname.endsWith("/complete_marketing_suppression")) {
      sequence.push("complete");
      completions.push(await request.json());
      const result = marks.shift() ?? true;
      return result === "error"
        ? Response.json({
          code: "synthetic-error",
          message: "Synthetic failure",
        }, { status: 500 })
        : Response.json(result);
    }
    if (url.hostname === "vendor.example.invalid") {
      sequence.push("vendor");
      now += perSend;
      sends.push({
        key: request.headers.get("Idempotency-Key"),
        body: await request.json(),
      });
      const status = statuses.shift() ?? 204;
      if (status === "stall") {
        return await new Promise<Response>((_resolve, reject) => {
          request.signal.addEventListener(
            "abort",
            () =>
              reject(new DOMException("Synthetic vendor stall", "AbortError")),
            { once: true },
          );
        });
      }
      return new Response(null, { status });
    }
    throw new Error(`Unexpected synthetic path: ${url.pathname}`);
  }) as typeof fetch;
  try {
    for (const [key, value] of Object.entries(values)) Deno.env.set(key, value);
    await run({
      rows,
      statuses,
      marks,
      claims,
      completions,
      sends,
      sequence,
      advance: (milliseconds) => {
        perSend = milliseconds;
      },
      breakClaim: () => {
        claimError = true;
      },
      invoke: () => sync(),
    });
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalNow;
    for (const [key, value] of saved) {
      value === undefined ? Deno.env.delete(key) : Deno.env.set(key, value);
    }
  }
}

Deno.test("one-at-a-time claims send canonical phones but acknowledge exact legacy keys with ownership tokens", () =>
  configured(async (f) => {
    f.rows.push(phone("5125550101", 1), phone("15125550101", 2));
    assertEquals(await (await f.invoke()).json(), {
      inspected: 2,
      synced: 2,
      failed: 0,
      skipped: 0,
      provider: "webhook",
    });
    assertEquals(f.sequence, [
      "claim",
      "vendor",
      "complete",
      "claim",
      "vendor",
      "complete",
      "claim",
    ]);
    assertEquals(f.sends.map((send) => send.body.address), [
      "15125550101",
      "15125550101",
    ]);
    assertEquals(f.sends.map((send) => send.key), [
      "suppress:phone:15125550101",
      "suppress:phone:15125550101",
    ]);
    assertEquals(f.completions.map((row) => row.p_address), [
      "5125550101",
      "15125550101",
    ]);
    assertEquals(f.completions.map((row) => row.p_claim_token), [
      phone("", 1).claim_token,
      phone("", 2).claim_token,
    ]);
    assert(f.completions.every((row) => row.p_worker === f.claims[0].p_worker));
    assert(
      f.claims.every((row) =>
        row.p_lease_seconds === 600 && !("p_limit" in row)
      ),
    );
  }));

Deno.test("vendor refusals and outages are recorded through the owned retry path and do not stop subsequent work", () =>
  configured(async (f) => {
    f.rows.push(
      phone("5125550101", 1),
      phone("15125550101", 2),
      phone("15125550102", 3),
    );
    f.statuses.push(422, 503, 204);
    assertEquals(await (await f.invoke()).json(), {
      inspected: 3,
      synced: 1,
      failed: 2,
      skipped: 0,
      provider: "webhook",
    });
    assertEquals(f.completions.map((row) => row.p_state), [
      "failed",
      "failed",
      "synced",
    ]);
    assertEquals(f.completions.map((row) => row.p_detail), [
      "Vendor status 422",
      "Vendor status 503",
      null,
    ]);
  }));

Deno.test("lost ownership never counts a stale success or failure as applied", () =>
  configured(async (f) => {
    f.rows.push(phone("5125550101", 1), phone("15125550101", 2));
    f.statuses.push(204, 422);
    f.marks.push(false, false);
    assertEquals(await (await f.invoke()).json(), {
      inspected: 2,
      synced: 0,
      failed: 0,
      skipped: 2,
      provider: "webhook",
    });
  }));

Deno.test("a stalled vendor is aborted and retained for retry before subsequent work runs", () =>
  configured(async (f) => {
    f.rows.push(phone("5125550101", 1), phone("15125550102", 2));
    f.statuses.push("stall", 204);
    assertEquals(await (await f.invoke()).json(), {
      inspected: 2,
      synced: 1,
      failed: 1,
      skipped: 0,
      provider: "webhook",
    });
    assertEquals(f.completions.map((row) => row.p_state), ["failed", "synced"]);
  }));

Deno.test("a slow run stops claiming new rows instead of reserving a batch whose lease could expire", () =>
  configured(async (f) => {
    for (let i = 1; i <= 10; i++) f.rows.push(phone("5125550101", i));
    f.advance(8_000);
    const result = await (await f.invoke()).json();
    assertEquals(result.inspected, 4);
    assertEquals(f.claims.length, 4);
    assertEquals(f.rows.length, 6);
    assertEquals(f.completions.length, 4);
  }));

Deno.test("an invalid stored phone is retained as a failure rather than transmitted or marked synced", () =>
  configured(async (f) => {
    f.rows.push({ ...phone("123", 1), vendor_address: "123" });
    const result = await (await f.invoke()).json();
    assertEquals(result.failed, 1);
    assertEquals(result.synced, 0);
    assertEquals(f.sends.length, 0);
    assertEquals(f.completions[0].p_state, "failed");
  }));

Deno.test("a missing migration fails before contacting the vendor", () =>
  configured(async (f) => {
    f.breakClaim();
    assertEquals((await f.invoke()).status, 500);
    assertEquals(f.sends.length, 0);
  }));

Deno.test("an unfenced claim cannot reach the vendor", () =>
  configured(async (f) => {
    f.rows.push({ ...phone("5125550101", 1), claim_token: "" });
    assertEquals((await f.invoke()).status, 500);
    assertEquals(f.sends.length, 0);
  }));

Deno.test("an acknowledgement write error is reported and never counted as synced", () =>
  configured(async (f) => {
    f.rows.push(phone("5125550101", 1));
    f.marks.push("error");
    assertEquals(await (await f.invoke()).json(), {
      inspected: 1,
      synced: 0,
      failed: 1,
      skipped: 0,
      provider: "webhook",
    });
  }));
