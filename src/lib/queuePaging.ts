import type { SupabaseClient } from "@supabase/supabase-js";
import type { CaseListItem, CasePage } from "./api";

/** Queue projection. Deliberately has no payload or answer field. */
interface CaseSummaryRow {
  reference: string;
  submitted_at: string;
  status: CaseListItem["status"];
  notification_state: CaseListItem["notificationState"];
  crisis_disclosure: boolean;
  first_name: string | null;
  last_name: string | null;
  residence_state: string | null;
  unanswered: number;
}

const QUEUE_PAGE_SIZE = 25;

function summaryToItem(row: CaseSummaryRow): CaseListItem {
  return {
    reference: row.reference,
    submittedAt: row.submitted_at,
    status: row.status,
    notificationState: row.notification_state,
    crisisDisclosure: row.crisis_disclosure,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    residenceState: row.residence_state ?? "",
    unanswered: Number(row.unanswered) || 0,
  };
}

/** Read summaries through the caller’s authenticated, RLS-protected client. */
export async function readCaseQueue(client: SupabaseClient, cursor?: string): Promise<CasePage> {
  // The queue is a metadata projection. Never select `payload` here: that
  // would transfer every health answer for a whole page before the reviewer
  // opens any of them and would bypass the per-case `opened` audit.
  let query = client
    .from("case_summaries")
    .select(
      "reference, submitted_at, status, notification_state, crisis_disclosure, first_name, last_name, residence_state, unanswered",
    )
    .order("submitted_at", { ascending: false })
    .order("reference", { ascending: false })
    .limit(QUEUE_PAGE_SIZE + 1);

  if (cursor) {
    const separator = cursor.indexOf("|");
    const submittedAt = cursor.slice(0, separator);
    const reference = cursor.slice(separator + 1);
    if (separator < 1 || !reference) throw new Error("The case cursor is not valid.");
    query = query.or(
      `submitted_at.lt.${submittedAt},and(submitted_at.eq.${submittedAt},reference.lt.${reference})`,
    );
  }

  // Count the entire reviewer-visible queue, independently of the page cursor.
  // HEAD returns no rows, and the same authenticated client enforces the view's
  // reviewer/MFA permissions for both requests. Refresh on every page so newly
  // submitted or removed cases change the total instead of freezing it.
  const [{ data, error }, totalResult] = await Promise.all([
    query,
    client.from("case_summaries").select("reference", { count: "exact", head: true }),
  ]);
  const count = totalResult.count;
  if (error || totalResult.error || count === null || !Number.isSafeInteger(count) || count < 0) {
    throw new Error("Cases could not be loaded.");
  }

  const rows = (data ?? []) as CaseSummaryRow[];
  const page = rows.slice(0, QUEUE_PAGE_SIZE);
  const last = page[page.length - 1];
  const hasMore = rows.length > QUEUE_PAGE_SIZE;

  return {
    items: page.map(summaryToItem),
    total: count,
    nextCursor: hasMore && last ? `${last.submitted_at}|${last.reference}` : null,
  };
}
