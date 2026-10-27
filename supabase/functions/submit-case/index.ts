/**
 * POST /functions/v1/submit-case — public pre-underwriting intake.
 *
 * Supabase requires a JWT for edge functions by default, but customers are
 * anonymous visitors, so this function must be deployed with JWT verification
 * OFF. Add the following to `supabase/config.toml` and deploy:
 *
 *   [functions.submit-case]
 *   verify_jwt = false
 *
 * The function is still protected by:
 *   * an Origin allowlist (APP_ORIGIN, plus localhost in development),
 *   * a per-instance rate limit,
 *   * a 512 KB body cap and a 400-answer cap,
 *   * strict server-side validation and rebuilding of the payload,
 *   * a server-generated case reference (a client cannot choose one).
 *
 * Submissions are written before any email is attempted. If email fails, the
 * case survives and the response reports the failure honestly.
 */

import {
  generateReference,
  jsonResponse,
  rateLimited,
  clientKey,
  resolveOrigin,
  serviceClient,
  validateDraft,
} from "../_shared/case.ts";
import { notificationDetailForStorage, sendCaseNotification } from "../_shared/email.ts";

const MAX_BODY_BYTES = 512 * 1024;
const REFERENCE_ATTEMPTS = 5;

function portalOrigin(): string {
  const raw = Deno.env.get("APP_ORIGIN") ?? "";
  return raw.split(",")[0]?.trim().replace(/\/$/, "") ?? "";
}

Deno.serve(async (req: Request) => {
  const origin = resolveOrigin(req);

  if (req.method === "OPTIONS") {
    if (!origin) {
      return jsonResponse({ error: "Origin not allowed" }, 403, null);
    }
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
        "Cache-Control": "no-store",
      },
    });
  }

  if (!origin) {
    return jsonResponse({ error: "Origin not allowed" }, 403, null);
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: "Submission too large" }, 413, origin);
  }

  if (rateLimited(clientKey(req))) {
    return jsonResponse(
      { error: "Too many submissions from this connection. Please try again shortly." },
      429,
      origin,
    );
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return jsonResponse({ error: "Could not read submission" }, 400, origin);
  }

  // Content-Length can be absent or lie, so measure the body we actually got.
  if (raw.length > MAX_BODY_BYTES) {
    return jsonResponse({ error: "Submission too large" }, 413, origin);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: "Invalid submission" }, 400, origin);
  }

  const validation = validateDraft(parsed);
  if (!validation.ok) {
    return jsonResponse({ error: validation.reason }, 422, origin);
  }
  const draft = validation.draft;

  const supabase = serviceClient();
  const submittedAt = new Date().toISOString();

  // ---- Create the case first, before any notification is attempted --------
  let reference = "";
  let inserted = false;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < REFERENCE_ATTEMPTS && !inserted; attempt += 1) {
    reference = generateReference();
    const payload = {
      ...draft,
      reference,
      submittedAt,
      status: "submitted" as const,
      notification: {
        state: "queued" as const,
        updatedAt: submittedAt,
        detail: "Notification queued",
        attempts: 0,
      },
      reviewLog: [],
    };

    const { error } = await supabase.from("cases").insert({
      reference,
      submitted_at: submittedAt,
      questionnaire_version: draft.questionnaireVersion,
      status: "submitted",
      crisis_disclosure: draft.crisisDisclosure,
      residence_state: draft.lead.state,
      notification_state: "queued",
      notification_attempts: 0,
      notification_detail: null,
      notification_updated_at: submittedAt,
      payload,
    });

    if (!error) {
      inserted = true;
      break;
    }

    lastError = error;
    // 23505 = unique_violation: extremely unlikely, but retry a new reference.
    if (error.code !== "23505") break;
  }

  if (!inserted) {
    // Deliberately not logging error details: they can embed submitted values.
    console.error("Case creation failed", (lastError as { code?: string } | null)?.code ?? "unknown");
    return jsonResponse(
      { error: "The case could not be saved. Nothing was sent. Please try again." },
      500,
      origin,
    );
  }

  // ---- Then notify. Failures are recorded, never hidden -------------------
  const result = await sendCaseNotification({
    reference,
    submittedAt,
    portalOrigin: portalOrigin(),
  });

  const attempts = result.state === "not_sent" ? 0 : 1;
  const detail = notificationDetailForStorage(result);

  const { error: updateError } = await supabase
    .from("cases")
    .update({
      notification_state: result.state,
      notification_attempts: attempts,
      notification_detail: detail,
      notification_updated_at: new Date().toISOString(),
    })
    .eq("reference", reference);

  if (updateError) {
    // The case is safe; the outbox row can be reconciled by the retry job.
    console.error("Notification status update failed", updateError.code);
  }

  return jsonResponse(
    {
      reference,
      submittedAt,
      status: "submitted",
      notification: {
        state: result.state,
        updatedAt: new Date().toISOString(),
        detail: result.detail,
        attempts,
      },
    },
    201,
    origin,
  );
});
