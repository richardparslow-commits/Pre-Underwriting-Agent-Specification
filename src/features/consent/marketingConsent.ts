import { resolveLegalEntity } from "../../config/legalEntity";
import type { ConsentId, ConsentRecord } from "../interview/types";

/**
 * Consent evidence, built from an explicit context rather than module-level
 * environment flags. Keeping this pure lets the regression test drive every
 * channel combination, including a placeholder seller, without a build.
 */

export const MARKETING_CALL_LABEL =
  "I agree to receive marketing telephone calls as described below.";

export const MARKETING_TEXT_LABEL =
  "I agree to receive marketing text messages as described below.";

export interface MarketingChannels {
  calls: boolean;
  texts: boolean;
  autodialer: boolean;
  aiVoice: boolean;
}

export interface ConsentContext {
  /** Raw configured seller; placeholders are rejected here, not by callers. */
  legalEntity: string;
  brand: string;
  reviewerEmail: string;
  textVersion: string;
  /** Privacy notice version is tracked separately from the shared consent version. */
  privacyVersion: string;
  channels: MarketingChannels;
  intakePermissionText: string;
  privacyAcknowledgementText: string;
}

export interface ConsentSelection {
  marketingCall: boolean;
  marketingText: boolean;
  privacyAcknowledged: boolean;
  intakePermission: boolean;
}

/** When each permission was actually given. A missing entry means no timestamp. */
export type ConsentTimestamps = Partial<Record<ConsentId, string>>;

/** Marketing consent is offered only for a named seller and a live channel. */
export function isMarketingEnabled(context: ConsentContext): boolean {
  return (
    resolveLegalEntity(context.legalEntity).length > 0 &&
    (context.channels.calls || context.channels.texts)
  );
}

/**
 * TCPA written-consent draft, assembled only from channels the business has
 * actually enabled. It is empty when marketing is off, so no placeholder
 * seller and no unused channel can reach a customer.
 */
export function buildMarketingDisclosure(context: ConsentContext): string {
  if (!isMarketingEnabled(context)) return "";

  const entity = resolveLegalEntity(context.legalEntity);

  const channels =
    context.channels.calls && context.channels.texts
      ? "telephone calls and text messages"
      : context.channels.calls
        ? "telephone calls"
        : "text messages";

  const technology: string[] = [];
  if (context.channels.calls && context.channels.autodialer) {
    technology.push("Calls may use an automatic telephone dialing system");
  }
  if (context.channels.calls && context.channels.aiVoice) {
    technology.push(
      "calls may use an artificial or prerecorded voice, including an AI-generated voice",
    );
  }

  const revocation: string[] = [];
  if (context.channels.texts) revocation.push("replying STOP to a text");
  if (context.channels.calls) revocation.push("telling the caller");
  revocation.push(`emailing ${context.reviewerEmail}`);

  const revocationText =
    revocation.length > 1
      ? `${revocation.slice(0, -1).join(", ")}, or ${revocation[revocation.length - 1]}`
      : revocation[0];

  const sentences = [
    `By checking an optional box above and selecting "Submit for Richard's Review," I electronically sign and authorize ${entity}, doing business as ${context.brand}, to contact me at the telephone number I provided with marketing information about life insurance by ${channels}.`,
  ];

  if (technology.length > 0) sentences.push(`${technology.join("; ")}.`);

  sentences.push("My consent is not a condition of purchasing any goods or services.");

  if (context.channels.texts) {
    sentences.push("Message frequency varies. Message and data rates may apply.");
  }

  sentences.push(
    `I may revoke consent at any time by ${revocationText}. See the Privacy Policy and Messaging Terms.`,
  );

  return sentences.join(" ");
}

function record(
  id: ConsentId,
  label: string,
  text: string,
  granted: boolean,
  grantedAt: string | null,
  textVersion: string,
  numberAuthorized?: string,
): ConsentRecord {
  return {
    id,
    label,
    granted,
    grantedAt,
    textVersion,
    text,
    numberAuthorized,
  };
}

/**
 * Builds the consent evidence for a submission. Timestamps are only set for
 * permissions the customer actually gave; an unchecked marketing box records
 * `granted: false` with no timestamp, never an inferred value.
 *
 * A marketing record exists only for an enabled channel. Storing one for a
 * channel the product does not operate would invent consent evidence for
 * something the customer never saw.
 */
export function buildConsentRecords(
  context: ConsentContext,
  selection: ConsentSelection,
  phone: string | undefined,
  timestamps: ConsentTimestamps,
): ConsentRecord[] {
  const consents: ConsentRecord[] = [
    record(
      "intake_permission",
      "Preliminary intake and submission",
      context.intakePermissionText,
      selection.intakePermission,
      selection.intakePermission ? (timestamps.intake_permission ?? null) : null,
      context.textVersion,
    ),
    record(
      "privacy_acknowledgement",
      "Privacy practices acknowledgement",
      context.privacyAcknowledgementText,
      selection.privacyAcknowledged,
      selection.privacyAcknowledged ? (timestamps.privacy_acknowledgement ?? null) : null,
      context.privacyVersion,
    ),
  ];

  if (!isMarketingEnabled(context)) return consents;

  const disclosure = buildMarketingDisclosure(context);

  if (context.channels.calls) {
    consents.push(
      record(
        "marketing_call",
        MARKETING_CALL_LABEL,
        disclosure,
        selection.marketingCall,
        selection.marketingCall ? (timestamps.marketing_call ?? null) : null,
        context.textVersion,
        selection.marketingCall ? phone : undefined,
      ),
    );
  }

  if (context.channels.texts) {
    consents.push(
      record(
        "marketing_text",
        MARKETING_TEXT_LABEL,
        disclosure,
        selection.marketingText,
        selection.marketingText ? (timestamps.marketing_text ?? null) : null,
        context.textVersion,
        selection.marketingText ? phone : undefined,
      ),
    );
  }

  return consents;
}
