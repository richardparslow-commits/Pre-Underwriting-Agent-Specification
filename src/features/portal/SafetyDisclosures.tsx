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
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    const version = ++generation.current;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    setTotal(null);
    setItems([]);
    setNext(null);
    void loadPage().then((page) => {
      if (version !== generation.current) return;
      setItems(page.items);
      setTotal(page.total);
      setNext(page.nextCursor);
    }).catch(() => {
      if (version === generation.current) {
        setError(
          "Safety disclosures across the queue could not be checked. Cases with disclosures may not be shown here. Please retry.",
        );
      }
    }).finally(() => {
      if (version === generation.current) {
        inFlight.current = false;
        setBusy(false);
      }
    });
    return () => {
      generation.current++;
    };
  }, [refreshKey, retry, loadPage]);

  async function more() {
    if (!next || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const version = generation.current;
    try {
      const page = await loadPage(next);
      if (version !== generation.current) return;
      setItems((current) => {
        const known = new Set(current.map((item) => item.reference));
        return [
          ...current,
          ...page.items.filter((item) => !known.has(item.reference)),
        ];
      });
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
        {total === 0 && !busy && !error
          ? (
            <p>
              No recorded safety disclosures were found across the queue at the
              last check.
            </p>
          )
          : null}
        {total !== null && total > 0
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
                Showing {items.length} of {total} disclosure references.
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
              {busy ? "Loading disclosures…" : "Load older safety disclosures"}
            </Button>
          )
          : null}
        {error && total === null
          ? (
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setRetry((value) => value + 1)}
            >
              Retry safety check
            </Button>
          )
          : null}
        <p className="mt-2">
          The site does not monitor emergencies. This is a list of recorded
          disclosures, not a live safety assessment.
        </p>
      </Alert>
    </section>
  );
}
