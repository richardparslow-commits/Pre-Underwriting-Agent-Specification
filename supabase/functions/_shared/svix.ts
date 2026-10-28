/**
 * Svix webhook signature verification (used by Resend delivery events).
 *
 * The signature covers the raw body, the svix-id and the svix-timestamp. The
 * body must not be parsed or reformatted before verification. Rejecting an old
 * timestamp bounds replay; the event-id ledger in Postgres rejects a repeated
 * delivery of the same event.
 */

export interface SvixHeaders {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
}

export interface VerifyOptions {
  secret: string;
  headers: SvixHeaders;
  rawBody: string;
  /** Injectable for tests. */
  nowMs?: number;
  /** Reject timestamps older/newer than this many seconds. */
  toleranceSeconds?: number;
}

function base64ToBytes(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Length-independent comparison for two short base64 signatures. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

export async function verifySvixSignature(options: VerifyOptions): Promise<boolean> {
  const { secret, headers, rawBody } = options;
  const nowMs = options.nowMs ?? Date.now();
  const tolerance = options.toleranceSeconds ?? 5 * 60;

  if (!secret.startsWith("whsec_")) return false;
  if (!headers.id || !headers.timestamp || !headers.signature) return false;
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(headers.id)) return false;

  const timestamp = Number(headers.timestamp);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return false;
  if (Math.abs(nowMs / 1000 - timestamp) > tolerance) return false;

  const secretBytes = base64ToBytes(secret.slice("whsec_".length));
  if (!secretBytes || secretBytes.length < 16) return false;

  const secretBuffer = Uint8Array.from(secretBytes).buffer as ArrayBuffer;
  const key = await crypto.subtle.importKey(
    "raw",
    secretBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signed = new TextEncoder().encode(`${headers.id}.${headers.timestamp}.${rawBody}`);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, signed));
  const expected = bytesToBase64(digest);

  // Svix can send multiple space-separated versions during key rotation.
  return headers.signature
    .split(" ")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .some((entry) => {
      const [version, signature] = entry.split(",");
      return version === "v1" && Boolean(signature) && timingSafeEqual(signature, expected);
    });
}
