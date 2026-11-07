import { IntakeSessionContext } from "./intakeSessionContext";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useInterview, type InterviewHook } from "./useInterview";
import { useRouterIntakeHistory } from "./useRouterIntakeHistory";
import type { CaseDraft, SubmissionReceipt } from "./types";

export type IntakeSender = (draft: CaseDraft, key: string) => Promise<SubmissionReceipt>;

/** Mounted only across intake and its two information pages. It is never a
 * global store: leaving that route scope or refreshing discards private state. */
export function IntakeSessionProvider({
  children,
  send,
}: {
  children: ReactNode;
  send: IntakeSender;
}) {
  const navigation = useRouterIntakeHistory();
  const interview = useInterview(navigation);
  const [submitting, setSubmitting] = useState(false);
  const [navigationBlocked, setNavigationBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentInterview = useRef(interview);
  useLayoutEffect(() => { currentInterview.current = interview; }, [interview]);
  const inFlight = useRef(false);
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // A pending submission must not be abandoned by a link click: the provider
  // unmounts outside the intake scope, which would drop the receipt that holds
  // the only reference the prospect can quote. Warn instead of navigating.
  // Install this in the same commit as the submitting screen, before paint, so
  // a fast header click cannot slip through the gap before a passive effect.
  useLayoutEffect(() => {
    if (!submitting || typeof document === "undefined") {
      setNavigationBlocked(false);
      return;
    }
    const blockNavigation = (event: MouseEvent) => {
      const target = event.target;
      const anchor = target instanceof Element ? target.closest("a[href]") : null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      event.preventDefault();
      event.stopPropagation();
      setNavigationBlocked(true);
    };
    document.addEventListener("click", blockNavigation, true);
    return () => document.removeEventListener("click", blockNavigation, true);
  }, [submitting]);

  async function submit() {
    if (!alive.current || inFlight.current || interview.receipt) return;
    if (!interview.draft) {
      setError("Please confirm that you have reviewed your answers first.");
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const receipt = await send(interview.draft, interview.submissionKey);
      if (alive.current) currentInterview.current.markSubmitted(receipt);
    } catch (submitError) {
      if (alive.current) {
        // Back may have selected an earlier history entry while waiting. A
        // failed/uncertain request returns to the unchanged review for retry.
        currentInterview.current.finishInterview();
        setError(
          submitError instanceof Error
            ? submitError.message
            : "The case could not be submitted. Nothing was sent.",
        );
      }
    } finally {
      inFlight.current = false;
      if (alive.current) setSubmitting(false);
    }
  }
  // Every handler, including one captured before the pending render, checks
  // the live single-flight ref. Disabling visible buttons alone cannot prevent
  // a history change or a stale callback from changing the submitted snapshot.
  function guard<Args extends unknown[]>(action: (...args: Args) => void) {
    return (...args: Args) => {
      if (!inFlight.current) action(...args);
    };
  }
  // An edit invalidates the previous refusal along with the review
  // confirmation: an old "Submission needs attention" must not sit on a review
  // the prospect has since corrected.
  function edit<Args extends unknown[]>(action: (...args: Args) => void) {
    return (...args: Args) => {
      if (inFlight.current) return;
      setError(null);
      action(...args);
    };
  }
  const protectedInterview: InterviewHook = {
    ...interview,
    step: submitting ? "review" : interview.step,
    setLeadField: edit(interview.setLeadField),
    setAdultAttested: edit(interview.setAdultAttested),
    setConsent: edit(interview.setConsent),
    setAnswer: edit(interview.setAnswer),
    confirmReview: guard(interview.confirmReview),
    begin: guard(interview.begin),
    givePermission: guard(interview.givePermission),
    backToLead: guard(interview.backToLead),
    goToQuestion: guard(interview.goToQuestion),
    nextQuestion: guard(interview.nextQuestion),
    previousQuestion: guard(interview.previousQuestion),
    finishInterview: guard(interview.finishInterview),
    markSubmitted: guard(interview.markSubmitted),
    startOver: edit(interview.startOver),
  };
  return (
    <IntakeSessionContext.Provider
      value={{
        interview: protectedInterview,
        historyEntry: { ...navigation.historyEntry, step: protectedInterview.step },
        submitting, navigationBlocked, error, submit,
      }}
    >
      {children}
    </IntakeSessionContext.Provider>
  );
}
