/**
 * POST /functions/v1/retry-case-notifications — scheduled notification retry.
 *
 * Deploy with JWT verification OFF and invoke it from Supabase Cron (or any
 * scheduler) with the `x-cron-secret` header:
 *
 *   [functions.retry-case-notifications]
 *   verify_jwt = false
 *
 * Retries only touch the notification columns of an existing case. A retry can
 * never create a second case, and a case that already reached the provider is
 * not sent again, because `notification_state` moves to 'accepted'.
 *
 * Records older than two minutes are eligible, so a submission that is still
 * in flight is not picked up concurrently.
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

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, null);
  }

  const expected = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!expected || !provided || provided !== expected) {
    return jsonResponse({ error: "Unauthorized" }, 401, null);
  }

  const origin = portalOrigin();
  const now = Date.now();
  const olderThan = new Date(now - MIN_AGE_MS).toISOString();
  const newerThan = new Date(now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const supabase = serviceClient();

  const { data, error } = await supabase
    .from("cases")
    .select("reference, submitted_at, notification_attempts")
    .in("notification_state", ["queued", "failed"])
    .lt("notification_attempts", MAX_ATTEMPTS)
    .lt("submitted_at", olderThan)
    .gt("submitted_at", newerThan)
    .order("submitted_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Retry query failed", error.code);
    return jsonResponse({ error: "Retry query failed" }, 500, null);
  }

  const rows = (data ?? []) as RetryRow[];
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    const result = await sendCaseNotification({
      reference: row.reference,
      submittedAt: row.submitted_at,
      portalOrigin: origin,
    });

    if (result.state === "not_sent") {
      // No provider configured: leave the row queued for a later attempt
      // rather than marking it failed and hiding the configuration gap.
      skipped += 1;
      continue;
    }

    const attempts = (row.notification_attempts ?? 0) + 1;
    const { error: updateError } = await supabase
      .from("cases")
      .update({
        notification_state: result.state,
        notification_attempts: attempts,
        notification_detail: notificationDetailForStorage(result),
        notification_updated_at: new Date().toISOString(),
      })
      .eq("reference", row.reference);

    if (updateError) {
      console.error("Retry update failed", updateError.code);
      failed += 1;
      continue;
    }

    if (result.state === "failed") failed += 1;
    else sent += 1;
  }

  // Counts only: the scheduler does not need case detail.
  return jsonResponse(
    { inspected: rows.length, sent, failed, skipped },
    200,
    null,
  );
});
