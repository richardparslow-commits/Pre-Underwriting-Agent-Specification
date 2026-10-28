/**
 * Case notification email.
 *
 * Design rules enforced here:
 *   * The recipient is fixed on the server. Neither the customer, the browser
 *     nor a language model can influence it.
 *   * The message carries no health information, no name and no date of birth.
 *     It is a pointer to the authenticated portal, not the case itself.
 *   * "Accepted by the provider" is never reported as "delivered".
 */

/** Approved review mailbox. This is the only address the product may notify. */
export const APPROVED_RECIPIENT = "richardparslow@lifepolicypilot.blog";

export interface NotificationResult {
  state: "accepted" | "queued" | "failed" | "not_sent";
  /** Safe operational detail. Never contains customer data. */
  detail?: string;
  /** Provider message id, used to reconcile delivery webhooks. */
  messageId?: string;
}

/**
 * Resolves the recipient from the server environment, but only if it matches
 * the approved allowlist. Anything else falls back to the constant.
 */
export function resolveRecipient(): string {
  const configured = (Deno.env.get("CASE_NOTIFY_TO") ?? "").trim().toLowerCase();
  if (!configured) return APPROVED_RECIPIENT;

  const allowlist = [APPROVED_RECIPIENT];
  if (allowlist.includes(configured)) return configured;

  console.warn("CASE_NOTIFY_TO is not in the approved recipient allowlist; using the default");
  return APPROVED_RECIPIENT;
}

export function buildNotification(input: {
  reference: string;
  submittedAt: string;
  portalOrigin: string;
}): { subject: string; text: string; to: string } {
  const submitted = new Date(input.submittedAt).toISOString().replace(".000", "");
  const portalUrl = `${input.portalOrigin.replace(/\/$/, "")}/portal`;

  const text = [
    "A customer has submitted a pre-underwriting questionnaire for your review.",
    "",
    "Sign in to the secure review portal to view the submitted answers and case summary.",
    "",
    `Case reference: ${input.reference}`,
    `Submission time: ${submitted} (UTC)`,
    "Status: Submitted for review",
    "",
    `Portal: ${portalUrl}`,
    "",
    "---",
    "This message contains no health information, names or dates of birth.",
    "The portal requires an authorised sign-in. A forwarded copy of this email does not grant access.",
    "Life Policy Pilot",
  ].join("\n");

  return {
    to: resolveRecipient(),
    subject: `New Life Policy Pilot pre-underwriting submission — Case ${input.reference}`,
    text,
  };
}

/**
 * Sends the notification. Returns an honest state:
 *   not_sent — no provider configured, nothing was transmitted
 *   accepted — the provider accepted the message for delivery
 *   failed   — the provider rejected it or the request errored
 *
 * Delivery itself is confirmed only by the provider webhook, which updates
 * cases.notification_state to 'delivered'.
 *
 * Provider acceptance is reconciled by the `email-events` webhook, which
 * verifies the Svix signature over the raw request body before recording a
 * delivery event.
 */
export async function sendCaseNotification(input: {
  reference: string;
  submittedAt: string;
  portalOrigin: string;
  /** Stable across retries so the provider can deduplicate a resent message. */
  idempotencyKey?: string;
}): Promise<NotificationResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return { state: "not_sent", detail: "Email provider not configured" };
  }
  if (!input.portalOrigin) {
    return { state: "not_sent", detail: "Portal origin not configured" };
  }

  const message = buildNotification(input);
  const from =
    Deno.env.get("CASE_NOTIFY_FROM") ?? "Life Policy Pilot <notifications@lifepolicypilot.blog>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Resend honours Idempotency-Key for 24 hours. This does not guarantee
        // deduplication when an uncertain acceptance is retried after that window.
        "Idempotency-Key": input.idempotencyKey ?? input.reference,
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        // Lets the delivery webhook reconcile an event to a case without
        // sending any customer data to the provider.
        tags: [{ name: "case_reference", value: input.reference }],
      }),
    });

    if (!response.ok) {
      // Status code only: the response body can echo the recipient address.
      console.warn("Case notification rejected", response.status);
      return { state: "failed", detail: `Provider status ${response.status}` };
    }

    const payload: unknown = await response.json().catch(() => null);
    const messageId =
      typeof payload === "object" && payload !== null && "id" in payload
        ? String((payload as { id?: unknown }).id ?? "")
        : "";

    return {
      state: "accepted",
      detail: "Accepted by the email provider",
      messageId: messageId || undefined,
    };
  } catch {
    console.warn("Case notification request failed");
    return { state: "failed", detail: "Provider request failed" };
  }
}

/** Serialises the operational detail stored in cases.notification_detail. */
export function notificationDetailForStorage(result: NotificationResult): string {
  return JSON.stringify({
    provider: result.messageId ? "resend" : null,
    messageId: result.messageId ?? null,
    note: result.detail ?? null,
  });
}
