import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useCaseQueue } from "./useCaseQueue";
import type { CasePage } from "@/lib/api";

const page = (start: number, count = 25, nextCursor: string | null = `c${start + count - 1}`): CasePage => ({
  items: Array.from({ length: count }, (_, i) => ({ reference: `LPP-2026-Q${String(start + i).padStart(5, "0")}`, submittedAt: "2026-01-01T00:00:00Z", status: "submitted", notificationState: "queued", crisisDisclosure: false, firstName: "Synthetic", lastName: "Case", residenceState: "TX", unanswered: 0 })), total: 75, nextCursor,
});
const refs = (value: ReturnType<typeof useCaseQueue>) => value.cases?.map(item => item.reference);
const expected = (start: number, count = 25) => page(start, count).items.map(item => item.reference);
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
async function queue(
  loader: (cursor?: string) => Promise<CasePage>,
  run: (read: () => ReturnType<typeof useCaseQueue>, update: (active: boolean, identity?: string) => Promise<void>) => Promise<void>,
  active = true,
) {
  let result!: ReturnType<typeof useCaseQueue>;
  function Harness({ enabled, identity }: { enabled: boolean; identity: string }) { result = useCaseQueue(enabled, loader, identity); return null; }
  let mounted!: ReactTestRenderer;
  await act(async () => { mounted = create(<Harness enabled={active} identity="reviewer-a" />); });
  try { await run(() => result, async (enabled, identity = "reviewer-a") => { await act(async () => mounted.update(<Harness enabled={enabled} identity={identity} />)); }); }
  finally { await act(async () => mounted.unmount()); }
}

test("refresh and paging never combine old page three with a fresh first page", () => {
  let heads = 0;
  const pending = deferred<CasePage>();
  const calls: (string | undefined)[] = [];
  return queue(async cursor => {
    calls.push(cursor);
    if (!cursor) return ++heads === 1 ? page(1) : pending.promise;
    return cursor === "c25" ? page(26) : page(51, 25, null);
  }, async read => {
    await act(async () => read().load("c25"));
    assert.deepEqual(refs(read()), expected(1, 50));
    await act(async () => { void read().load(); void read().load("c50"); });
    assert.equal(read().loading, true);
    assert.deepEqual(calls, [undefined, "c25", undefined]);
    await act(async () => pending.resolve(page(1)));
    await act(async () => read().load("c25"));
    assert.deepEqual(refs(read()), expected(1, 50));
  });
});

test("synchronous double activation is bounded and overlapping rows appear once", () => {
  const pending = deferred<CasePage>(); let calls = 0;
  return queue(async cursor => { calls++; return cursor ? pending.promise : page(1); }, async read => {
    await act(async () => { void read().load("c25"); void read().load("c25"); });
    assert.equal(calls, 2);
    assert.equal(read().loadingMore, true);
    await act(async () => pending.resolve({ ...page(26), items: [page(25, 1).items[0]!, ...page(26).items] }));
    assert.deepEqual(refs(read()), expected(1, 50));
  });
});

test("failed refresh retains known rows/cursor and a fresh retry can recover", () => {
  let heads = 0;
  return queue(async () => { if (++heads === 2) throw new Error("Synthetic offline"); return heads === 1 ? page(1) : page(100, 1, null); }, async read => {
    await act(async () => read().load());
    assert.deepEqual(refs(read()), expected(1));
    assert.equal(read().nextCursor, "c25");
    assert.equal(read().error, "Synthetic offline");
    assert.equal(read().loading, false);
    await act(async () => read().load());
    assert.deepEqual(refs(read()), expected(100, 1));
    assert.equal(read().error, null);
  });
});

test("a cursor captured before refresh cannot append after the refresh completes", () => {
  const calls: (string | undefined)[] = [];
  return queue(async cursor => { calls.push(cursor); return cursor ? page(26) : page(1); }, async read => {
    await act(async () => read().load("c25"));
    const oldCursor = read().nextCursor!;
    await act(async () => read().load());
    await act(async () => read().load(oldCursor));
    assert.deepEqual(calls, [undefined, "c25", undefined]);
    assert.deepEqual(refs(read()), expected(1));
    assert.equal(read().nextCursor, "c25");
  });
});

test("obsolete failures cannot clear a new session's loading state or replace its error", () => {
  const old = deferred<CasePage>(); const next = deferred<CasePage>(); let heads = 0;
  return queue(async cursor => cursor ? old.promise : (++heads === 1 ? page(1) : next.promise), async (read, update) => {
    await act(async () => { void read().load("c25"); });
    await update(true, "reviewer-b");
    assert.equal(read().cases, null);
    assert.equal(read().loading, true);
    await act(async () => old.reject(new Error("Obsolete failure")));
    assert.equal(read().loading, true);
    assert.equal(read().error, null);
    await act(async () => next.resolve({ ...page(100, 1, null), total: 1 }));
    assert.deepEqual(refs(read()), expected(100, 1));
    assert.equal(read().total, 1);
  });
});

test("inactive sessions load nothing and late responses cannot restore their rows", () => {
  const pending = deferred<CasePage>(); let calls = 0;
  return queue(async () => { calls++; return pending.promise; }, async (read, update) => {
    assert.equal(calls, 0);
    await update(true);
    const oldLoad = read().load;
    assert.equal(calls, 1);
    await update(false);
    await act(async () => oldLoad());
    assert.equal(calls, 1);
    await act(async () => pending.resolve(page(1)));
    assert.equal(read().cases, null);
    assert.equal(read().loading, false);
  }, false);
});
