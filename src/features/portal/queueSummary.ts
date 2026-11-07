export interface QueueCountSummaryInput {
  total: number | null;
  displayed: number;
  loading: boolean;
}

/**
 * The queue header's count text. A null total means no first page has been
 * read yet, which is not a failure while the request is still in flight.
 */
export function queueCountSummary({
  total,
  displayed,
  loading,
}: QueueCountSummaryInput): string {
  if (total === null) {
    return loading ? "loading cases…" : "case count unavailable";
  }
  return `showing ${displayed} of ${total} case${total === 1 ? "" : "s"}`;
}
