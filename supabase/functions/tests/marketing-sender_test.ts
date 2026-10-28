/**
 * Proves the sender never reaches the provider callback when the state/time
 * policy or the database suppression guard denies the send.
 */

import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert@1.0.6";
import {
  MarketingSendBlocked,
  sendMarketingMessage,
  type MarketingRpcClient,
  type MarketingSendMessage,
} from "../_shared/marketing-sender.ts";
import type { MarketingPolicyConfig } from "../_shared/marketing-policy.ts";

const TX: MarketingPolicyConfig = {
  licensedStates: new Set(["TX"]),
  startHour: 8,
  endHour: 21,
};

const NOW = () => new Date("2026-10-28T15:00:00Z"); // 10:00 in Texas

const MESSAGE: MarketingSendMessage = {
  reference: "LPP-2026-ABC123",
  channel: "phone",
  address: "+15125550199",
  state: "TX",
};

function rpcClient(result: { data: unknown; error: { code?: string } | null }) {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const client: MarketingRpcClient = {
    rpc(name, args) {
      calls.push({ name, args });
      return Promise.resolve(result);
    },
  };
  return { client, calls };
}

function sender(client: MarketingRpcClient, config = TX) {
  const delivered: MarketingSendMessage[] = [];
  return {
    delivered,
    dependencies: {
      supabase: client,
      config,
      now: NOW,
      deliver: async (message: MarketingSendMessage) => {
        delivered.push(message);
      },
    },
  };
}

Deno.test("delivers only after the policy and suppression guard pass", async () => {
  const { client, calls } = rpcClient({ data: true, error: null });
  const { dependencies, delivered } = sender(client);

  await sendMarketingMessage(dependencies, MESSAGE);

  assertEquals(calls.length, 1);
  assertEquals(calls[0].name, "assert_marketing_send_allowed");
  assertEquals(calls[0].args.p_channel, "phone");
  assertEquals(calls[0].args.p_address, "+15125550199");
  assertEquals(delivered.length, 1);
  assertEquals(delivered[0].state, "TX");
});

Deno.test("does not call the database or provider when the state is unlicensed", async () => {
  const { client, calls } = rpcClient({ data: true, error: null });
  const { dependencies, delivered } = sender(client);

  const error = await assertRejects(
    () => sendMarketingMessage(dependencies, { ...MESSAGE, state: "CA" }),
    MarketingSendBlocked,
  );

  assertEquals(error.code, "state_not_licensed");
  assertEquals(calls.length, 0);
  assertEquals(delivered.length, 0);
});

Deno.test("does not call the database or provider outside the calling window", async () => {
  const { client, calls } = rpcClient({ data: true, error: null });
  const { dependencies, delivered } = sender(client);
  dependencies.now = () => new Date("2026-10-29T02:00:00Z"); // 21:00 CDT

  const error = await assertRejects(
    () => sendMarketingMessage(dependencies, MESSAGE),
    MarketingSendBlocked,
  );

  assertEquals(error.code, "outside_calling_window");
  assertEquals(calls.length, 0);
  assertEquals(delivered.length, 0);
});

Deno.test("does not call the provider when the suppression guard rejects", async () => {
  const { client, calls } = rpcClient({
    data: null,
    error: { code: "P0001" },
  });
  const { dependencies, delivered } = sender(client);

  const error = await assertRejects(
    () => sendMarketingMessage(dependencies, MESSAGE),
    MarketingSendBlocked,
  );

  assertEquals(error.code, "suppression_check_failed");
  assertEquals(calls.length, 1);
  assertEquals(delivered.length, 0);
});

Deno.test("treats a non-true guard result as a rejection", async () => {
  const { client, calls } = rpcClient({ data: false, error: null });
  const { dependencies, delivered } = sender(client);

  const error = await assertRejects(
    () => sendMarketingMessage(dependencies, MESSAGE),
    MarketingSendBlocked,
  );

  assertEquals(error.code, "suppression_guard_rejected");
  assertEquals(calls.length, 1);
  assertEquals(delivered.length, 0);
});

Deno.test("rejects an empty address before either guard", async () => {
  const { client, calls } = rpcClient({ data: true, error: null });
  const { dependencies, delivered } = sender(client);

  const error = await assertRejects(
    () => sendMarketingMessage(dependencies, { ...MESSAGE, address: "   " }),
    MarketingSendBlocked,
  );

  assertEquals(error.code, "address_missing");
  assertEquals(calls.length, 0);
  assertEquals(delivered.length, 0);
});
