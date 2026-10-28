/**
 * Generates the public question-to-source locator map.
 *
 * `reconciliation.ts` contains reviewer flags and actions that quote source
 * wording. The customer bank only needs the locator string, so this generated
 * module keeps the reconciliation record out of the browser bundle.
 *
 * Run: `npm run generate:question-refs`
 * `npm run check:bank` fails if this file drifts from the reconciliation data.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  QUESTION_RECONCILIATION,
  sourceRefFor,
} from "../src/features/interview/reconciliation";
import { SOURCE_DOCUMENT } from "../src/features/interview/sourceIndex";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "../src/features/interview/questionSourceRefs.ts");

export function renderQuestionSourceRefs(): string {
  const refs = Object.fromEntries(
    QUESTION_RECONCILIATION.map((record) => [record.questionId, sourceRefFor(record.questionId)]),
  );

  return `/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/features/interview/reconciliation.ts
 * Regenerate: npm run generate:question-refs
 *
 * Locator-only projection of the reconciliation data. Do not add source text,
 * reviewer flags or actions here: this module is shipped to the browser.
 */
export const QUESTION_SOURCE_REFS: Readonly<Record<string, string>> = ${JSON.stringify(refs, null, 2)};

export function sourceRefFor(questionId: string): string {
  return QUESTION_SOURCE_REFS[questionId] ?? ${JSON.stringify(
    `${SOURCE_DOCUMENT.fileName} — no reconciliation record`,
  )};
}
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(target, renderQuestionSourceRefs(), "utf8");
  console.log(`Wrote ${target} — ${QUESTION_RECONCILIATION.length} locators (no source text).`);
}
