import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { LeadForm } from "./LeadForm";
import { QuestionCard } from "./QuestionCard";
import { ReviewScreen } from "./ReviewScreen";
import { QUESTION_BANK } from "@/features/interview/questionBank";

const consent = {
  intakePermission: true,
  privacyAcknowledged: true,
  marketingCall: false,
  marketingText: false,
  timestamps: {},
};
const lead = {
  firstName: "Test",
  lastName: "Case",
  state: "TX",
  email: "test@example.com",
  dateOfBirth: "1980-01-01",
  adultAttested: true,
  preferredContact: "phone" as const,
  phone: "5125550134",
  preferredContactTime: "x".repeat(120),
  coverageAmount: "x".repeat(60),
};
const noop = () => {};

test("review displays an already-saved conflict without claiming nothing was sent", () => {
  const message =
    "Case LPP-2026-ABC123 was already saved. Your changes were not saved.";
  const html = renderToStaticMarkup(
    <StaticRouter location="/start">
      <ReviewScreen
        lead={lead}
        consent={consent}
        answers={{}}
        acknowledged={true}
        submitting={false}
        error={message}
        crisis={false}
        onEditQuestion={noop}
        onEditLead={noop}
        onToggleAck={noop}
        onSubmit={noop}
        onBack={noop}
      />
    </StaticRouter>,
  );
  assert.match(html, /Submission needs attention/);
  assert.ok(html.includes(message));
  assert.doesNotMatch(html, /Nothing was sent/);
});

test("compound answer fields stop at the server's 500-character cap", () => {
  const question = QUESTION_BANK.find((entry) => entry.id === "OCC-01");
  assert.ok(question);
  const html = renderToStaticMarkup(
    <QuestionCard
      question={question}
      answer={{
        fields: {
          jobTitle: "j".repeat(500),
          duties: "d".repeat(500),
        },
        updatedAt: "2026-11-07T00:00:00.000Z",
      }}
      position={1}
      total={1}
      isLast={false}
      onChange={noop}
      onBack={noop}
      onNext={noop}
    />,
  );

  for (const field of ["jobTitle", "duties"] as const) {
    const control = html.match(
      new RegExp(`<(?:input|textarea)[^>]*id="OCC-01-${field}"[^>]*>`),
    )?.[0];
    assert.ok(control, field);
    assert.match(control, /maxLength="500"/);
  }
  assert.ok(html.includes("j".repeat(500)));
  assert.ok(html.includes("d".repeat(500)));
});

test("contact and coverage controls expose matching limits without truncating valid boundary values", () => {
  const html = renderToStaticMarkup(
    <StaticRouter location="/start">
      <LeadForm
        lead={lead}
        consent={consent}
        onField={noop}
        onAdultAttested={noop}
        onConsent={noop}
        onContinue={noop}
      />
    </StaticRouter>,
  );
  for (
    const [field, limit] of [
      ["firstName", 100],
      ["lastName", 100],
      ["email", 254],
      ["preferredContactTime", 120],
      ["coverageAmount", 60],
    ] as const
  ) {
    const input = html.match(new RegExp(`<input[^>]*name="${field}"[^>]*>`))
      ?.[0];
    assert.ok(input, field);
    assert.match(input, new RegExp(`maxLength="${limit}"`));
  }
  for (
    const [field, limit] of [["preferredContactTime", 120], [
      "coverageAmount",
      60,
    ]] as const
  ) {
    assert.ok(html.includes(`value="${"x".repeat(limit)}"`));
    assert.ok(html.includes(`aria-describedby="${field}-limit"`));
    assert.ok(html.includes(`id="${field}-limit"`));
  }
});
