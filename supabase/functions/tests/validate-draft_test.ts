/**
 * Server-authority regression suite.
 *
 * Every test drives the real `validateDraft` with a fictitious non-customer
 * record. The expected result is that a forged or inconsistent payload is
 * rejected before storage, or that server-owned fields overwrite the forged
 * values.
 */
import { assert, assertEquals } from "jsr:@std/assert@1.0.6";
import { SERVER_BANK } from "../_shared/bank.generated.ts";
import { validateDraft } from "../_shared/case.ts";
import {
  buildAnswers,
  buildConsents,
  buildValidDraft,
  TEST_CONSENT,
  TEST_VERSION,
} from "./fixtures.ts";

function rejected(body: unknown): string {
  const result = validateDraft(body);
  if (result.ok) throw new Error("Expected the draft to be rejected");
  return result.reason;
}

function accepted(body: unknown) {
  const result = validateDraft(body);
  if (!result.ok) throw new Error(`Expected acceptance, got: ${result.reason}`);
  return result.draft;
}

Deno.test("accepts a complete canonical draft and rebuilds source rows", () => {
  const draft = accepted(buildValidDraft());

  assertEquals(draft.questionnaireVersion, TEST_VERSION);
  assertEquals(draft.answers.length, SERVER_BANK.length);
  assertEquals(draft.lead.state, "TX");
  assertEquals(draft.adultAttested, true);
});

Deno.test("rejects a held HIV row presented as answered", () => {
  const body = buildValidDraft({
    answers: buildAnswers({
      "MED-11": { disposition: "answered", answerState: "yes", answerText: "Yes" },
    }),
  });

  assertEquals(rejected(body), "A held question cannot be answered");
});

Deno.test("rejects an invented question id", () => {
  const answers = buildAnswers();
  answers[0] = { ...answers[0], questionId: "INVENTED-99" };

  assertEquals(rejected(buildValidDraft({ answers })), "Unknown question");
});

Deno.test("rejects a zero-answer payload", () => {
  assertEquals(rejected(buildValidDraft({ answers: [] })), "The submission is incomplete");
});

Deno.test("ignores client-invented source wording and restores the canonical row", () => {
  const draft = accepted(
    buildValidDraft({
      answers: buildAnswers({
        "MED-01": {
          sourceText: "Invented source wording",
          timeframe: "Past 99 years",
          customerText: "Invented customer wording",
        },
      }),
    }),
  );

  const row = draft.answers.find((answer) => answer.questionId === "MED-01");
  const canonical = SERVER_BANK.find((question) => question.id === "MED-01");
  assert(row && canonical);
  assertEquals(row.sourceText, canonical.sourceText);
  assertEquals(row.customerText, canonical.customerText);
  assertEquals(row.timeframe, canonical.timeframe ?? undefined);
});

Deno.test("rejects marketing consent when the server has no enabled channel", () => {
  const consents = [
    ...buildConsents(),
    {
      id: "marketing_call",
      label: "Marketing calls",
      granted: true,
      grantedAt: new Date(Date.now() - 30_000).toISOString(),
      textVersion: TEST_CONSENT.consentVersion,
      text: "Invented marketing disclosure",
      numberAuthorized: "+15125550134",
    },
  ];

  assertEquals(
    rejected(buildValidDraft({ consents })),
    "Marketing consent is not enabled for this deployment",
  );
});

Deno.test("rejects a privacy record with the wrong notice version", () => {
  const consents = buildConsents().map((record) =>
    record.id === "privacy_acknowledgement" ? { ...record, textVersion: "1999-01-a" } : record,
  );

  assertEquals(
    rejected(buildValidDraft({ consents })),
    "Consent evidence does not match the displayed wording",
  );
});

Deno.test("rejects duplicate consent records", () => {
  const privacy = buildConsents().find(
    (record) => record.id === "privacy_acknowledgement",
  );
  const consents = [...buildConsents(), privacy];

  assertEquals(rejected(buildValidDraft({ consents })), "Duplicate consent record");
});

Deno.test("rejects a consent timestamp after the submission", () => {
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const consents = buildConsents().map((record) => ({ ...record, grantedAt: future }));

  assertEquals(
    rejected(buildValidDraft({ consents })),
    "Consent timestamp is inconsistent with the submission",
  );
});

Deno.test("rejects a stale submission acknowledgement", () => {
  const acknowledgements = [
    {
      id: "submission_requested",
      text: TEST_CONSENT.submissionAcknowledgementText,
      textVersion: TEST_CONSENT.consentVersion,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  assertEquals(
    rejected(buildValidDraft({ acknowledgements })),
    "Submission acknowledgement is not current",
  );
});

Deno.test("derives crisis disclosure and an urgent flag from MH-05 yes", () => {
  const draft = accepted(
    buildValidDraft({
      answers: buildAnswers({
        "MH-05": { disposition: "answered", answerState: "yes", answerText: "Yes" },
      }),
      crisisDisclosure: false,
      flags: [],
    }),
  );

  assertEquals(draft.crisisDisclosure, true);
  const urgent = draft.flags.find((flag) => flag.id === "crisis-disclosure");
  assert(urgent);
  assertEquals(urgent.severity, "urgent");
});

Deno.test("rejects a 17-year-old applicant", () => {
  const body = buildValidDraft({
    lead: {
      firstName: "Test",
      lastName: "Minor",
      state: "TX",
      email: "test-case@example.com",
      preferredContact: "email",
      dateOfBirth: "2010-01-01",
    },
  });

  assertEquals(
    rejected(body),
    "This interview is only available to adults aged 18 or over",
  );
});

Deno.test("rejects a non-US or invented state code", () => {
  const body = buildValidDraft({
    lead: {
      firstName: "Test",
      lastName: "Non-customer",
      state: "ZZ",
      email: "test-case@example.com",
      preferredContact: "email",
      dateOfBirth: "1980-01-01",
    },
  });

  assertEquals(rejected(body), "State of residence is not supported");
});

Deno.test("rejects fields attached to a branch-closed row", () => {
  const body = buildValidDraft({
    answers: buildAnswers({
      "MH-01": { disposition: "answered", answerState: "no", answerText: "No" },
      "MH-02": {
        disposition: "not_asked",
        answerText: "Not asked — branch not applicable",
        fields: [{ id: "condition", label: "Main condition", value: "Withdrawn detail" }],
      },
    }),
  });

  assertEquals(
    rejected(body),
    "A branch-closed question cannot carry answer content",
  );
});

Deno.test("rejects a non-self relationship even when the flag says self", () => {
  const body = buildValidDraft({ relationship: "other", adultAttested: true });

  assertEquals(
    rejected(body),
    "This interview only accepts an adult answering for themselves. Ask us about the separate authority process.",
  );
});

Deno.test("rejects phone and text contact preferences without a phone number", () => {
  for (const preferredContact of ["phone", "text"] as const) {
    const body = buildValidDraft({
      lead: {
        firstName: "Test",
        lastName: "Non-customer",
        state: "TX",
        email: "test-case@example.com",
        preferredContact,
        dateOfBirth: "1980-01-01",
      },
    });

    assertEquals(
      rejected(body),
      "A telephone number is required for the contact method you chose",
    );
  }
});

Deno.test("rejects a junk or unusable supplied phone number", () => {
  for (const phone of ["abc", "512", "+44 20 7946 0958", "25125550134"]) {
    const body = buildValidDraft({
      lead: {
        firstName: "Test",
        lastName: "Non-customer",
        state: "TX",
        email: "test-case@example.com",
        preferredContact: "phone",
        dateOfBirth: "1980-01-01",
        phone,
      },
    });

    assertEquals(rejected(body), "Enter a valid telephone number");
  }
});

Deno.test("normalises a valid ten-digit phone number", () => {
  const draft = accepted(
    buildValidDraft({
      lead: {
        firstName: "Test",
        lastName: "Non-customer",
        state: "TX",
        email: "test-case@example.com",
        preferredContact: "phone",
        dateOfBirth: "1980-01-01",
        phone: "(512) 555-0134",
      },
    }),
  );

  assertEquals(draft.lead.phone, "+15125550134");
});

Deno.test("rejects a forged questionnaire version", () => {
  assertEquals(
    rejected(buildValidDraft({ questionnaireVersion: "2026.10-draft.1" })),
    "Questionnaire version is not approved",
  );
});

Deno.test("rejects prose that does not match the chosen option", () => {
  const body = buildValidDraft({
    answers: buildAnswers({
      "RES-01": {
        disposition: "answered",
        answerText: "U.S. citizen",
        answerValues: ["permanent"],
      },
    }),
  });

  assertEquals(rejected(body), "The answer does not match the selected option");
});

Deno.test("rejects an invented single-choice label", () => {
  const body = buildValidDraft({
    answers: buildAnswers({
      "RES-01": {
        disposition: "answered",
        answerText: "Invented status",
      },
    }),
  });

  assertEquals(rejected(body), "The answer is not a valid option");
});

Deno.test("rejects a date of birth answer that contradicts the lead form", () => {
  const body = buildValidDraft({
    answers: buildAnswers({
      "ID-01": { disposition: "answered", answerText: "1979-12-31" },
    }),
  });

  assertEquals(
    rejected(body),
    "The date of birth answer does not match the contact details",
  );
});

Deno.test("rejects a state answer that contradicts the lead form", () => {
  const body = buildValidDraft({
    answers: buildAnswers({
      "ID-03": { disposition: "answered", answerText: "CA" },
    }),
  });

  assertEquals(
    rejected(body),
    "The state answer does not match the contact details",
  );
});

Deno.test("accepts a state answer written as the full state name", () => {
  const draft = accepted(
    buildValidDraft({
      answers: buildAnswers({
        "ID-03": { disposition: "answered", answerText: "Texas" },
      }),
    }),
  );

  const row = draft.answers.find((answer) => answer.questionId === "ID-03");
  assertEquals(row?.answerText, "Texas");
});

Deno.test("an unanswered identity row is not cross-checked", () => {
  const draft = accepted(
    buildValidDraft({
      answers: buildAnswers({
        "ID-03": {
          disposition: "unresolved",
          answerText: "Not answered",
        },
      }),
    }),
  );

  const row = draft.answers.find((answer) => answer.questionId === "ID-03");
  assertEquals(row?.disposition, "unresolved");
});

Deno.test("rejects an acknowledgement that predates the consents it relies on", () => {
  const body = buildValidDraft({
    acknowledgements: [
      {
        id: "submission_requested",
        text: TEST_CONSENT.submissionAcknowledgementText,
        textVersion: TEST_CONSENT.consentVersion,
        timestamp: new Date(Date.now() - 20 * 60_000 - 5_000).toISOString(),
      },
    ],
  });

  assertEquals(
    rejected(body),
    "The submission acknowledgement predates the permissions it relies on",
  );
});

Deno.test("flags a yes answer that carries no supplemental detail", () => {
  const draft = accepted(
    buildValidDraft({
      answers: buildAnswers({
        "MED-01": {
          disposition: "answered",
          answerState: "yes",
          answerText: "Yes",
        },
      }),
    }),
  );

  const flag = draft.flags.find((entry) => entry.id === "supplemental-detail-missing");
  assert(flag, "expected a supplemental-detail-missing flag");
  assert(flag.detail.includes("MED-01"));
});

Deno.test("flags a shorter-window yes that the longer window denies", () => {
  const draft = accepted(
    buildValidDraft({
      answers: buildAnswers({
        "NIC-01": {
          disposition: "answered",
          answerState: "yes",
          answerText: "Yes",
        },
        "NIC-02": {
          disposition: "answered",
          answerState: "no",
          answerText: "No",
        },
      }),
    }),
  );

  const flag = draft.flags.find((entry) => entry.id === "timeframe-contradiction");
  assert(flag, "expected a timeframe-contradiction flag");
  assert(flag.detail.includes("NIC-01 vs NIC-02"));
});

Deno.test("does not flag consistent short and long windows", () => {
  const draft = accepted(
    buildValidDraft({
      answers: buildAnswers({
        "NIC-01": {
          disposition: "answered",
          answerState: "yes",
          answerText: "Yes",
        },
        "NIC-02": {
          disposition: "answered",
          answerState: "yes",
          answerText: "Yes",
        },
        "NIC-03": {
          disposition: "answered",
          answerState: "yes",
          answerText: "Yes",
        },
      }),
    }),
  );

  assertEquals(
    draft.flags.some((entry) => entry.id === "timeframe-contradiction"),
    false,
  );
});
