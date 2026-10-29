/**
 * POST /functions/v1/revoke-marketing — public marketing opt-out intake.
 *
 * A customer supplies a case reference and the email or telephone number on
 * that case. The database RPC matches both before it writes a suppression, so
 * knowing a reference alone is not enough. The response is intentionally the
 * same whether or not anything matched: this endpoint must not become a way to
 * test whether a reference/contact pair belongs to a real case.
 *
 * Deployed with JWT verification OFF because the customer is anonymous:
 *
 *   [functions.revoke-marketing]
 *   verify_jwt = false
 *
 * It is protected by the same Origin allowlist and durable salted rate limit as
 * the intake endpoint, plus an 8 KiB byte cap. It does not use the questionnaire
 * launch lock: a customer must be able to withdraw marketing consent even while
 * new intake is paused.
 *
 * The browser sends an `Idempotency-Key` per form attempt. The server hashes it
 * to the RPC request id, so a retry cannot create duplicate revocation evidence
 * or re-open an outbox row that the vendor worker already marked synced.
 */

import {
  clientKey,
  jsonResponse,
  readBodyWithLimit,
  resolveOrigin,
  serviceClient,
} from "../_shared/case.ts";

const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 10 * 60;
// Generated references are exactly six characters (see generateReference).
// Every other function uses the same shape; a wider pattern here would accept
// strings no case can have.
const REFERENCE_PATTERN = /^LPP-\d{4}-[0-9A-Z]{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

interface RevocationInput {
  reference: string;
  /** Normalised to +1XXXXXXXXXX; null when the customer did not supply one. */
  phone: string | null;
  /** Lower-cased; null when the customer did not supply one. */
  email: string | null;
  reason: string | null;
}

type ValidationResult =
  | { ok: true; value: RevocationInput }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalisePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return null;
}

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  return value.trim();
}

/**
 * Converts a caller idempotency key into the UUID stored on the revocation and
 * outbox rows. A SHA-256 digest, with UUID version/variant bits, is stable for
 * the same key and has no database round trip.
 */
export async function requestIdFromIdempotencyKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`marketing-revocation:${key}`),
  );
  const bytes = new Uint8Array(digest).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function validateRevocation(body: unknown): ValidationResult {
  if (!isRecord(body)) return { ok: false, error: "The request could not be read." };

  const reference = optionalString(body.reference)?.toUpperCase() ?? "";
  if (!reference) return { ok: false, error: "Enter your case reference." };
  if (!REFERENCE_PATTERN.test(reference)) {
    return { ok: false, error: "Enter the case reference exactly as it appears on your case." };
  }

  const rawPhone = optionalString(body.phone) ?? "";
  const rawEmail = optionalString(body.email) ?? "";

  if (!rawPhone && !rawEmail) {
    return { ok: false, error: "Enter the email address or telephone number on your case." };
  }

  let phone: string | null = null;
  if (rawPhone) {
    phone = normalisePhone(rawPhone);
    if (!phone) return { ok: false, error: "Enter a valid telephone number." };
  }

  let email: string | null = null;
  if (rawEmail) {
    email = rawEmail.toLowerCase();
    if (!EMAIL_PATTERN.test(email)) return { ok: false, error: "Enter a valid email address." };
  }

  const reason = optionalString(body.reason);
  if (reason && reason.length > 500) {
    return { ok: false, error: "Keep the reason under 500 characters." };
  }

  return {
    ok: true,
    value: { reference, phone, email, reason: reason || null },
  };
}

async function durableRateLimited(req: Request): Promise<boolean | null> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const salt = Deno.env.get("RATE_LIMIT_SALT");
  if (!url || !key || !salt) return null;

  try {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${salt}:revoke-marketing:${clientKey(req)}`),
    );
    const hash = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");

    const { data, error } = await serviceClient().rpc("consume_submission_rate", {
      p_key_hash: hash,
      p_limit: RATE_LIMIT,
      p_window_seconds: RATE_WINDOW_SECONDS,
    });

    if (error) {
      console.error("Revocation rate limit failed", error.code);
      return null;
    }
    return data === false;
  } catch {
    return null;
  }
}

function corsPreflight(origin: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, idempotency-key",
      "Access-Control-Max-Age": "600",
      Vary: "Origin",
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (req: Request) => {
  const origin = resolveOrigin(req);

  if (req.method === "OPTIONS") {
    if (!origin) return jsonResponse({ error: "Origin not allowed" }, 403, null);
    return corsPreflight(origin);
  }

  if (!origin) return jsonResponse({ error: "Origin not allowed" }, 403, null);
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, origin);

  const bodyResult = await readBodyWithLimit(req, MAX_BODY_BYTES);
  if (!bodyResult.ok) {
    if (bodyResult.reason === "too_large") {
      return jsonResponse({ error: "Request too large" }, 413, origin);
    }
    return jsonResponse({ error: "The request could not be read." }, 400, origin);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyResult.text);
  } catch {
    return jsonResponse({ error: "The request could not be read." }, 400, origin);
  }

  const validation = validateRevocation(parsed);
  if (!validation.ok) {
    return jsonResponse({ error: validation.error }, 400, origin);
  }

  const idempotencyHeader = req.headers.get("idempotency-key");
  let idempotencyKey: string;
  if (idempotencyHeader !== null) {
    const trimmed = idempotencyHeader.trim();
    if (!IDEMPOTENCY_KEY_PATTERN.test(trimmed)) {
      return jsonResponse({ error: "Invalid idempotency key." }, 400, origin);
    }
    idempotencyKey = trimmed;
  } else {
    // Older cached clients do not send the header. A stable body-derived key
    // still makes their retries replay-safe without making the header a hard
    // breaking change.
    idempotencyKey = `body:${validation.value.reference}:${validation.value.phone ?? ""}:${validation.value.email ?? ""}`;
  }
  const requestId = await requestIdFromIdempotencyKey(idempotencyKey);

  // Validate before spending a rate-limit slot: a malformed request should not
  // let an attacker exhaust a real customer's revocation attempts.
  const durableLimited = await durableRateLimited(req);
  if (durableLimited === true) {
    return jsonResponse(
      { error: "Too many requests from this connection. Please try again shortly." },
      429,
      origin,
    );
  }
  if (durableLimited === null) {
    console.error("Revocation rate limiter is unavailable");
    return jsonResponse(
      {
        error:
          "The request could not be recorded. Please email us using the address on the opt-out page.",
      },
      503,
      origin,
    );
  }

  try {
    const { error } = await serviceClient().rpc("request_marketing_revocation", {
      p_reference: validation.value.reference,
      p_phone: validation.value.phone,
      p_email: validation.value.email,
      p_reason: validation.value.reason,
      p_source: "customer_web",
      p_request_id: requestId,
    });

    if (error) {
      // Do not log the reference or contact. The code is enough for triage.
      console.error("Marketing revocation failed", error.code);
      return jsonResponse(
        {
          error:
            "The request could not be recorded. Please email us using the address on the opt-out page.",
        },
        503,
        origin,
      );
    }
  } catch {
    console.error("Marketing revocation request failed");
    return jsonResponse(
      {
        error:
          "The request could not be recorded. Please email us using the address on the opt-out page.",
      },
      503,
      origin,
    );
  }

  // A non-match is deliberately indistinguishable from a match.
  return jsonResponse({ status: "received" }, 202, origin);
});
