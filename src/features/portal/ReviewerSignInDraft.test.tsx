import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { SignInCard } from "@/pages/PortalPage";
import { ReviewerSignInDraftProvider } from "./ReviewerSignInDraft";

const auth = {
  requestLink: async () => {},
  linkSent: false,
  error: null,
  leaveError: null,
} as unknown as Parameters<typeof SignInCard>[0]["auth"];

function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <>
      <h1>Privacy practices</h1>
      <button
        id="back-to-sign-in"
        type="button"
        onClick={() => navigate(-1)}
      >
        Back
      </button>
    </>
  );
}

function PortalRoute() {
  return (
    <>
      <Link to="/privacy">Privacy practices</Link>
      <SignInCard auth={auth} />
    </>
  );
}

test("a typed sign-in email survives opening Privacy practices and going back", async () => {
  const email = "someone.reviewer@sandbox.test";
  let view!: ReactTestRenderer;

  await act(async () => {
    view = create(
      <MemoryRouter initialEntries={["/portal"]}>
        <ReviewerSignInDraftProvider>
          <Routes>
            <Route path="/portal" element={<PortalRoute />} />
            <Route path="/privacy" element={<PrivacyPage />} />
          </Routes>
        </ReviewerSignInDraftProvider>
      </MemoryRouter>,
    );
  });

  try {
    const input = view.root.findByProps({ id: "reviewer-email" });
    await act(async () => {
      input.props.onChange({ target: { value: email } });
    });

    const privacyLink = view.root
      .findAllByType("a")
      .find((link) => link.props.href === "/privacy");
    assert.ok(privacyLink, "missing Privacy practices link");
    await act(async () => {
      privacyLink.props.onClick({ button: 0, preventDefault() {} });
    });
    assert.ok(
      view.root
        .findAllByType("h1")
        .some((heading) => heading.children.join("") === "Privacy practices"),
    );

    await act(async () => {
      view.root.findByProps({ id: "back-to-sign-in" }).props.onClick();
    });
    assert.equal(
      view.root.findByProps({ id: "reviewer-email" }).props.value,
      email,
    );
  } finally {
    await act(async () => view.unmount());
  }
});
