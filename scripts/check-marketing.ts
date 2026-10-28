/**
 * Structural guard for the SC-02 marketing controls.
 *
 * The policy is only useful if the sender cannot bypass it and the opt-out
 * endpoint keeps a stable idempotency key. This check fails if:
 *
 *  * the state/time-zone table loses a jurisdiction or a zone;
 *  * the default policy stops failing closed;
 *  * the opt-out endpoint stops hashing a caller idempotency key;
 *  * the sender stops checking policy and suppression before its provider call.
 *
 * Run: `npm run check:marketing`.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  evaluateMarketingPolicy,
  loadMarketingPolicyFromEnv,
  US_STATE_TIME_ZONES,
  type MarketingPolicyConfig,
} from "../supabase/functions/_shared/marketing-policy";

const failures: string[] = [];

function read(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

function requireMarker(path: string, marker: string, why: string) {
  if (!read(path).includes(marker)) {
    failures.push(`${path} is missing ${JSON.stringify(marker)} — ${why}`);
  }
}

if (Object.keys(US_STATE_TIME_ZONES).length !== 51) {
  failures.push("US_STATE_TIME_ZONES must contain 50 states and DC");
}

const now = new Date("2026-10-28T18:00:00Z");
for (const [state, zones] of Object.entries(US_STATE_TIME_ZONES)) {
  if (zones.length === 0) failures.push(`${state} has no time zone`);
  for (const zone of zones) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: zone }).format(now);
    } catch {
      failures.push(`${state} has an invalid time zone: ${zone}`);
    }
  }
}

const empty = loadMarketingPolicyFromEnv(() => undefined);
if (empty.licensedStates.size !== 0) {
  failures.push("The default licensed-state list must be empty");
}
const defaultDecision = evaluateMarketingPolicy({
  channel: "phone",
  state: "TX",
  now,
  config: empty,
});
if (defaultDecision.allowed || defaultDecision.code !== "state_not_licensed") {
  failures.push("An unconfigured licensed-state list must deny every send");
}

const tx: MarketingPolicyConfig = {
  licensedStates: new Set(["TX"]),
  startHour: 8,
  endHour: 21,
};
const allowed = evaluateMarketingPolicy({
  channel: "phone",
  state: "TX",
  now: new Date("2026-10-28T15:00:00Z"),
  config: tx,
});
if (!allowed.allowed) failures.push("A licensed Texas call inside the window must be allowed");

const closed = evaluateMarketingPolicy({
  channel: "phone",
  state: "TX",
  now: new Date("2026-10-29T02:00:00Z"),
  config: tx,
});
if (closed.allowed || closed.code !== "outside_calling_window") {
  failures.push("The 21:00 local boundary must be refused");
}

const multiZone = evaluateMarketingPolicy({
  channel: "phone",
  state: "FL",
  now: new Date("2026-10-28T12:30:00Z"),
  config: { ...tx, licensedStates: new Set(["FL"]) },
});
if (multiZone.allowed || multiZone.code !== "outside_calling_window") {
  failures.push("A multi-zone state must be refused when any zone is outside the window");
}

requireMarker(
  "src/lib/marketing.ts",
  "Idempotency-Key",
  "the browser must send a stable idempotency key",
);
requireMarker(
  "src/pages/MarketingOptOutPage.tsx",
  "idempotencyKey",
  "the opt-out form must retain its idempotency key for a retry",
);
requireMarker(
  "supabase/functions/revoke-marketing/index.ts",
  "requestIdFromIdempotencyKey",
  "the endpoint must hash the caller key to the RPC request id",
);
requireMarker(
  "supabase/functions/revoke-marketing/index.ts",
  "p_request_id: requestId",
  "the endpoint must not generate a fresh request id on a retry",
);
requireMarker(
  "supabase/functions/revoke-marketing/index.ts",
  "Invalid idempotency key.",
  "a malformed idempotency key must be rejected",
);
requireMarker(
  "supabase/migrations/0008_marketing_revocation_idempotency.sql",
  "r.request_id = p_request_id",
  "the replay guard must look up the prior request",
);
requireMarker(
  "supabase/functions/_shared/marketing-sender.ts",
  "assert_marketing_send_allowed",
  "the sender must call the database suppression guard",
);
requireMarker(
  "supabase/functions/_shared/marketing-sender.ts",
  "evaluateMarketingPolicy",
  "the sender must call the local-time/state policy",
);
const sender = read("supabase/functions/_shared/marketing-sender.ts");
const policyIndex = sender.indexOf("evaluateMarketingPolicy");
const guardIndex = sender.indexOf("assert_marketing_send_allowed");
const deliverIndex = sender.lastIndexOf("await deps.deliver");
if (!(policyIndex >= 0 && policyIndex < guardIndex && guardIndex < deliverIndex)) {
  failures.push("The sender must evaluate policy, then the DB guard, then call deliver");
}

requireMarker(
  ".env.example",
  "MARKETING_LICENSED_STATES",
  "the approved state matrix must be configurable server-side",
);

if (failures.length > 0) {
  console.error("Marketing control guard failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  "Marketing control guard passed: 51 jurisdictions, fail-closed state list, 08:00–21:00 boundary, stable idempotency key, DB guard before deliver.",
);
