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
