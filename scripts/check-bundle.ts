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
import { REVIEW_NOTES } from "../src/features/interview/reviewNotes.server";
import { SOURCE_BY_ID } from "../src/features/interview/sourceInventory";

const heldQuestions = QUESTION_BANK.filter(
  (question) => question.reviewStatus === "human_review_required",
);
const heldIds = new Set(heldQuestions.map((question) => question.id));

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
  // Short strings are matched whole. Longer ones are probed at the start,
  // middle and end, because a 60-character prefix only covers one part of the
  // wording and a minifier can change quoting or escaping elsewhere.
  const fragments =
    text.length <= 400
      ? [text]
      : [
          text.slice(0, 60),
          text.slice(Math.floor(text.length / 2) - 30, Math.floor(text.length / 2) + 30),
          text.slice(-60),
        ];

  for (const fragment of fragments) {
    if (fragment.trim().length < 20) continue;
    for (const bundle of bundles) {
      if (bundle.content.includes(fragment)) {
        failures.push(`${bundle.file} contains ${label}`);
        return;
      }
    }
  }
}

for (const sourceId of heldSourceIds) {
  const source = SOURCE_BY_ID[sourceId];
  if (source) probe(`withheld source wording from ${sourceId}`, source.text);
}

for (const question of heldQuestions) {
  const note = REVIEW_NOTES[question.id];
  if (note) probe(`reviewer-only review note for ${question.id}`, note);
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
  console.error(
    "Keep source text, reviewer notes and reconciliation detail in build/server-only modules and attach them server-side.",
  );
  process.exit(1);
}

console.log(
  `Bundle check passed: ${bundles.length} JavaScript asset(s); ${heldSourceIds.length} withheld source items, ${heldQuestions.length} reviewer notes and ${heldRecords.length} held reconciliation records are absent.`,
);
