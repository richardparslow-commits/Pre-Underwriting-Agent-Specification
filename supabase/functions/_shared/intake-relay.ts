/** Private server-to-server attestation. Never import secrets into browser code. */
const encoder = new TextEncoder();
export const RELAY_HEADER = "x-lpp-intake-proof";
export const MAX_RELAY_BODY = 512 * 1024;
const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0"))
    .join("");
async function key(secret: string) {
  if (secret.length < 32) throw new Error("Relay secret is not configured");
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function visitorDigest(
  ip: string,
  secret: string,
): Promise<string> {
  return hex(
    await crypto.subtle.sign(
      "HMAC",
      await key(secret),
      encoder.encode(`visitor:v1:${ip}`),
    ),
  );
}
async function message(
  request: Request,
  body: string,
  timestamp: string,
  visitor: string,
  audience = request.url,
) {
  const digest = hex(
    await crypto.subtle.digest("SHA-256", encoder.encode(body)),
  );
  return encoder.encode(JSON.stringify([
    "lpp-intake-v1",
    timestamp,
    visitor,
    request.method,
    audience,
    request.headers.get("origin"),
    request.headers.get("idempotency-key"),
    digest,
  ]));
}
export async function signRelay(
  request: Request,
  body: string,
  visitor: string,
  secret: string,
  now = Date.now(),
): Promise<string> {
  const timestamp = String(Math.floor(now / 1000));
  const signature = hex(
    await crypto.subtle.sign(
      "HMAC",
      await key(secret),
      await message(request, body, timestamp, visitor),
    ),
  );
  return `${timestamp}.${visitor}.${signature}`;
}
export async function verifyRelay(
  request: Request,
  body: string,
  secret: string,
  now = Date.now(),
  audience = request.url,
): Promise<string | null> {
  const proof = request.headers.get(RELAY_HEADER) ?? "";
  if (!/^\d{10}\.[a-f0-9]{64}\.[a-f0-9]{64}$/.test(proof)) return null;
  const [timestamp, visitor, signature] = proof.split(".");
  const age = Math.floor(now / 1000) - Number(timestamp);
  if (age < -5 || age > 60) return null;
  try {
    const bytes = Uint8Array.from(
      signature.match(/../g)!,
      (b) => parseInt(b, 16),
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      await key(secret),
      bytes,
      await message(request, body, timestamp, visitor, audience),
    );
    return valid ? `relay:v1:${visitor}` : null;
  } catch {
    return null;
  }
}
