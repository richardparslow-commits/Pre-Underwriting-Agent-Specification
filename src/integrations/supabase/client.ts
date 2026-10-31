import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/config/site";
import { createReviewerSignInFeedback } from "@/lib/reviewerSignInFeedback";

export const reviewerSignInFeedback = createReviewerSignInFeedback(
  typeof window === "undefined" ? undefined : window,
);

/**
 * Lovable Cloud / Supabase client.
 *
 * Kept at this path because that is where Lovable's integrations expect it.
 * The anon key is public by design; row level security is what protects the
 * cases table. Never put a service-role key in this file or any other VITE_
 * variable — everything here is shipped to the browser.
 *
 * Null in preview mode, so the portal cannot pretend to have a real session.
 */
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;
