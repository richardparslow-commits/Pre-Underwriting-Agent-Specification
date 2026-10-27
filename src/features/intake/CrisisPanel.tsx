import { PhoneCall, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when a customer discloses current thoughts of self-harm.
 *
 * Deliberately not a modal: the customer can still read the question and the
 * rest of the page. It never claims monitoring, dispatch, or clinical support.
 */
export function CrisisPanel({ onPause }: { onPause?: () => void }) {
  return (
    <section
      role="alert"
      aria-labelledby="crisis-heading"
      className="rounded-lg border border-danger/30 bg-danger/[0.04] p-5 sm:p-6"
    >
      <h2 id="crisis-heading" className="text-xl text-foreground">
        Support is available right now
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/80">
        You told us you are having thoughts of harming yourself. Please reach out now. This site
        does not monitor emergencies and cannot send help to you.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button asChild variant="danger" size="default">
          <a href="tel:988">
            <PhoneCall aria-hidden />
            Call 988
          </a>
        </Button>
        <Button asChild variant="outline" size="default">
          <a href="sms:988">
            <MessageSquare aria-hidden />
            Text 988
          </a>
        </Button>
        <Button asChild variant="ghost" size="default">
          <a href="https://988lifeline.org" target="_blank" rel="noreferrer noopener">
            <ExternalLink aria-hidden />
            988lifeline.org
          </a>
        </Button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        If your life is in immediate danger, call 911. You can stop this interview at any point.
        {onPause ? (
          <>
            {" "}
            <button
              type="button"
              onClick={onPause}
              className="link-quiet font-medium text-foreground"
            >
              Pause and review what I have answered
            </button>
            .
          </>
        ) : null}
      </p>
    </section>
  );
}
