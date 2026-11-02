import type { CaseRecord, MarketingRevocationRecord, WithdrawalCursor } from "@/features/interview/types";

export interface WithdrawalPage { items: MarketingRevocationRecord[]; nextCursor: WithdrawalCursor | null }
interface RpcReader { rpc(name: string, params: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }> }
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
function text(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("Withdrawal evidence could not be checked.");
  return value;
}
function id(value: unknown): string {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value === "string" && /^[1-9]\d*$/.test(value)) return value;
  throw new Error("Withdrawal identity could not be checked.");
}
function entry(value: unknown, legacy = false): MarketingRevocationRecord {
  if (!object(value) || (value.channel !== "phone" && value.channel !== "email")) throw new Error("Withdrawal evidence could not be checked.");
  return { id: legacy && value.id === undefined ? undefined : id(value.id), channel: value.channel,
    reason: typeof value.reason === "string" ? value.reason : "", source: text(value.source),
    recordedBy: text(value.recorded_by), recordedAt: text(value.created_at) };
}
function cursor(value: unknown): WithdrawalCursor | null {
  if (value === null) return null;
  if (!object(value)) throw new Error("Older withdrawals could not be checked.");
  return { at: text(value.created_at), id: id(value.id) };
}
export function initialWithdrawals(value: unknown) {
  if (!object(value) || !Array.isArray(value.revocations)) throw new Error("Withdrawal evidence could not be checked.");
  const latest = value.latest_phone_revocation;
  const latestPhoneRevocation = latest === undefined || latest === null ? latest : entry(latest);
  if (latestPhoneRevocation && latestPhoneRevocation.channel !== "phone") throw new Error("Phone withdrawal status could not be checked.");
  return { marketingRevocations: value.revocations.map(x => entry(x, true)), latestPhoneRevocation,
    revocationsCursor: value.revocations_cursor === undefined ? undefined : cursor(value.revocations_cursor) };
}
/** A known withdrawal always wins. Missing server metadata never establishes current consent. */
export function phoneWithdrawal(record: Pick<CaseRecord, "latestPhoneRevocation" | "marketingRevocations">) {
  return record.latestPhoneRevocation ?? record.marketingRevocations.find(x => x.channel === "phone");
}
export async function readWithdrawals(client: RpcReader, reference: string, before: WithdrawalCursor): Promise<WithdrawalPage> {
  const { data, error } = await client.rpc("get_case_marketing_revocations", {
    p_reference: reference, p_before_at: before.at, p_before_id: before.id,
  });
  if (error || !object(data) || !Array.isArray(data.entries)) throw new Error("Older withdrawals could not be loaded. Please retry.");
  return { items: data.entries.map(x=>entry(x)), nextCursor: cursor(data.next_cursor) };
}
