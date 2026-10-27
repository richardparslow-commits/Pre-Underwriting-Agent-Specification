/**
 * Product configuration.
 *
 * Everything the business owner must confirm before launch is collected here
 * so it is easy to find, and nothing here is presented to a customer as a
 * legal conclusion.
 */

export const SITE = {
  brand: "Life Policy Pilot",
  owner: "Richard Parslow",
  /** Server-side approved recipient; this constant is for display only. */
  reviewerEmail: "richardparslow@lifepolicypilot.blog",
  /**
   * The actual legal operating entity. Placeholder until counsel confirms it:
   * the TCPA disclosure below is not valid with a placeholder in place.
   */
  legalEntity: "[Legal business name]",
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
   * all 56 rows), so the public site must not imply the bank is final.
   */
  bankSignedOff: false,
} as const;

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "") ?? "";
/** Lovable Cloud names this the publishable key; older projects call it the anon key. */
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * Preview mode runs entirely in the browser with no backend. It is the default
 * so a fresh Lovable import works before Supabase is connected.
 */
export const PREVIEW_MODE =
  import.meta.env.VITE_APP_MODE !== "live" || !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const SUBMIT_CASE_URL =
  import.meta.env.VITE_SUBMIT_CASE_URL?.replace(/\/$/, "") ||
  (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/submit-case` : "");
