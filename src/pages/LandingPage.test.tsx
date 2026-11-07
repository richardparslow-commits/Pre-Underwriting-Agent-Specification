import test from "node:test";
import assert from "node:assert/strict";
import {
  act,
  create,
  type ReactTestInstance,
  type ReactTestRenderer,
} from "react-test-renderer";
import { MemoryRouter } from "react-router-dom";
import { SiteLayout } from "@/components/site/SiteChrome";
import LandingPage from "./LandingPage";

function textContent(node: ReactTestInstance): string {
  return node.children
    .map((child) => (typeof child === "string" ? child : textContent(child)))
    .join(" ");
}

test("the landing accent badge uses the readable strong accent token", async () => {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
  });

  try {
    const badge = view.root
      .findAllByType("span")
      .find((node) => node.children.join("") === "Guided pre-underwriting");
    assert.ok(badge, "missing Guided pre-underwriting badge");
    assert.match(String(badge.props.className), /text-accent-strong/);
  } finally {
    await act(async () => view.unmount());
  }
});

test("the header wordmark link is named by the text it shows", async () => {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <MemoryRouter>
        <SiteLayout />
      </MemoryRouter>,
    );
  });

  try {
    const wordmark = view.root
      .findAllByType("a")
      .find((link) => link.props.href === "/");
    assert.ok(wordmark, "missing wordmark link");
    assert.equal(wordmark.props["aria-label"], undefined);
    const visibleText = textContent(wordmark);
    assert.match(visibleText, /Life Policy Pilot/);
    assert.match(visibleText, /Pre-underwriting review/);
  } finally {
    await act(async () => view.unmount());
  }
});
