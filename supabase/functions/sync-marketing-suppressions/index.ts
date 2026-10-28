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

interface PendingSuppression {
  channel: "phone" | "email";
  address_normalized: string;
  source_case_reference: string | null;
  request_id: string | null;
  attempts: number;
  created_at: string;
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
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        // A vendor should treat this key as idempotent. The address is already
        // normalised and is the only customer identifier sent.
        "Idempotency-Key": `suppress:${row.channel}:${row.address_normalized}`,
      },
      body: JSON.stringify({
        action: "suppress",
        channel: row.channel,
        address: row.address_normalized,
        reason: "Customer marketing revocation",
      }),
      signal: AbortSignal.timeout(VENDOR_TIMEOUT_MS),
    });

    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: 0 };
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
  const { data, error } = await supabase.rpc("pending_marketing_suppressions", {
    p_limit: BATCH_SIZE,
  });

  if (error) {
    console.error("Suppression queue read failed", error.code);
    return jsonResponse({ error: "Suppression queue read failed" }, 500, null);
  }

  const rows = (data ?? []) as PendingSuppression[];
  let synced = 0;
  let failed = 0;

  for (const row of rows) {
    const vendor = await propagate(url, secret, row);

    if (!vendor.ok) {
      const { error: failureError } = await supabase.rpc(
        "mark_marketing_suppression_failed",
        {
          p_channel: row.channel,
          p_address: row.address_normalized,
          p_error: vendor.status ? `Vendor status ${vendor.status}` : "Vendor request failed",
        },
      );
      if (failureError) {
        console.error("Suppression failure write failed", failureError.code);
      }
      failed += 1;
      continue;
    }

    const { data: marked, error: markError } = await supabase.rpc(
      "mark_marketing_suppression_synced",
      {
        p_channel: row.channel,
        p_address: row.address_normalized,
        p_provider: "marketing-webhook",
      },
    );

    if (markError || marked !== true) {
      if (markError) console.error("Suppression sync write failed", markError.code);
      failed += 1;
      continue;
    }

    synced += 1;
  }

  // Counts only: the scheduler does not need contact information.
  return jsonResponse(
    {
      inspected: rows.length,
      synced,
      failed,
      provider: "webhook",
    },
    200,
    null,
  );
});
