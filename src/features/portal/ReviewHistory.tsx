import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";
import { listCaseReviewHistory } from "@/lib/api";
import type { ReviewHistoryPage } from "@/lib/reviewerVisibility";
import type {
  ReviewHistoryCursor,
  ReviewLogEntry,
} from "@/features/interview/types";
import { formatDate } from "@/lib/utils";

const ACTION_LABEL: Record<ReviewLogEntry["action"], string> = {
  opened: "Opened",
  marked_reviewed: "Marked reviewed",
  requested_clarification: "Clarification requested",
};

/** Mount with a new key after an audited case refresh, replacing stale pages. */
export function ReviewHistory(
  { reference, entries, cursor, loadPage = listCaseReviewHistory }: {
    reference: string;
    entries: ReviewLogEntry[];
    cursor: ReviewHistoryCursor | null | undefined;
    loadPage?: (
      reference: string,
      cursor: ReviewHistoryCursor,
    ) => Promise<ReviewHistoryPage>;
  },
) {
  const [items, setItems] = useState(entries);
  const [next, setNext] = useState(cursor);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const generation = useRef(0);
  useEffect(() => () => {
    generation.current++;
  }, []);

  async function more() {
    if (!next || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const version = generation.current;
    try {
      const page = await loadPage(reference, next);
      if (version !== generation.current) return;
      setItems((current) => {
        const known = new Set(current.map((entry) => entry.id));
        return [
          ...current,
          ...page.items.filter((entry) => !entry.id || !known.has(entry.id)),
        ];
      });
      setNext(page.nextCursor);
    } catch {
      if (version === generation.current) {
        setError(
          "Older review history could not be loaded. The history shown here is incomplete. Please retry.",
        );
      }
    } finally {
      if (version === generation.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }

  return (
    <section className="panel p-5" aria-label="Human review history">
      <h2 className="text-base font-medium">Human review log</h2>
      <ul className="mt-3 space-y-2">
        {items.length === 0
          ? (
            <li className="text-xs text-muted-foreground">
              No review history entries loaded.
            </li>
          )
          : null}
        {items.map((entry, index) => (
          <li key={entry.id ?? `${entry.at}-${index}`} className="text-xs">
            <p className="text-foreground">{ACTION_LABEL[entry.action]}</p>
            <p className="text-muted-foreground">
              {entry.actor} · {formatDate(entry.at)}
            </p>
            {entry.note
              ? (
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  {entry.note}
                </p>
              )
              : null}
          </li>
        ))}
      </ul>
      {cursor === undefined
        ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            Older review history could not be checked. Refresh or contact
            support.
          </p>
        )
        : null}
      {error
        ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p>
        : null}
      {next
        ? (
          <Button
            className="mt-3"
            size="sm"
            variant="outline"
            disabled={busy}
            aria-busy={busy}
            onClick={() => void more()}
          >
            {busy ? "Loading older history…" : "Load older review history"}
          </Button>
        )
        : null}
      <p className="mt-3 border-t border-border pt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
        Every consequential action stays with{" "}
        {SITE.owner}. This portal records review; it does not make an
        eligibility decision.
      </p>
    </section>
  );
}
