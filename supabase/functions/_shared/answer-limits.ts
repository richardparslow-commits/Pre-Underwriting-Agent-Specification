/**
 * Length limits for free-text answers.
 *
 * The browser controls and the server validator must use the same values:
 * otherwise a value the interview accepts can be refused only after the whole
 * case has been completed.
 */

/** Maximum characters for an answer's own prose or supplemental detail. */
export const MAX_ANSWER_TEXT_LENGTH = 4000;

/** Maximum characters for each sub-field of a compound answer. */
export const MAX_COMPOUND_FIELD_LENGTH = 500;
