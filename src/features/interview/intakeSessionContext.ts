import { createContext, useContext } from "react";
import type { InterviewHook } from "./useInterview";
import type { IntakeHistoryEntry } from "./useIntakeHistory";

export interface IntakeSession {
  interview: InterviewHook;
  historyEntry: IntakeHistoryEntry;
  submitting: boolean;
  error: string | null;
  submit: () => Promise<void>;
}
export const IntakeSessionContext = createContext<IntakeSession | null>(null);

export function useOptionalIntakeSession() {
  return useContext(IntakeSessionContext);
}
export function useIntakeSession() {
  const session = useOptionalIntakeSession();
  if (!session) throw new Error("The questionnaire session is not available.");
  return session;
}
