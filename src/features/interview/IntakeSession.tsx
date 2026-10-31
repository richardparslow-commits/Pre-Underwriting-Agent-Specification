import { IntakeSessionContext } from "./intakeSessionContext";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInterview } from "./useInterview";
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
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  async function submit() {
    if (!alive.current || inFlight.current) return;
    if (!interview.draft) {
      setError("Please confirm that you have reviewed your answers first.");
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const receipt = await send(interview.draft, interview.submissionKey);
      if (alive.current) interview.markSubmitted(receipt);
    } catch (submitError) {
      if (alive.current)
        setError(
          submitError instanceof Error
            ? submitError.message
            : "The case could not be submitted. Nothing was sent.",
        );
    } finally {
      inFlight.current = false;
      if (alive.current) setSubmitting(false);
    }
  }
  return (
    <IntakeSessionContext.Provider
      value={{ interview, historyEntry: navigation.historyEntry, submitting, error, submit }}
    >
      {children}
    </IntakeSessionContext.Provider>
  );
}
