import test from "node:test";
import assert from "node:assert/strict";
import { normaliseUsPhone, validateLead } from "./validation";
import type { LeadDetails } from "@/features/interview/types";

const BASE: Partial<LeadDetails> = {
  firstName: "Test",
  lastName: "Case",
  state: "TX",
  email: "test-case@example.com",
  dateOfBirth: "1980-01-01",
  preferredContact: "email",
  adultAttested: true,
};

function errors(patch: Partial<LeadDetails>) {
  return validateLead({ ...BASE, ...patch });
}

test("a phone or text preference requires a reachable number", () => {
  assert.match(errors({ preferredContact: "phone" }).phone ?? "", /phone number/i);
  assert.match(errors({ preferredContact: "text" }).phone ?? "", /phone number/i);
});

test("a phone preference rejects letters, short numbers and wrong country codes", () => {
  for (const phone of ["abc", "512", "+44 20 7946 0958", "25125550134"]) {
    assert.ok(errors({ preferredContact: "phone", phone }).phone, phone);
  }
});

test("a phone preference accepts a normal 10-digit US number", () => {
  const result = errors({ preferredContact: "phone", phone: "(512) 555-0134" });
  assert.equal(result.phone, undefined);
  assert.equal(normaliseUsPhone("(512) 555-0134"), "+15125550134");
});

test("a supplied number is validated even when email or chat is preferred", () => {
  assert.ok(errors({ preferredContact: "email", phone: "abc" }).phone);
  assert.equal(errors({ preferredContact: "email", phone: "5125550134" }).phone, undefined);
});

test("an 11-digit number is accepted only with the US country code", () => {
  assert.equal(normaliseUsPhone("+1 512 555 0134"), "+15125550134");
  assert.equal(normaliseUsPhone("25125550134"), null);
});

// Independent boundary values protect the wire contract, including optional fields.
for (const [field, limit] of Object.entries({
  firstName: 100, lastName: 100, email: 254, preferredContactTime: 120,
  timeZone: 80, assistance: 200, coverageAmount: 60, coveragePurpose: 120, termPreference: 60,
})) {
  test(`${field} rejects overflow locally instead of losing it on submission`, () => {
    const key = field as keyof LeadDetails;
    const value = field === "email" ? "a".repeat(limit - 12) + "@example.com" : "x".repeat(limit);
    assert.equal(errors({ [key]: value })[key], undefined);
    assert.match(errors({ [key]: "x" + value })[key] ?? "", new RegExp(String(limit)));
  });
}
