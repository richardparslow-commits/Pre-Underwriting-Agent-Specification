import { Link } from "react-router-dom";
import { Alert } from "@/components/ui/surface";
import { useOptionalIntakeSession } from "../../features/interview/intakeSessionContext";

export function ResumeInterview() {
  const session = useOptionalIntakeSession();
  return (
    <div className="space-y-3">
      {session?.submitting ? (
        <div role="status" aria-live="polite">
          <Alert tone="warn" title="Your case is still being submitted">
            Links that would leave the interview are paused until its reference appears. Use
            Return to the interview to wait for the result.
          </Alert>
        </div>
      ) : null}
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
