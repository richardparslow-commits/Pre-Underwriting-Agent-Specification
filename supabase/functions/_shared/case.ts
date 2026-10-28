/**
 * Shared helpers for the Life Policy Pilot intake functions.
 *
 * Everything here is defensive by design: the intake endpoint is public, so
 * the payload is treated as hostile, rebuilt from an allowlist of fields, and
 * never logged. Health answers must not reach application logs or error
 * reports.
 */

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import { QUESTIONNAIRE_VERSION, SERVER_BANK } from "./bank.generated.ts";
import { CONSENT_POLICY } from "./policy.generated.ts";

// -----------------------------------------------------------------------------
// CORS
// -----------------------------------------------------------------------------

/** Local development origins, allowed alongside the configured APP_ORIGIN. */
const DEV_ORIGINS = ["http://localhost:8080", "http://localhost:5173"];

function configuredOrigins(): string[] {
  const raw = Deno.env.get("APP_ORIGIN") ?? "";
  return raw
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/**
 * Resolves the caller's Origin to the value that may be echoed back in
 * Access-Control-Allow-Origin, or null when the origin is not approved.
 * Returns null when APP_ORIGIN is unset in production so the endpoint fails
 * closed rather than allowing every site.
 */
export function resolveOrigin(req: Request): string | null {
  const origin = (req.headers.get("origin") ?? "").replace(/\/$/, "");
  if (!origin) return null;

  const allowed = configuredOrigins();
  const isLocal = DEV_ORIGINS.includes(origin);
  const env = Deno.env.get("ENVIRONMENT") ?? "production";
  const localAllowed = isLocal && env !== "production";

  if (allowed.includes(origin) || localAllowed) return origin;
  return null;
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null,
): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  if (origin) Object.assign(headers, corsHeaders(origin));

  return new Response(JSON.stringify(body), { status, headers });
}

// -----------------------------------------------------------------------------
// Request body
// -----------------------------------------------------------------------------

export type BodyReadResult =
  | { ok: true; text: string }
  | { ok: false; reason: "too_large" | "unreadable" };

/**
 * Reads a request body while enforcing a byte budget. Counting JavaScript
 * characters is not a byte cap: one emoji or CJK character can occupy several
 * UTF-8 bytes. The reader is cancelled as soon as the budget is exceeded, so
 * the function does not buffer an oversized body just to reject it.
 */
export async function readBodyWithLimit(
  req: Request,
  maxBytes: number,
): Promise<BodyReadResult> {
  if (!req.body) return { ok: true, text: "" };

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "unreadable" };
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, text: new TextDecoder().decode(merged) };
}

/** Explicit launch lock: no real submission until the questionnaire is approved. */
export function questionnaireApproved(): boolean {
  return Deno.env.get("QUESTIONNAIRE_APPROVED") === "true";
}

// -----------------------------------------------------------------------------
// Payload types (mirrors src/features/interview/types.ts)
// -----------------------------------------------------------------------------

export interface ServerLead {
  firstName: string;
  lastName: string;
  state: string;
  email: string;
  preferredContact: "email" | "phone" | "text" | "chat";
  dateOfBirth: string;
  phone?: string;
  preferredContactTime?: string;
  timeZone?: string;
  assistance?: string;
  coverageAmount?: string;
  coveragePurpose?: string;
  termPreference?: string;
}

export interface ServerAnswer {
  questionId: string;
  section: string;
  sourceRef: string;
  sourceText: string;
  customerText: string;
  timeframe?: string;
  status: "core" | "supplemental";
  reviewStatus: "approved" | "human_review_required";
  reviewNote?: string;
  sensitive?: boolean;
  disposition: string;
  answerText: string;
  answerState?: string;
  answerValues?: string[];
  fields?: Array<{ id: string; label: string; value: string }>;
  details?: Array<{ label: string; value: string }>;
}

export interface ServerConsent {
  id: string;
  label: string;
  granted: boolean;
  grantedAt: string | null;
  textVersion: string;
  text: string;
  numberAuthorized?: string;
}

export interface ServerAcknowledgement {
  id: string;
  text: string;
  textVersion: string;
  timestamp: string;
}

export interface ServerFlag {
  id: string;
  label: string;
  detail: string;
  severity: "info" | "attention" | "urgent";
}

export interface ServerDraft {
  questionnaireVersion: string;
  startedAt: string;
  completedAt: string;
  lead: ServerLead;
  answers: ServerAnswer[];
  consents: ServerConsent[];
  acknowledgements: ServerAcknowledgement[];
  flags: ServerFlag[];
  crisisDisclosure: boolean;
  adultAttested: true;
  relationship: "self";
  serverReceivedAt?: string;
}

export type ValidationResult =
  | { ok: true; draft: ServerDraft }
  | { ok: false; reason: string };

// -----------------------------------------------------------------------------
// Field validation helpers
// -----------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max = 2000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function optionalText(value: unknown, max = 2000): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return undefined;
  return trimmed;
}

function isoish(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}

function normalisePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

// -----------------------------------------------------------------------------
// Draft validation
// -----------------------------------------------------------------------------

const MAX_ANSWERS = SERVER_BANK.length;
const MAX_TEXT = 4000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const MAX_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The 50 states plus DC. A free-text two-letter "state" is not a jurisdiction
 * check; an unknown code must never reach the case store.
 */
const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI",
  "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN",
  "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH",
  "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
  "WV", "WI", "WY",
]);

const DISPOSITIONS = new Set([
  "answered",
  "unknown",
  "declined",
  "not_applicable",
  "unresolved",
  "held_for_review",
  "not_asked",
]);

const ANSWER_STATES = new Set(["yes", "no", "unknown", "declined", "not_applicable"]);

const SERVER_BY_ID = new Map(SERVER_BANK.map((question) => [question.id, question]));

type AnswerStateValue = "yes" | "no" | "unknown" | "declined" | "not_applicable";

interface ParsedAnswer {
  question: (typeof SERVER_BANK)[number];
  disposition: string;
  state?: AnswerStateValue;
  values?: string[];
  fields: Array<{ id: string; label: string; value: string }>;
  details: Array<{ label: string; value: string }>;
  answerText: string;
}

function hasControlChars(value: string): boolean {
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value);
}

function dateOnly(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== value) return null;
  return value;
}

/** Age in whole years on a specific date, computed in UTC. */
function ageOn(dateOfBirth: string, onDate: string): number {
  const birth = new Date(`${dateOfBirth}T00:00:00.000Z`);
  const on = new Date(onDate);
  let age = on.getUTCFullYear() - birth.getUTCFullYear();
  const month = on.getUTCMonth() - birth.getUTCMonth();
  if (month < 0 || (month === 0 && on.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

function stateText(state: AnswerStateValue): string {
  switch (state) {
    case "yes":
      return "Yes";
    case "no":
      return "No";
    case "unknown":
      return "I'm not sure";
    case "declined":
      return "Prefer not to answer";
    case "not_applicable":
      return "Not applicable";
  }
}

function parseAnswerState(value: unknown): AnswerStateValue | undefined | null {
  if (value === undefined || value === null) return undefined;
  return typeof value === "string" && ANSWER_STATES.has(value)
    ? (value as AnswerStateValue)
    : null;
}

function parseAnswerValues(value: unknown, question: (typeof SERVER_BANK)[number]): string[] | undefined | null {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length > 20) return null;
  const allowed = new Set(question.options.map((option) => option.value));
  const values: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string" || !allowed.has(raw)) return null;
    if (!values.includes(raw)) values.push(raw);
  }
  return values;
}

function parseFields(
  value: unknown,
  question: (typeof SERVER_BANK)[number],
): { ok: true; fields: Array<{ id: string; label: string; value: string }> } | { ok: false; reason: string } {
  if (value === undefined || value === null) return { ok: true, fields: [] };
  if (!Array.isArray(value) || value.length > 40) {
    return { ok: false, reason: "Invalid answer detail" };
  }
  if (question.fields.length === 0 && value.length > 0) {
    return { ok: false, reason: "Unexpected answer detail" };
  }

  const allowed = new Map(question.fields.map((field) => [field.id, field]));
  const seen = new Set<string>();
  const fields: Array<{ id: string; label: string; value: string }> = [];

  for (const raw of value) {
    if (!isRecord(raw)) return { ok: false, reason: "Invalid answer detail" };
    const id = text(raw.id, 64);
    const fieldValue = text(raw.value, 500);
    if (!id || !fieldValue || !allowed.has(id) || seen.has(id)) {
      return { ok: false, reason: "Invalid answer detail" };
    }
    if (hasControlChars(fieldValue)) return { ok: false, reason: "Invalid answer detail" };
    seen.add(id);
    fields.push({ id, label: allowed.get(id)!.label, value: fieldValue });
  }

  return { ok: true, fields };
}

function parseDetails(
  value: unknown,
  question: (typeof SERVER_BANK)[number],
): { ok: true; details: Array<{ label: string; value: string }> } | { ok: false; reason: string } {
  if (value === undefined || value === null) return { ok: true, details: [] };
  if (!Array.isArray(value) || value.length > 40) {
    return { ok: false, reason: "Invalid supplemental detail" };
  }
  if (question.detailPrompts.length === 0 && value.length > 0) {
    return { ok: false, reason: "Unexpected supplemental detail" };
  }

  const allowed = new Map(question.detailPrompts.map((prompt) => [prompt.label, prompt]));
  const seen = new Set<string>();
  const details: Array<{ label: string; value: string }> = [];

  for (const raw of value) {
    if (!isRecord(raw)) return { ok: false, reason: "Invalid supplemental detail" };
    const label = text(raw.label, 200);
    const detailValue = text(raw.value, MAX_TEXT);
    if (!label || !detailValue || !allowed.has(label) || seen.has(label)) {
      return { ok: false, reason: "Invalid supplemental detail" };
    }
    if (hasControlChars(detailValue)) {
      return { ok: false, reason: "Invalid supplemental detail" };
    }
    seen.add(label);
    details.push({ label, value: detailValue });
  }

  return { ok: true, details };
}

function isApplicable(
  question: (typeof SERVER_BANK)[number],
  parsed: Map<string, ParsedAnswer>,
): boolean {
  if (!question.askWhen) return true;
  const parent = parsed.get(question.askWhen.questionId);
  if (!parent) return false;

  const selected = new Set<string>();
  if (parent.state) selected.add(parent.state);
  for (const value of parent.values ?? []) selected.add(value);
  return question.askWhen.includes.some((value) => selected.has(value));
}

function derivedFlags(answers: ServerAnswer[]): ServerFlag[] {
  const flags: ServerFlag[] = [];
  const count = (disposition: string) =>
    answers.filter((answer) => answer.disposition === disposition).length;

  if (answers.some((answer) => answer.questionId === "MH-05" && answer.answerState === "yes")) {
    flags.push({
      id: "crisis-disclosure",
      label: "Current safety disclosure",
      detail:
        "The customer answered yes to current thoughts of self-harm. Review this case first, and follow the approved crisis-support script. The site does not monitor emergencies.",
      severity: "urgent",
    });
  }

  const unresolved = count("unresolved");
  if (unresolved > 0) {
    flags.push({
      id: "unresolved-items",
      label: `${unresolved} unanswered item${unresolved === 1 ? "" : "s"}`,
      detail:
        "Submitted with unresolved items. These are not treated as 'No'; ask the customer directly before relying on them.",
      severity: "attention",
    });
  }

  const declined = count("declined");
  if (declined > 0) {
    flags.push({
      id: "declined-items",
      label: `${declined} question${declined === 1 ? "" : "s"} declined`,
      detail:
        "The customer chose not to answer. Offer a human conversation rather than pressing for an answer.",
      severity: "attention",
    });
  }

  const held = count("held_for_review");
  if (held > 0) {
    flags.push({
      id: "held-for-review",
      label: `${held} source question${held === 1 ? "" : "s"} held for review`,
      detail:
        "These source questions are withheld from automated collection pending legal and underwriting approval. They remain in the question record for the coverage audit.",
      severity: "info",
    });
  }

  const unknown = count("unknown");
  if (unknown > 0) {
    flags.push({
      id: "uncertain-answers",
      label: `${unknown} uncertain answer${unknown === 1 ? "" : "s"}`,
      detail: "Recorded as uncertain, not as No. Confirm the detail during the review call.",
      severity: "info",
    });
  }

  return flags;
}

/**
 * Rebuilds the posted body into a canonical ServerDraft. Every question text,
 * timeframe, review status, disposition and derived flag comes from the
 * server-side bank; none of it is trusted from the caller.
 */
export function validateDraft(body: unknown): ValidationResult {
  if (!isRecord(body)) return { ok: false, reason: "Invalid submission" };

  if (body.relationship !== "self" || body.adultAttested !== true) {
    return {
      ok: false,
      reason:
        "This interview only accepts an adult answering for themselves. Ask us about the separate authority process.",
    };
  }

  const questionnaireVersion = text(body.questionnaireVersion, 64);
  if (questionnaireVersion !== QUESTIONNAIRE_VERSION) {
    return { ok: false, reason: "Questionnaire version is not approved" };
  }

  const startedAt = isoish(body.startedAt);
  const completedAt = isoish(body.completedAt);
  if (!startedAt || !completedAt) {
    return { ok: false, reason: "Missing submission timestamps" };
  }

  const startedMs = Date.parse(startedAt);
  const completedMs = Date.parse(completedAt);
  const now = Date.now();

  if (completedMs < startedMs) {
    return { ok: false, reason: "Submission chronology is inconsistent" };
  }
  if (completedMs - startedMs > MAX_SESSION_MS) {
    return { ok: false, reason: "Submission session is too old" };
  }
  if (completedMs > now + CLOCK_SKEW_MS) {
    return { ok: false, reason: "Submission time is in the future" };
  }

  if (!isRecord(body.lead)) return { ok: false, reason: "Invalid contact details" };
  const leadInput = body.lead;

  const firstName = text(leadInput.firstName, 100);
  const lastName = text(leadInput.lastName, 100);
  const state = text(leadInput.state, 2);
  const email = text(leadInput.email, 254);
  const dateOfBirth = dateOnly(leadInput.dateOfBirth);
  const preferredContact = leadInput.preferredContact;

  if (!firstName || !lastName || hasControlChars(firstName) || hasControlChars(lastName)) {
    return { ok: false, reason: "Missing name" };
  }
  if (!state || !US_STATE_CODES.has(state.toUpperCase())) {
    return { ok: false, reason: "State of residence is not supported" };
  }
  if (!email || !looksLikeEmail(email)) return { ok: false, reason: "Invalid email address" };
  if (!dateOfBirth) return { ok: false, reason: "A valid date of birth is required" };

  const age = ageOn(dateOfBirth, completedAt);
  if (age < 18) {
    return { ok: false, reason: "This interview is only available to adults aged 18 or over" };
  }
  if (age > 120) return { ok: false, reason: "A valid date of birth is required" };

  if (
    preferredContact !== "email" &&
    preferredContact !== "phone" &&
    preferredContact !== "text" &&
    preferredContact !== "chat"
  ) {
    return { ok: false, reason: "Invalid contact preference" };
  }

  const phone = optionalText(leadInput.phone, 40);

  // ---- Consent evidence is compared with the exact server-owned wording ----
  if (!Array.isArray(body.consents)) {
    return { ok: false, reason: "Consent records are required" };
  }

  const canonicalConsents: Record<
    "intake_permission" | "privacy_acknowledgement",
    { label: string; text: string; version: string }
  > = {
    intake_permission: {
      label: "Preliminary intake and submission",
      text: CONSENT_POLICY.intakePermissionText,
      version: CONSENT_POLICY.consentVersion,
    },
    privacy_acknowledgement: {
      label: "Privacy practices acknowledgement",
      text: CONSENT_POLICY.privacyAcknowledgementText,
      version: CONSENT_POLICY.privacyVersion,
    },
  };

  const consents: ServerConsent[] = [];
  const seenConsents = new Set<string>();

  for (const raw of body.consents) {
    if (!isRecord(raw)) return { ok: false, reason: "Invalid consent record" };

    const id = text(raw.id, 64);
    if (!id) return { ok: false, reason: "Incomplete consent evidence" };
    if (id.startsWith("marketing_")) {
      return {
        ok: false,
        reason: "Marketing consent is not enabled for this deployment",
      };
    }
    if (id !== "intake_permission" && id !== "privacy_acknowledgement") {
      return { ok: false, reason: "Unknown consent record" };
    }
    if (seenConsents.has(id)) return { ok: false, reason: "Duplicate consent record" };
    seenConsents.add(id);

    const expected = canonicalConsents[id];
    const label = text(raw.label, 200);
    const textVersion = text(raw.textVersion, 64);
    const consentText = text(raw.text, MAX_TEXT);

    if (
      label !== expected.label ||
      textVersion !== expected.version ||
      consentText !== expected.text
    ) {
      return { ok: false, reason: "Consent evidence does not match the displayed wording" };
    }
    if (raw.granted !== true) {
      return {
        ok: false,
        reason:
          id === "intake_permission"
            ? "Intake permission is required to submit"
            : "Privacy practices acknowledgement is required to submit",
      };
    }

    const grantedAt = isoish(raw.grantedAt);
    if (!grantedAt) return { ok: false, reason: "Missing consent timestamp" };
    const grantedMs = Date.parse(grantedAt);
    if (
      grantedMs < startedMs - CLOCK_SKEW_MS ||
      grantedMs > completedMs + CLOCK_SKEW_MS ||
      grantedMs > now + CLOCK_SKEW_MS
    ) {
      return { ok: false, reason: "Consent timestamp is inconsistent with the submission" };
    }

    consents.push({
      id,
      label,
      granted: true,
      grantedAt,
      textVersion,
      text: consentText,
    });
  }

  if (!seenConsents.has("intake_permission")) {
    return { ok: false, reason: "Intake permission is required to submit" };
  }
  if (!seenConsents.has("privacy_acknowledgement")) {
    return { ok: false, reason: "Privacy practices acknowledgement is required to submit" };
  }

  // ---- Explicit submission acknowledgement, with the exact version ---------
  if (!Array.isArray(body.acknowledgements) || body.acknowledgements.length !== 1) {
    return { ok: false, reason: "Submission acknowledgement is required" };
  }

  const rawAcknowledgement = body.acknowledgements[0];
  if (!isRecord(rawAcknowledgement)) {
    return { ok: false, reason: "Invalid submission acknowledgement" };
  }

  const acknowledgementText = text(rawAcknowledgement.text, MAX_TEXT);
  const acknowledgementVersion = text(rawAcknowledgement.textVersion, 64);
  const acknowledgementAt = isoish(rawAcknowledgement.timestamp);

  if (
    rawAcknowledgement.id !== "submission_requested" ||
    acknowledgementText !== CONSENT_POLICY.submissionAcknowledgementText ||
    acknowledgementVersion !== CONSENT_POLICY.consentVersion ||
    !acknowledgementAt
  ) {
    return { ok: false, reason: "Submission acknowledgement is not current" };
  }

  const acknowledgementMs = Date.parse(acknowledgementAt);
  if (
    acknowledgementMs < startedMs - CLOCK_SKEW_MS ||
    acknowledgementMs > completedMs + CLOCK_SKEW_MS ||
    acknowledgementMs > now + CLOCK_SKEW_MS
  ) {
    return { ok: false, reason: "Submission acknowledgement is not current" };
  }

  const acknowledgements: ServerAcknowledgement[] = [
    {
      id: "submission_requested",
      text: acknowledgementText,
      textVersion: acknowledgementVersion,
      timestamp: acknowledgementAt,
    },
  ];

  // ---- Every canonical row must be present exactly once --------------------
  if (!Array.isArray(body.answers)) {
    return { ok: false, reason: "Answers are required" };
  }
  if (body.answers.length !== MAX_ANSWERS) {
    return { ok: false, reason: "The submission is incomplete" };
  }

  const parsed = new Map<string, ParsedAnswer>();

  for (const raw of body.answers) {
    if (!isRecord(raw)) return { ok: false, reason: "Invalid answer record" };

    const questionId = text(raw.questionId, 64);
    if (!questionId) return { ok: false, reason: "Incomplete answer record" };
    const question = SERVER_BY_ID.get(questionId);
    if (!question) return { ok: false, reason: "Unknown question" };
    if (parsed.has(questionId)) return { ok: false, reason: "Duplicate question" };

    const disposition = text(raw.disposition, 40);
    if (!disposition || !DISPOSITIONS.has(disposition)) {
      return { ok: false, reason: "Unknown disposition" };
    }

    const state = parseAnswerState(raw.answerState);
    if (state === null) return { ok: false, reason: "Unknown answer state" };

    const values = parseAnswerValues(raw.answerValues, question);
    if (values === null) return { ok: false, reason: "Unknown answer value" };

    const fields = parseFields(raw.fields, question);
    if (fields.ok === false) return { ok: false, reason: fields.reason };

    const details = parseDetails(raw.details, question);
    if (details.ok === false) return { ok: false, reason: details.reason };

    const answerText = text(raw.answerText, MAX_TEXT);
    if (!answerText || hasControlChars(answerText)) {
      return { ok: false, reason: "Incomplete answer record" };
    }

    parsed.set(questionId, {
      question,
      disposition,
      state,
      values,
      fields: fields.fields,
      details: details.details,
      answerText,
    });
  }

  const answers: ServerAnswer[] = [];

  for (const question of SERVER_BANK) {
    const entry = parsed.get(question.id);
    if (!entry) return { ok: false, reason: "The submission is incomplete" };

    const applicable = isApplicable(question, parsed);
    const held = question.reviewStatus === "human_review_required";

    if (held) {
      if (entry.disposition !== "held_for_review") {
        return { ok: false, reason: "A held question cannot be answered" };
      }
      if (
        entry.state !== undefined ||
        (entry.values?.length ?? 0) > 0 ||
        entry.fields.length > 0 ||
        entry.details.length > 0
      ) {
        return { ok: false, reason: "A held question cannot carry answer content" };
      }
      answers.push(canonicalAnswer(question, "held_for_review", undefined, undefined, [], [], "Held for human review — not asked"));
      continue;
    }

    if (!applicable) {
      if (entry.disposition !== "not_asked") {
        return { ok: false, reason: "A branch-closed question cannot be answered" };
      }
      if (
        entry.state !== undefined ||
        (entry.values?.length ?? 0) > 0 ||
        entry.fields.length > 0 ||
        entry.details.length > 0
      ) {
        return { ok: false, reason: "A branch-closed question cannot carry answer content" };
      }
      answers.push(canonicalAnswer(question, "not_asked", undefined, undefined, [], [], "Not asked — branch not applicable"));
      continue;
    }

    if (entry.disposition === "not_asked" || entry.disposition === "held_for_review") {
      return { ok: false, reason: "An applicable question must be answered or left unresolved" };
    }

    if (entry.disposition === "not_applicable") {
      return { ok: false, reason: "Not applicable is not approved for this questionnaire" };
    }

    if (entry.disposition === "unresolved") {
      if (
        entry.state !== undefined ||
        (entry.values?.length ?? 0) > 0 ||
        entry.fields.length > 0 ||
        entry.details.length > 0
      ) {
        return { ok: false, reason: "An unresolved answer cannot carry answer content" };
      }
      answers.push(canonicalAnswer(question, "unresolved", undefined, undefined, [], [], "Not answered"));
      continue;
    }

    if (entry.disposition === "unknown" || entry.disposition === "declined") {
      if (
        entry.state !== entry.disposition ||
        (entry.values?.length ?? 0) > 0 ||
        entry.fields.length > 0 ||
        entry.details.length > 0
      ) {
        return { ok: false, reason: "The answer state does not match the recorded disposition" };
      }
      answers.push(
        canonicalAnswer(
          question,
          entry.disposition,
          entry.state,
          undefined,
          [],
          [],
          stateText(entry.state),
        ),
      );
      continue;
    }

    // disposition === "answered"
    if (question.kind === "yesno") {
      if (entry.state !== "yes" && entry.state !== "no") {
        return { ok: false, reason: "A yes/no question needs a yes or no answer" };
      }
      if (entry.state === "no" && (entry.fields.length > 0 || entry.details.length > 0)) {
        return { ok: false, reason: "A no answer cannot carry yes-only detail" };
      }
      answers.push(
        canonicalAnswer(
          question,
          "answered",
          entry.state,
          undefined,
          entry.fields,
          entry.details,
          stateText(entry.state),
        ),
      );
      continue;
    }

    if (entry.state !== undefined) {
      return { ok: false, reason: "The answer state does not match the question type" };
    }

    if (question.kind === "multi_choice") {
      if (!entry.values || entry.values.length === 0) {
        return { ok: false, reason: "Select at least one option" };
      }
      const labels = entry.values.map(
        (value) => question.options.find((option) => option.value === value)?.label ?? value,
      );
      answers.push(
        canonicalAnswer(question, "answered", undefined, entry.values, entry.fields, entry.details, labels.join(", ")),
      );
      continue;
    }

    if (question.compound && entry.fields.length === 0) {
      return { ok: false, reason: "The compound question is incomplete" };
    }

    if (entry.answerText === "No answer recorded" || entry.answerText === "Not answered") {
      return { ok: false, reason: "An answered question needs an answer" };
    }

    answers.push(
      canonicalAnswer(
        question,
        "answered",
        undefined,
        entry.values,
        entry.fields,
        entry.details,
        entry.answerText,
      ),
    );
  }

  const draft: ServerDraft = {
    questionnaireVersion,
    startedAt,
    completedAt,
    lead: {
      firstName,
      lastName,
      state: state.toUpperCase(),
      email,
      dateOfBirth,
      preferredContact,
      phone: phone ? normalisePhone(phone) : undefined,
      preferredContactTime: optionalText(leadInput.preferredContactTime, 120),
      timeZone: optionalText(leadInput.timeZone, 80),
      assistance: optionalText(leadInput.assistance, 200),
      coverageAmount: optionalText(leadInput.coverageAmount, 60),
      coveragePurpose: optionalText(leadInput.coveragePurpose, 120),
      termPreference: optionalText(leadInput.termPreference, 60),
    },
    answers,
    consents,
    acknowledgements,
    flags: derivedFlags(answers),
    crisisDisclosure: answers.some(
      (answer) => answer.questionId === "MH-05" && answer.answerState === "yes",
    ),
    adultAttested: true,
    relationship: "self",
    serverReceivedAt: new Date().toISOString(),
  };

  return { ok: true, draft };
}

function canonicalAnswer(
  question: (typeof SERVER_BANK)[number],
  disposition: string,
  state: AnswerStateValue | undefined,
  values: string[] | undefined,
  fields: Array<{ id: string; label: string; value: string }>,
  details: Array<{ label: string; value: string }>,
  answerText: string,
): ServerAnswer {
  return {
    questionId: question.id,
    section: question.section,
    sourceRef: question.sourceRef,
    sourceText: question.sourceText,
    customerText: question.customerText,
    timeframe: question.timeframe ?? undefined,
    status: question.status,
    reviewStatus: question.reviewStatus,
    reviewNote: question.reviewNote ?? undefined,
    sensitive: question.sensitive ? true : undefined,
    disposition,
    answerText,
    answerState: state,
    answerValues: values && values.length > 0 ? values : undefined,
    fields: fields.length > 0 ? fields : undefined,
    details: details.length > 0 ? details : undefined,
  } satisfies ServerAnswer;
}


// -----------------------------------------------------------------------------
// Case references
// -----------------------------------------------------------------------------

/** Crockford base32: no I, L, O or U, so references survive being read aloud. */
const REFERENCE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** LPP-2026-7K3M9Q — always generated server-side. */
export function generateReference(now = new Date()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let suffix = "";
  for (const byte of bytes) {
    suffix += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
  }
  return `LPP-${now.getUTCFullYear()}-${suffix}`;
}

// -----------------------------------------------------------------------------
// Service-role client
// -----------------------------------------------------------------------------

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("Server configuration is incomplete");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// -----------------------------------------------------------------------------
// Rate limiting (per warm instance; a WAF or Upstash limiter belongs in front
// of this for production volumes)
// -----------------------------------------------------------------------------

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 10;
const hits = new Map<string, number[]>();

export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  return first || req.headers.get("cf-connecting-ip") || "unknown";
}

export function rateLimited(key: string, now = Date.now()): boolean {
  const windowStart = now - RATE_WINDOW_MS;
  const recent = (hits.get(key) ?? []).filter((stamp) => stamp > windowStart);

  if (recent.length >= RATE_LIMIT) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 500) {
    for (const [existingKey, stamps] of hits) {
      if (stamps.every((stamp) => stamp <= windowStart)) hits.delete(existingKey);
    }
  }

  return false;
}
