import test from "node:test";
import assert from "node:assert/strict";
import {
  act,
  create,
  type ReactTestRenderer,
  type ReactTestInstance,
} from "react-test-renderer";
import { CorrectionEditor } from "./CorrectionEditor";
const output = (view: ReactTestRenderer) => JSON.stringify(view.toJSON());
function textOf(node: ReactTestInstance): string {
  return node.children
    .map((child) => (typeof child === "string" ? child : textOf(child)))
    .join("");
}
function button(view: ReactTestRenderer, label: string) {
  const node = view.root
    .findAllByType("button")
    .find((n) => textOf(n).includes(label));
  assert.ok(node, label);
  return node;
}
async function open(view: ReactTestRenderer, text = "Synthetic correction") {
  await act(async () => button(view, "Record a correction").props.onClick());
  await act(async () =>
    view.root
      .findByType("textarea")
      .props.onChange({ target: { value: text } }),
  );
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
test("lost acknowledgement retains the request ID across retry/cancel/reopen and then clears the form", async () => {
  const calls: Array<[string, string, string]> = [];
  let refresh = 0;
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <CorrectionEditor
        reference="LPP-2026-COR001"
        onRefresh={() => {
          refresh++;
        }}
        save={async (...args) => {
          calls.push(args);
          if (calls.length === 1) throw new Error("Save outcome uncertain");
        }}
      />,
    );
  });
  try {
    await open(view);
    await act(async () => button(view, "Save correction").props.onClick());
    assert.match(output(view), /Save outcome uncertain/);
    assert.equal(
      view.root.findByType("textarea").props.value,
      "Synthetic correction",
    );
    await act(async () => button(view, "Cancel").props.onClick());
    await act(async () => button(view, "Record a correction").props.onClick());
    await act(async () => button(view, "Save correction").props.onClick());
    assert.deepEqual(calls[1], calls[0]);
    assert.equal(refresh, 1);
    assert.match(output(view), /Correction saved/);
    assert.equal(view.root.findAllByType("textarea").length, 0);
    await open(view);
    await act(async () => button(view, "Save correction").props.onClick());
    assert.notEqual(calls[2]![2], calls[0]![2]);
  } finally {
    act(() => view.unmount());
  }
});
test("double clicks, edits and cancellation during a pending save cannot alter its captured payload", async () => {
  const wait = deferred();
  const calls: Array<[string, string, string]> = [];
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <CorrectionEditor
        reference="LPP-2026-COR001"
        onRefresh={() => {}}
        save={async (...args) => {
          calls.push(args);
          await wait.promise;
        }}
      />,
    );
  });
  try {
    await open(view);
    await act(async () => {
      const click = button(view, "Save correction").props.onClick;
      click();
      click();
    });
    assert.equal(calls.length, 1);
    assert.equal(view.root.findByType("textarea").props.disabled, true);
    assert.equal(button(view, "Cancel").props.disabled, true);
    await act(async () =>
      view.root
        .findByType("textarea")
        .props.onChange({ target: { value: "Changed in flight" } }),
    );
    assert.equal(
      view.root.findByType("textarea").props.value,
      "Synthetic correction",
    );
    await act(async () => wait.resolve());
    assert.equal(calls[0]![1], "Synthetic correction");
  } finally {
    act(() => view.unmount());
  }
});
test("a refresh error after a confirmed save cannot be reported as a failed save", async () => {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <CorrectionEditor
        reference="LPP-2026-COR001"
        save={async () => {}}
        onRefresh={async () => {
          throw new Error("refresh offline");
        }}
      />,
    );
  });
  try {
    await open(view);
    await act(async () => button(view, "Save correction").props.onClick());
    assert.match(
      output(view),
      /Correction saved, but the history could not be refreshed/,
    );
    assert.equal(view.root.findAllByProps({ role: "alert" }).length, 0);
    assert.equal(view.root.findAllByType("textarea").length, 0);
  } finally {
    act(() => view.unmount());
  }
});
test("changed text gets a new request and leaving the case ignores a late completion", async () => {
  const calls: Array<[string, string, string]> = [];
  const wait = deferred();
  let refresh = 0;
  let view!: ReactTestRenderer;
  const save = async (...args: [string, string, string]) => {
    calls.push(args);
    if (calls.length === 1) throw new Error("uncertain");
    await wait.promise;
  };
  await act(async () => {
    view = create(
      <CorrectionEditor
        reference="LPP-2026-COR001"
        save={save}
        onRefresh={() => {
          refresh++;
        }}
      />,
    );
  });
  await open(view);
  await act(async () => button(view, "Save correction").props.onClick());
  await act(async () =>
    view.root
      .findByType("textarea")
      .props.onChange({ target: { value: "Another correction" } }),
  );
  await act(async () => button(view, "Save correction").props.onClick());
  assert.notEqual(calls[0]![2], calls[1]![2]);
  act(() => view.unmount());
  await act(async () => wait.resolve());
  assert.equal(refresh, 0);
});
