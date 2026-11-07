const SIGN_IN_LINK_ERROR =
  "This sign-in link could not be used. It may be invalid, expired, or already used. Request a new sign-in link below.";

/**
 * True when the auth service refused to send a link because the address has no
 * account. The sign-in screen must answer this exactly like a sent link, or the
 * refusal becomes a reviewer-account enumeration oracle. These refusals happen
 * before any email is attempted, so no genuine send failure is hidden.
 */
export function isUnknownReviewerAddress(
  error: { code?: string } | null | undefined,
): boolean {
  return error?.code === "otp_disabled" ||
    error?.code === "user_not_found" ||
    error?.code === "signup_disabled";
}

type RedirectBrowser = {
  location: Pick<Location, "href">;
  history: Pick<History, "state" | "replaceState">;
};

/** Capture before createClient can consume the failed callback. Never echo provider details. */
export function createReviewerSignInFeedback(browser?: RedirectBrowser) {
  let message: string | null = null;
  if (browser) {
    const url = new URL(browser.location.href);
    const fragment = new URLSearchParams(url.hash.slice(1));
    const keys = ["error", "error_code", "error_description"];
    const reviewerCallback = /^\/(?:portal|reviewer)\/?$/.test(url.pathname);
    if (reviewerCallback && keys.some((key) => url.searchParams.has(key) || fragment.has(key))) {
      message = SIGN_IN_LINK_ERROR;
      for (const key of keys) {
        url.searchParams.delete(key);
        fragment.delete(key);
      }
      url.hash = fragment.toString();
      try {
        browser.history.replaceState(browser.history.state, "", url.href);
      } catch {
        // History availability must not prevent explaining the refused link.
      }
    }
  }
  return {
    read: () => message,
    clear: () => { message = null; },
  };
}
