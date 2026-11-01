import { assert, assertEquals } from "jsr:@std/assert@1.0.6";
import { heldEmail } from "./held-email.ts";
import {
  buildNotification,
  notificationBlocker,
  notificationDetailForStorage,
  sendCaseNotification,
} from "../_shared/email.ts";

const ORIGINAL_FETCH = globalThis.fetch;

for (const phase of ["headers", "body"] as const) {
  Deno.test(`a stalled provider ${phase} is aborted before the receipt deadline and can retry safely`, async () => {
    const saved = new Map(
      ["RESEND_API_KEY", "REVIEWER_PORTAL_URL"].map(
        (key) => [key, Deno.env.get(key)],
      ),
    );
    const held = heldEmail(phase);
    const input = {
      reference: "LPP-2026-SLOW01",
      submittedAt: "2026-11-01T12:00:00Z",
      portalOrigin: "https://example.test",
    };
    try {
      Deno.env.set("RESEND_API_KEY", "synthetic-key");
      Deno.env.delete("REVIEWER_PORTAL_URL");
      globalThis.fetch = held.fetch;
      const result = await sendCaseNotification(input);
      assertEquals(result.state, "failed");
      assertEquals(result.messageId, undefined);
      assertEquals(held.aborted(), true);
      assert(result.detail?.includes("timed out"));
      let retryKey: string | null = null;
      globalThis.fetch = ((_input, init) => {
        retryKey = new Headers(init?.headers).get("Idempotency-Key");
        return Promise.resolve(
          Response.json({ id: "synthetic-recovered-message" }),
        );
      }) as typeof fetch;
      const retry = await sendCaseNotification(input);
      assertEquals(retry.state, "accepted");
      assertEquals(retryKey, held.keys[0]);
      assertEquals(retryKey, input.reference);
    } finally {
      held.close();
      globalThis.fetch = ORIGINAL_FETCH;
      for (const [key, value] of saved) {
        value === undefined ? Deno.env.delete(key) : Deno.env.set(key, value);
      }
    }
  });
}

function withReviewerUrl(value: string | undefined, run: () => void) {
  const previous = Deno.env.get("REVIEWER_PORTAL_URL");
  try {
    if (value === undefined) Deno.env.delete("REVIEWER_PORTAL_URL");
    else Deno.env.set("REVIEWER_PORTAL_URL", value);
    run();
  } finally {
    if (previous === undefined) Deno.env.delete("REVIEWER_PORTAL_URL");
    else Deno.env.set("REVIEWER_PORTAL_URL", previous);
  }
}

Deno.test("Lovable notifications use the configured reviewer URL independently of the intake origin", () => {
  const destination =
    "https://id-preview--357c0422-4982-4f24-9e20-31891a8661ca.lovable.app/reviewer";
  withReviewerUrl(destination, () => {
    const message = buildNotification({
      reference: "LPP-2026-TEST01",
      submittedAt: "2026-10-27T12:00:00.000Z",
      portalOrigin: "https://intake.example.test",
    });
    assert(message.text.includes(`Portal: ${destination}\n`));
    assert(!message.text.includes("/portal"));
    assert(!message.text.includes("intake.example.test"));
  });
});

Deno.test("a full reviewer URL works without a fallback origin and blank override preserves the standalone link", () => {
  const previous = Deno.env.get("RESEND_API_KEY");
  try {
    Deno.env.set("RESEND_API_KEY", "synthetic-key");
    withReviewerUrl("https://preview.example.test/reviewer", () => {
      assertEquals(notificationBlocker(""), null);
    });
    for (const override of [undefined, "  "]) {
      withReviewerUrl(override, () => {
        const message = buildNotification({
          reference: "LPP-2026-TEST01",
          submittedAt: "2026-10-27T12:00:00.000Z",
          portalOrigin: "https://example.test/",
        });
        assert(message.text.includes("Portal: https://example.test/portal\n"));
      });
    }
  } finally {
    if (previous === undefined) Deno.env.delete("RESEND_API_KEY");
    else Deno.env.set("RESEND_API_KEY", previous);
  }
});

Deno.test("invalid explicit reviewer URLs prevent sending rather than falling back to a broken link", async () => {
  const previousKey = Deno.env.get("RESEND_API_KEY");
  const previousUrl = Deno.env.get("REVIEWER_PORTAL_URL");
  let calls = 0;
  globalThis.fetch = (() => {
    calls++;
    throw new Error("No provider request allowed");
  }) as typeof fetch;
  try {
    Deno.env.set("RESEND_API_KEY", "synthetic-key");
    for (
      const value of [
        "not a URL",
        "javascript:alert(1)",
        "http://preview.example.test/reviewer",
        "https://user:password@preview.example.test/reviewer",
        "https://preview.example.test/reviewer?token=synthetic",
        "https://preview.example.test/reviewer#access_token=synthetic",
      ]
    ) {
      Deno.env.set("REVIEWER_PORTAL_URL", value);
      const result = await sendCaseNotification({
        reference: "LPP-2026-TEST01",
        submittedAt: "2026-10-27T12:00:00.000Z",
        portalOrigin: "https://intake.example.test",
      });
      assertEquals(result.state, "not_sent");
      assertEquals(result.detail, "Reviewer portal URL is invalid");
    }
    assertEquals(calls, 0);
  } finally {
    globalThis.fetch = ORIGINAL_FETCH;
    if (previousKey === undefined) Deno.env.delete("RESEND_API_KEY");
    else Deno.env.set("RESEND_API_KEY", previousKey);
    if (previousUrl === undefined) Deno.env.delete("REVIEWER_PORTAL_URL");
    else Deno.env.set("REVIEWER_PORTAL_URL", previousUrl);
  }
});

Deno.test("the provider request uses /reviewer without changing recipient or idempotency", async () => {
  const saved = new Map(
    ["RESEND_API_KEY", "REVIEWER_PORTAL_URL"].map(
      (key) => [key, Deno.env.get(key)],
    ),
  );
  const destination = "https://preview.example.test/reviewer";
  let payload: Record<string, unknown> = {};
  let seenKey = "";
  try {
    Deno.env.set("RESEND_API_KEY", "synthetic-key");
    Deno.env.set("REVIEWER_PORTAL_URL", destination);
    globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
      payload = JSON.parse(String(init?.body));
      seenKey = new Headers(init?.headers).get("Idempotency-Key") ?? "";
      return Promise.resolve(Response.json({ id: "synthetic-message" }));
    }) as typeof fetch;
    const result = await sendCaseNotification({
      reference: "LPP-2026-TEST01",
      submittedAt: "2026-10-27T12:00:00.000Z",
      portalOrigin: "https://intake.example.test",
    });
    assertEquals(result.state, "accepted");
    assert(String(payload.text).includes(`Portal: ${destination}\n`));
    assertEquals(payload.to, ["richardparslow@lifepolicypilot.blog"]);
    assertEquals(seenKey, "LPP-2026-TEST01");
  } finally {
    globalThis.fetch = ORIGINAL_FETCH;
    for (const [key, value] of saved) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
  }
});

Deno.test("notification carries a reference and portal link, never health data", () => {
  const message = buildNotification({
    reference: "LPP-2026-TEST01",
    submittedAt: "2026-10-27T12:00:00.000Z",
    portalOrigin: "https://example.test",
  });

  assert(message.text.includes("LPP-2026-TEST01"));
  assert(message.text.includes("https://example.test/portal"));
  for (
    const forbidden of [
      "Non-customer",
      "1980",
      "diagnosis",
      "medication",
      "HIV",
    ]
  ) {
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
    assertEquals(
      notificationBlocker("https://example.test"),
      "Email provider not configured",
    );

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

  globalThis.fetch =
    (() =>
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
