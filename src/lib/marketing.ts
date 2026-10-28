import { PREVIEW_MODE, REVOKE_MARKETING_URL, SUPABASE_ANON_KEY } from "@/config/site";

export interface MarketingRevocationInput {
  reference: string;
  phone?: string;
  email?: string;
  reason?: string;
  /** Stable per form attempt; a retry must reuse it. */
  idempotencyKey?: string;
}

export interface MarketingRevocationResult {
  /** The service accepted the request. A match is deliberately not disclosed. */
  accepted: true;
  /** No request left the browser; the UI must say so. */
  preview: boolean;
}

/**
 * Sends a customer marketing revocation to the public edge function.
 *
 * The server matches the case reference and the contact on file before writing
 * anything. A non-match receives the same 202 response as a match, so this
 * function cannot be used to discover whether a case exists.
 */
export async function requestMarketingRevocation(
  input: MarketingRevocationInput,
): Promise<MarketingRevocationResult> {
  if (PREVIEW_MODE) {
    return { accepted: true, preview: true };
  }

  if (!REVOKE_MARKETING_URL || !SUPABASE_ANON_KEY) {
    throw new Error("The marketing opt-out service is not configured.");
  }

  let response: Response;
  try {
    response = await fetch(REVOKE_MARKETING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        reference: input.reference,
        phone: input.phone || undefined,
        email: input.email || undefined,
        reason: input.reason || undefined,
      }),
    });
  } catch {
    throw new Error(
      "The request could not be sent. Please check your connection and try again, or email us.",
    );
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : "The request could not be recorded. Please email us using the address on this page.";
    throw new Error(message);
  }

  return { accepted: true, preview: false };
}
