import { SECTION_BY_ID, SECTIONS } from "./sections";
import { QUESTION_BANK } from "./questionBank";
import { QUESTIONNAIRE_VERSION } from "./types";
import type {
  AnswerRecord,
  AnswerState,
  Answers,
  CaseDraft,
  CaseFlag,
  Disposition,
  DraftSummary,
  LeadDetails,
  Question,
  SectionId,
  SubmittedAnswer,
} from "./types";

/**
 * The engine is deliberately declarative: the question bank describes what may
 * be asked and when, and this module answers the questions the UI needs. No
 * question text is generated here, and no answer is ever inferred.
 */

const SECTION_ORDER = new Map(SECTIONS.map((section) => [section.id, section.order]));

export const ORDERED_QUESTIONS: Question[] = QUESTION_BANK.map((question, index) => ({
  question,
  index,
}))
  .sort((a, b) => {
    const sectionDiff =
      (SECTION_ORDER.get(a.question.section) ?? 99) - (SECTION_ORDER.get(b.question.section) ?? 99);
    return sectionDiff !== 0 ? sectionDiff : a.index - b.index;
  })
  .map((entry) => entry.question);

const QUESTION_INDEX = new Map(ORDERED_QUESTIONS.map((question, index) => [question.id, index]));

export function questionIndex(id: string): number {
  return QUESTION_INDEX.get(id) ?? -1;
}

/** True when every `askWhen` condition for this question is satisfied. */
export function isApplicable(question: Question, answers: Answers): boolean {
  if (!question.askWhen) return true;

  const parent = answers[question.askWhen.questionId];
  if (!parent) return false;

  const selected = new Set<string>();
  if (parent.state) selected.add(parent.state);
  if (parent.value) selected.add(parent.value);
  for (const value of parent.values ?? []) selected.add(value);

  return question.askWhen.includes.some((option) => selected.has(option));
}

export function isVisible(question: Question, answers: Answers): boolean {
  if (question.reviewStatus === "human_review_required") return false;
  return isApplicable(question, answers);
}

export function visibleQuestions(answers: Answers): Question[] {
  return ORDERED_QUESTIONS.filter((question) => isVisible(question, answers));
}

export function visibleInSection(answers: Answers, section: SectionId): Question[] {
  return visibleQuestions(answers).filter((question) => question.section === section);
}

/** Sections that will actually show at least one question. */
export function activeSections(answers: Answers): SectionId[] {
  const seen = new Set<SectionId>();
  for (const question of visibleQuestions(answers)) seen.add(question.section);
  return SECTIONS.filter((section) => seen.has(section.id)).map((section) => section.id);
}

function hasText(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function answerHasContent(question: Question, answer: AnswerRecord | undefined): boolean {
  if (!answer) return false;

  if (question.kind === "yesno") {
    return answer.state !== undefined || Object.values(answer.fields ?? {}).some(hasText);
  }

  if (question.compound) {
    return Object.values(answer.fields ?? {}).some(hasText);
  }

  return hasText(answer.value) || (answer.values ?? []).length > 0;
}

/**
 * The single place that decides how an item appears in the case record.
 * A blank is never converted into "answered" and never into "no".
 */
export function dispositionFor(
  question: Question,
  answer: AnswerRecord | undefined,
  answers: Answers,
): Disposition {
  if (question.reviewStatus === "human_review_required") return "held_for_review";
  if (!isVisible(question, answers)) return "not_asked";
  if (!answerHasContent(question, answer)) return "unresolved";

  switch (answer?.state) {
    case "unknown":
      return "unknown";
    case "declined":
      return "declined";
    case "not_applicable":
      return "not_applicable";
    default:
      return "answered";
  }
}

function optionLabel(question: Question | { options?: Array<{ value: string; label: string }> }, value: string) {
  return question.options?.find((option) => option.value === value)?.label ?? value;
}

const STATE_LABEL: Record<AnswerState, string> = {
  yes: "Yes",
  no: "No",
  unknown: "I'm not sure",
  declined: "Prefer not to answer",
  not_applicable: "Not applicable",
};

export function answerTextFor(question: Question, answer: AnswerRecord | undefined): string {
  if (!answer) return "No answer recorded";
  if (question.kind === "yesno" && answer.state) return STATE_LABEL[answer.state];
  if (answer.values && answer.values.length > 0) {
    return answer.values.map((value) => optionLabel(question, value)).join(", ");
  }
  if (answer.value) return optionLabel(question, answer.value);
  if (question.compound) return "Details provided";
  return "No answer recorded";
}

const MULTI_SEPARATOR = "|";

/** Turns a stored field value into display text, resolving option labels. */
function fieldValueText(
  kind: Question["kind"],
  options: Array<{ value: string; label: string }> | undefined,
  raw: string,
): string {
  if (!options) return raw.trim();
  if (kind === "multi_choice") {
    return raw
      .split(MULTI_SEPARATOR)
      .map((value) => options.find((option) => option.value === value)?.label ?? value)
      .join(", ");
  }
  return options.find((option) => option.value === raw)?.label ?? raw.trim();
}

/** Component answers for compound questions, in the order the customer saw. */
export function fieldEntries(
  question: Question,
  answer: AnswerRecord | undefined,
): Array<{ id: string; label: string; value: string }> {
  if (!answer?.fields || !question.fields) return [];

  return question.fields.flatMap((field) => {
    const raw = answer.fields?.[field.id];
    if (!raw || !raw.trim()) return [];
    return [{ id: field.id, label: field.label, value: fieldValueText(field.kind, field.options, raw) }];
  });
}

export function detailEntries(
  question: Question,
  answer: AnswerRecord | undefined,
): Array<{ label: string; value: string }> {
  if (!answer?.details || !question.detailPrompts) return [];

  return question.detailPrompts.flatMap((prompt) => {
    const raw = answer.details?.[prompt.id];
    if (!raw || !raw.trim()) return [];
    return [{ label: prompt.label, value: fieldValueText(prompt.kind, prompt.options, raw) }];
  });
}

export interface Progress {
  sections: Array<{ id: SectionId; title: string; answered: number; total: number }>;
  answered: number;
  total: number;
  unresolved: number;
  declined: number;
  unknown: number;
}

export function progressFor(answers: Answers): Progress {
  const visible = visibleQuestions(answers);
  const bySection = new Map<SectionId, { answered: number; total: number }>();

  let answered = 0;
  let unresolved = 0;
  let declined = 0;
  let unknown = 0;

  for (const question of visible) {
    const entry = bySection.get(question.section) ?? { answered: 0, total: 0 };
    entry.total += 1;

    const disposition = dispositionFor(question, answers[question.id], answers);
    if (disposition === "unresolved") unresolved += 1;
    else entry.answered += 1;
    if (disposition === "declined") declined += 1;
    if (disposition === "unknown") unknown += 1;
    if (disposition === "answered") answered += 1;

    bySection.set(question.section, entry);
  }

  return {
    sections: SECTIONS.filter((section) => bySection.has(section.id)).map((section) => {
      const entry = bySection.get(section.id) ?? { answered: 0, total: 0 };
      return { id: section.id, title: section.shortTitle, ...entry };
    }),
    answered,
    total: visible.length,
    unresolved,
    declined,
    unknown,
  };
}

export function crisisDisclosed(answers: Answers): boolean {
  return ORDERED_QUESTIONS.some(
    (question) =>
      question.crisisFollowUp && answers[question.id]?.state === "yes",
  );
}

export function unansweredQuestions(answers: Answers): Question[] {
  return visibleQuestions(answers).filter(
    (question) => dispositionFor(question, answers[question.id], answers) === "unresolved",
  );
}

/**
 * Builds the complete question record for a submission: every source question
 * appears with its disposition, including the rows that were never asked.
 */
export function toSubmittedAnswers(answers: Answers): SubmittedAnswer[] {
  return ORDERED_QUESTIONS.map((question) => {
    const answer = answers[question.id];
    const disposition = dispositionFor(question, answer, answers);

    return {
      questionId: question.id,
      section: question.section,
      sourceRef: question.sourceRef,
      sourceText: question.sourceText,
      customerText: question.customerText,
      timeframe: question.timeframe,
      status: question.status,
      reviewStatus: question.reviewStatus,
      reviewNote: question.reviewNote,
      sensitive: question.sensitive ? true : undefined,
      disposition,
      answerText:
        disposition === "held_for_review"
          ? "Held for human review — not asked"
          : disposition === "not_asked"
            ? "Not asked — branch not applicable"
            : disposition === "unresolved"
              ? "Not answered"
              : answerTextFor(question, answer),
      fields: fieldEntries(question, answer),
      details: detailEntries(question, answer),
    } satisfies SubmittedAnswer;
  });
}

export function buildFlags(answers: Answers): CaseFlag[] {
  const flags: CaseFlag[] = [];
  const progress = progressFor(answers);

  if (crisisDisclosed(answers)) {
    flags.push({
      id: "crisis-disclosure",
      label: "Current safety disclosure",
      detail:
        "The customer answered yes to current thoughts of self-harm. Review this case first, and follow the approved crisis-support script. The site does not monitor emergencies.",
      severity: "urgent",
    });
  }

  if (progress.unresolved > 0) {
    flags.push({
      id: "unresolved-items",
      label: `${progress.unresolved} unanswered item${progress.unresolved === 1 ? "" : "s"}`,
      detail:
        "Submitted with unresolved items. These are not treated as 'No'; ask the customer directly before relying on them.",
      severity: "attention",
    });
  }

  const declinedCount = toSubmittedAnswers(answers).filter(
    (answer) => answer.disposition === "declined",
  ).length;
  if (declinedCount > 0) {
    flags.push({
      id: "declined-items",
      label: `${declinedCount} question${declinedCount === 1 ? "" : "s"} declined`,
      detail:
        "The customer chose not to answer. Offer a human conversation rather than pressing for an answer.",
      severity: "attention",
    });
  }

  const heldCount = toSubmittedAnswers(answers).filter(
    (answer) => answer.disposition === "held_for_review",
  ).length;
  if (heldCount > 0) {
    flags.push({
      id: "held-for-review",
      label: `${heldCount} source question${heldCount === 1 ? "" : "s"} held for review`,
      detail:
        "These source questions are withheld from automated collection pending legal and underwriting approval. They remain in the question record for the coverage audit.",
      severity: "info",
    });
  }

  const uncertain = toSubmittedAnswers(answers).filter(
    (answer) => answer.disposition === "unknown",
  ).length;
  if (uncertain > 0) {
    flags.push({
      id: "uncertain-answers",
      label: `${uncertain} uncertain answer${uncertain === 1 ? "" : "s"}`,
      detail: "Recorded as uncertain, not as No. Confirm the detail during the review call.",
      severity: "info",
    });
  }

  return flags;
}

/**
 * A navigation aid, not an interpretation. It only restates what the customer
 * recorded and links every point back to the question ids that support it.
 */
export function buildDraftSummary(answers: SubmittedAnswer[]): DraftSummary {
  const sections = SECTIONS.map((section) => {
    const points: Array<{ text: string; questionIds: string[] }> = [];

    const answered = answers.filter(
      (answer) =>
        answer.section === section.id &&
        (answer.disposition === "answered" ||
          answer.disposition === "unknown" ||
          answer.disposition === "declined"),
    );

    for (const answer of answered) {
      const extras = [
        ...(answer.fields ?? []).map((field) => `${field.label}: ${field.value}`),
        ...(answer.details ?? []).map((detail) => `${detail.label}: ${detail.value}`),
      ];

      const text =
        extras.length > 0
          ? `${answer.answerText} — ${extras.join("; ")}`
          : answer.answerText;

      points.push({ text, questionIds: [answer.questionId] });
    }

    return { section: section.id, title: section.title, points };
  }).filter((section) => section.points.length > 0);

  const dispositionCount = (target: Disposition) =>
    answers.filter((answer) => answer.disposition === target).length;

  const line = [
    `${dispositionCount("answered")} answered`,
    `${dispositionCount("unknown")} uncertain`,
    `${dispositionCount("declined")} declined`,
    `${dispositionCount("unresolved")} unanswered`,
    `${dispositionCount("held_for_review")} held for review`,
  ].join(" · ");

  return {
    generatedAt: new Date().toISOString(),
    line,
    sections,
    flags: [],
  };
}

export function buildCaseDraft(input: {
  lead: LeadDetails;
  answers: Answers;
  consents: CaseDraft["consents"];
  acknowledgements: CaseDraft["acknowledgements"];
  startedAt: string;
}): CaseDraft {
  return {
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    startedAt: input.startedAt,
    completedAt: new Date().toISOString(),
    lead: input.lead,
    answers: toSubmittedAnswers(input.answers),
    consents: input.consents,
    acknowledgements: input.acknowledgements,
    flags: buildFlags(input.answers),
    crisisDisclosure: crisisDisclosed(input.answers),
    relationship: "self",
  };
}

/** Section a question belongs to, for headings. */
export function sectionTitle(section: SectionId): string {
  return SECTION_BY_ID.get(section)?.title ?? section;
}
