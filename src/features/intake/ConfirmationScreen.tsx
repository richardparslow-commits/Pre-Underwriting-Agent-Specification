import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/surface";
import { PREVIEW_MODE, SITE } from "@/config/site";
import type { SubmissionReceipt } from "@/features/interview/types";
import { formatDate } from "@/lib/utils";
import { StatusTimeline } from "./StatusTimeline";

export function ConfirmationScreen({
  receipt,
  onStartOver,
}: {
  receipt: SubmissionReceipt;
  onStartOver: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(receipt.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="ok">Submitted for review</Badge>
          <span className="text-xs text-muted-foreground">{formatDate(receipt.submittedAt)}</span>
        </div>
        <h1 className="text-3xl leading-tight sm:text-4xl">Your case is with {SITE.owner}</h1>
        <p className="prose-note max-w-2xl">
          Your answers are saved and queued for review. This is a preliminary review request, not an
          application, an offer, or an approval — and no coverage exists until a policy is issued.
        </p>
      </header>

      <section className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Case reference</p>
          <p className="mt-1 font-mono text-2xl tracking-tight">{receipt.reference}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Keep this. Quote it in any follow-up about this review.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={copyReference}>
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy reference"}
        </Button>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="panel p-5">
          <h2 className="text-base font-medium">Delivery status</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Each step below is reported separately. A provider accepting a message is not the same as
            it arriving in an inbox, so we only say &ldquo;delivered&rdquo; when a delivery event
            confirms it.
          </p>
          <div className="mt-4">
            <StatusTimeline notification={receipt.notification} />
          </div>
        </section>

        <aside className="space-y-4">
          <section className="panel p-5">
            <h2 className="text-base font-medium">What happens next</h2>
            <ol className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-foreground">1.</span>
                {SITE.owner} reads the full record in the secure review portal.
              </li>
              <li className="flex gap-2">
                <span className="text-foreground">2.</span>
                He may contact you to clarify anything marked uncertain or declined.
              </li>
              <li className="flex gap-2">
                <span className="text-foreground">3.</span>
                Nothing is sent to a carrier or used for a final decision without a separate,
                approved process and human review.
              </li>
            </ol>
          </section>

          <section className="panel p-5">
            <h2 className="flex items-center gap-2 text-base font-medium">
              <Mail className="h-4 w-4" aria-hidden />
              Need to correct something?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Email {SITE.owner} at{" "}
              <a href={`mailto:${SITE.reviewerEmail}`} className="link-quiet">
                {SITE.reviewerEmail}
              </a>{" "}
              with your reference and the correction. The submitted snapshot is not edited in place;
              corrections are recorded alongside it.
            </p>
          </section>
        </aside>
      </div>

      {PREVIEW_MODE ? (
        <section className="rounded-lg border border-dashed border-warn/40 bg-warn/[0.05] p-5">
          <h2 className="text-sm font-semibold">Preview build</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            This case is held in this browser tab only, and no email was sent. You can open the
            reviewer portal to see exactly what {SITE.owner} would receive, or start a fresh test
            interview.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/portal/${receipt.reference}`}>
                Open this case in the portal
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onStartOver}>
              Start a new test interview
            </Button>
          </div>
        </section>
      ) : (
        <Button type="button" variant="quiet" onClick={onStartOver}>
          Start another review
        </Button>
      )}
    </div>
  );
}
