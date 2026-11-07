import { correctionInput, writeCorrection } from "./correctionSubmission";
import { initialWithdrawals, readWithdrawals, type WithdrawalPage } from "./withdrawalHistory";
import { readCaseQueue } from "./queuePaging";
import { initialCorrections, readCorrections, type CorrectionPage } from "./correctionHistory";
import { initialReviewHistory, readReviewHistory, readSafetyDisclosures } from "./reviewerVisibility";
import type { ReviewHistoryPage, SafetyCursor, SafetyPage } from "./reviewerVisibility";
import { PREVIEW_MODE, SUBMIT_CASE_URL, SUPABASE_ANON_KEY, SITE } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";
import { buildConsentRecords, SUBMISSION_ACKNOWLEDGEMENT_TEXT, CONSENT_VERSION } from "@/features/consent/consentTexts";
import { buildDraftSummary } from "@/features/interview/engine";
import { QUESTION_BY_ID } from "@/features/interview/questionBank";
import { QUESTIONNAIRE_VERSION } from "@/features/interview/types";
import type {
  Answers,
  CaseDraft,
  CaseRecord,
  CaseStatus,
  CorrectionCursor,
  WithdrawalCursor,
  NotificationRecord,
  NotificationState,
  ReviewLogEntry,
  ReviewHistoryCursor,
  SubmittedAnswer,
  SubmissionReceipt,
} from "@/features/interview/types";

/**
 * Two backends, one interface:
 *
 *  * live    — Lovable Cloud / Supabase (case store behind RLS + submit-case
 *              edge function). The browser never sees a service-role key and
 *              never writes a case directly.
 *  * preview — an in-memory store for local development and design review.
 *              Nothing leaves the tab, nothing is emailed, and the UI says so.
 *
 * Submission is deliberately the only customer-facing write, and it goes
 * through the server so the reference, timestamps and recipient are not
 * client-controlled.
 */

export interface CasePage {
  items: CaseListItem[];
  /** Total rows visible to this reviewer, not just this page. */
  total: number;
  /** Newest visible case identity at the metadata read; undefined for legacy loaders. */
  headCursor?: string | null;
  /** Null means no older page remains; concurrent new cases may still require refresh. */
  nextCursor: string | null;
}

export interface CaseListItem {
  reference: string;
  submittedAt: string;
  status: CaseStatus;
  notificationState: NotificationState;
  crisisDisclosure: boolean;
  firstName: string;
  lastName: string;
  residenceState: string;
  unanswered: number;
  sample?: boolean;
}

interface CaseRow {
  id: string;
  reference: string;
  submitted_at: string;
  status: CaseStatus;
  payload: CaseRecord;
  notification_state: NotificationState;
  notification_attempts: number;
  notification_detail: string | null;
  notification_updated_at: string | null;
  crisis_disclosure: boolean;
}

function notificationFromRow(
  row: Pick<
    CaseRow,
    | "submitted_at"
    | "notification_state"
    | "notification_attempts"
    | "notification_detail"
    | "notification_updated_at"
  >,
): NotificationRecord {
  let detail: string | undefined;
  if (row.notification_detail) {
    try {
      const parsed: unknown = JSON.parse(row.notification_detail);
      if (parsed && typeof parsed === "object" && "note" in parsed) {
        const note = (parsed as { note?: unknown }).note;
        if (typeof note === "string" && note) detail = note;
      }
    } catch {
      detail = "Status recorded";
    }
  }

  return {
    state: row.notification_state,
    updatedAt: row.notification_updated_at ?? row.submitted_at,
    detail,
    attempts: row.notification_attempts,
  };
}

function fromRow(row: CaseRow): CaseRecord {
  const answers = Array.isArray(row.payload?.answers) ? row.payload.answers : [];
  return {
    ...row.payload,
    reference: row.reference,
    submittedAt: row.submitted_at,
    status: row.status,
    crisisDisclosure: row.crisis_disclosure,
    notification: notificationFromRow(row),
    reviewLog: row.payload?.reviewLog ?? [],
    corrections: row.payload?.corrections ?? [],
    marketingRevocations: [],
    draftSummary: buildDraftSummary(answers),
  };
}

// ---------------------------------------------------------------------------
// Preview store (memory only: no health answers in localStorage/sessionStorage)
// ---------------------------------------------------------------------------

const previewCases = new Map<string, CaseRecord>();
let previewSeeded = false;

const REFERENCE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function previewReference(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]).join("");
  return `LPP-${new Date().getUTCFullYear()}-${suffix}`;
}

function buildSampleCase(): CaseRecord {
  const submittedAt = new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString();
  const answers: Answers = {
    "ID-01": { value: "1979-04-12", updatedAt: submittedAt },
    "ID-02": { value: "Austin, Texas", updatedAt: submittedAt },
    "ID-03": { value: "TX", updatedAt: submittedAt },
    "MED-01": {
      state: "yes",
      details: { what: "Knee arthroscopy", when: "02/2026", pending: "no" },
      updatedAt: submittedAt,
    },
    "MED-02": { state: "yes", details: { procedure: "Knee arthroscopy", when: "2026", outcome: "resolved" }, updatedAt: submittedAt },
    "MED-03": {
      state: "yes",
      fields: { condition: "High blood pressure", diagnosisYear: "2019", treatment: "medication", currentStatus: "stable" },
      updatedAt: submittedAt,
    },
    "MED-04": { state: "no", updatedAt: submittedAt },
    "MED-06": { state: "no", updatedAt: submittedAt },
    "MED-08": { state: "no", updatedAt: submittedAt },
    "MED-09": { value: "Lisinopril 10 mg, once daily", updatedAt: submittedAt },
    "MED-10": { state: "no", updatedAt: submittedAt },
    "MH-01": { state: "no", updatedAt: submittedAt },
    "NIC-01": { state: "no", updatedAt: submittedAt },
    "NIC-02": { state: "no", updatedAt: submittedAt },
    "ALC-01": { state: "yes", details: { frequency: "weekly" }, updatedAt: submittedAt },
    "ALC-02": { state: "no", updatedAt: submittedAt },
    "ALC-03": { state: "no", updatedAt: submittedAt },
    "AVI-01": { state: "no", updatedAt: submittedAt },
    "AVO-01": { values: ["none"], updatedAt: submittedAt },
    "DRV-01": { state: "no", updatedAt: submittedAt },
    "DRV-02": { state: "no", updatedAt: submittedAt },
    "DRV-03": { state: "no", updatedAt: submittedAt },
    "CRM-01": { state: "no", updatedAt: submittedAt },
    "CRM-02": { state: "no", updatedAt: submittedAt },
    "FIN-01": { state: "no", updatedAt: submittedAt },
    "DRG-01": { state: "no", updatedAt: submittedAt },
    "DRG-02": { state: "no", updatedAt: submittedAt },
    "DRG-03": { state: "no", updatedAt: submittedAt },
    "RES-01": { value: "citizen", updatedAt: submittedAt },
    "RES-02": { state: "no", updatedAt: submittedAt },
    "OCC-01": {
      fields: { jobTitle: "Operations manager", duties: "Warehouse scheduling and vendor management", employerType: "Employed", income: "About $98,000", hours: "45" },
      updatedAt: submittedAt,
    },
    "OCC-02": { state: "no", updatedAt: submittedAt },
    "MIL-01": { state: "no", updatedAt: submittedAt },
  };

  const submitted = Object.entries(answers).flatMap(([questionId, record]) => {
    const question = QUESTION_BY_ID[questionId];
    if (!question) return [];

    const answerText =
      question.kind === "yesno"
        ? record.state === "yes"
          ? "Yes"
          : record.state === "no"
            ? "No"
            : record.state === "unknown"
              ? "I'm not sure"
              : "Prefer not to answer"
        : record.values?.join(", ") || record.value || "Details provided";

    return [
      {
        questionId,
        section: question.section,
        sourceRef: question.sourceRef,
        customerText: question.customerText,
        timeframe: question.timeframe,
        status: question.status,
        reviewStatus: question.reviewStatus,
        sensitive: question.sensitive ? true : undefined,
        disposition: (record.state === "unknown" ? "unknown" : "answered") as SubmittedAnswer["disposition"],
        answerText: answerText === "Details provided" ? "Details provided" : answerText,
        fields: question.fields?.flatMap((field) => {
          const value = record.fields?.[field.id];
          return value ? [{ id: field.id, label: field.label, value }] : [];
        }),
        details: question.detailPrompts?.flatMap((prompt) => {
          const value = record.details?.[prompt.id];
          if (!value) return [];
          const label = prompt.options?.find((option) => option.value === value)?.label ?? value;
          return [{ label: prompt.label, value: label }];
        }),
      } satisfies SubmittedAnswer,
    ];
  });

  const allAnswers: SubmittedAnswer[] = Object.values(QUESTION_BY_ID).map((question) => {
    const found = submitted.find((answer) => answer.questionId === question.id);
    if (found) return found;
    return {
      questionId: question.id,
      section: question.section,
      sourceRef: question.sourceRef,
      customerText: question.customerText,
      timeframe: question.timeframe,
      status: question.status,
      reviewStatus: question.reviewStatus,
      sensitive: question.sensitive ? true : undefined,
      disposition: question.reviewStatus === "human_review_required" ? "held_for_review" : "unresolved",
      answerText:
        question.reviewStatus === "human_review_required"
          ? "Held for human review — not asked"
          : "Not answered",
    } satisfies SubmittedAnswer;
  });

  const lead = {
    firstName: "Sample",
    lastName: "Non-customer test case",
    state: "TX",
    email: "test-case@example.com",
    preferredContact: "email" as const,
    dateOfBirth: "1979-04-12",
    adultAttested: true,
    assistance: "Health-history review",
    coverageAmount: "$500,000",
    coveragePurpose: "Family protection",
    termPreference: "20-year term",
  };

  return {
    reference: "LPP-2026-SAMPLE",
    submittedAt,
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    startedAt: new Date(Date.parse(submittedAt) - 1000 * 60 * 14).toISOString(),
    completedAt: submittedAt,
    lead,
    answers: allAnswers,
    consents: buildConsentRecords(
      { intakePermission: true, privacyAcknowledged: true, marketingCall: false, marketingText: false },
      undefined,
      { intake_permission: submittedAt, privacy_acknowledgement: submittedAt },
    ),
    acknowledgements: [
      {
        id: "submission_requested",
        text: SUBMISSION_ACKNOWLEDGEMENT_TEXT,
        textVersion: CONSENT_VERSION,
        timestamp: submittedAt,
      },
    ],
    adultAttested: true,
    flags: [
      {
        id: "sample",
        label: "Non-customer test data",
        detail:
          "This case was generated for design review. It is not a real person and must be deleted before production use.",
        severity: "info",
      },
    ],
    crisisDisclosure: false,
    relationship: "self",
    status: "submitted",
    notification: {
      state: "not_sent",
      updatedAt: submittedAt,
      detail: "Preview data — no notification was sent",
      attempts: 0,
    },
    reviewLog: [
      { action: "opened", actor: SITE.reviewerEmail, at: new Date(Date.parse(submittedAt) + 1000 * 60 * 30).toISOString() },
    ],
    corrections: [
      {
        id: 1,
        detail:
          "Sample correction: the customer asked us to note the knee procedure was on the left knee.",
        recordedBy: SITE.reviewerEmail,
        recordedAt: new Date(Date.parse(submittedAt) + 1000 * 60 * 45).toISOString(),
      },
    ],
    marketingRevocations: [],
    draftSummary: buildDraftSummary(allAnswers),
    sample: true,
  };
}

function ensurePreviewSeed(): void {
  if (previewSeeded) return;
  previewSeeded = true;
  const sample = buildSampleCase();
  previewCases.set(sample.reference, sample);
}

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------

const UNCONFIRMED_SUBMISSION =
  "We could not confirm whether this case was saved. Retry without changing your answers.";
const CONNECTION_LOST =
  "The connection was lost before the case was saved. Reconnect and submit again.";
// The intake relay abandons a request after 15 seconds; the browser must not
// keep the prospect on the waiting screen longer than that.
const SUBMIT_TIMEOUT_MS = 15_000;

function isSubmissionReceipt(value: unknown): value is SubmissionReceipt {
  if (!value || typeof value !== "object") return false;
  const { reference, submittedAt, status, notification } = value as Record<string, unknown>;
  if (typeof reference !== "string" || !reference.trim() ||
      typeof submittedAt !== "string" || !Number.isFinite(Date.parse(submittedAt)) ||
      typeof status !== "string" || !["saved", "submitted", "reviewed", "needs_clarification"].includes(status) ||
      !notification || typeof notification !== "object") {
    return false;
  }

  const { state, updatedAt, attempts, detail } = notification as Record<string, unknown>;
  return typeof state === "string" && ["not_sent", "queued", "accepted", "delivered", "failed"].includes(state) &&
    typeof updatedAt === "string" && Number.isFinite(Date.parse(updatedAt)) &&
    typeof attempts === "number" && Number.isSafeInteger(attempts) && attempts >= 0 &&
    (detail === undefined || typeof detail === "string");
}

async function submitLive(draft: CaseDraft, submissionKey: string): Promise<SubmissionReceipt> {
  if (!SUBMIT_CASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("The submission service is not configured.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
  let response: Response;
  let body: unknown;
  try {
    response = await fetch(SUBMIT_CASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Idempotency-Key": submissionKey,
      },
      body: JSON.stringify(draft),
      signal: controller.signal,
    });
    body = await response.json().catch(() => null);
  } catch (error) {
    // A timeout is uncertain: the case may already be saved, so retrying the
    // same key is safe. A lost connection is named as such so the prospect
    // knows to reconnect instead of reading it as a server rejection.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(UNCONFIRMED_SUBMISSION);
    }
    throw new Error(CONNECTION_LOST);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : UNCONFIRMED_SUBMISSION;
    throw new Error(message);
  }

  if (!isSubmissionReceipt(body)) {
    throw new Error(UNCONFIRMED_SUBMISSION);
  }

  return body;
}

export async function submitCase(
  draft: CaseDraft,
  submissionKey: string,
): Promise<SubmissionReceipt> {
  if (!PREVIEW_MODE) return submitLive(draft, submissionKey);

  ensurePreviewSeed();

  const reference = previewReference();
  const submittedAt = new Date().toISOString();
  const notification: NotificationRecord = {
    state: "not_sent",
    updatedAt: submittedAt,
    detail: "Preview mode: no email provider is connected, so nothing was sent.",
    attempts: 0,
  };

  const record: CaseRecord = {
    ...draft,
    reference,
    submittedAt,
    status: "submitted",
    notification,
    reviewLog: [],
    corrections: [],
    marketingRevocations: [],
    draftSummary: buildDraftSummary(draft.answers),
  };

  previewCases.set(reference, record);

  return { reference, submittedAt, status: "submitted", notification };
}

// ---------------------------------------------------------------------------
// Reviewer portal
// ---------------------------------------------------------------------------

/**
 * One page of the reviewer queue.
 *
 * Keyset pagination on (submitted_at, reference), never an offset: a case
 * submitted while the reviewer pages through must not shift a row out of the
 * next page and hide it. `total` is the exact visible count so the UI can say
 * "showing N of M" instead of silently truncating.
 */
export async function listCases(cursor?: string): Promise<CasePage> {
  if (PREVIEW_MODE) {
    ensurePreviewSeed();
    const items = Array.from(previewCases.values())
      .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
      .map((record) => ({
        reference: record.reference,
        submittedAt: record.submittedAt,
        status: record.status,
        notificationState: record.notification.state,
        crisisDisclosure: record.crisisDisclosure,
        firstName: record.lead.firstName,
        lastName: record.lead.lastName,
        residenceState: record.lead.state,
        unanswered: record.answers.filter((answer) => answer.disposition === "unresolved").length,
        sample: record.sample,
      }));
    return { items, total: items.length, nextCursor: null, headCursor: items[0] ? `${items[0].submittedAt}|${items[0].reference}` : null };
  }

  if (!supabase) throw new Error("Sign-in is not configured.");

  return readCaseQueue(supabase, cursor);
}

/** Independent of normal queue pagination; no full case payload is selected. */
export async function listSafetyDisclosures(cursor?: SafetyCursor): Promise<SafetyPage> {
  if (PREVIEW_MODE) {
    ensurePreviewSeed();
    const items = [...previewCases.values()].filter((record) => record.crisisDisclosure)
      .map(({ reference, submittedAt, status }) => ({ reference, submittedAt, status }));
    return { items, total: items.length, nextCursor: null };
  }
  if (!supabase) throw new Error("Safety disclosures could not be checked: sign-in is not configured.");
  return readSafetyDisclosures(supabase, cursor);
}

export async function listCaseReviewHistory(reference: string, cursor?: ReviewHistoryCursor): Promise<ReviewHistoryPage> {
  if (PREVIEW_MODE) {
    ensurePreviewSeed();
    return { items: previewCases.get(reference)?.reviewLog ?? [], nextCursor: null };
  }
  if (!supabase) throw new Error("Review history could not be loaded: sign-in is not configured.");
  return readReviewHistory(supabase, reference, cursor);
}

export async function listCaseCorrections(reference: string, cursor: CorrectionCursor): Promise<CorrectionPage> {
  if (PREVIEW_MODE) {
    ensurePreviewSeed();
    return { items: previewCases.get(reference)?.corrections ?? [], nextCursor: null };
  }
  if (!supabase) throw new Error("Corrections could not be loaded: sign-in is not configured.");
  return readCorrections(supabase, reference, cursor);
}

export async function listCaseWithdrawals(reference: string, cursor: WithdrawalCursor): Promise<WithdrawalPage> {
  if (PREVIEW_MODE) {
    ensurePreviewSeed();
    return { items: previewCases.get(reference)?.marketingRevocations ?? [], nextCursor: null };
  }
  if (!supabase) throw new Error("Withdrawals could not be loaded: sign-in is not configured.");
  return readWithdrawals(supabase, reference, cursor);
}

export async function getCase(reference: string): Promise<CaseRecord | null> {
  if (PREVIEW_MODE) {
    ensurePreviewSeed();
    const record = previewCases.get(reference);
    return record ? { ...record, reviewHistoryCursor: null, correctionsCursor: null,
      revocationsCursor: null, latestPhoneRevocation: record.marketingRevocations.find(x=>x.channel === "phone") ?? null } : null;
  }

  if (!supabase) throw new Error("Sign-in is not configured.");

  // The database checks AAL2 and allowlist membership and records the opening
  // in the same transaction before returning any sensitive case content.
  const { data, error } = await supabase.rpc("open_case_for_review", {
    p_reference: reference,
  });
  if (error) throw new Error("This case could not be loaded.");
  if (!data) return null;

  const result = data as {
    case: CaseRow;
    review_log_cursor?: unknown;
    review_log: Array<{ id?: string; action: string; actor: string; created_at: string; note: string | null }>;
    corrections: Array<{ id: number; detail: string; recorded_by: string; created_at: string }>;
    revocations: Array<{ channel: string; reason: string | null; source: string; recorded_by: string; created_at: string }>;
  };
  const record = fromRow(result.case);
  const { reviewLog, reviewHistoryCursor } = initialReviewHistory(result);

  const { corrections, correctionsCursor } = initialCorrections(result);

  return {
    ...record, reviewLog, corrections, reviewHistoryCursor, correctionsCursor,
    ...initialWithdrawals(result),
  };
}

const previewCorrectionRequests = new Map<string, string>();
export async function recordCorrection(reference: string, detail: string, requestId: string): Promise<void> {
  const trimmed = correctionInput(detail, requestId);

  if (PREVIEW_MODE) {
    ensurePreviewSeed();
    const record = previewCases.get(reference);
    if (!record) throw new Error("This case could not be found.");
    const requestKey = `${reference}:${requestId}`;
    const prior = previewCorrectionRequests.get(requestKey);
    if (prior !== undefined) {
      if (prior !== trimmed) throw new Error("Correction request already used for different content");
      return;
    }
    previewCorrectionRequests.set(requestKey, trimmed);
    record.corrections = [
      {
        id: record.corrections.length + 1,
        detail: trimmed,
        recordedBy: SITE.reviewerEmail,
        recordedAt: new Date().toISOString(),
      },
      ...record.corrections,
    ];
    return;
  }

  if (!supabase) throw new Error("Sign-in is not configured.");

  await writeCorrection(supabase, reference, trimmed, requestId);
}

export async function recordReview(
  reference: string,
  action: ReviewLogEntry["action"],
  note?: string,
  expectedStatus?: CaseStatus,
): Promise<void> {
  if (PREVIEW_MODE) {
    const record = previewCases.get(reference);
    if (!record) throw new Error("This case could not be found.");
    record.reviewLog = [
      { action, actor: SITE.reviewerEmail, at: new Date().toISOString(), note },
      ...record.reviewLog,
    ];
    if (action === "marked_reviewed") record.status = "reviewed";
    if (action === "requested_clarification") record.status = "needs_clarification";
    return;
  }

  if (!supabase) throw new Error("Sign-in is not configured.");

  const { error } = await supabase.rpc("record_case_review", {
    p_reference: reference,
    p_action: action,
    p_note: note ?? null,
    // The database refuses a decision taken on a page whose status has moved
    // on, instead of applying it over a clarification request or correction.
    p_expected_status: expectedStatus ?? null,
  });

  if (error) {
    const message = error.message ?? "";
    if (/changed since you opened/i.test(message)) throw new Error(message);
    throw new Error("The review action could not be recorded.");
  }
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export async function sendSignInLink(email: string): Promise<void> {
  if (!supabase) throw new Error("Sign-in is not configured.");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // A reviewer address must already exist. Without this, any address gets
      // an account created on first sign-in, which defeats the allowlist even
      // though RLS still blocks case data.
      shouldCreateUser: false,
      emailRedirectTo: `${window.location.origin}/portal`,
    },
  });
  if (error) throw new Error("The sign-in link could not be sent.");
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function currentEmail(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.email ?? null;
}
