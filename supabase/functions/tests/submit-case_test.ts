/**
 * Regression guards for the public intake handler.
 *
 * These call the real handler with the browser form bypassed. They prove that
 * the launch lock, the required permissions and the byte budget are enforced
 * before a case can be written.
 */

import { assertEquals } from "jsr:@std/assert@1.0.6";
import { buildConsents, buildValidDraft } from "./fixtures.ts";
import { heldEmail } from "./held-email.ts";

type Handler = (request: Request) => Response | Promise<Response>;

let handler: Handler | undefined;

const originalServe = Deno.serve;
(Deno as unknown as { serve: unknown }).serve = (candidate: Handler) => {
  handler = candidate;
  return {} as unknown as Deno.HttpServer;
};

Deno.env.set("ENVIRONMENT", "test");
Deno.env.set("APP_ORIGIN", "http://localhost:5173");

await import("../submit-case/index.ts");

(Deno as unknown as { serve: unknown }).serve = originalServe;

async function submit(
  body: unknown,
  key = "test-key-0001",
  environment = "test",
): Promise<Response> {
  Deno.env.set("ENVIRONMENT", environment);
  if (!handler) throw new Error("submit-case handler was not captured");
  return await handler(
    new Request("http://localhost/submit-case", {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        "content-type": "application/json",
        "idempotency-key": key,
      },
      body: JSON.stringify(body),
    }),
  );
}

async function errorFrom(response: Response): Promise<string> {
  const body = (await response.json()) as { error?: string };
  return body.error ?? "";
}

Deno.test("a saved case returns its receipt after an email timeout and an unchanged retry does not duplicate it", async () => {
  const values = {
    QUESTIONNAIRE_APPROVED: "true",
    SUPABASE_URL: "http://database.test",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-key",
    RESEND_API_KEY: "synthetic-key",
    RATE_LIMIT_SALT: "synthetic-salt",
    REVIEWER_PORTAL_URL: "https://example.test/reviewer",
  };
  const saved = new Map(
    Object.keys(values).map((key) => [key, Deno.env.get(key)]),
  );
  const originalFetch = globalThis.fetch;
  const held = heldEmail("headers");
  let row: Record<string, unknown> | undefined;
  let inserts = 0;
  const json = (value: unknown) => Response.json(value);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.hostname === "api.resend.com") {
      assertEquals(inserts, 1, "the case must be saved before notification");
      return held.fetch(input, init);
    }
    if (url.pathname.endsWith("/consume_submission_rate")) return json(true);
    if (url.pathname === "/rest/v1/cases" && request.method === "GET") {
      return json(row ? [row] : []);
    }
    if (url.pathname === "/rest/v1/cases" && request.method === "POST") {
      row = await request.json();
      inserts++;
      return new Response(null, { status: 201 });
    }
    if (url.pathname.endsWith("/claim_case_notification")) {
      return json([{ notification_attempts: 1 }]);
    }
    if (url.pathname.endsWith("/complete_case_notification")) {
      const body = await request.json();
      row!.notification_state = body.p_state;
      row!.notification_detail = body.p_detail;
      row!.notification_attempts = 1;
      return json(null);
    }
    throw new Error(`Unexpected synthetic request: ${url.pathname}`);
  }) as typeof fetch;
  try {
    for (const [key, value] of Object.entries(values)) Deno.env.set(key, value);
    const draft = buildValidDraft();
    const response = await submit(draft, "stalled-email-0001");
    const receipt = await response.json();
    assertEquals(response.status, 201);
    assertEquals(receipt.reference, row!.reference);
    assertEquals(receipt.status, "submitted");
    assertEquals(receipt.notification.state, "failed");
    assertEquals(held.aborted(), true);
    assertEquals(row!.notification_state, "failed");
    const replay = await submit(draft, "stalled-email-0001");
    const repeated = await replay.json();
    assertEquals(replay.status, 200);
    assertEquals(repeated.reference, receipt.reference);
    assertEquals(inserts, 1);
    assertEquals(held.keys, [receipt.reference]);
  } finally {
    held.close();
    globalThis.fetch = originalFetch;
    for (const [key, value] of saved) {
      value === undefined ? Deno.env.delete(key) : Deno.env.set(key, value);
    }
  }
});

Deno.test("allows the idempotency header in the CORS preflight", async () => {
  if (!handler) throw new Error("submit-case handler was not captured");
  const response = await handler(
    new Request("http://localhost/submit-case", {
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

Deno.test("refuses live intake until the questionnaire is explicitly approved", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "false");
  const response = await submit(buildValidDraft());

  assertEquals(response.status, 503);
  assertEquals(
    await errorFrom(response),
    "This questionnaire is not yet approved for live submissions. No case was saved and nothing was sent.",
  );
});

Deno.test("fails closed when the durable rate limiter is unavailable", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "true");
  const response = await submit(buildValidDraft(), "rate-limit-0001", "production");

  assertEquals(response.status, 503);
  assertEquals(
    await errorFrom(response),
    "Submissions are temporarily unavailable. Nothing was saved and nothing was sent.",
  );
});

Deno.test("rejects a draft with no consent records", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "true");
  const response = await submit(buildValidDraft({ consents: [] }));

  assertEquals(response.status, 422);
  assertEquals(await errorFrom(response), "Intake permission is required to submit");
});

Deno.test("rejects a draft missing the intake permission", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "true");
  const response = await submit(
    buildValidDraft({ consents: buildConsents({ omit: "intake_permission" }) }),
  );

  assertEquals(response.status, 422);
  assertEquals(await errorFrom(response), "Intake permission is required to submit");
});

Deno.test("rejects a declined intake permission", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "true");
  const consents = buildConsents().map((record) =>
    record.id === "intake_permission"
      ? { ...record, granted: false, grantedAt: null }
      : record,
  );
  const response = await submit(buildValidDraft({ consents }));

  assertEquals(response.status, 422);
  assertEquals(await errorFrom(response), "Intake permission is required to submit");
});

Deno.test("rejects a draft missing the privacy acknowledgement", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "true");
  const response = await submit(
    buildValidDraft({ consents: buildConsents({ omit: "privacy_acknowledgement" }) }),
  );

  assertEquals(response.status, 422);
  assertEquals(
    await errorFrom(response),
    "Privacy practices acknowledgement is required to submit",
  );
});

Deno.test("a submission with no email provider is stored unclaimed and stays retryable", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "true");
  Deno.env.set("SUPABASE_URL", "http://supabase.test");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
  Deno.env.delete("RESEND_API_KEY");

  const calls: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push(`${method} ${url}`);
    if (url.includes("/rest/v1/cases") && method === "GET") {
      return Promise.resolve(new Response("[]", { status: 200, headers: { "content-type": "application/json" } }));
    }
    if (url.includes("/rest/v1/cases")) {
      return Promise.resolve(new Response("", { status: 201 }));
    }
    if (url.includes("/rest/v1/rpc/")) {
      return Promise.resolve(
        new Response("null", { status: 200, headers: { "content-type": "application/json" } }),
      );
    }
    return Promise.resolve(new Response("[]", { status: 200, headers: { "content-type": "application/json" } }));
  }) as typeof fetch;

  try {
    const response = await submit(buildValidDraft(), "no-provider-0001");
    const body = (await response.json()) as { notification?: { state?: string } };

    assertEquals(response.status, 201);
    assertEquals(body.notification?.state, "not_sent");
    // Claiming would stamp the provider idempotency window (0010), so with
    // nothing to send the handler must record the state without a lease.
    assertEquals(
      calls.some((call) => call.includes("claim_case_notification")),
      false,
      "the submit path claimed a notification it could not send",
    );
    assertEquals(
      calls.some((call) => call.includes("complete_case_notification")),
      true,
      "the honest not_sent state was not recorded",
    );
    assertEquals(calls.some((call) => call.includes("api.resend.com")), false);
  } finally {
    globalThis.fetch = originalFetch;
    Deno.env.delete("SUPABASE_URL");
    Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");
  }
});

Deno.test("rejects a multibyte body above the 512 KiB byte budget with 413", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "true");
  if (!handler) throw new Error("submit-case handler was not captured");

  // 300,000 two-byte characters = ~600 KB, but only 300,000 JS characters.
  const oversized = '{"padding":"' + "é".repeat(300_000) + '"}';

  const response = await handler(
    new Request("http://localhost/submit-case", {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        "content-type": "application/json",
        "idempotency-key": "byte-cap-0001",
      },
      body: oversized,
    }),
  );

  assertEquals(response.status, 413);
  assertEquals(await errorFrom(response), "Submission too large");
});
