import { test } from "node:test";
import assert from "node:assert/strict";
import { submissionEndpoint } from "./submissionEndpoint";
test("configured relay is used without changing the Supabase reviewer backend", () => {
  assert.equal(submissionEndpoint("https://relay.example.test/submit-case", "https://db.supabase.co"), "https://relay.example.test/submit-case");
  assert.equal(submissionEndpoint(undefined, "https://db.supabase.co/"), "https://db.supabase.co/functions/v1/submit-case");
  assert.equal(submissionEndpoint(undefined, ""), "");
});
test("invalid explicit relay fails closed instead of silently bypassing it", () => {
  for (const value of [" ", "invalid", "http://relay.test/submit-case", "https://user:secret@relay.test/submit-case", "https://relay.test/submit-case?token=private", "https://relay.test/submit-case#fragment", "https://relay.test/other"]) {
    assert.equal(submissionEndpoint(value, "https://db.supabase.co"), "", value);
  }
});
