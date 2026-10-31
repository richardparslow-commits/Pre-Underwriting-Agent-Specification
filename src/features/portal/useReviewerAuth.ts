import { useCallback, useEffect, useState } from "react";
import { PREVIEW_MODE, SITE } from "@/config/site";
import { sendSignInLink, signOut } from "@/lib/api";
import { reviewerSignInFeedback, supabase } from "@/integrations/supabase/client";

/** True when the session has not completed a second factor. */
async function sessionNeedsStepUp(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.currentLevel !== "aal2";
}

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
  const [error, setError] = useState<string | null>(() => reviewerSignInFeedback.read());
  const [needsMfa, setNeedsMfa] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    async function applySession(session: { user: { email?: string | null } } | null) {
      if (!active) return;
      const address = session?.user.email ?? null;
      setEmail(address);

      if (!session) {
        setNeedsMfa(false);
        return;
      }

      reviewerSignInFeedback.clear();
      setError(null);

      // Supabase does not enforce AAL2 at the gateway. The portal refuses an
      // aal1 session, and every reviewer RLS policy independently requires it.
      setNeedsMfa(await sessionNeedsStepUp());
    }

    supabase.auth.getSession().then(async ({ data }) => {
      await applySession(data.session);
      if (active) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const requestLink = useCallback(async (address: string) => {
    reviewerSignInFeedback.clear();
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
    setNeedsMfa(false);
    setPreviewUnlocked(false);
  }, []);

  const unlockPreview = useCallback(() => setPreviewUnlocked(true), []);

  /** Re-reads AAL after the in-app TOTP gate succeeds. */
  const refreshAssurance = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    setEmail(data.session?.user.email ?? null);
    setNeedsMfa(data.session ? await sessionNeedsStepUp() : false);
  }, []);

  return {
    previewMode: PREVIEW_MODE,
    signedIn: PREVIEW_MODE ? previewUnlocked : email !== null && !needsMfa,
    needsMfa,
    email: PREVIEW_MODE ? (previewUnlocked ? SITE.reviewerEmail : null) : email,
    loading,
    linkSent,
    error,
    requestLink,
    leave,
    unlockPreview,
    refreshAssurance,
  };
}
