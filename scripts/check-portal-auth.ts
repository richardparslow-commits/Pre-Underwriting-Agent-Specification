/**
 * Structural guard for reviewer access and the paginated queue.
 *
 * There is no browser harness in this repository, so these checks protect the
 * properties that would otherwise regress silently:
 *
 *  * a reviewer can enrol, challenge and verify a TOTP factor in-app;
 *  * the portal renders that gate instead of sending them elsewhere;
 *  * a magic link cannot create an account;
 *  * hosted sign-ups are disabled in the committed project config;
 *  * the queue uses a cursor with an exact count rather than a silent limit;
 *  * a marketing withdrawal is loaded and shown beside the consent snapshot.
 *
 * Run: `npm run check:portal`.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const failures: string[] = [];

function read(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

function requireMarker(path: string, content: string, marker: string, why: string) {
  if (!content.includes(marker)) {
    failures.push(`${path} is missing ${JSON.stringify(marker)} — ${why}`);
  }
}

const gate = read("src/features/portal/MfaGate.tsx");
requireMarker("src/features/portal/MfaGate.tsx", gate, "mfa.listFactors", "the portal cannot discover an existing factor");
requireMarker("src/features/portal/MfaGate.tsx", gate, "mfa.enroll", "a reviewer with no factor cannot enrol");
requireMarker("src/features/portal/MfaGate.tsx", gate, "mfa.challenge", "an enrolled factor cannot be challenged");
requireMarker("src/features/portal/MfaGate.tsx", gate, "mfa.verify", "a challenge cannot be completed");
requireMarker("src/features/portal/MfaGate.tsx", gate, "mfa.unenroll", "abandoned enrolments would accumulate");

const portal = read("src/pages/PortalPage.tsx");
requireMarker("src/pages/PortalPage.tsx", portal, "<MfaGate", "the portal must render the in-app step-up");
if (portal.includes("Enrol an authenticator in your account security settings")) {
  failures.push(
    "src/pages/PortalPage.tsx still tells the reviewer to enrol somewhere else; the portal must do it",
  );
}
requireMarker("src/pages/PortalPage.tsx", portal, "Load more cases", "the queue must page instead of truncating");
requireMarker("src/pages/PortalPage.tsx", portal, "of {total} case", "the queue must show how many cases exist");

const api = read("src/lib/api.ts");
requireMarker("src/lib/api.ts", api, "shouldCreateUser: false", "a magic link must not create an account");
requireMarker("src/lib/api.ts", api, "count: \"exact\"", "the queue needs an exact total");
requireMarker("src/lib/api.ts", api, "nextCursor", "the queue needs a cursor for older cases");
requireMarker("src/lib/api.ts", api, ".limit(QUEUE_PAGE_SIZE + 1)", "the queue must detect whether another page exists");
requireMarker(
  "src/lib/api.ts",
  api,
  ".rpc(\"open_case_for_review\"",
  "sensitive case and marketing withdrawal evidence must load through the audited RPC",
);

const caseReview = read("src/features/portal/CaseReview.tsx");
requireMarker(
  "src/features/portal/CaseReview.tsx",
  caseReview,
  "Marketing withdrawal evidence",
  "a reviewer must see a withdrawal instead of only the original consent",
);

const config = read("supabase/config.toml");
requireMarker("supabase/config.toml", config, "enable_signup = false", "self-service sign-ups must stay off");
requireMarker(
  "supabase/config.toml",
  config,
  "enroll_enabled = true",
  "a project started from this config would reject TOTP enrolment",
);
requireMarker(
  "supabase/config.toml",
  config,
  "verify_enabled = true",
  "a project started from this config would reject TOTP verification",
);

if (failures.length > 0) {
  console.error("Reviewer access guard failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  "Reviewer access guard passed: TOTP enabled and enrol/challenge/verify present, in-app gate, no self-service sign-up, paginated queue with an exact count, marketing withdrawal evidence visible.",
);
