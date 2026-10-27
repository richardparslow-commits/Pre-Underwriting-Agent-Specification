import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/surface";
import { FieldControl, MULTI_SEPARATOR } from "./FieldControl";
import { ANSWER_OPTIONS, type AnswerRecord, type AnswerState, type Question } from "@/features/interview/types";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  answer?: AnswerRecord;
  prefilled?: boolean;
  position: number;
  total: number;
  onChange: (patch: Partial<AnswerRecord>) => void;
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
  disableBack?: boolean;
}

export function QuestionCard({
  question,
  answer,
  prefilled,
  position,
  total,
  onChange,
  onBack,
  onNext,
  isLast,
  disableBack,
}: QuestionCardProps) {
  const showDetails = question.kind !== "yesno" || answer?.state === "yes";
  const fields = question.fields ?? [];
  const prompts = question.detailPrompts ?? [];

  function chooseState(state: AnswerState) {
    if (state === "yes") {
      onChange({ state });
      return;
    }
    // Detail collected under a previous Yes no longer applies. Keep the record
    // tidy rather than submitting orphaned answers.
    onChange({ state, fields: {}, details: {} });
  }

  return (
    <article className="space-y-7">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow">
            Question {position} of {total}
          </span>
          {question.timeframe ? <Badge tone="outline">{question.timeframe}</Badge> : null}
          {question.status === "supplemental" ? (
            <Badge tone="accent">Supplemental — not from the source questionnaire</Badge>
          ) : null}
          {question.sensitive ? <Badge tone="warn">Sensitive</Badge> : null}
          {prefilled ? <Badge tone="ok">Prefilled — please check</Badge> : null}
        </div>

        <h1 id="question-heading" className="max-w-3xl text-2xl leading-snug sm:text-[1.9rem]">
          {question.customerText}
        </h1>

        {question.helpText ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {question.helpText}
          </p>
        ) : null}

        {question.exclusions?.length ? (
          <p className="flex max-w-2xl items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>Do not include: {question.exclusions.join("; ")}.</span>
          </p>
        ) : null}
      </header>

      {question.kind === "yesno" ? (
        <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-labelledby="question-heading">
          {ANSWER_OPTIONS.map((option) => {
            const checked = answer?.state === option.value;
            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-md border px-4 py-3.5 transition-colors",
                  checked
                    ? "border-primary bg-primary/[0.04]"
                    : "border-border bg-card hover:border-input",
                )}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={checked}
                  onChange={() => chooseState(option.value)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      ) : question.compound ? null : (
        <FieldControl
          id={`${question.id}-answer`}
          kind={question.kind}
          options={question.options}
          placeholder={question.placeholder}
          value={
            question.kind === "multi_choice"
              ? (answer?.values ?? []).join(MULTI_SEPARATOR)
              : (answer?.value ?? "")
          }
          onChange={(value) => {
            if (question.kind === "multi_choice") {
              onChange({ values: value ? value.split(MULTI_SEPARATOR) : [] });
            } else {
              onChange({ value });
            }
          }}
        />
      )}

      {showDetails && fields.length > 0 ? (
        <section className="space-y-5 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-medium">A little more detail</h2>
            <Badge tone="outline">Part of this question</Badge>
          </div>
          {fields.map((field) => (
            <div key={field.id}>
              <label id={`${field.id}-label`} htmlFor={`${question.id}-${field.id}`} className="field-label">
                {field.label}
              </label>
              <div className="mt-2">
                <FieldControl
                  id={`${question.id}-${field.id}`}
                  kind={field.kind}
                  options={field.options}
                  placeholder={field.placeholder}
                  value={answer?.fields?.[field.id] ?? ""}
                  onChange={(value) =>
                    onChange({ fields: { ...(answer?.fields ?? {}), [field.id]: value } })
                  }
                  describedBy={field.hint ? `${question.id}-${field.id}-hint` : undefined}
                />
              </div>
              {field.hint ? (
                <p id={`${question.id}-${field.id}-hint`} className="field-help">
                  {field.hint}
                </p>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {showDetails && prompts.length > 0 ? (
        <section className="space-y-5 rounded-lg border border-dashed border-border bg-secondary/30 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-medium">Supplemental detail</h2>
            <Badge tone="accent">Not from the source questionnaire</Badge>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            These follow-up details help Richard understand the context. They are recorded
            separately from the source question, and they are not independently verified medical
            records. Everything here is optional.
          </p>
          {prompts.map((prompt) => (
            <div key={prompt.id}>
              <label
                id={`${prompt.id}-label`}
                htmlFor={`${question.id}-detail-${prompt.id}`}
                className="field-label"
              >
                {prompt.label}
              </label>
              <div className="mt-2">
                <FieldControl
                  id={`${question.id}-detail-${prompt.id}`}
                  kind={prompt.kind}
                  options={prompt.options}
                  placeholder={prompt.placeholder}
                  value={answer?.details?.[prompt.id] ?? ""}
                  onChange={(value) =>
                    onChange({ details: { ...(answer?.details ?? {}), [prompt.id]: value } })
                  }
                />
              </div>
              {prompt.hint ? <p className="field-help">{prompt.hint}</p> : null}
            </div>
          ))}
        </section>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="quiet" onClick={onBack} disabled={disableBack}>
          <ArrowLeft aria-hidden />
          Back
        </Button>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-right">
            Not answered is recorded as not answered — never as &ldquo;No&rdquo;.
          </p>
          <Button type="button" onClick={onNext} className="order-1 sm:order-2">
            {isLast ? "Review my answers" : "Save and continue"}
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>
    </article>
  );
}
