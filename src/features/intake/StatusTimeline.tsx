import { Check, CircleDashed, X } from "lucide-react";
import { PREVIEW_MODE } from "@/config/site";
import type { NotificationRecord } from "@/features/interview/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type StepState = "done" | "active" | "pending" | "failed" | "skipped";

interface Step {
  key: string;
  label: string;
  state: StepState;
  detail: string;
}

/**
 * Delivery is reported in four separate states. "Accepted by the provider" is
 * never presented as "delivered", and a preview never claims a send at all.
 */
function buildSteps(notification: NotificationRecord): Step[] {
  const state = notification.state;

  const queued: StepState =
    state === "queued" ? "active" : state === "not_sent" ? "skipped" : "done";
  const accepted: StepState =
    state === "accepted" ? "done" : state === "delivered" ? "done" : state === "failed" ? "failed" : "pending";
  const delivered: StepState = state === "delivered" ? "done" : state === "failed" ? "failed" : "pending";

  return [
    {
      key: "saved",
      label: PREVIEW_MODE ? "Case assembled" : "Case saved securely",
      state: "done",
      detail: PREVIEW_MODE
        ? "Held in this browser tab for preview. Nothing was sent to a server."
        : "The submitted answers were written to the access-controlled case record.",
    },
    {
      key: "queued",
      label: "Review notification queued",
      state: queued,
      detail:
        state === "not_sent"
          ? "No notification was attempted."
          : "A notification was queued for the approved review mailbox.",
    },
    {
      key: "accepted",
      label: "Email provider accepted the message",
      state: accepted,
      detail:
        state === "accepted" || state === "delivered"
          ? "The provider accepted it for delivery. That is not the same as inbox delivery."
          : state === "failed"
            ? "The provider rejected or could not accept the message."
            : "Waiting on the provider.",
    },
    {
      key: "delivered",
      label: "Delivery confirmed by the provider",
      state: delivered,
      detail:
        state === "delivered"
          ? "The provider reported a delivery event."
          : "Only a provider delivery event can confirm this step.",
    },
  ];
}

function icon(state: StepState) {
  if (state === "done") return <Check className="h-3.5 w-3.5" aria-hidden />;
  if (state === "failed") return <X className="h-3.5 w-3.5" aria-hidden />;
  return <CircleDashed className="h-3.5 w-3.5" aria-hidden />;
}

const TONE: Record<StepState, string> = {
  done: "border-ok/40 bg-ok/10 text-ok",
  active: "border-accent/40 bg-accent/10 text-accent",
  pending: "border-border bg-secondary text-muted-foreground",
  failed: "border-danger/40 bg-danger/10 text-danger",
  skipped: "border-border bg-secondary text-muted-foreground",
};

const ITEM: Record<StepState, string> = {
  done: "text-foreground",
  active: "text-foreground",
  pending: "text-muted-foreground",
  failed: "text-foreground",
  skipped: "text-muted-foreground",
};

export function StatusTimeline({ notification }: { notification: NotificationRecord }) {
  const steps = buildSteps(notification);

  return (
    <div>
      <ol className="space-y-4">
        {steps.map((step) => (
          <li key={step.key} className="flex gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                TONE[step.state],
              )}
              aria-hidden
            >
              {icon(step.state)}
            </span>
            <div className="min-w-0">
              <p className={cn("text-sm font-medium", ITEM[step.state])}>
                {step.label}
                <span className="sr-only"> — {step.state}</span>
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <p>Last status change: {formatDate(notification.updatedAt)}</p>
        {notification.detail ? <p>Operational note: {notification.detail}</p> : null}
        {PREVIEW_MODE ? (
          <p className="text-warn">
            Preview mode: nothing was emailed and no case left this browser tab.
          </p>
        ) : null}
      </div>
    </div>
  );
}
