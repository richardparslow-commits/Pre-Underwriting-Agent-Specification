/**
 * Fails when the canonical server bank drifts from the client question bank.
 * A drift means the server could accept or reject the wrong wording, timeframe
 * or held status.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { renderServerBank } from "./generate-server-bank";
import { QUESTION_BANK } from "../src/features/interview/questionBank";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "../supabase/functions/_shared/bank.generated.ts");
const committed = readFileSync(target, "utf8");
const generated = renderServerBank();

if (committed !== generated) {
  console.error(
    "supabase/functions/_shared/bank.generated.ts is out of date. Run `npm run generate:server-bank` and commit the result.",
  );
  process.exit(1);
}

console.log(`Server bank matches the client bank: ${QUESTION_BANK.length} rows.`);
