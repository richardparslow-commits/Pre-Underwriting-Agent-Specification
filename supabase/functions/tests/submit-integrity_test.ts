/** Real handler, synthetic database transport: no hosted writes or emails. */
import { assert, assertEquals } from "jsr:@std/assert@1.0.6";
import { validateDraft } from "../_shared/case.ts";
import { buildAnswers, buildValidDraft } from "./fixtures.ts";

type Handler = (request: Request) => Response | Promise<Response>;
let handler: Handler;
const originalServe = Deno.serve;
(Deno as unknown as { serve: unknown }).serve = (candidate: Handler) => {
  handler = candidate;
  return {} as Deno.HttpServer;
};
await import("../submit-case/index.ts");
(Deno as unknown as { serve: unknown }).serve = originalServe;

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function databaseTest(
  run: (db: {
    submit: (draft: Record<string, unknown>) => Promise<Response>;
    rows: Array<Record<string, unknown>>;
    race: (draft: Record<string, unknown>) => void;
    writes: () => number;
  }) => Promise<void>,
) {
  const savedEnv = new Map<string, string | undefined>();
  for (
    const [key, value] of Object.entries({
      ENVIRONMENT: "test",
      APP_ORIGIN: "http://localhost:5173",
      QUESTIONNAIRE_APPROVED: "true",
      SUPABASE_URL: "http://database.test",
      SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key",
      RATE_LIMIT_SALT: "synthetic-salt",
    })
  ) {
    savedEnv.set(key, Deno.env.get(key));
    Deno.env.set(key, value);
  }
  const originalFetch = globalThis.fetch;
  const rows: Array<Record<string, unknown>> = [];
  let racing: Record<string, unknown> | undefined;
  let writes = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.pathname.endsWith("/rpc/consume_submission_rate")) {
      return json(true);
    }
    if (url.pathname.endsWith("/rpc/claim_case_notification")) return json([]);
    assertEquals(
      url.pathname,
      "/rest/v1/cases",
      "Unexpected transport request",
    );
    if (request.method === "GET") {
      const columns = (url.searchParams.get("select") ?? "*").split(",");
      return json(
        rows.map((row) =>
          columns.includes("*")
            ? row
            : Object.fromEntries(columns.map((column) => [column, row[column]]))
        ),
      );
    }
    assertEquals(request.method, "POST");
    if (racing) {
      const validation = validateDraft(racing);
      assert(validation.ok);
      rows.push({
        reference: "LPP-2026-WINNER",
        submitted_at: new Date().toISOString(),
        status: "submitted",
        notification_state: "queued",
        notification_attempts: 0,
        notification_detail: null,
        notification_updated_at: null,
        payload: validation.draft,
      });
      racing = undefined;
      return json({ code: "23505", message: "duplicate idempotency key" }, 409);
    }
    const row = await request.json();
    rows.push(row);
    writes++;
    return new Response(null, { status: 201 });
  }) as typeof fetch;
  try {
    await run({
      rows,
      race: (draft) => {
        racing = draft;
      },
      writes: () => writes,
      submit: (draft) =>
        handler(
          new Request("http://localhost/submit-case", {
            method: "POST",
            headers: {
              origin: "http://localhost:5173",
              "content-type": "application/json",
              "idempotency-key": "same-operation-key",
            },
            body: JSON.stringify(draft),
          }),
        ) as Promise<Response>,
    });
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of savedEnv) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
  }
}

Deno.test("lost receipt: unchanged retry returns original case without another insert", () =>
  databaseTest(async (db) => {
    const draft = buildValidDraft();
    const first = await db.submit(draft);
    assertEquals(first.status, 201);
    const receipt = await first.json(); // The caller could have lost this response.
    // Completion time and object insertion order are not changes to submitted answers.
    const retry = await db.submit({
      ...draft,
      lead: Object.fromEntries(Object.entries(draft.lead as object).reverse()),
      completedAt: new Date().toISOString(),
    });
    assertEquals(retry.status, 200);
    const replay = await retry.json();
    assertEquals(replay.reference, receipt.reference);
    assertEquals(replay.replayed, true);
    assertEquals(db.writes(), 1);
  }));

for (
  const edit of ["contact", "answer", "consent", "acknowledgement"] as const
) {
  Deno.test(`lost receipt: changed ${edit} conflicts instead of silently replaying`, () =>
    databaseTest(async (db) => {
      const draft = buildValidDraft();
      assertEquals((await db.submit(draft)).status, 201);
      const before = JSON.stringify(db.rows);
      const changed = structuredClone(draft);
      if (edit === "contact") {
        changed.lead = {
          ...(draft.lead as object),
          email: "corrected@example.com",
        };
      }
      if (edit === "answer") {
        changed.answers = buildAnswers({
          "MH-05": { answerState: "yes", answerText: "Yes" },
        });
      }
      if (edit === "consent") {
        (changed.consents as Array<Record<string, unknown>>)[0].grantedAt =
          new Date(Date.parse(String(draft.startedAt)) + 1).toISOString();
      }
      if (edit === "consent") {
        (changed.acknowledgements as Array<Record<string, unknown>>)[0]
          .timestamp = new Date().toISOString();
      }
      if (edit === "acknowledgement") {
        (changed.acknowledgements as Array<Record<string, unknown>>)[0]
          .timestamp = new Date().toISOString();
      }
      const response = await db.submit(changed);
      assertEquals(response.status, 409);
      const body = await response.json();
      assertEquals(body.code, "submission_conflict");
      assert(String(body.error).includes("not saved"));
      assertEquals(JSON.stringify(db.rows), before);
      assertEquals(db.writes(), 1);
    }));
}

for (const changed of [false, true]) {
  Deno.test(`concurrent insert collision compares payload (changed=${changed})`, () =>
    databaseTest(async (db) => {
      const draft = buildValidDraft();
      db.race(
        buildValidDraft(
          changed
            ? {
              lead: { ...(draft.lead as object), email: "winner@example.com" },
            }
            : {},
        ),
      );
      const response = await db.submit(draft);
      assertEquals(response.status, changed ? 409 : 200);
      assertEquals(db.rows.length, 1);
      assertEquals(db.writes(), 0);
    }));
}

Deno.test("legacy receipt without comparable payload fails closed", () =>
  databaseTest(async (db) => {
    db.rows.push({ reference: "LPP-2026-LEGACY", payload: null });
    assertEquals((await db.submit(buildValidDraft())).status, 409);
    assertEquals(db.writes(), 0);
  }));

for (
  const [field, limit] of Object.entries({
    preferredContactTime: 120,
    timeZone: 80,
    assistance: 200,
    coverageAmount: 60,
    coveragePurpose: 120,
    termPreference: 60,
    phone: 40,
    firstName: 100,
    lastName: 100,
    email: 254,
  })
) {
  Deno.test(`${field}: overflow is rejected explicitly before any database write`, () =>
    databaseTest(async (db) => {
      const draft = buildValidDraft();
      draft.lead = {
        ...(draft.lead as object),
        [field]: "x".repeat(limit + 1),
      };
      const response = await db.submit(draft);
      assertEquals(response.status, 422);
      const body = await response.json();
      assert(String(body.error).includes(String(limit)), body.error);
      assertEquals(db.writes(), 0);
    }));
}

for (
  const [field, limit] of Object.entries({
    preferredContactTime: 120,
    timeZone: 80,
    assistance: 200,
    coverageAmount: 60,
    coveragePurpose: 120,
    termPreference: 60,
  })
) {
  Deno.test(`${field}: valid boundary text survives storage and receipt retry`, () =>
    databaseTest(async (db) => {
      const draft = buildValidDraft();
      const value = "x".repeat(limit);
      draft.lead = { ...(draft.lead as object), [field]: value };
      assertEquals((await db.submit(draft)).status, 201);
      assertEquals(
        ((db.rows[0].payload as Record<string, unknown>).lead as Record<
          string,
          unknown
        >)[field],
        value,
      );
      assertEquals((await db.submit(draft)).status, 200);
      assertEquals(db.writes(), 1);
    }));
}

Deno.test("editing before any saved case remains allowed under the same operation", () =>
  databaseTest(async (db) => {
    const draft = buildValidDraft();
    draft.lead = {
      ...(draft.lead as object),
      email: "edited-before-save@example.com",
    };
    assertEquals((await db.submit(draft)).status, 201);
    assertEquals(
      ((db.rows[0].payload as Record<string, unknown>).lead as Record<
        string,
        unknown
      >).email,
      "edited-before-save@example.com",
    );
    assertEquals(db.writes(), 1);
  }));

Deno.test("JSONB key order and consent record order do not turn an unchanged retry into a conflict", () =>
  databaseTest(async (db) => {
    const draft = buildValidDraft();
    assertEquals((await db.submit(draft)).status, 201);
    draft.consents = [...draft.consents as unknown[]].reverse();
    assertEquals((await db.submit(draft)).status, 200);
    assertEquals(db.writes(), 1);
  }));

for (
  const field of ["preferredContactTime", "coverageAmount", "termPreference"]
) {
  Deno.test(`${field}: supplied non-text is rejected rather than silently dropped`, () =>
    databaseTest(async (db) => {
      const draft = buildValidDraft();
      draft.lead = {
        ...(draft.lead as object),
        [field]: { value: "unexpected" },
      };
      const response = await db.submit(draft);
      assertEquals(response.status, 422);
      assert(String((await response.json()).error).includes("must be text"));
      assertEquals(db.writes(), 0);
    }));
}
