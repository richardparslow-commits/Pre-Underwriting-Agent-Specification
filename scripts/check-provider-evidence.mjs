import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("provider evidence survives local notification failures", async (t) => {
 const db = new PGlite();
 const q = async (sql, params=[]) => (await db.query(sql,params)).rows;
 const seed = async (ref,state="failed") => q("insert into public.cases(reference,questionnaire_version,notification_state,payload) values($1,'synthetic',$2,'{}')",[ref,state]);
 const event = async (id,ref,state="failed",message="synthetic-message") => (await q("select public.apply_email_event($1,'synthetic-event',$2,$3,$4) result",[id,ref,message,state]))[0].result;
 const complete = async (ref,state="accepted") => q("select public.complete_case_notification($1,$2,'synthetic local result','synthetic-message')",[ref,state]);
 const row = async ref => (await q("select notification_state state,notification_provider_state provider,notification_next_attempt_at retry,notification_claimed_by owner from public.cases where reference=$1",[ref]))[0];
 try {
  await db.exec(`create schema auth; create table auth.users(id uuid primary key,email text);
   create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
   create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;
   create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
   grant usage on schema public to anon,authenticated,service_role;`);
  const files = readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
  for(const f of files.filter(f=>f<'0019')) await db.exec(readFileSync('supabase/migrations/'+f,'utf8'));
  await seed('LPP-2026-OLD001','accepted');
  await q("insert into public.email_events(event_id,event_type,case_id,notification_state,message_id) select 'old-bounce','email.bounced',id,'failed','old-message' from public.cases where reference='LPP-2026-OLD001'");
  for(const f of files.filter(f=>f>='0019')) await db.exec(readFileSync('supabase/migrations/'+f,'utf8'));

  await t.test('forward migration repairs already-correlated ignored bounces', async()=>{
   assert.deepEqual(await row('LPP-2026-OLD001'),{state:'failed',provider:'failed',retry:null,owner:null});
  });
  await t.test('bounce after a local timeout records authoritative evidence before equal-rank handling', async()=>{
   await seed('LPP-2026-TIME01'); await complete('LPP-2026-TIME01','failed');
   assert.equal(await event('timeout-bounce','LPP-2026-TIME01'),'applied');
   assert.deepEqual(await row('LPP-2026-TIME01'),{state:'failed',provider:'failed',retry:null,owner:null});
   for(const state of ['accepted','queued','not_sent','failed','delivered']) {
    await complete('LPP-2026-TIME01',state);
    assert.deepEqual(await row('LPP-2026-TIME01'),{state:'failed',provider:'failed',retry:null,owner:null});
   }
  });
  await t.test('provider failures are not automatically claimed, while local-only failures can recover', async()=>{
   assert.equal((await q("select * from public.claim_case_notification('LPP-2026-TIME01','worker')")).length,0);
   await seed('LPP-2026-LOCAL1');
   assert.equal((await q("select * from public.claim_case_notification('LPP-2026-LOCAL1','worker')")).length,1);
   await complete('LPP-2026-LOCAL1'); assert.equal((await row('LPP-2026-LOCAL1')).state,'accepted');
  });
  await t.test('accepted evidence is retained independently without turning a timeout into delivery', async()=>{
   await seed('LPP-2026-ACCEP1');
   assert.equal(await event('accepted-after-timeout','LPP-2026-ACCEP1','accepted'),'applied');
   assert.equal((await row('LPP-2026-ACCEP1')).state,'failed');
   assert.equal((await row('LPP-2026-ACCEP1')).provider,'accepted');
   await complete('LPP-2026-ACCEP1'); assert.equal((await row('LPP-2026-ACCEP1')).state,'accepted');
  });
  await t.test('correlated legacy bounce replay repairs evidence and cannot rebind or change its recorded state', async()=>{
   await seed('LPP-2026-LEG001','accepted'); await seed('LPP-2026-OTHER1','queued');
   await q("insert into public.email_events(event_id,event_type,case_id,notification_state,message_id) select 'legacy-replay','email.bounced',id,'failed','legacy-id' from public.cases where reference='LPP-2026-LEG001'");
   assert.equal(await event('legacy-replay','LPP-2026-OTHER1','accepted','changed-id'),'applied');
   assert.equal((await row('LPP-2026-LEG001')).provider,'failed');
   assert.equal((await row('LPP-2026-OTHER1')).state,'queued');
   assert.equal(await event('legacy-replay','LPP-2026-LEG001'),'duplicate');
   assert.equal((await q("select count(*)::int n from public.email_events where event_id='legacy-replay'"))[0].n,1);
  });
  await t.test('provider delivery wins all out-of-order lower events and local results', async()=>{
   await seed('LPP-2026-ORDER1','accepted');
   await event('order-bounce','LPP-2026-ORDER1');
   assert.equal(await event('order-delivery','LPP-2026-ORDER1','delivered'),'applied');
   assert.equal(await event('order-sent','LPP-2026-ORDER1','accepted'),'ignored');
   assert.equal(await event('order-late-bounce','LPP-2026-ORDER1'),'ignored');
   await complete('LPP-2026-ORDER1','failed');
   assert.equal((await row('LPP-2026-ORDER1')).state,'delivered');
   assert.equal((await row('LPP-2026-ORDER1')).provider,'delivered');
  });
  await t.test('unmatched event can correlate later and duplicate results remain idempotent', async()=>{
   assert.equal(await event('early-bounce',null,'failed','early-id'),'unmatched');
   await seed('LPP-2026-EARLY1');
   await q("update public.cases set provider_message_id='early-id' where reference='LPP-2026-EARLY1'");
   assert.equal(await event('early-bounce',null,'failed','early-id'),'applied');
   assert.equal(await event('early-bounce',null,'failed','early-id'),'duplicate');
   assert.equal((await row('LPP-2026-EARLY1')).provider,'failed');
  });
  await t.test('all migrations replay safely without restoring unsafe access or losing provider evidence', async()=>{
   for(const f of files) await db.exec(readFileSync('supabase/migrations/'+f,'utf8'));
   assert.equal((await row('LPP-2026-TIME01')).provider,'failed');
   for(const role of ['anon','authenticated','service_role']) {
    const [value]=await q("select has_function_privilege($1,'public.apply_email_event(text,text,text,text,text)','execute') allowed",[role]);
    assert.equal(value.allowed,role==='service_role');
   }
  });
 } finally { await db.close(); }
});
