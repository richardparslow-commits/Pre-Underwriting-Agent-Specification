/**
 * Fails when customer/reviewer documentation drifts from the audited data, or
 * when a stale count/claim survives a remediation. This is a structural check,
 * not a legal or semantic approval.
 */
import { readFileSync } from "node:fs";
import { QUESTION_BANK } from "../src/features/interview/questionBank";
import {
  reconciliationSummary,
  SOURCE_GAPS,
} from "../src/features/interview/reconciliation";

const summary = reconciliationSummary();
const approved = QUESTION_BANK.filter((question) => question.reviewStatus === "approved").length;
const held = QUESTION_BANK.filter(
  (question) => question.reviewStatus === "human_review_required",
).length;
const signedOff = QUESTION_BANK.filter((question) => question.sourceVerified).length;
const partial = SOURCE_GAPS.filter((gap) => gap.disposition === "merge_into").length;
const outOfScope = SOURCE_GAPS.filter((gap) => gap.disposition === "out_of_scope").length;

const facts = {
  bankRows: QUESTION_BANK.length,
  approved,
  held,
  signedOff,
  sourceItems: summary.sourceItems,
  traced: summary.sourceItemsTraced,
  gaps: SOURCE_GAPS.length,
  partial,
  outOfScope,
};

const expected = {
  bankRows: 92,
  approved: 87,
  held: 5,
  signedOff: 0,
  sourceItems: 113,
  traced: 85,
  gaps: 28,
  partial: 19,
  outOfScope: 9,
};

let failures = 0;

for (const [key, value] of Object.entries(expected)) {
  if (facts[key as keyof typeof facts] !== value) {
    failures += 1;
    console.error(
      `FAIL: ${key} is ${facts[key as keyof typeof facts]} in the data, expected ${value}. Update the docs and this check together.`,
    );
  }
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function requireText(path: string, values: string[]) {
  const content = read(path);
  for (const value of values) {
    if (!content.includes(value)) {
      failures += 1;
      console.error(`FAIL: ${path} is missing: ${value}`);
    }
  }
}

function forbidText(path: string, values: string[]) {
  const content = read(path);
  for (const value of values) {
    if (content.includes(value)) {
      failures += 1;
      console.error(`FAIL: ${path} still contains a stale claim: ${value}`);
    }
  }
}

requireText("README.md", [
  "92 rows",
  "113 source questions",
  "85",
  "28 source questions",
  "0 of 92",
  "QUESTIONNAIRE_APPROVED",
  "0003_reliability_and_access.sql",
  "0004_reviewer_write_paths.sql",
]);
forbidText("README.md", [
  "45 source questions",
  "31 unanswered",
  "5 consent-gate tests",
  "Email_WEBHOOK_SECRET=...                             # random",
  "no-lock supabase/functions/tests",
  "Not implemented; schedule must be documented",
]);

requireText("docs/LAUNCH-GATES.md", ["0/92", "28", "AAL2", "Svix"]);
forbidText("docs/LAUNCH-GATES.md", [
  "MFA must be enabled on the account (operational task)",
  "shared secret, not provider signature",
]);

requireText("docs/question-bank-reconciliation.md", [
  "0 of 92",
  "113 source questions",
  "**Total** | **92**",
]);
requireText("docs/OPERATIONS.md", [
  "retention_months",
  "delete_case",
  "record_marketing_revocation",
  "BLOCKED",
  "0001–0004",
]);

requireText(".env.example", ["RATE_LIMIT_SALT", "QUESTIONNAIRE_APPROVED"]);

forbidText("src/config/site.ts", ["all 56 rows"]);
forbidText("src/features/interview/reconciliation.ts", ["56-row"]);
forbidText("src/pages/LandingPage.tsx", ["Source questions"]);
forbidText("src/pages/PrivacyPage.tsx", [
  "encryption in transit and at rest",
  "encrypted at rest",
]);
requireText("src/pages/PrivacyPage.tsx", ["transmitted over TLS", "provider controls"]);

requireText("src/pages/LandingPage.tsx", ["Core questions"]);

// The held-question panel must never render source wording to a customer.
const reviewScreen = read("src/features/intake/ReviewScreen.tsx");
if (reviewScreen.includes("question.sourceText")) {
  failures += 1;
  console.error("FAIL: ReviewScreen renders held/source wording to the customer.");
}
requireText("src/features/intake/ReviewScreen.tsx", ["Questions held for human review"]);

// Confirmation copy must distinguish "saved" from "notification sent".
requireText("src/features/intake/ConfirmationScreen.tsx", [
  "notificationSent",
  "no notification was sent",
]);

if (failures > 0) {
  console.error(`\nDocumentation check failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log(
  `Documentation matches the data: ${facts.bankRows} rows, ${facts.approved} approved, ${facts.held} held, ${facts.signedOff} signed off; ${facts.sourceItems} source items, ${facts.traced} traced, ${facts.gaps} gaps (${facts.partial} partial, ${facts.outOfScope} out of scope).`,
);
