/**
 * Generates the canonical question bank used by the edge functions.
 *
 * The browser bundle is not a trust boundary. The submit handler compares every
 * submitted row with this file, so a client cannot invent a question, change a
 * source window, or mark a held row as answered. Run:
 *
 *   npm run generate:server-bank
 *
 * `npm run check:server-bank` fails if this file drifts from the client bank.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { QUESTION_BANK } from "../src/features/interview/questionBank";
import { sourceTextFor } from "../src/features/interview/sourceText";
import { QUESTIONNAIRE_VERSION } from "../src/features/interview/types";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "../supabase/functions/_shared/bank.generated.ts");

export function renderServerBank(): string {
  const rows = QUESTION_BANK.map((question) => ({
    id: question.id,
    section: question.section,
    sourceRef: question.sourceRef,
    sourceText: sourceTextFor(question.id),
    customerText: question.customerText,
    timeframe: question.timeframe ?? null,
    kind: question.kind,
    compound: question.compound === true,
    status: question.status,
    reviewStatus: question.reviewStatus,
    reviewNote: question.reviewNote ?? null,
    sensitive: question.sensitive === true,
    crisisFollowUp: question.crisisFollowUp === true,
    askWhen: question.askWhen
      ? { questionId: question.askWhen.questionId, includes: question.askWhen.includes }
      : null,
    options: (question.options ?? []).map((option) => ({ value: option.value, label: option.label })),
    fields: (question.fields ?? []).map((field) => ({
      id: field.id,
      label: field.label,
      kind: field.kind,
      options: (field.options ?? []).map((option) => ({
        value: option.value,
        label: option.label,
      })),
    })),
    detailPrompts: (question.detailPrompts ?? []).map((prompt) => ({
      id: prompt.id,
      label: prompt.label,
    })),
  }));

  return `/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/features/interview/questionBank.ts
 * Regenerate: npm run generate:server-bank
 */
export const QUESTIONNAIRE_VERSION = ${JSON.stringify(QUESTIONNAIRE_VERSION)} as const;

export interface CanonicalQuestion {
  id: string;
  section: string;
  sourceRef: string;
  sourceText: string;
  customerText: string;
  timeframe: string | null;
  kind: string;
  compound: boolean;
  status: "core" | "supplemental";
  reviewStatus: "approved" | "human_review_required";
  reviewNote: string | null;
  sensitive: boolean;
  crisisFollowUp: boolean;
  askWhen: { questionId: string; includes: string[] } | null;
  options: Array<{ value: string; label: string }>;
  fields: Array<{
    id: string;
    label: string;
    kind: string;
    options: Array<{ value: string; label: string }>;
  }>;
  detailPrompts: Array<{ id: string; label: string }>;
}

export const SERVER_BANK: readonly CanonicalQuestion[] = ${JSON.stringify(rows, null, 2)} as const;
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(target, renderServerBank(), "utf8");
  console.log(`Wrote ${target} — ${QUESTION_BANK.length} rows.`);
}
