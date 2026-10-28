/**
 * Regression guards for the public marketing opt-out handler.
 *
 * These call the real handler with the browser form bypassed. They prove the
 * origin allowlist, byte cap, contact validation and fail-closed rate limiter
 * run before a revocation can reach the database.
 */

import { assertEquals, assertNotEquals } from "jsr:@std/assert@1.0.6";

type Handler = (request: Request) => Response | Promise<Response>;

let handler: Handler | undefined;

const originalServe = Deno.serve;
(Deno as unknown as { serve: unknown }).serve = (candidate: Handler) => {
  handler = candidate;
  return {} as unknown as Deno.HttpServer;
};

Deno.env.set("ENVIRONMENT", "test");
Deno.env.set("APP_ORIGIN", "http://localhost:5173");

const revokeModule = await import("../revoke-marketing/index.ts");
const requestIdFromIdempotencyKey = revokeModule.requestIdFromIdempotencyKey;

(Deno as unknown as { serve: unknown }).serve = originalServe;

async function revoke(
  body: unknown,
  options: {
    method?: string;
    origin?: string | null;
    rawBody?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<Response> {
  if (!handler) throw new Error("revoke-marketing handler was not captured");
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (options.origin !== null) headers.origin = options.origin ?? "http://localhost:5173";
  Object.assign(headers, options.headers ?? {});

  return await handler(
    new Request("http://localhost/revoke-marketing", {
      method: options.method ?? "POST",
      headers,
      body: options.method === "GET" ? undefined : (options.rawBody ?? JSON.stringify(body)),
    }),
  );
}

async function errorFrom(response: Response): Promise<string> {
  const body = (await response.json()) as { error?: string };
  return body.error ?? "";
}

Deno.test("derives a stable UUID from the idempotency key", async () => {
  const first = await requestIdFromIdempotencyKey("form-attempt-123");
  const replay = await requestIdFromIdempotencyKey("form-attempt-123");
  const different = await requestIdFromIdempotencyKey("form-attempt-124");

  assertEquals(first, replay);
  assertNotEquals(first, different);
  assertEquals(
    /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(first),
    true,
  );
});

Deno.test("rejects a malformed idempotency key", async () => {
  const response = await revoke(
    { reference: "LPP-2026-ABC123", phone: "5125550199" },
    { headers: { "idempotency-key": "not a valid key!" } },
  );

  assertEquals(response.status, 400);
  assertEquals(await errorFrom(response), "Invalid idempotency key.");
});

Deno.test("allows the idempotency header in the CORS preflight", async () => {
  if (!handler) throw new Error("revoke-marketing handler was not captured");
  const response = await handler(
    new Request("http://localhost/revoke-marketing", {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:5173",
        "access-control-request-method": "POST",
        "access-control-request-headers": "idempotency-key",
      },
    }),
  );

  assertEquals(response.status, 204);
  assertEquals(
    response.headers.get("access-control-allow-headers")?.includes("idempotency-key"),
    true,
  );
});

Deno.test("rejects an unapproved origin", async () => {
  const response = await revoke(
    { reference: "LPP-2026-ABC123", phone: "5125550199" },
    { origin: "https://not-approved.example" },
  );

  assertEquals(response.status, 403);
  assertEquals(await errorFrom(response), "Origin not allowed");
});

Deno.test("rejects a method other than POST", async () => {
  const response = await revoke(undefined, { method: "GET" });

  assertEquals(response.status, 405);
  assertEquals(await errorFrom(response), "Method not allowed");
});

Deno.test("rejects malformed JSON", async () => {
  const response = await revoke(undefined, { rawBody: "{" });

  assertEquals(response.status, 400);
  assertEquals(await errorFrom(response), "The request could not be read.");
});

Deno.test("requires a case reference", async () => {
  const response = await revoke({ phone: "5125550199" });

  assertEquals(response.status, 400);
  assertEquals(await errorFrom(response), "Enter your case reference.");
});

Deno.test("rejects a case reference in the wrong format", async () => {
  const response = await revoke({ reference: "LPP-26-ABC", phone: "5125550199" });

  assertEquals(response.status, 400);
  assertEquals(
    await errorFrom(response),
    "Enter the case reference exactly as it appears on your case.",
  );
});

Deno.test("requires at least one contact detail", async () => {
  const response = await revoke({ reference: "LPP-2026-ABC123" });

  assertEquals(response.status, 400);
  assertEquals(
    await errorFrom(response),
    "Enter the email address or telephone number on your case.",
  );
});

Deno.test("rejects an unusable telephone number", async () => {
  const response = await revoke({ reference: "LPP-2026-ABC123", phone: "12345" });

  assertEquals(response.status, 400);
  assertEquals(await errorFrom(response), "Enter a valid telephone number.");
});

Deno.test("rejects an unusable email address", async () => {
  const response = await revoke({ reference: "LPP-2026-ABC123", email: "not-an-email" });

  assertEquals(response.status, 400);
  assertEquals(await errorFrom(response), "Enter a valid email address.");
});

Deno.test("rejects a reason above 500 characters", async () => {
  const response = await revoke({
    reference: "LPP-2026-ABC123",
    phone: "5125550199",
    reason: "x".repeat(501),
  });

  assertEquals(response.status, 400);
  assertEquals(await errorFrom(response), "Keep the reason under 500 characters.");
});

Deno.test("enforces the 8 KiB body budget before parsing", async () => {
  const response = await revoke(undefined, {
    rawBody: JSON.stringify({
      reference: "LPP-2026-ABC123",
      phone: "5125550199",
      reason: "x".repeat(9_000),
    }),
  });

  assertEquals(response.status, 413);
  assertEquals(await errorFrom(response), "Request too large");
});

Deno.test("fails closed when the durable rate limiter is unavailable", async () => {
  const previous = Deno.env.get("ENVIRONMENT");
  Deno.env.set("ENVIRONMENT", "production");
  try {
    const response = await revoke({ reference: "LPP-2026-ABC123", phone: "5125550199" });
    assertEquals(response.status, 503);
    assertEquals(
      await errorFrom(response),
      "The request could not be recorded. Please email us using the address on the opt-out page.",
    );
  } finally {
    if (previous === undefined) Deno.env.delete("ENVIRONMENT");
    else Deno.env.set("ENVIRONMENT", previous);
  }
});
