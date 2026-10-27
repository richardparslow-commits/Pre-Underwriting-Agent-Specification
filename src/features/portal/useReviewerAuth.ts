import { useCallback, useEffect, useState } from "react";
import { PREVIEW_MODE, SITE } from "@/config/site";
import { sendSignInLink, signOut } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reviewer authentication.
 *
 * In preview mode this is an honest, obviously-fake unlock: there is no account
 * and no server, so it must never look like real authentication. In live mode
 * the session is a Supabase session and every row is still filtered by RLS.
 */
export function useReviewerAuth() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(!PREVIEW_MODE);
  const [previewUnlocked, setPreviewUnlocked] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setEmail(data.session?.user.email ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const requestLink = useCallback(async (address: string) => {
    setError(null);
    setLinkSent(false);
    try {
      await sendSignInLink(address);
      setLinkSent(true);
    } catch (signInError) {
      setError(
        signInError instanceof Error ? signInError.message : "The sign-in link could not be sent.",
      );
    }
  }, []);

  const leave = useCallback(async () => {
    await signOut();
    setEmail(null);
    setPreviewUnlocked(false);
  }, []);

  const unlockPreview = useCallback(() => setPreviewUnlocked(true), []);

  return {
    previewMode: PREVIEW_MODE,
    signedIn: PREVIEW_MODE ? previewUnlocked : email !== null,
    email: PREVIEW_MODE ? (previewUnlocked ? SITE.reviewerEmail : null) : email,
    loading,
    linkSent,
    error,
    requestLink,
    leave,
    unlockPreview,
  };
}
