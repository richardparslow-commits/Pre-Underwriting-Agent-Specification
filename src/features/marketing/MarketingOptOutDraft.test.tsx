import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import MarketingOptOutPage from "@/pages/MarketingOptOutPage";
import { MarketingOptOutDraftProvider } from "./MarketingOptOutDraft";

function NavigationButton({
  id,
  to,
  children,
}: {
  id: string;
  to: string;
  children: string;
}) {
  const navigate = useNavigate();
  return (
    <button id={id} type="button" onClick={() => navigate(to)}>
      {children}
    </button>
  );
}

async function mount() {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <MemoryRouter initialEntries={["/marketing-opt-out"]}>
        <MarketingOptOutDraftProvider>
          <Routes>
            <Route
              path="/marketing-opt-out"
              element={
                <>
                  <MarketingOptOutPage />
                  <NavigationButton id="open-privacy" to="/privacy">
                    Privacy
                  </NavigationButton>
                </>
              }
            />
            <Route
              path="/privacy"
              element={
                <>
                  <h1>Privacy practices</h1>
                  <NavigationButton id="back-to-form" to="/marketing-opt-out">
                    Back
                  </NavigationButton>
                </>
              }
            />
          </Routes>
        </MarketingOptOutDraftProvider>
      </MemoryRouter>,
    );
  });
  return view;
}

function input(view: ReactTestRenderer, id: string) {
  const field = view.root
    .findAllByType("input")
    .find((node) => node.props.id === id);
  assert.ok(field, `missing input ${id}`);
  return field;
}

function textarea(view: ReactTestRenderer) {
  return view.root.findByType("textarea");
}

function button(view: ReactTestRenderer, id: string) {
  const control = view.root
    .findAllByType("button")
    .find((node) => node.props.id === id);
  assert.ok(control, `missing button ${id}`);
  return control;
}

test("a filled stop request survives visiting and returning from privacy", async () => {
  const view = await mount();
  try {
    await act(async () => {
      input(view, "reference").props.onChange({
        target: { value: "lpp-2026-abc123" },
      });
      input(view, "email").props.onChange({
        target: { value: "case@example.invalid" },
      });
      input(view, "phone").props.onChange({
        target: { value: "5125550134" },
      });
      textarea(view).props.onChange({
        target: { value: "Please stop marketing." },
      });
    });

    assert.equal(input(view, "reference").props.value, "LPP-2026-ABC123");

    await act(async () => button(view, "open-privacy").props.onClick());
    assert.ok(
      view.root
        .findAllByType("h1")
        .some((heading) => heading.props.children === "Privacy practices"),
    );

    await act(async () => button(view, "back-to-form").props.onClick());
    assert.equal(input(view, "reference").props.value, "LPP-2026-ABC123");
    assert.equal(input(view, "email").props.value, "case@example.invalid");
    assert.equal(input(view, "phone").props.value, "5125550134");
    assert.equal(textarea(view).props.value, "Please stop marketing.");
  } finally {
    await act(async () => view.unmount());
  }
});
