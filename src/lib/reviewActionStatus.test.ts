import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getCase, listCases, recordReview } from "./api";

test("preview mode refuses stale decisions and replays the same review request", async () => {
  const page = await listCases();
  const reference = page.items[0]?.reference;
  assert.ok(reference, "preview mode exposes a seeded case");
  const before = await getCase(reference);
  assert.ok(before, "the seeded case can be loaded");
  const staleStatus = before.status === "submitted" ? "needs_clarification" : "submitted";

  await assert.rejects(
    () => recordReview(reference, "marked_reviewed", randomUUID(), undefined, staleStatus),
    /changed since you opened/,
  );

  const unchanged = await getCase(reference);
  assert.equal(unchanged?.status, before.status);
  assert.equal(unchanged?.reviewLog.length, before.reviewLog.length);

  const requestId = randomUUID();
  await recordReview(reference, "marked_reviewed", requestId, undefined, before.status);
  const after = await getCase(reference);
  assert.equal(after?.status, "reviewed");

  await recordReview(reference, "marked_reviewed", requestId, undefined, before.status);
  const replayed = await getCase(reference);
  assert.equal(replayed?.status, "reviewed");
  assert.equal(replayed?.reviewLog.length, after?.reviewLog.length);
  assert.equal(replayed?.reviewRevision, after?.reviewRevision);

  await assert.rejects(
    () => recordReview(reference, "requested_clarification", requestId, "Different decision"),
    /already used for a different decision/,
  );
});
