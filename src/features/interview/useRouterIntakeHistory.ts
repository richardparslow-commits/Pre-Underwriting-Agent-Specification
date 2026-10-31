import { useCallback, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIntakeHistory, type IntakeHistoryEntry } from "./useIntakeHistory";
import { isIntakeFormPath } from "./intakeSessionScope";

export function useRouterIntakeHistory() {
  const location = useLocation();
  const navigate = useNavigate();
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
  return useIntakeHistory(
    location.state?.lppIntake,
    write,
    isIntakeFormPath(location.pathname),
  );
}
