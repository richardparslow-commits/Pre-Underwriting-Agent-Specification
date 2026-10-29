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

const migrations = [
  "0001_pre_underwriting.sql",
  "0002_case_corrections.sql",
  "0003_reliability_and_access.sql",
  "0004_reviewer_write_paths.sql",
  "0005_case_summary_view.sql",
  "0006_notification_terminal_state.sql",
  "0007_marketing_revocation.sql",
  "0008_marketing_revocation_idempotency.sql",
  "0009_audited_case_access.sql",
  "0010_notification_retry_window.sql",
].map((name) => readFileSync(`supabase/migrations/${name}`, "utf8"));

// Every migration must be safe to re-run.
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

await pass(
  "RLS enabled on sensitive tables",
  () =>
    query(
      "select relname, relrowsecurity from pg_class where relname in ('cases','case_review_log','email_events','case_deletions','marketing_revocations','marketing_suppression_sync','submission_rate_limits','app_settings') order by relname",
    ),
  (rows) => rows.length === 8 && rows.every((row) => row.relrowsecurity === true),
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
await pass("aal2 reviewer opens a case through the audited RPC", () => query("select public.open_case_for_review('LPP-2026-TEST01') result"), (rows) => rows[0].result?.case?.reference === "LPP-2026-TEST01" && rows[0].result?.review_log?.[0]?.action === "opened");
await pass("missing case returns no payload", () => query("select public.open_case_for_review('LPP-2026-MISSING') result"), (rows) => rows[0].result === null);
await pass("second open is also audited", () => query("select public.open_case_for_review('LPP-2026-TEST01') result"), (rows) => rows[0].result?.review_log?.filter((entry) => entry.action === "opened").length === 2);
await pass(
  "a consequential action survives more opens than the window holds",
  () => query("select public.open_case_for_review('LPP-2026-BURIED') result"),
  (rows) => {
    const result = rows[0].result ?? {};
    const log = result.review_log ?? [];
    return (
      result.review_log_total === 23 &&
      log.length === 20 &&
      log.some((entry) => entry.action === "marked_reviewed") &&
      log[0]?.action === "marked_reviewed" &&
      !("is_open" in (log[0] ?? {})) &&
      !("id" in (log[0] ?? {}))
    );
  },
);
await pass("reviewer can add a correction through its RPC", () => query("select public.record_case_correction('LPP-2026-TEST01','Test correction')"), () => true);
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
  () => query("select public.record_case_review('LPP-2026-TEST01','marked_reviewed','Reviewed the full record')"),
  () => true,
);
await exec("reset role;");
await pass(
  "the RPC updates status and log atomically",
  () => query("select c.status, count(l.id)::int n from public.cases c left join public.case_review_log l on l.case_id = c.id and l.action = 'marked_reviewed' where c.reference = 'LPP-2026-TEST01' group by c.status"),
  (rows) => rows[0].status === "reviewed" && rows[0].n === 1,
);

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
