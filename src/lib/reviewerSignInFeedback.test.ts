import test from "node:test";
import assert from "node:assert/strict";
import { createReviewerSignInFeedback } from "./reviewerSignInFeedback";

const message = /invalid, expired, or already used/;
function browser(href: string, fails = false) {
  const changes: string[] = [];
  const state = { router: "existing-router-state" };
  return {
    changes,
    location: { href },
    history: {
      state,
      replaceState(next: unknown, _unused: string, url?: string | URL | null) {
        assert.equal(next, state);
        if (fails) throw new Error("History unavailable");
        changes.push(String(url));
      },
    },
  };
}

for (const separator of ["#", "?"]) {
  test(`failed sign-in ${separator} redirect is captured before another consumer removes it`, () => {
    const page = browser(`https://example.test/portal${separator}error=access_denied&error_code=otp_expired&error_description=Private+provider+detail`);
    const feedback = createReviewerSignInFeedback(page);
    page.location.href = "https://example.test/portal"; // Supabase initialization consumed the URL.
    assert.match(feedback.read()!, message);
    assert.doesNotMatch(feedback.read()!, /Private|access_denied|otp_expired/);
    assert.deepEqual(page.changes, ["https://example.test/portal"]);
    assert.match(feedback.read()!, /Request a new sign-in link below/);
    feedback.clear();
    assert.equal(feedback.read(), null, "new link request or a verified session clears stale feedback");
  });
}

test("both error locations are scrubbed without dropping unrelated router parameters", () => {
  const page = browser("https://example.test/reviewer?view=queue&error=bad#error_description=private&section=help&error_code=otp_expired");
  assert.match(createReviewerSignInFeedback(page).read()!, message);
  assert.equal(page.changes.length, 1);
  const url = new URL(page.changes[0]!);
  assert.equal(url.search, "?view=queue");
  assert.equal(url.hash, "#section=help");
});

test("provider details are never rendered, including markup and credential-looking strings", () => {
  const detail = "<script>private-example-token</script>";
  const page = browser(`https://example.test/portal#error_description=${encodeURIComponent(detail)}`);
  const text = createReviewerSignInFeedback(page).read()!;
  assert.match(text, message);
  assert.doesNotMatch(text, /script|private-example-token/);
});

for (const suffix of ["", "#main", "?code=synthetic-auth-code", "#access_token=synthetic-access&refresh_token=synthetic-refresh&type=magiclink"]) {
  test(`ordinary or successful callback remains untouched (${suffix || "plain URL"})`, () => {
    const page = browser(`https://example.test/portal${suffix}`);
    assert.equal(createReviewerSignInFeedback(page).read(), null);
    assert.deepEqual(page.changes, []);
  });
}

test("feedback survives unavailable history and absent browser context is safe", () => {
  assert.equal(createReviewerSignInFeedback().read(), null);
  assert.match(createReviewerSignInFeedback(browser("https://example.test/portal#error=bad", true)).read()!, message);
});

test("unrelated pages retain their own error parameters", () => {
  const page = browser("https://example.test/contact?error=contact-error#section");
  assert.equal(createReviewerSignInFeedback(page).read(), null);
  assert.deepEqual(page.changes, []);
});
