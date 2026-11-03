import { useCallback, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { useIntakeHistory, type IntakeHistoryEntry } from "./useIntakeHistory";
import { isIntakeFormPath, isIntakeSessionPath } from "./intakeSessionScope";

export function useRouterIntakeHistory() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const current = useRef(location);
  useLayoutEffect(() => {
    current.current = location;
  }, [location]);
  const write = useCallback(
    (entry: IntakeHistoryEntry, replace: boolean) => {
      const location = current.current;
      void navigate(`${location.pathname}${location.search}${location.hash}`, {
        replace,
        state: { ...location.state, lppIntake: entry },
      });
    },
    [navigate],
  );
  const previous = useRef<{
    pathname: string;
    entry: IntakeHistoryEntry;
  } | null>(null);
  const entry = location.state?.lppIntake;
  // A plain header/footer link has no screen metadata. Only a return from a
  // policy route in this mounted session may borrow its remembered position.
  const resume =
    navigationType !== "POP" &&
    entry == null &&
    isIntakeFormPath(location.pathname) &&
    previous.current &&
    isIntakeSessionPath(previous.current.pathname) &&
    !isIntakeFormPath(previous.current.pathname)
      ? previous.current.entry
      : null;
  const navigation = useIntakeHistory(
    resume ?? entry,
    write,
    isIntakeFormPath(location.pathname),
  );
  const { session, step } = navigation.historyEntry;
  useLayoutEffect(() => {
    previous.current = { pathname: location.pathname, entry: { session, step } };
    // Replace the new unmarked route entry; do not add a duplicate Back step.
    if (resume) write(resume, true);
  }, [location.pathname, session, step, resume, write]);
  return navigation;
}
