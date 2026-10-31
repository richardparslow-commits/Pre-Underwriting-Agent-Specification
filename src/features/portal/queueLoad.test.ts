import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { CaseListItem, CasePage } from "@/lib/api";
import { runQueueLoad } from "./queueLoad";

function page(start: number, count: number, nextCursor: string | null): CasePage {
  return {
    items: Array.from({ length: count }, (_, index) => ({ reference: `case-${start + index}` }) as CaseListItem),
    total: 75,
    nextCursor,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

test("refresh blocks an old load-more cursor until the new first page arrives", async () => {
  const busy = { current: false };
  const refresh = deferred<CasePage>();
  const requests: Array<string | undefined> = [];
  let cases = page(1, 50, "after-50").items;
  let cursor: string | null = "after-50";
  const fetchPage = (value?: string) => {
    requests.push(value);
    return value ? Promise.resolve(page(26, 25, "after-50")) : refresh.promise;
  };
  const callbacks = {
    started: () => {},
    received: (result: CasePage, appending: boolean) => {
      cases = appending ? [...cases, ...result.items] : result.items;
      cursor = result.nextCursor;
    },
    failed: (error: unknown) => { throw error; },
    finished: () => {},
  };

  const pending = runQueueLoad(busy, fetchPage, callbacks);
  await runQueueLoad(busy, fetchPage, callbacks, "after-50");
  assert.deepEqual(requests, [undefined]);
  refresh.resolve(page(1, 25, "after-25"));
  await pending;
  await runQueueLoad(busy, fetchPage, callbacks, cursor ?? undefined);
  assert.deepEqual(requests, [undefined, "after-25"]);
  assert.deepEqual(cases.map((item) => item.reference), page(1, 50, null).items.map((item) => item.reference));
});

test("a pending append blocks refresh and duplicate appends, and failures release the lock", async () => {
  const busy = { current: false };
  const pendingPage = deferred<CasePage>();
  let calls = 0;
  let failures = 0;
  let finished = 0;
  const fetchPage = () => { calls++; return pendingPage.promise; };
  const callbacks = {
    started: () => {},
    received: () => {},
    failed: () => { failures++; },
    finished: () => { finished++; },
  };
  const pending = runQueueLoad(busy, fetchPage, callbacks, "after-25");
  await runQueueLoad(busy, fetchPage, callbacks);
  await runQueueLoad(busy, fetchPage, callbacks, "after-25");
  assert.equal(calls, 1);
  pendingPage.reject(new Error("network failure"));
  await pending;
  assert.equal(failures, 1);
  assert.equal(finished, 1);
  assert.equal(busy.current, false);
  await runQueueLoad(busy, () => Promise.resolve(page(1, 25, null)), callbacks);
  assert.equal(finished, 2);
});

test("queue controls disable both refresh and load more while either request is pending", () => {
  const source = readFileSync(new URL("../../pages/PortalPage.tsx", import.meta.url), "utf8");
  assert.match(source, /onClick=\{\(\) => void load\(\)\} disabled=\{loading \|\| loadingMore\}/);
  assert.match(source, /onClick=\{\(\) => void load\(nextCursor\)\}\s+disabled=\{loading \|\| loadingMore\}/);
  assert.match(source, /runQueueLoad\(queueBusy, listCases/);
});
