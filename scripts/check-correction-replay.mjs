import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("correction request replay against isolated PostgreSQL", async (t) => {
  const db = new PGlite();
  const reviewer = "11111111-1111-4111-8111-111111111111",
    second = "22222222-2222-4222-8222-222222222222",
    outsider = "33333333-3333-4333-8333-333333333333";
  const key = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const q = async (sql, args = []) => (await db.query(sql, args)).rows;
  const login = async (
    id = reviewer,
    aal = "aal2",
    email = "synthetic@example.invalid",
  ) => {
    await db.exec("reset role");
    await q("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({ sub: id, email, aal }),
    ]);
    await db.exec("set role authenticated");
  };
  const save = async (
    reference = "LPP-2026-COR001",
    detail = "Synthetic correction",
    id = key,
  ) =>
    (
      await q("select public.record_case_correction($1,$2,$3::uuid) receipt", [
        reference,
        detail,
        id,
      ])
    )[0].receipt;
  const count = async () => {
    await db.exec("reset role");
    return Number(
      (
        await q(
          "select count(*) n from public.case_corrections where request_id is not null",
        )
      )[0].n,
    );
  };
  const migrations = readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort();
  try {
    await db.exec(`create schema auth; create table auth.users(id uuid primary key,email text);
      create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;
      create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      grant usage on schema public to anon,authenticated,service_role;`);
    for (const file of migrations.filter((f) => !f.startsWith("0022_")))
      await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
    for (const id of [reviewer, second, outsider])
      await q("insert into auth.users values($1,$2)", [
        id,
        "synthetic@example.invalid",
      ]);
    for (const id of [reviewer, second])
      await q("insert into public.reviewers(user_id,email) values($1,$2)", [
        id,
        "synthetic@example.invalid",
      ]);
    for (const ref of ["LPP-2026-COR001", "LPP-2026-COR002"])
      await q(
        "insert into public.cases(reference,questionnaire_version,payload) values($1,'synthetic','{\"immutable\":true}')",
        [ref],
      );
    await login();
    await q(
      "select public.record_case_correction('LPP-2026-COR002','Legacy lost-response control')",
    );
    await q(
      "select public.record_case_correction('LPP-2026-COR002','Legacy lost-response control')",
    );
    await db.exec("reset role");
    assert.equal(
      Number(
        (
          await q(
            "select count(*) n from public.case_corrections where detail='Legacy lost-response control'",
          )
        )[0].n,
      ),
      2,
    );
    console.log(
      "BEFORE: legacy retries append two corrections after a lost acknowledgement",
    );
    const migration = readFileSync(
      "supabase/migrations/0022_correction_request_idempotency.sql",
      "utf8",
    );
    await db.exec(migration);
    await t.test(
      "lost acknowledgement and overlapping retries retain one exact receipt",
      async () => {
        await db.exec(
          "alter sequence public.case_corrections_id_seq restart with 9007199254740993",
        );
        await login();
        const first = await save();
        const repeats = await Promise.all([save(), save()]);
        assert.equal(first.correction_id, "9007199254740993");
        assert.deepEqual(repeats, [first, first]);
        assert.deepEqual(
          await save(undefined, " Synthetic correction "),
          first,
        );
        assert.equal(await count(), 1);
      },
    );
    await t.test(
      "same request with changed content fails; deliberate new save remains append-only",
      async () => {
        await login();
        await assert.rejects(
          save(undefined, "Different correction"),
          /different content/,
        );
        assert.equal(await count(), 1);
        await login();
        await save(
          undefined,
          undefined,
          "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        );
        assert.equal(await count(), 2);
      },
    );
    await t.test(
      "identity is scoped to the case and authenticated reviewer",
      async () => {
        await login(reviewer, "aal2", "changed-email@example.invalid");
        assert.equal((await save()).correction_id, "9007199254740993");
        await login();
        await save("LPP-2026-COR002");
        await login(second);
        await save();
        assert.equal(await count(), 4);
      },
    );
    await t.test(
      "membership and MFA are enforced on replays, and direct writes remain denied",
      async () => {
        for (const [id, aal] of [
          [outsider, "aal2"],
          [reviewer, "aal1"],
        ]) {
          await login(id, aal);
          await assert.rejects(save(), /Not authorised/);
        }
        await login();
        await assert.rejects(
          q("update public.case_corrections set detail='forged'"),
          /permission denied/,
        );
        await assert.rejects(
          q("delete from public.case_corrections"),
          /permission denied/,
        );
        await db.exec("reset role;set role anon");
        await assert.rejects(save(), /permission denied/);
        assert.equal(await count(), 4);
      },
    );
    await t.test(
      "invalid IDs/text and missing cases fail before appending; legacy unsafe RPC is absent",
      async () => {
        await login();
        await assert.rejects(
          save(undefined, undefined, null),
          /request ID is required/,
        );
        await assert.rejects(save(undefined, ""), /text is required/);
        await assert.rejects(save(undefined, "x".repeat(4001)), /too long/);
        await assert.rejects(save("LPP-2026-NOCASE"), /Case not found/);
        await assert.rejects(
          q(
            "select public.record_case_correction('LPP-2026-COR001','unsafe old client')",
          ),
          /does not exist/,
        );
        assert.equal(await count(), 4);
      },
    );
    await t.test(
      "all migrations replay without restoring legacy writes or changing evidence",
      async () => {
        await db.exec("reset role");
        for (const file of migrations)
          await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
        await login();
        assert.equal((await save()).correction_id, "9007199254740993");
        assert.equal(await count(), 4);
        assert.deepEqual(
          (
            await q(
              "select payload from public.cases where reference='LPP-2026-COR001'",
            )
          )[0].payload,
          { immutable: true },
        );
        assert.equal(
          Number(
            (
              await q(
                "select count(*) n from public.case_corrections where request_id is null",
              )
            )[0].n,
          ),
          2,
        );
        assert.equal(
          (
            await q(
              "select to_regprocedure('public.record_case_correction(text,text)') fn",
            )
          )[0].fn,
          null,
        );
        const catalog = await q(
          readFileSync("supabase/ops/correction-replay-checks.sql", "utf8"),
        );
        assert.ok(
          catalog.every((row) => row.passed),
          JSON.stringify(catalog),
        );
      },
    );
  } finally {
    await db.close();
  }
});
