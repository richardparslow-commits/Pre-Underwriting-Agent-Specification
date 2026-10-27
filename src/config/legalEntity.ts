/**
 * Resolve the seller named in a marketing consent disclosure.
 *
 * A TCPA authorization cannot name an unconfirmed seller. Blank values and
 * bracket placeholders such as "[Your Company]" are drafts, never a real
 * entity, so both are treated as unconfigured and marketing stays off.
 */
export function resolveLegalEntity(raw: string | undefined): string {
  const entity = (raw ?? "").trim();
  if (entity.length === 0) return "";
  if (/^\[.*\]$/.test(entity)) return "";
  return entity;
}
