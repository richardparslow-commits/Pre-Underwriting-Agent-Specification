/**
 * POST /functions/v1/sync-marketing-suppressions — vendor propagation worker.
 *
 * Deploy with JWT verification OFF and invoke from Supabase Cron (or another
 * scheduler) with the `x-cron-secret` header:
 *
 *   [functions.sync-marketing-suppressions]
 *   verify_jwt = false
 *
 * The suppression is already effective in Postgres before this worker runs.
 * This function only propagates the do-not-contact row to the configured
 * vendor/CRM webhook. Without `MARKETING_SUPPRESSION_WEBHOOK_URL` and
 * `MARKETING_SUPPRESSION_WEBHOOK_SECRET` it reports `not_configured` and leaves
 * every row pending. It never sends health answers, names or case payloads.
 */

import { jsonResponse, serviceClient } from "../_shared/case.ts";

const BATCH_SIZE = 100;
const VENDOR_TIMEOUT_MS = 8_000;
const MAX_RUN_MS = 25_000;

interface PendingSuppression {
  channel: "phone" | "email";
  address_normalized: string;
  source_case_reference: string | null;
  request_id: string | null;
  attempts: number;
  created_at: string;
  vendor_address: string;
  claim_token: string;
}

interface VendorResponse {
  ok: boolean;
  status: number;
}

async function propagate(
  url: string,
  secret: string,
  row: PendingSuppression,
): Promise<VendorResponse> {
  if (
    !row.vendor_address ||
    (row.channel === "phone" && !/^1\d{10}$/.test(row.vendor_address))
  ) {
    return { ok: false, status: 0 };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VENDOR_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        // A vendor should treat this key as idempotent. The address is already
        // normalised and is the only customer identifier sent.
        "Idempotency-Key": `suppress:${row.channel}:${row.vendor_address}`,
      },
      body: JSON.stringify({
        action: "suppress",
        channel: row.channel,
        address: row.vendor_address,
        reason: "Customer marketing revocation",
      }),
      signal: controller.signal,
    });
    // Only status matters; do not retain or log a body containing contact data.
    void response.body?.cancel().catch(() => {});
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timeout);
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

  const url = Deno.env.get("MARKETING_SUPPRESSION_WEBHOOK_URL");
  const secret = Deno.env.get("MARKETING_SUPPRESSION_WEBHOOK_SECRET");
  if (!url || !secret) {
    return jsonResponse(
      {
        inspected: 0,
        synced: 0,
        failed: 0,
        provider: "not_configured",
      },
      200,
      null,
    );
  }

  const supabase = serviceClient();
  const worker = `suppression:${crypto.randomUUID()}`;
  const startedAt = Date.now();
  let inspected = 0;
  let synced = 0;
  let failed = 0;
  let skipped = 0;

  // Lease only the row about to be sent, never a long sequential batch.
  for (
    let index = 0;
    index < BATCH_SIZE && Date.now() - startedAt < MAX_RUN_MS;
    index++
  ) {
    const { data, error } = await supabase.rpc(
      "claim_next_marketing_suppression",
      {
        p_worker: worker,
        p_lease_seconds: 600,
      },
    );
    if (error) {
      console.error("Suppression claim failed", error.code);
      return jsonResponse({ error: "Suppression claim failed" }, 500, null);
    }
    const row = (data as PendingSuppression[] | null)?.[0];
    if (!row) break;
    if (!row.claim_token) {
      return jsonResponse(
        { error: "Suppression lease unavailable" },
        500,
        null,
      );
    }
    inspected++;
    const vendor = await propagate(url, secret, row);
    const { data: marked, error: markError } = await supabase.rpc(
      "complete_marketing_suppression",
      {
        p_channel: row.channel,
        // Ack the exact stored key, including a legacy ten-digit phone.
        p_address: row.address_normalized,
        p_worker: worker,
        p_claim_token: row.claim_token,
        p_state: vendor.ok ? "synced" : "failed",
        p_detail: vendor.ok
          ? null
          : vendor.status
          ? `Vendor status ${vendor.status}`
          : "Vendor request failed or stored address invalid",
      },
    );

    if (markError) {
      console.error("Suppression result write failed", markError.code);
      failed += 1;
    } else if (marked !== true) skipped++;
    else if (vendor.ok) synced++;
    else failed++;
  }

  // Counts only: the scheduler does not need contact information.
  return jsonResponse(
    {
      inspected,
      synced,
      failed,
      skipped,
      provider: "webhook",
    },
    200,
    null,
  );
});
