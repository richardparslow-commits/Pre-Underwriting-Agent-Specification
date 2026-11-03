import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { readCaseQueue } from "./queuePaging";
const at='2026-01-01T00:00:00.000001+00:00';
const row=(n:number)=>({reference:`LPP-2026-Q${String(n).padStart(5,'0')}`,submitted_at:at,status:'submitted',notification_state:'queued',crisis_disclosure:false,first_name:'Synthetic',last_name:'Case',residence_state:'TX',unanswered:1});
const raw=(total=2001)=>({entries:Array.from({length:25},(_,i)=>row(2001-i)),total,head:{submitted_at:at,reference:row(2001).reference},next_cursor:{submitted_at:at,reference:row(1977).reference}});
function clientFor(response:unknown,error?:{code:string;message:string}) {
  const calls:{url:URL;method:string;body:unknown}[]=[];
  const client=createClient('https://queue.example.invalid','synthetic-public-key',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async(input,init)=>{
    calls.push({url:new URL(String(input)),method:init?.method??'GET',body:JSON.parse(String(init?.body??'{}'))});
    return new Response(JSON.stringify(error??response),{status:error?403:200,headers:{'Content-Type':'application/json'}});
  }}});
  return {client,calls};
}
test('optimized queue uses one bounded RPC and retains exact timestamp cursors, totals and head metadata',async()=>{
  const {client,calls}=clientFor(raw());
  const first=await readCaseQueue(client);
  assert.equal(calls.length,1);assert.equal(calls[0]!.url.pathname,'/rest/v1/rpc/get_case_queue_page');
  assert.equal(calls[0]!.method,'POST');assert.deepEqual(calls[0]!.body,{p_before_at:null,p_before_reference:null});
  assert.equal(first.items.length,25);assert.equal(first.total,2001);assert.equal(first.items[0]?.unanswered,1);
  assert.equal(first.nextCursor,`${at}|${row(1977).reference}`);assert.equal(first.headCursor,`${at}|${row(2001).reference}`);
  await readCaseQueue(client,first.nextCursor!);
  assert.deepEqual(calls[1]!.body,{p_before_at:at,p_before_reference:row(1977).reference});
});
test('optimized empty queue has a verified zero total and null cursors',async()=>{
  const {client}=clientFor({entries:[],total:0,head:null,next_cursor:null});
  assert.deepEqual(await readCaseQueue(client),{items:[],total:0,headCursor:null,nextCursor:null});
});
test('malformed optimized metadata is rejected, never retried through the old projection',async()=>{
  for(const value of [null,{}, {...raw(),total:-1},{...raw(),total:0},{...raw(),total:9007199254740994},{...raw(),head:null},{...raw(),entries:[{}]},{...raw(),entries:Array.from({length:26},(_,i)=>row(i))},{...raw(),next_cursor:{}},{...raw(),next_cursor:{submitted_at:at,reference:'wrong-last-row'}},{...raw(),entries:[{...row(1),unanswered:-1}]}]) {
    const {client,calls}=clientFor(value);await assert.rejects(readCaseQueue(client),/Cases could not be loaded/);assert.equal(calls.length,1);
  }
});
test('authorization, server and transport errors cannot fall back to a different read path',async()=>{
  for(const code of ['42501','P0001','XX000','PGRST202']) {
    const {client,calls}=clientFor(null,{code,message:'Synthetic failure'});await assert.rejects(readCaseQueue(client));assert.equal(calls.length,1);
  }
});
test('invalid queue cursor is rejected before contacting either backend path',async()=>{
  const {client,calls}=clientFor(raw());
  for(const value of ['invalid','not-a-date|reference',`${at}|`]) await assert.rejects(readCaseQueue(client,value),/cursor is not valid/);
  assert.equal(calls.length,0);
});

test('an unreachable queue RPC never triggers a legacy table read',async()=>{
  const paths:string[]=[];
  const client=createClient('https://queue.example.invalid','synthetic-public-key',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async(input)=>{paths.push(new URL(String(input)).pathname);throw new Error('Synthetic offline');}}});
  await assert.rejects(readCaseQueue(client));
  assert.ok(paths.length>0);assert.ok(paths.every(path=>path==='/rest/v1/rpc/get_case_queue_page'));
});
