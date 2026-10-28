/**
 * Regression guards for the suppression propagation worker.
 *
 * The worker must refuse an unsigned scheduler call and must not claim or
 * advance a row when no vendor webhook is configured.
 */

import { assertEquals } from "jsr:@std/assert@1.0.6";

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
  if (!handler) throw new Error("sync-marketing-suppressions handler was not captured");
  const headers: Record<string, string> = {};
  if (options.secret !== null) headers["x-cron-secret"] = options.secret ?? "test-cron-secret";

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
