// With Deno on PATH, run npx playwright install chromium, then npm run test:submission-e2e.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createInterface } from "node:readline";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { chromium } from "playwright";
import { createServer as createVite } from "vite";

const host = "127.0.0.1";
const loopback = (port) => `http://${host}:${port}`;
const endpoint = "/functions/v1/submit-case";

async function applyMigrations(db) {
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$
      select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
    $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
    $$;
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
  `);
  const directory = new URL("../supabase/migrations/", import.meta.url);
  for (const name of (await readdir(directory)).filter(name => name.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(name, directory), "utf8"));
  }
}

// The handler uses Supabase's HTTP client. This loopback adapter translates
// only the four requests this test needs into SQL against the real migrations.
async function handleDatabaseRequest(db, request, response) {
  const url = new URL(request.url, loopback(0));
  const json = (status, payload) => {
    response.writeHead(status, { "content-type": "application/json" });
    response.end(JSON.stringify(payload));
  };
  try {
    if (url.pathname === "/rest/v1/cases" && request.method === "GET") {
      const filter = url.searchParams.get("idempotency_key");
      assert.ok(filter?.startsWith("eq."));
      const result = await db.query(
        "select * from public.cases where idempotency_key = $1", [filter.slice(3)],
      );
      return json(200, result.rows);
    }
    assert.equal(request.method, "POST");
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const body = JSON.parse(raw);
    if (url.pathname === "/rest/v1/cases") {
      await db.query(`
        insert into public.cases (
          reference, submitted_at, server_received_at, idempotency_key,
          questionnaire_version, status, crisis_disclosure, residence_state,
          notification_state, notification_attempts, notification_detail,
          notification_updated_at, payload
        )
        select reference, submitted_at, server_received_at, idempotency_key,
          questionnaire_version, status, crisis_disclosure, residence_state,
          notification_state, notification_attempts, notification_detail,
          notification_updated_at, payload
        from jsonb_populate_record(null::public.cases, $1::jsonb)
      `, [JSON.stringify(body)]);
      response.writeHead(201).end();
    } else if (url.pathname === "/rest/v1/rpc/consume_submission_rate") {
      const result = await db.query("select public.consume_submission_rate($1, $2, $3) as allowed",
        [body.p_key_hash, body.p_limit, body.p_window_seconds]);
      json(200, result.rows[0].allowed);
    } else if (url.pathname === "/rest/v1/rpc/complete_case_notification") {
      await db.query("select public.complete_case_notification($1, $2, $3, $4)",
        [body.p_reference, body.p_state, body.p_detail, body.p_message_id]);
      json(200, null);
    } else {
      json(404, { code: "unexpected_test_route", message: url.pathname });
    }
  } catch (error) {
    json(error.code === "23505" ? 409 : 500, { code: error.code, message: error.message });
  }
}

async function startEndpoint(t, appOrigin, databaseOrigin) {
  const module = new URL("../supabase/functions/submit-case/index.ts", import.meta.url);
  const child = spawn(process.env.DENO_BIN || "deno", [
    "run", "--allow-env", `--allow-net=${host}`, "--lock=deno.lock", "--frozen", "--ext=ts", "-",
  ], {
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      DENO_DIR: process.env.DENO_DIR,
      ENVIRONMENT: "production",
      QUESTIONNAIRE_APPROVED: "true",
      APP_ORIGIN: appOrigin,
      SUPABASE_URL: databaseOrigin,
      SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key",
      RATE_LIMIT_SALT: "synthetic-salt",
    },
    stdio: ["pipe", "pipe", "inherit"],
  });
  const exit = once(child, "close");
  t.after(async () => {
    child.kill();
    await exit;
  });
  const lines = createInterface({ input: child.stdout });
  child.stdin.end(`
    const serve = Deno.serve;
    Deno.serve = ((handler: Deno.ServeHandler) => serve({
      hostname: "${host}", port: 0,
      onListen: ({ port }) => console.log(port),
    }, handler)) as typeof Deno.serve;
    await import(${JSON.stringify(module.href)});
  `);
  const port = await Promise.race([
    once(lines, "line", { signal: AbortSignal.timeout(20_000) }).then(([line]) => Number(line)),
    exit.then(([code]) => { throw new Error(`Local submit-case exited before listening (${code})`); }),
  ]);
  assert.ok(Number.isInteger(port) && port > 0);
  return loopback(port);
}

async function reviewSyntheticInterview(page, appOrigin) {
  await page.goto(`${appOrigin}/start`);
  await page.locator("#firstName").fill("Synthetic");
  await page.locator("#lastName").fill("Retry");
  await page.locator("#state").selectOption("TX");
  await page.locator("#dateOfBirth").fill("1980-01-01");
  await page.locator("#email").fill("synthetic@example.invalid");
  await page.locator('input[name="preferredContact"][value="email"]').check();
  await page.locator("#privacy-ack").check();
  await page.locator("#adult-attested").check();
  await page.getByRole("button", { name: "Continue to intake permission" }).click();
  await page.locator('input[aria-describedby="intake-permission-text"]').check();
  await page.getByRole("button", { name: "Begin the interview" }).click();
  await page.getByRole("button", { name: "Review my answers" }).click();
  await page.getByRole("checkbox", { name: /^I have reviewed the answers/ }).check();
}

test("browser retries recover the original receipt and protect the saved case from edits", {
  timeout: 75_000,
}, async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await applyMigrations(db);

  const database = createServer((req, res) => void handleDatabaseRequest(db, req, res));
  database.listen(0, host);
  await once(database, "listening");
  t.after(() => new Promise(resolve => database.close(resolve)));

  // Use Vite's actual client, without reading any project environment files.
  const vite = await createVite({
    mode: "test", envDir: false, server: { host, port: 0, hmr: false },
  });
  t.after(() => vite.close());
  await vite.listen();
  const appOrigin = loopback(vite.httpServer.address().port);
  const apiOrigin = await startEndpoint(t, appOrigin, loopback(database.address().port));
  Object.assign(vite.config.env, {
    VITE_APP_MODE: "live",
    VITE_SUPABASE_URL: apiOrigin,
    VITE_SUPABASE_PUBLISHABLE_KEY: "synthetic-public-key",
    VITE_SUBMIT_CASE_URL: "",
  });

  const browser = await chromium.launch({ channel: process.env.SUBMISSION_E2E_BROWSER_CHANNEL });
  t.after(() => browser.close());
  async function openReview(faults) {
    const page = await browser.newPage({ serviceWorkers: "block" });
    page.setDefaultTimeout(7_000);
    const responses = [];
    await page.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === appOrigin) return route.continue();
      if (url.origin !== apiOrigin || url.pathname !== endpoint) return route.abort();
      if (request.method() !== "POST") return route.continue();

      const reply = await route.fetch({ timeout: 10_000, maxRedirects: 0 });
      responses.push({
        status: reply.status(),
        key: request.headers()["idempotency-key"],
        email: request.postDataJSON().lead.email,
        receipt: await reply.json(),
      });
      const fault = faults[responses.length - 1];
      if (fault === "disconnect") return route.abort("connectionreset");
      if (fault === "broken-receipt") {
        return route.fulfill({ response: reply, body: '{"reference":' });
      }
      if (fault === "incomplete-receipt") {
        return route.fulfill({ response: reply, json: { reference: responses.at(-1).receipt.reference } });
      }
      if (fault === "gateway-error") {
        return route.fulfill({ response: reply, status: 502, contentType: "text/html", body: "Bad gateway" });
      }
      return route.fulfill({ response: reply });
    });
    await reviewSyntheticInterview(page, appOrigin);
    return { page, responses, submit: page.getByRole("button", { name: "Submit for Richard's Review" }) };
  }
  const retryGuidance = (page) => page.getByText(
    "We could not confirm whether this case was saved. Retry without changing your answers.",
    { exact: true },
  );
  const unreadableReceipts = ["broken-receipt", "incomplete-receipt"];
  const { page, responses, submit } = await openReview(["disconnect", ...unreadableReceipts]);
  await submit.click();
  await retryGuidance(page).waitFor();
  assert.equal(responses.length, 1);
  assert.equal(responses[0].status, 201);
  const first = responses[0];
  assert.ok(first.key && first.receipt.reference);
  const stored = await db.query(`
    select reference, idempotency_key, notification_state, payload from public.cases
  `);
  assert.equal(stored.rows.length, 1);
  assert.equal(stored.rows[0].reference, first.receipt.reference);
  assert.equal(stored.rows[0].idempotency_key, first.key);
  assert.equal(stored.rows[0].notification_state, "not_sent");
  assert.equal(stored.rows[0].payload.answers.find(row => row.questionId === "RES-01").disposition, "unresolved");

  for (const fault of unreadableReceipts) {
    await Promise.all([
      page.waitForResponse(response => response.url() === apiOrigin + endpoint && response.request().method() === "POST"),
      submit.click(),
    ]);
    await retryGuidance(page).waitFor().catch(error => {
      throw new Error(`Expected safe retry guidance after ${fault}`, { cause: error });
    });
  }
  await submit.click();
  await page.getByRole("heading", { name: "Your answers are saved" }).waitFor();
  await page.getByText(first.receipt.reference, { exact: true }).waitFor();
  assert.equal(responses.length, 4);
  for (const replay of responses.slice(1)) {
    assert.equal(replay.status, 200);
    assert.equal(replay.key, first.key);
    assert.equal(replay.receipt.replayed, true);
    assert.equal(replay.receipt.reference, first.receipt.reference);
  }
  assert.deepEqual((await db.query("select count(*)::int as count from public.cases")).rows, [{ count: 1 }]);

  const edited = await openReview(["gateway-error"]);
  await Promise.all([
    edited.page.waitForResponse(response => response.url() === apiOrigin + endpoint && response.status() === 502),
    edited.submit.click(),
  ]);
  await edited.page.getByText("Submission needs attention", { exact: true }).waitFor();
  assert.equal(await retryGuidance(edited.page).isVisible(), true, "a gateway error must preserve uncertainty");
  assert.equal(edited.responses[0].status, 201);
  await edited.page.getByRole("button", { name: "Edit contact details" }).click();
  await edited.page.locator("#email").fill("changed@example.invalid");
  await edited.page.getByRole("button", { name: "Continue to intake permission" }).click();
  await edited.page.getByRole("button", { name: "Review my answers" }).click();
  await edited.page.getByRole("checkbox", { name: /^I have reviewed the answers/ }).check();
  await edited.submit.click();

  const original = edited.responses[0];
  await edited.page.getByText(new RegExp(`Case ${original.receipt.reference} was already saved with different content`)).waitFor();
  assert.equal(edited.responses.length, 2);
  assert.equal(edited.responses[1].status, 409);
  assert.equal(edited.responses[1].key, original.key);
  assert.equal(edited.responses[1].email, "changed@example.invalid");
  assert.equal(edited.responses[1].receipt.code, "submission_conflict");
  const cases = await db.query("select reference, payload->'lead'->>'email' as email from public.cases order by reference");
  assert.deepEqual(cases.rows, [first.receipt.reference, original.receipt.reference].sort().map(reference => ({
    reference, email: "synthetic@example.invalid",
  })));
});
