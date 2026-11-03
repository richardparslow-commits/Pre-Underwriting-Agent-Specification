/** Disposable PostgreSQL regressions for Heal's queue scaling report. */
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

const makeCases = async(n)=>query(`insert into public.cases(reference,questionnaire_version,submitted_at,payload)
  select 'LPP-2026-Q'||lpad(n::text,5,'0'),'test','2026-01-01'::timestamptz,
  jsonb_build_object('lead',jsonb_build_object('firstName','Synthetic','lastName','Case','state','TX','email','private@example.test'),
    'answers',jsonb_build_array(jsonb_build_object('disposition','unresolved','answerText','Synthetic private answer'),jsonb_build_object('disposition','answered')))
  from generate_series(1,$1::int) n`,[n]);
await makeCases(2001);
const page=async(at=null,ref=null)=>authorized(()=>rpc('get_case_queue_page',[at,ref]));

test('indexed queue pages retain every reference, exact totals, head identity and metadata-only summaries',async()=>{
  const first=await page();
  assert.equal(first.total,2001);assert.equal(first.entries.length,25);
  assert.equal(first.head.reference,'LPP-2026-Q02001');
  assert.equal(first.entries[0].unanswered,1);
  for(const entry of first.entries) {
    assert.deepEqual(Object.keys(entry).sort(),['crisis_disclosure','first_name','last_name','notification_state','reference','residence_state','status','submitted_at','unanswered']);
  }
  assert.ok(!JSON.stringify(first).includes('private@example.test'));
  assert.ok(!JSON.stringify(first).includes('Synthetic private answer'));
  const refs=first.entries.map(x=>x.reference);let cursor=first.next_cursor,turns=0;
  while(cursor) {
    assert.ok(++turns<100);
    const next=await page(cursor.submitted_at,cursor.reference);
    assert.equal(next.total,2001);assert.equal(next.head.reference,first.head.reference);
    assert.ok(next.entries.length<=25);refs.push(...next.entries.map(x=>x.reference));cursor=next.next_cursor;
  }
  assert.equal(refs.length,2001);assert.equal(new Set(refs).size,2001);
  assert.equal(refs.at(-1),'LPP-2026-Q00001');
});

test('the page projection processes at most 25 answer arrays while indexed selection stops at 26 rows',async()=>{
  const [{prosrc:sql}]=await query("select prosrc from pg_proc where oid='public.case_queue_page_data(timestamptz,text)'::regprocedure");
  const body=sql.replaceAll('p_before_at','$1::timestamptz').replaceAll('p_before_reference','$2::text');
  await query('analyze public.cases');
  const walk=(n)=>[n,...(n.Plans??[]).flatMap(walk)];
  for(const params of [[null,null],['2026-01-01','LPP-2026-Q01000']]) {
    const result=await query('explain (analyze,verbose,format json) '+body,params);
    const nodes=walk(result[0]['QUERY PLAN'][0].Plan);
    const answers=nodes.filter(n=>n['Function Name']==='jsonb_array_elements');
    assert.equal(answers.length,1,JSON.stringify(nodes.map(n=>n['Node Type'])));
    assert.ok(answers[0]['Actual Loops']<=25);
    const selected=nodes.find(n=>n['Subplan Name']==='CTE selected');
    assert.ok(selected,'selection must be materialized before projection');
    const reads=walk(selected).filter(n=>n['Relation Name']==='cases' && n['Actual Loops']>0);
    assert.equal(reads.length,1);
    assert.ok(reads[0]['Index Name']==='cases_queue_page_idx',JSON.stringify(reads[0]));
    assert.ok(reads[0]['Actual Rows']<=26);
    console.log(JSON.stringify({cursor:params[1],payloadRows:reads[0]['Actual Rows'],answerArrays:answers[0]['Actual Loops'],index:reads[0]['Index Name']}));
  }
});

test('queue RPC retains reviewer/MFA permissions, private helpers and cursor validation',async()=>{
  for(const [role,aal,user,expected] of [['anon','aal1',other,/permission denied/i],['authenticated','aal1',reviewer,/Not authorised/i],['authenticated','aal2',other,/Not authorised/i]]) {
    await assert.rejects(asRole(role,aal,user,()=>rpc('get_case_queue_page',[null,null])),expected);
  }
  await authorized(async()=>{
    await assert.rejects(rpc('case_queue_page_data',[null,null]),/permission denied/i);
    await assert.rejects(query('select payload from public.cases'),/permission denied/i);
    await assert.rejects(query("update public.case_summaries set status='reviewed'"),/permission denied/i);
    for(const args of [['2026-01-01',null],[null,'x'],['infinity','x'],['2026-01-01','']]) await assert.rejects(rpc('get_case_queue_page',args),/cursor/i);
  });
});

test('new-head and empty-queue metadata are correct without altering case data',async()=>{
  const before=await page();
  await query(`insert into public.cases(reference,questionnaire_version,submitted_at,payload) values ('LPP-2026-Q02002','test','2026-02-01','{}')`);
  const after=await page(before.next_cursor.submitted_at,before.next_cursor.reference);
  assert.equal(after.total,2002);assert.equal(after.head.reference,'LPP-2026-Q02002');
  assert.ok(!after.entries.some(x=>x.reference==='LPP-2026-Q02002'));
  await query('delete from public.cases');
  assert.deepEqual(await page(),{entries:[],total:0,head:null,next_cursor:null});
});

test('queue rollout catalog checks pass without reading customer data',async()=>{
  const checks=await query(readFileSync('supabase/ops/queue-page-checks.sql','utf8'));
  assert.equal(checks.length,4);assert.ok(checks.every(x=>x.passed),JSON.stringify(checks));
});
