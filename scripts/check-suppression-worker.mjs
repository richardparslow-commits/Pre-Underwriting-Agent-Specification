import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("suppression worker database regressions", async (t) => {
  const db = new PGlite();
  const query = async (sql, params = []) => (await db.query(sql, params)).rows;
  const seed = async (address, channel = "email") => db.query(
    "insert into public.contact_suppressions(channel,address_normalized,reason) values($1,$2,'synthetic regression')",
    [channel, address],
  );
  const clear = async () => db.exec("truncate public.marketing_suppression_sync,public.contact_suppressions");
  const claim = async (worker = "worker-a") => (await query(
    "select * from public.claim_next_marketing_suppression($1,600)", [worker],
  ))[0];
  const complete = async (row, worker, outcome = "synced") => (await query(
    "select public.complete_marketing_suppression($1,$2,$3,$4,$5,$6) applied",
    [row.channel, row.address_normalized, worker, row.claim_token, outcome, "synthetic vendor result"],
  ))[0].applied;
  try {
    await db.exec(`create schema auth; create table auth.users(id uuid primary key,email text);
      create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;
      create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      grant usage on schema public to anon,authenticated,service_role;`);
    const migrations = readdirSync("supabase/migrations").filter(x => x.endsWith(".sql")).sort();
    // Including the earlier migrations on replay catches accidental re-grants.
    for (let round = 0; round < 2; round++) {
      for (const file of migrations) await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    }

    await t.test("one hundred refusals cannot starve a newer untouched opt-out, even when retries are due again", async () => {
      await clear();
      await db.exec(`insert into public.contact_suppressions(channel,address_normalized,reason)
        select 'email','old-'||i||'@example.invalid','synthetic' from generate_series(1,100)i;`);
      await seed("new@example.invalid");
      await db.exec(`update public.marketing_suppression_sync set
        next_attempt_at=case when address_normalized='new@example.invalid' then '2026-02-01'::timestamptz else '2026-01-01'::timestamptz end;`);
      for (let i = 0; i < 100; i++) {
        const row = await claim();
        assert.notEqual(row.address_normalized, "new@example.invalid");
        assert.equal(await complete(row, "worker-a", "failed"), true);
      }
      // Simulate the next scheduler tick being later than the failure backoff.
      await db.exec("update public.marketing_suppression_sync set next_attempt_at=now()-interval '1 second' where status='failed'");
      const newer = await claim("worker-b");
      assert.equal(newer.address_normalized, "new@example.invalid");
      assert.equal(newer.attempts, 0);
      assert.equal(await complete(newer, "worker-b"), true);
      const [result] = await query(`select count(*) filter(where status='failed')::int failures,
        bool_and(public.is_contact_suppressed(channel,address_normalized)) all_locally_suppressed
        from public.marketing_suppression_sync`);
      assert.deepEqual(result, { failures: 100, all_locally_suppressed: true });
    });

    await t.test("backoff excludes work before selection and does not permanently cap recovery", async () => {
      await clear(); await seed("recover@example.invalid");
      for (let i = 0; i < 7; i++) {
        const row = await claim(); assert.ok(row);
        assert.equal(await complete(row, "worker-a", "failed"), true);
        assert.equal(await claim("worker-b"), undefined);
        const [state] = await query(`select attempts, next_attempt_at>now() future,
          next_attempt_at<=now()+interval '1 hour' bounded from public.marketing_suppression_sync`);
        assert.equal(state.attempts, i + 1); assert.equal(state.future, true); assert.equal(state.bounded, true);
        await db.exec("update public.marketing_suppression_sync set next_attempt_at=now()-interval '1 second'");
      }
      const recovered = await claim("worker-b");
      assert.equal(recovered.attempts, 7);
      assert.equal(await complete(recovered, "worker-b"), true);
      assert.equal(await claim(), undefined);
    });

    await t.test("overlapping workers skip a live lease; expired work receives a new token even for the same worker name", async () => {
      await clear(); await seed("lease@example.invalid");
      const first = await claim();
      assert.equal(await claim("worker-b"), undefined);
      await db.exec("update public.marketing_suppression_sync set lease_expires_at=now()-interval '1 second'");
      assert.equal(await complete(first, "worker-a"), false, "expiry alone invalidates an acknowledgement");
      const second = await claim();
      assert.notEqual(second.claim_token, first.claim_token);
      assert.equal(await complete(first, "worker-a"), false);
      assert.equal(await complete(first, "worker-a", "failed"), false);
      assert.equal(await complete(second, "worker-b"), false, "wrong owner cannot finish the current token");
      const [owned] = await query("select claimed_by,claim_token,attempts,status from public.marketing_suppression_sync");
      assert.equal(owned.claim_token, second.claim_token); assert.equal(owned.claimed_by, "worker-a");
      assert.equal(owned.attempts, 0); assert.equal(owned.status, "pending");
      assert.equal(await complete(second, "worker-a"), true);
      assert.equal(await complete(second, "worker-a"), false, "completion is applied at most once");
    });

    await t.test("a contact re-queued during a send invalidates the earlier claim", async () => {
      await clear(); await seed("requeued@example.invalid");
      const old = await claim();
      await db.exec("update public.contact_suppressions set reason='new synthetic revocation'");
      assert.equal(await complete(old, "worker-a"), false);
      const [row] = await query("select claimed_by,claim_token,lease_expires_at,status,attempts,next_attempt_at<=now() due from public.marketing_suppression_sync");
      assert.deepEqual(row, { claimed_by: null, claim_token: null, lease_expires_at: null, status: "pending", attempts: 0, due: true });
      assert.ok(await claim("worker-b"));
    });

    await t.test("legacy and canonical phones share a vendor identity but keep independent exact acknowledgement keys", async () => {
      await clear(); await seed("5125550101", "phone"); await seed("15125550101", "phone");
      const first = await claim();
      assert.equal(first.vendor_address, "15125550101");
      assert.equal(await complete(first, "worker-a"), true);
      const second = await claim("worker-b");
      assert.equal(second.vendor_address, first.vendor_address);
      assert.notEqual(second.address_normalized, first.address_normalized);
      assert.equal(second.attempts, 0);
      assert.equal(await complete(second, "worker-b"), true);
      assert.equal((await query("select count(*)::int n from public.marketing_suppression_sync where status='synced'"))[0].n, 2);
    });

    await t.test("anonymous/reviewer roles cannot run worker RPCs; service role cannot use unfenced legacy RPCs", async () => {
      const claimSignature = "public.claim_next_marketing_suppression(text,integer)";
      const completeSignature = "public.complete_marketing_suppression(text,text,text,uuid,text,text)";
      for (const role of ["anon", "authenticated", "service_role"]) {
        for (const signature of [claimSignature, completeSignature]) {
          const [row] = await query("select has_function_privilege($1,$2,'execute') allowed", [role, signature]);
          assert.equal(row.allowed, role === "service_role");
        }
      }
      for (const signature of ["public.claim_marketing_suppressions(integer,text,integer)",
        "public.mark_marketing_suppression_failed(text,text,text)", "public.mark_marketing_suppression_synced(text,text,text)"]) {
        assert.equal((await query("select has_function_privilege('service_role',$1,'execute') allowed", [signature]))[0].allowed, false);
      }
      await clear(); await seed("service@example.invalid");
      await db.exec("set role service_role");
      try { const row = await claim(); assert.ok(row); assert.equal(await complete(row, "worker-a"), true); }
      finally { await db.exec("reset role"); }
    });
  } finally { await db.close(); }
});
