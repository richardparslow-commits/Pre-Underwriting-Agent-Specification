import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { CorrectionHistory } from "./CorrectionHistory";
import { initialCorrections, readCorrections, type CorrectionPage } from "@/lib/correctionHistory";

const cursor = { at: "2026-01-01T00:00:00.000001Z", id: "9007199254740995" };
const correction = (id: string) => ({ id, detail: `Synthetic correction ${id}`, recordedBy: "reviewer@example.test", recordedAt: cursor.at });
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

test("oldest correction after the first 50 loads once, with retry and duplicate-request protection", async () => {
  const pending = deferred<CorrectionPage>();
  let calls = 0;
  const initial = Array.from({ length: 50 }, (_, i) => correction(String(9000 - i)));
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(<CorrectionHistory reference="LPP-2026-COR001" entries={initial} cursor={cursor} loadPage={async (reference, before) => {
      assert.equal(reference, "LPP-2026-COR001");
      assert.deepEqual(before, cursor);
      if (++calls === 1) throw new Error("offline");
      return pending.promise;
    }} />);
  });
  try {
    assert.equal(view.root.findAllByType("li").length, 50);
    await act(async () => button(view).props.onClick());
    assert.match(output(view), /list shown here is incomplete/);
    assert.equal(view.root.findAllByType("li").length, 50);
    await act(async () => { button(view).props.onClick(); button(view).props.onClick(); });
    assert.equal(calls, 2);
    assert.equal(button(view).props.disabled, true);
    const oldest = correction("9007199254740993");
    await act(async () => pending.resolve({ items: [initial[49]!, oldest, oldest], nextCursor: null }));
    assert.equal(view.root.findAllByType("li").length, 51);
    assert.match(output(view), /Synthetic correction 9007199254740993/);
    assert.equal(view.root.findAllByType("button").length, 0);
    assert.doesNotMatch(output(view), /incomplete/);
  } finally { act(() => view.unmount()); }
});

test("case refresh discards older correction pages and ignores an outstanding response", async () => {
  const pending = deferred<CorrectionPage>();
  let view!: ReactTestRenderer;
  const render = (key: string, id: string) => <CorrectionHistory key={key} reference="LPP-2026-COR001" entries={[correction(id)]} cursor={cursor} loadPage={() => pending.promise} />;
  await act(async () => { view = create(render("initial", "111")); });
  try {
    await act(async () => button(view).props.onClick());
    await act(async () => view.update(render("refreshed", "222")));
    await act(async () => pending.resolve({ items: [correction("333")], nextCursor: null }));
    assert.match(output(view), /Synthetic correction 222/);
    assert.doesNotMatch(output(view), /Synthetic correction (111|333)/);
  } finally { act(() => view.unmount()); }
});

test("missing continuation metadata warns instead of presenting a truncated list as complete", async () => {
  let view!: ReactTestRenderer;
  await act(async () => { view = create(<CorrectionHistory reference="LPP-2026-COR001" entries={[correction("1")]} cursor={undefined} />); });
  try { assert.match(output(view), /Older corrections could not be checked/); }
  finally { act(() => view.unmount()); }
});

const raw = { id: "9007199254740993", detail: "Synthetic oldest correction", recorded_by: "reviewer@example.test", created_at: cursor.at };
test("correction decoder preserves exact IDs and timestamps and calls the audited RPC", async () => {
  const value = await readCorrections({ rpc: async (name, params) => {
    assert.equal(name, "get_case_corrections");
    assert.deepEqual(params, { p_reference: "LPP-2026-COR001", p_before_at: cursor.at, p_before_id: cursor.id });
    return { error: null, data: { entries: [raw], next_cursor: { created_at: cursor.at, id: cursor.id } } };
  } }, "LPP-2026-COR001", cursor);
  assert.equal(value.items[0]!.id, raw.id);
  assert.deepEqual(value.nextCursor, cursor);
  assert.equal(initialCorrections({ corrections: [raw], corrections_cursor: null }).correctionsCursor, null);
  assert.equal(initialCorrections({ corrections: [{ ...raw, id: 1 }] }).correctionsCursor, undefined);
});

test("failed or malformed correction responses never establish completeness", async () => {
  for (const data of [null, {}, { entries: [] }, { entries: [{}], next_cursor: null }, { entries: [{ ...raw, id: 9007199254740994 }], next_cursor: null }, { entries: [], next_cursor: { created_at: cursor.at, id: "0" } }]) {
    await assert.rejects(readCorrections({ rpc: async () => ({ data, error: null }) }, "LPP-2026-COR001", cursor));
  }
  await assert.rejects(readCorrections({ rpc: async () => ({ data: { entries: [], next_cursor: null }, error: new Error("offline") }) }, "LPP-2026-COR001", cursor));
});
