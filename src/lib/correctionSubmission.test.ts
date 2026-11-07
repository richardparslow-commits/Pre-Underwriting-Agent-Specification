import test from "node:test";
import assert from "node:assert/strict";
import { CASE_GONE, writeCorrection, correctionInput } from "./correctionSubmission";
const key = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
test("real correction adapter sends one immutable ID/payload and accepts exact bigint acknowledgements", async () => {
  let calls = 0;
  const client = {
    rpc: async (name: string, args: Record<string, string>) => {
      calls++;
      assert.equal(name, "record_case_correction");
      assert.deepEqual(args, {
        p_reference: "LPP-2026-COR001",
        p_detail: "Synthetic correction",
        p_request_id: key,
      });
      if (calls === 1) throw new Error("response lost after commit");
      return {
        data: { recorded: true, correction_id: "9007199254740993" },
        error: null,
      };
    },
  };
  await assert.rejects(
    writeCorrection(client, "LPP-2026-COR001", " Synthetic correction ", key),
    /could not be confirmed/,
  );
  await writeCorrection(
    client,
    "LPP-2026-COR001",
    " Synthetic correction ",
    key,
  );
  assert.equal(calls, 2);
});
test("old backend, malformed receipts and changed-content conflicts never fall back to unsafe inserts", async () => {
  for (const value of [
    null,
    { recorded: true, correction_id: 123 },
    { recorded: false, correction_id: "1" },
    { recorded: true, correction_id: "0" },
  ])
    await assert.rejects(
      writeCorrection(
        { rpc: async () => ({ data: value, error: null }) },
        "ref",
        "text",
        key,
      ),
      /could not be confirmed/,
    );
  let calls = 0;
  await assert.rejects(
    writeCorrection(
      {
        rpc: async () => {
          calls++;
          return { data: null, error: { code: "PGRST202" } };
        },
      },
      "ref",
      "text",
      key,
    ),
    /backend update/,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    writeCorrection(
      {
        rpc: async () => ({
          data: null,
          error: {
            message: "Correction request already used for different content",
          },
        }),
      },
      "ref",
      "text",
      key,
    ),
    /different correction text/,
  );
});
test("a deleted case is terminal, including when deletion wins the insert race", async () => {
  for (const error of [
    { code: "P0001", message: "Case not found" },
    {
      code: "23503",
      message:
        'insert or update on table "case_corrections" violates foreign key constraint "case_corrections_case_id_fkey"',
    },
  ]) {
    let calls = 0;
    await assert.rejects(
      writeCorrection(
        {
          rpc: async () => {
            calls++;
            return { data: null, error };
          },
        },
        "LPP-2026-DELETED",
        "Synthetic correction",
        key,
      ),
      (failure: unknown) => {
        assert(failure instanceof Error);
        assert.equal(failure.message, CASE_GONE);
        assert.doesNotMatch(
          failure.message,
          /retry|unchanged|could not be confirmed/i,
        );
        return true;
      },
    );
    assert.equal(calls, 1);
  }
});
test("invalid local correction details or IDs cannot make a request", () => {
  for (const [text, id] of [
    ["", key],
    ["x".repeat(4001), key],
    ["text", ""],
    ["text", "not-a-uuid"],
  ] as const)
    assert.throws(() => correctionInput(text, id));
});
