import type { CorrectionCursor, CorrectionRecord } from "@/features/interview/types";

export interface CorrectionPage {
  items: CorrectionRecord[];
  nextCursor: CorrectionCursor | null;
}
interface RpcReader {
  rpc(name: string, params: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("Corrections could not be loaded.");
  return value;
}
function id(value: unknown): string {
  // Old servers emitted JSON numbers; never silently round an unsafe bigint.
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value === "string" && /^[1-9]\d*$/.test(value)) return value;
  throw new Error("Correction identity could not be checked.");
}
function cursor(value: unknown): CorrectionCursor | null {
  if (value === null) return null;
  if (!object(value)) throw new Error("Older corrections could not be checked.");
  return { at: text(value.created_at), id: id(value.id) };
}
function entry(value: unknown): CorrectionRecord {
  if (!object(value)) throw new Error("Corrections could not be loaded.");
  return {
    id: id(value.id), detail: text(value.detail),
    recordedBy: text(value.recorded_by), recordedAt: text(value.created_at),
  };
}
export function initialCorrections(value: unknown) {
  if (!object(value) || !Array.isArray(value.corrections)) throw new Error("Corrections could not be loaded.");
  return {
    corrections: value.corrections.map(entry),
    correctionsCursor: value.corrections_cursor === undefined ? undefined : cursor(value.corrections_cursor),
  };
}
export async function readCorrections(client: RpcReader, reference: string, before: CorrectionCursor): Promise<CorrectionPage> {
  const { data, error } = await client.rpc("get_case_corrections", {
    p_reference: reference, p_before_at: before.at, p_before_id: before.id,
  });
  if (error || !object(data) || !Array.isArray(data.entries)) throw new Error("Older corrections could not be loaded. Please retry.");
  return { items: data.entries.map(entry), nextCursor: cursor(data.next_cursor) };
}
