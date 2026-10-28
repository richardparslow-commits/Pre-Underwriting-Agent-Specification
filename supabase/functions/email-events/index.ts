/**
 * POST /functions/v1/email-events — provider delivery webhook.
 *
 * Deploy with JWT verification OFF:
 *
 *   [functions.email-events]
 *   verify_jwt = false
 *
 * Authentication is the provider's Svix signature over the raw body, not a
 * shared secret header. EMAIL_WEBHOOK_SECRET must be the `whsec_…` signing
 * secret. A missing or malformed secret fails closed (503), because accepting
 * unsigned delivery claims would make the portal's evidence untrustworthy.
 *
 * Events are deduplicated by svix-id and applied through a monotonic SQL
 * function: delivered cannot regress, and a late "sent" cannot overwrite a
 * bounce. Only non-clinical state is stored.
 */

import { jsonResponse, readBodyWithLimit, serviceClient } from "../_shared/case.ts";
import { verifySvixSignature } from "../_shared/svix.ts";

type NotificationState = "accepted" | "delivered" | "failed";

const MESSAGE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const CASE_REFERENCE_PATTERN = /^LPP-\d{4}-[0-9A-Z]{6}$/;
const MAX_WEBHOOK_BYTES = 64 * 1024;

function mapEvent(type: string): NotificationState | null {
  switch (type) {
    case "email.delivered":
      return "delivered";
    case "email.bounced":
    case "email.failed":
    case "email.complained":
      return "failed";
    case "email.sent":
    case "email.delivery_delayed":
      return "accepted";
    default:
      return null;
  }
}

function extractTag(tags: unknown): string | null {
  if (typeof tags !== "object" || tags === null) return null;
  const value = (tags as Record<string, unknown>)["case_reference"];
  return typeof value === "string" && CASE_REFERENCE_PATTERN.test(value) ? value : null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, null);
  }

  const secret = Deno.env.get("EMAIL_WEBHOOK_SECRET") ?? "";
  if (!secret.startsWith("whsec_")) {
    // Configuration error, not an authentication failure. Do not process.
    return jsonResponse({ error: "Webhook verification is not configured" }, 503, null);
  }

  const bodyResult = await readBodyWithLimit(req, MAX_WEBHOOK_BYTES);
  if (!bodyResult.ok) {
    return jsonResponse(
      { error: bodyResult.reason === "too_large" ? "Event too large" : "Invalid event" },
      bodyResult.reason === "too_large" ? 413 : 400,
      null,
    );
  }

  const rawBody = bodyResult.text;

  const verified = await verifySvixSignature({
    secret,
    headers: {
      id: req.headers.get("svix-id"),
      timestamp: req.headers.get("svix-timestamp"),
      signature: req.headers.get("svix-signature"),
    },
    rawBody,
  });

  if (!verified) {
    return jsonResponse({ error: "Invalid signature" }, 401, null);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid event" }, 400, null);
  }

  if (typeof body !== "object" || body === null) {
    return jsonResponse({ error: "Invalid event" }, 400, null);
  }

  const event = body as { type?: unknown; data?: unknown };
  const type = typeof event.type === "string" ? event.type : "";
  const state = mapEvent(type);

  // Unknown events are acknowledged so the provider stops retrying them.
  if (!state) {
    return jsonResponse({ ok: true, ignored: true }, 200, null);
  }

  const data =
    typeof event.data === "object" && event.data !== null
      ? (event.data as Record<string, unknown>)
      : {};

  const caseReference =
    typeof data.case_reference === "string" && CASE_REFERENCE_PATTERN.test(data.case_reference)
      ? data.case_reference
      : extractTag(data.tags);

  const messageId =
    typeof data.email_id === "string" && MESSAGE_ID_PATTERN.test(data.email_id)
      ? data.email_id
      : typeof data.id === "string" && MESSAGE_ID_PATTERN.test(data.id)
        ? data.id
        : null;

  if (!caseReference && !messageId) {
    return jsonResponse({ ok: true, ignored: true }, 200, null);
  }

  const eventId = req.headers.get("svix-id") ?? "";
  const supabase = serviceClient();

  const { data: result, error } = await supabase.rpc("apply_email_event", {
    p_event_id: eventId,
    p_event_type: type,
    p_reference: caseReference,
    p_message_id: messageId,
    p_state: state,
  });

  if (error) {
    console.error("Email event could not be recorded", error.code);
    return jsonResponse({ error: "Could not record event" }, 500, null);
  }

  // An event can precede storage of the provider message id. Acknowledge it
  // only after correlation; a non-2xx response asks the provider to retry the
  // signed event. The ledger retains the unmatched event for reprocessing.
  if (result === "unmatched") {
    return jsonResponse({ error: "Event not yet correlated" }, 503, null);
  }

  return jsonResponse({ ok: true, result }, 200, null);
});
