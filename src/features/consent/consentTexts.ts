import { FEATURES, MARKETING, MARKETING_ENABLED, SITE } from "@/config/site";
import type { ConsentId, ConsentRecord } from "@/features/interview/types";

/**
 * Consent wording and versions.
 *
 * Every one of these is a draft pending counsel review. They are versioned so
 * that a submitted case records the exact words the customer saw, and each
 * purpose is separate: submitting the interview is never marketing consent,
 * and neither of them is a medical-record release.
 */
export const CONSENT_VERSION = "2026-10-b";
export const DISCLOSURE_VERSION = "2026-10-b";

export const PRIVACY_PRACTICES_VERSION = "2026-10-a";

/**
 * Describes only what is actually running. The AI wording from the
 * specification is restored automatically when an approved explainer layer is
 * enabled, so the customer is never told a model is involved when it is not.
 */
const ASSISTANT_INTRO = FEATURES.aiExplainerEnabled
  ? "This AI assistant collects information"
  : "This guided interview collects information";

export const INTAKE_PERMISSION_TEXT = `${ASSISTANT_INTRO} for a preliminary life-insurance review by ${SITE.owner} at ${SITE.brand}. It does not diagnose medical conditions or decide insurance eligibility. Before submission, you can review and correct your answers. By selecting "Submit for Richard's Review," you ask ${SITE.brand} to securely provide your responses to ${SITE.owner} for this review. Submitting this questionnaire does not create insurance coverage or automatically authorize release of medical records or submission to an insurer.`;

export const PRIVACY_ACKNOWLEDGEMENT_TEXT =
  "I have read the privacy practices explained in this interview. I understand what is collected, who reads it, how it is stored, and how to ask for correction or deletion.";

export const MARKETING_CALL_LABEL =
  "I agree to receive marketing telephone calls as described below.";

export const MARKETING_TEXT_LABEL =
  "I agree to receive marketing text messages as described below.";

/**
 * TCPA written-consent draft, assembled only from channels the business has
 * actually enabled. It is empty when marketing is off, so no placeholder
 * seller and no unused channel can reach a customer.
 */
function buildMarketingDisclosure(): string {
  if (!MARKETING_ENABLED) return "";

  const channels =
    MARKETING.calls && MARKETING.texts
      ? "telephone calls and text messages"
      : MARKETING.calls
        ? "telephone calls"
        : "text messages";

  const technology: string[] = [];
  if (MARKETING.calls && MARKETING.autodialer) {
    technology.push("Calls may use an automatic telephone dialing system");
  }
  if (MARKETING.calls && MARKETING.aiVoice) {
    technology.push(
      "calls may use an artificial or prerecorded voice, including an AI-generated voice",
    );
  }

  const revocation: string[] = [];
  if (MARKETING.texts) revocation.push("replying STOP to a text");
  if (MARKETING.calls) revocation.push("telling the caller");
  revocation.push(`emailing ${SITE.reviewerEmail}`);
  const revocationText =
    revocation.length > 1
      ? `${revocation.slice(0, -1).join(", ")}, or ${revocation[revocation.length - 1]}`
      : revocation[0];

  const sentences = [
    `By checking an optional box above and selecting "Submit for Richard's Review," I electronically sign and authorize ${SITE.legalEntity}, doing business as ${SITE.brand}, to contact me at the telephone number I provided with marketing information about life insurance by ${channels}.`,
  ];

  if (technology.length > 0) sentences.push(`${technology.join("; ")}.`);

  sentences.push("My consent is not a condition of purchasing any goods or services.");

  if (MARKETING.texts) {
    sentences.push("Message frequency varies. Message and data rates may apply.");
  }

  sentences.push(
    `I may revoke consent at any time by ${revocationText}. See the Privacy Policy and Messaging Terms.`,
  );

  return sentences.join(" ");
}

export const MARKETING_DISCLOSURE_TEXT = buildMarketingDisclosure();

export const SUBMISSION_ACKNOWLEDGEMENT_TEXT = `I have reviewed the answers shown on this page and they are complete and accurate to the best of my knowledge. I understand this is a preliminary review request, not a carrier application, an offer of insurance, or an approval, and that ${SITE.owner} may contact me to clarify anything I have marked uncertain or declined.`;

export interface ConsentSelection {
  marketingCall: boolean;
  marketingText: boolean;
  privacyAcknowledged: boolean;
  intakePermission: boolean;
}

/** When each permission was actually given. A missing entry means no timestamp. */
export type ConsentTimestamps = Partial<Record<ConsentId, string>>;

function record(
  id: ConsentId,
  label: string,
  text: string,
  granted: boolean,
  grantedAt: string | null,
  numberAuthorized?: string,
): ConsentRecord {
  return {
    id,
    label,
    granted,
    grantedAt,
    textVersion: CONSENT_VERSION,
    text,
    numberAuthorized,
  };
}

/**
 * Builds the consent evidence for a submission. Timestamps are only set for
 * permissions the customer actually gave; an unchecked marketing box records
 * `granted: false` with no timestamp, never an inferred value.
 */
export function buildConsentRecords(
  selection: ConsentSelection,
  phone: string | undefined,
  timestamps: ConsentTimestamps,
): ConsentRecord[] {
  const consents: ConsentRecord[] = [
    record(
      "intake_permission",
      "Preliminary intake and submission",
      INTAKE_PERMISSION_TEXT,
      selection.intakePermission,
      selection.intakePermission ? (timestamps.intake_permission ?? null) : null,
    ),
    record(
      "privacy_acknowledgement",
      "Privacy practices acknowledgement",
      PRIVACY_ACKNOWLEDGEMENT_TEXT,
      selection.privacyAcknowledged,
      selection.privacyAcknowledged ? (timestamps.privacy_acknowledgement ?? null) : null,
    ),
  ];

  // Only record a channel that was actually offered. Storing a marketing
  // record for a channel the product does not operate would invent consent
  // evidence for something the customer never saw.
  if (MARKETING_ENABLED && MARKETING.calls) {
    consents.push(
      record(
        "marketing_call",
        MARKETING_CALL_LABEL,
        MARKETING_DISCLOSURE_TEXT,
        selection.marketingCall,
        selection.marketingCall ? (timestamps.marketing_call ?? null) : null,
        selection.marketingCall ? phone : undefined,
      ),
    );
  }

  if (MARKETING_ENABLED && MARKETING.texts) {
    consents.push(
      record(
        "marketing_text",
        MARKETING_TEXT_LABEL,
        MARKETING_DISCLOSURE_TEXT,
        selection.marketingText,
        selection.marketingText ? (timestamps.marketing_text ?? null) : null,
        selection.marketingText ? phone : undefined,
      ),
    );
  }

  return consents;
}

export const CONTACT_PREFERENCES = [
  { value: "email", label: "Email" },
  { value: "phone", label: "A phone call" },
  { value: "text", label: "Text message" },
  { value: "chat", label: "Continue online" },
] as const;
