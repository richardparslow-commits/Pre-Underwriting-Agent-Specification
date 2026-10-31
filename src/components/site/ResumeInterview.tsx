import { Link } from "react-router-dom";
import { useOptionalIntakeSession } from "../../features/interview/intakeSessionContext";

export function ResumeInterview() {
  const session = useOptionalIntakeSession();
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        You can read these policy pages and return to your interview in this tab
        without losing your entries. Refreshing or leaving the questionnaire
        clears unsent answers.
      </p>
      <Link
        to="/start"
        state={session ? { lppIntake: session.historyEntry } : undefined}
        className="link-quiet text-sm"
      >
        Return to the interview
      </Link>
    </div>
  );
}
