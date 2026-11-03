/** Cloudflare Worker ingress only. No service-role key, persistence or logging. */
import {
  MAX_RELAY_BODY,
  RELAY_HEADER,
  signRelay,
  visitorDigest,
} from "../../supabase/functions/_shared/intake-relay.ts";
export interface RelayEnv {
  QUESTIONNAIRE_APPROVED?: string;
  APP_ORIGIN?: string;
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  INTAKE_RELAY_SECRET?: string;
}
type IngressRequest = Request & { cf?: { colo?: string } };

/** Canonicalize IP literals; never accept lists, ports, arbitrary names or prefixes. */
export function canonicalIP(value: string | null): string | null {
  if (!value || value.trim() !== value) return null;
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    const parts = value.split(".");
    if (parts.some((p) => Number(p) > 255 || String(Number(p)) !== p)) {
      return null;
    }
    return parts.join(".");
  }
  if (!/^[a-fA-F0-9:]+$/.test(value) || !value.includes(":")) return null;
  try {
    return new URL(`https://[${value}]/`).hostname.slice(1, -1);
  } catch {
    return null;
  }
}
export async function relay(
  request: IngressRequest,
  env: RelayEnv,
  send: typeof fetch = fetch,
): Promise<Response> {
  const origin = request.headers.get("origin") ?? "";
  const allowed = (env.APP_ORIGIN ?? "").split(",").map((v) => v.trim()).filter(
    Boolean,
  );
  const headers = new Headers({
    "content-type": "application/json",
    "cache-control": "no-store",
    vary: "Origin",
  });
  if (allowed.includes(origin)) {
    headers.set("access-control-allow-origin", origin);
  }
  const reply = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers });
  const url = new URL(request.url);
  if (
    url.protocol !== "https:" || url.pathname !== "/submit-case" || url.search
  ) return reply(404, "Not found");
  if (!origin || !allowed.includes(origin)) {
    return reply(403, "Origin not allowed");
  }
  if (request.method === "OPTIONS") {
    headers.set("access-control-allow-methods", "POST, OPTIONS");
    headers.set(
      "access-control-allow-headers",
      "authorization, apikey, content-type, idempotency-key, x-client-info",
    );
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") return reply(405, "Method not allowed");
  if (env.QUESTIONNAIRE_APPROVED !== "true") {
    return reply(
      503,
      "This questionnaire is not yet approved for live submissions.",
    );
  }
  // Only original Cloudflare ingress is supported. Worker subrequests have
  // different IP semantics; block them here AND with the documented WAF rule.
  if (
    !request.cf?.colo || request.headers.has("cf-worker") ||
    request.headers.has("cf-connecting-ipv6")
  ) {
    return reply(503, "Verified visitor connection unavailable");
  }
  const ip = canonicalIP(request.headers.get("cf-connecting-ip"));
  if (!ip || ip === "2a06:98c0:3600::103") {
    return reply(503, "Verified visitor connection unavailable");
  }
  let backend: URL;
  try {
    backend = new URL(env.SUPABASE_URL ?? "");
    if (
      backend.protocol !== "https:" ||
      !/^[a-z0-9]{20}\.supabase\.co$/.test(backend.hostname) ||
      backend.port || backend.username || backend.password || backend.search ||
      backend.hash || backend.pathname !== "/"
    ) throw new Error();
  } catch {
    return reply(503, "Submission service is not configured");
  }
  if (
    !env.SUPABASE_PUBLISHABLE_KEY || (env.INTAKE_RELAY_SECRET?.length ?? 0) < 32
  ) return reply(503, "Submission service is not configured");
  const submissionKey = request.headers.get("idempotency-key") ?? "";
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(submissionKey)) {
    return reply(400, "A valid idempotency key is required");
  }
  if (Number(request.headers.get("content-length")) > MAX_RELAY_BODY) {
    return reply(413, "Submission too large");
  }
  let body: string;
  try {
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RELAY_BODY) {
        await reader.cancel();
        return reply(413, "Submission too large");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    body = new TextDecoder().decode(bytes);
  } catch {
    return reply(400, "Could not read submission");
  }
  const destination = new URL("/functions/v1/submit-case", backend);
  const outbound = new Request(destination, {
    method: "POST",
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
    body,
    headers: {
      origin,
      "content-type": "application/json",
      "idempotency-key": submissionKey,
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
    },
  });
  outbound.headers.set(
    RELAY_HEADER,
    await signRelay(
      outbound,
      body,
      await visitorDigest(ip, env.INTAKE_RELAY_SECRET!),
      env.INTAKE_RELAY_SECRET!,
    ),
  );
  try {
    const result = await send(outbound);
    if (result.status >= 300 && result.status < 400) {
      await result.body?.cancel();
      return reply(502, "Submission service unavailable");
    }
    // Never return arbitrary upstream cookies, CORS headers or redirect targets.
    return new Response(await result.text(), {
      status: result.status,
      headers,
    });
  } catch {
    return reply(
      504,
      "Submission response unavailable. Retry without changing your answers.",
    );
  }
}
export default {
  fetch: (request: IngressRequest, env: RelayEnv) => relay(request, env),
};
