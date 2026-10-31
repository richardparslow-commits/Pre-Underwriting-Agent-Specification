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
const peer = (port: number): Info => ({
  remoteAddr: { transport: "tcp", hostname: "192.0.2.45", port },
});
function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

for (
  const [name, handler, limit] of [["submit", submit, 10], [
    "revoke",
    revoke,
    5,
  ]] as const
) {
  for (const infoAvailable of [true, false]) {
    Deno.test(`${name}: rotating forwarded headers and TCP ports cannot reset ${infoAvailable ? "transport-peer" : "missing-peer fallback"} quota`, async () => {
      if (!handler) throw new Error("Handler was not captured");
      const oldEnv = new Map<string, string | undefined>();
      for (
        const [key, value] of Object.entries({
          ENVIRONMENT: "test",
          APP_ORIGIN: "http://localhost:5173",
          QUESTIONNAIRE_APPROVED: "true",
          SUPABASE_URL: "http://database.test",
          SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key",
          RATE_LIMIT_SALT: "synthetic-test-salt",
        })
      ) {
        oldEnv.set(key, Deno.env.get(key));
        Deno.env.set(key, value);
      }
      const originalFetch = globalThis.fetch;
      const buckets = new Map<string, number>();
      let businessWrites = 0;
      globalThis.fetch =
        (async (input: RequestInfo | URL, init?: RequestInit) => {
          const request = new Request(input, init);
          const url = new URL(request.url);
          if (url.pathname.endsWith("/rpc/consume_submission_rate")) {
            const params = await request.json();
            assertEquals(params.p_limit, limit);
            assertEquals(params.p_window_seconds, 600);
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
      try {
        for (let n = 0; n < limit + 3; n++) {
          const response = await handler(
            new Request(`http://localhost/${name}`, {
              method: "POST",
              headers: {
                origin: "http://localhost:5173",
                "content-type": "application/json",
                "idempotency-key": `synthetic-request-${n}`,
                "x-forwarded-for": `198.51.100.${n + 1}, 203.0.113.${n + 1}`,
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
            infoAvailable ? peer(10000 + n) : undefined,
          );
          assertEquals(
            response.status,
            n < limit ? (name === "submit" ? 201 : 202) : 429,
          );
          await response.body?.cancel();
        }
        assertEquals(
          buckets.size,
          1,
          "all caller-controlled header variants must consume the same quota",
        );
        assertEquals(
          businessWrites,
          limit,
          "requests over quota cannot reach case/suppression writes",
        );
      } finally {
        globalThis.fetch = originalFetch;
        for (const [key, value] of oldEnv) {
          value === undefined ? Deno.env.delete(key) : Deno.env.set(key, value);
        }
      }
    });
  }
}

Deno.test("connection identity ignores TCP source ports and treats missing/non-TCP metadata conservatively", () => {
  assertEquals(connectionRateKey(peer(1000)), connectionRateKey(peer(2000)));
  assertEquals(connectionRateKey(), "shared:unverified-peer");
  assertEquals(connectionRateKey({}), "shared:unverified-peer");
  assertEquals(
    connectionRateKey({ remoteAddr: { transport: "unix" } }),
    "shared:unverified-peer",
  );
  assertEquals(
    connectionRateKey({ remoteAddr: { transport: "tcp", hostname: "" } }),
    "shared:unverified-peer",
  );
  assertEquals(
    connectionRateKey({
      remoteAddr: { transport: "tcp", hostname: "invalid peer" },
    }),
    "shared:unverified-peer",
  );
  assertEquals(
    connectionRateKey({
      remoteAddr: { transport: "tcp", hostname: "2001:DB8::1" },
    }),
    "peer:2001:db8::1",
  );
  assertEquals(
    connectionRateKey({
      remoteAddr: { transport: "tcp", hostname: "192.0.2.46" },
    }) === connectionRateKey(peer(1000)),
    false,
  );
});
