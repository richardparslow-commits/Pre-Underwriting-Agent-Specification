/**
 * Regression guard: consent evidence must describe only what the product
 * actually offers.
 *
 * A marketing record may exist only for a channel enabled in config, and no
 * marketing record or disclosure may be produced while the seller is blank or
 * still a bracket placeholder. The builders take an explicit context so every
 * combination is exercised without rebuilding the app.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildConsentRecords,
  buildMarketingDisclosure,
  type ConsentContext,
  type ConsentSelection,
  type MarketingChannels,
} from "./marketingConsent";

const VERSION = "2026-10-b";
const SUBMITTED_AT = "2026-10-27T12:00:00.000Z";
const PHONE = "5125550100";

const BASE_IDS = ["intake_permission", "privacy_acknowledgement"];

function channels(overrides: Partial<MarketingChannels> = {}): MarketingChannels {
  return { calls: false, texts: false, autodialer: false, aiVoice: false, ...overrides };
}

function context(overrides: Partial<ConsentContext> = {}): ConsentContext {
  return {
    legalEntity: "Example Seller LLC",
    brand: "Life Policy Pilot",
    reviewerEmail: "reviewer@example.com",
    textVersion: VERSION,
    channels: channels(),
    intakePermissionText: "Intake permission wording.",
    privacyAcknowledgementText: "Privacy acknowledgement wording.",
    ...overrides,
  };
}

const EVERYTHING_GRANTED: ConsentSelection = {
  intakePermission: true,
  privacyAcknowledged: true,
  marketingCall: true,
  marketingText: true,
};

const TIMESTAMPS = {
  intake_permission: SUBMITTED_AT,
  privacy_acknowledgement: SUBMITTED_AT,
  marketing_call: SUBMITTED_AT,
  marketing_text: SUBMITTED_AT,
};

function recordsFor(value: ConsentContext, selection = EVERYTHING_GRANTED) {
  return buildConsentRecords(value, selection, PHONE, TIMESTAMPS);
}

test("records no marketing consent when no channel is enabled", () => {
  const value = context();

  assert.deepEqual(
    recordsFor(value).map((record) => record.id),
    BASE_IDS,
  );
  assert.equal(buildMarketingDisclosure(value), "");
});

test("records only the text channel when calls are disabled", () => {
  const value = context({ channels: channels({ texts: true }) });
  const records = recordsFor(value);

  assert.deepEqual(
    records.map((record) => record.id),
    [...BASE_IDS, "marketing_text"],
  );

  const text = records.find((record) => record.id === "marketing_text");
  assert.ok(text);
  assert.equal(text.granted, true);
  assert.equal(text.numberAuthorized, PHONE);
  assert.equal(text.text, buildMarketingDisclosure(value));

  const disclosure = buildMarketingDisclosure(value);
  assert.match(disclosure, /Example Seller LLC/);
  assert.match(disclosure, /life insurance by text messages/);
  assert.doesNotMatch(disclosure, /telephone calls/);
  assert.match(disclosure, /replying STOP to a text, or emailing reviewer@example\.com/);
  assert.doesNotMatch(disclosure, /telling the caller/);
});

test("records only the call channel when texts are disabled", () => {
  const value = context({ channels: channels({ calls: true }) });
  const records = recordsFor(value);

  assert.deepEqual(
    records.map((record) => record.id),
    [...BASE_IDS, "marketing_call"],
  );

  const call = records.find((record) => record.id === "marketing_call");
  assert.ok(call);
  assert.equal(call.numberAuthorized, PHONE);
  assert.equal(call.text, buildMarketingDisclosure(value));

  const disclosure = buildMarketingDisclosure(value);
  assert.match(disclosure, /life insurance by telephone calls/);
  assert.doesNotMatch(disclosure, /text messages/);
  assert.match(disclosure, /telling the caller, or emailing reviewer@example\.com/);
  assert.doesNotMatch(disclosure, /replying STOP/);
  assert.doesNotMatch(disclosure, /Message and data rates/);
});

test("records each enabled channel exactly once when both are on", () => {
  const value = context({ channels: channels({ calls: true, texts: true }) });
  const records = recordsFor(value);

  assert.deepEqual(
    records.map((record) => record.id),
    [...BASE_IDS, "marketing_call", "marketing_text"],
  );
  assert.equal(records.filter((record) => record.id.startsWith("marketing_")).length, 2);
  assert.match(buildMarketingDisclosure(value), /life insurance by telephone calls and text messages/);
});

test("keeps marketing off while the seller is blank or a placeholder", () => {
  for (const legalEntity of ["[Your Company]", "  [Company Name]  ", ""]) {
    const value = context({ legalEntity, channels: channels({ calls: true, texts: true }) });

    assert.deepEqual(
      recordsFor(value).map((record) => record.id),
      BASE_IDS,
      `marketing records were built for an unconfirmed seller: "${legalEntity}"`,
    );
    assert.equal(
      buildMarketingDisclosure(value),
      "",
      `a disclosure was built for an unconfirmed seller: "${legalEntity}"`,
    );
  }
});

test("keeps an enabled channel record when its box was left unchecked", () => {
  const value = context({ channels: channels({ texts: true }) });
  const records = recordsFor(value, { ...EVERYTHING_GRANTED, marketingText: false });

  const text = records.find((record) => record.id === "marketing_text");
  assert.ok(text);
  assert.equal(text.granted, false);
  assert.equal(text.grantedAt, null);
  assert.equal(text.numberAuthorized, undefined);
  assert.equal(records.some((record) => record.id === "marketing_call"), false);
});
