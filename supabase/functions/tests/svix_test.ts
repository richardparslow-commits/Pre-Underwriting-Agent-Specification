import { assertEquals } from "jsr:@std/assert@1.0.6";
import { verifySvixSignature } from "../_shared/svix.ts";

const SECRET_BYTES = new Uint8Array([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
]);
const SECRET = `whsec_${btoa(String.fromCharCode(...SECRET_BYTES))}`;
const NOW = 1_790_000_000_000;
const TIMESTAMP = String(Math.floor(NOW / 1000));
const BODY = JSON.stringify({ type: "email.delivered", data: { email_id: "abc_123" } });

async function signatureFor(
  id: string,
  timestamp: string,
  body: string,
  secret = SECRET,
): Promise<string> {
  const raw = Uint8Array.from(atob(secret.slice("whsec_".length)), (character) =>
    character.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    raw,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)),
  );
  return `v1,${btoa(String.fromCharCode(...digest))}`;
}

Deno.test("accepts a correctly signed Svix event", async () => {
  const id = "msg_123";
  const signature = await signatureFor(id, TIMESTAMP, BODY);

  assertEquals(
    await verifySvixSignature({
      secret: SECRET,
      headers: { id, timestamp: TIMESTAMP, signature },
      rawBody: BODY,
      nowMs: NOW,
    }),
    true,
  );
});

Deno.test("rejects a replayed event outside the timestamp window", async () => {
  const id = "msg_123";
  const signature = await signatureFor(id, TIMESTAMP, BODY);

  assertEquals(
    await verifySvixSignature({
      secret: SECRET,
      headers: { id, timestamp: TIMESTAMP, signature },
      rawBody: BODY,
      nowMs: NOW + 6 * 60 * 1000,
    }),
    false,
  );
});

Deno.test("rejects a body changed after signing", async () => {
  const id = "msg_123";
  const signature = await signatureFor(id, TIMESTAMP, BODY);

  assertEquals(
    await verifySvixSignature({
      secret: SECRET,
      headers: { id, timestamp: TIMESTAMP, signature },
      rawBody: BODY.replace("delivered", "bounced"),
      nowMs: NOW,
    }),
    false,
  );
});

Deno.test("rejects a missing or malformed secret/header", async () => {
  const id = "msg_123";
  const signature = await signatureFor(id, TIMESTAMP, BODY);

  assertEquals(
    await verifySvixSignature({
      secret: "not-a-svix-secret",
      headers: { id, timestamp: TIMESTAMP, signature },
      rawBody: BODY,
      nowMs: NOW,
    }),
    false,
  );

  assertEquals(
    await verifySvixSignature({
      secret: SECRET,
      headers: { id: null, timestamp: TIMESTAMP, signature },
      rawBody: BODY,
      nowMs: NOW,
    }),
    false,
  );
});

Deno.test("accepts a valid signature during key rotation", async () => {
  const id = "msg_123";
  const signature = await signatureFor(id, TIMESTAMP, BODY);

  assertEquals(
    await verifySvixSignature({
      secret: SECRET,
      headers: {
        id,
        timestamp: TIMESTAMP,
        signature: `v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= ${signature}`,
      },
      rawBody: BODY,
      nowMs: NOW,
    }),
    true,
  );
});
