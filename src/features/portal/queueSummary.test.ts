import test from "node:test";
import assert from "node:assert/strict";
import { queueCountSummary } from "./queueSummary";

test("the queue header reports loading instead of an unavailable count", () => {
  const summary = queueCountSummary({
    total: null,
    displayed: 0,
    loading: true,
  });

  assert.equal(summary, "loading cases…");
  assert.doesNotMatch(summary, /unavailable/i);
});

test("a failed first load reports an unavailable count, never zero cases", () => {
  const summary = queueCountSummary({
    total: null,
    displayed: 0,
    loading: false,
  });

  assert.equal(summary, "case count unavailable");
  assert.doesNotMatch(summary, /0 cases/i);
});

test("a loaded queue reports the displayed and total counts", () => {
  assert.equal(
    queueCountSummary({ total: 75, displayed: 25, loading: false }),
    "showing 25 of 75 cases",
  );
  assert.equal(
    queueCountSummary({ total: 1, displayed: 1, loading: true }),
    "showing 1 of 1 case",
  );
});
