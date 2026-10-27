/**
 * Shared helpers for the Life Policy Pilot intake functions.
 *
 * Everything here is defensive by design: the intake endpoint is public, so
 * the payload is treated as hostile, rebuilt from an allowlist of fields, and
 * never logged. Health answers must not reach application logs or error
 * reports.
 */

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

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
// Payload types (mirrors src/features/interview/types.ts)
// -----------------------------------------------------------------------------

export interface ServerLead {
  firstName: string;
  lastName: string;
  state: string;
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
  relationship: "self";
}

export type ValidationResult =
  | { ok: true; draft: ServerDraft }
  | { ok: false; reason: string };

// -----------------------------------------------------------------------------
// Field validation helpers
// -----------------------------------------------------------------------------

const DISPOSITIONS = new Set([
  "answered",
  "unknown",
  "declined",
  "not_applicable",
  "unresolved",
  "held_for_review",
  "not_asked",
]);

const SECTIONS = new Set([
  "identity",
  "medical",
  "mental",
  "nicotine",
  "alcohol",
  "aviation",
  "avocations",
  "driving",
  "criminal",
  "financial",
  "drugs",
  "residency",
  "occupation",
  "military",
]);

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

const MAX_ANSWERS = 400;
const MAX_TEXT = 4000;

/**
 * Rebuilds the posted body into a clean ServerDraft, rejecting anything that
 * does not satisfy the intake contract. Details are intentionally vague in the
 * failure reason: the response never echoes submitted data.
 */
export function validateDraft(body: unknown): ValidationResult {
  if (!isRecord(body)) return { ok: false, reason: "Invalid submission" };

  if (body.relationship !== "self") {
    return {
      ok: false,
      reason:
        "This interview only accepts an adult answering for themselves. Ask us about the separate authority process.",
    };
  }

  const questionnaireVersion = text(body.questionnaireVersion, 64);
  if (!questionnaireVersion) {
    return { ok: false, reason: "Missing questionnaire version" };
  }

  const startedAt = isoish(body.startedAt);
  const completedAt = isoish(body.completedAt);
  if (!startedAt || !completedAt) {
    return { ok: false, reason: "Missing submission timestamps" };
  }

  if (!isRecord(body.lead)) return { ok: false, reason: "Invalid contact details" };
  const leadInput = body.lead;

  const firstName = text(leadInput.firstName, 100);
  const lastName = text(leadInput.lastName, 100);
  const state = text(leadInput.state, 2) ?? text(leadInput.state, 40);
  const email = text(leadInput.email, 254);
  const preferredContact = leadInput.preferredContact;

  if (!firstName || !lastName) return { ok: false, reason: "Missing name" };
  if (!state) return { ok: false, reason: "Missing state of residence" };
  if (!email || !looksLikeEmail(email)) return { ok: false, reason: "Invalid email address" };
  if (
    preferredContact !== "email" &&
    preferredContact !== "phone" &&
    preferredContact !== "text" &&
    preferredContact !== "chat"
  ) {
    return { ok: false, reason: "Invalid contact preference" };
  }

  const phone = optionalText(leadInput.phone, 40);

  if (!Array.isArray(body.consents)) {
    return { ok: false, reason: "Consent records are required" };
  }

  const consents: ServerConsent[] = [];
  for (const raw of body.consents) {
    if (!isRecord(raw)) return { ok: false, reason: "Invalid consent record" };

    const id = text(raw.id, 64);
    const label = text(raw.label, 200);
    const textVersion = text(raw.textVersion, 64);
    const consentText = text(raw.text, MAX_TEXT);

    if (!id || !label || !textVersion || !consentText) {
      return { ok: false, reason: "Incomplete consent evidence" };
    }
    if (typeof raw.granted !== "boolean") {
      // Consent is never inferred from a phone number, session or submission.
      return { ok: false, reason: "Consent must be an explicit boolean" };
    }

    const grantedAt = raw.grantedAt === null ? null : isoish(raw.grantedAt);
    if (raw.granted && !grantedAt) {
      return { ok: false, reason: "Missing consent timestamp" };
    }
    if (!raw.granted && grantedAt !== null) {
      return { ok: false, reason: "Inconsistent consent record" };
    }

    consents.push({
      id,
      label,
      granted: raw.granted,
      grantedAt,
      textVersion,
      text: consentText,
      numberAuthorized: optionalText(raw.numberAuthorized, 40),
    });
  }

  const intakePermission = consents.find((consent) => consent.id === "intake_permission");
  if (!intakePermission || !intakePermission.granted) {
    return { ok: false, reason: "Intake permission is required to submit" };
  }

  const marketingCall = consents.find((consent) => consent.id === "marketing_call");
  const marketingText = consents.find((consent) => consent.id === "marketing_text");
  if ((marketingCall?.granted || marketingText?.granted) && !phone) {
    // Channel permission without the number it refers to cannot be evidenced.
    return { ok: false, reason: "A telephone number is required for call or text consent" };
  }

  if (!Array.isArray(body.answers)) {
    return { ok: false, reason: "Answers are required" };
  }
  if (body.answers.length > MAX_ANSWERS) {
    return { ok: false, reason: "Too many answers" };
  }

  const seen = new Set<string>();
  const answers: ServerAnswer[] = [];

  for (const raw of body.answers) {
    if (!isRecord(raw)) return { ok: false, reason: "Invalid answer record" };

    const questionId = text(raw.questionId, 64);
    const section = text(raw.section, 40);
    const sourceRef = text(raw.sourceRef, 300);
    const sourceText = text(raw.sourceText, MAX_TEXT);
    const customerText = text(raw.customerText, MAX_TEXT);
    const disposition = text(raw.disposition, 40);
    const answerText = text(raw.answerText, MAX_TEXT);

    if (!questionId || !section || !sourceRef || !sourceText || !customerText) {
      return { ok: false, reason: "Incomplete answer record" };
    }
    if (!SECTIONS.has(section)) return { ok: false, reason: "Unknown section" };
    if (!disposition || !DISPOSITIONS.has(disposition)) {
      return { ok: false, reason: "Unknown disposition" };
    }
    if (seen.has(questionId)) return { ok: false, reason: "Duplicate question" };
    seen.add(questionId);

    if (raw.status !== "core" && raw.status !== "supplemental") {
      return { ok: false, reason: "Unknown question status" };
    }
    if (raw.reviewStatus !== "approved" && raw.reviewStatus !== "human_review_required") {
      return { ok: false, reason: "Unknown review status" };
    }

    const fields = Array.isArray(raw.fields)
      ? raw.fields.flatMap((field) => {
          if (!isRecord(field)) return [];
          const id = text(field.id, 64);
          const label = text(field.label, 200);
          const value = optionalText(field.value, MAX_TEXT);
          if (!id || !label || !value) return [];
          return [{ id, label, value }];
        })
      : undefined;

    const details = Array.isArray(raw.details)
      ? raw.details.flatMap((detail) => {
          if (!isRecord(detail)) return [];
          const label = text(detail.label, 200);
          const value = optionalText(detail.value, MAX_TEXT);
          if (!label || !value) return [];
          return [{ label, value }];
        })
      : undefined;

    answers.push({
      questionId,
      section,
      sourceRef,
      sourceText,
      customerText,
      timeframe: optionalText(raw.timeframe, 200),
      status: raw.status,
      reviewStatus: raw.reviewStatus,
      reviewNote: optionalText(raw.reviewNote, 500),
      sensitive: raw.sensitive === true ? true : undefined,
      disposition,
      answerText: answerText ?? "No answer recorded",
      fields: fields && fields.length > 0 ? fields : undefined,
      details: details && details.length > 0 ? details : undefined,
    });
  }

  const acknowledgements: ServerAcknowledgement[] = Array.isArray(body.acknowledgements)
    ? body.acknowledgements.flatMap((raw) => {
        if (!isRecord(raw)) return [];
        const id = text(raw.id, 64);
        const acknowledgementText = text(raw.text, MAX_TEXT);
        const textVersion = text(raw.textVersion, 64);
        const timestamp = isoish(raw.timestamp);
        if (!id || !acknowledgementText || !textVersion || !timestamp) return [];
        return [{ id, text: acknowledgementText, textVersion, timestamp }];
      })
    : [];

  if (acknowledgements.length === 0) {
    return { ok: false, reason: "Submission acknowledgement is required" };
  }

  const flags: ServerFlag[] = Array.isArray(body.flags)
    ? body.flags.flatMap((raw) => {
        if (!isRecord(raw)) return [];
        const id = text(raw.id, 64);
        const label = text(raw.label, 200);
        const detail = text(raw.detail, 800);
        const severity = raw.severity;
        if (!id || !label || !detail) return [];
        if (severity !== "info" && severity !== "attention" && severity !== "urgent") return [];
        return [{ id, label, detail, severity }];
      })
    : [];

  const draft: ServerDraft = {
    questionnaireVersion,
    startedAt,
    completedAt,
    lead: {
      firstName,
      lastName,
      state: state.toUpperCase(),
      email,
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
    flags,
    crisisDisclosure: body.crisisDisclosure === true,
    relationship: "self",
  };

  return { ok: true, draft };
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
