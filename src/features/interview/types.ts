/**
 * Domain types for the Life Policy Pilot pre-underwriting intake.
 *
 * These types are the contract between the interview engine, the submitted
 * case record, the Supabase schema and the reviewer portal. Change them with
 * care: a submitted case is an immutable snapshot and must keep rendering
 * even after the question bank moves on.
 */

/** Bumped whenever the question bank or consent text changes. */
export const QUESTIONNAIRE_VERSION = "2026.10-draft.9";

export const SENSITIVE_NOTICE =
  "This question is held for legal and underwriting review before it can be asked in an automated interview.";

export type SectionId =
  | "identity"
  | "medical"
  | "mental"
  | "nicotine"
  | "alcohol"
  | "aviation"
  | "avocations"
  | "driving"
  | "criminal"
  | "financial"
  | "drugs"
  | "residency"
  | "occupation"
  | "military";

export interface Section {
  id: SectionId;
  title: string;
  shortTitle: string;
  blurb: string;
  order: number;
}

/**
 * The only answer states the product accepts. There is deliberately no
 * "skipped" state: a blank is never stored as "no".
 */
export type AnswerState = "yes" | "no" | "unknown" | "declined" | "not_applicable";

export const ANSWER_OPTIONS: Array<{
  value: AnswerState;
  label: string;
  hint: string;
}> = [
  { value: "yes", label: "Yes", hint: "This applies to me" },
  { value: "no", label: "No", hint: "This does not apply to me" },
  { value: "unknown", label: "I'm not sure", hint: "Recorded as uncertain, not as No" },
  { value: "declined", label: "Prefer not to answer", hint: "We will flag this for Richard" },
];

export type QuestionKind =
  | "yesno"
  | "short_text"
  | "long_text"
  | "date"
  | "number"
  | "single_choice"
  | "multi_choice";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface SubField {
  id: string;
  label: string;
  kind: QuestionKind;
  placeholder?: string;
  options?: QuestionOption[];
  /** Rendered inline under the label, e.g. "Approximate is fine." */
  hint?: string;
}

/**
 * Extra detail collected only when the customer selects Yes. Always labelled
 * as supplemental: the source PDF does not contain these.
 */
export interface DetailPrompt {
  id: string;
  label: string;
  kind: QuestionKind;
  placeholder?: string;
  options?: QuestionOption[];
  hint?: string;
}

export interface Question {
  /** Stable identifier, e.g. "MED-04". Never reused or renumbered. */
  id: string;
  section: SectionId;
  /** "Detialed-Life-insurance-Questions.pdf, p.2 — medical history block" */
  sourceRef: string;
  /** Approved customer-facing wording. Must not widen or narrow the source. */
  customerText: string;
  helpText?: string;
  /** "Ever", "Past 5 years", "Past 12 months" … */
  timeframe?: string;
  exclusions?: string[];
  kind: QuestionKind;
  options?: QuestionOption[];
  placeholder?: string;
  /**
   * True when the question is collected entirely through `fields`. The engine
   * renders the fields as the input set and ignores `kind`/`options`.
   */
  compound?: boolean;
  /** Compound questions are collected component-by-component. */
  fields?: SubField[];
  detailPrompts?: DetailPrompt[];
  /** Ask only when another question has one of these answers. */
  askWhen?: { questionId: string; includes: Array<AnswerState | string> };
  reviewStatus: "approved" | "human_review_required";
  /** Required when reviewStatus is human_review_required. */
  reviewNote?: string;
  sensitive?: boolean;
  /** Selecting Yes pauses the interview and shows the crisis panel. */
  crisisFollowUp?: boolean;
  /** Core = traced to the source questionnaire. Supplemental = added by LPP. */
  status: "core" | "supplemental";
  /**
   * False until a named reviewer has signed off on this row's reconciliation
   * record. Reconciled is not the same as approved: see
   * docs/question-bank-reconciliation.md.
   */
  sourceVerified: boolean;
}

/** Per-question answer held in the browser while the interview is in progress. */
export interface AnswerRecord {
  state?: AnswerState;
  value?: string;
  values?: string[];
  fields?: Record<string, string>;
  details?: Record<string, string>;
  updatedAt: string;
}

export type Answers = Record<string, AnswerRecord>;

/** Disposition recorded in the submitted case. */
export type Disposition =
  | "answered"
  | "unknown"
  | "declined"
  | "not_applicable"
  | "unresolved"
  | "held_for_review"
  | "not_asked";

export interface LeadDetails {
  firstName: string;
  lastName: string;
  state: string;
  /** Collected before any health question so the adult boundary is enforced early. */
  dateOfBirth: string;
  /** Explicit adult-self attestation; "relationship: self" alone is not proof. */
  adultAttested: boolean;
  email: string;
  preferredContact: "email" | "phone" | "text" | "chat";
  phone?: string;
  preferredContactTime?: string;
  timeZone?: string;
  assistance?: string;
  coverageAmount?: string;
  coveragePurpose?: string;
  termPreference?: string;
}

export type ConsentId =
  | "intake_permission"
  | "privacy_acknowledgement"
  | "marketing_call"
  | "marketing_text"
  | "medical_record_release";

export interface ConsentRecord {
  id: ConsentId;
  label: string;
  granted: boolean;
  /** Null for optional marketing consent that was left unchecked. */
  grantedAt: string | null;
  textVersion: string;
  /** The exact wording displayed, retained as evidence. */
  text: string;
  /** Only set when a channel-specific number was authorized. */
  numberAuthorized?: string;
}

export interface SubmissionAcknowledgement {
  id: "review_confirmed" | "submission_requested";
  text: string;
  textVersion: string;
  timestamp: string;
}

export interface SubmittedAnswer {
  questionId: string;
  section: SectionId;
  sourceRef: string;
  /** Attached by the server from its canonical bank; absent in preview samples. */
  sourceText?: string;
  customerText: string;
  timeframe?: string;
  status: "core" | "supplemental";
  reviewStatus: Question["reviewStatus"];
  reviewNote?: string;
  sensitive?: boolean;
  disposition: Disposition;
  /** Structured state for branch evaluation; never inferred from the prose. */
  answerState?: AnswerState;
  /** Selected option values for a multi-choice question. */
  answerValues?: string[];
  /** Human-readable answer, e.g. "Yes" or "March 2024". */
  answerText: string;
  /** Component answers for compound questions, in display order. */
  fields?: Array<{ id: string; label: string; value: string }>;
  /** Supplemental details keyed by prompt label. */
  details?: Array<{ label: string; value: string }>;
}

export interface CaseFlag {
  id: string;
  label: string;
  detail: string;
  severity: "info" | "attention" | "urgent";
}

export interface DraftSummary {
  generatedAt: string;
  line: string;
  sections: Array<{
    section: SectionId;
    title: string;
    points: Array<{ text: string; questionIds: string[] }>;
  }>;
  flags: CaseFlag[];
}

/**
 * What the browser sends to the server. No case reference: the server issues
 * that, so a client cannot choose or collide with another case's reference.
 */
export interface CaseDraft {
  questionnaireVersion: string;
  startedAt: string;
  completedAt: string;
  lead: LeadDetails;
  answers: SubmittedAnswer[];
  consents: ConsentRecord[];
  acknowledgements: SubmissionAcknowledgement[];
  flags: CaseFlag[];
  /** True when the customer disclosed current thoughts of self-harm. */
  crisisDisclosure: boolean;
  /** Explicit attestation that the customer is 18+ and answering for themselves. */
  adultAttested: boolean;
  /** How the customer says they are related to the person the questions cover. */
  relationship: "self" | "other";
}

export type NotificationState =
  | "not_sent"
  | "queued"
  | "accepted"
  | "delivered"
  | "failed";

export interface NotificationRecord {
  state: NotificationState;
  updatedAt: string;
  /** Safe, non-clinical detail for the customer and reviewer. */
  detail?: string;
  attempts: number;
}

export type CaseStatus =
  | "saved"
  | "submitted"
  | "reviewed"
  | "needs_clarification";

export interface ReviewLogEntry {
  action: "opened" | "marked_reviewed" | "requested_clarification";
  actor: string;
  at: string;
  note?: string;
}

/**
 * A customer correction recorded after submission. It sits beside the
 * immutable snapshot; it never rewrites the original answer.
 */
export interface CorrectionRecord {
  id: number;
  detail: string;
  recordedBy: string;
  recordedAt: string;
}

export interface CaseRecord extends CaseDraft {
  reference: string;
  submittedAt: string;
  status: CaseStatus;
  notification: NotificationRecord;
  reviewLog: ReviewLogEntry[];
  corrections: CorrectionRecord[];
  draftSummary: DraftSummary;
  /** True only for the clearly-labelled non-customer case used in previews. */
  sample?: boolean;
}

/** Non-sensitive receipt returned to the customer after submission. */
export interface SubmissionReceipt {
  reference: string;
  submittedAt: string;
  notification: NotificationRecord;
  status: CaseStatus;
}
