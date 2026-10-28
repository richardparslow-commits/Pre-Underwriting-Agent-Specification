/**
 * Boundary tests for the fail-closed marketing policy.
 *
 * The policy is intentionally conservative for multi-zone states: every zone
 * in the state must be inside the approved window. These tests use fixed
 * instants so daylight-saving transitions cannot make them flaky.
 */

import { assertEquals, assertFalse } from "jsr:@std/assert@1.0.6";
import {
  evaluateMarketingPolicy,
  loadMarketingPolicyFromEnv,
  US_STATE_TIME_ZONES,
  type MarketingPolicyConfig,
  type MarketingPolicyDecision,
} from "../_shared/marketing-policy.ts";

const TX: MarketingPolicyConfig = {
  licensedStates: new Set(["TX"]),
  startHour: 8,
  endHour: 21,
};

// Illinois has one time zone, so the exact boundary cases are unambiguous.
const IL: MarketingPolicyConfig = {
  licensedStates: new Set(["IL"]),
  startHour: 8,
  endHour: 21,
};

function at(value: string): Date {
  return new Date(value);
}

function denial(decision: MarketingPolicyDecision) {
  if (decision.allowed) throw new Error("expected a denied send");
  return decision;
}

function env(values: Record<string, string>) {
  return (name: string) => values[name];
}

Deno.test("allows a licensed Texas call inside the local window", () => {
  const decision = evaluateMarketingPolicy({
    channel: "phone",
    state: "TX",
    now: at("2026-10-28T15:00:00Z"), // 10:00 in Texas
    config: TX,
  });
  assertEquals(decision.allowed, true);
});

Deno.test("allows the opening boundary at 08:00 local time", () => {
  const decision = evaluateMarketingPolicy({
    channel: "phone",
    state: "IL",
    now: at("2026-10-28T13:00:00Z"), // 08:00 CDT
    config: IL,
  });
  assertEquals(decision.allowed, true);
});

Deno.test("denies one minute before the opening boundary", () => {
  const decision = evaluateMarketingPolicy({
    channel: "phone",
    state: "IL",
    now: at("2026-10-28T12:59:00Z"), // 07:59 CDT
    config: IL,
  });
  assertEquals(denial(decision).code, "outside_calling_window");
});

Deno.test("allows the last minute before the closing boundary", () => {
  const decision = evaluateMarketingPolicy({
    channel: "phone",
    state: "IL",
    now: at("2026-10-29T01:59:00Z"), // 20:59 CDT on 28 October
    config: IL,
  });
  assertEquals(decision.allowed, true);
});

Deno.test("denies the closing boundary at 21:00 local time", () => {
  const decision = evaluateMarketingPolicy({
    channel: "phone",
    state: "IL",
    now: at("2026-10-29T02:00:00Z"), // 21:00 CDT
    config: IL,
  });
  assertEquals(denial(decision).code, "outside_calling_window");
});

Deno.test("denies a state outside the approved licensed list", () => {
  const decision = evaluateMarketingPolicy({
    channel: "phone",
    state: "CA",
    now: at("2026-10-28T18:00:00Z"),
    config: TX,
  });
  assertEquals(denial(decision).code, "state_not_licensed");
});

Deno.test("denies a missing or unknown state", () => {
  const missing = evaluateMarketingPolicy({
    channel: "phone",
    state: "",
    now: at("2026-10-28T18:00:00Z"),
    config: TX,
  });
  assertEquals(denial(missing).code, "state_missing");

  const unknown = evaluateMarketingPolicy({
    channel: "phone",
    state: "ZZ",
    now: at("2026-10-28T18:00:00Z"),
    config: TX,
  });
  assertEquals(denial(unknown).code, "state_unknown");
});

Deno.test("denies every state while the licensed list is empty", () => {
  const decision = evaluateMarketingPolicy({
    channel: "phone",
    state: "TX",
    now: at("2026-10-28T18:00:00Z"),
    config: { ...TX, licensedStates: new Set() },
  });
  assertEquals(denial(decision).code, "state_not_licensed");
});

Deno.test("denies a multi-zone state when any zone is outside the window", () => {
  const decision = evaluateMarketingPolicy({
    channel: "phone",
    state: "FL",
    now: at("2026-10-28T12:30:00Z"), // 08:30 Eastern, 07:30 Central
    config: { ...TX, licensedStates: new Set(["FL"]) },
  });
  assertEquals(denial(decision).code, "outside_calling_window");
});

Deno.test("requires a licensed state for email but not a calling window", () => {
  const allowed = evaluateMarketingPolicy({
    channel: "email",
    state: "TX",
    now: at("2026-10-28T07:00:00Z"), // 02:00 in Texas
    config: TX,
  });
  assertEquals(allowed.allowed, true);

  const denied = evaluateMarketingPolicy({
    channel: "email",
    state: "CA",
    now: at("2026-10-28T18:00:00Z"),
    config: TX,
  });
  assertEquals(denial(denied).code, "state_not_licensed");
});

Deno.test("fails closed when the policy configuration is malformed", () => {
  const decision = evaluateMarketingPolicy({
    channel: "phone",
    state: "TX",
    now: at("2026-10-28T18:00:00Z"),
    config: { ...TX, configurationError: "Bad matrix" },
  });
  assertEquals(denial(decision).code, "policy_not_configured");
});

Deno.test("rejects an inverted calling window in the environment", () => {
  const config = loadMarketingPolicyFromEnv(
    env({
      MARKETING_LICENSED_STATES: "TX",
      MARKETING_CALLING_START_HOUR: "21",
      MARKETING_CALLING_END_HOUR: "08",
    }),
  );
  assertEquals(config.configurationError, "The marketing calling window must start before it ends");
});

Deno.test("rejects an unsupported state code rather than silently dropping it", () => {
  const config = loadMarketingPolicyFromEnv(
    env({ MARKETING_LICENSED_STATES: "TX, ZZ" }),
  );
  assertEquals(config.configurationError, "Unsupported licensed state code: ZZ");

  const decision = evaluateMarketingPolicy({
    channel: "phone",
    state: "TX",
    now: at("2026-10-28T18:00:00Z"),
    config,
  });
  assertEquals(denial(decision).code, "policy_not_configured");
});

Deno.test("defaults to no licensed states when the variable is absent", () => {
  const config = loadMarketingPolicyFromEnv(env({}));
  assertEquals(config.configurationError, undefined);
  assertEquals(config.licensedStates.size, 0);

  const decision = evaluateMarketingPolicy({
    channel: "phone",
    state: "TX",
    now: at("2026-10-28T18:00:00Z"),
    config,
  });
  assertEquals(denial(decision).code, "state_not_licensed");
});

Deno.test("has a valid IANA time zone for every state and DC", () => {
  assertEquals(Object.keys(US_STATE_TIME_ZONES).length, 51);
  const now = new Date("2026-10-28T18:00:00Z");
  for (const [state, zones] of Object.entries(US_STATE_TIME_ZONES)) {
    assertFalse(zones.length === 0, `${state} has no time zone`);
    for (const zone of zones) {
      const formatted = new Intl.DateTimeFormat("en-US", { timeZone: zone }).format(now);
      assertFalse(formatted.length === 0, `${state} has an invalid zone: ${zone}`);
    }
  }
});
