import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PREVIEW_MODE, SITE } from "@/config/site";
import { SIGN_OUT_FAILURE, sendSignInLink, signOut } from "@/lib/api";
import { reviewerSignInFeedback, supabase } from "@/integrations/supabase/client";

export const SESSION_CHECK_FAILURE =
  "Your session could not be checked. The sign-in service may be unreachable, so the portal cannot confirm whether you are still signed in. Case data is hidden. Try again.";

type ReviewerAuthClient = SupabaseClient["auth"];
interface ReviewerSession {
  user: { email?: string | null };
}

/** True when the session has not completed a second factor. */
async function sessionNeedsStepUp(
  auth: ReviewerAuthClient | null,
): Promise<boolean> {
  if (!auth) return false;
  const { data, error } =
    await auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data?.currentLevel !== "aal2";
}

/**
 * Reviewer authentication.
 *
 * In preview mode this is an honest, obviously-fake unlock: there is no account
 * and no server, so it must never look like real authentication. In live mode
 * the session is a Supabase session and every row is still filtered by RLS.
 */
interface ReviewerAuthOptions {
  /** Test seam: replaces the network sign-out without changing the auth state contract. */
  signOut?: () => Promise<void>;
  /** Test seam: supplies the Supabase auth client used for the session check. */
  auth?: ReviewerAuthClient | null;
}

export function useReviewerAuth(options: ReviewerAuthOptions = {}) {
  const leaveSignOut = options.signOut ?? signOut;
  const auth =
    options.auth === undefined ? (supabase?.auth ?? null) : options.auth;
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(!PREVIEW_MODE);
  const [previewUnlocked, setPreviewUnlocked] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    reviewerSignInFeedback.read(),
  );
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionCheck, setSessionCheck] = useState(0);
  const [needsMfa, setNeedsMfa] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setSessionError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setSessionError(null);

    async function applySession(session: ReviewerSession | null) {
      if (!active) return;
      const address = session?.user.email ?? null;
      setEmail(address);

      if (!session) {
        setNeedsMfa(false);
        setSessionError(null);
        return;
      }

      reviewerSignInFeedback.clear();
      setError(null);

      try {
        // Supabase does not enforce AAL2 at the gateway. The portal refuses an
        // aal1 session, and every reviewer RLS policy independently requires it.
        const stepUp = await sessionNeedsStepUp(auth);
        if (!active) return;
        setNeedsMfa(stepUp);
        setSessionError(null);
      } catch {
        // A failed assurance read is not proof that the reviewer signed out.
        // Keep the session UI separate and let the reviewer retry the check.
        if (active) setSessionError(SESSION_CHECK_FAILURE);
      }
    }

    void (async () => {
      try {
        const { data, error: sessionFailure } = await auth.getSession();
        if (!active) return;
        if (sessionFailure) {
          setSessionError(SESSION_CHECK_FAILURE);
          return;
        }
        await applySession(data.session);
      } catch {
        if (active) setSessionError(SESSION_CHECK_FAILURE);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const { data: subscription } = auth.onAuthStateChange(
      (event, session) => {
        // getSession() owns the initial check. Supabase also emits an initial
        // null event when that same renewal fails, which must not erase the
        // failure state before the reviewer can retry.
        if (event === "INITIAL_SESSION") return;
        void applySession(session);
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [auth, sessionCheck]);

  const requestLink = useCallback(async (address: string) => {
    reviewerSignInFeedback.clear();
    setError(null);
    setLeaveError(null);
    setLinkSent(false);
    try {
      await sendSignInLink(address);
      setLinkSent(true);
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "The sign-in link could not be sent.",
      );
    }
  }, []);

  const leave = useCallback(async () => {
    setLeaveError(null);
    try {
      await leaveSignOut();
    } catch {
      // Keep the reviewer signed in locally: Supabase can fail to revoke the
      // server session while dropping the local one, so clearing this state
      // would present a failed sign-out as success.
      setLeaveError(SIGN_OUT_FAILURE);
      return;
    }
    setEmail(null);
    setNeedsMfa(false);
    setPreviewUnlocked(false);
    setSessionError(null);
  }, [leaveSignOut]);

  const unlockPreview = useCallback(() => setPreviewUnlocked(true), []);
  const retrySession = useCallback(
    () => setSessionCheck((value) => value + 1),
    [],
  );

  /** Re-reads AAL after the in-app TOTP gate succeeds. */
  const refreshAssurance = useCallback(async () => {
    if (!auth) return;
    try {
      const { data, error: sessionFailure } = await auth.getSession();
      if (sessionFailure) throw sessionFailure;
      setSessionError(null);
      setEmail(data.session?.user.email ?? null);
      if (!data.session) {
        setNeedsMfa(false);
        return;
      }
      setNeedsMfa(await sessionNeedsStepUp(auth));
    } catch {
      setSessionError(SESSION_CHECK_FAILURE);
    }
  }, [auth]);

  return {
    previewMode: PREVIEW_MODE,
    signedIn: PREVIEW_MODE ? previewUnlocked : email !== null && !needsMfa,
    needsMfa,
    email: PREVIEW_MODE
      ? previewUnlocked
        ? SITE.reviewerEmail
        : null
      : email,
    loading,
    linkSent,
    error,
    leaveError,
    sessionError,
    requestLink,
    leave,
    unlockPreview,
    retrySession,
    refreshAssurance,
  };
}
