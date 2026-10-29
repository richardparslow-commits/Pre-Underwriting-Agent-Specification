import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { StaticRouter } from "react-router-dom";
import { ReviewHistory } from "./ReviewHistory";
import { SafetyDisclosures } from "./SafetyDisclosures";
import {
  initialReviewHistory,
  readReviewHistory,
  readSafetyDisclosures,
  type ReviewHistoryPage,
  type SafetyPage,
} from "@/lib/reviewerVisibility";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const output = (view: ReactTestRenderer) => JSON.stringify(view.toJSON());
function button(view: ReactTestRenderer, label: string) {
  const found = view.root.findAllByType("button").find((node) =>
    node.children.join("") === label
  );
  assert.ok(found, label);
  return found;
}
function safetyPage(total = 1, from = 0, count = 1, more = false): SafetyPage {
  return {
    total,
    items: Array.from({ length: count }, (_, index) => ({
      reference: `LPP-2026-S${String(from + index).padStart(5, "0")}`,
      submittedAt: "2025-01-01T00:00:00Z",
      status: "submitted" as const,
    })),
    nextCursor: more
      ? {
        submittedAt: "2025-01-01T00:00:00Z",
        reference: `LPP-2026-S${String(from + count - 1).padStart(5, "0")}`,
      }
      : null,
  };
}
const entry = {
  id: "9007199254741000",
  action: "opened" as const,
  actor: "reviewer@example.test",
  at: "2026-10-01T00:00:00Z",
};
const cursor = { at: "2026-10-01T00:00:00.000001Z", id: "9007199254740999" };

test("older clarification loads on demand without losing initial history; retries remain available", async () => {
  const pending = deferred<ReviewHistoryPage>();
  let calls = 0;
  const loadPage = async (reference: string, before: typeof cursor) => {
    assert.equal(reference, "LPP-2026-HIST01");
    assert.deepEqual(before, cursor);
    calls++;
    if (calls === 1) throw new Error("offline");
    return pending.promise;
  };
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <ReviewHistory
        reference="LPP-2026-HIST01"
        entries={[entry]}
        cursor={cursor}
        loadPage={loadPage}
      />,
    );
  });
  try {
    await act(async () =>
      button(view, "Load older review history").props.onClick()
    );
    assert.match(output(view), /could not be loaded/);
    assert.match(output(view), /reviewer@example.test/);
    await act(async () => {
      button(view, "Load older review history").props.onClick();
      button(view, "Load older review history").props.onClick();
    });
    assert.equal(
      calls,
      2,
      "double activation must not start another page request",
    );
    assert.equal(button(view, "Loading older history…").props.disabled, true);
    await act(async () =>
      pending.resolve({
        items: [entry, {
          ...entry,
          id: "9007199254740998",
          action: "requested_clarification",
          note: "Synthetic older clarification",
        }],
        nextCursor: null,
      })
    );
    assert.match(output(view), /Synthetic older clarification/);
    assert.equal(
      view.root.findAllByType("li").length,
      2,
      "overlapping pages must not duplicate history",
    );
    assert.equal(view.root.findAllByType("button").length, 0);
  } finally {
    act(() => view.unmount());
  }
});

test("a refreshed case replaces older pages and ignores an outstanding response from its prior history", async () => {
  const pending = deferred<ReviewHistoryPage>();
  let view!: ReactTestRenderer;
  const render = (key: string, note: string) => (
    <ReviewHistory
      key={key}
      reference="LPP-2026-HIST01"
      entries={[{ ...entry, note }]}
      cursor={cursor}
      loadPage={() => pending.promise}
    />
  );
  await act(async () => {
    view = create(render("initial-open", "Initial note"));
  });
  try {
    await act(async () =>
      button(view, "Load older review history").props.onClick()
    );
    await act(async () =>
      view.update(render("refreshed-open", "Refreshed note"))
    );
    await act(async () =>
      pending.resolve({
        items: [{ ...entry, note: "Stale response" }],
        nextCursor: null,
      })
    );
    assert.match(output(view), /Refreshed note/);
    assert.doesNotMatch(output(view), /Stale response/);
  } finally {
    act(() => view.unmount());
  }
});

test("missing history completeness metadata warns instead of implying the truncated list is complete", async () => {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <ReviewHistory
        reference="LPP-2026-HIST01"
        entries={[entry]}
        cursor={undefined}
      />,
    );
  });
  try {
    assert.match(output(view), /Older review history could not be checked/);
  } finally {
    act(() => view.unmount());
  }
});

test("queue-wide safety count and direct older-case links appear independently of normal queue rows", async () => {
  let calls = 0;
  const pending = deferred<SafetyPage>();
  const first = safetyPage(35, 0, 25, true);
  const loadPage = async (before?: SafetyPage["nextCursor"]) => {
    calls++;
    if (calls === 1) {
      assert.equal(before, undefined);
      return first;
    }
    assert.deepEqual(before, first.nextCursor);
    return pending.promise;
  };
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <StaticRouter location="/portal">
        <SafetyDisclosures refreshKey={0} loadPage={loadPage} />
      </StaticRouter>,
    );
  });
  try {
    assert.match(output(view), /35/);
    assert.match(output(view), /Showing /);
    assert.equal(view.root.findAllByType("a").length, 25);
    assert.equal(
      view.root.findAllByType("a")[0]?.props.href,
      "/portal/LPP-2026-S00000",
    );
    await act(async () => {
      button(view, "Load older safety disclosures").props.onClick();
      button(view, "Load older safety disclosures").props.onClick();
    });
    assert.equal(calls, 2);
    await act(async () => pending.resolve(safetyPage(35, 25, 10)));
    assert.equal(view.root.findAllByType("a").length, 35);
    assert.equal(view.root.findAllByType("button").length, 0);
    assert.match(output(view), /does not monitor emergencies/);
  } finally {
    act(() => view.unmount());
  }
});

test("failed initial safety check never looks like zero disclosures, and retry can establish zero", async () => {
  let calls = 0;
  const loadPage = async () => {
    if (++calls === 1) throw new Error("database unavailable");
    return safetyPage(0, 0, 0);
  };
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <StaticRouter location="/portal">
        <SafetyDisclosures refreshKey={0} loadPage={loadPage} />
      </StaticRouter>,
    );
  });
  try {
    assert.match(output(view), /could not be checked/);
    assert.doesNotMatch(output(view), /No recorded safety disclosures/);
    await act(async () => button(view, "Retry safety check").props.onClick());
    assert.match(
      output(view),
      /No recorded safety disclosures were found across the queue at the last check/,
    );
  } finally {
    act(() => view.unmount());
  }
});

test("refresh ignores a late safety response and checks again without depending on queue pagination", async () => {
  const pending = deferred<SafetyPage>();
  let calls = 0;
  const loadPage = async () => ++calls === 1 ? pending.promise : safetyPage();
  const render = (key: number) => (
    <StaticRouter location="/portal">
      <SafetyDisclosures refreshKey={key} loadPage={loadPage} />
    </StaticRouter>
  );
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(render(0));
  });
  try {
    assert.match(output(view), /Checking safety disclosures/);
    await act(async () => view.update(render(1)));
    assert.equal(view.root.findAllByType("a").length, 1);
    await act(async () => pending.resolve(safetyPage(0, 0, 0)));
    assert.equal(view.root.findAllByType("a").length, 1);
    assert.doesNotMatch(output(view), /No recorded safety disclosures/);
    assert.equal(calls, 2);
  } finally {
    act(() => view.unmount());
  }
});

test("a failed older safety page retains known flags and a working retry cursor", async () => {
  let calls = 0;
  const loadPage = async () => {
    calls++;
    if (calls === 1) return safetyPage(26, 0, 25, true);
    if (calls === 2) throw new Error("offline");
    return safetyPage(26, 25, 1);
  };
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <StaticRouter location="/portal">
        <SafetyDisclosures refreshKey={0} loadPage={loadPage} />
      </StaticRouter>,
    );
  });
  try {
    await act(async () =>
      button(view, "Load older safety disclosures").props.onClick()
    );
    assert.equal(view.root.findAllByType("a").length, 25);
    assert.match(output(view), /list below is incomplete/);
    await act(async () =>
      button(view, "Load older safety disclosures").props.onClick()
    );
    assert.equal(view.root.findAllByType("a").length, 26);
  } finally {
    act(() => view.unmount());
  }
});

test("history transport preserves bigint IDs and microseconds in its next-page RPC", async () => {
  const page = await readReviewHistory(
    {
      rpc: async (name, args) => {
        assert.equal(name, "get_case_review_history");
        assert.deepEqual(args, {
          p_reference: "LPP-2026-HIST01",
          p_before_at: cursor.at,
          p_before_id: cursor.id,
        });
        return {
          data: {
            entries: [{
              id: cursor.id,
              action: "requested_clarification",
              actor: entry.actor,
              created_at: cursor.at,
              note: "Synthetic note",
            }],
            next_cursor: null,
          },
          error: null,
        };
      },
    },
    "LPP-2026-HIST01",
    cursor,
  );
  assert.equal(page.items[0]?.id, cursor.id);
  assert.equal(page.items[0]?.at, cursor.at);
});

test("safety transport passes only its own cursor and maps reference-only data", async () => {
  const page = await readSafetyDisclosures({
    rpc: async (name, args) => {
      assert.equal(name, "get_queue_safety_disclosures");
      assert.deepEqual(args, { p_before_at: null, p_before_reference: null });
      return {
        data: {
          total: 35,
          entries: [{
            reference: "LPP-2026-S00001",
            submitted_at: "2025-01-01",
            status: "reviewed",
          }],
          next_cursor: {
            submitted_at: "2025-01-01",
            reference: "LPP-2026-S00001",
          },
        },
        error: null,
      };
    },
  });
  assert.equal(page.total, 35);
  assert.equal(page.items[0]?.status, "reviewed");
  assert.deepEqual(page.nextCursor, {
    submittedAt: "2025-01-01",
    reference: "LPP-2026-S00001",
  });
});

test("missing, malformed and failed safety responses never silently become zero", async () => {
  for (
    const response of [{ data: null, error: null }, {
      data: { entries: [], total: null, next_cursor: null },
      error: null,
    }, {
      data: { entries: [], total: 0, next_cursor: null },
      error: { message: "Not authorised" },
    }]
  ) {
    await assert.rejects(
      readSafetyDisclosures({ rpc: async () => response }),
      /could not be checked/,
    );
  }
});

test("initial audited case response preserves the history continuation; older deployments remain explicitly unknown", () => {
  const raw = {
    id: entry.id,
    action: entry.action,
    actor: entry.actor,
    created_at: entry.at,
    note: null,
  };
  const current = initialReviewHistory({
    review_log: [raw],
    review_log_cursor: { created_at: cursor.at, id: cursor.id },
  });
  assert.deepEqual(current.reviewHistoryCursor, cursor);
  assert.equal(current.reviewLog[0]?.id, entry.id);
  const legacy = initialReviewHistory({
    review_log: [{ ...raw, id: undefined }],
  });
  assert.equal(legacy.reviewHistoryCursor, undefined);
  assert.equal(legacy.reviewLog[0]?.id, undefined);
  assert.equal(
    initialReviewHistory({ review_log: [], review_log_cursor: null })
      .reviewHistoryCursor,
    null,
  );
});

test("refresh also discards an older safety page that was already in flight", async () => {
  let calls = 0;
  const pending = deferred<SafetyPage>();
  const loadPage = async () => {
    if (++calls === 1) return safetyPage(26, 0, 25, true);
    if (calls === 2) return pending.promise;
    return safetyPage(1, 50, 1);
  };
  const render = (key: number) => (
    <StaticRouter location="/portal">
      <SafetyDisclosures refreshKey={key} loadPage={loadPage} />
    </StaticRouter>
  );
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(render(0));
  });
  try {
    await act(async () =>
      button(view, "Load older safety disclosures").props.onClick()
    );
    await act(async () => view.update(render(1)));
    await act(async () => pending.resolve(safetyPage(26, 25, 1)));
    assert.equal(view.root.findAllByType("a").length, 1);
    assert.equal(
      view.root.findAllByType("a")[0]?.props.href,
      "/portal/LPP-2026-S00050",
    );
  } finally {
    act(() => view.unmount());
  }
});
