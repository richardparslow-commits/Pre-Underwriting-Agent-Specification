import { PREVIEW_MODE, SUBMIT_CASE_URL, SUPABASE_ANON_KEY, SITE } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";
import { buildConsentRecords, SUBMISSION_ACKNOWLEDGEMENT_TEXT, CONSENT_VERSION } from "@/features/consent/consentTexts";
import { buildDraftSummary } from "@/features/interview/engine";
import { QUESTION_BY_ID } from "@/features/interview/questionBank";
import type {
  Answers,
  CaseDraft,
  CaseRecord,
  CaseStatus,
  NotificationRecord,
  NotificationState,
  ReviewLogEntry,
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

function notificationFromRow(row: CaseRow): NotificationRecord {
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
        sourceText: question.sourceText,
        customerText: question.customerText,
        timeframe: question.timeframe,
        status: question.status,
        reviewStatus: question.reviewStatus,
        reviewNote: question.reviewNote,
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
      sourceText: question.sourceText,
      customerText: question.customerText,
      timeframe: question.timeframe,
      status: question.status,
      reviewStatus: question.reviewStatus,
      reviewNote: question.reviewNote,
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
    assistance: "Health-history review",
    coverageAmount: "$500,000",
    coveragePurpose: "Family protection",
    termPreference: "20-year term",
  };

  return {
    reference: "LPP-2026-SAMPLE",
    submittedAt,
    questionnaireVersion: "2026.10-draft.1",
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

async function submitLive(draft: CaseDraft): Promise<SubmissionReceipt> {
  if (!SUBMIT_CASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("The submission service is not configured.");
  }

  const response = await fetch(SUBMIT_CASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(draft),
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : "The case could not be submitted. Nothing was sent.";
    throw new Error(message);
  }

  if (!body || typeof body !== "object" || !("reference" in body)) {
    throw new Error("The submission service returned an unexpected response.");
  }

  return body as SubmissionReceipt;
}

export async function submitCase(draft: CaseDraft): Promise<SubmissionReceipt> {
  if (!PREVIEW_MODE) return submitLive(draft);

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
    draftSummary: buildDraftSummary(draft.answers),
  };

  previewCases.set(reference, record);

  return { reference, submittedAt, status: "submitted", notification };
}

// ---------------------------------------------------------------------------
// Reviewer portal
// ---------------------------------------------------------------------------

export async function listCases(): Promise<CaseListItem[]> {
  if (PREVIEW_MODE) {
    ensurePreviewSeed();
    return Array.from(previewCases.values())
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
  }

  if (!supabase) throw new Error("Sign-in is not configured.");

  const { data, error } = await supabase
    .from("cases")
    .select(
      "id, reference, submitted_at, status, payload, notification_state, notification_attempts, notification_detail, notification_updated_at, crisis_disclosure",
    )
    .order("submitted_at", { ascending: false })
    .limit(50);

  if (error) throw new Error("Cases could not be loaded.");

  return (data as CaseRow[]).map((row) => {
    const record = fromRow(row);
    return {
      reference: record.reference,
      submittedAt: record.submittedAt,
      status: record.status,
      notificationState: record.notification.state,
      crisisDisclosure: record.crisisDisclosure,
      firstName: record.lead.firstName,
      lastName: record.lead.lastName,
      residenceState: record.lead.state,
      unanswered: record.answers.filter((answer) => answer.disposition === "unresolved").length,
    };
  });
}

export async function getCase(reference: string): Promise<CaseRecord | null> {
  if (PREVIEW_MODE) {
    ensurePreviewSeed();
    return previewCases.get(reference) ?? null;
  }

  if (!supabase) throw new Error("Sign-in is not configured.");

  const { data, error } = await supabase
    .from("cases")
    .select(
      "id, reference, submitted_at, status, payload, notification_state, notification_attempts, notification_detail, notification_updated_at, crisis_disclosure",
    )
    .eq("reference", reference)
    .maybeSingle();

  if (error) throw new Error("This case could not be loaded.");
  if (!data) return null;

  const record = fromRow(data as CaseRow);

  const { data: log } = await supabase
    .from("case_review_log")
    .select("action, actor, created_at, note")
    .eq("case_id", (data as CaseRow).id)
    .order("created_at", { ascending: false })
    .limit(20);

  const reviewLog: ReviewLogEntry[] = Array.isArray(log)
    ? log.map((entry) => ({
        action: entry.action as ReviewLogEntry["action"],
        actor: String(entry.actor ?? ""),
        at: String(entry.created_at ?? ""),
        note: typeof entry.note === "string" ? entry.note : undefined,
      }))
    : [];

  return { ...record, reviewLog };
}

export async function recordReview(
  reference: string,
  action: ReviewLogEntry["action"],
  note?: string,
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
  });

  if (error) throw new Error("The review action could not be recorded.");
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export async function sendSignInLink(email: string): Promise<void> {
  if (!supabase) throw new Error("Sign-in is not configured.");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/portal` },
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
