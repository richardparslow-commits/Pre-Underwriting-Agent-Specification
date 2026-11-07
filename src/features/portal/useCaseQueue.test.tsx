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

test("a successful refresh clears a stale pager error", () => {
  return queue(async cursor => {
    if (cursor) throw new Error("Synthetic paging failure");
    return page(1);
  }, async read => {
    assert.deepEqual(refs(read()), expected(1));
    await act(async () => read().load("c25"));
    assert.equal(read().appendError, "Synthetic paging failure");

    await act(async () => read().load());
    assert.equal(read().appendError, null);
    assert.equal(read().error, null);
    assert.deepEqual(refs(read()), expected(1));
  });
});

test("a successful append clears a stale refresh error", () => {
  let heads = 0;
  return queue(async cursor => {
    if (cursor) return page(26);
    heads++;
    if (heads === 2) throw new Error("Synthetic refresh failure");
    return page(1);
  }, async read => {
    await act(async () => read().load());
    assert.equal(read().error, "Synthetic refresh failure");

    await act(async () => read().load("c25"));
    assert.equal(read().error, null);
    assert.equal(read().appendError, null);
    assert.deepEqual(refs(read()), expected(1, 50));
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

const headOf = (start: number) => `${page(start,1).items[0]!.submittedAt}|${page(start,1).items[0]!.reference}`;
const snapshot = (start: number, total: number, next: string | null, head = headOf(1)) => ({...page(start,25,next),total,headCursor:head});
test('a new head case during paging signals change and refresh replaces the old walk',()=>{
  let heads=0;
  return queue(async cursor=>cursor ? snapshot(26,51,null,headOf(100)) : ++heads===1 ? snapshot(1,50,'c25') : snapshot(100,51,'c124',headOf(100)),async read=>{
    assert.equal(read().queueChanged,false);
    await act(async()=>read().load('c25'));
    assert.equal(read().queueChanged,true);
    assert.equal(read().total,51);
    assert.equal(read().nextCursor,null);
    assert.deepEqual(refs(read()),expected(1,50));
    await act(async()=>read().load());
    assert.equal(read().queueChanged,false);
    assert.deepEqual(refs(read()),expected(100));
  });
});
test('an insertion balanced by deletion still signals a changed head and warning stays through paging/failure',()=>{
  let heads=0;
  return queue(async cursor=>{
    if(!cursor) {if(++heads===2) throw new Error('Synthetic offline');return snapshot(1,75,'c25');}
    return snapshot(cursor==='c25'?26:51,75,cursor==='c25'?'c50':null,cursor==='c25'?headOf(100):headOf(1));
  },async read=>{
    await act(async()=>read().load('c25'));
    assert.equal(read().queueChanged,true);
    await act(async()=>read().load('c50'));
    assert.equal(read().queueChanged,true,'same total and full row count do not erase a known changed head');
    await act(async()=>read().load());
    assert.equal(read().queueChanged,true,'failed refresh cannot claim reconciliation');
    assert.deepEqual(refs(read()),expected(1,75));
  });
});
test('a final count/list disagreement also warns when head metadata is unavailable',()=>queue(async cursor=>cursor?{...page(26,25,null),total:51}:{...page(1),total:50},async read=>{
  await act(async()=>read().load('c25'));
  assert.equal(read().queueChanged,true);
}));
test('a head changing between the first page and its metadata response warns immediately',()=>queue(async()=>snapshot(1,50,'c25',headOf(100)),async read=>{
  assert.equal(read().queueChanged,true);
}));
test('session changes reset the queue-change warning with the rows',()=>{
  let heads=0;
  return queue(async cursor=>cursor?snapshot(26,51,null,headOf(100)):++heads===1?snapshot(1,50,'c25'):snapshot(100,25,null,headOf(100)),async(read,update)=>{
    await act(async()=>read().load('c25'));
    assert.equal(read().queueChanged,true);
    await update(true,'reviewer-b');
    assert.equal(read().queueChanged,false);
    assert.deepEqual(refs(read()),expected(100));
  });
});
