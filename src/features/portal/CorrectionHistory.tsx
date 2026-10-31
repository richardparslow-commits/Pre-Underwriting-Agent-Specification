import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { listCaseCorrections } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { CorrectionPage } from "@/lib/correctionHistory";
import type { CorrectionCursor, CorrectionRecord } from "@/features/interview/types";

/** Remount after an audited refresh so stale pages cannot outlive their case. */
export function CorrectionHistory({ reference, entries, cursor, loadPage = listCaseCorrections }: {
  reference: string;
  entries: CorrectionRecord[];
  cursor: CorrectionCursor | null | undefined;
  loadPage?: (reference: string, cursor: CorrectionCursor) => Promise<CorrectionPage>;
}) {
  const [items, setItems] = useState(entries);
  const [next, setNext] = useState(cursor);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  async function more() {
    if (!next || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const version = generation.current;
    try {
      const page = await loadPage(reference, next);
      if (version !== generation.current) return;
      setItems(current => {
        const known = new Set(current.map(item => String(item.id)));
        return [...current, ...page.items.filter(item => {
          const key = String(item.id);
          if (known.has(key)) return false;
          known.add(key);
          return true;
        })];
      });
      setNext(page.nextCursor);
    } catch {
      if (version === generation.current) setError("Older corrections could not be loaded. The list shown here is incomplete. Please retry.");
    } finally {
      if (version === generation.current) { inFlight.current = false; setBusy(false); }
    }
  }
  return <>
    <ul className="mt-3 space-y-3" aria-label="Recorded corrections">
      {items.length === 0 ? <li className="text-xs text-muted-foreground">No corrections recorded.</li> : null}
      {items.map(item => <li key={item.id} className="text-xs">
        <p className="leading-relaxed text-foreground">{item.detail}</p>
        <p className="mt-1 text-muted-foreground">{item.recordedBy} · {formatDate(item.recordedAt)}</p>
      </li>)}
    </ul>
    {cursor === undefined ? <p role="alert" className="mt-3 text-sm text-danger">Older corrections could not be checked. Refresh or contact support.</p> : null}
    {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}
    {next ? <Button className="mt-3" size="sm" variant="outline" disabled={busy} aria-busy={busy} onClick={() => void more()}>
      {busy ? "Loading older corrections…" : "Load older corrections"}
    </Button> : null}
  </>;
}
