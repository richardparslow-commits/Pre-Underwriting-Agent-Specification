import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { WithdrawalHistory } from "./WithdrawalHistory";
import { initialWithdrawals, readWithdrawals, type WithdrawalPage } from "@/lib/withdrawalHistory";

const cursor = { at: "2026-01-01T00:00:00.000001Z", id: "9007199254740995" };
const withdrawal = (id: string) => ({ id, channel: "email" as const, source: "operator", reason: `Synthetic withdrawal ${id}`, recordedBy: "reviewer@example.test", recordedAt: cursor.at });
const output = (view: ReactTestRenderer) => JSON.stringify(view.toJSON());
function button(view: ReactTestRenderer) {
  const result = view.root.findAllByType("button")[0];
  assert.ok(result);
  return result;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

test("oldest withdrawal after the first 20 loads once, with retry and duplicate-request protection", async () => {
  const pending = deferred<WithdrawalPage>();
  let calls = 0;
  const initial = Array.from({ length: 20 }, (_, i) => withdrawal(String(9000 - i)));
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(<WithdrawalHistory reference="LPP-2026-COR001" entries={initial} cursor={cursor} loadPage={async (reference, before) => {
      assert.equal(reference, "LPP-2026-COR001");
      assert.deepEqual(before, cursor);
      if (++calls === 1) throw new Error("offline");
      return pending.promise;
    }} />);
  });
  try {
    assert.equal(view.root.findAllByType("li").length, 20);
    await act(async () => button(view).props.onClick());
    assert.match(output(view), /list shown here is incomplete/);
    assert.equal(view.root.findAllByType("li").length, 20);
    await act(async () => { button(view).props.onClick(); button(view).props.onClick(); });
    assert.equal(calls, 2);
    assert.equal(button(view).props.disabled, true);
    const oldest = withdrawal("9007199254740993");
    await act(async () => pending.resolve({ items: [initial[19]!, oldest, oldest], nextCursor: null }));
    assert.equal(view.root.findAllByType("li").length, 21);
    assert.match(output(view), /Synthetic withdrawal 9007199254740993/);
    assert.equal(view.root.findAllByType("button").length, 0);
    assert.doesNotMatch(output(view), /incomplete/);
  } finally { act(() => view.unmount()); }
});

test("case refresh discards older withdrawal pages and ignores an outstanding response", async () => {
  const pending = deferred<WithdrawalPage>();
  let view!: ReactTestRenderer;
  const render = (key: string, id: string) => <WithdrawalHistory key={key} reference="LPP-2026-COR001" entries={[withdrawal(id)]} cursor={cursor} loadPage={() => pending.promise} />;
  await act(async () => { view = create(render("initial", "111")); });
  try {
    await act(async () => button(view).props.onClick());
    await act(async () => view.update(render("refreshed", "222")));
    await act(async () => pending.resolve({ items: [withdrawal("333")], nextCursor: null }));
    assert.match(output(view), /Synthetic withdrawal 222/);
    assert.doesNotMatch(output(view), /Synthetic withdrawal (111|333)/);
  } finally { act(() => view.unmount()); }
});

test("missing continuation metadata warns instead of presenting a truncated list as complete", async () => {
  let view!: ReactTestRenderer;
  await act(async () => { view = create(<WithdrawalHistory reference="LPP-2026-COR001" entries={[withdrawal("1")]} cursor={undefined} />); });
  try { assert.match(output(view), /Older withdrawals could not be checked/); }
  finally { act(() => view.unmount()); }
});

const raw = { id: "9007199254740993", channel: "phone", source: "operator", reason: "Synthetic oldest withdrawal", recorded_by: "reviewer@example.test", created_at: cursor.at };
test("withdrawal decoder preserves exact IDs and timestamps and calls the audited RPC", async () => {
  const value = await readWithdrawals({ rpc: async (name, params) => {
    assert.equal(name, "get_case_marketing_revocations");
    assert.deepEqual(params, { p_reference: "LPP-2026-COR001", p_before_at: cursor.at, p_before_id: cursor.id });
    return { error: null, data: { entries: [raw], next_cursor: { created_at: cursor.at, id: cursor.id } } };
  } }, "LPP-2026-COR001", cursor);
  assert.equal(value.items[0]!.id, raw.id);
  assert.deepEqual(value.nextCursor, cursor);
  assert.equal(initialWithdrawals({ revocations: [raw], revocations_cursor: null }).revocationsCursor, null);
  assert.equal(initialWithdrawals({ revocations: [{ ...raw, id: 1 }] }).revocationsCursor, undefined);
});

test("failed or malformed withdrawal responses never establish completeness", async () => {
  for (const data of [null, {}, { entries: [] }, { entries: [{}], next_cursor: null }, { entries: [{ ...raw, id: 9007199254740994 }], next_cursor: null }, { entries: [], next_cursor: { created_at: cursor.at, id: "0" } }]) {
    await assert.rejects(readWithdrawals({ rpc: async () => ({ data, error: null }) }, "LPP-2026-COR001", cursor));
  }
  await assert.rejects(readWithdrawals({ rpc: async () => ({ data: { entries: [], next_cursor: null }, error: new Error("offline") }) }, "LPP-2026-COR001", cursor));
});

test("latest phone evidence is decoded independently of the email-only page; old metadata stays unknown", () => {
  const value=initialWithdrawals({revocations:[{...raw,channel:'email'}],revocations_cursor:null,latest_phone_revocation:raw});
  assert.equal(value.marketingRevocations[0]?.channel,'email');
  assert.equal(value.latestPhoneRevocation?.channel,'phone');
  assert.equal(value.latestPhoneRevocation?.id,raw.id);
  assert.equal(initialWithdrawals({revocations:[]}).latestPhoneRevocation,undefined);
  assert.equal(initialWithdrawals({revocations:[],revocations_cursor:null,latest_phone_revocation:null}).latestPhoneRevocation,null);
  const legacy=initialWithdrawals({revocations:[{channel:'phone',reason:'Synthetic',source:'operator',recorded_by:'reviewer@example.test',created_at:cursor.at}]});
  assert.equal(legacy.marketingRevocations[0]?.id,undefined);
  assert.equal(legacy.revocationsCursor,undefined);
});
test("malformed current phone evidence never establishes permission or history completeness",()=>{
  for(const latest of [{...raw,channel:'email'},{...raw,id:9007199254740994},{...raw,created_at:''},{}]) {
    assert.throws(()=>initialWithdrawals({revocations:[],revocations_cursor:null,latest_phone_revocation:latest}));
  }
  assert.throws(()=>initialWithdrawals({revocations:[{...raw,channel:'unsupported'}]}));
});
