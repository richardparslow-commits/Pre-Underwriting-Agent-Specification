/**
 * Isolated database regression checks.
 *
 * PGlite is a disposable PostgreSQL instance, not the hosted Supabase project.
 * These checks prove that migrations apply cleanly, reviewer writes are
 * RPC-only, delivery events remain re-correlatable, and the existing
 * notification/retention controls still hold.
 *
 * Run with `npm run check:db`.
 */
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";

const db = new PGlite();
let failures = 0;

async function exec(sql) {
  await db.exec(sql);
}

async function query(sql, params = []) {
  const result = await db.query(sql, params);
  return result.rows;
}

async function pass(name, fn, check) {
  try {
    const value = await fn();
    const ok = check(value);
    if (!ok) failures += 1;
    console.log(`${ok ? "PASS" : "FAIL"} | ${name} | ${JSON.stringify(value)}`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL | ${name} | error=${String(error?.message ?? error).slice(0, 220)}`);
  }
}

async function expectError(name, fn, fragment) {
  try {
    await fn();
    failures += 1;
    console.log(`FAIL | ${name} | no error`);
  } catch (error) {
    const message = String(error?.message ?? error);
    const ok = message.toLowerCase().includes(fragment.toLowerCase());
    if (!ok) failures += 1;
    console.log(`${ok ? "PASS" : "FAIL"} | ${name} | error=${message.slice(0, 220)}`);
  }
}

await exec(`
  create schema if not exists auth;
  create table auth.users (id uuid primary key, email text);
  create or replace function auth.uid()
  returns uuid language sql stable as $$
    select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
  $$;
  create or replace function auth.jwt()
  returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
  $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  end $$;
  grant usage on schema public to anon, authenticated, service_role;
`);

const migrations = readdirSync("supabase/migrations")
  .filter(name => name.endsWith(".sql")).sort()
  .map(name => readFileSync(`supabase/migrations/${name}`, "utf8"));

// Every migration must be safe to re-run.
for (let round = 1; round <= 2; round += 1) {
  for (const [index, sql] of migrations.entries()) {
    await pass(`migration ${index + 1} run ${round}`, () => exec(sql), () => true);
    // Reproduce Supabase/default ACLs retained by CREATE OR REPLACE VIEW.
    // Include a column grant: revoking table privileges alone cannot remove it.
    if (round === 1 && index === 4) {
      await exec(`grant all on public.case_summaries to authenticated;
        grant update (status) on public.case_summaries to authenticated;`);
    }
  }
}

const reviewer = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const caseId = "33333333-3333-4333-8333-333333333333";
const caseIdHigh = "44444444-4444-4444-8444-444444444444";

const payload = {
  reference: "LPP-2026-TEST01",
  submittedAt: "2026-10-27T12:00:00.000Z",
  questionnaireVersion: "2026.10-draft.9",
  lead: {
    firstName: "Test",
    lastName: "Case",
    state: "TX",
    email: "test-case@example.com",
    phone: "+15125550134",
  },
  answers: [
    { questionId: "MED-01", disposition: "unresolved", answerText: "Not answered" },
    { questionId: "MED-02", disposition: "answered", answerText: "Yes" },
  ],
  consents: [],
  acknowledgements: [],
  flags: [],
  crisisDisclosure: false,
  relationship: "self",
};

await query("insert into auth.users (id, email) values ($1,$2),($3,$4)", [
  reviewer,
  "reviewer@example.com",
  other,
  "other@example.com",
]);
await query("insert into public.reviewers (user_id, email, display_name) values ($1,$2,$3)", [
  reviewer,
  "reviewer@example.com",
  "Reviewer",
]);
await query(
  `insert into public.cases
    (id, reference, submitted_at, server_received_at, idempotency_key, questionnaire_version, status, crisis_disclosure, residence_state, payload)
   values ($1,$2,$3,$3,$4,'2026.10-draft.9','submitted',false,'TX',$5::jsonb)`,
  [caseId, "LPP-2026-TEST01", "2026-10-27T12:00:00.000Z", "idem-key-0001", JSON.stringify(payload)],
);

// A case whose audit trail is deliberately longer than the review window: one
// consequential action followed by more opens than the window holds.
await query(
  `insert into public.cases
    (id, reference, submitted_at, server_received_at, idempotency_key, questionnaire_version, status, crisis_disclosure, residence_state, payload)
   values ($1,'LPP-2026-BURIED',$2,$2,'idem-key-buried','2026.10-draft.9','submitted',false,'TX',$3::jsonb)`,
  [
    "22222222-2222-4222-8222-222222222222",
    "2026-10-27T12:00:00.000Z",
    JSON.stringify({ ...payload, reference: "LPP-2026-BURIED" }),
  ],
);
await query(
  `insert into public.cases
    (id, reference, submitted_at, server_received_at, idempotency_key, questionnaire_version, status, crisis_disclosure, residence_state, payload)
   values ($1,'LPP-2026-HIGHLG',$2,$2,'idem-key-highlog','2026.10-draft.9','submitted',false,'TX',$3::jsonb)`,
  [
    caseIdHigh,
    "2026-10-27T12:00:00.000Z",
    JSON.stringify({ ...payload, reference: "LPP-2026-HIGHLG" }),
  ],
);
await query(
  `insert into public.case_review_log (case_id, action, actor, note, created_at)
   values ($1,'requested_clarification','reviewer@example.com','Recent clarification note', now() - interval '1 minute')`,
  [caseIdHigh],
);
await query(
  `insert into public.case_review_log (case_id, action, actor, note, created_at)
   values ('22222222-2222-4222-8222-222222222222','marked_reviewed','reviewer@example.com','first review', now() - interval '30 days')`,
);
for (let index = 0; index < 21; index += 1) {
  await query(
    `insert into public.case_review_log (case_id, action, actor, note, created_at)
     values ('22222222-2222-4222-8222-222222222222','opened','reviewer@example.com',null, now() - interval '20 days' + ($1 || ' seconds')::interval)`,
    [String(index)],
  );
}

async function claims(aal, id = reviewer, email = "reviewer@example.com") {
  await exec(`select set_config('request.jwt.claims', '${JSON.stringify({ sub: id, email, aal })}', false);`);
}

async function revisionOf(reference) {
  await exec("reset role;");
  const [row] = await query(
    "select review_revision from public.cases where reference = $1",
    [reference],
  );
  await exec("set role authenticated;");
  return Number(row.review_revision);
}

await pass(
  "RLS enabled on sensitive tables",
  () =>
    query(
      "select relname, relrowsecurity from pg_class where relname in ('cases','case_review_log','email_events','case_deletions','marketing_revocations','marketing_suppression_sync','submission_rate_limits','submission_rate_claims','app_settings') order by relname",
    ),
  (rows) => rows.length === 9 && rows.every((row) => row.relrowsecurity === true),
);

// ------------------------------------------------------------------ AAL2
await claims("aal1");
await exec("set role authenticated;");
await expectError("aal1 reviewer cannot read cases directly", () => query("select count(*)::int n from public.cases"), "permission denied");
await expectError("aal1 reviewer cannot open a case", () => query("select public.open_case_for_review('LPP-2026-TEST01')"), "Not authorised");
await pass(
  "aal1 reviewer sees zero case summaries",
  () => query("select count(*)::int n from public.case_summaries"),
  (rows) => rows[0].n === 0,
);
await expectError(
  "aal1 reviewer cannot record a review",
  () => query("select public.record_case_review('LPP-2026-TEST01','opened')"),
  "Not authorised",
);
await exec("reset role;");

await claims("aal2");
await exec("set role authenticated;");
await expectError("aal2 reviewer cannot read a case directly", () => query("select payload from public.cases"), "permission denied");
await expectError("aal2 reviewer cannot read corrections directly", () => query("select detail from public.case_corrections"), "permission denied");
await expectError("aal2 reviewer cannot read review log directly", () => query("select note from public.case_review_log"), "permission denied");
await expectError("aal2 reviewer cannot read marketing revocations directly", () => query("select reason from public.marketing_revocations"), "permission denied");
await expectError("aal2 reviewer cannot select all case columns", () => query("select * from public.cases"), "permission denied");
await pass(
  "aal2 reviewer sees the queue summary without a payload",
  () =>
    query(
      "select reference, first_name, last_name, residence_state, unanswered from public.case_summaries where reference='LPP-2026-TEST01'",
    ),
  (rows) =>
    rows.length === 1 &&
    rows[0].unanswered === 1 &&
    rows[0].first_name === "Test" &&
    rows[0].last_name === "Case" &&
    rows[0].residence_state === "TX",
);
await pass(
  "queue summary has no answer or payload column",
  () =>
    query(
      "select column_name from information_schema.columns where table_schema='public' and table_name='case_summaries'",
    ),
  (rows) =>
    !rows.some((row) => ["payload", "answers", "answer_text", "answer_values", "details"].includes(row.column_name)),
);
await expectError(
  "queue summary cannot be asked for payload",
  () => query("select payload from public.case_summaries limit 1"),
  "does not exist",
);
// Exercise writes against the owner-executed view, not just the base table.
await pass(
  "authenticated queue access is SELECT-only, including column grants",
  () => query(`select
    has_table_privilege('authenticated', 'public.case_summaries', 'SELECT') readable,
    has_table_privilege('authenticated', 'public.case_summaries', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') writable,
    has_any_column_privilege('authenticated', 'public.case_summaries', 'INSERT,UPDATE,REFERENCES') column_writable`),
  (rows) => rows[0].readable && !rows[0].writable && !rows[0].column_writable,
);
for (const [name, sql] of [
  ["update", "update public.case_summaries set status='reviewed' where reference='LPP-2026-TEST01'"],
  ["delete", "delete from public.case_summaries where reference='LPP-2026-TEST01'"],
  ["insert", "insert into public.case_summaries (reference, submitted_at, status, notification_state, crisis_disclosure) values ('LPP-2026-NOWRIT', now(), 'submitted', 'queued', false)"],
]) {
  // Roll back even a regression's successful write so later checks stay valid.
  await exec("begin");
  await expectError(`reviewer cannot ${name} through queue view`, () => query(sql), "permission denied");
  await exec("rollback");
}
await pass("aal2 reviewer opens a case through the audited RPC", () => query("select public.open_case_for_review('LPP-2026-TEST01') result"), (rows) => rows[0].result?.case?.reference === "LPP-2026-TEST01" && rows[0].result?.review_log?.[0]?.action === "opened");
await pass("missing case returns no payload", () => query("select public.open_case_for_review('LPP-2026-MISSING') result"), (rows) => rows[0].result === null);
await pass(
  "second recent open is coalesced in the bounded page while both opens remain audited",
  async () => {
    const [opened] = await query("select public.open_case_for_review('LPP-2026-TEST01') result");
    await exec("reset role;");
    const [raw] = await query(
      "select count(*)::int n from public.case_review_log where case_id = $1 and action = 'opened' and actor = 'reviewer@example.com'",
      [caseId],
    );
    await exec("set role authenticated;");
    return opened.result?.review_log?.filter((entry) => entry.action === "opened").length === 1 && raw.n === 2;
  },
  (found) => found === true,
);
await pass(
  "twenty recent opens do not bury the clarification note that prompted them",
  async () => {
    let latest;
    for (let index = 0; index < 20; index += 1) {
      const [opened] = await query("select public.open_case_for_review('LPP-2026-HIGHLG') result");
      latest = opened.result;
    }
    return latest?.review_log?.some((entry) => entry.note === "Recent clarification note") &&
      latest.review_log.filter((entry) => entry.action === "opened").length === 1;
  },
  (found) => found === true,
);
await pass(
  "a consequential action remains accessible beyond the first history page",
  async () => {
    const [opened] = await query("select public.open_case_for_review('LPP-2026-BURIED') result");
    const cursor = opened.result?.review_log_cursor;
    if (!cursor) return false;
    const [older] = await query(
      "select public.get_case_review_history($1, $2::timestamptz, $3::bigint) result",
      ["LPP-2026-BURIED", cursor.created_at, cursor.id],
    );
    return opened.result.review_log.length === 20 &&
      older.result.entries.some((entry) => entry.action === "marked_reviewed" && entry.note === "first review");
  },
  (found) => found === true,
);
await pass("reviewer can add a correction through its RPC", () => query("select public.record_case_correction('LPP-2026-TEST01','Test correction','11111111-1111-4111-8111-111111111111'::uuid)"), () => true);
await pass("audited case read includes the correction", () => query("select public.open_case_for_review('LPP-2026-TEST01') result"), (rows) => rows[0].result?.corrections?.[0]?.detail === "Test correction");

await expectError(
  "reviewer cannot update workflow status directly",
  () => query("update public.cases set status = 'reviewed' where reference = 'LPP-2026-TEST01' returning status"),
  "permission denied",
);
await expectError(
  "reviewer cannot insert a review-log entry directly",
  () => query("insert into public.case_review_log (case_id, action, actor, note) select id, 'marked_reviewed', 'reviewer@example.com', 'direct insert' from public.cases where reference = 'LPP-2026-TEST01' returning id"),
  "permission denied",
);
await exec("reset role;");
await pass(
  "direct writes left the status and log unchanged",
  () => query("select c.status, count(l.id)::int n from public.cases c left join public.case_review_log l on l.case_id = c.id and l.action = 'marked_reviewed' where c.reference = 'LPP-2026-TEST01' group by c.status"),
  (rows) => rows[0].status === "submitted" && rows[0].n === 0,
);
await exec("set role authenticated;");

await pass(
  "reviewer can still mark reviewed through the RPC",
  () => query("select public.record_case_review('LPP-2026-TEST01','marked_reviewed','Reviewed the full record',null,null,gen_random_uuid())"),
  () => true,
);
await exec("reset role;");
await pass(
  "the RPC updates status and log atomically",
  () => query("select c.status, count(l.id)::int n from public.cases c left join public.case_review_log l on l.case_id = c.id and l.action = 'marked_reviewed' where c.reference = 'LPP-2026-TEST01' group by c.status"),
  (rows) => rows[0].status === "reviewed" && rows[0].n === 1,
);

// Heal s12-stale-page-review-overrides-clarification: a decision taken on a
// page that still shows SUBMITTED must not overwrite a clarification request.
await pass(
  "reviewer can request clarification with the status the page showed",
  () => query("select public.record_case_review('LPP-2026-BURIED','requested_clarification','Need the procedure date','submitted',null,gen_random_uuid())"),
  () => true,
);
await expectError(
  "a stale review decision is refused instead of overriding the change",
  () => query("select public.record_case_review('LPP-2026-BURIED','marked_reviewed','Stale decision','submitted',null,gen_random_uuid())"),
  "changed since you opened",
);
await pass(
  "the current status allows the same decision",
  () => query("select public.record_case_review('LPP-2026-BURIED','marked_reviewed','Fresh decision','needs_clarification',null,gen_random_uuid())"),
  () => true,
);
await pass(
  "the refused decision left no status change behind",
  () => query("select status from public.cases where reference = 'LPP-2026-BURIED'"),
  (rows) => rows[0].status === "reviewed",
);

// Heal s13-lost-answer-followup-clarification-logged-twice: a committed
// decision whose answer was lost must replay once, not add a second log row.
const retryRevision = await revisionOf("LPP-2026-BURIED");
const retryRequest = "77777777-7777-4777-8777-777777777777";
await pass(
  "reviewer can request clarification with a request ID",
  () => query(
    "select public.record_case_review('LPP-2026-BURIED','requested_clarification','Follow-up note','reviewed',$1,$2)",
    [retryRevision, retryRequest],
  ),
  () => true,
);
await pass(
  "a retry after a lost acknowledgement is applied once",
  async () => {
    await query(
      "select public.record_case_review('LPP-2026-BURIED','requested_clarification','Follow-up note','reviewed',$1,$2)",
      [retryRevision, retryRequest],
    );
    await exec("reset role;");
    try {
      const [row] = await query(
        "select c.status, c.review_revision, count(l.id)::int n from public.cases c left join public.case_review_log l on l.case_id = c.id and l.request_id = $2 where c.reference = $1 group by c.status, c.review_revision",
        ["LPP-2026-BURIED", retryRequest],
      );
      return row;
    } finally {
      await exec("set role authenticated;");
    }
  },
  (row) =>
    row.status === "needs_clarification" &&
    row.review_revision === retryRevision + 1 &&
    row.n === 1,
);
await expectError(
  "a review request ID cannot be replayed with a different decision",
  () => query(
    "select public.record_case_review('LPP-2026-BURIED','marked_reviewed','Different decision','needs_clarification',$1,$2)",
    [retryRevision, retryRequest],
  ),
  "already used for a different decision",
);
await expectError(
  "a review decision without a request ID is refused",
  () => query(
    "select public.record_case_review('LPP-2026-BURIED','marked_reviewed','No request ID','needs_clarification',$1)",
    [retryRevision + 1],
  ),
  "request ID is required",
);

// Heal s13-stale-page-review-after-status-round-trip: matching status is not
// enough when the page missed a status round-trip or a correction.
const roundTripRevision = await revisionOf("LPP-2026-TEST01");
await pass(
  "reviewer can request clarification with the revision the page showed",
  () => query(
    "select public.record_case_review('LPP-2026-TEST01','requested_clarification','Round-trip request','reviewed',$1,gen_random_uuid())",
    [roundTripRevision],
  ),
  () => true,
);
const returnRevision = await revisionOf("LPP-2026-TEST01");
await pass(
  "reviewer can return the status with the new revision",
  () => query(
    "select public.record_case_review('LPP-2026-TEST01','marked_reviewed','Round-trip return','needs_clarification',$1,gen_random_uuid())",
    [returnRevision],
  ),
  () => true,
);
await expectError(
  "a decision from before a status round-trip is refused even when the status matches",
  () => query(
    "select public.record_case_review('LPP-2026-TEST01','marked_reviewed','Stale round trip','reviewed',$1,gen_random_uuid())",
    [roundTripRevision],
  ),
  "changed since you opened",
);

const correctionRevision = await revisionOf("LPP-2026-TEST01");
await pass(
  "reviewer can record a correction after the page opened",
  () => query(
    "select public.record_case_correction('LPP-2026-TEST01','Correction after page open','66666666-6666-4666-8666-666666666666'::uuid)",
  ),
  () => true,
);
await expectError(
  "a decision from before a correction is refused even when the status matches",
  () => query(
    "select public.record_case_review('LPP-2026-TEST01','marked_reviewed','Stale correction decision','reviewed',$1,gen_random_uuid())",
    [correctionRevision],
  ),
  "changed since you opened",
);

// Heal s6-signed-out-session-still-reads-queue: the token's session must exist.
await exec("reset role;");
await exec(
  "create table if not exists auth.sessions (id uuid primary key, user_id uuid not null)",
);
const signedOutSession = "33333333-3333-4333-8333-333333333333";
await query("insert into auth.sessions (id, user_id) values ($1, $2)", [
  signedOutSession,
  reviewer,
]);
await exec(
  `select set_config('request.jwt.claims', '${JSON.stringify({ sub: reviewer, email: "reviewer@example.com", aal: "aal2", session_id: signedOutSession })}', false);`,
);
await exec("set role authenticated;");
await pass(
  "an existing reviewer session is accepted",
  () => query("select public.is_reviewer() ok"),
  (rows) => rows[0].ok === true,
);
await exec("reset role;");
await query("delete from auth.sessions where id = $1", [signedOutSession]);
await exec("set role authenticated;");
await pass(
  "a signed-out reviewer session is refused at once",
  () => query("select public.is_reviewer() ok"),
  (rows) => rows[0].ok === false,
);
await expectError(
  "a signed-out session cannot read the queue",
  () => query("select public.get_case_queue_page() result"),
  "Not authorised",
);
await pass(
  "a signed-out session sees no case summaries",
  () => query("select count(*)::int n from public.case_summaries"),
  (rows) => rows[0].n === 0,
);
await expectError(
  "a signed-out session cannot read queue-wide safety disclosures",
  () => query("select public.get_queue_safety_disclosures() result"),
  "Not authorised",
);
await expectError(
  "a signed-out session cannot open a case",
  () => query("select public.open_case_for_review('LPP-2026-TEST01') result"),
  "Not authorised",
);
await expectError(
  "a signed-out session cannot record a correction",
  () => query("select public.record_case_correction('LPP-2026-TEST01','Signed-out correction','44444444-4444-4444-8444-444444444444'::uuid)"),
  "Not authorised",
);
await expectError(
  "a signed-out session cannot record a review decision",
  () => query("select public.record_case_review('LPP-2026-TEST01','marked_reviewed','Signed-out decision',null,null,gen_random_uuid())"),
  "Not authorised",
);
await exec("reset role;");
await claims("aal2");

await claims("aal2", other, "other@example.com");
await exec("set role authenticated;");
await pass("non-reviewer sees no summaries", () => query("select count(*)::int n from public.case_summaries"), (rows) => rows[0].n === 0);
await expectError("non-reviewer cannot open case", () => query("select public.open_case_for_review('LPP-2026-TEST01')"), "Not authorised");
await exec("reset role;");
await claims("aal2");

await exec(`create function public.test_reject_open() returns trigger language plpgsql as $$ begin raise exception 'test log unavailable'; end $$;
  create trigger test_reject_open before insert on public.case_review_log for each row execute function public.test_reject_open();`);
await exec("set role authenticated;");
await expectError("case is not returned when the access log fails", () => query("select public.open_case_for_review('LPP-2026-TEST01')"), "test log unavailable");
await exec("reset role; drop trigger test_reject_open on public.case_review_log; drop function public.test_reject_open();");

await exec("set role anon;");
await expectError(
  "anonymous caller cannot read case summaries",
  () => query("select count(*)::int n from public.case_summaries"),
  "permission denied",
);
await expectError("anonymous caller cannot open a case", () => query("select public.open_case_for_review('LPP-2026-TEST01')"), "permission denied");
await exec("reset role;");

// ------------------------------------------------------- immutable snapshot
await expectError(
  "service role cannot change crisis triage evidence",
  () => query("update public.cases set crisis_disclosure = true where reference='LPP-2026-TEST01'"),
  "immutable",
);
await expectError(
  "service role cannot change residence state",
  () => query("update public.cases set residence_state = 'CA' where reference='LPP-2026-TEST01'"),
  "immutable",
);
await expectError(
  "service role cannot rewrite the idempotency key",
  () => query("update public.cases set idempotency_key = 'other' where reference='LPP-2026-TEST01'"),
  "immutable",
);

// -------------------------------------------------------------- idempotency
await expectError(
  "duplicate idempotency key is rejected",
  () =>
    query(
      `insert into public.cases (reference, questionnaire_version, idempotency_key, payload)
       values ('LPP-2026-TEST02','v','idem-key-0001','{}'::jsonb)`,
    ),
  "duplicate key",
);

// ------------------------------------------------------- notification claim
await pass("first claim wins", () => query("select * from public.claim_case_notification('LPP-2026-TEST01','worker-a')"), (rows) => rows.length === 1 && rows[0].notification_attempts === 1);
await pass("second concurrent claim gets no row", () => query("select * from public.claim_case_notification('LPP-2026-TEST01','worker-b')"), (rows) => rows.length === 0);
await pass("acceptance completes the lease", () => query("select public.complete_case_notification('LPP-2026-TEST01','accepted','{\"note\":\"ok\"}','msg_abc')"), () => true);
await pass("accepted case cannot be claimed again", () => query("select * from public.claim_case_notification('LPP-2026-TEST01','worker-c')"), (rows) => rows.length === 0);

// ------------------------------------------- provider dedupe retry window
// The provider honours the case-reference idempotency key for 24 hours. A
// retry after that window can duplicate the reviewer email, so it must be
// refused and surfaced for a human decision instead.
await query(
  `insert into public.cases (reference, questionnaire_version, notification_state, payload)
   values ('LPP-2026-WINDOW1','v','queued','{}'::jsonb)`,
);
await pass(
  "a first claim stamps the first-attempt time",
  async () => {
    const claimed = await query("select * from public.claim_case_notification('LPP-2026-WINDOW1','worker-window')");
    const rows = await query("select notification_first_attempted_at from public.cases where reference='LPP-2026-WINDOW1'");
    return { claimed: claimed.length, stamped: rows[0].notification_first_attempted_at !== null };
  },
  (value) => value.claimed === 1 && value.stamped === true,
);
await query(
  "select public.complete_case_notification('LPP-2026-WINDOW1','failed','{\"note\":\"request timed out after send\"}',null)",
);
await query(
  "update public.cases set notification_first_attempted_at = now() - interval '25 hours', notification_next_attempt_at = now() - interval '1 minute' where reference='LPP-2026-WINDOW1'",
);
await pass(
  "a retry after the provider dedupe window is refused",
  () => query("select * from public.claim_case_notification('LPP-2026-WINDOW1','worker-late')"),
  (rows) => rows.length === 0,
);
await pass(
  "the refused case appears in the operator backlog",
  () =>
    query(
      "select count(*)::int n from public.notification_retry_backlog where reference='LPP-2026-WINDOW1'",
    ),
  (rows) => rows[0].n === 1,
);
await pass(
  "a case still inside the dedupe window can be retried",
  async () => {
    const inserted = await query(
      `insert into public.cases (reference, questionnaire_version, notification_state, notification_attempts, notification_first_attempted_at, notification_next_attempt_at, payload)
       values ('LPP-2026-WINDOW2','v','failed',1, now() - interval '23 hours', now() - interval '1 minute', '{}'::jsonb)
       returning reference`,
    );
    const claimed = await query("select * from public.claim_case_notification('LPP-2026-WINDOW2','worker-inside')");
    return { inserted: inserted.length, claimed: claimed.length };
  },
  (value) => value.inserted === 1 && value.claimed === 1,
);
await pass(
  "a never-attempted case keeps the recovery path",
  async () => {
    await query(
      `insert into public.cases (reference, questionnaire_version, notification_state, submitted_at, payload)
       values ('LPP-2026-WINDOW3','v','not_sent', now() - interval '3 days', '{}'::jsonb)`,
    );
    const claimed = await query("select * from public.claim_case_notification('LPP-2026-WINDOW3','worker-recover')");
    return claimed.length;
  },
  (value) => value === 1,
);
await exec("set role authenticated;");
await expectError(
  "a signed-in user cannot read the retry backlog",
  () => query("select count(*)::int n from public.notification_retry_backlog"),
  "permission denied",
);
await exec("reset role;");

// --------------------------------------------------------- delivery events
await query(
  `insert into public.cases (reference, questionnaire_version, notification_state, payload)
   values ('LPP-2026-EVENT1','v','queued','{}'::jsonb),
          ('LPP-2026-DIRECT','v','queued','{}'::jsonb),
          ('LPP-2026-RACE','v','queued','{}'::jsonb)`,
);
await query("update public.cases set provider_message_id='msg_direct' where reference='LPP-2026-DIRECT'");
await pass(
  "delivery-event case lookup is backed by the provider-message index",
  async () => {
    const [index] = await query(
      "select indexdef from pg_indexes where schemaname='public' and tablename='cases' and indexname='cases_provider_message_id_idx'",
    );
    await exec("set enable_seqscan=off");
    try {
      const plan = await query(
        "explain (format json) select id from public.cases where provider_message_id='msg_direct'",
      );
      return { index: index?.indexdef ?? null, plan: JSON.stringify(plan) };
    } finally {
      await exec("reset enable_seqscan");
    }
  },
  (value) =>
    value.index?.includes("provider_message_id") &&
    value.plan.includes("cases_provider_message_id_idx"),
);

await pass("accepted event applies to a queued case", () => query("select public.apply_email_event('evt_1','email.sent','LPP-2026-EVENT1','msg_abc','accepted')"), (rows) => rows[0].apply_email_event === "applied");
await pass("duplicate event is ignored by id", () => query("select public.apply_email_event('evt_1','email.sent','LPP-2026-EVENT1','msg_abc','accepted')"), (rows) => rows[0].apply_email_event === "duplicate");
await pass("delivered event applies", () => query("select public.apply_email_event('evt_2','email.delivered','LPP-2026-EVENT1','msg_abc','delivered')"), (rows) => rows[0].apply_email_event === "applied");
await pass("late accepted event cannot regress delivered", () => query("select public.apply_email_event('evt_3','email.sent','LPP-2026-EVENT1','msg_abc','accepted')"), (rows) => rows[0].apply_email_event === "ignored");
await pass("bounce after delivery cannot regress", () => query("select public.apply_email_event('evt_4','email.bounced','LPP-2026-EVENT1','msg_abc','failed')"), (rows) => rows[0].apply_email_event === "ignored");
await pass("case remains delivered", () => query("select notification_state from public.cases where reference='LPP-2026-EVENT1'"), (rows) => rows[0].notification_state === "delivered");
await pass("message-id-only event reconciles", () => query("select public.apply_email_event('evt_5','email.delivery_delayed',null,'msg_direct','accepted')"), (rows) => rows[0].apply_email_event === "applied");

// A provider event can arrive before complete_case_notification stores the
// message id. The first call is unmatched; the retry must apply the existing
// event once the case is correlated.
await pass(
  "event before message-id correlation is unmatched, not lost",
  () => query("select public.apply_email_event('evt_race','email.delivered',null,'msg_race','delivered')"),
  (rows) => rows[0].apply_email_event === "unmatched",
);
await query("update public.cases set provider_message_id='msg_race' where reference='LPP-2026-RACE'");
await pass(
  "retry of the same event applies after correlation",
  () => query("select public.apply_email_event('evt_race','email.delivered',null,'msg_race','delivered')"),
  (rows) => rows[0].apply_email_event === "applied",
);
await pass(
  "the raced case records delivered",
  () => query("select notification_state from public.cases where reference='LPP-2026-RACE'"),
  (rows) => rows[0].notification_state === "delivered",
);
await pass(
  "a later duplicate of the correlated race event is ignored",
  () => query("select public.apply_email_event('evt_race','email.delivered',null,'msg_race','delivered')"),
  (rows) => rows[0].apply_email_event === "duplicate",
);

// Heal s3-bounce-during-submit-send-overwritten: a bounce can land while the
// send is still awaited. The send's own completion must not replace it with
// accepted, and a direct write must not either.
await query(
  `insert into public.cases
     (reference, questionnaire_version, notification_state,
      notification_claimed_at, notification_claimed_by, payload)
   values ('LPP-2026-BOUNCE1','v','queued',now(),'submit-worker','{}'::jsonb)`,
);
await pass(
  "a provider bounce applies to a send still in flight",
  () => query("select public.apply_email_event('evt_bounce','email.bounced','LPP-2026-BOUNCE1','msg_bounce','failed')"),
  (rows) => rows[0].apply_email_event === "applied",
);
await pass(
  "the bounced case records provider failure",
  () => query("select notification_state, notification_provider_state from public.cases where reference='LPP-2026-BOUNCE1'"),
  (rows) => rows[0].notification_state === "failed" && rows[0].notification_provider_state === "failed",
);
await pass(
  "a late accepted send completes without overwriting the bounce",
  () => query("select public.complete_case_notification('LPP-2026-BOUNCE1','accepted','provider accepted','msg_bounce')"),
  () => true,
);
await pass(
  "the bounced case still reads failed",
  () => query("select notification_state from public.cases where reference='LPP-2026-BOUNCE1'"),
  (rows) => rows[0].notification_state === "failed",
);
await pass(
  "the provider failure stays recorded on the bounced case",
  () => query("select notification_provider_state from public.cases where reference='LPP-2026-BOUNCE1'"),
  (rows) => rows[0].notification_provider_state === "failed",
);
await expectError(
  "a direct write cannot flip a bounced case to accepted",
  () => query("update public.cases set notification_state='accepted' where reference='LPP-2026-BOUNCE1'"),
  "provider-reported failure",
);
await query(
  "insert into public.cases (reference, questionnaire_version, notification_state, payload) values ('LPP-2026-LOCALFAIL','v','failed','{}'::jsonb)",
);
await pass(
  "a local failure can still be replaced by a later accepted send",
  () => query("select public.complete_case_notification('LPP-2026-LOCALFAIL','accepted','provider accepted')"),
  () => true,
);
await pass(
  "the locally failed case recovers",
  () => query("select notification_state from public.cases where reference='LPP-2026-LOCALFAIL'"),
  (rows) => rows[0].notification_state === "accepted",
);

// A late submit/retry completion can arrive after the provider webhook. The
// completion path must not regress a delivered case or put it back in the
// retry queue, and a genuine retry after failure must still be stored.
await query(
  `insert into public.cases
     (reference, questionnaire_version, notification_state, notification_attempts,
      notification_detail, notification_claimed_at, notification_claimed_by,
      provider_message_id, payload)
   values ('LPP-2026-LATE1','v','delivered',2,'provider delivered',now(),'worker-old','msg_late1','{}'::jsonb),
          ('LPP-2026-LATE2','v','delivered',1,'provider delivered',null,null,'msg_late2','{}'::jsonb),
          ('LPP-2026-RETRY1','v','failed',1,'smtp 451',null,null,null,'{}'::jsonb)`,
);
await pass(
  "late acceptance cannot regress a delivered case",
  () => query("select public.complete_case_notification('LPP-2026-LATE1','accepted','late submit','msg_late1')"),
  () => true,
);
await pass(
  "the delivered case stays delivered",
  () =>
    query(
      "select notification_state, notification_attempts, notification_detail, provider_message_id from public.cases where reference='LPP-2026-LATE1'",
    ),
  (rows) =>
    rows[0].notification_state === "delivered" &&
    rows[0].notification_attempts === 2 &&
    rows[0].notification_detail === "provider delivered" &&
    rows[0].provider_message_id === "msg_late1",
);
await pass(
  "late failure cannot regress a delivered case",
  () => query("select public.complete_case_notification('LPP-2026-LATE2','failed','provider timeout',null)"),
  () => true,
);
await pass(
  "the delivered case is not re-queued",
  () => query("select notification_state, notification_next_attempt_at from public.cases where reference='LPP-2026-LATE2'"),
  (rows) => rows[0].notification_state === "delivered" && rows[0].notification_next_attempt_at === null,
);
await pass(
  "a delivered case cannot be claimed for another send",
  () => query("select * from public.claim_case_notification('LPP-2026-LATE2','retry-worker')"),
  (rows) => rows.length === 0,
);
await pass(
  "a genuine retry after failure can still record acceptance",
  () => query("select public.complete_case_notification('LPP-2026-RETRY1','accepted','retry succeeded','msg_retry1')"),
  () => true,
);
await pass(
  "the retried case is accepted",
  () => query("select notification_state from public.cases where reference='LPP-2026-RETRY1'"),
  (rows) => rows[0].notification_state === "accepted",
);

// The RPC guard is not enough on its own: a service-role caller can issue a
// direct update. The table trigger must reject both a state regression and a
// retry attachment on a delivered row.
await expectError(
  "service role cannot regress a delivered notification directly",
  () =>
    query(
      "update public.cases set notification_state='accepted' where reference='LPP-2026-LATE1'",
    ),
  "terminal",
);
await expectError(
  "service role cannot attach a retry time to a delivered case",
  () =>
    query(
      "update public.cases set notification_next_attempt_at=now() where reference='LPP-2026-LATE1'",
    ),
  "terminal",
);
await pass(
  "the delivered case is unchanged after the rejected writes",
  () =>
    query(
      "select notification_state, notification_next_attempt_at from public.cases where reference='LPP-2026-LATE1'",
    ),
  (rows) => rows[0].notification_state === "delivered" && rows[0].notification_next_attempt_at === null,
);
await pass(
  "an accepted case can still become delivered",
  () =>
    query(
      "select public.complete_case_notification('LPP-2026-RETRY1','delivered','provider confirmed',null)",
    ),
  () => true,
);
await pass(
  "the accepted case records delivery",
  () => query("select notification_state from public.cases where reference='LPP-2026-RETRY1'"),
  (rows) => rows[0].notification_state === "delivered",
);

// --------------------------------------------------------------- rate limit
await pass("rate limit allows the first two", async () => {
  const a = await query("select public.consume_submission_rate('rate-key-00000001',2,600) allowed");
  const b = await query("select public.consume_submission_rate('rate-key-00000001',2,600) allowed");
  return [a[0].allowed, b[0].allowed];
}, (rows) => rows[0] === true && rows[1] === true);
await pass("rate limit rejects the third", () => query("select public.consume_submission_rate('rate-key-00000001',2,600) allowed"), (rows) => rows[0].allowed === false);

// Heal s9-in-flight-retry-spends-submit-limit: a retry that misses the saved-
// case lookup while the first request is still inserting used to consume a
// second allowance, then lose the unique idempotency insert and replay. The
// durable claim makes both requests share one allowance.
await pass(
  "an in-flight same-key retry consumes one allowance, not two",
  async () => {
    const first = await query("select public.consume_submission_rate_for_key('claim-key-00000001','inflight-key-0001',2,600) allowed");
    const retry = await query("select public.consume_submission_rate_for_key('claim-key-00000001','inflight-key-0001',2,600) allowed");
    const [row] = await query("select count from public.submission_rate_limits where key_hash='claim-key-00000001'");
    const [claims] = await query("select count(*)::int n from public.submission_rate_claims where idempotency_key='inflight-key-0001'");
    return { first: first[0].allowed, retry: retry[0].allowed, count: Number(row.count), claims: claims.n };
  },
  (value) =>
    value.first === true && value.retry === true &&
    value.count === 1 && value.claims === 1,
);
await pass(
  "a distinct submission still spends the next allowance",
  async () => {
    const allowed = await query("select public.consume_submission_rate_for_key('claim-key-00000001','inflight-key-0002',2,600) allowed");
    const [row] = await query("select count from public.submission_rate_limits where key_hash='claim-key-00000001'");
    return { allowed: allowed[0].allowed, count: Number(row.count) };
  },
  (value) => value.allowed === true && value.count === 2,
);
await pass(
  "a retry is still served after the allowance is spent",
  async () => {
    const blocked = await query("select public.consume_submission_rate_for_key('claim-key-00000001','inflight-key-0003',2,600) allowed");
    const retry = await query("select public.consume_submission_rate_for_key('claim-key-00000001','inflight-key-0001',2,600) allowed");
    return { blocked: blocked[0].allowed, retry: retry[0].allowed };
  },
  (value) => value.blocked === false && value.retry === true,
);
await pass(
  "a refused submission leaves no claim that would bypass the limit",
  () => query("select count(*)::int n from public.submission_rate_claims where idempotency_key in ('inflight-key-0001','inflight-key-0003')"),
  (rows) => rows[0].n === 1,
);
await exec("set role authenticated;");
await expectError(
  "an authenticated caller cannot consume a submission allowance directly",
  () => query("select public.consume_submission_rate_for_key('claim-key-00000002','inflight-key-0004',2,600)"),
  "permission denied",
);
await exec("reset role;");

// ---------------------------------------------------------- marketing stop
await pass("reviewer records a phone revocation", () => query("select public.record_marketing_revocation('LPP-2026-TEST01','phone','Customer asked to stop')"), () => true);
await pass("suppression is queryable", () => query("select public.is_contact_suppressed('phone','+1 (512) 555-0134') suppressed"), (rows) => rows[0].suppressed === true);
await pass("revocation is audited", () => query("select count(*)::int n from public.marketing_revocations"), (rows) => rows[0].n === 1);

// ------------------------------------------------- customer revocation path
await query(
  `insert into public.cases (reference, questionnaire_version, payload)
   values ('LPP-2026-OPTOUT','v',$1::jsonb)`,
  [JSON.stringify({
    lead: { email: "optout@example.com", phone: "+15125550199" },
    answers: [],
    consents: [],
  })],
);

await pass(
  "customer opt-out does not match a wrong contact",
  () =>
    query(
      "select public.request_marketing_revocation('LPP-2026-OPTOUT','+15125550000',null,'Wrong number','customer_web','44444444-4444-4444-8444-444444444444') result",
    ),
  (rows) => rows[0].result?.recorded === false,
);
await pass(
  "a non-match writes no suppression",
  () =>
    query(
      "select count(*)::int n from public.contact_suppressions where address_normalized in ('15125550000','15125550199','optout@example.com')",
    ),
  (rows) => rows[0].n === 0,
);
await pass(
  "customer opt-out matches the phone on the case",
  () =>
    query(
      "select public.request_marketing_revocation('LPP-2026-OPTOUT','(512) 555-0199',null,'Stop calls','customer_web','44444444-4444-4444-8444-444444444445') result",
    ),
  (rows) =>
    rows[0].result?.recorded === true &&
    Array.isArray(rows[0].result?.channels) &&
    rows[0].result.channels.includes("phone"),
);
await pass(
  "customer revocation is audited with its source and request id",
  () =>
    query(
      "select channel, source, request_id, recorded_by from public.marketing_revocations where request_id='44444444-4444-4444-8444-444444444445'",
    ),
  (rows) =>
    rows.length === 1 &&
    rows[0].channel === "phone" &&
    rows[0].source === "customer_web" &&
    rows[0].recorded_by === "customer_web",
);
await expectError(
  "a revoked phone is blocked by the outbound guard",
  () => query("select public.assert_marketing_send_allowed('phone','+1 (512) 555-0199')"),
  "suppressed",
);
await pass(
  "an unrelated phone is still allowed",
  () => query("select public.assert_marketing_send_allowed('phone','+15125550001') allowed"),
  (rows) => rows[0].allowed === true,
);
await pass(
  "the revocation is queued for vendor propagation",
  () =>
    query(
      "select status, request_id from public.marketing_suppression_sync where channel='phone' and address_normalized='15125550199'",
    ),
  (rows) => rows.length === 1 && rows[0].status === "pending" && rows[0].request_id === "44444444-4444-4444-8444-444444444445",
);
await pass(
  "the vendor worker can mark the suppression synced",
  () => query("select public.mark_marketing_suppression_synced('phone','+1 512 555 0199','test-crm') synced"),
  (rows) => rows[0].synced === true,
);
await pass(
  "the synced row leaves the pending set",
  () =>
    query(
      "select count(*)::int n from public.pending_marketing_suppressions(100) where channel='phone' and address_normalized='15125550199'",
    ),
  (rows) => rows[0].n === 0,
);
// Legacy 10-digit rows can coexist with their canonical 11-digit equivalents.
// The worker passes each exact outbox key, so acknowledging one must not
// accidentally acknowledge the other, or leave the legacy row queued forever.
await exec(`
  insert into public.contact_suppressions (channel, address_normalized, reason)
  values ('phone', '5125550101', 'legacy fixture'),
         ('phone', '15125550101', 'canonical fixture'),
         ('phone', '5125550102', 'legacy failure fixture'),
         ('phone', '15125550102', 'canonical failure fixture');
`);
await pass(
  "legacy outbox key is synced without changing its canonical twin",
  async () => {
    const marked = await query("select public.mark_marketing_suppression_synced('phone','5125550101','test-crm') synced");
    const rows = await query("select address_normalized, status from public.marketing_suppression_sync where channel='phone' and address_normalized in ('5125550101','15125550101') order by address_normalized");
    const pending = await query("select count(*)::int n from public.pending_marketing_suppressions(500) where channel='phone' and address_normalized='5125550101'");
    return { marked: marked[0].synced, rows, pending: pending[0].n };
  },
  (result) => result.marked === true && result.pending === 0 &&
    result.rows.length === 2 && result.rows[0].status === "pending" && result.rows[1].status === "synced",
);
await pass(
  "legacy failure increments only the exact outbox row",
  async () => {
    const marked = await query("select public.mark_marketing_suppression_failed('phone','5125550102','test failure') failed");
    const rows = await query("select address_normalized, status, attempts from public.marketing_suppression_sync where channel='phone' and address_normalized in ('5125550102','15125550102') order by address_normalized");
    return { marked: marked[0].failed, rows };
  },
  (result) => result.marked === true && result.rows.length === 2 &&
    result.rows[0].status === "pending" && result.rows[0].attempts === 0 &&
    result.rows[1].status === "failed" && result.rows[1].attempts === 1,
);
await pass(
  "a legacy suppression without a canonical twin is propagated once across two sync runs",
  async () => {
    await query("insert into public.contact_suppressions (channel, address_normalized, reason) values ('phone','5125550103','legacy-only fixture')");
    let vendorCalls = 0;
    for (let run = 0; run < 2; run += 1) {
      const rows = await query("select address_normalized from public.pending_marketing_suppressions(500) where channel='phone' and address_normalized='5125550103'");
      for (const row of rows) {
        vendorCalls += 1; // Synthetic vendor accepted; no network request is made.
        const marked = await query("select public.mark_marketing_suppression_synced('phone',$1,'test-crm') synced", [row.address_normalized]);
        if (!marked[0].synced) throw new Error("Acknowledgement failed");
      }
    }
    return vendorCalls;
  },
  (calls) => calls === 1,
);
await pass(
  "five failures keep a legacy key in the outbox for the next sync run",
  async () => {
    for (let attempt = 1; attempt < 5; attempt += 1) {
      await query("select public.mark_marketing_suppression_failed('phone','5125550102','test failure')");
    }
    const rows = await query("select address_normalized, status, attempts from public.marketing_suppression_sync where channel='phone' and address_normalized in ('5125550102','15125550102') order by address_normalized");
    const pending = await query("select count(*)::int n from public.pending_marketing_suppressions(500) where channel='phone' and address_normalized='5125550102'");
    return { rows, pending: pending[0].n };
  },
  (result) => result.pending === 1 && result.rows.length === 2 &&
    result.rows[0].status === "pending" && result.rows[0].attempts === 0 &&
    result.rows[1].status === "failed" && result.rows[1].attempts === 5,
);
// Heal s3-opt-out-dropped-after-five-failures: the outbox must still offer the
// row after an outage longer than five runs, and a later acknowledgement must
// clear it. The old `attempts < 5` filter returned zero rows here.
await pass(
  "an exhausted suppression syncs once the vendor recovers",
  async () => {
    const marked = await query("select public.mark_marketing_suppression_synced('phone','5125550102','test-crm') synced");
    const rows = await query("select address_normalized, status, attempts from public.marketing_suppression_sync where channel='phone' and address_normalized in ('5125550102','15125550102') order by address_normalized");
    const pending = await query("select count(*)::int n from public.pending_marketing_suppressions(500) where channel='phone' and address_normalized='5125550102'");
    return { marked: marked[0].synced, rows, pending: pending[0].n };
  },
  (result) => result.marked === true && result.pending === 0 &&
    result.rows.length === 2 && result.rows[0].status === "pending" &&
    result.rows[1].status === "synced" && result.rows[1].attempts === 5,
);
await pass(
  "missing outbox key cannot acknowledge another row",
  () => query("select public.mark_marketing_suppression_synced('phone','5125550111','test-crm') synced, public.mark_marketing_suppression_failed('phone','5125550111','test failure') failed"),
  (rows) => rows[0].synced === false && rows[0].failed === false,
);

// Heal s2-overlapping-sync-double-counts-attempts: a second scheduled run must
// not process a row another run already claimed, but a crashed run's lease must
// return the row and both mark paths must release the claim.
await query(
  "insert into public.contact_suppressions (channel, address_normalized, reason) values ('phone','15125550105','claim fixture')",
);
await pass(
  "a claimed suppression is not offered to an overlapping run",
  async () => {
    const first = await query("select address_normalized from public.claim_marketing_suppressions(500,'worker-a',600) where address_normalized='15125550105'");
    const second = await query("select address_normalized from public.claim_marketing_suppressions(500,'worker-b',600) where address_normalized='15125550105'");
    const row = await query("select claimed_by, claimed_at is not null claimed from public.marketing_suppression_sync where channel='phone' and address_normalized='15125550105'");
    return { first: first.length, second: second.length, row: row[0] };
  },
  (result) => result.first === 1 && result.second === 0 &&
    result.row.claimed === true && result.row.claimed_by === "worker-a",
);
await pass(
  "an expired claim is reclaimed after a worker stops",
  async () => {
    await query("update public.marketing_suppression_sync set claimed_at = now() - interval '11 minutes' where channel='phone' and address_normalized='15125550105'");
    const reclaimed = await query("select address_normalized from public.claim_marketing_suppressions(500,'worker-b',600) where address_normalized='15125550105'");
    const row = await query("select claimed_by from public.marketing_suppression_sync where channel='phone' and address_normalized='15125550105'");
    return { reclaimed: reclaimed.length, claimed_by: row[0].claimed_by };
  },
  (result) => result.reclaimed === 1 && result.claimed_by === "worker-b",
);
await pass(
  "a failed sync releases the claim and counts one attempt",
  async () => {
    const marked = await query("select public.mark_marketing_suppression_failed('phone','5125550105','vendor 503') failed");
    const row = await query("select status, attempts, claimed_at, claimed_by from public.marketing_suppression_sync where channel='phone' and address_normalized='15125550105'");
    return { marked: marked[0].failed, row: row[0] };
  },
  (result) => result.marked === true && result.row.status === "failed" &&
    result.row.attempts === 1 && result.row.claimed_at === null &&
    result.row.claimed_by === null,
);
await pass(
  "a recovered vendor syncs the reclaimed row and clears the claim",
  async () => {
    const claimed = await query("select address_normalized from public.claim_marketing_suppressions(500,'worker-c',600) where address_normalized='15125550105'");
    const marked = await query("select public.mark_marketing_suppression_synced('phone','5125550105','test-crm') synced");
    const row = await query("select status, claimed_at from public.marketing_suppression_sync where channel='phone' and address_normalized='15125550105'");
    return { claimed: claimed.length, marked: marked[0].synced, row: row[0] };
  },
  (result) => result.claimed === 1 && result.marked === true &&
    result.row.status === "synced" && result.row.claimed_at === null,
);

await pass(
  "replaying the same customer revocation is accepted",
  () =>
    query(
      "select public.request_marketing_revocation('LPP-2026-OPTOUT','(512) 555-0199',null,'Stop calls','customer_web','44444444-4444-4444-8444-444444444445') result",
    ),
  (rows) =>
    rows[0].result?.recorded === true &&
    Array.isArray(rows[0].result?.channels) &&
    rows[0].result.channels.includes("phone"),
);
await pass(
  "replay does not duplicate the revocation evidence",
  () =>
    query(
      "select count(*)::int n from public.marketing_revocations where request_id='44444444-4444-4444-8444-444444444445'",
    ),
  (rows) => rows[0].n === 1,
);
await pass(
  "replay does not re-open the synced outbox row",
  () =>
    query(
      "select status, request_id from public.marketing_suppression_sync where channel='phone' and address_normalized='15125550199'",
    ),
  (rows) =>
    rows.length === 1 &&
    rows[0].status === "synced" &&
    rows[0].request_id === "44444444-4444-4444-8444-444444444445",
);
await pass(
  "a genuinely new withdrawal can re-queue a synced contact",
  () =>
    query(
      "select public.request_marketing_revocation('LPP-2026-OPTOUT','+15125550199',null,'Second request','customer_web','44444444-4444-4444-8444-444444444447') result",
    ),
  (rows) => rows[0].result?.recorded === true,
);
await pass(
  "the new request re-opens propagation",
  () =>
    query(
      "select status, request_id from public.marketing_suppression_sync where channel='phone' and address_normalized='15125550199'",
    ),
  (rows) =>
    rows.length === 1 &&
    rows[0].status === "pending" &&
    rows[0].request_id === "44444444-4444-4444-8444-444444444447",
);
await pass(
  "customer opt-out can suppress the email on the case",
  () =>
    query(
      "select public.request_marketing_revocation('LPP-2026-OPTOUT',null,'OPTOUT@EXAMPLE.COM','Stop email','customer_web','44444444-4444-4444-8444-444444444446') result",
    ),
  (rows) =>
    rows[0].result?.recorded === true &&
    Array.isArray(rows[0].result?.channels) &&
    rows[0].result.channels.includes("email"),
);
await pass(
  "the email revocation is suppressed and queued",
  () =>
    query(
      "select public.is_contact_suppressed('email','optout@example.com') suppressed, (select count(*)::int from public.marketing_suppression_sync where channel='email' and address_normalized='optout@example.com') queued",
    ),
  (rows) => rows[0].suppressed === true && rows[0].queued === 1,
);
await exec("set role authenticated;");
await expectError(
  "an authenticated customer cannot call the revocation RPC directly",
  () =>
    query(
      "select public.request_marketing_revocation('LPP-2026-OPTOUT','+15125550199',null,null,'customer_web',null)",
    ),
  "permission denied",
);
await exec("reset role;");
await exec("set role anon;");
await expectError(
  "an anonymous caller cannot call the revocation RPC directly",
  () =>
    query(
      "select public.request_marketing_revocation('LPP-2026-OPTOUT','+15125550199',null,null,'customer_web',null)",
    ),
  "permission denied",
);
await exec("reset role;");

// The deployment's read-only verification query must also execute and pass.
await pass(
  "staging catalog checks include and pass the queue write-denial checks",
  () => query(readFileSync("supabase/ops/staging-runbook-checks.sql", "utf8")),
  (rows) => rows.some((row) => row.check_name.startsWith("0011")) && rows.every((row) => row.passed),
);

// --------------------------------------------------------- retention/delete
await pass("retention is disabled while no schedule is approved", () => query("select public.purge_expired_cases() n"), (rows) => rows[0].n === 0);
await query("update public.app_settings set value='1' where key='retention_months'");
await query(
  `insert into public.cases (reference, questionnaire_version, submitted_at, payload)
   values ('LPP-2024-OLD001','v','2024-01-01T00:00:00Z','{}'::jsonb)`,
);
await pass("approved retention deletes the expired case", () => query("select public.purge_expired_cases() n"), (rows) => rows[0].n === 1);
await pass("retention deletion is audited", () => query("select count(*)::int n from public.case_deletions where case_reference='LPP-2024-OLD001'"), (rows) => rows[0].n === 1);

await claims("aal2");
await exec("set role authenticated;");
await pass("reviewer deletes a case with a reason", () => query("select public.delete_case('LPP-2026-TEST01','Customer deletion request')"), () => true);
await exec("reset role;");
await pass("case is gone", () => query("select count(*)::int n from public.cases where reference='LPP-2026-TEST01'"), (rows) => rows[0].n === 0);
await pass("deletion is audited", () => query("select count(*)::int n from public.case_deletions where case_reference='LPP-2026-TEST01'"), (rows) => rows[0].n === 1);

console.log(`SUMMARY failures=${failures}`);
await db.close();
process.exit(failures === 0 ? 0 : 1);
