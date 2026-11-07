/** Real public handlers with synthetic database transport: no hosted writes or mail. */
import { assertEquals } from "jsr:@std/assert@1.0.6";
import { buildValidDraft } from "./fixtures.ts";
import { connectionRateKey } from "../_shared/case.ts";

// Capture both entrypoints without listening or touching live configuration.
type Info = {
  remoteAddr: { transport: "tcp"; hostname: string; port: number };
};
type Handler = (request: Request, info?: Info) => Response | Promise<Response>;
const handlers: Handler[] = [];
const originalServe = Deno.serve;
(Deno as unknown as { serve: unknown }).serve = (handler: Handler) => {
  handlers.push(handler);
  return {} as Deno.HttpServer;
};
try {
  await import("../submit-case/index.ts");
  await import("../revoke-marketing/index.ts");
} finally {
  (Deno as unknown as { serve: unknown }).serve = originalServe;
}
const [submit, revoke] = handlers;
const gateway = (port = 10000): Info => ({
  remoteAddr: { transport: "tcp", hostname: "192.0.2.45", port },
});
function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}
function setEnv(values: Record<string, string>) {
  const old = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    old.set(key, Deno.env.get(key));
    Deno.env.set(key, value);
  }
  return () => {
    for (const [key, value] of old) {
      value === undefined ? Deno.env.delete(key) : Deno.env.set(key, value);
    }
  };
}
function mockTransport(limit: number) {
  const buckets = new Map<string, number>();
  let businessWrites = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (
      url.pathname.endsWith("/rpc/consume_submission_rate") ||
      url.pathname.endsWith("/rpc/consume_submission_rate_for_key")
    ) {
      const params = await request.json();
      assertEquals(params.p_limit, limit);
      assertEquals(params.p_window_seconds, 600);
      if (params.p_idempotency_key !== undefined) {
        assertEquals(typeof params.p_idempotency_key, "string");
      }
      const hits = (buckets.get(params.p_key_hash) ?? 0) + 1;
      buckets.set(params.p_key_hash, hits);
      return json(hits <= limit);
    }
    if (url.pathname.endsWith("/rpc/request_marketing_revocation")) {
      businessWrites++;
      return json(null);
    }
    if (url.pathname.endsWith("/rpc/claim_case_notification")) {
      return json([]);
    }
    if (url.pathname === "/rest/v1/cases") {
      if (request.method === "GET") return json([]);
      if (request.method === "POST") {
        businessWrites++;
        return new Response(null, { status: 201 });
      }
    }
    throw new Error(`Unexpected transport request: ${url.pathname}`);
  }) as typeof fetch;
  return {
    buckets,
    get writes() {
      return businessWrites;
    },
    restore() {
      globalThis.fetch = originalFetch;
    },
  };
}

for (
  const [name, handler, limit] of [["submit", submit, 10], [
    "revoke",
    revoke,
    5,
  ]] as const
) {
  Deno.test(`${name}: distinct gateway-forwarded clients get independent quotas`, async () => {
    if (!handler) throw new Error("Handler was not captured");
    const restoreEnv = setEnv({
      ENVIRONMENT: "test",
      APP_ORIGIN: "http://localhost:5173",
      QUESTIONNAIRE_APPROVED: "true",
      SUPABASE_URL: "http://database.test",
      SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key",
      RATE_LIMIT_SALT: "synthetic-test-salt",
      INTAKE_RELAY_REQUIRED: "false",
    });
    const transport = mockTransport(limit);
    try {
      for (
        const [visitorIndex, ip] of ["198.18.23.1", "198.18.23.2"].entries()
      ) {
        for (let n = 0; n <= limit; n++) {
          const response = await handler(
            new Request(`http://localhost/${name}`, {
              method: "POST",
              headers: {
                origin: "http://localhost:5173",
                "content-type": "application/json",
                "idempotency-key": `synthetic-${name}-${visitorIndex}-${n}`,
                // The caller can prepend entries, but the gateway appends the
                // prospect's address last. Rotated prefixes and unrelated
                // forwarded headers must not create a fresh quota.
                "x-forwarded-for": `198.51.100.${n + 1}, ${ip}`,
                "cf-connecting-ip": `203.0.113.${n + 20}`,
                "x-real-ip": `198.51.100.${n + 40}`,
                forwarded: `for=198.51.100.${n + 60}`,
              },
              body: JSON.stringify(
                name === "submit" ? buildValidDraft() : {
                  reference: "LPP-2026-ABC123",
                  email: "synthetic@example.test",
                },
              ),
            }),
            gateway(),
          );
          assertEquals(
            response.status,
            n < limit ? (name === "submit" ? 201 : 202) : 429,
          );
          await response.body?.cancel();
        }
      }
      assertEquals(transport.buckets.size, 2);
      assertEquals(transport.writes, limit * 2);
    } finally {
      transport.restore();
      restoreEnv();
    }
  });

  Deno.test(`${name}: rotating caller-prepended forwarded entries cannot reset the gateway quota`, async () => {
    if (!handler) throw new Error("Handler was not captured");
    const restoreEnv = setEnv({
      ENVIRONMENT: "test",
      APP_ORIGIN: "http://localhost:5173",
      QUESTIONNAIRE_APPROVED: "true",
      SUPABASE_URL: "http://database.test",
      SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key",
      RATE_LIMIT_SALT: "synthetic-test-salt",
      INTAKE_RELAY_REQUIRED: "false",
    });
    const transport = mockTransport(limit);
    try {
      for (let n = 0; n < limit + 3; n++) {
        const response = await handler(
          new Request(`http://localhost/${name}`, {
            method: "POST",
            headers: {
              origin: "http://localhost:5173",
              "content-type": "application/json",
              "idempotency-key": `synthetic-shared-${name}-${n}`,
              // Only the final, gateway-appended entry is stable.
              "x-forwarded-for": `198.51.100.${n + 1}, 203.0.113.9`,
              "cf-connecting-ip": `203.0.113.${n + 20}`,
              "x-real-ip": `198.51.100.${n + 40}`,
              forwarded: `for=198.51.100.${n + 60}`,
            },
            body: JSON.stringify(
              name === "submit" ? buildValidDraft() : {
                reference: "LPP-2026-ABC123",
                email: "synthetic@example.test",
              },
            ),
          }),
          gateway(),
        );
        assertEquals(
          response.status,
          n < limit ? (name === "submit" ? 201 : 202) : 429,
        );
        await response.body?.cancel();
      }
      assertEquals(transport.buckets.size, 1);
      assertEquals(transport.writes, limit);
    } finally {
      transport.restore();
      restoreEnv();
    }
  });
}

Deno.test("rate-limit identity trusts only the final gateway address and falls back conservatively", () => {
  const request = (forwarded?: string) =>
    new Request("https://example.test", {
      headers: forwarded === undefined ? {} : { "x-forwarded-for": forwarded },
    });

  assertEquals(
    connectionRateKey(request("198.51.100.8, 203.0.113.9"), gateway()),
    "client:203.0.113.9",
  );
  assertEquals(
    connectionRateKey(request("2001:0DB8:0000::1"), gateway()),
    "client:2001:db8::1",
  );
  // A malformed final entry must not fall back to an earlier caller entry.
  assertEquals(
    connectionRateKey(request("203.0.113.9, unknown"), gateway()),
    "peer:192.0.2.45",
  );
  assertEquals(
    connectionRateKey(request("001.2.3.4"), gateway()),
    "peer:192.0.2.45",
  );
  assertEquals(
    connectionRateKey(request("198.51.100.8:99"), gateway()),
    "peer:192.0.2.45",
  );
  assertEquals(
    connectionRateKey(request("not-an-ip"), gateway()),
    "peer:192.0.2.45",
  );
  assertEquals(
    connectionRateKey(request(), gateway()),
    "peer:192.0.2.45",
  );
  assertEquals(
    connectionRateKey(request(), undefined),
    "shared:unverified-peer",
  );
  assertEquals(
    connectionRateKey(request(), { remoteAddr: { transport: "unix" } }),
    "shared:unverified-peer",
  );
});
