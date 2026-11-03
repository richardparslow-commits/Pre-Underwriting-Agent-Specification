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
  const [queueChanged, setQueueChanged] = useState(false);
  const loaded = useRef<CaseListItem[]>([]);
  const baseline = useRef<{ total: number; headCursor?: string | null } | null>(null);
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
      const seen = new Set<string>();
      const items = (appending ? [...loaded.current, ...page.items] : page.items).filter((item) => {
        if (seen.has(item.reference)) return false;
        seen.add(item.reference);
        return true;
      });
      const first = items[0];
      const displayedHead = first ? `${first.submittedAt}|${first.reference}` : null;
      const headDiffers = page.headCursor !== undefined && displayedHead !== page.headCursor;
      const totalsDisagree = items.length > page.total || (!page.nextCursor && items.length !== page.total);
      if (!appending) {
        baseline.current = { total: page.total, headCursor: page.headCursor };
        setQueueChanged(headDiffers || totalsDisagree);
      } else {
        const changed = headDiffers || totalsDisagree || page.total !== baseline.current?.total
          || (page.headCursor !== undefined && baseline.current?.headCursor !== undefined
            && page.headCursor !== baseline.current.headCursor);
        // Once observed, a change remains visible until a successful head refresh.
        setQueueChanged(current => current || changed);
      }
      loaded.current = items;
      setCases(items);
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
    loaded.current = [];
    baseline.current = null;
    setQueueChanged(false);
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

  return { cases, total, nextCursor, queueChanged, error, loading, loadingMore, load };
}
