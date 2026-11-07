import { assertEquals } from "jsr:@std/assert@1.0.6";
import {
  canonicalIP,
  relay,
  type RelayEnv,
} from "../../../edge/intake-relay/index.ts";
import {
  RELAY_HEADER,
  signRelay,
  verifyRelay,
  visitorDigest,
} from "../_shared/intake-relay.ts";
import { buildValidDraft } from "./fixtures.ts";
const SECRET = "synthetic-only-relay-secret-with-32-characters";
const ORIGIN = "https://preview.example.test";
const BACKEND = "https://abcdefghijklmnopqrst.supabase.co";
const ENV: RelayEnv = {
  QUESTIONNAIRE_APPROVED: "true",
  APP_ORIGIN: ORIGIN,
  SUPABASE_URL: BACKEND,
  SUPABASE_PUBLISHABLE_KEY: "synthetic-public-key",
  INTAKE_RELAY_SECRET: SECRET,
};
function ingress(
  ip = "198.51.100.8",
  extra: Record<string, string> = {},
  body = "{}",
) {
  return Object.assign(
    new Request("https://relay.example.test/submit-case", {
      method: "POST",
      body,
      headers: {
        origin: ORIGIN,
        "idempotency-key": "synthetic-request",
        "cf-connecting-ip": ip,
        ...extra,
      },
    }),
    { cf: { colo: "DFW" } },
  );
}
function upstream(body = "{}", key = "synthetic-request") {
  return new Request(`${BACKEND}/functions/v1/submit-case`, {
    method: "POST",
    body,
    headers: { origin: ORIGIN, "idempotency-key": key },
  });
}
Deno.test("proof binds body, origin, key, URL, method, visitor and timestamp", async () => {
  const req = upstream();
  const visitor = await visitorDigest("198.51.100.8", SECRET);
  const proof = await signRelay(req, "{}", visitor, SECRET);
  req.headers.set(RELAY_HEADER, proof);
  assertEquals(await verifyRelay(req, "{}", SECRET), `relay:v1:${visitor}`);
  assertEquals(await verifyRelay(req, "changed", SECRET), null);
  for (
    const [header, value] of [["origin", "https://evil.test"], [
      "idempotency-key",
      "another-request",
    ]]
  ) {
    const changed = req.clone();
    changed.headers.set(header, value);
    assertEquals(await verifyRelay(changed, "{}", SECRET), null);
  }
  for (
    const url of [
      `${BACKEND}/wrong-path`,
      "https://other.example.test/functions/v1/submit-case",
    ]
  ) {
    assertEquals(
      await verifyRelay(
        new Request(url, { method: "POST", headers: req.headers }),
        "{}",
        SECRET,
      ),
      null,
    );
  }
  assertEquals(
    await verifyRelay(
      new Request(req.url, { headers: req.headers }),
      "{}",
      SECRET,
    ),
    null,
  );
  for (const offset of [-65000, 10000]) {
    req.headers.set(
      RELAY_HEADER,
      await signRelay(req, "{}", visitor, SECRET, Date.now() + offset),
    );
    assertEquals(await verifyRelay(req, "{}", SECRET), null);
  }
  req.headers.set(RELAY_HEADER, proof.replace(visitor, "a".repeat(64)));
  assertEquals(await verifyRelay(req, "{}", SECRET), null);
  req.headers.set(RELAY_HEADER, proof);
  assertEquals(await verifyRelay(req, "{}", SECRET + "wrong"), null);
});
Deno.test("canonical IP literals prevent equivalent IPv6 bucket rotation", () => {
  assertEquals(canonicalIP("2001:0DB8:0000::1"), "2001:db8::1");
  for (
    const invalid of [
      null,
      "",
      "198.51.100.8, 1.2.3.4",
      "001.2.3.4",
      "999.1.1.1",
      "host.test",
      "1.2.3.4:99",
      "fe80::1%eth0",
      " 1.2.3.4",
    ]
  ) assertEquals(canonicalIP(invalid), null);
});
Deno.test("relay rebuilds headers and strips caller credentials and forged proof", async () => {
  let sent = 0;
  const response = await relay(
    ingress("198.51.100.8", {
      authorization: "Bearer caller-secret",
      cookie: "session=private",
      "x-forwarded-for": "1.2.3.4",
      [RELAY_HEADER]: "forged",
      "x-real-ip": "5.6.7.8",
    }),
    ENV,
    (async (input) => {
      const req = input as Request;
      sent++;
      assertEquals(req.url, `${BACKEND}/functions/v1/submit-case`);
      for (
        const name of [
          "authorization",
          "cookie",
          "x-forwarded-for",
          "cf-connecting-ip",
          "x-real-ip",
        ]
      ) assertEquals(req.headers.has(name), false);
      assertEquals(req.redirect, "manual");
      assertEquals(
        await verifyRelay(req, await req.text(), SECRET),
        `relay:v1:${await visitorDigest("198.51.100.8", SECRET)}`,
      );
      return new Response('{"saved":true}', {
        status: 201,
        headers: { "set-cookie": "private", location: "https://evil.test" },
      });
    }) as typeof fetch,
  );
  assertEquals(response.status, 201);
  assertEquals(sent, 1);
  assertEquals(response.headers.has("set-cookie"), false);
  assertEquals(response.headers.has("location"), false);
  await response.body?.cancel();
});
Deno.test("relay rejects lock, missing ingress, Worker subrequests, pseudo-IP, oversize and bad configuration before forwarding", async () => {
  let sent = 0;
  const send = (async () => {
    sent++;
    return new Response("{}");
  }) as typeof fetch;
  const cases: [Request, RelayEnv, number][] = [
    [ingress(), { ...ENV, QUESTIONNAIRE_APPROVED: "false" }, 503],
    [new Request(ingress()), ENV, 503],
    [ingress("198.51.100.8", { "cf-worker": "evil.test" }), ENV, 503],
    [ingress("2a06:98c0:3600::103"), ENV, 503],
    [
      ingress("198.51.100.8", { "cf-connecting-ipv6": "2001:db8::1" }),
      ENV,
      503,
    ],
    [ingress("invalid"), ENV, 503],
    [ingress(), { ...ENV, INTAKE_RELAY_SECRET: "" }, 503],
    [ingress(), { ...ENV, SUPABASE_URL: "https://attacker.test" }, 503],
    [ingress("198.51.100.8", { origin: "https://evil.test" }), ENV, 403],
    [ingress("198.51.100.8", {}, "x".repeat(512 * 1024 + 1)), ENV, 413],
    [ingress("198.51.100.8", { "content-length": "999999" }), ENV, 413],
  ];
  for (const [req, env, status] of cases) {
    const r = await relay(req, env, send);
    assertEquals(r.status, status);
    await r.body?.cancel();
  }
  assertEquals(sent, 0);
});
Deno.test("relay rejects redirects and reports uncertain transport honestly", async () => {
  for (
    const [send, status] of [
      [
        (async () =>
          new Response(null, {
            status: 302,
            headers: { location: "https://evil.test" },
          })) as typeof fetch,
        502,
      ],
      [
        (async () => {
          throw new DOMException("Timeout", "TimeoutError");
        }) as typeof fetch,
        504,
      ],
    ] as const
  ) {
    const r = await relay(ingress(), ENV, send);
    assertEquals(r.status, status);
    await r.body?.cancel();
  }
});
type Handler = (
  req: Request,
  info?: { remoteAddr: { transport: "tcp"; hostname: string; port: number } },
) => Promise<Response>;
let submit!: Handler;
const serve = Deno.serve;
(Deno as unknown as { serve: unknown }).serve = (handler: Handler) => {
  submit = handler;
  return {};
};
try {
  await import("../submit-case/index.ts");
} finally {
  (Deno as unknown as { serve: unknown }).serve = serve;
}
Deno.test("real handler: two signed visitors behind one gateway get independent quotas; direct and forged requests cannot write", async () => {
  const old = new Map<string, string | undefined>();
  for (
    const [key, value] of Object.entries({
      ENVIRONMENT: "production",
      APP_ORIGIN: ORIGIN,
      QUESTIONNAIRE_APPROVED: "true",
      SUPABASE_URL: BACKEND,
      SUPABASE_SERVICE_ROLE_KEY: "synthetic",
      RATE_LIMIT_SALT: "synthetic-salt",
      INTAKE_RELAY_REQUIRED: "true",
      INTAKE_RELAY_SECRET: SECRET,
    })
  ) {
    old.set(key, Deno.env.get(key));
    Deno.env.set(key, value);
  }
  const originalFetch = globalThis.fetch;
  const buckets = new Map<string, number>();
  let writes = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input, init);
    const path = new URL(req.url).pathname;
    const json = (data: unknown) =>
      new Response(JSON.stringify(data), {
        headers: { "content-type": "application/json" },
      });
    if (path.endsWith("/rpc/consume_submission_rate_for_key")) {
      const p = await req.json();
      assertEquals(p.p_limit, 10);
      assertEquals(p.p_window_seconds, 600);
      const n = (buckets.get(p.p_key_hash) ?? 0) + 1;
      buckets.set(p.p_key_hash, n);
      return json(n <= 10);
    }
    if (path.endsWith("/rpc/claim_case_notification")) return json([]);
    if (path === "/rest/v1/cases" && req.method === "GET") return json([]);
    if (path === "/rest/v1/cases" && req.method === "POST") {
      writes++;
      return new Response(null, { status: 201 });
    }
    throw new Error(`Unexpected synthetic transport ${path}`);
  }) as typeof fetch;
  const gateway = {
    remoteAddr: {
      transport: "tcp" as const,
      hostname: "192.0.2.45",
      port: 10000,
    },
  };
  try {
    const body = JSON.stringify(buildValidDraft());
    for (const ip of ["198.51.100.8", "198.51.100.9"]) {
      for (let n = 0; n < 12; n++) {
        const req = ingress(ip, {
          "idempotency-key": `synthetic-${ip.replaceAll(".", "-")}-${n}`,
          "x-forwarded-for": `203.0.113.${n}`,
        }, body);
        const response = await relay(
          req,
          ENV,
          ((outbound: Request) => submit(outbound, gateway)) as typeof fetch,
        );
        assertEquals(response.status, n < 10 ? 201 : 429);
        await response.body?.cancel();
      }
    }
    assertEquals(buckets.size, 2);
    assertEquals(writes, 20);
    for (
      const proof of [
        null,
        "forged",
        await signRelay(
          upstream(body),
          body,
          await visitorDigest("1.2.3.4", SECRET),
          SECRET,
          Date.now() - 120000,
        ),
      ]
    ) {
      const req = upstream(body);
      if (proof) req.headers.set(RELAY_HEADER, proof);
      const response = await submit(req, gateway);
      assertEquals(response.status, 403);
      await response.body?.cancel();
    }
    assertEquals(writes, 20);
    assertEquals(buckets.size, 2);
    const signed = upstream(body);
    signed.headers.set(
      RELAY_HEADER,
      await signRelay(
        signed,
        body,
        await visitorDigest("198.51.100.10", SECRET),
        SECRET,
      ),
    );
    // Gateway URL rewrites use the configured audience rather than an inbound Host.
    const rewritten = new Request("http://internal-gateway/submit-case", {
      method: "POST",
      headers: signed.headers,
      body,
    });
    const rewrittenResponse = await submit(rewritten, gateway);
    assertEquals(rewrittenResponse.status, 201);
    await rewrittenResponse.body?.cancel();
    assertEquals(writes, 21);
    Deno.env.set("INTAKE_RELAY_SECRET", "");
    let failure = await submit(signed.clone(), gateway);
    assertEquals(failure.status, 503);
    await failure.body?.cancel();
    Deno.env.set("INTAKE_RELAY_SECRET", SECRET);
    Deno.env.set("INTAKE_RELAY_REQUIRED", "false");
    failure = await submit(signed.clone(), gateway);
    assertEquals(failure.status, 503);
    await failure.body?.cancel();
    Deno.env.set("INTAKE_RELAY_REQUIRED", "true");
    Deno.env.delete("RATE_LIMIT_SALT");
    failure = await submit(signed.clone(), gateway);
    assertEquals(failure.status, 503);
    await failure.body?.cancel();
    assertEquals(writes, 21);
    Deno.env.set("QUESTIONNAIRE_APPROVED", "false");
    const response = await submit(upstream(body), gateway);
    assertEquals(response.status, 503);
    await response.body?.cancel();
    assertEquals(writes, 21);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of old) {
      value === undefined ? Deno.env.delete(key) : Deno.env.set(key, value);
    }
  }
});
