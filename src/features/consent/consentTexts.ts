import { FEATURES, SITE } from "@/config/site";
import type { ConsentId, ConsentRecord } from "@/features/interview/types";

/**
 * Consent wording and versions.
 *
 * Every one of these is a draft pending counsel review. They are versioned so
 * that a submitted case records the exact words the customer saw, and each
 * purpose is separate: submitting the interview is never marketing consent,
 * and neither of them is a medical-record release.
 */
export const CONSENT_VERSION = "2026-10-a";
export const DISCLOSURE_VERSION = "2026-10-a";

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
 * TCPA written-consent draft. It must not be shown as final while
 * SITE.legalEntity is a placeholder, and it must describe only the methods the
 * business actually uses.
 */
export const MARKETING_DISCLOSURE_TEXT = `By checking either optional box and selecting "Submit for Richard's Review," I electronically sign and authorize ${SITE.legalEntity}, doing business as ${SITE.brand}, to contact me at the telephone number I provided with marketing information about life insurance, using the communication methods I selected. Calls and texts may use an automatic telephone dialing system; calls may use an artificial or prerecorded voice, including an AI-generated voice. My consent is not a condition of purchasing any goods or services. Message frequency varies. Message and data rates may apply. I may revoke consent at any time by replying STOP to a text, telling the caller, or contacting the business through its website contact page. See the Privacy Policy and Messaging Terms.`;

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
  return [
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
    record(
      "marketing_call",
      MARKETING_CALL_LABEL,
      MARKETING_DISCLOSURE_TEXT,
      selection.marketingCall,
      selection.marketingCall ? (timestamps.marketing_call ?? null) : null,
      selection.marketingCall ? phone : undefined,
    ),
    record(
      "marketing_text",
      MARKETING_TEXT_LABEL,
      MARKETING_DISCLOSURE_TEXT,
      selection.marketingText,
      selection.marketingText ? (timestamps.marketing_text ?? null) : null,
      selection.marketingText ? phone : undefined,
    ),
  ];
}

export const CONTACT_PREFERENCES = [
  { value: "email", label: "Email" },
  { value: "phone", label: "A phone call" },
  { value: "text", label: "Text message" },
  { value: "chat", label: "Continue online" },
] as const;
