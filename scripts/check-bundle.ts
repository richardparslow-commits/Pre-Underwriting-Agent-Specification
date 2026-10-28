/**
 * Fails when withheld source wording or reviewer-only reconciliation detail
 * reaches the production customer bundle.
 *
 * The public bank carries source locators only. Verbatim source text and the
 * reviewer flags/actions that quote it are attached server-side or kept in
 * build/audit modules, so they must not appear in any built browser asset.
 *
 * Run after `npm run build`: `npm run check:bundle`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { QUESTION_BANK } from "../src/features/interview/questionBank";
import { QUESTION_RECONCILIATION } from "../src/features/interview/reconciliation";
import { SOURCE_BY_ID } from "../src/features/interview/sourceInventory";

const heldIds = new Set(
  QUESTION_BANK.filter((question) => question.reviewStatus === "human_review_required").map(
    (question) => question.id,
  ),
);

const heldRecords = QUESTION_RECONCILIATION.filter((record) => heldIds.has(record.questionId));
const heldSourceIds = [...new Set(heldRecords.flatMap((record) => record.sourceIds))];

const assetDir = resolve("dist/assets");
let files: string[];

try {
  files = readdirSync(assetDir).filter((file) => file.endsWith(".js"));
} catch {
  console.error("dist/assets is missing. Run `npm run build` before `npm run check:bundle`.");
  process.exit(1);
}

if (files.length === 0) {
  console.error("No JavaScript assets found in dist/assets. Run `npm run build` first.");
  process.exit(1);
}

const bundles = files.map((file) => ({
  file,
  content: readFileSync(resolve(assetDir, file), "utf8"),
}));

const failures: string[] = [];

function probe(label: string, text: string) {
  // Prefix probes catch a minifier that changes quoting or escaping while
  // still retaining the wording. Skip fragments too short to be distinctive.
  const value = text.length > 60 ? text.slice(0, 60) : text;
  if (value.length < 20) return;

  for (const bundle of bundles) {
    if (bundle.content.includes(value)) {
      failures.push(`${bundle.file} contains ${label}`);
      return;
    }
  }
}

for (const sourceId of heldSourceIds) {
  const source = SOURCE_BY_ID[sourceId];
  if (source) probe(`withheld source wording from ${sourceId}`, source.text);
}

for (const record of heldRecords) {
  for (const flag of record.flags) {
    probe(`reviewer-only reconciliation detail for ${record.questionId}`, flag.detail);
  }
  probe(`reviewer-only action for ${record.questionId}`, record.action);
}

if (failures.length > 0) {
  console.error("Withheld or reviewer-only wording reached the public bundle:");
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error("Keep reconciliation detail in build/audit-only modules and attach source text server-side.");
  process.exit(1);
}

console.log(
  `Bundle check passed: ${bundles.length} JavaScript asset(s); ${heldSourceIds.length} withheld source items and ${heldRecords.length} held reconciliation records are absent.`,
);
