/**
 * Server-only marketing send policy.
 *
 * This is a fail-closed engineering guardrail, not a legal opinion. A sender
 * must supply the contact's state from the stored case, the approved licensed
 * state list, and the approved calling window. The default licensed-state list
 * is empty, so every marketing send is refused until an operator configures an
 * approved matrix.
 *
 * The local-time check is deliberately conservative for states that span more
 * than one time zone: the contact is allowed only when every zone in that state
 * is inside the window. A future, counsel-approved matrix can replace this
 * state-level approximation with a contact-level time-zone source.
 */

export type MarketingChannel = "phone" | "email";

export interface MarketingPolicyConfig {
  /** Approved states, as two-letter codes. Empty means no state is approved. */
  licensedStates: ReadonlySet<string>;
  /** Inclusive start of the local calling window, in 24-hour local time. */
  startHour: number;
  /** Exclusive end of the local calling window, in 24-hour local time. */
  endHour: number;
  /** Set when the environment is malformed; every send must then be refused. */
  configurationError?: string;
}

export type MarketingPolicyDenialCode =
  | "policy_not_configured"
  | "channel_not_supported"
  | "state_missing"
  | "state_unknown"
  | "state_not_licensed"
  | "state_time_zone_missing"
  | "time_zone_unavailable"
  | "outside_calling_window";

export type MarketingPolicyDecision =
  | { allowed: true }
  | { allowed: false; code: MarketingPolicyDenialCode; reason: string };

export const DEFAULT_CALLING_START_HOUR = 8;
export const DEFAULT_CALLING_END_HOUR = 21;

/**
 * IANA zones for each state and DC. States that span zones list every zone;
 * the policy requires all of them to be inside the window.
 */
export const US_STATE_TIME_ZONES: Readonly<Record<string, readonly string[]>> = {
  AL: ["America/Chicago"],
  AK: ["America/Anchorage", "America/Adak"],
  AZ: ["America/Phoenix", "America/Denver"],
  AR: ["America/Chicago"],
  CA: ["America/Los_Angeles"],
  CO: ["America/Denver"],
  CT: ["America/New_York"],
  DE: ["America/New_York"],
  DC: ["America/New_York"],
  FL: ["America/New_York", "America/Chicago"],
  GA: ["America/New_York"],
  HI: ["Pacific/Honolulu"],
  ID: ["America/Boise", "America/Los_Angeles"],
  IL: ["America/Chicago"],
  IN: ["America/Indiana/Indianapolis", "America/Chicago", "America/New_York"],
  IA: ["America/Chicago"],
  KS: ["America/Chicago", "America/Denver"],
  KY: ["America/New_York", "America/Chicago"],
  LA: ["America/Chicago"],
  ME: ["America/New_York"],
  MD: ["America/New_York"],
  MA: ["America/New_York"],
  MI: ["America/Detroit", "America/Chicago"],
  MN: ["America/Chicago"],
  MS: ["America/Chicago"],
  MO: ["America/Chicago"],
  MT: ["America/Denver"],
  NE: ["America/Chicago", "America/Denver"],
  NV: ["America/Los_Angeles", "America/Denver"],
  NH: ["America/New_York"],
  NJ: ["America/New_York"],
  NM: ["America/Denver"],
  NY: ["America/New_York"],
  NC: ["America/New_York"],
  ND: ["America/Chicago", "America/Denver"],
  OH: ["America/New_York"],
  OK: ["America/Chicago"],
  OR: ["America/Los_Angeles", "America/Boise"],
  PA: ["America/New_York"],
  RI: ["America/New_York"],
  SC: ["America/New_York"],
  SD: ["America/Chicago", "America/Denver"],
  TN: ["America/Chicago", "America/New_York"],
  TX: ["America/Chicago", "America/Denver"],
  UT: ["America/Denver"],
  VT: ["America/New_York"],
  VA: ["America/New_York"],
  WA: ["America/Los_Angeles"],
  WV: ["America/New_York"],
  WI: ["America/Chicago"],
  WY: ["America/Denver"],
};

export function isSupportedState(value: string): boolean {
  return Object.prototype.hasOwnProperty.call(US_STATE_TIME_ZONES, value.toUpperCase());
}

function parseHour(value: string | undefined, fallback: number): number | null {
  if (value === undefined || value.trim() === "") return fallback;
  if (!/^\d{1,2}$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 24 ? parsed : null;
}

/**
 * Reads the approved matrix from server-only environment variables. An invalid
 * state code or window is retained as a configuration error so the caller
 * refuses every send rather than silently narrowing the list.
 */
export function loadMarketingPolicyFromEnv(
  getEnv: (name: string) => string | undefined,
): MarketingPolicyConfig {
  const rawStates = (getEnv("MARKETING_LICENSED_STATES") ?? "").trim();
  const tokens = rawStates
    ? rawStates.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean)
    : [];
  const invalidStates = tokens.filter((value) => !isSupportedState(value));
  const licensedStates = new Set(tokens.filter((value) => isSupportedState(value)));

  const startHour = parseHour(
    getEnv("MARKETING_CALLING_START_HOUR"),
    DEFAULT_CALLING_START_HOUR,
  );
  const endHour = parseHour(
    getEnv("MARKETING_CALLING_END_HOUR"),
    DEFAULT_CALLING_END_HOUR,
  );

  let configurationError: string | undefined;
  if (invalidStates.length > 0) {
    configurationError = `Unsupported licensed state code: ${invalidStates.join(", ")}`;
  } else if (startHour === null || endHour === null) {
    configurationError = "The marketing calling window is malformed";
  } else if (startHour >= endHour) {
    configurationError = "The marketing calling window must start before it ends";
  }

  return {
    licensedStates,
    startHour: startHour ?? DEFAULT_CALLING_START_HOUR,
    endHour: endHour ?? DEFAULT_CALLING_END_HOUR,
    configurationError,
  };
}

function localMinuteOfDay(now: Date, timeZone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const hourPart = parts.find((part) => part.type === "hour")?.value;
    const minutePart = parts.find((part) => part.type === "minute")?.value;
    if (hourPart === undefined || minutePart === undefined) return null;

    const hour = Number(hourPart) === 24 ? 0 : Number(hourPart);
    const minute = Number(minutePart);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    return hour * 60 + minute;
  } catch {
    return null;
  }
}

export interface MarketingPolicyInput {
  channel: MarketingChannel;
  state: string | null | undefined;
  now: Date;
  config: MarketingPolicyConfig;
}

/**
 * Evaluates the channel, approved state and local calling window. Email has no
 * calling-hours restriction, but it still requires an approved state. A phone
 * contact must be inside the window in every time zone of its state.
 */
export function evaluateMarketingPolicy(
  input: MarketingPolicyInput,
): MarketingPolicyDecision {
  const { config, now } = input;

  if (config.configurationError) {
    return {
      allowed: false,
      code: "policy_not_configured",
      reason: config.configurationError,
    };
  }

  if (input.channel !== "phone" && input.channel !== "email") {
    return {
      allowed: false,
      code: "channel_not_supported",
      reason: "Unsupported marketing channel",
    };
  }

  if (Number.isNaN(now.getTime())) {
    return {
      allowed: false,
      code: "time_zone_unavailable",
      reason: "The send clock is not a valid time",
    };
  }

  const state = input.state?.trim().toUpperCase() ?? "";
  if (!state) {
    return {
      allowed: false,
      code: "state_missing",
      reason: "A contact state is required before a marketing send",
    };
  }
  if (!isSupportedState(state)) {
    return {
      allowed: false,
      code: "state_unknown",
      reason: "The contact state is not a supported US jurisdiction",
    };
  }
  if (!config.licensedStates.has(state)) {
    return {
      allowed: false,
      code: "state_not_licensed",
      reason: `Marketing is not approved for ${state}`,
    };
  }

  // Email is not subject to the telephone calling window. State approval and
  // suppression are still mandatory.
  if (input.channel === "email") return { allowed: true };

  const zones = US_STATE_TIME_ZONES[state];
  if (!zones || zones.length === 0) {
    return {
      allowed: false,
      code: "state_time_zone_missing",
      reason: `No time zone is configured for ${state}`,
    };
  }

  const startMinute = config.startHour * 60;
  const endMinute = config.endHour * 60;
  const localTimes = zones.map((zone) => localMinuteOfDay(now, zone));
  if (localTimes.some((minute) => minute === null)) {
    return {
      allowed: false,
      code: "time_zone_unavailable",
      reason: "The contact's local time could not be resolved",
    };
  }

  if (
    localTimes.some(
      (minute) => minute === null || minute < startMinute || minute >= endMinute,
    )
  ) {
    return {
      allowed: false,
      code: "outside_calling_window",
      reason: "The contact is outside the approved local calling window",
    };
  }

  return { allowed: true };
}
