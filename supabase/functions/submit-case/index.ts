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
 *   * a durable salted rate limit; production fails closed if it is unavailable,
 *   * a streaming 512 KB byte cap and a canonical 92-row completeness check,
 *   * strict server-side validation and rebuilding of the payload,
 *   * a server-generated case reference (a client cannot choose one).
 *
 * Submissions are written before any email is attempted. If email fails, the
 * case survives and the response reports the failure honestly.
 */

import {
  generateReference,
  jsonResponse,
  questionnaireApproved,
  rateLimited,
  clientKey,
  readBodyWithLimit,
  resolveOrigin,
  serviceClient,
  validateDraft,
} from "../_shared/case.ts";
import {
  notificationBlocker,
  notificationDetailForStorage,
  sendCaseNotification,
} from "../_shared/email.ts";

const MAX_BODY_BYTES = 512 * 1024;
const REFERENCE_ATTEMPTS = 5;

function portalOrigin(): string {
  const raw = Deno.env.get("APP_ORIGIN") ?? "";
  return raw.split(",")[0]?.trim().replace(/\/$/, "") ?? "";
}

interface ReceiptRow {
  reference: string;
  submitted_at: string;
  status: string;
  notification_state: string;
  notification_attempts: number;
  notification_detail: string | null;
  notification_updated_at: string | null;
}

async function durableRateLimited(req: Request): Promise<boolean | null> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const salt = Deno.env.get("RATE_LIMIT_SALT");
  if (!url || !key || !salt) return null;

  try {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${salt}:${clientKey(req)}`),
    );
    const hash = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");

    const { data, error } = await serviceClient().rpc("consume_submission_rate", {
      p_key_hash: hash,
      p_limit: 10,
      p_window_seconds: 600,
    });

    if (error) {
      console.error("Durable rate limit failed", error.code);
      return null;
    }
    return data === false;
  } catch {
    return null;
  }
}

function receiptFromRow(row: ReceiptRow, replayed = false) {
  let note: string | undefined;
  if (row.notification_detail) {
    try {
      const parsed: unknown = JSON.parse(row.notification_detail);
      if (parsed && typeof parsed === "object" && "note" in parsed) {
        const value = (parsed as { note?: unknown }).note;
        if (typeof value === "string" && value) note = value;
      }
    } catch {
      note = "Status recorded";
    }
  }

  return {
    reference: row.reference,
    submittedAt: row.submitted_at,
    status: row.status,
    notification: {
      state: row.notification_state,
      updatedAt: row.notification_updated_at ?? row.submitted_at,
      detail: note,
      attempts: row.notification_attempts,
    },
    replayed,
  };
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
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, idempotency-key",
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

  // A live endpoint must refuse real intake until a named reviewer has
  // approved the questionnaire. This is the launch lock for M-03; it is not a
  // substitute for the missing sign-off.
  if (!questionnaireApproved()) {
    return jsonResponse(
      {
        error:
          "This questionnaire is not yet approved for live submissions. No case was saved and nothing was sent.",
      },
      503,
      origin,
    );
  }

  const idempotencyKey = (req.headers.get("idempotency-key") ?? "").trim();
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)) {
    return jsonResponse({ error: "A valid idempotency key is required" }, 400, origin);
  }

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: "Submission too large" }, 413, origin);
  }

  // A durable, salted counter is used when the project is configured. If it is
  // unavailable, production must fail closed: the in-memory limiter cannot
  // coordinate across instances and is reserved for the explicit test mode.
  const durableLimited = await durableRateLimited(req);
  if (durableLimited === true) {
    return jsonResponse(
      { error: "Too many submissions from this connection. Please try again shortly." },
      429,
      origin,
    );
  }
  if (durableLimited === null) {
    if (Deno.env.get("ENVIRONMENT") === "test") {
      if (rateLimited(clientKey(req))) {
        return jsonResponse(
          { error: "Too many submissions from this connection. Please try again shortly." },
          429,
          origin,
        );
      }
    } else {
      console.error("Durable rate limiter is unavailable");
      return jsonResponse(
        {
          error:
            "Submissions are temporarily unavailable. Nothing was saved and nothing was sent.",
        },
        503,
        origin,
      );
    }
  }

  // Content-Length can be absent or lie, so the byte budget is enforced while
  // streaming the body, before any JSON parsing or validation.
  const bodyResult = await readBodyWithLimit(req, MAX_BODY_BYTES);
  if (!bodyResult.ok) {
    if (bodyResult.reason === "too_large") {
      return jsonResponse({ error: "Submission too large" }, 413, origin);
    }
    return jsonResponse({ error: "Could not read submission" }, 400, origin);
  }
  const raw = bodyResult.text;

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

  // ---- A retried request returns the original case, never a second one ----
  const existing = await supabase
    .from("cases")
    .select(
      "reference, submitted_at, status, notification_state, notification_attempts, notification_detail, notification_updated_at",
    )
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing.error) {
    console.error("Idempotency lookup failed", existing.error.code);
    return jsonResponse(
      { error: "The case could not be saved. Nothing was sent. Please try again." },
      500,
      origin,
    );
  }

  if (existing.data) {
    return jsonResponse(receiptFromRow(existing.data, true), 200, origin);
  }

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
      server_received_at: submittedAt,
      idempotency_key: idempotencyKey,
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
    // 23505 = unique_violation. If it was the idempotency key, another request
    // won the race and this one must return that case instead of creating one.
    if (error.code === "23505") {
      const replay = await supabase
        .from("cases")
        .select(
          "reference, submitted_at, status, notification_state, notification_attempts, notification_detail, notification_updated_at",
        )
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (replay.data) {
        return jsonResponse(receiptFromRow(replay.data, true), 200, origin);
      }

      // Otherwise the collision was the reference: retry with a new one.
      continue;
    }
    break;
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

  // ---- Then notify under a lease. A retry can never send concurrently ------
  // With no provider there is nothing to send, and claiming would stamp the
  // first-attempt time (0010), starting the provider idempotency window and
  // making the case unretryable 24 hours later. Record the honest state without
  // taking a lease, so it keeps the seven-day `not_sent` recovery path.
  const destination = portalOrigin();
  const blocker = notificationBlocker(destination);
  if (blocker) {
    const { error } = await supabase.rpc("complete_case_notification", {
      p_reference: reference,
      p_state: "not_sent",
      p_detail: notificationDetailForStorage({ state: "not_sent", detail: blocker }),
      p_message_id: null,
    });
    if (error) console.error("Notification status update failed", error.code);

    return jsonResponse(
      {
        reference,
        submittedAt,
        status: "submitted",
        notification: {
          state: "not_sent",
          updatedAt: new Date().toISOString(),
          detail: blocker,
          attempts: 0,
        },
      },
      201,
      origin,
    );
  }

  const worker = `submit-case:${crypto.randomUUID()}`;
  const claim = await supabase.rpc("claim_case_notification", {
    p_reference: reference,
    p_worker: worker,
  });

  if (claim.error || !claim.data || claim.data.length === 0) {
    if (claim.error) console.error("Notification claim failed", claim.error.code);
    return jsonResponse(
      {
        reference,
        submittedAt,
        status: "submitted",
        notification: {
          state: "queued",
          updatedAt: submittedAt,
          detail: "Notification queued for the retry worker",
          attempts: 0,
        },
      },
      201,
      origin,
    );
  }

  const attempts = Number(claim.data[0]?.notification_attempts ?? 1);
  const result = await sendCaseNotification({
    reference,
    submittedAt,
    portalOrigin: destination,
    idempotencyKey: reference,
  });

  const detail = notificationDetailForStorage(result);
  const { error: completeError } = await supabase.rpc("complete_case_notification", {
    p_reference: reference,
    p_state: result.state,
    p_detail: detail,
    p_message_id: result.messageId ?? null,
  });

  if (completeError) {
    // The case is safe and the provider may have accepted the message. The
    // retry worker will reconcile using the same idempotency key.
    console.error("Notification status update failed", completeError.code);
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
