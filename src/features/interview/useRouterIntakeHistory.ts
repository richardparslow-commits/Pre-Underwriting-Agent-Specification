import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIntakeHistory, type IntakeHistoryEntry } from "./useIntakeHistory";

export function useRouterIntakeHistory() {
  const location = useLocation();
  const navigate = useNavigate();
  const write = useCallback((entry: IntakeHistoryEntry, replace: boolean) => {
    void navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace,
      state: { ...location.state, lppIntake: entry },
    });
  }, [location, navigate]);
  return useIntakeHistory(location.state?.lppIntake, write);
}
