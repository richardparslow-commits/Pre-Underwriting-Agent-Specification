import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useInterview, type InterviewHook } from "./useInterview";
import { useRouterIntakeHistory } from "./useRouterIntakeHistory";

async function fixture(run: (context: {
  read: () => InterviewHook;
  location: () => ReturnType<typeof useLocation>;
  navigate: ReturnType<typeof useNavigate>;
}) => Promise<void>) {
  let state!: InterviewHook;
  let location!: ReturnType<typeof useLocation>;
  let navigate!: ReturnType<typeof useNavigate>;
  function Observer() { location = useLocation(); navigate = useNavigate(); return null; }
  function Intake() { const navigation = useRouterIntakeHistory(); state = useInterview(navigation); return null; }
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(<MemoryRouter initialEntries={["/", { pathname: "/start", search: "?from=tool", hash: "#intake", state: { retained: "router context" } }]} initialIndex={1}>
      <Observer />
      <Routes><Route path="/" element={<p>Home</p>} /><Route path="/start" element={<Intake />} /></Routes>
    </MemoryRouter>);
  });
  try { await run({ read: () => state, location: () => location, navigate }); }
  finally { await act(async () => view.unmount()); }
}

test("React Router Back/Forward remains on intake and retains entered contact fields", async () => {
  await fixture(async ({ read, location, navigate }) => {
    await act(async () => {
      read().setLeadField("firstName", "Synthetic");
      read().setLeadField("email", "history@example.invalid");
      read().setConsent("privacyAcknowledged", true);
    });
    const key = read().submissionKey;
    await act(async () => read().begin());
    assert.equal(read().step, "permission");
    assert.deepEqual(Object.keys(location().state.lppIntake).sort(), ["session", "step"]);
    assert.equal(location().state.retained, "router context");
    assert.equal(location().search, "?from=tool");
    assert.equal(location().hash, "#intake");
    for (let turn = 0; turn < 3; turn++) {
      await act(async () => navigate(-1));
      assert.equal(location().pathname, "/start");
      assert.equal(read().step, "lead");
      assert.equal(read().lead.firstName, "Synthetic");
      assert.equal(read().consent.privacyAcknowledged, true);
      await act(async () => navigate(1));
      assert.equal(read().step, "permission");
      assert.equal(read().submissionKey, key);
    }
  });
});

test("React Router steps preserve private answers across review Back/Forward", async () => {
  await fixture(async ({ read, navigate, location }) => {
    await act(async () => read().begin());
    await act(async () => read().setConsent("intakePermission", true));
    await act(async () => read().givePermission());
    await act(async () => read().setAnswer("ID-02", { value: "Synthetic private answer" }));
    const answers = structuredClone(read().answers);
    await act(async () => read().finishInterview());
    assert.equal(read().step, "review");
    assert.ok(!JSON.stringify(location().state).includes("Synthetic private answer"));
    await act(async () => navigate(-1));
    assert.equal(read().step, "interview");
    assert.deepEqual(read().answers, answers);
    await act(async () => navigate(1));
    assert.equal(read().step, "review");
    assert.deepEqual(read().answers, answers);
  });
});
