import { assertEquals, assert } from "jsr:@std/assert@1.0.6";
import {
  buildNotification,
  notificationBlocker,
  notificationDetailForStorage,
  sendCaseNotification,
} from "../_shared/email.ts";

const ORIGINAL_FETCH = globalThis.fetch;

Deno.test("notification carries a reference and portal link, never health data", () => {
  const message = buildNotification({
    reference: "LPP-2026-TEST01",
    submittedAt: "2026-10-27T12:00:00.000Z",
    portalOrigin: "https://example.test",
  });

  assert(message.text.includes("LPP-2026-TEST01"));
  assert(message.text.includes("https://example.test/portal"));
  for (const forbidden of ["Non-customer", "1980", "diagnosis", "medication", "HIV"]) {
    assertEquals(
      message.text.toLowerCase().includes(forbidden.toLowerCase()),
      false,
      `notification leaked: ${forbidden}`,
    );
  }
});

Deno.test("a notification needs both a provider and a portal origin", () => {
  const previous = Deno.env.get("RESEND_API_KEY");
  try {
    Deno.env.delete("RESEND_API_KEY");
    assertEquals(notificationBlocker("https://example.test"), "Email provider not configured");

    Deno.env.set("RESEND_API_KEY", "test-key");
    assertEquals(notificationBlocker("   "), "Portal origin not configured");
    assertEquals(notificationBlocker("https://example.test"), null);
  } finally {
    if (previous === undefined) Deno.env.delete("RESEND_API_KEY");
    else Deno.env.set("RESEND_API_KEY", previous);
  }
});

Deno.test("provider acceptance is never reported as delivered", () => {
  const detail = notificationDetailForStorage({
    state: "accepted",
    detail: "Accepted by the email provider",
    messageId: "msg_123",
  });
  const parsed = JSON.parse(detail) as { note?: string; messageId?: string };

  assertEquals(parsed.messageId, "msg_123");
  assert(!detail.toLowerCase().includes("delivered"));
});

Deno.test("no provider key produces not_sent and makes no request", async () => {
  const previous = Deno.env.get("RESEND_API_KEY");
  Deno.env.delete("RESEND_API_KEY");
  let called = false;

  globalThis.fetch = (() => {
    called = true;
    return Promise.reject(new Error("must not be called"));
  }) as typeof fetch;

  try {
    const result = await sendCaseNotification({
      reference: "LPP-2026-TEST01",
      submittedAt: "2026-10-27T12:00:00.000Z",
      portalOrigin: "https://example.test",
    });
    assertEquals(result.state, "not_sent");
    assertEquals(called, false);
  } finally {
    globalThis.fetch = ORIGINAL_FETCH;
    if (previous === undefined) Deno.env.delete("RESEND_API_KEY");
    else Deno.env.set("RESEND_API_KEY", previous);
  }
});

Deno.test("retries reuse the case reference as the provider idempotency key", async () => {
  const previous = Deno.env.get("RESEND_API_KEY");
  Deno.env.set("RESEND_API_KEY", "test-key");
  let seenKey: string | null = null;

  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    seenKey = headers.get("Idempotency-Key");
    return Promise.resolve(
      new Response(JSON.stringify({ id: "msg_123" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof fetch;

  try {
    const result = await sendCaseNotification({
      reference: "LPP-2026-TEST01",
      submittedAt: "2026-10-27T12:00:00.000Z",
      portalOrigin: "https://example.test",
      idempotencyKey: "LPP-2026-TEST01",
    });
    assertEquals(result.state, "accepted");
    assertEquals(seenKey, "LPP-2026-TEST01");
  } finally {
    globalThis.fetch = ORIGINAL_FETCH;
    if (previous === undefined) Deno.env.delete("RESEND_API_KEY");
    else Deno.env.set("RESEND_API_KEY", previous);
  }
});

Deno.test("a provider rejection is failed, not accepted", async () => {
  const previous = Deno.env.get("RESEND_API_KEY");
  Deno.env.set("RESEND_API_KEY", "test-key");

  globalThis.fetch = (() =>
    Promise.resolve(new Response("nope", { status: 422 }))) as typeof fetch;

  try {
    const result = await sendCaseNotification({
      reference: "LPP-2026-TEST01",
      submittedAt: "2026-10-27T12:00:00.000Z",
      portalOrigin: "https://example.test",
    });
    assertEquals(result.state, "failed");
  } finally {
    globalThis.fetch = ORIGINAL_FETCH;
    if (previous === undefined) Deno.env.delete("RESEND_API_KEY");
    else Deno.env.set("RESEND_API_KEY", previous);
  }
});
