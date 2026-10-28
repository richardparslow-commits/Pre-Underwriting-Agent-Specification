/**
 * Server-only marketing send gate.
 *
 * There is intentionally no provider adapter in this repository. A future
 * sender must pass its provider call as `deliver`; this wrapper is the only
 * permitted path to it. The wrapper checks, in order:
 *
 *   1. the approved licensed state and local calling window;
 *   2. the database suppression guard, using the canonical normalisation;
 *   3. only then, the injected provider call.
 *
 * A denied policy or guard never invokes `deliver`. The message carries no
 * health answers, names or free text, only the case reference, channel, address
 * and state needed by the sender and its audit trail.
 */

import {
  evaluateMarketingPolicy,
  type MarketingChannel,
  type MarketingPolicyConfig,
  type MarketingPolicyDenialCode,
} from "./marketing-policy.ts";

export interface MarketingSendMessage {
  reference: string;
  channel: MarketingChannel;
  address: string;
  /** The stored case's residence/contact state, never a browser-supplied value. */
  state: string;
}

interface RpcError {
  code?: string;
  message?: string;
}

interface RpcResult {
  data: unknown;
  error: RpcError | null;
}

/** The subset of the Supabase client the sender needs. */
export interface MarketingRpcClient {
  rpc(
    name: string,
    args: Record<string, unknown>,
  ): PromiseLike<RpcResult>;
}

export interface MarketingSenderDependencies {
  supabase: MarketingRpcClient;
  config: MarketingPolicyConfig;
  /** The provider adapter. It is called only after every guard passes. */
  deliver: (message: MarketingSendMessage) => Promise<void>;
  /** Injectable clock for boundary tests. */
  now?: () => Date;
}

export type MarketingSendBlockedCode =
  | MarketingPolicyDenialCode
  | "address_missing"
  | "suppression_check_failed"
  | "suppression_guard_rejected";

export class MarketingSendBlocked extends Error {
  readonly code: MarketingSendBlockedCode;

  constructor(code: MarketingSendBlockedCode, message: string) {
    super(message);
    this.name = "MarketingSendBlocked";
    this.code = code;
  }
}

/**
 * Runs the pre-send checks and only then calls the provider adapter.
 *
 * Errors deliberately omit the contact address and state so a caller cannot
 * copy a recipient into an application log.
 */
export async function sendMarketingMessage(
  deps: MarketingSenderDependencies,
  message: MarketingSendMessage,
): Promise<void> {
  const address = message.address.trim();
  if (!address) {
    throw new MarketingSendBlocked(
      "address_missing",
      "A contact address is required before a marketing send",
    );
  }

  const decision = evaluateMarketingPolicy({
    channel: message.channel,
    state: message.state,
    now: deps.now ? deps.now() : new Date(),
    config: deps.config,
  });

  if (!decision.allowed) {
    throw new MarketingSendBlocked(decision.code, decision.reason);
  }

  let guard: RpcResult;
  try {
    guard = await deps.supabase.rpc("assert_marketing_send_allowed", {
      p_channel: message.channel,
      p_address: address,
    });
  } catch {
    throw new MarketingSendBlocked(
      "suppression_check_failed",
      "The marketing suppression guard could not be checked",
    );
  }

  if (guard.error) {
    throw new MarketingSendBlocked(
      "suppression_check_failed",
      "The marketing suppression guard could not be checked",
    );
  }

  // The database function returns true or raises. Anything else is a failure,
  // not permission to send.
  if (guard.data !== true) {
    throw new MarketingSendBlocked(
      "suppression_guard_rejected",
      "The contact is not cleared for marketing",
    );
  }

  await deps.deliver({ ...message, address });
}
