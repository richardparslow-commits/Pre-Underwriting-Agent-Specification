import { assertEquals } from "jsr:@std/assert@1.0.6";

type Handler = (request: Request) => Response | Promise<Response>;
let handler: Handler | undefined;
const originalServe = Deno.serve;
(Deno as unknown as { serve: unknown }).serve = (candidate: Handler) => {
  handler = candidate;
  return {} as unknown as Deno.HttpServer;
};
await import("../email-events/index.ts");
(Deno as unknown as { serve: unknown }).serve = originalServe;

const secretBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
const secret = `whsec_${btoa(String.fromCharCode(...secretBytes))}`;

async function signedRequest(): Promise<Request> {
  const id = "evt_test_123";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = JSON.stringify({ type: "email.delivered", data: { email_id: "msg_123" } });
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)));
  return new Request("http://localhost/email-events", {
    method: "POST",
    headers: { "svix-id": id, "svix-timestamp": timestamp, "svix-signature": `v1,${btoa(String.fromCharCode(...signature))}` },
    body,
  });
}

Deno.test("signed unmatched delivery events request retry; applied events acknowledge", async () => {
  if (!handler) throw new Error("email-events handler was not captured");
  const savedFetch = globalThis.fetch;
  const names = ["EMAIL_WEBHOOK_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
  const saved = names.map((name) => Deno.env.get(name));
  Deno.env.set("EMAIL_WEBHOOK_SECRET", secret);
  Deno.env.set("SUPABASE_URL", "http://localhost:54321");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
  let result = "unmatched";
  globalThis.fetch = ((_input: RequestInfo | URL) => Promise.resolve(new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" },
  }))) as typeof fetch;
  try {
    const pending = await handler(await signedRequest());
    assertEquals(pending.status, 503);
    assertEquals(await pending.json(), { error: "Event not yet correlated" });
    result = "applied";
    const applied = await handler(await signedRequest());
    assertEquals(applied.status, 200);
    assertEquals(await applied.json(), { ok: true, result: "applied" });
    result = "duplicate";
    assertEquals((await handler(await signedRequest())).status, 200);
  } finally {
    globalThis.fetch = savedFetch;
    names.forEach((name, index) => {
      const value = saved[index];
      if (value === undefined) Deno.env.delete(name);
      else Deno.env.set(name, value);
    });
  }
});
