/**
 * POST /functions/v1/retry-case-notifications — scheduled notification retry.
 *
 * Deploy with JWT verification OFF and invoke from Supabase Cron (or any
 * scheduler) with the `x-cron-secret` header:
 *
 *   [functions.retry-case-notifications]
 *   verify_jwt = false
 *
 * Reliability rules:
 *   * the worker claims a row with `claim_case_notification` before sending;
 *     an overlapping invocation gets no row and sends nothing,
 *   * the provider idempotency key is the stable case reference, so a crash
 *     after provider acceptance cannot create a second email on retry,
 *   * `not_sent` is eligible once a provider is configured, which recovers
 *     cases submitted before email was set up,
 *   * attempts and backoff are persisted; no state is kept in memory.
 */

import { jsonResponse, serviceClient } from "../_shared/case.ts";
import { notificationDetailForStorage, sendCaseNotification } from "../_shared/email.ts";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 20;
const MIN_AGE_MS = 2 * 60 * 1000;
const MAX_AGE_DAYS = 7;

function portalOrigin(): string {
  const raw = Deno.env.get("APP_ORIGIN") ?? "";
  return raw.split(",")[0]?.trim().replace(/\/$/, "") ?? "";
}

interface RetryRow {
  reference: string;
  submitted_at: string;
  notification_attempts: number;
}

async function requestedReference(req: Request): Promise<string | null> {
  const raw = await req.text().catch(() => "");
  if (!raw.trim()) return null;
  if (raw.length > 4096) return null;
  try {
    const body = JSON.parse(raw) as { reference?: unknown };
    return typeof body.reference === "string" && /^LPP-\d{4}-[0-9A-Z]{6}$/.test(body.reference)
      ? body.reference
      : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, null);
  }

  const expected = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!expected || !provided || provided !== expected) {
    return jsonResponse({ error: "Unauthorized" }, 401, null);
  }

  // Without a provider, claiming rows would burn attempts for no benefit.
  if (!Deno.env.get("RESEND_API_KEY")) {
    return jsonResponse({ inspected: 0, sent: 0, failed: 0, skipped: 0, provider: "not_configured" }, 200, null);
  }

  const origin = portalOrigin();
  if (!origin) {
    return jsonResponse({ inspected: 0, sent: 0, failed: 0, skipped: 0, portal: "not_configured" }, 200, null);
  }

  const single = await requestedReference(req);
  const now = Date.now();
  const olderThan = new Date(now - MIN_AGE_MS).toISOString();
  const newerThan = new Date(now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const supabase = serviceClient();

  let query = supabase
    .from("cases")
    .select("reference, submitted_at, notification_attempts")
    .in("notification_state", ["queued", "failed", "not_sent"])
    .lt("notification_attempts", MAX_ATTEMPTS)
    .gt("submitted_at", newerThan)
    .order("submitted_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (single) {
    query = query.eq("reference", single);
  } else {
    // A submission still in flight is left alone for two minutes. The claim
    // function remains the authoritative guard against overlap.
    query = query.lt("submitted_at", olderThan);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Retry query failed", error.code);
    return jsonResponse({ error: "Retry query failed" }, 500, null);
  }

  const rows = (data ?? []) as RetryRow[];
  const worker = `retry:${crypto.randomUUID()}`;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    const claim = await supabase.rpc("claim_case_notification", {
      p_reference: row.reference,
      p_worker: worker,
    });

    if (claim.error) {
      console.error("Notification claim failed", claim.error.code);
      failed += 1;
      continue;
    }
    if (!claim.data || claim.data.length === 0) {
      // Another worker owns it, it is not due yet, or the attempt cap is hit.
      skipped += 1;
      continue;
    }

    const result = await sendCaseNotification({
      reference: row.reference,
      submittedAt: row.submitted_at,
      portalOrigin: origin,
      idempotencyKey: row.reference,
    });

    const { error: completeError } = await supabase.rpc("complete_case_notification", {
      p_reference: row.reference,
      p_state: result.state,
      p_detail: notificationDetailForStorage(result),
      p_message_id: result.messageId ?? null,
    });

    if (completeError) {
      console.error("Retry completion failed", completeError.code);
      failed += 1;
      continue;
    }

    if (result.state === "failed" || result.state === "not_sent") failed += 1;
    else sent += 1;
  }

  // Counts only: the scheduler does not need case detail.
  return jsonResponse(
    { inspected: rows.length, sent, failed, skipped },
    200,
    null,
  );
});
