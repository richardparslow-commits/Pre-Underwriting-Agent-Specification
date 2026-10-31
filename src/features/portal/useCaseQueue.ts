import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseListItem, CasePage } from "@/lib/api";

/** One queue request at a time; responses belong to the session and cursor that requested them. */
export function useCaseQueue(
  active: boolean,
  loadPage: (cursor?: string) => Promise<CasePage>,
  sessionKey: string | null,
) {
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(active);
  const [loadingMore, setLoadingMore] = useState(false);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const sessionActive = useRef(false);
  const continuation = useRef<string | null>(null);

  const load = useCallback(async (cursor?: string) => {
    // State alone is too late for two activations in the same React batch.
    if (!sessionActive.current || inFlight.current) return;
    if (cursor && cursor !== continuation.current) return;
    inFlight.current = true;
    const requestGeneration = generation.current;
    const appending = Boolean(cursor);
    if (appending) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const page = await loadPage(cursor);
      if (requestGeneration !== generation.current) return;
      setCases((current) => {
        const seen = new Set<string>();
        return (appending ? [...(current ?? []), ...page.items] : page.items).filter((item) => {
          if (seen.has(item.reference)) return false;
          seen.add(item.reference);
          return true;
        });
      });
      setTotal(page.total);
      continuation.current = page.nextCursor;
      setNextCursor(page.nextCursor);
    } catch (failure) {
      if (requestGeneration === generation.current) {
        setError(failure instanceof Error ? failure.message : "Cases could not be loaded.");
      }
    } finally {
      if (requestGeneration === generation.current) {
        inFlight.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [loadPage]);

  useEffect(() => {
    const sessionGeneration = ++generation.current;
    sessionActive.current = active;
    inFlight.current = false;
    continuation.current = null;
    setCases(null);
    setTotal(0);
    setNextCursor(null);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
    if (active) void load();
    return () => {
      generation.current = sessionGeneration + 1;
      sessionActive.current = false;
      inFlight.current = false;
    };
  }, [active, sessionKey, load]);

  return { cases, total, nextCursor, error, loading, loadingMore, load };
}
