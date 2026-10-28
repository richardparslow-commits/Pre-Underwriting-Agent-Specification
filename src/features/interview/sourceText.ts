/**
 * Verbatim source wording.
 *
 * This module is imported only by build checks, the local development
 * validator and the server-bank generator. It must never be imported by the
 * customer application: the public bank carries source references, while the
 * wording stays in the build/audit inventory.
 */
import { sourceIdsFor } from "./reconciliation";
import { SOURCE_BY_ID } from "./sourceInventory";

/**
 * The source wording behind a bank question, with each source id and its own
 * window, so a merged row shows every question it merged rather than one.
 */
export function sourceTextFor(questionId: string): string {
  const ids = sourceIdsFor(questionId);
  if (ids.length === 0) {
    return "Not in the source questionnaire. Added by Life Policy Pilot.";
  }

  return ids
    .map((id) => {
      const question = SOURCE_BY_ID[id];
      if (!question) return `${id} (source missing)`;
      return `${question.id} (${question.timeframe}): ${question.text}`;
    })
    .join(" • ");
}
