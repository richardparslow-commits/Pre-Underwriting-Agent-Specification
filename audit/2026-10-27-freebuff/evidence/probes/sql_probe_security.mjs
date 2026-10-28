import { PGlite } from "../pg/node_modules/@electric-sql/pglite/dist/index.js";
import { readFileSync } from "node:fs";

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
    const message = String(error?.message ?? error);
    failures += 1;
    console.log(`FAIL | ${name} | error=${message.slice(0, 220)}`);
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

const migrations = ["0001_pre_underwriting.sql", "0002_case_corrections.sql", "0003_reliability_and_access.sql"].map(
  (name) => readFileSync(`supabase/migrations/${name}`, "utf8"),
);

for (let round = 1; round <= 2; round += 1) {
  for (const [index, sql] of migrations.entries()) {
    await pass(`migration ${index + 1} run ${round}`, () => exec(sql), () => true);
  }
}

const reviewer = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const caseId = "33333333-3333-4333-8333-333333333333";

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
  answers: [],
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

async function claims(aal, id = reviewer, email = "reviewer@example.com") {
  await exec(
    `select set_config('request.jwt.claims', '${JSON.stringify({ sub: id, email, aal })}', false);`,
  );
}

await pass("RLS enabled on new sensitive tables", async () =>
  query(
    "select relname, relrowsecurity from pg_class where relname in ('cases','case_review_log','email_events','case_deletions','marketing_revocations','submission_rate_limits','app_settings') order by relname",
  ), (rows) => rows.length === 7 && rows.every((row) => row.relrowsecurity === true));

// ------------------------------------------------------------------ AAL2
await claims("aal1");
await exec("set role authenticated;");
await pass("aal1 reviewer sees zero cases", () => query("select count(*)::int n from public.cases"), (rows) => rows[0].n === 0);
await expectError(
  "aal1 reviewer cannot record a review",
  () => query("select public.record_case_review('LPP-2026-TEST01','opened')"),
  "Not authorised",
);
await exec("reset role;");

await claims("aal2");
await exec("set role authenticated;");
await pass("aal2 reviewer sees the case", () => query("select count(*)::int n from public.cases"), (rows) => rows[0].n === 1);
await pass("aal2 reviewer can record opened", () => query("select public.record_case_review('LPP-2026-TEST01','opened')"), () => true);
await pass("opened is deduplicated within the session window", () => query("select public.record_case_review('LPP-2026-TEST01','opened')"), () => true);
await pass("exactly one opened entry exists", () => query("select count(*)::int n from public.case_review_log where action='opened'"), (rows) => rows[0].n === 1);
await pass("GAP: reviewer can update workflow status directly", () => query("update public.cases set status = 'reviewed' where reference = 'LPP-2026-TEST01' returning status"), (rows) => rows.length === 1 && rows[0].status === 'reviewed');
await pass("GAP: reviewer can insert a review-log entry directly", () => query("insert into public.case_review_log (case_id, action, actor, note) select id, 'marked_reviewed', 'reviewer@example.com', 'direct insert' from public.cases where reference = 'LPP-2026-TEST01' returning id"), (rows) => rows.length === 1);
await pass("review-log direct insert and status update are not atomic", () => query("select count(*)::int n from public.case_review_log where action='marked_reviewed' and note='direct insert'"), (rows) => rows[0].n === 1);
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

// --------------------------------------------------------- delivery events
await query(
  `insert into public.cases (reference, questionnaire_version, notification_state, payload)
   values ('LPP-2026-EVENT1','v','queued','{}'::jsonb),
          ('LPP-2026-DIRECT','v','queued','{}'::jsonb)`,
);
await query("update public.cases set provider_message_id='msg_direct' where reference='LPP-2026-DIRECT'");

await pass("accepted event applies to a queued case", () => query("select public.apply_email_event('evt_1','email.sent','LPP-2026-EVENT1','msg_abc','accepted')"), (rows) => rows[0].apply_email_event === "applied");
await pass("duplicate event is ignored by id", () => query("select public.apply_email_event('evt_1','email.sent','LPP-2026-EVENT1','msg_abc','accepted')"), (rows) => rows[0].apply_email_event === "duplicate");
await pass("delivered event applies", () => query("select public.apply_email_event('evt_2','email.delivered','LPP-2026-EVENT1','msg_abc','delivered')"), (rows) => rows[0].apply_email_event === "applied");
await pass("late accepted event cannot regress delivered", () => query("select public.apply_email_event('evt_3','email.sent','LPP-2026-EVENT1','msg_abc','accepted')"), (rows) => rows[0].apply_email_event === "ignored");
await pass("bounce after delivery cannot regress", () => query("select public.apply_email_event('evt_4','email.bounced','LPP-2026-EVENT1','msg_abc','failed')"), (rows) => rows[0].apply_email_event === "ignored");
await pass("case remains delivered", () => query("select notification_state from public.cases where reference='LPP-2026-EVENT1'"), (rows) => rows[0].notification_state === "delivered");
await pass("message-id-only event reconciles", () => query("select public.apply_email_event('evt_5','email.delivery_delayed',null,'msg_direct','accepted')"), (rows) => rows[0].apply_email_event === "applied");

// --------------------------------------------------------------- rate limit
await pass("rate limit allows the first two", async () => {
  const a = await query("select public.consume_submission_rate('rate-key-00000001',2,600) allowed");
  const b = await query("select public.consume_submission_rate('rate-key-00000001',2,600) allowed");
  return [a[0].allowed, b[0].allowed];
}, (rows) => rows[0] === true && rows[1] === true);
await pass("rate limit rejects the third", () => query("select public.consume_submission_rate('rate-key-00000001',2,600) allowed"), (rows) => rows[0].allowed === false);

// ---------------------------------------------------------- marketing stop
await pass("reviewer records a phone revocation", () => query("select public.record_marketing_revocation('LPP-2026-TEST01','phone','Customer asked to stop')"), () => true);
await pass("suppression is queryable", () => query("select public.is_contact_suppressed('phone','+1 (512) 555-0134') suppressed"), (rows) => rows[0].suppressed === true);
await pass("revocation is audited", () => query("select count(*)::int n from public.marketing_revocations"), (rows) => rows[0].n === 1);

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
