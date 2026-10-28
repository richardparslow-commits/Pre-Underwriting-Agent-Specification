/**
 * Generates the public source index used by the customer bundle.
 *
 * The full `sourceInventory.ts` contains verbatim source wording and is
 * deliberately build/audit-only. The browser only needs stable ids, pages,
 * areas and timeframes to render a source reference. Keeping the text out of
 * this generated file is what prevents held/questionnaire wording from being
 * shipped in the public JavaScript bundle.
 *
 * Run: `npm run generate:source-index`
 * `npm run check:bank` fails if this file drifts from the full inventory.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  SOURCE_DOCUMENT,
  SOURCE_HEADINGS,
  SOURCE_INVENTORY,
} from "../src/features/interview/sourceInventory";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "../src/features/interview/sourceIndex.ts");

export function renderSourceIndex(): string {
  const rows = SOURCE_INVENTORY.map(({ id, page, area, timeframe }) => ({
    id,
    page,
    area,
    timeframe,
  }));

  return `/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/features/interview/sourceInventory.ts
 * Regenerate: npm run generate:source-index
 *
 * This index intentionally excludes the verbatim source text. The full
 * inventory is build/audit-only so customer bundles do not contain withheld or
 * sensitive source wording.
 */
export type SourceArea =
  | "medical"
  | "mental"
  | "nicotine"
  | "alcohol"
  | "aviation"
  | "avocations"
  | "driving"
  | "criminal"
  | "bankruptcy"
  | "drugs"
  | "residency"
  | "occupation"
  | "military";

export interface SourceIndexEntry {
  id: string;
  page: number;
  area: SourceArea;
  timeframe: string;
}

export const SOURCE_DOCUMENT = ${JSON.stringify(SOURCE_DOCUMENT, null, 2)} as const;

export const SOURCE_HEADINGS: Record<SourceArea, string> = ${JSON.stringify(SOURCE_HEADINGS, null, 2)};

export const SOURCE_INDEX: SourceIndexEntry[] = ${JSON.stringify(rows, null, 2)};

export const SOURCE_BY_ID: Record<string, SourceIndexEntry> = Object.fromEntries(
  SOURCE_INDEX.map((question) => [question.id, question]),
);

export const SOURCE_INVENTORY_IDS = SOURCE_INDEX.map((question) => question.id);

export const SOURCE_COUNT_BY_AREA = SOURCE_INDEX.reduce<Record<string, number>>(
  (counts, question) => {
    counts[question.area] = (counts[question.area] ?? 0) + 1;
    return counts;
  },
  {},
);
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(target, renderSourceIndex(), "utf8");
  console.log(`Wrote ${target} — ${SOURCE_INVENTORY.length} source items (wording excluded).`);
}
