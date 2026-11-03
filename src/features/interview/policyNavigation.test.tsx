import test from "node:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import {
  MemoryRouter,
  Outlet,
  Route,
  Routes,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

async function fixture(send: IntakeSender, run: (f: Context) => Promise<void>) {
  let session!: IntakeSession;
  let location!: ReturnType<typeof useLocation>;
  let navigate!: ReturnType<typeof useNavigate>;
  function Observer() {
    location = useLocation();
    navigate = useNavigate();
    return null;
  }
  function Probe() {
    session = useIntakeSession();
    return null;
  }
  function Scope() {
    return (
      <IntakeSessionProvider send={send}>
        <Probe />
        <Outlet />
      </IntakeSessionProvider>
    );
  }
  let view!: ReactTestRenderer;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  if (!originalWindow)
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { scrollTo() {} },
    });
  await act(async () => {
    view = create(
      <MemoryRouter initialEntries={["/start"]}>
        <Observer />
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<p>Outside questionnaire</p>} />
            <Route element={<Scope />}>
              <Route path="start" element={<p>Intake</p>} />
              <Route path="privacy" element={<ResumeInterview />} />
              <Route path="messaging-terms" element={<ResumeInterview />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  });
  try {
    await run({
      read: () => session,
      location: () => location,
      navigate: async (path) => {
        if (typeof path === "number") await navigate(path);
        else await navigate(path);
      },
      chromeStart: async (kind) => {
        const label =
          kind === "header" ? "Start the interview" : "Start a review request";
        const link = view.root
          .findAllByType(Link)
          .find((x) => x.props.children === label)!;
        await act(async () =>
          navigate(link.props.to, { state: link.props.state }),
        );
      },
      resume: async () => {
        const link = view.root.findByType(ResumeInterview).findByType(Link);
        await act(async () =>
          navigate(link.props.to, { state: link.props.state }),
        );
      },
    });
  } finally {
    await act(async () => view.unmount());
    if (!originalWindow) Reflect.deleteProperty(globalThis, "window");
  }
}
import assert from "node:assert/strict";
import { IntakeSessionProvider, type IntakeSender } from "./IntakeSession";
import { useIntakeSession, type IntakeSession } from "./intakeSessionContext";
import { ResumeInterview } from "../../components/site/ResumeInterview";
import { SiteLayout } from "../../components/site/SiteChrome";
import { isIntakeSessionPath } from "./intakeSessionScope";
import type { SubmissionReceipt } from "./types";

const receipt: SubmissionReceipt = {
  reference: "LPP-2026-POLICY1",
  submittedAt: "2026-01-01T00:00:00Z",
  status: "submitted",
  notification: {
    state: "queued",
    attempts: 0,
    updatedAt: "2026-01-01T00:00:00Z",
  },
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
interface Context {
  read: () => IntakeSession;
  navigate: (path: string | number) => Promise<void>;
  resume: () => Promise<void>;
  chromeStart: (kind: "header" | "footer") => Promise<void>;
  location: () => { pathname: string; state: unknown };
}
async function seed(read: () => IntakeSession, reviewed = false) {
  await act(async () => {
    const interview = read().interview;
    for (const [field, value] of Object.entries({
      firstName: "Synthetic",
      lastName: "Policy",
      state: "TX",
      dateOfBirth: "1980-01-01",
      email: "policy@example.invalid",
    }))
      interview.setLeadField(field as "firstName", value);
    interview.setAdultAttested(true);
    interview.setConsent("privacyAcknowledged", true);
    interview.setConsent("intakePermission", true);
  });
  await act(async () => read().interview.givePermission());
  await act(async () => {
    read().interview.setAnswer("MED-01", {
      value: "yes",
      details: { what: "Synthetic medical detail" },
    });
    read().interview.goToQuestion("MED-01");
  });
  if (reviewed) {
    await act(async () => read().interview.finishInterview());
    await act(async () => read().interview.confirmReview(true));
    assert.ok(read().interview.draft);
  }
}

test("policy visits retain the medical answer, current question, lead and consent evidence in memory", async () => {
  await fixture(
    async () => receipt,
    async (f) => {
      await seed(f.read);
      const answers = structuredClone(f.read().interview.answers);
      const lead = structuredClone(f.read().interview.lead);
      const consent = structuredClone(f.read().interview.consent);
      const key = f.read().interview.submissionKey;
      await act(async () => f.navigate("/privacy"));
      await act(async () => f.navigate("/messaging-terms"));
      await f.resume();
      assert.equal(f.location().pathname, "/start");
      assert.equal(f.read().interview.step, "interview");
      assert.equal(f.read().interview.currentQuestionId, "MED-01");
      assert.deepEqual(f.read().interview.answers, answers);
      assert.deepEqual(f.read().interview.lead, lead);
      assert.deepEqual(f.read().interview.consent, consent);
      assert.equal(f.read().interview.submissionKey, key);
      assert.ok(
        !JSON.stringify(f.location().state).match(
          /Synthetic|1980|policy@example|answers|timestamps/,
        ),
      );
    },
  );
});

test("a confirmed review resumes with identical retry evidence", async () => {
  await fixture(
    async () => receipt,
    async (f) => {
      await seed(f.read, true);
      const draft = structuredClone(f.read().interview.draft);
      const key = f.read().interview.submissionKey;
      await act(async () => f.navigate("/privacy"));
      await f.resume();
      assert.equal(f.read().interview.step, "review");
      assert.deepEqual(f.read().interview.draft, draft);
      assert.equal(f.read().interview.submissionKey, key);
    },
  );
});

test("leaving the route scope clears private state before a new start", async () => {
  await fixture(
    async () => receipt,
    async (f) => {
      await seed(f.read);
      const key = f.read().interview.submissionKey;
      await act(async () => f.navigate("/privacy"));
      await act(async () => f.navigate("/"));
      await act(async () => f.navigate("/start"));
      assert.equal(f.read().interview.step, "lead");
      assert.equal(f.read().interview.lead.firstName, undefined);
      assert.deepEqual(f.read().interview.answers, {});
      assert.equal(f.read().interview.consent.intakePermission, false);
      assert.notEqual(f.read().interview.submissionKey, key);
    },
  );
});

test("pending submission survives policy navigation, stays single-flight, and returns its receipt without leaving the policy page", async () => {
  const pending = deferred<SubmissionReceipt>();
  let calls = 0;
  await fixture(
    async () => {
      calls++;
      return pending.promise;
    },
    async (f) => {
      await seed(f.read, true);
      let request!: Promise<void>;
      await act(async () => {
        request = f.read().submit();
      });
      assert.equal(f.read().submitting, true);
      await act(async () => f.navigate("/privacy"));
      await act(async () => f.read().submit());
      assert.equal(calls, 1);
      await act(async () => {
        pending.resolve(receipt);
        await request;
      });
      assert.equal(f.location().pathname, "/privacy");
      assert.equal(f.read().submitting, false);
      await f.resume();
      assert.equal(f.read().interview.step, "submitted");
      assert.deepEqual(f.read().interview.receipt, receipt);
    },
  );
});

test("a failed submission while reading policy preserves its error, payload and key for retry", async () => {
  const pending = deferred<SubmissionReceipt>();
  const requests: { draft: unknown; key: string }[] = [];
  await fixture(
    async (draft, key) => {
      requests.push({ draft: structuredClone(draft), key });
      return requests.length === 1 ? pending.promise : receipt;
    },
    async (f) => {
      await seed(f.read, true);
      let request!: Promise<void>;
      await act(async () => {
        request = f.read().submit();
      });
      await act(async () => f.navigate("/privacy"));
      await act(async () => {
        pending.reject(new Error("Synthetic provider unavailable"));
        await request;
      });
      assert.equal(f.read().error, "Synthetic provider unavailable");
      await f.resume();
      assert.equal(f.read().error, "Synthetic provider unavailable");
      await act(async () => f.read().submit());
      assert.equal(requests.length, 2);
      assert.deepEqual(requests[1], requests[0]);
      assert.equal(f.read().interview.step, "submitted");
    },
  );
});

test("a late submission response after leaving the scope cannot navigate or restore discarded state", async () => {
  const pending = deferred<SubmissionReceipt>();
  await fixture(
    async () => pending.promise,
    async (f) => {
      await seed(f.read, true);
      let request!: Promise<void>;
      await act(async () => {
        request = f.read().submit();
      });
      await act(async () => f.navigate("/"));
      await act(async () => {
        pending.resolve(receipt);
        await request;
      });
      assert.equal(f.location().pathname, "/");
      await act(async () => f.navigate("/start"));
      assert.equal(f.read().interview.receipt, null);
      assert.equal(f.read().interview.step, "lead");
      assert.deepEqual(f.read().interview.answers, {});
    },
  );
});

test("Start over while in the shared scope invalidates the previous resume state", async () => {
  await fixture(
    async () => receipt,
    async (f) => {
      await seed(f.read, true);
      const key = f.read().interview.submissionKey;
      await act(async () => f.navigate("/privacy"));
      await act(async () => f.read().interview.startOver());
      await f.resume();
      assert.equal(f.read().interview.step, "lead");
      assert.deepEqual(f.read().interview.answers, {});
      assert.equal(f.read().interview.draft, null);
      assert.notEqual(f.read().interview.submissionKey, key);
    },
  );
});

test("the memory scope excludes home, reviewers, opt-out and lookalike paths", () => {
  for (const base of ["", "/tools/pre-underwriting"]) {
    for (const suffix of [
      "/start",
      "/privacy",
      "/messaging-terms",
      "/privacy/",
    ])
      assert.equal(isIntakeSessionPath(base + suffix, base), true);
    for (const suffix of [
      "",
      "/",
      "/portal",
      "/reviewer",
      "/marketing-opt-out",
      "/start/other",
      "/privacy-policy",
    ])
      assert.equal(isIntakeSessionPath(base + suffix, base), false);
  }
});

test("Back during a pending submission never exposes a mutable earlier snapshot", async () => {
  const pending = deferred<SubmissionReceipt>();
  const requests: { draft: unknown; key: string }[] = [];
  await fixture(
    async (draft, key) => {
      requests.push({ draft: structuredClone(draft), key });
      return pending.promise;
    },
    async (f) => {
      await seed(f.read, true);
      const original = structuredClone(f.read().interview.draft);
      const key = f.read().interview.submissionKey;
      const stale = f.read().interview;
      let request!: Promise<void>;
      await act(async () => {
        request = f.read().submit();
        // Handlers captured before React rerenders must also observe the live lock.
        stale.setLeadField("firstName", "Dropped edit");
        stale.setAnswer("MED-01", { value: "no" });
        stale.setAdultAttested(false);
        stale.setConsent("intakePermission", false);
        stale.confirmReview(false);
        stale.markSubmitted({ ...receipt, reference: "LPP-2026-STALE1" });
        stale.startOver();
      });
      await act(async () => f.navigate(-1));
      assert.equal(f.read().submitting, true);
      assert.equal(f.read().interview.step, "review");
      assert.equal(f.read().interview.submissionKey, key);
      assert.deepEqual(f.read().interview.draft, original);
      await act(async () => {
        f.read().interview.backToLead();
        f.read().interview.goToQuestion("MED-01");
        f.read().interview.previousQuestion();
        f.read().interview.nextQuestion();
        f.read().interview.finishInterview();
        f.read().interview.begin();
        f.read().interview.givePermission();
      });
      assert.equal(f.read().interview.step, "review");
      assert.deepEqual(f.read().interview.draft, original);
      await act(async () => {
        await f.read().submit();
      });
      assert.equal(requests.length, 1);
      await act(async () => {
        pending.resolve(receipt);
        await request;
      });
      assert.equal(f.read().interview.step, "submitted");
      assert.deepEqual(f.read().interview.receipt, receipt);
      assert.deepEqual(requests[0], { draft: original, key });
      await act(async () => f.read().submit());
      assert.equal(
        requests.length,
        1,
        "a completed receipt cannot be resubmitted",
      );
      await act(async () => f.read().interview.startOver());
      assert.equal(f.read().interview.step, "lead");
      assert.notEqual(f.read().interview.submissionKey, key);
    },
  );
});

test("a failed request after browser Back restores review with identical retry evidence and unlocks editing", async () => {
  const pending = deferred<SubmissionReceipt>();
  const requests: { draft: unknown; key: string }[] = [];
  await fixture(
    async (draft, key) => {
      requests.push({ draft: structuredClone(draft), key });
      return requests.length === 1 ? pending.promise : receipt;
    },
    async (f) => {
      await seed(f.read, true);
      let request!: Promise<void>;
      await act(async () => {
        request = f.read().submit();
      });
      await act(async () => f.navigate(-1));
      await act(async () => {
        pending.reject(new Error("Synthetic uncertain response"));
        await request;
      });
      assert.equal(f.read().submitting, false);
      assert.equal(f.read().interview.step, "review");
      assert.equal(f.read().error, "Synthetic uncertain response");
      await act(async () => f.read().submit());
      assert.deepEqual(requests[1], requests[0]);
    },
  );
});

test("failed submission releases the edit lock without changing its operation key", async () => {
  const pending = deferred<SubmissionReceipt>();
  await fixture(
    async () => pending.promise,
    async (f) => {
      await seed(f.read, true);
      const key = f.read().interview.submissionKey;
      let request!: Promise<void>;
      await act(async () => {
        request = f.read().submit();
      });
      await act(async () => {
        pending.reject(new Error("Synthetic uncertain response"));
        await request;
      });
      await act(async () =>
        f
          .read()
          .interview.setLeadField("firstName", "Corrected after response"),
      );
      assert.equal(
        f.read().interview.lead.firstName,
        "Corrected after response",
      );
      assert.equal(f.read().interview.acknowledgements.length, 0);
      assert.equal(f.read().interview.submissionKey, key);
    },
  );
});

for (const policy of ["/privacy", "/messaging-terms"]) {
  for (const kind of ["header", "footer"] as const) {
    test(`${kind} start from ${policy} resumes the same question and replaces only screen metadata`, async () => {
      await fixture(
        async () => receipt,
        async (f) => {
          await seed(f.read);
          const before = f.read().interview;
          const answers = structuredClone(before.answers),
            lead = structuredClone(before.lead),
            consent = structuredClone(before.consent),
            key = before.submissionKey;
          await act(async () => f.navigate(policy));
          await f.chromeStart(kind);
          assert.equal(f.read().interview.step, "interview");
          assert.equal(f.read().interview.currentQuestionId, "MED-01");
          assert.deepEqual(f.read().interview.answers, answers);
          assert.deepEqual(f.read().interview.lead, lead);
          assert.deepEqual(f.read().interview.consent, consent);
          assert.equal(f.read().interview.submissionKey, key);
          const state = f.location().state as {
            lppIntake: { session: string; step: string };
          };
          assert.deepEqual(Object.keys(state.lppIntake).sort(), [
            "session",
            "step",
          ]);
          assert.equal(state.lppIntake.step, "interview");
          assert.ok(
            !JSON.stringify(state).match(
              /Synthetic|1980|example.invalid|answers|submissionKey/,
            ),
          );
        },
      );
    });
  }
}
test("header return retains reviewed payload and retry acknowledgement", async () => {
  await fixture(
    async () => receipt,
    async (f) => {
      await seed(f.read, true);
      const draft = structuredClone(f.read().interview.draft),
        key = f.read().interview.submissionKey;
      await act(async () => f.navigate("/privacy"));
      await f.chromeStart("header");
      assert.equal(f.read().interview.step, "review");
      assert.deepEqual(f.read().interview.draft, draft);
      assert.equal(f.read().interview.submissionKey, key);
    },
  );
});
test("unmarked form navigation without a policy visit still returns to lead", async () => {
  await fixture(
    async () => receipt,
    async (f) => {
      await seed(f.read);
      await act(async () => f.navigate("/start"));
      assert.equal(f.read().interview.step, "lead");
    },
  );
});
test("header return after policy Start over cannot revive the previous interview", async () => {
  await fixture(
    async () => receipt,
    async (f) => {
      await seed(f.read, true);
      await act(async () => f.navigate("/privacy"));
      await act(async () => f.read().interview.startOver());
      await f.chromeStart("header");
      assert.equal(f.read().interview.step, "lead");
      assert.deepEqual(f.read().interview.answers, {});
      assert.equal(f.read().interview.draft, null);
    },
  );
});
test("header policy return retains lead validation and permission gates", async () => {
  await fixture(
    async () => receipt,
    async (f) => {
      await seed(f.read, true);
      await act(async () => f.navigate("/privacy"));
      await act(async () =>
        f.read().interview.setLeadField("email", "invalid"),
      );
      await f.chromeStart("header");
      assert.equal(f.read().interview.step, "lead");
      assert.equal(f.read().interview.draft, null);
    },
  );
});
test("header return after a pending policy-page receipt cannot submit twice", async () => {
  const pending = deferred<SubmissionReceipt>();
  let calls = 0;
  await fixture(
    async () => {
      calls++;
      return pending.promise;
    },
    async (f) => {
      await seed(f.read, true);
      let op!: Promise<void>;
      await act(async () => {
        op = f.read().submit();
      });
      await act(async () => f.navigate("/privacy"));
      await act(async () => {
        pending.resolve(receipt);
        await op;
      });
      await f.chromeStart("header");
      assert.equal(f.read().interview.step, "submitted");
      assert.deepEqual(f.read().interview.receipt, receipt);
      await act(async () => f.read().submit());
      assert.equal(calls, 1);
    },
  );
});

test("browser Back to the original unmarked lead entry keeps its original meaning", async () => {
  await fixture(
    async () => receipt,
    async (f) => {
      await seed(f.read);
      await act(async () => f.navigate("/privacy"));
      await act(async () => f.navigate(-2));
      assert.equal(f.location().pathname, "/start");
      assert.equal(f.read().interview.step, "lead");
      assert.equal(f.read().interview.lead.firstName, "Synthetic");
    },
  );
});
