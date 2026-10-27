/**
 * Launch-gate check: is the question bank structurally sound, and is every
 * source question either traced to a row or recorded as a gap?
 *
 * Run with `npm run check:bank`. This proves ids, branches, sections, held
 * rows and reconciliation coverage are consistent. It cannot prove a wording
 * is approved; a named reviewer must sign each row off.
 */
import { QUESTION_BANK } from "../src/features/interview/questionBank";
import {
  reconciliationSummary,
  SOURCE_GAPS,
} from "../src/features/interview/reconciliation";
import { validateQuestionBank, validateReconciliation } from "../src/features/interview/validateQuestionBank";

const structural = validateQuestionBank();
const reconciliation = validateReconciliation();
const issues = [...structural, ...reconciliation];

const approved = QUESTION_BANK.filter((question) => question.reviewStatus === "approved");
const held = QUESTION_BANK.filter((question) => question.reviewStatus === "human_review_required");
const signedOff = QUESTION_BANK.filter((question) => question.sourceVerified);
const summary = reconciliationSummary();

console.log(`Question bank: ${QUESTION_BANK.length} rows`);
console.log(`  approved for interview : ${approved.length}`);
console.log(`  held for human review  : ${held.length} (${held.map((q) => q.id).join(", ")})`);
console.log(`  branching questions    : ${QUESTION_BANK.filter((q) => q.askWhen).length}`);
console.log(`  supplemental           : ${QUESTION_BANK.filter((q) => q.status === "supplemental").length}`);
console.log(`  signed off by reviewer : ${signedOff.length}`);
console.log("");
console.log(`Source questionnaire: ${summary.sourceItems} questions`);
console.log(`  traced to a bank row  : ${summary.sourceItemsTraced}`);
console.log(
  `  gaps recorded         : ${SOURCE_GAPS.length} (${summary.gaps.merge_into} partially collected, ${summary.gaps.out_of_scope} out of scope, ${summary.gaps.add_question} collected nowhere)`,
);
console.log("");
console.log(`Reconciliation: ${summary.rows} records, ${summary.rowsWithFlags} with flags`);
for (const [verdict, count] of Object.entries(summary.byVerdict)) {
  if (count > 0) console.log(`  ${verdict.padEnd(18)}: ${count}`);
}
console.log(
  `  flags: ${Object.entries(summary.byFlag)
    .map(([kind, count]) => `${kind} ${count}`)
    .join(", ")}`,
);

if (issues.length > 0) {
  console.error("\nIssues:");
  for (const issue of issues) console.error(`  - ${issue}`);
  process.exit(1);
}

if (signedOff.length < QUESTION_BANK.length) {
  console.log(
    `\nReconciliation is complete; ${QUESTION_BANK.length - signedOff.length} rows still need a named reviewer's sign-off.`,
  );
  console.log("See docs/question-bank-reconciliation.md for each row's decision.");
}

console.log("\nStructural and reconciliation checks passed.");
