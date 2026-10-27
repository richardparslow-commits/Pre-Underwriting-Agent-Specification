import { useEffect, useState } from "react";
import { useInterview } from "@/features/interview/useInterview";
import { QUESTION_BY_ID } from "@/features/interview/questionBank";
import { LeadForm } from "@/features/intake/LeadForm";
import { PermissionStep } from "@/features/intake/PermissionStep";
import { InterviewScreen } from "@/features/intake/InterviewScreen";
import { ReviewScreen } from "@/features/intake/ReviewScreen";
import { ConfirmationScreen } from "@/features/intake/ConfirmationScreen";
import { submitCase } from "@/lib/api";

export default function IntakePage() {
  const interview = useInterview();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [interview.step]);

  const current = interview.currentQuestionId
    ? QUESTION_BY_ID[interview.currentQuestionId]
    : undefined;

  async function handleSubmit() {
    if (!interview.draft) {
      setError("Please confirm that you have reviewed your answers first.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const receipt = await submitCase(interview.draft);
      interview.markSubmitted(receipt);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The case could not be submitted. Nothing was sent.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-10 sm:py-14">
      <div className={interview.step === "interview" ? "" : "mx-auto max-w-3xl"}>
        {interview.step === "lead" ? (
          <LeadForm
            lead={interview.lead}
            consent={interview.consent}
            onField={interview.setLeadField}
            onConsent={interview.setConsent}
            onContinue={interview.begin}
          />
        ) : null}

        {interview.step === "permission" ? (
          <PermissionStep
            phone={interview.lead.phone}
            granted={interview.consent.intakePermission}
            onGrant={(value) => interview.setConsent("intakePermission", value)}
            onBack={interview.backToLead}
            onContinue={interview.givePermission}
          />
        ) : null}

        {interview.step === "interview" && current ? (
          <InterviewScreen
            answers={interview.answers}
            current={current}
            crisis={interview.crisis}
            prefilled={interview.prefilledIds.includes(current.id)}
            onAnswer={interview.setAnswer}
            onBack={interview.previousQuestion}
            onNext={interview.nextQuestion}
            onReview={interview.finishInterview}
          />
        ) : null}

        {interview.step === "interview" && !current ? (
          <div className="space-y-4">
            <h1 className="text-2xl">There are no questions to show</h1>
            <p className="prose-note">
              This is unexpected. Return to your details and start again.
            </p>
            <button type="button" className="link-quiet" onClick={interview.startOver}>
              Start again
            </button>
          </div>
        ) : null}

        {interview.step === "review" ? (
          <div className="mx-auto max-w-4xl">
            <ReviewScreen
              answers={interview.answers}
              lead={interview.lead}
              consent={interview.consent}
              acknowledged={interview.acknowledgements.length > 0}
              submitting={submitting}
              error={error}
              crisis={interview.crisis}
              onEditQuestion={interview.goToQuestion}
              onEditLead={interview.backToLead}
              onToggleAck={interview.confirmReview}
              onSubmit={handleSubmit}
              onBack={() => interview.goToQuestion(interview.currentQuestionId ?? "")}
            />
          </div>
        ) : null}

        {interview.step === "submitted" && interview.receipt ? (
          <div className="mx-auto max-w-4xl">
            <ConfirmationScreen receipt={interview.receipt} onStartOver={interview.startOver} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
