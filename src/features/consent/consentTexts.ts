import { FEATURES, MARKETING, SITE } from "@/config/site";
import {
  buildConsentRecords as buildConsentRecordsFrom,
  buildMarketingDisclosure,
  type ConsentContext,
  type ConsentSelection,
  type ConsentTimestamps,
} from "./marketingConsent";

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

/** Marketing labels and selection types are defined with the pure builder. */
export { MARKETING_CALL_LABEL, MARKETING_TEXT_LABEL } from "./marketingConsent";
export type { ConsentSelection, ConsentTimestamps } from "./marketingConsent";

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

const CONSENT_CONTEXT: ConsentContext = {
  legalEntity: SITE.legalEntity,
  brand: SITE.brand,
  reviewerEmail: SITE.reviewerEmail,
  textVersion: CONSENT_VERSION,
  channels: {
    calls: MARKETING.calls,
    texts: MARKETING.texts,
    autodialer: MARKETING.autodialer,
    aiVoice: MARKETING.aiVoice,
  },
  intakePermissionText: INTAKE_PERMISSION_TEXT,
  privacyAcknowledgementText: PRIVACY_ACKNOWLEDGEMENT_TEXT,
};

/**
 * The exact TCPA wording displayed in this build. Empty when marketing is off,
 * which is also when no marketing consent controls are rendered.
 */
export const MARKETING_DISCLOSURE_TEXT = buildMarketingDisclosure(CONSENT_CONTEXT);

export const SUBMISSION_ACKNOWLEDGEMENT_TEXT = `I have reviewed the answers shown on this page and they are complete and accurate to the best of my knowledge. I understand this is a preliminary review request, not a carrier application, an offer of insurance, or an approval, and that ${SITE.owner} may contact me to clarify anything I have marked uncertain or declined.`;

/**
 * Builds consent evidence for this build's configuration. Marketing records
 * appear only for channels enabled in config and only when a real seller is
 * named; a placeholder entity keeps marketing off entirely.
 */
export function buildConsentRecords(
  selection: ConsentSelection,
  phone: string | undefined,
  timestamps: ConsentTimestamps,
): ReturnType<typeof buildConsentRecordsFrom> {
  return buildConsentRecordsFrom(CONSENT_CONTEXT, selection, phone, timestamps);
}

export const CONTACT_PREFERENCES = [
  { value: "email", label: "Email" },
  { value: "phone", label: "A phone call" },
  { value: "text", label: "Text message" },
  { value: "chat", label: "Continue online" },
] as const;
