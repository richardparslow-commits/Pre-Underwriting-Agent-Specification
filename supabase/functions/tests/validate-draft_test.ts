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
import { connectionRateKey, validateDraft } from "../_shared/case.ts";
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

function boundaryDraft(completedAt: string, dateOfBirth: string) {
  const startedAt = new Date(Date.parse(completedAt) - 30 * 60_000).toISOString();
  const consents = buildConsents().map((record) => ({ ...record, grantedAt: startedAt }));
  return buildValidDraft({
    startedAt,
    completedAt,
    lead: {
      firstName: "Test",
      lastName: "Boundary",
      state: "TX",
      email: "boundary@example.com",
      preferredContact: "email",
      dateOfBirth,
    },
    consents,
    acknowledgements: [
      {
        id: "submission_requested",
        text: TEST_CONSENT.submissionAcknowledgementText,
        textVersion: TEST_CONSENT.consentVersion,
        timestamp: startedAt,
      },
    ],
    answers: buildAnswers({
      "ID-01": { disposition: "answered", answerText: dateOfBirth },
    }),
  });
}

Deno.test("accepts a complete canonical draft and rebuilds source rows", () => {
  const draft = accepted(buildValidDraft());

  assertEquals(draft.questionnaireVersion, TEST_VERSION);
  assertEquals(draft.answers.length, SERVER_BANK.length);
  assertEquals(draft.lead.state, "TX");
  assertEquals(draft.adultAttested, true);
});

Deno.test("keeps private client metadata out of the canonical submission", () => {
  const body = buildValidDraft();
  assert(typeof body.lead === "object" && body.lead !== null);
  const draft = accepted({
    ...body,
    _agent_scratchpad: "scratchpad-only-marker",
    lead: { ...body.lead, _raw_ssn_unmasked: "private-identifier-marker" },
    answers: buildAnswers({
      "MED-01": {
        _tentative_underwriting_class: "tentative-class-marker",
        _unverified_rx_prefill: ["unverified-medication-marker"],
      },
    }),
  });

  const serialized = JSON.stringify(draft);
  for (const marker of [
    "scratchpad-only-marker",
    "private-identifier-marker",
    "tentative-class-marker",
    "unverified-medication-marker",
  ]) {
    assert(!serialized.includes(marker), `Private client field survived validation: ${marker}`);
  }
  assertEquals(draft.lead.state, "TX");
  assertEquals(draft.answers.length, SERVER_BANK.length);
});

Deno.test("caps compound answer fields at the 500-character form limit", () => {
  const question = SERVER_BANK.find((entry) => entry.id === "OCC-01");
  assert(question);
  const fields = question.fields.map((field) => ({
    id: field.id,
    label: field.label,
    value: field.kind === "number" ? "40" : "x".repeat(500),
  }));

  const draft = accepted(
    buildValidDraft({
      answers: buildAnswers({
        [question.id]: {
          disposition: "answered",
          answerText: "Details provided",
          fields,
        },
      }),
    }),
  );
  const answer = draft.answers.find((entry) => entry.questionId === question.id);
  assert(answer);
  assertEquals(answer.fields?.find((field) => field.id === "jobTitle")?.value.length, 500);
  assertEquals(answer.fields?.find((field) => field.id === "duties")?.value.length, 500);

  const tooLong = fields.map((field) =>
    field.id === "jobTitle" ? { ...field, value: "x".repeat(501) } : field,
  );
  assertEquals(
    rejected(
      buildValidDraft({
        answers: buildAnswers({
          [question.id]: {
            disposition: "answered",
            answerText: "Details provided",
            fields: tooLong,
          },
        }),
      }),
    ),
    "Invalid answer detail",
  );
});

Deno.test("a compound answer's prose is rebuilt, not trusted from the caller", () => {
  // Unbranched so the row is applicable in the default fixture.
  const compound = SERVER_BANK.find(
    (question) => question.compound && question.fields.length > 0 && !question.askWhen,
  );
  assert(compound);
  const field = compound.fields[0]!;

  const draft = accepted(
    buildValidDraft({
      answers: buildAnswers({
        [compound.id]: {
          disposition: "answered",
          // A crafted body could put a different claim beside the fields the
          // reviewer reads. The server must ignore this prose.
          answerText: "I have never had this condition",
          fields: [{ id: field.id, label: field.label, value: "Test detail" }],
        },
      }),
    }),
  );

  const answer = draft.answers.find((entry) => entry.questionId === compound.id);
  assertEquals(answer?.answerText, "Details provided");
  assertEquals(answer?.fields?.[0]?.value, "Test detail");
});

Deno.test("rate-limit identity uses a verified connection peer or a shared fallback", () => {
  assertEquals(connectionRateKey({ remoteAddr: { transport: "tcp", hostname: "203.0.113.9" } }), "peer:203.0.113.9");
  assertEquals(connectionRateKey(), "shared:unverified-peer");
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

Deno.test("rejects a 17-year-old before their local 18th birthday", () => {
  // 22:30 on January 1 in Texas, while UTC has already reached January 2.
  const body = boundaryDraft("2026-01-02T04:30:00.000Z", "2008-01-02");

  assertEquals(
    rejected(body),
    "This interview is only available to adults aged 18 or over",
  );
});

Deno.test("accepts an 18-year-old once their local birthday begins", () => {
  // 01:30 on January 2 in Chicago and 00:30 in Denver: both Texas zones
  // have crossed the local birthday boundary.
  const body = boundaryDraft("2026-01-02T07:30:00.000Z", "2008-01-02");

  assert(accepted(body));
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

Deno.test("accepts unanswered single-choice rows and rebuilds their summaries", () => {
  for (const [disposition, answerState, answerText] of [
    ["unresolved", undefined, "Not answered"],
    ["unknown", "unknown", "I'm not sure"],
    ["declined", "declined", "Prefer not to answer"],
  ] as const) {
    const draft = accepted(buildValidDraft({
      answers: buildAnswers({
        "RES-01": { disposition, answerState, answerText, answerValues: undefined },
      }),
    }));
    const row = draft.answers.find((answer) => answer.questionId === "RES-01");
    assertEquals(row?.disposition, disposition);
    assertEquals(row?.answerState, answerState);
    assertEquals(row?.answerValues, undefined);
    assertEquals(row?.answerText, answerText);
  }
});

Deno.test("rejects a residency option attached to an unresolved row", () => {
  const body = buildValidDraft({
    answers: buildAnswers({
      "RES-01": {
        disposition: "unresolved",
        answerText: "Not answered",
        answerValues: ["permanent"],
      },
    }),
  });

  assertEquals(rejected(body), "An unresolved answer cannot carry answer content");
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

for (const [event, expected] of [
  ["Convicted of DUI or DWI", false],
  ["Licence suspended or revoked", true],
  ["Both", true],
  [null, false],
] as const) {
  Deno.test(`driving contradiction checks the reported event: ${event ?? "unspecified"}`, () => {
    const draft = accepted(buildValidDraft({
      answers: buildAnswers({
        "DRV-01": {
          disposition: "answered",
          answerState: "yes",
          answerText: "Yes",
          details: event ? [{ label: "What happened?", value: event }] : [],
        },
        "DRV-02": {
          disposition: "answered",
          answerState: "no",
          answerText: "No",
        },
      }),
    }));

    assertEquals(
      draft.flags.some(flag => flag.id === "timeframe-contradiction"),
      expected,
    );
  });
}
