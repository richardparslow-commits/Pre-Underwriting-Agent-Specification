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
async function readLegacyCaseQueue(client: SupabaseClient, cursor?: string): Promise<CasePage> {
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

  // One minimal row identifies the current queue head alongside the queue-wide
  // exact count. A count alone misses an insertion balanced by a deletion.
  // Both requests use the same authenticated projection; no payload is read.
  const [{ data, error }, totalResult] = await Promise.all([
    query,
    client.from("case_summaries").select("reference, submitted_at", { count: "exact" })
      .order("submitted_at", { ascending: false }).order("reference", { ascending: false }).limit(1),
  ]);
  const count = totalResult.count;
  const metadata = totalResult.data;
  if (error || totalResult.error || count === null || !Number.isSafeInteger(count) || count < 0
      || !Array.isArray(metadata) || metadata.length !== (count > 0 ? 1 : 0)) {
    throw new Error("Cases could not be loaded.");
  }
  const head = metadata[0];
  if (count > 0 && (!head || typeof head.reference !== "string" || !head.reference || typeof head.submitted_at !== "string" || !head.submitted_at)) {
    throw new Error("Cases could not be loaded.");
  }

  const rows = (data ?? []) as CaseSummaryRow[];
  const page = rows.slice(0, QUEUE_PAGE_SIZE);
  const last = page[page.length - 1];
  const hasMore = rows.length > QUEUE_PAGE_SIZE;

  return {
    items: page.map(summaryToItem),
    total: count,
    headCursor: head ? `${head.submitted_at}|${head.reference}` : null,
    nextCursor: hasMore && last ? `${last.submitted_at}|${last.reference}` : null,
  };
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validIdentity(value: unknown): value is Record<string, unknown> & { submitted_at: string; reference: string } {
  return object(value) && typeof value.reference === "string" && value.reference.trim().length > 0
    && typeof value.submitted_at === "string" && Number.isFinite(Date.parse(value.submitted_at));
}
function decodeQueue(value: unknown): CasePage {
  const fail = () => { throw new Error("Cases could not be loaded."); };
  if (!object(value) || !Array.isArray(value.entries) || value.entries.length > QUEUE_PAGE_SIZE
    || !Number.isSafeInteger(value.total) || Number(value.total) < value.entries.length) return fail();
  const total = Number(value.total);
  if (total === 0 ? value.head !== null : !validIdentity(value.head)) return fail();
  const items = value.entries.map((entry: unknown) => {
    if (!validIdentity(entry) || !object(entry)
      || !["saved", "submitted", "reviewed", "needs_clarification"].includes(String(entry.status))
      || !["not_sent", "queued", "accepted", "delivered", "failed"].includes(String(entry.notification_state))
      || typeof entry.crisis_disclosure !== "boolean"
      || !Number.isSafeInteger(entry.unanswered) || Number(entry.unanswered) < 0
      || ![entry.first_name, entry.last_name, entry.residence_state].every(x => x === null || typeof x === "string")) return fail();
    return summaryToItem(entry as unknown as CaseSummaryRow);
  });
  let nextCursor: string | null = null;
  if (value.next_cursor !== null) {
    const last = items.at(-1);
    if (!validIdentity(value.next_cursor) || items.length !== QUEUE_PAGE_SIZE || !last
      || value.next_cursor.reference !== last.reference || value.next_cursor.submitted_at !== last.submittedAt) return fail();
    nextCursor = `${value.next_cursor.submitted_at}|${value.next_cursor.reference}`;
  }
  return { items, total, nextCursor, headCursor: validIdentity(value.head) ? `${value.head.submitted_at}|${value.head.reference}` : null };
}

/** The optimized RPC selects a bounded page before projecting any answer counts.
 * Only an explicitly missing RPC permits the old metadata-only view during rollout. */
export async function readCaseQueue(client: SupabaseClient, cursor?: string): Promise<CasePage> {
  let at: string | null = null, reference: string | null = null;
  if (cursor) {
    const parts = cursor.split("|");
    if (parts.length !== 2 || !parts[0] || !Number.isFinite(Date.parse(parts[0])) || !parts[1]?.trim())
      throw new Error("The case cursor is not valid.");
    [at, reference] = parts as [string, string];
  }
  const { data, error } = await client.rpc("get_case_queue_page", { p_before_at: at, p_before_reference: reference });
  if (error) {
    if (error.code === "PGRST202" && /public\.get_case_queue_page\b/.test(error.message)) return readLegacyCaseQueue(client, cursor);
    throw new Error("Cases could not be loaded.");
  }
  return decodeQueue(data);
}
