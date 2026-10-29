import { AlertTriangle, ArrowLeft, Check, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Badge, Checkbox } from "@/components/ui/surface";
import { MARKETING, MARKETING_ENABLED, SITE } from "@/config/site";
import {
  answerTextFor,
  detailEntries,
  dispositionFor,
  fieldEntries,
  visibleQuestions,
} from "@/features/interview/engine";
import { QUESTION_BANK } from "@/features/interview/questionBank";
import { SECTIONS } from "@/features/interview/sections";
import { SUBMISSION_ACKNOWLEDGEMENT_TEXT } from "@/features/consent/consentTexts";
import type { ConsentSelection } from "@/features/consent/consentTexts";
import type { Answers, Disposition, LeadDetails } from "@/features/interview/types";
import { stateName } from "./usStates";
import { CrisisPanel } from "./CrisisPanel";
import { cn } from "@/lib/utils";

interface ReviewScreenProps {
  answers: Answers;
  lead: Partial<LeadDetails>;
  consent: ConsentSelection & { timestamps: Record<string, string | undefined> };
  acknowledged: boolean;
  submitting: boolean;
  error: string | null;
  crisis: boolean;
  onEditQuestion: (questionId: string) => void;
  onEditLead: () => void;
  onToggleAck: (checked: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const DISPOSITION_BADGE: Record<Disposition, { label: string; tone: "ok" | "warn" | "danger" | "neutral" | "outline" }> = {
  answered: { label: "Answered", tone: "ok" },
  unknown: { label: "Uncertain", tone: "warn" },
  declined: { label: "Declined", tone: "neutral" },
  not_applicable: { label: "Not applicable", tone: "outline" },
  unresolved: { label: "Not answered", tone: "warn" },
  held_for_review: { label: "Held for review", tone: "outline" },
  not_asked: { label: "Not asked", tone: "outline" },
};

export function ReviewScreen({
  answers,
  lead,
  consent,
  acknowledged,
  submitting,
  error,
  crisis,
  onEditQuestion,
  onEditLead,
  onToggleAck,
  onSubmit,
  onBack,
}: ReviewScreenProps) {
  const visible = visibleQuestions(answers);
  const pending = visible.filter(
    (question) => dispositionFor(question, answers[question.id], answers) === "unresolved",
  );
  const held = QUESTION_BANK.filter((question) => question.reviewStatus === "human_review_required");
  const marketingGiven = consent.marketingCall || consent.marketingText;
  const marketingWithdrawal = [
    MARKETING.texts ? "replying STOP" : null,
    "using the marketing opt-out page",
    "emailing us",
  ]
    .filter(Boolean)
    .join(" or ");

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="eyebrow">Step 4 of 4 · Review and submit</p>
        <h1 className="text-3xl leading-tight sm:text-4xl">Check your answers</h1>
        <p className="prose-note max-w-2xl">
          This is exactly what will be sent to {SITE.owner}. Corrections are welcome — change
          anything that is not right. Nothing is sent until you use the submit button at the bottom
          of this page.
        </p>
      </header>

      {crisis ? <CrisisPanel /> : null}

      <section className="panel grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <p className="eyebrow">Contact details</p>
          <p className="mt-1.5 text-sm">
            {lead.firstName} {lead.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{lead.email}</p>
          <p className="text-sm text-muted-foreground">
            {stateName(lead.state ?? "")} · prefers {lead.preferredContact}
            {lead.phone ? ` · ${lead.phone}` : ""}
          </p>
        </div>
        <div className="sm:text-right">
          <Button type="button" variant="outline" size="sm" onClick={onEditLead}>
            <Pencil aria-hidden />
            Edit contact details
          </Button>
        </div>

        <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4">
          <div className="rounded-md border border-border bg-secondary/40 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Coverage details (optional)
            </p>
            <p className="mt-1 text-sm">
              {[lead.coverageAmount, lead.coveragePurpose, lead.termPreference]
                .filter(Boolean)
                .join(" · ") || "Not provided"}
            </p>
          </div>
          <div className="mt-3 rounded-md border border-border bg-secondary/40 px-4 py-3 sm:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Contact permissions
            </p>
            <p className="mt-1 text-sm">
              {!MARKETING_ENABLED
                ? "Not offered in this version"
                : marketingGiven
                  ? [
                      consent.marketingCall ? "Marketing calls" : null,
                      consent.marketingText ? "Marketing texts" : null,
                    ]
                      .filter(Boolean)
                      .join(" and ")
                  : "No marketing permission given"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {!MARKETING_ENABLED
                ? "Your questionnaire is submitted without marketing consent. This does not affect your review."
                : marketingGiven
                  ? `You can withdraw this at any time by ${marketingWithdrawal}.`
                  : "Your questionnaire is submitted without marketing consent. This does not affect your review."}
            </p>
          </div>
        </div>
      </section>

      {pending.length === 0 ? (
        <Alert tone="ok" title="All applicable questions answered">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" aria-hidden />
            {visible.length} questions answered, marked uncertain, or declined. You can still go
            back and change anything.
          </span>
        </Alert>
      ) : (
        <Alert tone="warn" title={`${pending.length} unanswered question${pending.length === 1 ? "" : "s"}`}>
          <p>
            You can submit now and these will be recorded as unanswered — never as &ldquo;No&rdquo;.
            Or answer them first. {SITE.owner} may follow up on anything left open.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pending.slice(0, 6).map((question) => (
              <Button
                key={question.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditQuestion(question.id)}
              >
                {question.id}: {question.customerText.slice(0, 46)}
                {question.customerText.length > 46 ? "…" : ""}
              </Button>
            ))}
          </div>
        </Alert>
      )}

      <div className="space-y-6">
        {SECTIONS.map((section) => {
          const questions = visible.filter((question) => question.section === section.id);
          if (questions.length === 0) return null;

          return (
            <section key={section.id} className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-3">
                <h2 className="text-base font-medium">{section.title}</h2>
                <span className="text-xs text-muted-foreground">{questions.length} questions</span>
              </div>
              <ul className="divide-y divide-border">
                {questions.map((question) => {
                  const answer = answers[question.id];
                  const disposition = dispositionFor(question, answer, answers);
                  const badge = DISPOSITION_BADGE[disposition];
                  const fields = fieldEntries(question, answer);
                  const details = detailEntries(question, answer);
                  const needsAttention = disposition === "unresolved";

                  return (
                    <li
                      key={question.id}
                      className={cn("px-5 py-4", needsAttention && "bg-warn/[0.04]")}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[0.7rem] font-semibold tracking-[0.08em] text-muted-foreground">
                              {question.id}
                            </span>
                            {question.timeframe ? (
                              <span className="text-[0.7rem] text-muted-foreground">
                                {question.timeframe}
                              </span>
                            ) : null}
                            <Badge tone={badge.tone}>{badge.label}</Badge>
                          </div>
                          <p className="mt-1.5 text-sm font-medium">{question.customerText}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {disposition === "unresolved"
                              ? "No answer recorded"
                              : disposition === "declined"
                                ? "You chose not to answer"
                                : answerTextFor(question, answer)}
                          </p>

                          {fields.length > 0 ? (
                            <dl className="mt-2 space-y-1">
                              {fields.map((field) => (
                                <div key={field.id} className="flex gap-2 text-xs">
                                  <dt className="shrink-0 text-muted-foreground">{field.label}:</dt>
                                  <dd className="text-foreground">{field.value}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : null}

                          {details.length > 0 ? (
                            <dl className="mt-2 space-y-1 rounded-md bg-secondary/50 px-3 py-2">
                              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                                Supplemental detail
                              </p>
                              {details.map((detail) => (
                                <div key={detail.label} className="flex gap-2 text-xs">
                                  <dt className="shrink-0 text-muted-foreground">{detail.label}:</dt>
                                  <dd className="text-foreground">{detail.value}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : null}
                        </div>

                        <Button
                          type="button"
                          variant={needsAttention ? "outline" : "ghost"}
                          size="sm"
                          onClick={() => onEditQuestion(question.id)}
                        >
                          <Pencil aria-hidden />
                          {needsAttention ? "Answer" : "Change"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="panel p-5">
        <h2 className="text-base font-medium">Questions held for human review</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {held.length} source topics are not asked in this automated interview because they need
          legal and underwriting approval first. Their wording is kept in the internal coverage
          record, not shown to customers. If one applies to you, {SITE.owner} will discuss it with
          you directly.
        </p>
      </section>

      <section className="panel space-y-4 p-5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <h2 className="text-base font-medium">Before you submit</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              A submitted case is an immutable record. If you need to correct it afterwards, contact{" "}
              {SITE.owner} with your case reference. The correction is added to your case record as a
              separate note and the submitted answers stay exactly as they are.
            </p>
          </div>
        </div>

        <label className="flex gap-3 border-t border-border pt-4 text-sm leading-relaxed">
          <Checkbox
            checked={acknowledged}
            onChange={(event) => onToggleAck(event.target.checked)}
            disabled={submitting}
          />
          <span>{SUBMISSION_ACKNOWLEDGEMENT_TEXT}</span>
        </label>

        {error ? (
          <Alert tone="danger" title="Submission needs attention">
            {error}
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="quiet" onClick={onBack} disabled={submitting}>
            <ArrowLeft aria-hidden />
            Back to the questions
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={onSubmit}
            disabled={!acknowledged || submitting}
          >
            {submitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {submitting ? "Submitting securely…" : "Submit for Richard's Review"}
          </Button>
        </div>
        {!acknowledged ? (
          <p className="text-xs text-muted-foreground">
            Tick the confirmation above to enable submission.
          </p>
        ) : null}
      </section>
    </div>
  );
}
