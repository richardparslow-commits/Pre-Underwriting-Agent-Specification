import { useCallback, useEffect, useRef, useState } from "react";
import type { IntakeStep } from "./useInterview";

export interface IntakeHistoryEntry {
  session: string;
  step: IntakeStep;
}
export interface IntakeNavigation {
  step: IntakeStep;
  go: (step: IntakeStep) => void;
  reset: () => void;
}
const STEPS: readonly IntakeStep[] = ["lead", "permission", "interview", "review", "submitted"];

/** History stores only an opaque visit ID and screen name. All entered values,
 * permissions, answers, question position and submission evidence stay in React
 * memory. Old history entries cannot revive a reloaded or reset questionnaire. */
export function useIntakeHistory(
  entry: unknown,
  write: (entry: IntakeHistoryEntry, replace: boolean) => void,
): IntakeNavigation {
  const [session, setSession] = useState(() => crypto.randomUUID());
  const pending = useRef<IntakeHistoryEntry | null>(null);
  useEffect(() => {
    pending.current = null;
  }, [entry]);
  const candidate = entry as Partial<IntakeHistoryEntry> | null;
  const step =
    candidate?.session === session && STEPS.includes(candidate.step as IntakeStep)
      ? (candidate.step as IntakeStep)
      : "lead";
  const go = useCallback(
    (next: IntakeStep) => {
      if (next === step || (pending.current?.session === session && pending.current.step === next))
        return;
      pending.current = { session, step: next };
      // The receipt replaces review rather than adding another submit screen.
      write({ session, step: next }, next === "submitted");
    },
    [session, step, write],
  );
  const reset = useCallback(() => {
    const nextSession = crypto.randomUUID();
    pending.current = null;
    setSession(nextSession);
    write({ session: nextSession, step: "lead" }, true);
  }, [write]);
  return { step, go, reset };
}
