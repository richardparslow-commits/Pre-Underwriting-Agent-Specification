import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { StaticRouter } from "react-router-dom";
import { SafetyDisclosures } from "./SafetyDisclosures";
import type {
  SafetyCursor,
  SafetyDisclosure,
  SafetyPage,
} from "@/lib/reviewerVisibility";

const row = (n: number): SafetyDisclosure => ({
  reference: `LPP-2026-S${String(n).padStart(5, "0")}`,
  submittedAt: "2026-01-01T00:00:00Z",
  status: "submitted",
});
const original = Array.from({ length: 35 }, (_, n) => row(n));
const newest = {
  ...row(999),
  reference: "LPP-2026-NEW001",
  submittedAt: "2026-10-31T12:00:00Z",
};
const cursor: SafetyCursor = {
  submittedAt: original[24]!.submittedAt,
  reference: original[24]!.reference,
};
const page = (
  items: SafetyDisclosure[],
  total: number,
  nextCursor: SafetyCursor | null = null,
): SafetyPage => ({ items, total, nextCursor });
const output = (view: ReactTestRenderer) => JSON.stringify(view.toJSON());
const references = (view: ReactTestRenderer) =>
  view.root.findAllByType("a").map((node) => node.props.href);
function button(view: ReactTestRenderer, text: string) {
  const found = view.root.findAllByType("button").find((node) =>
    node.children.join("") === text
  );
  assert.ok(found, text);
  return found;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const render = (
  loadPage: (before?: SafetyCursor) => Promise<SafetyPage>,
  refreshKey = 0,
) => (
  <StaticRouter location="/portal">
    <SafetyDisclosures refreshKey={refreshKey} loadPage={loadPage} />
  </StaticRouter>
);

test("a new disclosure counted while paging remains reachable from the safety panel after the older cursor ends", async () => {
  const calls: Array<SafetyCursor | undefined> = [];
  const loadPage = async (before?: SafetyCursor) => {
    calls.push(before);
    if (calls.length === 1) return page(original.slice(0, 25), 35, cursor);
    if (calls.length === 2) return page(original.slice(25), 36);
    if (calls.length === 3) {
      return page([newest, ...original.slice(0, 24)], 36, {
        ...cursor,
        reference: original[23]!.reference,
      });
    }
    return page(original.slice(24), 36);
  };
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(render(loadPage));
  });
  try {
    await act(async () =>
      button(view, "Load older safety disclosures").props.onClick()
    );
    assert.equal(references(view).length, 35);
    assert.ok(!references(view).includes("/portal/LPP-2026-NEW001"));
    assert.match(output(view), /Some references may be missing/);
    await act(async () =>
      button(view, "Refresh safety disclosures").props.onClick()
    );
    assert.equal(
      calls[2],
      undefined,
      "refresh must read the head, never reuse the exhausted older cursor",
    );
    assert.ok(references(view).includes("/portal/LPP-2026-NEW001"));
    assert.doesNotMatch(output(view), /Some references may be missing/);
    await act(async () =>
      button(view, "Load older safety disclosures").props.onClick()
    );
    assert.equal(references(view).length, 36);
    assert.equal(new Set(references(view)).size, 36);
    assert.equal(
      view.root.findAllByType("button").filter((node) =>
        node.children.join("") === "Load older safety disclosures"
      ).length,
      0,
    );
    assert.equal(
      button(view, "Refresh safety disclosures").props.disabled,
      false,
    );
    assert.equal(calls.length, 4, "no automatic refetch loop");
  } finally {
    act(() => view.unmount());
  }
});

test("failed head refresh retains known disclosures, the warning and a working retry", async () => {
  let calls = 0;
  const loadPage = async () => {
    if (++calls === 1) return page(original.slice(0, 25), 35, cursor);
    if (calls === 2) return page(original.slice(25), 36);
    if (calls === 3) throw new Error("offline");
    return page([newest], 1);
  };
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(render(loadPage));
  });
  try {
    await act(async () =>
      button(view, "Load older safety disclosures").props.onClick()
    );
    await act(async () =>
      button(view, "Refresh safety disclosures").props.onClick()
    );
    assert.equal(references(view).length, 35);
    assert.match(output(view), /could not be checked/);
    assert.match(output(view), /Some references may be missing/);
    await act(async () =>
      button(view, "Refresh safety disclosures").props.onClick()
    );
    assert.deepEqual(references(view), ["/portal/LPP-2026-NEW001"]);
    assert.doesNotMatch(
      output(view),
      /could not be checked|Some references may be missing/,
    );
  } finally {
    act(() => view.unmount());
  }
});

test("head refresh is bounded and deduplicated while known references remain visible", async () => {
  const pending = deferred<SafetyPage>();
  let calls = 0;
  const loadPage = async () =>
    ++calls === 1 ? page(original.slice(0, 25), 35, cursor) : pending.promise;
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(render(loadPage));
  });
  try {
    const refresh = button(view, "Refresh safety disclosures");
    await act(async () => {
      refresh.props.onClick();
      refresh.props.onClick();
    });
    assert.equal(calls, 2);
    assert.equal(references(view).length, 25);
    assert.equal(
      button(view, "Refreshing safety disclosures…").props.disabled,
      true,
    );
    await act(async () =>
      button(view, "Load older safety disclosures").props.onClick()
    );
    assert.equal(calls, 2, "an older page cannot race the fresh-head request");
    await act(async () => pending.resolve(page([newest], 1)));
    assert.deepEqual(references(view), ["/portal/LPP-2026-NEW001"]);
  } finally {
    act(() => view.unmount());
  }
});

test("a newer queue refresh invalidates an outstanding manual head refresh", async () => {
  const pending = deferred<SafetyPage>();
  let calls = 0;
  const loadPage = async () => {
    if (++calls === 1) return page([row(1)], 1);
    if (calls === 2) return pending.promise;
    return page([newest], 1);
  };
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(render(loadPage));
  });
  try {
    await act(async () =>
      button(view, "Refresh safety disclosures").props.onClick()
    );
    await act(async () => view.update(render(loadPage, 1)));
    await act(async () => pending.resolve(page([row(2)], 1)));
    assert.deepEqual(references(view), ["/portal/LPP-2026-NEW001"]);
  } finally {
    act(() => view.unmount());
  }
});

test("an exhausted cursor with missing references warns even if the count is unchanged", async () => {
  let calls = 0;
  const loadPage = async () =>
    ++calls === 1 ? page(original.slice(0, 25), 35, cursor) : page([], 35);
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(render(loadPage));
  });
  try {
    await act(async () =>
      button(view, "Load older safety disclosures").props.onClick()
    );
    assert.match(output(view), /Some references may be missing/);
    assert.equal(
      button(view, "Refresh safety disclosures").props.disabled,
      false,
    );
  } finally {
    act(() => view.unmount());
  }
});

test("a shrinking count never claims zero while stale references remain; successful refresh can establish zero", async () => {
  let calls = 0;
  const loadPage = async () =>
    ++calls === 1 ? page(original.slice(0, 25), 35, cursor) : page([], 0);
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(render(loadPage));
  });
  try {
    await act(async () =>
      button(view, "Load older safety disclosures").props.onClick()
    );
    assert.equal(references(view).length, 25);
    assert.match(output(view), /Some references may be missing/);
    assert.doesNotMatch(
      output(view),
      /No recorded safety disclosures|of 0 disclosure references/,
    );
    await act(async () =>
      button(view, "Refresh safety disclosures").props.onClick()
    );
    assert.equal(references(view).length, 0);
    assert.match(output(view), /No recorded safety disclosures/);
  } finally {
    act(() => view.unmount());
  }
});
