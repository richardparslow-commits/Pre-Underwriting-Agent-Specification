/** Disposable PostgreSQL regressions for Heal's history and safety reports. */
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
after(() => db.close());
const query = async (sql, params = []) => (await db.query(sql, params)).rows;
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
// Include sibling/future migrations after merging; no edits to applied history.
const migrations = readdirSync("supabase/migrations").filter((file) =>
  file.endsWith(".sql")
).sort();
for (let round = 0; round < 2; round++) {
  for (const file of migrations) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
}
const reviewer = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
await query(
  "insert into auth.users values ($1,'reviewer@example.test'),($2,'other@example.test')",
  [reviewer, other],
);
await query(
  "insert into public.reviewers (user_id,email) values ($1,'reviewer@example.test')",
  [reviewer],
);
async function asRole(role, aal, user, run) {
  await query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({
      sub: user,
      email: user === reviewer ? "reviewer@example.test" : "other@example.test",
      aal,
    }),
  ]);
  await db.exec(`set role ${role}`);
  try {
    return await run();
  } finally {
    await db.exec("reset role");
  }
}
async function rpc(name, params = []) {
  return (await query(
    `select public.${name}(${
      params.map((_, i) => `$${i + 1}`).join(",")
    }) result`,
    params,
  ))[0].result;
}
const authorized = (run) => asRole("authenticated", "aal2", reviewer, run);
await query(`insert into public.cases (reference,questionnaire_version,payload)
  values ('LPP-2026-HIST01','test','{}'),('LPP-2026-HIST02','test','{}')`);
const caseId = (await query(
  "select id from public.cases where reference='LPP-2026-HIST01'",
))[0].id;
// IDs beyond Number.MAX_SAFE_INTEGER and equal timestamps protect cursor ties.
await query(
  "select setval('public.case_review_log_id_seq',9007199254740993,true)",
);
await query(
  `insert into public.case_review_log (case_id,action,actor,note,created_at)
  values ($1,'requested_clarification','reviewer@example.test','Keep this clarification accessible','2026-01-01')`,
  [caseId],
);
await query(
  `insert into public.case_review_log (case_id,action,actor,created_at)
  select $1,'opened','reviewer@example.test','2026-02-01'::timestamptz from generate_series(1,65)`,
  [caseId],
);
await query(`insert into public.case_review_log (case_id,action,actor,note)
  select id,'requested_clarification','reviewer@example.test','Other case private note'
  from public.cases where reference='LPP-2026-HIST02'`);

test("clarification remains reachable after 65 opens, including equal timestamps and large IDs", async () => {
  const first = await authorized(() =>
    rpc("open_case_for_review", ["LPP-2026-HIST01"])
  );
  assert.equal(first.review_log.length, 20);
  assert.ok(
    first.review_log_cursor,
    "initial audited read must return an older-history cursor",
  );
  const expected = (await query(
    "select id::text id from public.case_review_log where case_id=$1",
    [caseId],
  )).map((row) => row.id);
  let entries = first.review_log;
  let cursor = first.review_log_cursor;
  let pages = 0;
  while (cursor) {
    assert.ok(++pages < 10, "history pagination must terminate");
    assert.equal(typeof cursor.id, "string");
    const page = await authorized(() =>
      rpc("get_case_review_history", [
        "LPP-2026-HIST01",
        cursor.created_at,
        cursor.id,
      ])
    );
    assert.ok(page.entries.length <= 20);
    entries = entries.concat(page.entries);
    cursor = page.next_cursor;
  }
  assert.deepEqual(
    new Set(entries.map((entry) => entry.id)),
    new Set(expected),
  );
  assert.equal(
    entries.length,
    expected.length,
    "no repeated or missing rows at timestamp ties",
  );
  assert.ok(
    entries.some((entry) =>
      entry.note === "Keep this clarification accessible"
    ),
  );
  assert.ok(entries.every((entry) => entry.note !== "Other case private note"));
});

test("history reads remain audited and fail closed if the access log cannot be written", async () => {
  const before = (await query(
    "select count(*)::int n from public.case_review_log where case_id=$1",
    [caseId],
  ))[0].n;
  await authorized(() =>
    rpc("get_case_review_history", ["LPP-2026-HIST01", null, null])
  );
  assert.equal(
    (await query(
      "select count(*)::int n from public.case_review_log where case_id=$1",
      [caseId],
    ))[0].n,
    before + 1,
  );
  await db.exec(
    `create function public.test_fail_history_audit() returns trigger language plpgsql as $$ begin raise exception 'Audit unavailable'; end $$;
    create trigger test_fail_history_audit before insert on public.case_review_log for each row execute function public.test_fail_history_audit();`,
  );
  try {
    await assert.rejects(
      authorized(() =>
        rpc("get_case_review_history", ["LPP-2026-HIST01", null, null])
      ),
      /Audit unavailable/,
    );
  } finally {
    await db.exec(
      "drop trigger test_fail_history_audit on public.case_review_log; drop function public.test_fail_history_audit();",
    );
  }
});

test("history rejects malformed cursor pairs and unknown cases", async () => {
  await authorized(async () => {
    await assert.rejects(
      rpc("get_case_review_history", ["LPP-2026-HIST01", "2026-01-01", null]),
      /cursor/i,
    );
    await assert.rejects(
      rpc("get_case_review_history", ["LPP-2026-HIST01", null, "1"]),
      /cursor/i,
    );
    await assert.rejects(
      rpc("get_case_review_history", ["LPP-2026-HIST01", "2026-01-01", "0"]),
      /cursor/i,
    );
    await assert.rejects(
      rpc("get_case_review_history", ["LPP-2026-HIST01", "infinity", "1"]),
      /cursor/i,
    );
    await assert.rejects(
      rpc("get_case_review_history", ["LPP-2026-ABSENT", null, null]),
      /not found/i,
    );
  });
});

test("safety query reports zero only after a successful queue-wide query", async () => {
  const page = await authorized(() =>
    rpc("get_queue_safety_disclosures", [null, null])
  );
  assert.deepEqual(page, { total: 0, entries: [], next_cursor: null });
});

test("safety disclosures are counted across the queue and paginated without payloads", async () => {
  await query(
    `insert into public.cases (reference,questionnaire_version,submitted_at,payload)
    select 'LPP-2026-N'||lpad(n::text,5,'0'),'test',now()-n*interval '1 minute','{"private":"not for queue"}'
    from generate_series(1,70) n`,
  );
  await query(
    `insert into public.cases (reference,questionnaire_version,submitted_at,status,crisis_disclosure,payload)
    select 'LPP-2026-S'||lpad(n::text,5,'0'),'test','2025-01-01'::timestamptz,
      case when n%3=0 then 'reviewed' when n%3=1 then 'needs_clarification' else 'submitted' end,true,
      '{"private":"not for queue"}' from generate_series(1,35) n`,
  );
  // The normal first page is entirely unflagged; the safety result must differ.
  const top = await authorized(() =>
    query(
      "select crisis_disclosure from public.case_summaries order by submitted_at desc,reference desc limit 25",
    )
  );
  assert.ok(top.every((row) => row.crisis_disclosure === false));
  let page = await authorized(() =>
    rpc("get_queue_safety_disclosures", [null, null])
  );
  assert.equal(page.total, 35);
  assert.equal(page.entries.length, 25);
  let entries = page.entries;
  while (page.next_cursor) {
    const cursor = page.next_cursor;
    page = await authorized(() =>
      rpc("get_queue_safety_disclosures", [
        cursor.submitted_at,
        cursor.reference,
      ])
    );
    assert.equal(page.total, 35, "count must ignore the safety-page cursor");
    assert.ok(page.entries.length <= 25);
    entries = entries.concat(page.entries);
  }
  assert.equal(entries.length, 35);
  assert.equal(new Set(entries.map((entry) => entry.reference)).size, 35);
  assert.deepEqual(
    new Set(entries.map((entry) => entry.status)),
    new Set(["reviewed", "needs_clarification", "submitted"]),
  );
  for (const entry of entries) {
    assert.deepEqual(Object.keys(entry).sort(), [
      "reference",
      "status",
      "submitted_at",
    ]);
  }
  await authorized(async () => {
    await assert.rejects(
      rpc("get_queue_safety_disclosures", ["2025-01-01", null]),
      /cursor/i,
    );
    await assert.rejects(
      rpc("get_queue_safety_disclosures", [null, "LPP-2026-S00001"]),
      /cursor/i,
    );
  });
});

for (
  const [label, role, aal, user, message] of [
    ["anonymous", "anon", "aal1", other, /permission denied/i],
    ["AAL1 reviewer", "authenticated", "aal1", reviewer, /Not authorised/i],
    ["AAL2 non-reviewer", "authenticated", "aal2", other, /Not authorised/i],
  ]
) {
  test(`${label} cannot use history or safety RPCs`, async () => {
    await asRole(role, aal, user, async () => {
      await assert.rejects(
        rpc("get_case_review_history", ["LPP-2026-HIST01", null, null]),
        message,
      );
      await assert.rejects(
        rpc("get_queue_safety_disclosures", [null, null]),
        message,
      );
    });
  });
}

test("private history helper and direct review-log reads are not public access paths", async () => {
  await authorized(async () => {
    await assert.rejects(
      rpc("case_review_history_page", [caseId, null, null]),
      /permission denied/i,
    );
    await assert.rejects(
      query("select note from public.case_review_log"),
      /permission denied/i,
    );
  });
});


test("deployment catalog checks execute without reading case data", async () => {
  const rows = await query(readFileSync("supabase/ops/reviewer-visibility-checks.sql", "utf8"));
  assert.equal(rows.length, 6);
  assert.ok(rows.every((row) => row.passed), JSON.stringify(rows));
});
