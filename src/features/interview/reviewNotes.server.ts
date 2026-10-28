/**
 * Reviewer/build-only notes for held questions.
 *
 * This module is imported by the server-bank generator and the structural
 * checks, never by a browser entry point. The public `Question` type has no
 * `reviewNote` field: held rationale is attached server-side so it cannot be
 * shipped to customers in the JavaScript bundle.
 *
 * Keep the keys exactly aligned with the held rows in `questionBank.ts`.
 */
export const REVIEW_NOTES: Readonly<Record<string, string>> = {
  "ID-04":
    "Collection of sex/gender needs jurisdiction and carrier review, including whether the question is permissible at all and which answer set is authorized. Not asked until that review is documented.",
  "MED-11":
    "Requires documented legal, clinical and underwriting review of necessity, wording, confidentiality and state restrictions before any automated collection. Do not deploy this row unchanged.",
  "MH-06":
    "Detail-level suicide questions need clinical and legal review for wording, necessity and crisis support before automated collection. The approved screening question and current-safety question cover the immediate need.",
  "RES-04":
    "Immigration-status detail is sensitive and the source wording uses static categories that may be out of date. Requires legal review of necessity and approved answer sets before collection. No document numbers are collected here.",
  "RES-05":
    "Identity-document numbers are not collected in this intake. If ever required, collection must move to an approved downstream workflow with a documented necessity and secure handling.",
} as const;
