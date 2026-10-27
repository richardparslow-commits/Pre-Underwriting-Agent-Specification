/**
 * Regression guard: the public intake endpoint must reject a draft that omits
 * either required permission.
 *
 * The lead form blocks submission without these acknowledgements, but the form
 * is not the security boundary. These tests drive the actual `submit-case`
 * handler, with the form bypassed, and expect a 422 before any case is created.
 */

import { assertEquals } from "jsr:@std/assert@1";

type Handler = (request: Request) => Response | Promise<Response>;

let handler: Handler | undefined;

/**
 * Importing `index.ts` starts a real edge server. Capture the handler instead,
 * so the test can call it directly without opening a socket.
 */
const originalServe = Deno.serve;
(Deno as unknown as { serve: unknown }).serve = (candidate: Handler) => {
  handler = candidate;
  return {} as unknown as Deno.HttpServer;
};

Deno.env.set("ENVIRONMENT", "test");

await import("../submit-case/index.ts");

(Deno as unknown as { serve: unknown }).serve = originalServe;

const CONSENT_VERSION = "2026-10-b";
const SUBMITTED_AT = "2026-10-27T12:00:00.000Z";

type RequiredConsent = "intake_permission" | "privacy_acknowledgement";

function consent(id: RequiredConsent, granted: boolean) {
  return {
    id,
    label:
      id === "intake_permission"
        ? "Permission to prepare this review"
        : "Privacy practices acknowledged",
    granted,
    grantedAt: granted ? SUBMITTED_AT : null,
    textVersion: CONSENT_VERSION,
    text: "Wording shown to the customer.",
  };
}

function draft(consents: unknown[]) {
  return {
    questionnaireVersion: "2026.10-draft.1",
    startedAt: "2026-10-27T11:40:00.000Z",
    completedAt: SUBMITTED_AT,
    lead: {
      firstName: "Test",
      lastName: "Case",
      state: "TX",
      email: "test-case@example.com",
      preferredContact: "email",
    },
    consents,
    acknowledgements: [],
    answers: [],
    flags: [],
    crisisDisclosure: false,
    relationship: "self",
  };
}

async function submit(body: unknown): Promise<Response> {
  if (!handler) throw new Error("submit-case handler was not captured");
  return await handler(
    new Request("http://localhost/submit-case", {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
}

async function errorFrom(response: Response): Promise<string> {
  const body = (await response.json()) as { error?: string };
  return body.error ?? "";
}

Deno.test("rejects a draft with no consent records", async () => {
  const response = await submit(draft([]));

  assertEquals(response.status, 422);
  assertEquals(await errorFrom(response), "Intake permission is required to submit");
});

Deno.test("rejects a draft missing the intake permission", async () => {
  const response = await submit(draft([consent("privacy_acknowledgement", true)]));

  assertEquals(response.status, 422);
  assertEquals(await errorFrom(response), "Intake permission is required to submit");
});

Deno.test("rejects a declined intake permission", async () => {
  const response = await submit(
    draft([consent("intake_permission", false), consent("privacy_acknowledgement", true)]),
  );

  assertEquals(response.status, 422);
  assertEquals(await errorFrom(response), "Intake permission is required to submit");
});

Deno.test("rejects a draft missing the privacy acknowledgement", async () => {
  const response = await submit(draft([consent("intake_permission", true)]));

  assertEquals(response.status, 422);
  assertEquals(await errorFrom(response), "Privacy practices acknowledgement is required to submit");
});

Deno.test("rejects a declined privacy acknowledgement", async () => {
  const response = await submit(
    draft([consent("intake_permission", true), consent("privacy_acknowledgement", false)]),
  );

  assertEquals(response.status, 422);
  assertEquals(await errorFrom(response), "Privacy practices acknowledgement is required to submit");
});
