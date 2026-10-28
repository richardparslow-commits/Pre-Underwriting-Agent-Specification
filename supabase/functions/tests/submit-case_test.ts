/**
 * Regression guards for the public intake handler.
 *
 * These call the real handler with the browser form bypassed. They prove that
 * the launch lock, the required permissions and the byte budget are enforced
 * before a case can be written.
 */

import { assertEquals } from "jsr:@std/assert@1.0.6";
import { buildConsents, buildValidDraft } from "./fixtures.ts";

type Handler = (request: Request) => Response | Promise<Response>;

let handler: Handler | undefined;

const originalServe = Deno.serve;
(Deno as unknown as { serve: unknown }).serve = (candidate: Handler) => {
  handler = candidate;
  return {} as unknown as Deno.HttpServer;
};

Deno.env.set("ENVIRONMENT", "test");
Deno.env.set("APP_ORIGIN", "http://localhost:5173");

await import("../submit-case/index.ts");

(Deno as unknown as { serve: unknown }).serve = originalServe;

async function submit(body: unknown, key = "test-key-0001"): Promise<Response> {
  if (!handler) throw new Error("submit-case handler was not captured");
  return await handler(
    new Request("http://localhost/submit-case", {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        "content-type": "application/json",
        "idempotency-key": key,
      },
      body: JSON.stringify(body),
    }),
  );
}

async function errorFrom(response: Response): Promise<string> {
  const body = (await response.json()) as { error?: string };
  return body.error ?? "";
}

Deno.test("refuses live intake until the questionnaire is explicitly approved", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "false");
  const response = await submit(buildValidDraft());

  assertEquals(response.status, 503);
  assertEquals(
    await errorFrom(response),
    "This questionnaire is not yet approved for live submissions. No case was saved and nothing was sent.",
  );
});

Deno.test("rejects a draft with no consent records", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "true");
  const response = await submit(buildValidDraft({ consents: [] }));

  assertEquals(response.status, 422);
  assertEquals(await errorFrom(response), "Intake permission is required to submit");
});

Deno.test("rejects a draft missing the intake permission", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "true");
  const response = await submit(
    buildValidDraft({ consents: buildConsents({ omit: "intake_permission" }) }),
  );

  assertEquals(response.status, 422);
  assertEquals(await errorFrom(response), "Intake permission is required to submit");
});

Deno.test("rejects a declined intake permission", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "true");
  const consents = buildConsents().map((record) =>
    record.id === "intake_permission"
      ? { ...record, granted: false, grantedAt: null }
      : record,
  );
  const response = await submit(buildValidDraft({ consents }));

  assertEquals(response.status, 422);
  assertEquals(await errorFrom(response), "Intake permission is required to submit");
});

Deno.test("rejects a draft missing the privacy acknowledgement", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "true");
  const response = await submit(
    buildValidDraft({ consents: buildConsents({ omit: "privacy_acknowledgement" }) }),
  );

  assertEquals(response.status, 422);
  assertEquals(
    await errorFrom(response),
    "Privacy practices acknowledgement is required to submit",
  );
});

Deno.test("rejects a multibyte body above the 512 KiB byte budget with 413", async () => {
  Deno.env.set("QUESTIONNAIRE_APPROVED", "true");
  if (!handler) throw new Error("submit-case handler was not captured");

  // 300,000 two-byte characters = ~600 KB, but only 300,000 JS characters.
  const oversized = '{"padding":"' + "é".repeat(300_000) + '"}';

  const response = await handler(
    new Request("http://localhost/submit-case", {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        "content-type": "application/json",
        "idempotency-key": "byte-cap-0001",
      },
      body: oversized,
    }),
  );

  assertEquals(response.status, 413);
  assertEquals(await errorFrom(response), "Submission too large");
});
