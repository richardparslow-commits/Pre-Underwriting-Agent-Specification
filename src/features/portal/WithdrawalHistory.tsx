import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { listCaseWithdrawals } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { WithdrawalPage } from "@/lib/withdrawalHistory";
import type { WithdrawalCursor, MarketingRevocationRecord } from "@/features/interview/types";

const identity = (item: MarketingRevocationRecord) => item.id ?? `${item.channel}:${item.recordedAt}:${item.recordedBy}:${item.source}:${item.reason}`;

/** Remount after an audited refresh so stale pages cannot outlive their case. */
export function WithdrawalHistory({ reference, entries, cursor, loadPage = listCaseWithdrawals }: {
  reference: string;
  entries: MarketingRevocationRecord[];
  cursor: WithdrawalCursor | null | undefined;
  loadPage?: (reference: string, cursor: WithdrawalCursor) => Promise<WithdrawalPage>;
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
        const known = new Set(current.map(item => identity(item)));
        return [...current, ...page.items.filter(item => {
          const key = identity(item);
          if (known.has(key)) return false;
          known.add(key);
          return true;
        })];
      });
      setNext(page.nextCursor);
    } catch {
      if (version === generation.current) setError("Older withdrawals could not be loaded. The list shown here is incomplete. Please retry.");
    } finally {
      if (version === generation.current) { inFlight.current = false; setBusy(false); }
    }
  }
  return <>
    <ul className="mt-3 space-y-3" aria-label="Recorded marketing withdrawals">
      {items.length === 0 ? <li className="text-xs text-muted-foreground">No withdrawals recorded.</li> : null}
      {items.map(item => <li key={identity(item)} className="text-xs">
        <p className="leading-relaxed text-foreground">{item.channel === "phone" ? "Phone" : "Email"} · {item.reason}</p>
        <p className="mt-1 text-muted-foreground">{formatDate(item.recordedAt)} · via {item.source} · {item.recordedBy}</p>
      </li>)}
    </ul>
    {cursor === undefined ? <p role="alert" className="mt-3 text-sm text-danger">Older withdrawals could not be checked. Refresh or contact support.</p> : null}
    {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}
    {next ? <Button className="mt-3" size="sm" variant="outline" disabled={busy} aria-busy={busy} onClick={() => void more()}>
      {busy ? "Loading older withdrawals…" : "Load older withdrawals"}
    </Button> : null}
  </>;
}
