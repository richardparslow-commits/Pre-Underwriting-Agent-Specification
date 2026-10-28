/**
 * Product configuration.
 *
 * Everything the business owner must confirm before launch is collected here
 * so it is easy to find, and nothing here is presented to a customer as a
 * legal conclusion.
 */

import { resolveLegalEntity } from "./legalEntity";

/**
 * Vite replaces `import.meta.env` at build time. The fallback keeps this
 * module importable by the Node scripts that generate the server-side policy
 * and question bank, where a bundler is not present.
 */
const ENV: Record<string, string | undefined> =
  (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

/**
 * The actual legal operating entity. Supplied at build time so no placeholder
 * can reach a customer. While it is empty, no marketing consent is requested:
 * a TCPA disclosure cannot name an authorised seller that has not been
 * confirmed. Blank and bracket-wrapped values are both treated as unset.
 */
const LEGAL_ENTITY = resolveLegalEntity(ENV.VITE_LEGAL_ENTITY);
const LEGAL_ENTITY_CONFIGURED = LEGAL_ENTITY.length > 0;

/**
 * Marketing channels the business actually operates. Every flag defaults to
 * false; the disclosure and consent controls are generated only from channels
 * that are switched on here.
 */
export const MARKETING = {
  calls: ENV.VITE_MARKETING_CALLS === "true",
  texts: ENV.VITE_MARKETING_TEXTS === "true",
  /** Only claim auto-dialing if the calls actually use it. */
  autodialer: ENV.VITE_MARKETING_AUTODIALER === "true",
  /** Only mention AI voice if calls actually use it. */
  aiVoice: ENV.VITE_MARKETING_AI_VOICE === "true",
} as const;

/** Marketing consent is offered only for a named seller and a live channel. */
export const MARKETING_ENABLED =
  LEGAL_ENTITY_CONFIGURED && (MARKETING.calls || MARKETING.texts);

export const SITE = {
  brand: "Life Policy Pilot",
  owner: "Richard Parslow",
  /** Server-side approved recipient; this constant is for display only. */
  reviewerEmail: "richardparslow@lifepolicypilot.blog",
  legalEntity: LEGAL_ENTITY,
  /** Initial regulatory baseline named in the specification. */
  regulatoryBaseline: "Texas",
  /** Shown wherever draft legal language appears. */
  legalReviewPending: true,
} as const;

export const FEATURES = {
  /**
   * Email notification is only real once the `submit-case` function is
   * deployed with a provider key. Until then the UI must say so.
   */
  liveNotifications: false,
  /**
   * No language model is called in this build. The question engine is fully
   * deterministic, so customer copy must not claim an AI assistant is active.
   * Turn this on only when an approved explainer layer is actually wired.
   */
  aiExplainerEnabled: false,
  /**
   * Each bank row has been reconciled against the source PDF; the flags and
   * required decisions live in docs/question-bank-reconciliation.md.
   */
  bankReconciled: true,
  /**
   * No row has been signed off by a reviewer yet (sourceVerified is false on
   * all 92 rows), so the public site must not imply the bank is final.
   */
  bankSignedOff: false,
} as const;

export const SUPABASE_URL = ENV.VITE_SUPABASE_URL?.replace(/\/$/, "") ?? "";
/** Lovable Cloud names this the publishable key; older projects call it the anon key. */
export const SUPABASE_ANON_KEY =
  ENV.VITE_SUPABASE_PUBLISHABLE_KEY ?? ENV.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * Preview mode runs entirely in the browser with no backend. It is the default
 * so a fresh Lovable import works before Supabase is connected.
 */
export const PREVIEW_MODE =
  ENV.VITE_APP_MODE !== "live" || !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const SUBMIT_CASE_URL =
  ENV.VITE_SUBMIT_CASE_URL?.replace(/\/$/, "") ||
  (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/submit-case` : "");

/** Public marketing opt-out function; separate from case submission. */
export const REVOKE_MARKETING_URL =
  ENV.VITE_REVOKE_MARKETING_URL?.replace(/\/$/, "") ||
  (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/revoke-marketing` : "");
