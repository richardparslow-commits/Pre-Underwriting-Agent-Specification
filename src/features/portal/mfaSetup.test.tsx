import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useMfaSetup, type MfaFactor, type MfaSetupApi } from "./useMfaSetup";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const factor = (status = "unverified"): MfaFactor => ({
  id: "synthetic-factor",
  factor_type: "totp",
  status,
});
function backend(initial: MfaFactor[] = []) {
  const factors = [...initial];
  const calls = {
    lists: 0,
    enrolls: 0,
    challenges: [] as string[],
    verifies: [] as string[],
  };
  const api: MfaSetupApi = {
    async listFactors() {
      calls.lists++;
      return { data: { all: factors.map((f) => ({ ...f })) }, error: null };
    },
    async enroll() {
      calls.enrolls++;
      if (factors.length)
        return { data: null, error: { code: "too_many_enrolled_mfa_factors" } };
      factors.push(factor());
      return {
        data: {
          id: "synthetic-factor",
          totp: {
            qr_code: "<svg>synthetic</svg>",
            secret: "SYNTHETIC_SETUP_ONLY",
          },
        },
        error: null,
      };
    },
    async challenge({ factorId }) {
      calls.challenges.push(factorId);
      return { data: { id: "synthetic-challenge" }, error: null };
    },
    async verify({ factorId, code }) {
      calls.verifies.push(factorId);
      return {
        error:
          code === "123456"
            ? null
            : {
                code: "mfa_verification_failed",
                message: "Synthetic private provider detail",
              },
      };
    },
  };
  return { api, factors, calls };
}
async function fixture(
  api: MfaSetupApi | null,
  run: (f: {
    read: () => ReturnType<typeof useMfaSetup>;
    verified: () => number;
    unmount: () => Promise<void>;
  }) => Promise<void>,
) {
  let state!: ReturnType<typeof useMfaSetup>;
  let verifications = 0;
  function Harness() {
    state = useMfaSetup(api, () => {
      verifications++;
    });
    return null;
  }
  let view!: ReactTestRenderer;
  let mounted = true;
  const unmount = async () => {
    if (mounted) {
      mounted = false;
      await act(async () => view.unmount());
    }
  };
  await act(async () => {
    view = create(<Harness />);
  });
  try {
    await run({ read: () => state, verified: () => verifications, unmount });
  } finally {
    await unmount();
  }
}

test("a listed verified factor does not grant access until challenge and verify succeed", async () => {
  const { api, calls } = backend([factor("verified")]);
  await fixture(api, async ({ read, verified }) => {
    assert.equal(read().phase, "challenging");
    assert.equal(verified(), 0);
    assert.equal(calls.enrolls, 0);
    await act(async () => read().setCode("123456"));
    await act(async () => read().verify());
    assert.equal(verified(), 1);
    assert.equal(read().phase, "done");
    assert.deepEqual(calls.challenges, ["synthetic-factor"]);
    assert.deepEqual(calls.verifies, ["synthetic-factor"]);
    assert.equal(read().code, "");
  });
});

test("a pending setup is reused without enrollment or sharing its secret", async () => {
  const { api, calls } = backend([factor()]);
  await fixture(api, async ({ read, verified }) => {
    assert.equal(read().phase, "pending");
    assert.equal(read().secret, null);
    assert.equal(read().qrCode, null);
    assert.equal(calls.enrolls, 0);
    assert.equal(verified(), 0);
    await act(async () => read().setCode("123456"));
    await act(async () => read().verify());
    assert.equal(verified(), 1);
    assert.deepEqual(calls.verifies, ["synthetic-factor"]);
  });
});

test("fresh enrollment clears its secret and code after successful verification", async () => {
  const { api, calls } = backend();
  await fixture(api, async ({ read }) => {
    assert.equal(read().phase, "enrolling");
    assert.equal(read().secret, "SYNTHETIC_SETUP_ONLY");
    assert.equal(calls.enrolls, 1);
    await act(async () => read().setCode("123456"));
    await act(async () => read().verify());
    assert.equal(read().secret, null);
    assert.equal(read().qrCode, null);
    assert.equal(read().factorId, null);
    assert.equal(read().code, "");
  });
});

test("invalid code is rejected before any challenge or verification request", async () => {
  const { api, calls } = backend([factor()]);
  await fixture(api, async ({ read, verified }) => {
    await act(async () => read().setCode("12345"));
    await act(async () => read().verify());
    assert.match(read().error!, /six-digit/);
    assert.equal(calls.challenges.length, 0);
    assert.equal(calls.verifies.length, 0);
    assert.equal(verified(), 0);
  });
});

test("wrong code preserves pending setup and permits a fresh-code retry", async () => {
  const { api, calls } = backend([factor()]);
  await fixture(api, async ({ read, verified }) => {
    await act(async () => read().setCode("111111"));
    await act(async () => read().verify());
    assert.equal(read().phase, "pending");
    assert.equal(read().code, "");
    assert.match(read().error!, /code was not accepted/);
    assert.equal(verified(), 0);
    await act(async () => read().setCode("123456"));
    await act(async () => read().verify());
    assert.equal(verified(), 1);
    assert.equal(calls.enrolls, 0);
  });
});

test("unknown verification error clears stale setup and omits private provider details", async () => {
  const { api } = backend();
  api.verify = async () => ({
    error: {
      code: "mfa_factor_not_found",
      message: "Synthetic private provider detail",
    },
  });
  await fixture(api, async ({ read, verified }) => {
    await act(async () => read().setCode("123456"));
    await act(async () => read().verify());
    assert.equal(read().phase, "error");
    assert.match(read().error!, /setup could not be checked/);
    assert.ok(!read().error?.includes("private provider"));
    assert.equal(read().secret, null);
    assert.equal(read().factorId, null);
    assert.equal(verified(), 0);
  });
});

test("an unreadable factor list fails closed without creating a new factor", async () => {
  const { api, calls } = backend();
  api.listFactors = async () => ({
    data: null,
    error: { code: "network_error" },
  });
  await fixture(api, async ({ read, verified }) => {
    assert.equal(read().phase, "error");
    assert.equal(calls.enrolls, 0);
    assert.equal(verified(), 0);
  });
});

test("closing the gate during factor lookup cannot create a factor later", async () => {
  const { api, calls } = backend();
  const pending = deferred<{ data: { all: MfaFactor[] }; error: null }>();
  api.listFactors = () => pending.promise;
  await fixture(api, async ({ unmount, verified }) => {
    await unmount();
    await act(async () => pending.resolve({ data: { all: [] }, error: null }));
    assert.equal(calls.enrolls, 0);
    assert.equal(verified(), 0);
  });
});

test("closing the gate during challenge prevents a late verification request", async () => {
  const { api, calls } = backend([factor("verified")]);
  const pending = deferred<{ data: { id: string }; error: null }>();
  api.challenge = () => pending.promise;
  await fixture(api, async ({ read, unmount, verified }) => {
    await act(async () => read().setCode("123456"));
    let verifying!: Promise<void>;
    await act(async () => {
      verifying = read().verify();
    });
    await unmount();
    await act(async () => {
      pending.resolve({ data: { id: "synthetic-challenge" }, error: null });
      await verifying;
    });
    assert.equal(calls.verifies.length, 0);
    assert.equal(verified(), 0);
  });
});

test("two verification activations before rendering issue one request and one callback", async () => {
  const { api, calls } = backend([factor()]);
  await fixture(api, async ({ read, verified }) => {
    await act(async () => read().setCode("123456"));
    await act(async () => {
      await Promise.all([read().verify(), read().verify()]);
    });
    assert.equal(calls.challenges.length, 1);
    assert.equal(calls.verifies.length, 1);
    assert.equal(verified(), 1);
  });
});

test("rechecking observes a completed factor without granting access automatically", async () => {
  const { api, factors } = backend([factor()]);
  await fixture(api, async ({ read, verified }) => {
    factors[0]!.status = "verified";
    await act(async () => read().begin());
    assert.equal(read().phase, "challenging");
    assert.equal(verified(), 0);
    assert.equal(read().secret, null);
  });
});

test("missing connection fails closed", async () => {
  await fixture(null, async ({ read, verified }) => {
    assert.equal(read().phase, "error");
    assert.match(read().error!, /Sign-in is not configured/);
    assert.equal(verified(), 0);
  });
});

for (const operation of ["challenge", "verify"] as const) {
  for (const mode of ["response", "throw"] as const) {
    test(`temporary ${operation} ${mode} error preserves this tab's setup for a fresh-code retry`, async () => {
      const { api, calls } = backend();
      const original = api[operation];
      if (operation === "challenge")
        api.challenge = async () => {
          if (mode === "throw")
            throw new Error("Synthetic private provider detail");
          return {
            data: null,
            error: {
              code: "unexpected_failure",
              message: "Synthetic private provider detail",
            },
          };
        };
      else
        api.verify = async () => {
          if (mode === "throw")
            throw new Error("Synthetic private provider detail");
          return {
            error: {
              code: "unexpected_failure",
              message: "Synthetic private provider detail",
            },
          };
        };
      await fixture(api, async ({ read, verified }) => {
        const owned = {
          factorId: read().factorId,
          qrCode: read().qrCode,
          secret: read().secret,
        };
        await act(async () => read().setCode("123456"));
        await act(async () => read().verify());
        assert.equal(read().phase, "enrolling");
        assert.equal(read().code, "");
        assert.equal(read().busy, false);
        assert.deepEqual(
          {
            factorId: read().factorId,
            qrCode: read().qrCode,
            secret: read().secret,
          },
          owned,
        );
        assert.match(read().error!, /setup could not be checked/);
        assert.ok(!read().error?.includes("private provider"));
        assert.equal(verified(), 0);
        assert.equal(calls.enrolls, 1);
        if (operation === "challenge")
          api.challenge = original as MfaSetupApi["challenge"];
        else api.verify = original as MfaSetupApi["verify"];
        await act(async () => read().setCode("123456"));
        await act(async () => read().verify());
        assert.equal(verified(), 1);
        assert.equal(read().secret, null);
        assert.equal(calls.enrolls, 1);
      });
    });
  }
}

test("rechecking the same owned unverified factor retains its one-time setup data", async () => {
  const { api, calls } = backend();
  await fixture(api, async ({ read, verified }) => {
    const owned = {
      factorId: read().factorId,
      qrCode: read().qrCode,
      secret: read().secret,
    };
    await act(async () => read().begin());
    assert.equal(read().phase, "enrolling");
    assert.deepEqual(
      {
        factorId: read().factorId,
        qrCode: read().qrCode,
        secret: read().secret,
      },
      owned,
    );
    assert.equal(calls.enrolls, 1);
    assert.equal(verified(), 0);
  });
});

test("a failed recheck retains owned setup and a successful check can still observe completion", async () => {
  const { api, factors, calls } = backend();
  const list = api.listFactors;
  await fixture(api, async ({ read, verified }) => {
    const secret = read().secret;
    api.listFactors = async () => ({
      data: null,
      error: { code: "network_error" },
    });
    await act(async () => read().begin());
    assert.equal(read().phase, "enrolling");
    assert.equal(read().secret, secret);
    assert.equal(read().code, "");
    assert.equal(read().busy, false);
    assert.equal(calls.enrolls, 1);
    assert.equal(verified(), 0);
    api.listFactors = list;
    factors[0]!.status = "verified";
    await act(async () => read().begin());
    assert.equal(read().phase, "challenging");
    assert.equal(read().secret, null);
    assert.equal(read().qrCode, null);
    assert.equal(verified(), 0);
  });
});

test("a fresh recheck clears an old key when a different pending factor is observed", async () => {
  const { api, factors, calls } = backend();
  await fixture(api, async ({ read, verified }) => {
    factors[0] = {
      id: "other-synthetic-factor",
      factor_type: "totp",
      status: "unverified",
    };
    await act(async () => read().begin());
    assert.equal(read().phase, "pending");
    assert.equal(read().factorId, "other-synthetic-factor");
    assert.equal(read().secret, null);
    assert.equal(read().qrCode, null);
    assert.equal(calls.enrolls, 1);
    assert.equal(verified(), 0);
  });
});

test("a removed factor reported during challenge clears owned setup without verification", async () => {
  const { api, calls } = backend();
  api.challenge = async () => ({
    data: null,
    error: { code: "mfa_factor_not_found" },
  });
  await fixture(api, async ({ read, verified }) => {
    await act(async () => read().setCode("123456"));
    await act(async () => read().verify());
    assert.equal(read().phase, "error");
    assert.equal(read().factorId, null);
    assert.equal(read().secret, null);
    assert.equal(read().qrCode, null);
    assert.equal(calls.verifies.length, 0);
    assert.equal(verified(), 0);
  });
});

test("temporary errors on another tab pending setup never invent local setup data", async () => {
  const { api, calls } = backend([factor()]);
  api.challenge = async () => ({
    data: null,
    error: { code: "network_error" },
  });
  await fixture(api, async ({ read, verified }) => {
    await act(async () => read().setCode("123456"));
    await act(async () => read().verify());
    assert.equal(read().phase, "pending");
    assert.equal(read().secret, null);
    assert.equal(read().qrCode, null);
    assert.equal(read().code, "");
    assert.equal(calls.enrolls, 0);
    assert.equal(verified(), 0);
  });
});

test("temporary errors for a verified factor retain challenge access but never reveal setup data", async () => {
  const { api, calls } = backend([factor("verified")]);
  api.verify = async () => ({ error: { code: "network_error" } });
  await fixture(api, async ({ read, verified }) => {
    await act(async () => read().setCode("123456"));
    await act(async () => read().verify());
    assert.equal(read().phase, "challenging");
    assert.equal(read().secret, null);
    assert.equal(read().qrCode, null);
    assert.equal(read().code, "");
    assert.equal(calls.enrolls, 0);
    assert.equal(verified(), 0);
  });
});

test("a fresh empty factor list replaces an absent enrollment instead of reusing its old key", async () => {
  const { api, factors, calls } = backend();
  await fixture(api, async ({ read, verified }) => {
    factors.length = 0;
    api.enroll = async () => {
      calls.enrolls++;
      factors.push({ ...factor(), id: "replacement-factor" });
      return {
        data: {
          id: "replacement-factor",
          totp: {
            qr_code: "<svg>replacement</svg>",
            secret: "REPLACEMENT_SYNTHETIC",
          },
        },
        error: null,
      };
    };
    await act(async () => read().begin());
    assert.equal(read().phase, "enrolling");
    assert.equal(read().factorId, "replacement-factor");
    assert.equal(read().secret, "REPLACEMENT_SYNTHETIC");
    assert.equal(calls.enrolls, 2);
    assert.equal(verified(), 0);
  });
});

function lostEnrollment(thrown = false) {
  const b = backend();
  const removals: string[] = [];
  const normalEnroll = b.api.enroll;
  let first = true;
  b.api.enroll = async (params) => {
    if (!first) return normalEnroll(params);
    first = false;
    b.calls.enrolls++;
    b.factors.push({ ...factor(), friendly_name: params.friendlyName });
    if (thrown) throw new Error("Synthetic lost response");
    return { data: null, error: { code: "unexpected_failure" } };
  };
  b.api.unenroll = async ({ factorId }) => {
    removals.push(factorId);
    const index = b.factors.findIndex((f) => f.id === factorId);
    if (b.factors[index]?.status === "verified")
      return { error: { code: "insufficient_aal" } };
    if (index >= 0) b.factors.splice(index, 1);
    return { error: null };
  };
  return { ...b, removals };
}

test("lost enrollment response offers explicit owned recovery without automatic removal", async () => {
  const b = lostEnrollment();
  await fixture(b.api, async ({ read, verified }) => {
    assert.equal(read().phase, "pending");
    assert.equal(read().canRestart, true);
    assert.equal(read().secret, null);
    assert.deepEqual(b.removals, []);
    await act(async () => read().restart());
    assert.deepEqual(b.removals, ["synthetic-factor"]);
    assert.equal(b.calls.enrolls, 2);
    assert.equal(read().phase, "enrolling");
    assert.equal(read().secret, "SYNTHETIC_SETUP_ONLY");
    assert.equal(read().canRestart, false);
    assert.equal(verified(), 0);
    await act(async () => read().setCode("123456"));
    await act(async () => read().verify());
    assert.equal(verified(), 1);
  });
});
test("a thrown enrollment response recovers ownership on check setup again", async () => {
  const b = lostEnrollment(true);
  await fixture(b.api, async ({ read }) => {
    assert.equal(read().phase, "error");
    await act(async () => read().begin());
    assert.equal(read().canRestart, true);
    await act(async () => read().restart());
    assert.equal(read().phase, "enrolling");
    assert.equal(b.removals.length, 1);
  });
});
test("another tab or pre-existing factor is never eligible for restart", async () => {
  for (const status of ["unverified", "verified"]) {
    const b = lostEnrollment();
    b.factors.push({
      ...factor(status),
      friendly_name: "Reviewer setup another-tab",
    });
    await fixture(b.api, async ({ read, verified }) => {
      assert.equal(read().canRestart, false);
      await act(async () => read().restart());
      assert.deepEqual(b.removals, []);
      assert.equal(b.calls.enrolls, 0);
      assert.equal(verified(), 0);
    });
  }
});
test("fresh recovery read preserves a factor verified or replaced after the prompt", async () => {
  for (const change of ["verified", "replaced"]) {
    const b = lostEnrollment();
    await fixture(b.api, async ({ read }) => {
      assert.equal(read().canRestart, true);
      if (change === "verified") b.factors[0]!.status = "verified";
      else b.factors[0]!.friendly_name = "Reviewer setup foreign";
      await act(async () => read().restart());
      assert.deepEqual(b.removals, []);
      assert.equal(b.calls.enrolls, 1);
      assert.equal(read().canRestart, false);
    });
  }
});
test("failed recovery recheck never removes a factor and permits a later retry", async () => {
  const b = lostEnrollment();
  const list = b.api.listFactors;
  await fixture(b.api, async ({ read }) => {
    b.api.listFactors = async () => ({
      data: null,
      error: new Error("Synthetic offline"),
    });
    await act(async () => read().restart());
    assert.deepEqual(b.removals, []);
    assert.equal(read().canRestart, true);
    assert.ok(read().error);
    b.api.listFactors = list;
    await act(async () => read().restart());
    assert.equal(b.removals.length, 1);
    assert.equal(read().phase, "enrolling");
  });
});
test("a lost removal response rechecks absence without repeating deletion", async () => {
  const b = lostEnrollment();
  const remove = b.api.unenroll!;
  b.api.unenroll = async (params) => {
    await remove(params);
    return { error: new Error("Synthetic lost acknowledgement") };
  };
  await fixture(b.api, async ({ read }) => {
    await act(async () => read().restart());
    assert.equal(read().canRestart, true);
    assert.ok(read().error);
    await act(async () => read().restart());
    assert.equal(read().phase, "enrolling");
    assert.equal(b.removals.length, 1);
    assert.equal(b.calls.enrolls, 2);
  });
});
test("overlapping restart clicks share one removal and a fresh enrollment", async () => {
  const b = lostEnrollment();
  const pending = deferred<Awaited<ReturnType<MfaSetupApi["listFactors"]>>>();
  await fixture(b.api, async ({ read }) => {
    const list = b.api.listFactors;
    b.api.listFactors = () => pending.promise;
    let operation!: Promise<void>;
    await act(async () => {
      operation = read().restart();
      void read().restart();
    });
    b.api.listFactors = list;
    await act(async () => {
      pending.resolve(await list());
      await operation;
    });
    assert.equal(b.removals.length, 1);
    assert.equal(b.calls.enrolls, 2);
  });
});
test("unmount while recovery rechecks factors cannot remove or enroll", async () => {
  const b = lostEnrollment();
  const pending = deferred<Awaited<ReturnType<MfaSetupApi["listFactors"]>>>();
  await fixture(b.api, async ({ read, unmount }) => {
    b.api.listFactors = () => pending.promise;
    let operation!: Promise<void>;
    await act(async () => {
      operation = read().restart();
    });
    await unmount();
    pending.resolve({ data: { all: b.factors }, error: null });
    await operation;
    assert.equal(b.removals.length, 0);
    assert.equal(b.calls.enrolls, 1);
  });
});

test("server rejection of a verification race cannot replace or expose the verified factor", async () => {
  const b = lostEnrollment();
  b.api.unenroll = async () => {
    b.factors[0]!.status = "verified";
    return { error: { code: "insufficient_aal" } };
  };
  await fixture(b.api, async ({ read, verified }) => {
    await act(async () => read().restart());
    assert.ok(read().error);
    assert.equal(b.calls.enrolls, 1);
    assert.equal(read().secret, null);
    assert.equal(verified(), 0);
    await act(async () => read().begin());
    assert.equal(read().phase, "challenging");
    assert.equal(read().canRestart, false);
  });
});
