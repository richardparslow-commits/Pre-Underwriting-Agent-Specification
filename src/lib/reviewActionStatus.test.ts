import test from "node:test";
import assert from "node:assert/strict";
import { getCase, listCases, recordReview } from "./api";

test("preview mode refuses a decision taken on a stale case status", async () => {
  const page = await listCases();
  const reference = page.items[0]?.reference;
  assert.ok(reference, "preview mode exposes a seeded case");
  const before = await getCase(reference);
  assert.ok(before, "the seeded case can be loaded");
  const staleStatus = before.status === "submitted" ? "needs_clarification" : "submitted";

  await assert.rejects(
    () => recordReview(reference, "marked_reviewed", undefined, staleStatus),
    /changed since you opened/,
  );

  const unchanged = await getCase(reference);
  assert.equal(unchanged?.status, before.status);
  assert.equal(unchanged?.reviewLog.length, before.reviewLog.length);

  await recordReview(reference, "marked_reviewed", undefined, before.status);
  assert.equal((await getCase(reference))?.status, "reviewed");
});
