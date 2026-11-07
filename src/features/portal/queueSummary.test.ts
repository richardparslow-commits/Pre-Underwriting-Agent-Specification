import test from "node:test";
import assert from "node:assert/strict";
import { queueCountPending } from "./queueSummary";

test("the queue header reports loading instead of an unavailable count", () => {
  const summary = queueCountPending(true);

  assert.equal(summary, "loading cases…");
  assert.doesNotMatch(summary, /unavailable/i);
});

test("a failed first load reports an unavailable count, never zero cases", () => {
  const summary = queueCountPending(false);

  assert.equal(summary, "case count unavailable");
  assert.doesNotMatch(summary, /0 cases/i);
});
