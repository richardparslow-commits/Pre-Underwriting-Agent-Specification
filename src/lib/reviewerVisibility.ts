import type {
  CaseStatus,
  ReviewHistoryCursor,
  ReviewLogEntry,
} from "@/features/interview/types";

export interface ReviewHistoryPage {
  items: ReviewLogEntry[];
  nextCursor: ReviewHistoryCursor | null;
}
export interface SafetyCursor {
  submittedAt: string;
  reference: string;
}
export interface SafetyDisclosure {
  reference: string;
  submittedAt: string;
  status: CaseStatus;
}
export interface SafetyPage {
  items: SafetyDisclosure[];
  total: number;
  nextCursor: SafetyCursor | null;
}
interface RpcReader {
  rpc(
    name: string,
    params: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: unknown }>;
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value) {
    throw new Error("Reviewer information could not be loaded.");
  }
  return value;
}
export function historyCursor(value: unknown): ReviewHistoryCursor | null {
  if (value === null) return null;
  if (!object(value)) {
    throw new Error("Older review history could not be checked.");
  }
  return { at: text(value.created_at), id: text(value.id) };
}
export function historyEntry(
  value: unknown,
  allowLegacy = false,
): ReviewLogEntry {
  if (
    !object(value) ||
    !["opened", "marked_reviewed", "requested_clarification"].includes(
      String(value.action),
    )
  ) {
    throw new Error("Review history could not be loaded.");
  }
  return {
    id: allowLegacy && value.id === undefined ? undefined : text(value.id),
    action: value.action as ReviewLogEntry["action"],
    actor: typeof value.actor === "string" && value.actor ? value.actor : "Unknown reviewer",
    at: text(value.created_at),
    note: typeof value.note === "string" ? value.note : undefined,
  };
}
/** Decode the page returned atomically with open_case_for_review. */
export function initialReviewHistory(value: unknown) {
  if (!object(value) || !Array.isArray(value.review_log)) {
    throw new Error("Review history could not be loaded.");
  }
  return {
    reviewLog: value.review_log.map((entry) => historyEntry(entry, true)),
    // Missing metadata from an older deployment is unknown, never complete.
    reviewHistoryCursor: value.review_log_cursor === undefined
      ? undefined
      : historyCursor(value.review_log_cursor),
  };
}
export async function readReviewHistory(
  client: RpcReader,
  reference: string,
  cursor?: ReviewHistoryCursor,
): Promise<ReviewHistoryPage> {
  const { data, error } = await client.rpc("get_case_review_history", {
    p_reference: reference,
    p_before_at: cursor?.at ?? null,
    p_before_id: cursor?.id ?? null,
  });
  if (error || !object(data) || !Array.isArray(data.entries)) {
    throw new Error("Older review history could not be loaded. Please retry.");
  }
  return {
    items: data.entries.map((entry) => historyEntry(entry)),
    nextCursor: historyCursor(data.next_cursor),
  };
}
export async function readSafetyDisclosures(
  client: RpcReader,
  cursor?: SafetyCursor,
): Promise<SafetyPage> {
  const { data, error } = await client.rpc("get_queue_safety_disclosures", {
    p_before_at: cursor?.submittedAt ?? null,
    p_before_reference: cursor?.reference ?? null,
  });
  if (
    error || !object(data) || !Array.isArray(data.entries) ||
    !Number.isSafeInteger(data.total) || Number(data.total) < 0
  ) {
    throw new Error(
      "Safety disclosures across the queue could not be checked. Please retry.",
    );
  }
  const items = data.entries.map((entry): SafetyDisclosure => {
    if (
      !object(entry) ||
      !["saved", "submitted", "reviewed", "needs_clarification"].includes(
        String(entry.status),
      )
    ) {
      throw new Error(
        "Safety disclosures across the queue could not be checked. Please retry.",
      );
    }
    return {
      reference: text(entry.reference),
      submittedAt: text(entry.submitted_at),
      status: entry.status as CaseStatus,
    };
  });
  if (items.length > Number(data.total)) {
    throw new Error(
      "Safety disclosure count could not be checked. Please retry.",
    );
  }
  const next = data.next_cursor;
  if (next !== null && !object(next)) {
    throw new Error("Older safety disclosures could not be checked.");
  }
  return {
    items,
    total: Number(data.total),
    nextCursor: next === null ? null : {
      submittedAt: text(next.submitted_at),
      reference: text(next.reference),
    },
  };
}
