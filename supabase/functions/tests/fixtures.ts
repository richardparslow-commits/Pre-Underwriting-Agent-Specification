/**
 * Canonical, fictitious draft fixtures for the server validation tests.
 *
 * They are built from the same generated bank and consent policy the edge
 * function uses, so a test cannot quietly assert against stale wording.
 */
import { QUESTIONNAIRE_VERSION, SERVER_BANK } from "../_shared/bank.generated.ts";
import { CONSENT_POLICY } from "../_shared/policy.generated.ts";

type Canonical = (typeof SERVER_BANK)[number];

const COMPLETED_AT = new Date(Date.now() - 60_000).toISOString();
const STARTED_AT = new Date(Date.now() - 20 * 60_000).toISOString();

export const TEST_TIMES = { startedAt: STARTED_AT, completedAt: COMPLETED_AT };

function selected(answer: Record<string, unknown>): Set<string> {
  const values = new Set<string>();
  if (typeof answer.answerState === "string") values.add(answer.answerState);
  if (Array.isArray(answer.answerValues)) {
    for (const value of answer.answerValues) {
      if (typeof value === "string") values.add(value);
    }
  }
  return values;
}

function baseAnswer(
  question: Canonical,
  applicable: boolean,
): Record<string, unknown> {
  if (question.reviewStatus === "human_review_required") {
    return {
      questionId: question.id,
      disposition: "held_for_review",
      answerText: "Held for human review — not asked",
    };
  }

  if (!applicable) {
    return {
      questionId: question.id,
      disposition: "not_asked",
      answerText: "Not asked — branch not applicable",
    };
  }

  if (question.kind === "yesno") {
    return {
      questionId: question.id,
      disposition: "answered",
      answerState: "no",
      answerText: "No",
    };
  }

  if (question.kind === "multi_choice" || question.kind === "single_choice") {
    const option = question.options.find((candidate) => candidate.value === "none") ??
      question.options[0];
    const values = option ? [option.value] : [];
    return {
      questionId: question.id,
      disposition: "answered",
      answerValues: values,
      answerText: option?.label ?? "None",
    };
  }

  if (question.compound && question.fields.length > 0) {
    const field = question.fields[0];
    return {
      questionId: question.id,
      disposition: "answered",
      answerText: "Details provided",
      fields: [{ id: field.id, label: field.label, value: "Test detail" }],
    };
  }

  // Identity answers must agree with the lead default; tests that override the
  // lead also override the matching answer when they mean to.
  if (question.id === "ID-01") {
    return {
      questionId: question.id,
      disposition: "answered",
      answerText: "1980-01-01",
    };
  }
  if (question.id === "ID-03") {
    return {
      questionId: question.id,
      disposition: "answered",
      answerText: "TX",
    };
  }

  return {
    questionId: question.id,
    disposition: "answered",
    answerText: question.kind === "date" ? "2020-01-01" : "Test answer",
  };
}

/**
 * Builds every canonical row in bank order. A branch is answered only when its
 * parent actually opens it; closed rows are `not_asked`, exactly as the client
 * should send them.
 */
export function buildAnswers(
  overrides: Record<string, Record<string, unknown>> = {},
): Array<Record<string, unknown>> {
  const seen = new Map<string, Record<string, unknown>>();
  const answers: Array<Record<string, unknown>> = [];

  for (const question of SERVER_BANK) {
    const parent = question.askWhen ? seen.get(question.askWhen.questionId) : undefined;
    const applicable =
      !question.askWhen ||
      (parent !== undefined && question.askWhen.includes.some((value) => selected(parent).has(value)));

    const answer = {
      ...baseAnswer(question, applicable),
      ...(overrides[question.id] ?? {}),
    };
    seen.set(question.id, answer);
    answers.push(answer);
  }

  return answers;
}

export function buildConsents(
  overrides: { omit?: string; granted?: boolean } = {},
): Array<Record<string, unknown>> {
  const records = [
    {
      id: "intake_permission",
      label: "Preliminary intake and submission",
      granted: true,
      grantedAt: STARTED_AT,
      textVersion: CONSENT_POLICY.consentVersion,
      text: CONSENT_POLICY.intakePermissionText,
    },
    {
      id: "privacy_acknowledgement",
      label: "Privacy practices acknowledgement",
      granted: true,
      grantedAt: STARTED_AT,
      textVersion: CONSENT_POLICY.privacyVersion,
      text: CONSENT_POLICY.privacyAcknowledgementText,
    },
  ];

  return records
    .filter((record) => record.id !== overrides.omit)
    .map((record) =>
      record.id === overrides.omit || overrides.granted === undefined
        ? record
        : { ...record, granted: overrides.granted, grantedAt: overrides.granted ? STARTED_AT : null },
    );
}

export function buildValidDraft(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    startedAt: STARTED_AT,
    completedAt: COMPLETED_AT,
    lead: {
      firstName: "Test",
      lastName: "Non-customer",
      state: "TX",
      email: "test-case@example.com",
      preferredContact: "email",
      dateOfBirth: "1980-01-01",
    },
    adultAttested: true,
    relationship: "self",
    consents: buildConsents(),
    acknowledgements: [
      {
        id: "submission_requested",
        text: CONSENT_POLICY.submissionAcknowledgementText,
        textVersion: CONSENT_POLICY.consentVersion,
        timestamp: STARTED_AT,
      },
    ],
    answers: buildAnswers(),
    flags: [],
    crisisDisclosure: false,
    ...overrides,
  };
}

export const TEST_VERSION = QUESTIONNAIRE_VERSION;
export const TEST_CONSENT = CONSENT_POLICY;
