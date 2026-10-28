/**
 * Fails when the canonical server consent policy drifts from the wording the
 * client displays. Consent evidence is only meaningful if the server can prove
 * which exact text and version the customer saw.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { renderServerPolicy } from "./generate-server-policy";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "../supabase/functions/_shared/policy.generated.ts");
const committed = readFileSync(target, "utf8");
const generated = renderServerPolicy();

if (committed !== generated) {
  console.error(
    "supabase/functions/_shared/policy.generated.ts is out of date. Run `npm run generate:server-policy` and commit the result.",
  );
  process.exit(1);
}

console.log("Server consent policy matches the client consent wording.");
