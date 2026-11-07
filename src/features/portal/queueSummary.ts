/**
 * Count text before the first page has been read. A null total is not a
 * failure while the request is still in flight.
 */
export function queueCountPending(loading: boolean): string {
  return loading ? "loading cases…" : "case count unavailable";
}
