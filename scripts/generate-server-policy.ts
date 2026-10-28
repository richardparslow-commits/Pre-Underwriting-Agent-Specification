/**
 * Generates the canonical consent policy used by the edge functions.
 *
 * The server must compare submitted consent evidence with the exact wording and
 * versions the product displays, not with strings chosen by the caller. Run:
 *
 *   npm run generate:server-policy
 *
 * `npm run check:server-policy` fails if this file drifts from the client
 * consent text module.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  CONSENT_VERSION,
  DISCLOSURE_VERSION,
  INTAKE_PERMISSION_TEXT,
  MARKETING_CALL_LABEL,
  MARKETING_DISCLOSURE_TEXT,
  MARKETING_TEXT_LABEL,
  PRIVACY_ACKNOWLEDGEMENT_TEXT,
  PRIVACY_PRACTICES_VERSION,
  SUBMISSION_ACKNOWLEDGEMENT_TEXT,
} from "../src/features/consent/consentTexts";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "../supabase/functions/_shared/policy.generated.ts");

export const POLICY = {
  consentVersion: CONSENT_VERSION,
  disclosureVersion: DISCLOSURE_VERSION,
  privacyVersion: PRIVACY_PRACTICES_VERSION,
  intakePermissionText: INTAKE_PERMISSION_TEXT,
  privacyAcknowledgementText: PRIVACY_ACKNOWLEDGEMENT_TEXT,
  marketingCallLabel: MARKETING_CALL_LABEL,
  marketingTextLabel: MARKETING_TEXT_LABEL,
  marketingDisclosure: MARKETING_DISCLOSURE_TEXT,
  submissionAcknowledgementText: SUBMISSION_ACKNOWLEDGEMENT_TEXT,
} as const;

export function renderServerPolicy(): string {
  return `/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/features/consent/consentTexts.ts
 * Regenerate: npm run generate:server-policy
 */
export const CONSENT_POLICY = ${JSON.stringify(POLICY, null, 2)} as const;
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(target, renderServerPolicy(), "utf8");
  console.log(`Wrote ${target}.`);
}
