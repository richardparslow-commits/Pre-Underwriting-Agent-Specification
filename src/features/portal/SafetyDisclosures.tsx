import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/surface";
import { listSafetyDisclosures } from "@/lib/api";
import type {
  SafetyCursor,
  SafetyDisclosure,
  SafetyPage,
} from "@/lib/reviewerVisibility";

export function SafetyDisclosures(
  { refreshKey, loadPage = listSafetyDisclosures }: {
    refreshKey: number;
    loadPage?: (cursor?: SafetyCursor) => Promise<SafetyPage>;
  },
) {
  const [items, setItems] = useState<SafetyDisclosure[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [next, setNext] = useState<SafetyCursor | null>(null);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    const version = ++generation.current;
    inFlight.current = true;
    setBusy(true);
    setRefreshing(true);
    setError(null);
    // Preserve known links until a fresh head succeeds, including on failure.
    void loadPage().then((page) => {
      if (version !== generation.current) return;
      setItems(page.items);
      setTotal(page.total);
      setNext(page.nextCursor);
      setNeedsRefresh(!page.nextCursor && page.items.length !== page.total);
    }).catch(() => {
      if (version === generation.current) {
        setNeedsRefresh(true);
        setError(
          "Safety disclosures across the queue could not be checked. Cases with disclosures may not be shown here. Please retry.",
        );
      }
    }).finally(() => {
      if (version === generation.current) {
        inFlight.current = false;
        setBusy(false);
        setRefreshing(false);
      }
    });
    return () => {
      generation.current++;
    };
  }, [refreshKey, retry, loadPage]);

  function refresh() {
    if (inFlight.current) return;
    inFlight.current = true;
    setRetry((value) => value + 1);
  }

  async function more() {
    if (!next || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const version = generation.current;
    try {
      const page = await loadPage(next);
      if (version !== generation.current) return;
      const known = new Set(items.map((item) => item.reference));
      const combined = [...items];
      for (const item of page.items) {
        if (!known.has(item.reference)) {
          known.add(item.reference);
          combined.push(item);
        }
      }
      setItems(combined);
      // An older cursor cannot reach cases that arrived above the first page.
      // Keep the warning sticky until a successful fresh-head read replaces it.
      if (
        page.total !== total ||
        (!page.nextCursor && combined.length !== page.total)
      ) {
        setNeedsRefresh(true);
      }
      setTotal(page.total);
      setNext(page.nextCursor);
    } catch {
      if (version === generation.current) {
        setError(
          "Older safety disclosures could not be loaded. The list below is incomplete. Please retry.",
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
    <section
      className="mt-6"
      aria-label="Queue-wide safety disclosures"
      aria-busy={busy}
    >
      <Alert
        tone={total !== null && total > 0 ? "danger" : "warn"}
        title="Safety disclosures across the queue"
      >
        {busy && total === null
          ? (
            <p role="status">
              Checking safety disclosures across the whole queue…
            </p>
          )
          : null}
        {error ? <p role="alert">{error}</p> : null}
        {busy && total !== null && refreshing
          ? <p role="status">Refreshing safety disclosures…</p>
          : null}
        {needsRefresh && total !== null
          ? (
            <p role="alert">
              The disclosure list may have changed. Some references may be
              missing. Refresh safety disclosures to load the latest references.
            </p>
          )
          : null}
        {total === 0 && !busy && !error && !needsRefresh
          ? (
            <p>
              No recorded safety disclosures were found across the queue at the
              last check.
            </p>
          )
          : null}
        {total !== null && (total > 0 || items.length > 0)
          ? (
            <>
              <p>
                {total} case{total === 1 ? "" : "s"}{" "}
                across the queue include a recorded disclosure of current
                thoughts of self-harm. This includes reviewed cases.
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                {items.map((item) => (
                  <li key={item.reference}>
                    <Link
                      className="underline"
                      to={`/portal/${item.reference}`}
                    >
                      {item.reference}
                    </Link>
                    {item.status === "reviewed" ? " (reviewed)" : null}
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                {needsRefresh
                  ? (
                    <>
                      Showing {items.length}{" "}
                      previously loaded disclosure references.
                    </>
                  )
                  : (
                    <>
                      Showing {items.length} of {total} disclosure references.
                    </>
                  )}
              </p>
            </>
          )
          : null}
        {next
          ? (
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void more()}
            >
              {busy && !refreshing
                ? "Loading disclosures…"
                : "Load older safety disclosures"}
            </Button>
          )
          : null}
        <Button
          className="mt-3"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={refresh}
        >
          {refreshing
            ? "Refreshing safety disclosures…"
            : error && total === null
            ? "Retry safety check"
            : "Refresh safety disclosures"}
        </Button>
        <p className="mt-2">
          The site does not monitor emergencies. This is a list of recorded
          disclosures, not a live safety assessment.
        </p>
      </Alert>
    </section>
  );
}
